import {
    MealSchema,
    type MealNutrition,
} from "@/lib/nutrition";

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MODEL =
    "google/gemma-4-26b-a4b-it:free";

const DEFAULT_CONVERSATION_MODEL =
    "google/gemma-4-26b-a4b-it:free";

const FALLBACK_MODEL =
    "openai/gpt-4o-mini";

const BILINGUAL_MEAL_GUIDANCE =
    "The user may write in English, Persian, or a mix of both. Understand both languages. Keep the returned JSON in English.";

const SYSTEM_PROMPT = `
You are the nutrition estimation engine for a calorie tracking application.

The user describes food they consumed.

Estimate the nutrition for the ENTIRE meal.

Return valid JSON only.

You MUST return exactly this structure:

{
    "title": "short readable meal title",
    "description": "clean description of what was eaten",
    "calories": 500,
    "protein": 25,
    "carbs": 50,
    "fat": 20,
    "confidence": 0.85,
    "needsClarification": false,
    "clarificationQuestion": null,
    "itemBreakdown": [
        {
            "name": "3 eggs",
            "calories": 210,
            "protein": 18,
            "carbs": 1,
            "fat": 15
        }
    ]
}

Rules:

1. "calories" is the estimated total calories of everything described.

2. "protein", "carbs", and "fat" are estimated grams for the entire meal.

3. Use realistic common serving sizes where enough information exists.

4. Nutrition values are estimates. Do not pretend to know exact values when ingredients, quantity, or cooking method are unknown.

5. "confidence" must be a number from 0 to 1.

6. Do not ask unnecessary clarification questions.

Descriptions that normally provide enough information:

"2 eggs"
"one banana"
"200g grilled chicken breast"
"330ml Coke"
"2 slices of toast with butter"
"250g cooked rice"

7. Ask for clarification only when missing information could substantially change the estimated calories.

Examples:

"I ate pizza"
"I had pasta"
"I had chicken and rice"
"I ate a burger"

8. If clarification is required:

"needsClarification" must be true.

"clarificationQuestion" must contain ONE short useful question.

9. If clarification is not required:

"needsClarification" must be false.

"clarificationQuestion" must be null.

10. "itemBreakdown" must list each meaningful ingredient or item in the meal with estimated nutrition.

11. Keep "title" short.

12. "description" must only describe the food the user actually mentioned.

13. Never include markdown.

14. Never wrap the JSON in a code block.

15. Return JSON only.
`.trim();

type OpenRouterMessage = {
    role?: string;
    content?: string | null;
};

type OpenRouterChoice = {
    finish_reason?: string | null;

    message?: OpenRouterMessage;

    error?: {
        code?: number;
        message?: string;
        metadata?: unknown;
    };
};

type OpenRouterResponse = {
    id?: string;
    model?: string;

    choices?: OpenRouterChoice[];

    error?: {
        code?: number;
        message?: string;
        metadata?: unknown;
    };
};

export type MealConversationMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

export type ParsedMeal = MealNutrition & {
    model: string;
};

export class AIError extends Error {
    status?: number;
    details?: unknown;

    constructor(
        message: string,
        status?: number,
        details?: unknown
    ) {
        super(message);

        this.name = "AIError";
        this.status = status;
        this.details = details;
    }
}

function isRateLimited(error: unknown): boolean {
    return (
        error instanceof AIError &&
        (error.status === 429 ||
            (typeof error.details === "object" &&
                error.details !== null &&
                "code" in error.details &&
                (error.details as { code?: number }).code ===
                    429))
    );
}

function isTruncated(
    data: OpenRouterResponse
): boolean {
    const choice = data.choices?.[0];

    return (
        choice?.finish_reason === "length" ||
        !choice?.message?.content
    );
}

async function requestOpenRouter(
    messages: OpenRouterMessage[],
    model: string
): Promise<OpenRouterResponse> {
    const apiKey =
        process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new AIError(
            "OPENROUTER_API_KEY is missing."
        );
    }

    let response: Response;

    try {
        response = await fetch(
            OPENROUTER_URL,
            {
                method: "POST",

                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type":
                        "application/json",

                    "HTTP-Referer":
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "http://localhost:3000",

                    "X-OpenRouter-Title":
                        "Calorie Calculator",
                },

                body: JSON.stringify({
                    model,

                    messages,

                    response_format: {
                        type: "json_object",
                    },

                    provider: {
                        allow_fallbacks: false,
                        require_parameters: true,
                    },

                    temperature: 0.2,
                    max_tokens: 300,
                }),

                cache: "no-store",
            }
        );
    } catch (error) {
        throw error;
    }

    const rawBody =
        await response.text();

    let data: OpenRouterResponse;

    try {
        data = rawBody
            ? JSON.parse(rawBody)
            : {};
    } catch {
        console.error(
            "OpenRouter returned non-JSON:",
            rawBody
        );

        throw new AIError(
            `OpenRouter returned an invalid HTTP response (${response.status}).`,
            response.status,
            rawBody
        );
    }

        if (!response.ok) {
        console.error(
            "OpenRouter HTTP error:",
            {
                status: response.status,
                error: data.error,
                fullResponse: data,
            }
        );

        throw new AIError(
            data.error?.message ||
                `OpenRouter returned HTTP ${response.status}.`,
            response.status,
            data.error
        );
    }
    const choice =
        data.choices?.[0];

    if (choice?.error) {
        console.error(
            "OpenRouter provider error:",
            choice.error
        );

        throw new AIError(
            choice.error.message ||
                "The OpenRouter provider failed.",
            choice.error.code,
            choice.error.metadata
        );
    }

    if (!choice?.message?.content) {
        console.error(
            "OpenRouter returned no message content:",
            data
        );

        throw new AIError(
            "OpenRouter returned no assistant content."
        );
    }

    return data;
}

async function requestWithFallback(
    messages: OpenRouterMessage[],
    models: string[]
): Promise<{
    data: OpenRouterResponse;
    model: string;
}> {
    let lastError: unknown;

    for (const model of models) {
        try {
            const data = await requestOpenRouter(
                messages,
                model
            );

            if (isTruncated(data)) {
                console.warn(
                    "OpenRouter returned a truncated completion.",
                    {
                        model,
                        finishReason:
                            data.choices?.[0]?.finish_reason,
                    }
                );
                lastError = new AIError(
                    "OpenRouter returned a truncated completion.",
                    undefined,
                    {
                        model,
                        response: data,
                    }
                );
                continue;
            }

            return {
                data,
                model,
            };
        } catch (error) {
            lastError = error;

            if (isRateLimited(error)) {
                console.warn(
                    "OpenRouter rate limited a model; trying fallback.",
                    {
                        model,
                        status:
                            error instanceof AIError
                                ? error.status
                                : undefined,
                        details:
                            error instanceof AIError
                                ? error.details
                                : undefined,
                    }
                );
                continue;
            }

            throw error;
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new AIError(
              "OpenRouter could not produce a usable response."
          );
}

function cleanJsonResponse(
    raw: string
): string {
    let cleaned = raw.trim();

    if (
        cleaned.startsWith("```json")
    ) {
        cleaned =
            cleaned.slice(7);
    } else if (
        cleaned.startsWith("```")
    ) {
        cleaned =
            cleaned.slice(3);
    }

    if (
        cleaned.endsWith("```")
    ) {
        cleaned =
            cleaned.slice(0, -3);
    }

    return cleaned.trim();
}

export async function parseMealWithAI(
    text: string
): Promise<ParsedMeal> {
    const models = [
        process.env.OPENROUTER_MODEL ||
            DEFAULT_MODEL,
        FALLBACK_MODEL,
    ].filter((value, index, array) =>
        Boolean(value) && array.indexOf(value) === index
    );

    const { data, model } = await requestWithFallback(
        [
            {
                role: "system",
                content: `${SYSTEM_PROMPT}\n\n${BILINGUAL_MEAL_GUIDANCE}`,
            },
            {
                role: "user",
                content: text,
            },
        ],
        models
    );

    return parseMealResponse(
        data,
        model,
        undefined
    );
}

export async function continueMealWithAI(
    messages: MealConversationMessage[]
): Promise<ParsedMeal> {
    const model =
        process.env.OPENROUTER_CONVERSATION_MODEL ||
        process.env.OPENROUTER_MODEL ||
        DEFAULT_CONVERSATION_MODEL;

    const { data } = await requestWithFallback(
        [
            {
                role: "system",
                content: `${SYSTEM_PROMPT}\n\n${BILINGUAL_MEAL_GUIDANCE}\n\nContinuation rules:\n- You are revising an existing logged meal.\n- The current meal state is provided below.\n- Apply only the user's requested change.\n- Return the full updated meal object, not a patch.\n- Return JSON only.`,
            },
            ...messages,
        ],
        [model, FALLBACK_MODEL].filter(
            (value, index, array) =>
                Boolean(value) &&
                array.indexOf(value) === index
        )
    );

    return parseMealResponse(
        data,
        model,
        undefined
    );
}

function parseMealResponse(
    data: OpenRouterResponse,
    requestedModel: string,
    upstreamStatus?: number
): ParsedMeal {

    const choice =
        data.choices?.[0];

    const raw =
        choice?.message?.content;

    if (!raw) {
        console.error(
            "OpenRouter returned empty content:",
            data
        );

        throw new AIError(
            "OpenRouter returned no assistant content.",
            upstreamStatus,
            {
                choice,
                response: data,
            }
        );
    }

    const cleaned =
        cleanJsonResponse(raw);

    let json: unknown;

    try {
        json = JSON.parse(cleaned);
    } catch {
        console.error(
            "AI produced invalid JSON:",
            raw
        );

        throw new AIError(
            "The AI returned malformed JSON."
        );
    }

    const parsed =
        MealSchema.safeParse(json);

    if (!parsed.success) {
        console.error(
            "AI JSON did not match MealSchema:",
            {
                received: json,
                issues:
                    parsed.error.issues,
            }
        );

        throw new AIError(
            "The AI returned nutrition data in the wrong format."
        );
    }

    return {
        ...parsed.data,
        model:
            data.model ||
            requestedModel,
    };
}

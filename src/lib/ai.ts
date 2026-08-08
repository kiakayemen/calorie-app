import {
    MealSchema,
    type MealNutrition,
} from "@/lib/nutrition";

const OPENROUTER_URL =
    "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MODEL =
    "nvidia/nemotron-3-ultra-550b-a55b:free";

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
    "clarificationQuestion": null
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

10. Keep "title" short.

11. "description" must only describe the food the user actually mentioned.

12. Never include markdown.

13. Never wrap the JSON in a code block.

14. Return JSON only.
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

async function requestOpenRouter(
    text: string
): Promise<OpenRouterResponse> {
    const apiKey =
        process.env.OPENROUTER_API_KEY;

    const model =
        process.env.OPENROUTER_MODEL ||
        DEFAULT_MODEL;

    if (!apiKey) {
        throw new AIError(
            "OPENROUTER_API_KEY is missing."
        );
    }

    const response = await fetch(
        OPENROUTER_URL,
        {
            method: "POST",

            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",

                "HTTP-Referer":
                    process.env.NEXT_PUBLIC_APP_URL ||
                    "http://localhost:3000",

                "X-OpenRouter-Title":
                    "Calorie Calculator",
            },

            body: JSON.stringify({
                model,

                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT,
                    },

                    {
                        role: "user",
                        content: text,
                    },
                ],

                response_format: {
                    type: "json_object",
                },

                temperature: 0.2,

                max_tokens: 1000,
            }),

            cache: "no-store",
        }
    );

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
                data,
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

    return data;
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
): Promise<MealNutrition> {
    const data =
        await requestOpenRouter(text);

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
            "The AI returned an empty response."
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

    return parsed.data;
}
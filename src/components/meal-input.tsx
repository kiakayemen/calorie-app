"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";

import {
    ArrowUp,
    Loader2,
} from "lucide-react";

import { readJsonResponse } from "@/lib/http";

import type {
    LoggedMeal,
    MealNutrition,
} from "@/lib/nutrition";

type Props = {
    onMealAdded: (
        meal: LoggedMeal
    ) => void;
};

type Clarification = {
    originalText: string;
    question: string;
};

type DraftState = {
    text: string;
    clarification: Clarification | null;
};

const DRAFT_STORAGE_KEY =
    "calorie.meal-input.draft";

function loadDraft(): DraftState {
    try {
        const raw =
            window.sessionStorage.getItem(
                DRAFT_STORAGE_KEY
            );

        if (!raw) {
            return {
                text: "",
                clarification: null,
            };
        }

        const draft =
            JSON.parse(
                raw
            ) as Partial<DraftState>;

        return {
            text:
                typeof draft.text ===
                "string"
                    ? draft.text
                    : "",
            clarification:
                draft.clarification ??
                null,
        };
    } catch {
        return {
            text: "",
            clarification: null,
        };
    }
}

export function MealInput({
    onMealAdded,
}: Props) {
    const [text, setText] = useState(
        () => loadDraft().text
    );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [
        clarification,
        setClarification,
    ] = useState<Clarification | null>(
        () => loadDraft().clarification
    );

    useEffect(() => {
        try {
            const draft: DraftState =
                {
                    text,
                    clarification,
                };

            if (
                !draft.text &&
                !draft.clarification
            ) {
                window.sessionStorage.removeItem(
                    DRAFT_STORAGE_KEY
                );
                return;
            }

            window.sessionStorage.setItem(
                DRAFT_STORAGE_KEY,
                JSON.stringify(
                    draft
                )
            );
        } catch {
            // Ignore storage failures.
        }
    }, [text, clarification]);

    async function saveMeal(
        meal: MealNutrition
    ) {
        const response = await fetch(
            "/api/meals",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify(
                    meal
                ),
            }
        );

        const data = await readJsonResponse<
            LoggedMeal | {
                error: string;
            }
        >(response);

        if (!response.ok) {
            throw new Error(
                "error" in data
                    ? data.error
                    : "Couldn't save meal."
            );
        }

        if ("error" in data) {
            throw new Error(
                data.error
            );
        }

        onMealAdded(data);
    }

    async function parseMeal(
        value: string
    ) {
        setLoading(true);
        setError(null);

        try {
            const response =
                await fetch(
                    "/api/meals/parse",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify(
                                {
                                    text: value,
                                }
                            ),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                        "Something went wrong."
                );
            }

            const meal =
                data;

            if (
                meal.needsClarification &&
                meal.clarificationQuestion
            ) {
                setClarification({
                    originalText:
                        value,

                    question:
                        meal.clarificationQuestion,
                });

                setText("");

                return;
            }

            await saveMeal(meal);

            setClarification(null);
            setText("");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(
        event: FormEvent
    ) {
        event.preventDefault();

        const value =
            text.trim();

        if (!value || loading) {
            return;
        }

        if (clarification) {
            const combined = `
Original food description:

"${clarification.originalText}"

Clarification question:

"${clarification.question}"

User answer:

"${value}"

Use the original description and the user's answer to estimate the final nutrition.

Do not ask the same clarification question again.
            `.trim();

            await parseMeal(
                combined
            );

            return;
        }

        await parseMeal(value);
    }

    return (
        <div className="space-y-3">
            {clarification && (
                <div className="rounded-2xl bg-neutral-900 px-4 py-3">
                    <p className="text-sm font-medium text-neutral-100">
                        {
                            clarification.question
                        }
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            setClarification(
                                null
                            );

                            setText("");
                        }}
                        className="mt-2 text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-300"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {error && (
                <p className="px-1 text-sm text-red-400">
                    {error}
                </p>
            )}

            <form
                onSubmit={
                    handleSubmit
                }
                className="flex items-end gap-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-2 shadow-sm"
            >
                <textarea
                    value={text}
                    rows={1}
                    disabled={loading}
                    placeholder={
                        clarification
                            ? "Your answer..."
                            : "What did you eat?"
                    }
                    onChange={(
                        event
                    ) =>
                        setText(
                            event.target
                                .value
                        )
                    }
                    onKeyDown={(
                        event
                    ) => {
                        if (
                            event.key ===
                                "Enter" &&
                            !event.shiftKey
                        ) {
                            event.preventDefault();

                            event.currentTarget.form?.requestSubmit();
                        }
                    }}
                    className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-neutral-100 outline-none placeholder:text-neutral-500"
                />

                <button
                    type="submit"
                    disabled={
                        loading ||
                        !text.trim()
                    }
                    aria-label="Log food"
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-600"
                >
                    {loading ? (
                        <Loader2
                            size={18}
                            className="animate-spin"
                        />
                    ) : (
                        <ArrowUp
                            size={18}
                        />
                    )}
                </button>
            </form>
        </div>
    );
}

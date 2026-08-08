"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  ArrowUp,
  Loader2,
} from "lucide-react";

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

export function MealInput({
  onMealAdded,
}: Props) {
  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [
    clarification,
    setClarification,
  ] =
    useState<Clarification | null>(
      null
    );

  async function parseMeal(
    value: string
  ) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/meals/parse",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            text: value,
          }),
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
        data as MealNutrition;

      if (
        meal.needsClarification &&
        meal.clarificationQuestion
      ) {
        setClarification({
          originalText: value,
          question:
            meal.clarificationQuestion,
        });

        setText("");

        return;
      }

      const loggedMeal: LoggedMeal =
        {
          ...meal,

          id: crypto.randomUUID(),

          createdAt:
            new Date().toISOString(),
        };

      onMealAdded(loggedMeal);

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

    const value = text.trim();

    if (!value || loading) {
      return;
    }

    if (clarification) {
      const combined = `
The original food description was:

"${clarification.originalText}"

You asked:

"${clarification.question}"

The user answered:

"${value}"

Use the original description AND the answer to estimate the final meal nutrition.

Do not ask the same clarification again.
      `.trim();

      await parseMeal(combined);

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
              setClarification(null);
              setText("");
            }}
            className="mt-2 text-xs text-neutral-400 underline underline-offset-4"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="px-1 text-sm text-red-500">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
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
          onChange={(event) =>
            setText(
              event.target.value
            )
          }
          onKeyDown={(event) => {
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
            loading || !text.trim()
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
            <ArrowUp size={18} />
          )}
        </button>
      </form>
    </div>
  );
}
"use client";

import {
  ArrowUp,
  Loader2,
  Trash2,
} from "lucide-react";

import { useState } from "react";

import { readJsonResponse } from "@/lib/http";

import type { LoggedMeal } from "@/lib/nutrition";

type Props = {
  meal: LoggedMeal;

  onDelete: (
    id: string
  ) => void;

  onMealUpdated: (
    meal: LoggedMeal
  ) => void;
};

const timeFormatter =
  new Intl.DateTimeFormat(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );

export function MealCard({
  meal,
  onDelete,
  onMealUpdated,
}: Props) {
  const [message, setMessage] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const time = timeFormatter.format(
    new Date(meal.eatenAt)
  );

  async function continueConversation(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const value = message.trim();

    if (!value || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/meals/${meal.id}/conversation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: value,
          }),
        }
      );

      const data =
        await readJsonResponse<
          LoggedMeal | { error: string }
        >(response);

      if (!response.ok || "error" in data) {
        throw new Error(
          "error" in data
            ? data.error
            : "Couldn't update this meal."
        );
      }

      onMealUpdated(data);
      setMessage("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't update this meal."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="border-b border-neutral-800 py-5">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h3 className="font-medium text-neutral-100">
            {meal.title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-neutral-500">
            {meal.description}
          </p>

          <div className="mt-3 flex gap-3 text-xs text-neutral-400">
            <span>{time}</span>

            <span>
              P{" "}
              {Math.round(
                meal.protein
              )}
              g
            </span>

            <span>
              C{" "}
              {Math.round(
                meal.carbs
              )}
              g
            </span>

            <span>
              F{" "}
              {Math.round(meal.fat)}
              g
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="font-semibold tabular-nums">
            {Math.round(
              meal.calories
            ).toLocaleString()}{" "}
            kcal
          </span>

          <button
            type="button"
            aria-label="Delete meal"
            onClick={() =>
              onDelete(meal.id)
            }
            className="text-neutral-700 transition hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <form
        onSubmit={continueConversation}
        className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-1.5"
      >
        <input
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          disabled={loading}
          placeholder="Ask AI to change this meal..."
          className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
          aria-label={`Continue conversation about ${meal.title}`}
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
          aria-label="Update meal with AI"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-600"
        >
          {loading ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <ArrowUp size={15} />
          )}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </article>
  );
}

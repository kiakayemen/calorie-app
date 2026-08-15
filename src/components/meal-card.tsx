"use client";

import {
    ArrowUp,
    ChevronDown,
    Loader2,
    Trash2,
} from "lucide-react";

import { useState } from "react";

import {
    fetchWithTiming,
    readJsonResponse,
} from "@/lib/http";

import type { LoggedMeal } from "@/lib/nutrition";

type Props = {
    meal: LoggedMeal;
    expanded: boolean;

    onDelete: (
      id: string
    ) => void;

    onToggleExpand: (
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
  expanded,
  onDelete,
  onToggleExpand,
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
      const { response, durationMs } =
        await fetchWithTiming(
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
      console.info(
        "POST /api/meals/%s/conversation completed in %d ms",
        meal.id,
        durationMs
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
        <button
          type="button"
          onClick={() => onToggleExpand(meal.id)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={expanded}
        >
          <h3 className="font-medium text-neutral-100">
            {meal.title}
          </h3>

          <p className="mt-1 text-sm leading-6 text-neutral-500">
            {meal.description}
          </p>

          <div className="mt-3 flex gap-3 text-xs text-neutral-400">
            <span>{time}</span>

            <span>
              P {Math.round(meal.protein)}g
            </span>

            <span>
              C {Math.round(meal.carbs)}g
            </span>

            <span>
              F {Math.round(meal.fat)}g
            </span>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleExpand(meal.id)}
            aria-label={
              expanded
                ? "Collapse meal"
                : "Expand meal"
            }
            className="flex items-center gap-1.5 text-neutral-100 transition hover:text-white"
          >
            <span className="font-semibold tabular-nums">
              {Math.round(meal.calories).toLocaleString()} kcal
            </span>

            <ChevronDown
              size={16}
              className={`text-neutral-500 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            aria-label="Delete meal"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(meal.id);
            }}
            className="text-neutral-700 transition hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ${
          expanded
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="grid gap-3">
              {(meal.itemBreakdown ?? []).length > 0 ? (
                meal.itemBreakdown.map(
                  (item, index) => (
                    <div
                      key={`${meal.id}-${item.name}-${index}`}
                      className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-100">
                          {item.name}
                        </p>
                      </div>

                      <div className="grid shrink-0 grid-cols-4 gap-3 text-right text-xs text-neutral-400">
                        <span>
                          {Math.round(item.calories)} kcal
                        </span>
                        <span>
                          P {Math.round(item.protein)}g
                        </span>
                        <span>
                          C {Math.round(item.carbs)}g
                        </span>
                        <span>
                          F {Math.round(item.fat)}g
                        </span>
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-sm text-neutral-500">
                  No item breakdown is available for this meal yet.
                </p>
              )}
            </div>

            <form
              onSubmit={continueConversation}
              className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5"
            >
              <input
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                disabled={loading}
                dir="auto"
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

          </div>
        </div>
      </div>
    </article>
  );
}

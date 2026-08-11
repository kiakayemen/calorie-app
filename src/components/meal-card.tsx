"use client";

import { Trash2 } from "lucide-react";

import type { LoggedMeal } from "@/lib/nutrition";

type Props = {
  meal: LoggedMeal;

  onDelete: (
    id: string
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
}: Props) {
  const time = timeFormatter.format(
    new Date(meal.eatenAt)
  );

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
    </article>
  );
}

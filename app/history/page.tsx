"use client";

import {
    useMemo,
    useState,
} from "react";

import { AppNav } from "@/components/app-nav";
import { useAppData } from "@/components/app-data-provider";

import type { LoggedMeal } from "@/lib/nutrition";

const dayFormatter =
    new Intl.DateTimeFormat(
        undefined,
        {
            weekday: "long",
            month: "short",
            day: "numeric",
        }
    );

type DayGroup = {
    date: string;
    label: string;
    meals: LoggedMeal[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

export default function HistoryPage() {
    const {
        meals,
        mealsLoaded,
    } = useAppData();

    const days =
        useMemo(() => {
            const grouped =
                new Map<
                    string,
                    DayGroup
                >();

            for (
                const meal of meals
            ) {
                const date =
                    new Date(
                        meal.eatenAt
                    );

                const key = [
                    date.getFullYear(),
                    String(
                        date.getMonth() +
                            1
                    ).padStart(
                        2,
                        "0"
                    ),
                    String(
                        date.getDate()
                    ).padStart(
                        2,
                        "0"
                    ),
                ].join("-");

                const existing =
                    grouped.get(
                        key
                    );

                if (existing) {
                    existing.meals.push(
                        meal
                    );

                    existing.calories +=
                        meal.calories;

                    existing.protein +=
                        meal.protein;

                    existing.carbs +=
                        meal.carbs;

                    existing.fat +=
                        meal.fat;

                    continue;
                }

                grouped.set(
                    key,
                    {
                        date: key,

                        label:
                            dayFormatter.format(
                                date
                            ),

                        meals: [meal],

                        calories:
                            meal.calories,

                        protein:
                            meal.protein,

                        carbs:
                            meal.carbs,

                        fat:
                            meal.fat,
                    }
                );
            }

            return Array.from(
                grouped.values()
            ).sort(
                (a, b) =>
                    b.date.localeCompare(
                        a.date
                    )
            );
        }, [meals]);

    return (
        <main className="min-h-dvh bg-neutral-950 text-neutral-100">
            <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
                <header className="px-5 pb-5 pt-8">
                    <p className="text-sm text-neutral-500">
                        Previous days
                    </p>

                    <h1 className="mt-1 text-xl font-semibold tracking-tight">
                        History
                    </h1>
                </header>

                <section className="flex-1 border-t border-neutral-800 px-5 pb-28 pt-6">
                    {!mealsLoaded ? (
                        <p className="text-sm text-neutral-500">
                            Loading...
                        </p>
                    ) : days.length ===
                      0 ? (
                        <div className="flex min-h-64 items-center justify-center text-sm text-neutral-500">
                            No history
                            yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {days.map(
                                (
                                    day
                                ) => (
                                    <DayCard
                                        key={
                                            day.date
                                        }
                                        day={
                                            day
                                        }
                                    />
                                )
                            )}
                        </div>
                    )}
                </section>

                <div className="fixed inset-x-0 bottom-0 z-20">
                    <div className="mx-auto w-full max-w-xl border-t border-neutral-800 bg-neutral-950/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
                        <AppNav
                            active="history"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}

function DayCard({
    day,
}: {
    day: DayGroup;
}) {
    const [open, setOpen] =
        useState(false);

    return (
        <article className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            <button
                type="button"
                onClick={() =>
                    setOpen(
                        (current) =>
                            !current
                    )
                }
                className="flex w-full items-center justify-between gap-6 px-4 py-4 text-left"
            >
                <div>
                    <p className="font-medium text-neutral-100">
                        {day.label}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                        {
                            day.meals
                                .length
                        }{" "}
                        {day.meals
                            .length ===
                        1
                            ? "meal"
                            : "meals"}
                    </p>
                </div>

                <div className="text-right">
                    <p className="font-semibold tabular-nums">
                        {Math.round(
                            day.calories
                        ).toLocaleString()}{" "}
                        kcal
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                        P{" "}
                        {Math.round(
                            day.protein
                        )}
                        g · C{" "}
                        {Math.round(
                            day.carbs
                        )}
                        g · F{" "}
                        {Math.round(
                            day.fat
                        )}
                        g
                    </p>
                </div>
            </button>

            {open && (
                <div className="border-t border-neutral-800 px-4">
                    {day.meals.map(
                        (meal) => (
                            <div
                                key={
                                    meal.id
                                }
                                className="flex items-start justify-between gap-4 border-b border-neutral-800 py-4 last:border-b-0"
                            >
                                <div>
                                    <p className="text-sm font-medium text-neutral-200">
                                        {
                                            meal.title
                                        }
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                                        {
                                            meal.description
                                        }
                                    </p>
                                </div>

                                <span className="shrink-0 text-sm font-medium tabular-nums text-neutral-300">
                                    {Math.round(
                                        meal.calories
                                    )}{" "}
                                    kcal
                                </span>
                            </div>
                        )
                    )}
                </div>
            )}
        </article>
    );
}

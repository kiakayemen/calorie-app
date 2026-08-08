"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppNav } from "@/components/app-nav";

import { TodaySkeleton } from "@/components/skeletons/today-skeleton";

import type { AppSettings } from "@/lib/settings";

import { readJsonResponse } from "@/lib/http";

import {
  Utensils,
} from "lucide-react";

import { MealCard } from "@/components/meal-card";
import { MealInput } from "@/components/meal-input";

import type { LoggedMeal } from "@/lib/nutrition";

export default function Home() {
  const [meals, setMeals] =
    useState<LoggedMeal[]>([]);

  const [hydrated, setHydrated] =
    useState(false);
  
  const [loaded, setLoaded] =
    useState(false);
  
  const [settings, setSettings] =
    useState<AppSettings>({
        calorieGoal: 2200,
        notificationHour: 21,
        notificationMinute: 0,
        timezone:
            Intl.DateTimeFormat()
                .resolvedOptions()
                .timeZone,
    });

  // useEffect(() => {
  //     async function loadMeals() {
  //         try {
  //             const response = await fetch(
  //                 "/api/meals",
  //                 {
  //                     cache: "no-store",
  //                 }
  //             );

  //             const data = await readJsonResponse<
  //                 LoggedMeal[] | {
  //                     error: string;
  //                 }
  //             >(response);

  //             if (!response.ok) {
  //                 throw new Error(
  //                     "error" in data
  //                         ? data.error
  //                         : "Couldn't load meals."
  //                 );
  //             }

  //             if (!Array.isArray(data)) {
  //                 throw new Error(
  //                     "Invalid meals response."
  //                 );
  //             }

  //             setMeals(data);
  //         } catch (error) {
  //             console.error(
  //                 "Failed to load meals:",
  //                 error
  //             );
  //         } finally {
  //             setLoaded(true);
  //         }
  //     }

  //     void loadMeals();
  // }, []);

  useEffect(() => {
    async function loadData() {
        try {
            const [
                mealsResponse,
                settingsResponse,
            ] =
                await Promise.all([
                    fetch(
                        "/api/meals",
                        {
                            cache:
                                "no-store",
                        }
                    ),

                    fetch(
                        "/api/settings",
                        {
                            cache:
                                "no-store",
                        }
                    ),
                ]);

            const mealsData =
                await readJsonResponse<
                    LoggedMeal[] | {
                        error: string;
                    }
                >(
                    mealsResponse
                );

            const settingsData =
                await readJsonResponse<
                    AppSettings | {
                        error: string;
                    }
                >(
                    settingsResponse
                );

            if (
                !mealsResponse.ok
            ) {
                throw new Error(
                    "error" in
                    mealsData
                        ? mealsData.error
                        : "Couldn't load meals."
                );
            }

            if (
                !settingsResponse.ok
            ) {
                throw new Error(
                    "error" in
                    settingsData
                        ? settingsData.error
                        : "Couldn't load settings."
                );
            }

            if (
                Array.isArray(
                    mealsData
                )
            ) {
                setMeals(
                    mealsData
                );
            }

            if (
                !(
                    "error" in
                    settingsData
                )
            ) {
                setSettings(
                    settingsData
                );
            }
        } catch (error) {
            console.error(
                "Failed to load app data:",
                error
            );
        } finally {
            setLoaded(true);
        }
    }

    void loadData();
}, []);

  const todaysMeals =
    useMemo(() => {
      const today =
        new Date().toDateString();

      return meals.filter(
        (meal) => {
          return (
            new Date(
              meal.createdAt
            ).toDateString() ===
            today
          );
        }
      );
    }, [meals]);

  const totals =
    useMemo(() => {
      return todaysMeals.reduce(
        (acc, meal) => ({
          calories:
            acc.calories +
            meal.calories,

          protein:
            acc.protein +
            meal.protein,

          carbs:
            acc.carbs +
            meal.carbs,

          fat:
            acc.fat + meal.fat,
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }
      );
    }, [todaysMeals]);

  const progress =
    Math.min(
      totals.calories /
        settings.calorieGoal,
      1
    ) * 100;

  const date =
    new Intl.DateTimeFormat(
      undefined,
      {
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    ).format(new Date());

  function addMeal(
    meal: LoggedMeal
  ) {
    setMeals((current) => [
      ...current,
      meal,
    ]);
  }

  async function deleteMeal(
      id: string
  ) {
      const previousMeals =
          meals;

      setMeals((current) =>
          current.filter(
              (meal) =>
                  meal.id !== id
          )
      );

      try {
          const response =
              await fetch(
                  `/api/meals/${id}`,
                  {
                      method:
                          "DELETE",
                  }
              );

          if (!response.ok) {
              throw new Error(
                  "Delete failed."
              );
          }
      } catch (error) {
          console.error(
              error
          );

          setMeals(
              previousMeals
          );
      }
  }

  if (!loaded) {
      return <TodaySkeleton />;
  }

  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
        <header className="px-5 pb-4 pt-8">
          <p className="text-sm text-neutral-400">
            {date}
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Today
          </h1>
        </header>

        <section className="flex-1 border-t border-neutral-800 bg-neutral-950 px-5 pb-44 pt-6">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-[-0.05em] tabular-nums">
              {Math.round(
                totals.calories
              ).toLocaleString()}
            </span>

            <span className="pb-1.5 text-sm text-neutral-400">
              /{" "}
              {settings.calorieGoal.toLocaleString()}{" "}
              kcal
            </span>
          </div>

          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-neutral-100 transition-[width] duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="mt-7 grid grid-cols-3 gap-4">
            <Macro
              value={totals.protein}
              label="Protein"
            />

            <Macro
              value={totals.carbs}
              label="Carbs"
            />

            <Macro
              value={totals.fat}
              label="Fat"
            />
          </div>
        </section>

        <section className="flex-1 border-t border-neutral-800 bg-neutral-950 px-5 pb-44 pt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Today&apos;s meals
            </h2>

            <span className="text-xs text-neutral-600">
              {todaysMeals.length}
            </span>
          </div>

          {hydrated &&
            todaysMeals.length ===
              0 && (
              <EmptyState />
            )}

          {todaysMeals
            .slice()
            .reverse()
            .map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onDelete={
                  deleteMeal
                }
              />
            ))}
        </section>

        <div className="fixed inset-x-0 bottom-0 z-20">
          <div className="mx-auto w-full max-w-xl border-t border-neutral-800 bg-neutral-950/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
              <MealInput
                  onMealAdded={addMeal}
              />
            <AppNav active="today" />
          </div>
        </div>
      </div>
    </main>
  );
}

function Macro({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div>
      <p className="font-semibold tabular-nums">
        {Math.round(value)}g
      </p>

      <p className="mt-1 text-xs text-neutral-400">
        {label}
      </p>
    </div>
  );
}

function EmptyState() {
    return (
        <div className="flex min-h-52 flex-col items-center justify-center text-center">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-neutral-900">
                <Utensils
                    size={18}
                    className="text-neutral-500"
                />
            </div>

            <p className="mt-4 text-sm font-medium text-neutral-200">
                Nothing logged yet
            </p>

            <p className="mt-1 text-sm text-neutral-500">
                Just tell me what you ate.
            </p>
        </div>
    );
}

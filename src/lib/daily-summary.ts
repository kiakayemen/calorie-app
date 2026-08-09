import type { Meal } from "@/generated/prisma/client";

export type DailyTotals = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    meals: number;
};

export function calculateDailyTotals(
    meals: Meal[]
): DailyTotals {
    return meals.reduce(
        (totals, meal) => ({
            calories:
                totals.calories +
                meal.calories,

            protein:
                totals.protein +
                meal.protein,

            carbs:
                totals.carbs +
                meal.carbs,

            fat:
                totals.fat +
                meal.fat,

            meals:
                totals.meals + 1,
        }),

        {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            meals: 0,
        }
    );
}

export function buildSummaryText(
    totals: DailyTotals,
    calorieGoal: number
) {
    const calories =
        Math.round(
            totals.calories
        );

    const protein =
        Math.round(
            totals.protein
        );

    if (totals.meals === 0) {
        return "You didn't log any meals today.";
    }

    const difference =
        calories -
        calorieGoal;

    let goalText: string;

    if (
        Math.abs(difference) <=
        100
    ) {
        goalText =
            "Right around your goal.";
    } else if (
        difference > 0
    ) {
        goalText =
            `${Math.abs(
                difference
            )} kcal over your goal.`;
    } else {
        goalText =
            `${Math.abs(
                difference
            )} kcal under your goal.`;
    }

    return `${calories.toLocaleString()} kcal across ${totals.meals} ${
        totals.meals === 1
            ? "meal"
            : "meals"
    } · ${protein}g protein. ${goalText}`;
}
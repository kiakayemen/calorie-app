import { z } from "zod";

export const MealSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),

    calories: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fat: z.number().nonnegative(),

    confidence: z.number().min(0).max(1),

    needsClarification: z.boolean(),
    clarificationQuestion: z.string().nullable(),
});

export type MealNutrition = z.infer<
    typeof MealSchema
>;

export type LoggedMeal = MealNutrition & {
    id: string;
    createdAt: string;
    eatenAt: string;
};
import { z } from "zod";

export const MealItemSchema = z.object({
    name: z.string().min(1),
    calories: z.number().nonnegative(),
    protein: z.number().nonnegative(),
    carbs: z.number().nonnegative(),
    fat: z.number().nonnegative(),
});

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
    itemBreakdown: z.array(MealItemSchema).default([]),
});

export type MealNutrition = z.infer<
    typeof MealSchema
>;

export type MealItem = z.infer<
    typeof MealItemSchema
>;

export type LoggedMeal = MealNutrition & {
    id: string;
    createdAt: string;
    eatenAt: string;
    model?: string | null;
    itemBreakdown?: MealItem[];
};

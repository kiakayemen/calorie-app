import { NextRequest } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { z } from "zod";

import { continueMealWithAI } from "@/lib/ai";
import { db } from "@/lib/db";

const FollowUpSchema = z.object({
    message: z.string().trim().min(1).max(2000),
});

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export const runtime = "nodejs";

export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return Response.json(
                { error: "Unauthorized." },
                { status: 401 }
            );
        }

        const { id } = await context.params;

        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return Response.json(
                { error: "Invalid JSON request." },
                { status: 400 }
            );
        }

        const parsedRequest = FollowUpSchema.safeParse(body);

        if (!parsedRequest.success) {
            return Response.json(
                {
                    error: "A follow-up message is required.",
                },
                { status: 400 }
            );
        }

        const meal = await db.meal.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!meal) {
            return Response.json(
                { error: "Meal not found." },
                { status: 404 }
            );
        }

        const result = await continueMealWithAI([
            {
                role: "system" as const,
                content:
                    "You are revising an existing logged meal. The current meal state is provided below. Apply only the user's requested change. Return the full updated meal object, not a patch. Return JSON only.",
            },
            {
                role: "assistant" as const,
                content: JSON.stringify({
                    title: meal.title,
                    description: meal.description,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                    confidence: meal.confidence,
                    needsClarification: meal.needsClarification,
                    clarificationQuestion:
                        meal.clarificationQuestion,
                    itemBreakdown: meal.itemBreakdown,
                }),
            },
            {
                role: "user" as const,
                content: parsedRequest.data.message,
            },
        ]);

        const updatedMeal = await db.meal.update({
            where: {
                id: meal.id,
            },
            data: {
                title: result.title,
                description: result.description,
                calories: result.calories,
                protein: result.protein,
                carbs: result.carbs,
                fat: result.fat,
                confidence: result.confidence,
                needsClarification: result.needsClarification,
                clarificationQuestion:
                    result.clarificationQuestion,
                model: result.model,
                itemBreakdown: result.itemBreakdown,
            },
        });

        await db.mealMessage.create({
            data: {
                mealId: meal.id,
                role: "USER",
                content: parsedRequest.data.message,
            },
        });

        await db.mealMessage.create({
            data: {
                mealId: meal.id,
                role: "ASSISTANT",
                content: JSON.stringify(result),
                model: result.model,
            },
        });

        return Response.json({
            id: updatedMeal.id,
            title: updatedMeal.title,
            description: updatedMeal.description,
            calories: updatedMeal.calories,
            protein: updatedMeal.protein,
            carbs: updatedMeal.carbs,
            fat: updatedMeal.fat,
            confidence: updatedMeal.confidence,
            needsClarification: updatedMeal.needsClarification,
            clarificationQuestion:
                updatedMeal.clarificationQuestion,
            model: updatedMeal.model,
            itemBreakdown: updatedMeal.itemBreakdown,
            eatenAt: updatedMeal.eatenAt.toISOString(),
            createdAt: updatedMeal.createdAt.toISOString(),
        });
    } catch (error) {
        console.error(
            "POST /api/meals/[id]/conversation failed:",
            error
        );

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Couldn't continue the meal conversation.",
            },
            { status: 500 }
        );
    }
}

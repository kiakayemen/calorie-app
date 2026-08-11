import {
    NextRequest,
} from "next/server";

import {
    auth,
} from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { MealSchema } from "@/lib/nutrition";

export const runtime =
    "nodejs";

export const dynamic =
    "force-dynamic";

export async function GET() {
    try {
        const {
            userId,
        } =
            await auth();

        if (!userId) {
            return Response.json(
                {
                    error:
                        "Unauthorized.",
                },
                {
                    status: 401,
                }
            );
        }

        const meals =
            await db.meal.findMany({
                where: {
                    userId,
                },

                orderBy: {
                    eatenAt:
                        "desc",
                },
            });

        return Response.json(
            meals.map(
                (meal) => ({
                    id:
                        meal.id,

                    title:
                        meal.title,

                    description:
                        meal.description,

                    calories:
                        meal.calories,

                    protein:
                        meal.protein,

                    carbs:
                        meal.carbs,

                    fat:
                        meal.fat,

                    confidence:
                        meal.confidence,

                    needsClarification:
                        meal.needsClarification,

                    clarificationQuestion:
                        meal.clarificationQuestion,

                    eatenAt:
                        meal.eatenAt.toISOString(),

                    createdAt:
                        meal.createdAt.toISOString(),
                })
            )
        );
    } catch (error) {
        console.error(
            "GET /api/meals/parse failed:",
            error
        );

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Couldn't load meals.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function POST(
    request: NextRequest
) {
    try {
        const {
            userId,
        } =
            await auth();

        if (!userId) {
            return Response.json(
                {
                    error:
                        "Unauthorized.",
                },
                {
                    status: 401,
                }
            );
        }

        let body: unknown;

        try {
            body =
                await request.json();
        } catch {
            return Response.json(
                {
                    error:
                        "Invalid JSON request.",
                },
                {
                    status: 400,
                }
            );
        }

        const parsed =
            MealSchema.safeParse(
                body
            );

        if (!parsed.success) {
            return Response.json(
                {
                    error:
                        "Invalid meal data.",

                    details:
                        parsed.error.issues,
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Save the parsed meal under
         * the authenticated user.
         */
        const meal =
            await db.meal.create({
                data: {
                    userId,

                    title:
                        parsed.data.title,

                    description:
                        parsed.data.description,

                    calories:
                        parsed.data.calories,

                    protein:
                        parsed.data.protein,

                    carbs:
                        parsed.data.carbs,

                    fat:
                        parsed.data.fat,

                    confidence:
                        parsed.data.confidence,

                    needsClarification:
                        parsed.data.needsClarification,

                    clarificationQuestion:
                        parsed.data.clarificationQuestion,
                },
            });

        return Response.json(
            {
                id:
                    meal.id,

                title:
                    meal.title,

                description:
                    meal.description,

                calories:
                    meal.calories,

                protein:
                    meal.protein,

                carbs:
                    meal.carbs,

                fat:
                    meal.fat,

                confidence:
                    meal.confidence,

                needsClarification:
                    meal.needsClarification,

                clarificationQuestion:
                    meal.clarificationQuestion,

                eatenAt:
                    meal.eatenAt.toISOString(),

                createdAt:
                    meal.createdAt.toISOString(),
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "POST /api/meals failed:",
            error
        );

        return Response.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Couldn't save meal.",
            },
            {
                status: 500,
            }
        );
    }
}

import {
    auth,
} from "@clerk/nextjs/server";

import { db } from "@/lib/db";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function DELETE(
    _request: Request,
    context: RouteContext
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

        const {
            id,
        } =
            await context.params;

        const result =
            await db.meal.deleteMany({
                where: {
                    id,
                    userId,
                },
            });

        if (
            result.count === 0
        ) {
            return Response.json(
                {
                    error:
                        "Meal not found.",
                },
                {
                    status: 404,
                }
            );
        }

        return Response.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "DELETE meal failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Couldn't delete meal.",
            },
            {
                status: 500,
            }
        );
    }
}
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
        const { id } =
            await context.params;

        await db.meal.delete({
            where: {
                id,
            },
        });

        return Response.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "DELETE /api/meals/[id] failed:",
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
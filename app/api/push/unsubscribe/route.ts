import { NextRequest } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest
) {
    try {
        const body =
            await request.json();

        const endpoint =
            typeof body.endpoint ===
            "string"
                ? body.endpoint
                : "";

        if (!endpoint) {
            return Response.json(
                {
                    error:
                        "Missing endpoint.",
                },
                {
                    status: 400,
                }
            );
        }

        await db.pushSubscription.deleteMany(
            {
                where: {
                    endpoint,
                },
            }
        );

        return Response.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "POST /api/push/unsubscribe failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Couldn't remove push subscription.",
            },
            {
                status: 500,
            }
        );
    }
}
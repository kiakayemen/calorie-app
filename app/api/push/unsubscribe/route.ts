import {
    NextRequest,
} from "next/server";

import {
    auth,
} from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export const runtime =
    "nodejs";

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
                    userId,
                },
            }
        );

        return Response.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Push unsubscribe failed:",
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
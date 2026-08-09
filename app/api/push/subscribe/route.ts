import { NextRequest } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionPayload = {
    endpoint?: string;

    keys?: {
        p256dh?: string;
        auth?: string;
    };
};

export async function POST(
    request: NextRequest
) {
    try {
        const body =
            (await request.json()) as SubscriptionPayload;

        const endpoint =
            body.endpoint;

        const p256dh =
            body.keys?.p256dh;

        const auth =
            body.keys?.auth;

        if (
            !endpoint ||
            !p256dh ||
            !auth
        ) {
            return Response.json(
                {
                    error:
                        "Invalid push subscription.",
                },
                {
                    status: 400,
                }
            );
        }

        await db.pushSubscription.upsert(
            {
                where: {
                    endpoint,
                },

                update: {
                    p256dh,
                    auth,
                },

                create: {
                    endpoint,
                    p256dh,
                    auth,
                },
            }
        );

        return Response.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "POST /api/push/subscribe failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Couldn't save push subscription.",
            },
            {
                status: 500,
            }
        );
    }
}
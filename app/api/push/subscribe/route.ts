import {
    NextRequest,
} from "next/server";

import {
    auth,
} from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export const runtime =
    "nodejs";

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
            (await request.json()) as SubscriptionPayload;

        const endpoint =
            body.endpoint;

        const p256dh =
            body.keys?.p256dh;

        const authKey =
            body.keys?.auth;

        if (
            !endpoint ||
            !p256dh ||
            !authKey
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
                    userId,
                    p256dh,
                    auth:
                        authKey,
                },

                create: {
                    userId,
                    endpoint,
                    p256dh,
                    auth:
                        authKey,
                },
            }
        );

        return Response.json({
            success: true,
        });
    } catch (error) {
        console.error(
            "Push subscribe failed:",
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
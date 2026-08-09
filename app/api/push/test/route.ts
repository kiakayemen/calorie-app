// app/api/push/test/route.ts

import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { sendPush } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest
) {
    const token =
        request.headers.get(
            "x-push-test-token"
        );

    if (
        !process.env.PUSH_TEST_TOKEN ||
        token !==
            process.env.PUSH_TEST_TOKEN
    ) {
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

    try {
        const subscriptions =
            await db.pushSubscription.findMany();

        let sent = 0;
        let removed = 0;
        let failed = 0;

        for (
            const subscription of
            subscriptions
        ) {
            try {
                await sendPush(
                    {
                        endpoint:
                            subscription.endpoint,

                        keys: {
                            p256dh:
                                subscription.p256dh,

                            auth:
                                subscription.auth,
                        },
                    },

                    {
                        title:
                            "Calorie",

                        body:
                            "Push notifications are working 🎉",

                        url: "/",

                        tag:
                            "push-test",
                    }
                );

                sent++;
            } catch (error) {
                console.error(
                    "Push send failed:",
                    error
                );

                const statusCode =
                    typeof error ===
                        "object" &&
                    error !== null &&
                    "statusCode" in
                        error
                        ? Number(
                            error.statusCode
                        )
                        : undefined;

                if (
                    statusCode ===
                        404 ||
                    statusCode ===
                        410
                ) {
                    await db.pushSubscription.delete(
                        {
                            where: {
                                id:
                                    subscription.id,
                            },
                        }
                    );

                    removed++;

                    continue;
                }

                failed++;
            }
        }

        return Response.json({
            subscriptions:
                subscriptions.length,

            sent,
            removed,
            failed,
        });
    } catch (error) {
        console.error(
            "POST /api/push/test failed:",
            error
        );

        return Response.json(
            {
                error:
                    error instanceof
                    Error
                        ? error.message
                        : "Push test failed.",
            },
            {
                status: 500,
            }
        );
    }
}
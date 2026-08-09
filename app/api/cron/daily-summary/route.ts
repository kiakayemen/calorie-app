import { NextRequest } from "next/server";

import { db } from "@/lib/db";

import {
    buildSummaryText,
    calculateDailyTotals,
} from "@/lib/daily-summary";

import {
    createDateKey,
    getZonedDateParts,
} from "@/lib/date";

import { sendPush } from "@/lib/push-server";

import { getUtcRangeForLocalDate } from "@/lib/time-range";

export const runtime = "nodejs";
export const dynamic =
    "force-dynamic";

const SEND_WINDOW_MINUTES = 5;

export async function GET(
    request: NextRequest
) {
    const authorization =
        request.headers.get(
            "authorization"
        );

    const expected =
        `Bearer ${process.env.CRON_SECRET}`;

    if (
        !process.env.CRON_SECRET ||
        authorization !== expected
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
        const settings =
            await db.settings.upsert({
                where: {
                    id: "default",
                },

                update: {},

                create: {
                    id: "default",
                },
            });

        const now =
            new Date();

        const local =
            getZonedDateParts(
                now,
                settings.timezone
            );

        const currentMinutes =
            local.hour * 60 +
            local.minute;

        const desiredMinutes =
            settings.notificationHour *
                60 +
            settings.notificationMinute;

        const minutesLate =
            currentMinutes -
            desiredMinutes;

        if (
            minutesLate < 0 ||
            minutesLate >=
                SEND_WINDOW_MINUTES
        ) {
            return Response.json({
                status: "not_due",

                localTime:
                    `${String(
                        local.hour
                    ).padStart(
                        2,
                        "0"
                    )}:${String(
                        local.minute
                    ).padStart(
                        2,
                        "0"
                    )}`,

                notificationTime:
                    `${String(
                        settings.notificationHour
                    ).padStart(
                        2,
                        "0"
                    )}:${String(
                        settings.notificationMinute
                    ).padStart(
                        2,
                        "0"
                    )}`,
            });
        }

        const dateKey =
            createDateKey(local);

        const alreadySent =
            await db.dailySummaryDelivery.findUnique(
                {
                    where: {
                        dateKey,
                    },
                }
            );

        if (alreadySent) {
            return Response.json({
                status:
                    "already_sent",

                dateKey,
            });
        }

        const {
            start,
            end,
        } =
            getUtcRangeForLocalDate(
                dateKey,
                settings.timezone
            );

        const meals =
            await db.meal.findMany({
                where: {
                    eatenAt: {
                        gte: start,
                        lt: end,
                    },
                },

                orderBy: {
                    eatenAt: "asc",
                },
            });

        const totals =
            calculateDailyTotals(
                meals
            );

        const body =
            buildSummaryText(
                totals,
                settings.calorieGoal
            );

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
                            "Today's summary",

                        body,

                        url:
                            "/history",

                        tag:
                            `daily-summary-${dateKey}`,
                    }
                );

                sent++;
            } catch (error) {
                console.error(
                    "Daily push failed:",
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

        if (sent > 0) {
            await db.dailySummaryDelivery.create(
                {
                    data: {
                        dateKey,
                    },
                }
            );
        }

        return Response.json({
            status:
                sent > 0
                    ? "sent"
                    : "no_subscribers",

            dateKey,

            totals: {
                calories:
                    Math.round(
                        totals.calories
                    ),

                protein:
                    Math.round(
                        totals.protein
                    ),

                carbs:
                    Math.round(
                        totals.carbs
                    ),

                fat:
                    Math.round(
                        totals.fat
                    ),

                meals:
                    totals.meals,
            },

            subscriptions:
                subscriptions.length,

            sent,
            removed,
            failed,
        });
    } catch (error) {
        console.error(
            "Daily summary cron failed:",
            error
        );

        return Response.json(
            {
                error:
                    error instanceof
                    Error
                        ? error.message
                        : "Daily summary failed.",
            },
            {
                status: 500,
            }
        );
    }
}
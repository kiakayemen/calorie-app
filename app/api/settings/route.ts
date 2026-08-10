import {
    NextRequest,
} from "next/server";

import {
    auth,
} from "@clerk/nextjs/server";

import { db } from "@/lib/db";

export const runtime =
    "nodejs";

export const dynamic =
    "force-dynamic";

async function requireUserId() {
    const {
        userId,
    } =
        await auth();

    return userId;
}

export async function GET() {
    try {
        const userId =
            await requireUserId();

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

        const settings =
            await db.settings.upsert({
                where: {
                    userId,
                },

                update: {},

                create: {
                    userId,
                },
            });

        return Response.json({
            calorieGoal:
                settings.calorieGoal,

            notificationHour:
                settings.notificationHour,

            notificationMinute:
                settings.notificationMinute,

            timezone:
                settings.timezone,
        });
    } catch (error) {
        console.error(
            "GET /api/settings failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Couldn't load settings.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function PUT(
    request: NextRequest
) {
    try {
        const userId =
            await requireUserId();

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

        const calorieGoal =
            Number(
                body.calorieGoal
            );

        const notificationHour =
            Number(
                body.notificationHour
            );

        const notificationMinute =
            Number(
                body.notificationMinute
            );

        const timezone =
            typeof body.timezone ===
                "string"
                ? body.timezone.trim()
                : "";

        if (
            !Number.isInteger(
                calorieGoal
            ) ||
            calorieGoal < 500 ||
            calorieGoal > 10000
        ) {
            return Response.json(
                {
                    error:
                        "Calorie goal must be between 500 and 10,000.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(
                notificationHour
            ) ||
            notificationHour < 0 ||
            notificationHour > 23
        ) {
            return Response.json(
                {
                    error:
                        "Invalid notification hour.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            !Number.isInteger(
                notificationMinute
            ) ||
            notificationMinute < 0 ||
            notificationMinute > 59
        ) {
            return Response.json(
                {
                    error:
                        "Invalid notification minute.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!timezone) {
            return Response.json(
                {
                    error:
                        "Timezone is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const settings =
            await db.settings.upsert({
                where: {
                    userId,
                },

                update: {
                    calorieGoal,
                    notificationHour,
                    notificationMinute,
                    timezone,
                },

                create: {
                    userId,
                    calorieGoal,
                    notificationHour,
                    notificationMinute,
                    timezone,
                },
            });

        return Response.json({
            calorieGoal:
                settings.calorieGoal,

            notificationHour:
                settings.notificationHour,

            notificationMinute:
                settings.notificationMinute,

            timezone:
                settings.timezone,
        });
    } catch (error) {
        console.error(
            "PUT /api/settings failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Couldn't save settings.",
            },
            {
                status: 500,
            }
        );
    }
}
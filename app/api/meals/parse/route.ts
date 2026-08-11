import { NextRequest } from "next/server";

import {
    AIError,
    parseMealWithAI,
} from "@/lib/ai";

export async function POST(
    request: NextRequest
) {
    try {
        const body =
            await request.json();

        const text =
            typeof body.text === "string"
                ? body.text.trim()
                : "";

        if (!text) {
            return Response.json(
                {
                    error:
                        "Tell me what you ate.",
                },
                {
                    status: 400,
                }
            );
        }

        if (text.length > 2000) {
            return Response.json(
                {
                    error:
                        "Meal description is too long.",
                },
                {
                    status: 400,
                }
            );
        }

        const meal =
            await parseMealWithAI(text, "user-id-placeholder");

        return Response.json(
            meal
        );
    } catch (error) {
        console.error(
            "POST /api/meals/parse failed:",
            error
        );

        const isDevelopment =
            process.env.NODE_ENV ===
            "development";

        if (
            error instanceof AIError
        ) {
            return Response.json(
                {
                    error:
                        isDevelopment
                            ? error.message
                            : "Couldn't estimate that meal.",

                    ...(isDevelopment
                        ? {
                            upstreamStatus:
                                error.status ??
                                null,

                            details:
                                error.details ??
                                null,
                        }
                        : {}),
                },
                {
                    status: 500,
                }
            );
        }

        return Response.json(
            {
                error:
                    isDevelopment &&
                    error instanceof Error
                        ? error.message
                        : "Couldn't estimate that meal.",
            },
            {
                status: 500,
            }
        );
    }
}
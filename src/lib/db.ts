import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

function getConnectionString() {
    const directUrl =
        process.env.DATABASE_URL_UNPOOLED;

    if (directUrl) {
        return directUrl;
    }

    const url =
        process.env.DATABASE_URL;

    if (!url) {
        return null;
    }

    try {
        const parsed = new URL(url);

        if (
            parsed.hostname.includes("-pooler.")
        ) {
            parsed.hostname = parsed.hostname.replace(
                "-pooler.",
                "."
            );
        }

        return parsed.toString();
    } catch {
        return url;
    }
}

const connectionString = getConnectionString();

if (!connectionString) {
    throw new Error(
        "DATABASE_URL is not configured."
    );
}

const globalForPrisma =
    globalThis as unknown as {
        prisma?: PrismaClient;
    };

const adapter =
    new PrismaPg({
        connectionString,
    });

export const db =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
    });

if (
    process.env.NODE_ENV !==
    "production"
) {
    globalForPrisma.prisma = db;
}

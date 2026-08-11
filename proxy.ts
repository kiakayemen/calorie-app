import {
    clerkMiddleware,
} from "@clerk/nextjs/server";

const publicRoutePrefixes = [
    "/sign-in",
    "/sign-up",
    "/api/cron/daily-summary",
];

function isPublicRoute(
    pathname: string
) {
    return publicRoutePrefixes.some(
        (
            prefix
        ) =>
            pathname ===
                prefix ||
            pathname.startsWith(
                `${prefix}/`
            )
    );
}

export default clerkMiddleware(
    async (
        auth,
        request
    ) => {
        if (
            !isPublicRoute(
                request.nextUrl.pathname
            )
        ) {
            await auth.protect();
        }
    }
);

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

        "/(api|trpc)(.*)",
    ],
};

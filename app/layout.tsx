import type {
    Metadata,
    Viewport,
} from "next";

import {
    ClerkProvider,
} from "@clerk/nextjs";

import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { AppDataProvider } from "@/components/app-data-provider";

import "./globals.css";

export const metadata: Metadata = {
    title: "Calorie",

    description:
        "A stupidly simple AI-powered calorie tracker.",

    applicationName:
        "Calorie",

    appleWebApp: {
        capable: true,
        title: "Calorie",
        statusBarStyle:
            "black-translucent",
    },

    icons: {
        apple:
            "/icons/icon-192.png",
    },
};

export const viewport: Viewport = {
    themeColor: "#0a0a0a",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <head>
                    <meta
                        name="darkreader-lock"
                    />
                </head>

                <body>
                    <ServiceWorkerRegister />

                    <AppDataProvider>
                        {children}
                    </AppDataProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}

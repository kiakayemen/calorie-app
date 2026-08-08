import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Calorie",
  description: "The stupidly simple calorie tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="darkreader-lock" />
      </head>

      <body>{children}</body>
    </html>
  );
}
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Build Radar",
  description:
    "Trust-first AI edge dashboard scaffold built around canonical events, ranked signals, and honest no-change states.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

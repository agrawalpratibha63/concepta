import type { Metadata } from "next";
import "./globals.css";
import "../index.css";

export const metadata: Metadata = {
  title: "Concepta — Personalized AI Learning",
  description: "Concepta is a personalized AI-powered learning platform for Class 11 Commerce students.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

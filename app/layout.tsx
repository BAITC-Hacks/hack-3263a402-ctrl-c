import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLITZ — станция навыков",
  description: "Саморазвитие по уровням: выбери тему, изучи теорию, закрепи практикой и создай проект.",
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
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}


import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Todo",
  description: "Phone login todo app with reminders and notifications",
};

type ThemeMode = "light" | "dark";

async function getInitialTheme(): Promise<ThemeMode> {
  const cookieStore = await cookies();
  const theme = cookieStore.get("todo-theme")?.value;
  return theme === "dark" || theme === "light" ? theme : "light";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialTheme = await getInitialTheme();

  return (
    <html lang="ko" className={initialTheme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      <body>
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}

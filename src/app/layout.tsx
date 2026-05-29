import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Todo",
  description: "Phone login todo app with reminders and notifications",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Todo",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "192x192", type: "image/png" }],
  },
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
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          <PwaInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import * as React from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "todo-theme";
const COOKIE_KEY = "todo-theme";

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function readStoredTheme(fallback: ThemeMode) {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return fallback;
}

function writeTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
  document.cookie = `${COOKIE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event("todo-theme-change"));
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: ThemeMode;
}) {
  const [theme, setThemeState] = React.useState<ThemeMode>(initialTheme);

  React.useEffect(() => {
    const storedTheme = readStoredTheme(initialTheme);
    applyTheme(storedTheme);
    writeTheme(storedTheme);
    const timer = window.setTimeout(() => {
      setThemeState(storedTheme);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [initialTheme]);

  React.useEffect(() => {
    applyTheme(theme);

    const handleThemeSync = () => {
      setThemeState(readStoredTheme(theme));
    };

    window.addEventListener("storage", handleThemeSync);
    window.addEventListener("todo-theme-change", handleThemeSync as EventListener);

    return () => {
      window.removeEventListener("storage", handleThemeSync);
      window.removeEventListener("todo-theme-change", handleThemeSync as EventListener);
    };
  }, [theme]);

  const setTheme = React.useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    writeTheme(nextTheme);
  }, []);

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

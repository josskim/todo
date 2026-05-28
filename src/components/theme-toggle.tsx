"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button type="button" variant="secondary" onClick={() => setTheme(isDark ? "light" : "dark")} className="h-11 px-4">
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      {isDark ? "라이트" : "다크"}
    </Button>
  );
}

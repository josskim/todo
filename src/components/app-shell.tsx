"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, ListTodo, Settings2, BarChart3, LogOut, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui";
import { logoutAction } from "@/app/actions/auth";
import { ReminderHeartbeat } from "@/components/reminder-heartbeat";

const navItems = [
  { href: "/todos", label: "할 일", icon: ListTodo },
  { href: "/statistics", label: "통계", icon: BarChart3 },
  { href: "/settings", label: "설정", icon: Settings2 },
];

export function AppShell({
  children,
  userPhone,
  userName,
}: {
  children: React.ReactNode;
  userPhone: string;
  userName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen text-[var(--foreground)]">
      <ReminderHeartbeat />
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-4 p-4 md:p-6">
        <aside className="hidden w-[280px] flex-col rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.07)] lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-weak)] text-[var(--accent)]">
              <CalendarCheck2 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">Todo</div>
              <div className="text-xs text-[var(--muted)]">개인 할 일 관리</div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] bg-[linear-gradient(135deg,rgba(219,84,97,0.14),rgba(96,76,130,0.08))] p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--muted)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              Session
            </div>
            <div className="mt-2 text-sm font-semibold">{userName || userPhone}</div>
            <div className="text-xs text-[var(--muted)]">{userPhone}</div>
          </div>

          <nav className="mt-6 flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--accent)] text-white shadow-lg shadow-[rgba(219,84,97,0.22)]"
                      : "text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 space-y-3">
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" className="w-full justify-start">
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </form>
          </div>
        </aside>

        <main className="flex-1">
          <header className="glass soft-shadow mb-4 flex items-center justify-between rounded-[28px] px-4 py-3 md:px-5">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-weak)] text-[var(--accent)]">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-black leading-none">Todo</div>
                <div className="text-[11px] text-[var(--muted)]">개인 할 일 관리</div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="text-sm font-semibold">{userName || userPhone}</div>
              <div className="text-xs text-[var(--muted)]">{userPhone}</div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action={logoutAction}>
                <Button type="submit" variant="secondary" className="h-11 px-4">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">로그아웃</span>
                </Button>
              </form>
            </div>
          </header>

          <div className="pb-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

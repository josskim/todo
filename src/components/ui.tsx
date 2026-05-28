"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-[var(--accent)] text-white hover:opacity-95",
    secondary: "bg-[var(--surface-soft)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--surface-soft)_78%,white)]",
    ghost: "bg-transparent text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5",
    danger: "bg-[var(--danger)] text-white hover:opacity-95",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
}) {
  const tones = {
    neutral: "bg-black/5 text-[var(--foreground)] dark:bg-white/10",
    success: "bg-[color-mix(in_srgb,var(--success)_16%,white)] text-[var(--success)] dark:bg-[color-mix(in_srgb,var(--success)_24%,black)]",
    warning: "bg-[color-mix(in_srgb,var(--warning)_16%,white)] text-[var(--warning)] dark:bg-[color-mix(in_srgb,var(--warning)_24%,black)]",
    danger: "bg-[color-mix(in_srgb,var(--danger)_16%,white)] text-[var(--danger)] dark:bg-[color-mix(in_srgb,var(--danger)_24%,black)]",
    accent: "bg-[var(--accent-weak)] text-[var(--accent)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        aria-label="close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
      />
      <div className="relative z-[101] w-full max-w-3xl rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.28)] md:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose} className="h-10 px-3">
            닫기
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}


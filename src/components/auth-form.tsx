"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";

type AuthState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function ErrorList({ errors }: { errors?: Record<string, string[]> }) {
  if (!errors) return null;
  const messages = Object.values(errors).flat().filter(Boolean);
  if (messages.length === 0) return null;
  return (
    <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_20%,white)] bg-[color-mix(in_srgb,var(--danger)_10%,white)] p-4 text-sm text-[var(--danger)]">
      {messages.map((message, index) => (
        <div key={index}>{message}</div>
      ))}
    </div>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function PhoneInput() {
  const [value, setValue] = useState("");

  return (
    <Input
      name="phone"
      inputMode="numeric"
      autoComplete="tel"
      maxLength={13}
      value={value}
      onChange={(event) => setValue(formatPhone(event.target.value))}
      placeholder="010-1234-5678"
    />
  );
}

export function LoginForm({
  action,
}: {
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold">휴대폰번호</label>
        <PhoneInput />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">비밀번호</label>
        <Input name="password" type="password" placeholder="비밀번호" />
      </div>
      <ErrorList errors={state.errors} />
      <Button type="submit" className="w-full" disabled={pending} loading={pending}>
        {pending ? "로그인 중..." : "로그인"}
      </Button>
      <div className="text-center text-sm text-[var(--muted)]">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-semibold text-[var(--accent)]">
          바로 가입
        </Link>
      </div>
    </form>
  );
}

export function SignupForm({
  action,
}: {
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold">이름(선택)</label>
        <Input name="name" placeholder="사용자 이름" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">휴대폰번호</label>
        <PhoneInput />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">비밀번호</label>
        <Input name="password" type="password" placeholder="4자 이상" />
      </div>
      <ErrorList errors={state.errors} />
      <Button type="submit" className="w-full" disabled={pending} loading={pending}>
        {pending ? "가입 중..." : "즉시 가입"}
      </Button>
      <div className="text-center text-sm text-[var(--muted)]">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)]">
          로그인
        </Link>
      </div>
    </form>
  );
}

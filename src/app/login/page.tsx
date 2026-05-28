import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-form";
import { loginAction } from "@/app/actions/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/todos");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass soft-shadow w-full max-w-md rounded-[32px] border border-[var(--border)] p-6 md:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full bg-[var(--accent-weak)] px-3 py-1 text-[11px] font-bold tracking-[0.28em] text-[var(--accent)]">
            TODO LOGIN
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">로그인</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            핸드폰번호와 비밀번호로 바로 들어갑니다.
          </p>
        </div>
        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}


import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth-form";
import { signupAction } from "@/app/actions/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/todos");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass soft-shadow w-full max-w-md rounded-[32px] border border-[var(--border)] p-6 md:p-8">
        <div className="mb-6">
          <div className="inline-flex rounded-full bg-[var(--accent-weak)] px-3 py-1 text-[11px] font-bold tracking-[0.28em] text-[var(--accent)]">
            TODO SIGN UP
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">즉시 가입</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            핸드폰번호가 중복이면 가입할 수 없습니다.
          </p>
        </div>
        <SignupForm action={signupAction} />
      </div>
    </div>
  );
}


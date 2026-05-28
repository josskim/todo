"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie, SESSION_COOKIE } from "@/lib/session";
import { loginSchema, signUpSchema } from "@/lib/validators";

type AuthState = {
  errors?: Record<string, string[]>;
  message?: string;
};

async function issueSession(userId: string) {
  const cookieStore = await cookies();
  setSessionCookie(cookieStore, createSessionToken(userId));
}

export async function signupAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { phone, password, name } = parsed.data;
  const existing = await prisma.todoUser.findUnique({ where: { phone } });
  if (existing) {
    return { errors: { phone: ["이미 가입된 핸드폰번호입니다."] } };
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.todoUser.create({
    data: {
      phone,
      password: hashed,
      name: name || null,
      categories: {
        create: [
          { name: "기본", color: "#db5461", sortOrder: 0 },
          { name: "업무", color: "#6d73ff", sortOrder: 1 },
        ],
      },
    },
  });

  await issueSession(user.id);
  redirect("/todos");
}

export async function loginAction(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { phone, password } = parsed.data;
  const user = await prisma.todoUser.findUnique({ where: { phone } });
  if (!user || !user.isActive) {
    return { errors: { phone: ["가입 정보를 찾을 수 없습니다."] } };
  }

  const matched = await bcrypt.compare(password, user.password);
  if (!matched) {
    return { errors: { password: ["비밀번호가 일치하지 않습니다."] } };
  }

  await issueSession(user.id);
  redirect("/todos");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

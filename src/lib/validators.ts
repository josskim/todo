import * as z from "zod";

export const phoneSchema = z
  .string()
  .min(10, "핸드폰번호를 입력해 주세요.")
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length >= 10 && value.length <= 11, "핸드폰번호 형식이 올바르지 않습니다.");

export const passwordSchema = z
  .string()
  .min(4, "비밀번호는 4자 이상 입력해 주세요.")
  .max(100, "비밀번호가 너무 깁니다.");

export const signUpSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  name: z.string().trim().max(100).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export const todoStatusSchema = z.enum(["todo", "doing", "done", "archived", "deleted"]);

export const prioritySchema = z.coerce.number().int().min(1).max(3);

const optionalFormString = z.preprocess((value) => (value === null ? "" : value), z.string().trim().optional().or(z.literal("")));

export const todoFormSchema = z.object({
  title: z.string().trim().min(1, "할일을 입력해 주세요.").max(200),
  content: optionalFormString.pipe(z.string().max(10000)),
  status: todoStatusSchema.default("todo"),
  priority: prioritySchema.default(2),
  categoryId: optionalFormString,
  dueDate: optionalFormString,
  reminderAt: optionalFormString,
  tagNames: z.array(z.string().trim().min(1)).default([]),
  tagIds: z.array(z.string().trim().min(1)).default([]),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "카테고리 이름을 입력해 주세요.").max(80),
  color: z.string().trim().max(20).optional().or(z.literal("")),
});

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, "태그 이름을 입력해 주세요.").max(50),
  color: z.string().trim().max(20).optional().or(z.literal("")),
});

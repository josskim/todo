"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nowKst, parseKstDateTimeLocal } from "@/lib/time";
import { categoryFormSchema, tagFormSchema, todoFormSchema, todoStatusSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sweepDueReminders } from "@/lib/reminders";

type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

async function writeHistory(params: {
  todoId: bigint;
  userId: string;
  action: string;
  beforeValue?: unknown;
  afterValue?: unknown;
}) {
  await prisma.todoHistory.create({
    data: {
      todoId: params.todoId,
      userId: params.userId,
      action: params.action,
      beforeValue: params.beforeValue as Prisma.InputJsonValue | undefined,
      afterValue: params.afterValue as Prisma.InputJsonValue | undefined,
    },
  });
}

async function ensureCategory(userId: string, categoryId?: string | null) {
  if (!categoryId) return null;
  const category = await prisma.todoCategory.findFirst({
    where: { id: categoryId, userId },
  });
  return category?.id ?? null;
}

async function upsertTags(userId: string, tagNames: string[]) {
  const trimmed = [...new Set(tagNames.map((tag) => tag.trim()).filter(Boolean))];
  const tagIds: string[] = [];

  for (const name of trimmed) {
    const tag = await prisma.todoTag.upsert({
      where: {
        userId_name: { userId, name },
      },
      update: {},
      create: {
        userId,
        name,
      },
    });
    tagIds.push(tag.id);
  }

  return tagIds;
}

function parseTagNamesInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fallback to comma-separated parsing below
    }
  }

  return trimmed
    .split(/[,，\n]/g)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseTagIdsInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    return trimmed
      .split(/[,，\n]/g)
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export async function createTodoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = todoFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    categoryId: formData.get("categoryId"),
    dueDate: formData.get("dueDate"),
    reminderAt: formData.get("reminderAt"),
    tagNames: parseTagNamesInput(formData.get("tagNames")),
    tagIds: parseTagIdsInput(formData.get("tagIds")),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false };
  }

  const data = parsed.data;
  const categoryId = await ensureCategory(user.id, data.categoryId || null);
  const dueDate = parseKstDateTimeLocal(data.dueDate || null);
  const reminderAt = parseKstDateTimeLocal(data.reminderAt || null);
  const tagIds = data.tagIds.length > 0 ? data.tagIds : await upsertTags(user.id, data.tagNames);

  const todo = await prisma.todoTodo.create({
    data: {
      userId: user.id,
      categoryId,
      title: data.title,
      content: data.content || null,
      status: data.status,
      priority: data.priority,
      dueDate,
      ...(data.status === "done" ? { completedAt: nowKst() } : {}),
      tags: {
        create: tagIds.map((tagId) => ({ tagId })),
      },
      reminders: reminderAt
        ? {
            create: {
              userId: user.id,
              remindAt: reminderAt,
            },
          }
        : undefined,
    },
  });

  await writeHistory({
    todoId: todo.id,
    userId: user.id,
    action: "create",
    afterValue: {
      title: todo.title,
      status: todo.status,
      priority: todo.priority,
    },
  });

  revalidatePath("/todos");
  revalidatePath("/statistics");
  return { success: true, message: "할 일이 추가되었습니다." };
}

export async function updateTodoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const todoIdText = String(formData.get("todoId") || "");
  if (!todoIdText) return { success: false, errors: { todoId: ["할 일 ID가 필요합니다."] } };

  const todoId = BigInt(todoIdText);
  const existing = await prisma.todoTodo.findFirst({
    where: { id: todoId, userId: user.id, deletedAt: null },
    include: { tags: true, reminders: true },
  });
  if (!existing) {
    return { success: false, errors: { todoId: ["수정할 수 없는 할 일입니다."] } };
  }

  const parsed = todoFormSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    categoryId: formData.get("categoryId"),
    dueDate: formData.get("dueDate"),
    reminderAt: formData.get("reminderAt"),
    tagNames: parseTagNamesInput(formData.get("tagNames")),
    tagIds: parseTagIdsInput(formData.get("tagIds")),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, success: false };
  }

  const data = parsed.data;
  const categoryId = await ensureCategory(user.id, data.categoryId || null);
  const dueDate = parseKstDateTimeLocal(data.dueDate || null);
  const reminderAt = parseKstDateTimeLocal(data.reminderAt || null);
  const tagIds = data.tagIds.length > 0 ? data.tagIds : await upsertTags(user.id, data.tagNames);

  await prisma.$transaction(async (tx) => {
    await tx.todoTodo.update({
      where: { id: todoId },
      data: {
        categoryId,
        title: data.title,
        content: data.content || null,
        status: data.status,
        priority: data.priority,
        dueDate,
        completedAt: data.status === "done" ? existing.completedAt ?? nowKst() : null,
      },
    });

    await tx.todoTodoTag.deleteMany({ where: { todoId } });
    if (tagIds.length > 0) {
      await tx.todoTodoTag.createMany({
        data: tagIds.map((tagId) => ({ todoId, tagId })),
      });
    }

    await tx.todoReminder.deleteMany({ where: { todoId } });
    if (reminderAt) {
      await tx.todoReminder.create({
        data: {
          todoId,
          userId: user.id,
          remindAt: reminderAt,
        },
      });
    }
  });

  await writeHistory({
    todoId,
    userId: user.id,
    action: "update",
    beforeValue: {
      title: existing.title,
      status: existing.status,
      priority: existing.priority,
    },
    afterValue: {
      title: data.title,
      status: data.status,
      priority: data.priority,
    },
  });

  revalidatePath("/todos");
  revalidatePath("/statistics");
  return { success: true, message: "할 일이 수정되었습니다." };
}

export async function toggleTodoStatusAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const todoId = BigInt(String(formData.get("todoId") || "0"));
  const status = todoStatusSchema.parse(String(formData.get("status") || "todo"));

  const existing = await prisma.todoTodo.findFirst({
    where: { id: todoId, userId: user.id, deletedAt: null },
  });
  if (!existing) return { success: false, message: "할 일을 찾을 수 없습니다." };

  const nextCompletedAt = status === "done" ? existing.completedAt ?? nowKst() : null;
  await prisma.todoTodo.update({
    where: { id: todoId },
    data: {
      status,
      completedAt: nextCompletedAt,
    },
  });

  await writeHistory({
    todoId,
    userId: user.id,
    action: "status",
    beforeValue: { status: existing.status },
    afterValue: { status },
  });

  revalidatePath("/todos");
  revalidatePath("/statistics");
  return { success: true, message: "상태가 변경되었습니다." };
}

export async function deleteTodoAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const todoId = BigInt(String(formData.get("todoId") || "0"));
  const existing = await prisma.todoTodo.findFirst({
    where: { id: todoId, userId: user.id, deletedAt: null },
  });
  if (!existing) return { success: false, message: "할 일을 찾을 수 없습니다." };

  await prisma.todoTodo.update({
    where: { id: todoId },
    data: { deletedAt: nowKst(), status: "deleted" },
  });

  await writeHistory({
    todoId,
    userId: user.id,
    action: "delete",
    beforeValue: { title: existing.title, status: existing.status },
  });

  revalidatePath("/todos");
  revalidatePath("/statistics");
  return { success: true, message: "할 일이 삭제되었습니다." };
}

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = categoryFormSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.todoCategory.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        color: parsed.data.color || null,
      },
    });
  } catch {
    return { success: false, errors: { name: ["이미 존재하는 카테고리입니다."] } };
  }

  revalidatePath("/todos");
  revalidatePath("/settings");
  return { success: true, message: "카테고리가 추가되었습니다." };
}

export async function deleteCategoryAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const categoryId = String(formData.get("categoryId") || "");
  if (!categoryId) return { success: false, message: "카테고리 ID가 필요합니다." };

  const existing = await prisma.todoCategory.findFirst({
    where: { id: categoryId, userId: user.id },
  });
  if (!existing) {
    return { success: false, message: "삭제할 카테고리를 찾지 못했습니다." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.todoTodo.updateMany({
      where: { categoryId, userId: user.id },
      data: { categoryId: null },
    });

    await tx.todoCategory.delete({
      where: { id: categoryId },
    });
  });

  revalidatePath("/todos");
  revalidatePath("/settings");
  return { success: true, message: "카테고리가 삭제되었습니다." };
}

export async function createTagAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = tagFormSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };

  try {
    await prisma.todoTag.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        color: parsed.data.color || null,
      },
    });
  } catch {
    return { success: false, errors: { name: ["이미 존재하는 태그입니다."] } };
  }

  revalidatePath("/todos");
  revalidatePath("/settings");
  return { success: true, message: "태그가 추가되었습니다." };
}

export async function markNotificationReadAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const notificationId = String(formData.get("notificationId") || "");
  if (!notificationId) return { success: false, message: "알림 ID가 필요합니다." };

  await prisma.todoNotification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { isRead: true, readAt: nowKst() },
  });

  revalidatePath("/todos");
  return { success: true };
}

export async function dismissReminderAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId") || "");
  if (!reminderId) return { success: false, message: "리마인더 ID가 필요합니다." };

  await prisma.todoReminder.updateMany({
    where: { id: reminderId, userId: user.id },
    data: {
      dismissedAt: nowKst(),
      isActive: false,
    },
  });

  revalidatePath("/todos");
  return { success: true, message: "알림이 해제되었습니다." };
}

export async function sweepRemindersAction() {
  const result = await sweepDueReminders();
  return { success: true, processed: result.processed };
}

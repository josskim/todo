import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { TodoDashboard } from "@/components/todo-dashboard";

export default async function TodosPage() {
  const user = await requireUser();
  const [todos, categories, tags, notifications, reminders] = await Promise.all([
    prisma.todoTodo.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: [{ createdAt: "desc" }],
      include: {
        category: true,
        tags: { include: { tag: true } },
        reminders: true,
      },
    }),
    prisma.todoCategory.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.todoTag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.todoNotification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.todoReminder.findMany({
      where: { userId: user.id, isActive: true, dismissedAt: null },
      include: { todo: true },
      orderBy: { remindAt: "asc" },
      take: 20,
    }),
  ]);

  return (
    <TodoDashboard
      todos={todos.map((todo) => ({
        ...todo,
        id: todo.id.toString(),
        reminders: todo.reminders.map((reminder) => ({
          ...reminder,
          id: reminder.id.toString(),
          todoId: reminder.todoId.toString(),
        })),
        tags: todo.tags.map((todoTag) => ({
          ...todoTag,
          id: todoTag.id.toString(),
          todoId: todoTag.todoId.toString(),
        })),
      }))}
      categories={categories}
      tags={tags}
      notifications={notifications.map((notification) => ({
        ...notification,
        todoId: notification.todoId?.toString() ?? null,
      }))}
      reminders={reminders.map((reminder) => ({
        ...reminder,
        id: reminder.id.toString(),
        todoId: reminder.todoId.toString(),
      }))}
    />
  );
}

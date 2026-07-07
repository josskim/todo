import { prisma } from "@/lib/prisma";
import { nowKst } from "@/lib/time";
import { sendPushToUser } from "@/lib/push";
import { getNextRepeatReminderAt, type ReminderRepeatConfig, type ReminderRepeatType } from "@/lib/reminder-repeat";

type SweepOptions = {
  userId?: string;
  take?: number;
};

export async function sweepDueReminders(options: SweepOptions = {}) {
  const now = nowKst();
  const where = {
    isActive: true,
    dismissedAt: null,
    remindAt: { lte: now },
    ...(options.userId ? { userId: options.userId } : {}),
  };

  const dueReminders = await prisma.todoReminder.findMany({
    where,
    include: {
      todo: true,
      user: true,
    },
    orderBy: { remindAt: "asc" },
    take: options.take ?? 50,
  });

  let processed = 0;

  for (const reminder of dueReminders) {
    const repeatType = (reminder.repeatType || "once") as ReminderRepeatType;
    const lastNotified = reminder.lastNotifiedAt?.getTime() ?? 0;
    const elapsed = now.getTime() - lastNotified;
    const needsNotify = repeatType === "once"
      ? !reminder.lastNotifiedAt
      : elapsed >= reminder.repeatIntervalMinutes * 60 * 1000;
    if (!needsNotify) continue;

    processed += 1;

    const nextReminderAt = repeatType === "once"
      ? null
      : getNextRepeatReminderAt(repeatType, reminder.repeatConfig as ReminderRepeatConfig | null, now);

    await prisma.todoReminder.update({
      where: { id: reminder.id },
      data: repeatType === "once"
        ? { lastNotifiedAt: now, dismissedAt: now, isActive: false }
        : {
            lastNotifiedAt: now,
            remindAt: nextReminderAt || reminder.remindAt,
            isActive: Boolean(nextReminderAt),
          },
    });

    const title = `알림: ${reminder.todo.title}`;
    const body = reminder.todo.content ? reminder.todo.content.slice(0, 120) : "할 일 알림이 도착했습니다.";

    await prisma.todoNotification.create({
      data: {
        userId: reminder.userId,
        todoId: reminder.todoId,
        title,
        body,
        kind: "reminder",
      },
    });

    await sendPushToUser(reminder.userId, title, body, "/todos");
  }

  return { processed, total: dueReminders.length };
}

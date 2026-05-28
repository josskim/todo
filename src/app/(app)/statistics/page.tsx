import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Badge } from "@/components/ui";

export default async function StatisticsPage() {
  const user = await requireUser();
  const [todos, categories, reminders, notifications] = await Promise.all([
    prisma.todoTodo.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { status: true, priority: true, dueDate: true, createdAt: true },
    }),
    prisma.todoCategory.count({ where: { userId: user.id } }),
    prisma.todoReminder.count({ where: { userId: user.id, isActive: true, dismissedAt: null } }),
    prisma.todoNotification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  const counts = {
    todo: todos.filter((todo) => todo.status === "todo").length,
    doing: todos.filter((todo) => todo.status === "doing").length,
    done: todos.filter((todo) => todo.status === "done").length,
    archived: todos.filter((todo) => todo.status === "archived").length,
  };

  const priorityCounts = {
    1: todos.filter((todo) => todo.priority === 1).length,
    2: todos.filter((todo) => todo.priority === 2).length,
    3: todos.filter((todo) => todo.priority === 3).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.28em] text-[var(--muted)]">Statistics</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">할 일 현황</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="전체 할 일" value={String(todos.length)} />
        <StatCard label="미읽음 알림" value={String(notifications)} />
        <StatCard label="활성 리마인더" value={String(reminders)} />
        <StatCard label="카테고리" value={String(categories)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="상태별">
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">todo {counts.todo}</Badge>
            <Badge tone="accent">doing {counts.doing}</Badge>
            <Badge tone="success">done {counts.done}</Badge>
            <Badge tone="warning">archived {counts.archived}</Badge>
          </div>
        </Panel>
        <Panel title="우선순위">
          <div className="flex flex-wrap gap-2">
            <Badge tone="danger">높음 {priorityCounts[1]}</Badge>
            <Badge tone="warning">보통 {priorityCounts[2]}</Badge>
            <Badge tone="neutral">낮음 {priorityCounts[3]}</Badge>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
      <div className="text-sm text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}


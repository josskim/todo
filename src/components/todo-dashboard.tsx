"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Tag, Trash2, PencilLine, BellRing } from "lucide-react";
import { Badge, Button, Input, Modal, Select, Textarea } from "@/components/ui";
import {
  createTodoAction,
  deleteTodoAction,
  dismissReminderAction,
  markNotificationReadAction,
  toggleTodoStatusAction,
  updateTodoAction,
} from "@/app/actions/todo-actions";
import {
  formatDatetimeLocal,
  formatKstDateTime,
  todoPriorityLabels,
  todoPriorityTones,
  todoStatusLabels,
  todoStatusTones,
} from "@/lib/todo";

type Category = {
  id: string;
  name: string;
  color?: string | null;
};

type TagItem = {
  id: string;
  name: string;
  color?: string | null;
};

type TodoTagRelation = {
  id: string;
  todoId: string;
  tag: TagItem;
};

type TodoReminder = {
  id: string;
  todoId: string;
  remindAt: Date | string;
  repeatIntervalMinutes: number;
  lastNotifiedAt: Date | string | null;
  dismissedAt: Date | string | null;
  isActive: boolean;
};

type TodoItem = {
  id: string;
  title: string;
  content: string | null;
  status: string;
  priority: number;
  dueDate: Date | string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category: Category | null;
  tags: TodoTagRelation[];
  reminders: TodoReminder[];
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  kind: string;
  isRead: boolean;
  createdAt: Date | string;
  todoId: string | null;
};

type ReminderItem = {
  id: string;
  todoId: string;
  remindAt: Date | string;
  repeatIntervalMinutes: number;
  lastNotifiedAt: Date | string | null;
  dismissedAt: Date | string | null;
  isActive: boolean;
  todo: { title: string };
};

function emptyState() {
  return { success: false, message: "", errors: undefined as Record<string, string[]> | undefined };
}

function TodoFormModal({
  open,
  mode,
  todo,
  categories,
  tags,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  todo: TodoItem | null;
  categories: Category[];
  tags: TagItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const action = mode === "create" ? createTodoAction : updateTodoAction;
  const [state, formAction, pending] = useActionState(action, emptyState());
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => todo?.tags.map((item) => item.tag.id) || []);
  const reminderValue = todo?.reminders.find((reminder) => reminder.isActive && !reminder.dismissedAt)?.remindAt ?? "";

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, onClose, router]);

  if (!open) return null;

  return (
    <Modal open={open} title={mode === "create" ? "할 일 추가" : "할 일 수정"} onClose={onClose}>
      <form action={formAction} className="space-y-4">
        {mode === "edit" && <input type="hidden" name="todoId" value={todo?.id || ""} />}
        <input type="hidden" name="tagIds" value={JSON.stringify(selectedTagIds)} />
        <input type="hidden" name="dueDate" value="" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">할일</label>
            <Textarea name="title" defaultValue={todo?.title || ""} rows={3} placeholder="해야 할 일을 입력하세요" />
            {state.errors?.title && <p className="text-xs text-[var(--danger)]">{state.errors.title[0]}</p>}
          </div>

          <input type="hidden" name="content" value={todo?.content || ""} />

          <div className="space-y-2">
            <label className="text-sm font-semibold">상태</label>
            <Select name="status" defaultValue={todo?.status || "todo"}>
              {Object.entries(todoStatusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">우선순위</label>
            <Select name="priority" defaultValue={String(todo?.priority || 2)}>
              <option value="1">높음</option>
              <option value="2">보통</option>
              <option value="3">낮음</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">카테고리</label>
            <Select name="categoryId" defaultValue={todo?.category?.id || ""}>
              <option value="">선택 안 함</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">알림 시간</label>
            <Input name="reminderAt" type="datetime-local" defaultValue={formatDatetimeLocal(reminderValue)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">태그</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => {
                      setSelectedTagIds((current) =>
                        current.includes(tag.id) ? current.filter((id) => id !== tag.id) : [...current, tag.id],
                      );
                    }}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--muted)]">이미 만들어둔 태그 중에서 선택하세요. 선택하지 않아도 저장됩니다.</p>
          </div>
        </div>

        {state.errors && (
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_20%,white)] bg-[color-mix(in_srgb,var(--danger)_10%,white)] p-4 text-sm text-[var(--danger)]">
            {Object.values(state.errors)
              .flat()
              .map((error, index) => (
                <div key={index}>{error}</div>
              ))}
          </div>
        )}

        {state.message && <div className="text-sm font-semibold text-[var(--success)]">{state.message}</div>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "저장 중..." : mode === "create" ? "추가" : "수정"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReminderCard({
  reminder,
  onDismiss,
}: {
  reminder: ReminderItem;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold">{reminder.todo.title}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {formatKstDateTime(reminder.remindAt)}
          </div>
        </div>
        <Button variant="secondary" className="h-9 px-3" onClick={() => onDismiss(reminder.id)}>
          해제
        </Button>
      </div>
    </div>
  );
}

export function TodoDashboard({
  todos,
  categories,
  tags,
  notifications,
  reminders,
}: {
  todos: TodoItem[];
  categories: Category[];
  tags: TagItem[];
  notifications: NotificationItem[];
  reminders: ReminderItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc");

  const filteredTodos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return todos
      .filter((todo) => {
        if (statusFilter !== "all" && todo.status !== statusFilter) return false;
        if (categoryFilter !== "all" && todo.category?.id !== categoryFilter) return false;
        if (priorityFilter !== "all" && String(todo.priority) !== priorityFilter) return false;
        if (!term) return true;
        const tagText = todo.tags.map((item) => item.tag.name).join(" ");
        return [todo.title, todo.content || "", todo.category?.name || "", tagText]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "priority_asc":
            return a.priority - b.priority || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "priority_desc":
            return b.priority - a.priority || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "created_asc":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "created_desc":
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [todos, search, statusFilter, categoryFilter, priorityFilter, sortBy]);

  const stats = useMemo(() => {
    return {
      total: todos.length,
      done: todos.filter((todo) => todo.status === "done").length,
      unread: notifications.filter((notification) => !notification.isRead).length,
    };
  }, [todos, notifications]);

  const openCreate = () => {
    setEditingTodo(null);
    setModalKey((current) => current + 1);
    setOpen(true);
  };

  const openEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setModalKey((current) => current + 1);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingTodo(null);
  };

  const handleQuickStatus = async (todo: TodoItem, nextStatus: string) => {
    const formData = new FormData();
    formData.append("todoId", todo.id);
    formData.append("status", nextStatus);
    await toggleTodoStatusAction(formData);
    router.refresh();
  };

  const handleDelete = async (todo: TodoItem) => {
    if (!confirm(`"${todo.title}"을(를) 삭제할까요?`)) return;
    const formData = new FormData();
    formData.append("todoId", todo.id);
    await deleteTodoAction(formData);
    router.refresh();
  };

  const handleDismissReminder = async (reminderId: string) => {
    const formData = new FormData();
    formData.append("reminderId", reminderId);
    await dismissReminderAction(formData);
    router.refresh();
  };

  const handleReadNotification = async (notificationId: string) => {
    const formData = new FormData();
    formData.append("notificationId", notificationId);
    await markNotificationReadAction(formData);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {open && (
        <TodoFormModal
          key={`${editingTodo?.id || "create"}-${modalKey}`}
          open={open}
          mode={editingTodo ? "edit" : "create"}
          todo={editingTodo}
          categories={categories}
          tags={tags}
          onClose={closeModal}
        />
      )}

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full bg-[var(--accent-weak)] px-3 py-1 text-[11px] font-bold tracking-[0.28em] text-[var(--accent)]">
                TODAY&apos;S TODO
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">할 일 목록</h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                검색, 필터, 정렬로 빠르게 전환하며 관리하세요.
              </p>
            </div>
            <Button onClick={openCreate} className="h-12 px-5">
              <Plus className="h-4 w-4" />
              할 일 추가
            </Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatPill label="전체" value={stats.total} tone="neutral" />
            <StatPill label="완료" value={stats.done} tone="success" />
            <StatPill label="미읽음" value={stats.unread} tone="accent" />
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="할일, 비고, 태그 검색" />
            </div>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">상태 전체</option>
              {Object.entries(todoStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="created_desc">최신순</option>
              <option value="created_asc">오래된순</option>
              <option value="priority_desc">우선순위 높은순</option>
              <option value="priority_asc">우선순위 낮은순</option>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="max-w-[220px]">
              <option value="all">카테고리 전체</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="max-w-[180px]">
              <option value="all">우선순위 전체</option>
              <option value="1">높음</option>
              <option value="2">보통</option>
              <option value="3">낮음</option>
            </Select>
          </div>

          <div className="mt-6 grid gap-3">
            {filteredTodos.map((todo) => {
              const latestReminder = todo.reminders.find((reminder) => reminder.isActive && !reminder.dismissedAt);
              const isDone = todo.status === "done";
              return (
                <article
                  key={todo.id}
                  className={`rounded-[28px] border p-4 transition ${
                    isDone
                      ? "border-[color-mix(in_srgb,var(--success)_22%,var(--border))] bg-[color-mix(in_srgb,var(--surface-soft)_72%,var(--surface))] opacity-70"
                      : "border-[var(--border)] bg-[var(--surface)] hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={todoStatusTones[todo.status] || "neutral"}>{todoStatusLabels[todo.status] || todo.status}</Badge>
                        <Badge tone={todoPriorityTones[todo.priority] || "neutral"}>{todoPriorityLabels[todo.priority] || todo.priority}</Badge>
                        {todo.category && <Badge tone="accent">{todo.category.name}</Badge>}
                      </div>
                      <h3
                        className={`mt-3 whitespace-pre-line text-lg font-black tracking-tight ${
                          isDone ? "text-[var(--muted)] line-through decoration-[var(--success)] decoration-2 underline-offset-4" : ""
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.content && (
                        <p className={`mt-2 line-clamp-2 text-sm text-[var(--muted)] ${isDone ? "line-through decoration-[var(--success)]" : ""}`}>
                          {todo.content}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {todo.tags.map((relation) => (
                          <Badge key={relation.id} tone="neutral">
                            <Tag className="mr-1 h-3 w-3" />
                            {relation.tag.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                        {latestReminder && (
                          <span className="inline-flex items-center gap-1">
                            <BellRing className="h-3.5 w-3.5" />
                            {formatKstDateTime(latestReminder.remindAt)}
                            알림
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <Button variant="secondary" className="h-10 px-3" onClick={() => openEdit(todo)}>
                        <PencilLine className="h-4 w-4" />
                        수정
                      </Button>
                      {todo.status !== "done" ? (
                        <Button className="h-10 px-3" onClick={() => handleQuickStatus(todo, "done")}>
                          <CheckCircle2 className="h-4 w-4" />
                          완료
                        </Button>
                      ) : (
                        <Button variant="secondary" className="h-10 px-3" onClick={() => handleQuickStatus(todo, "todo")}>
                          되돌리기
                        </Button>
                      )}
                      <Button variant="danger" className="h-10 px-3" onClick={() => handleDelete(todo)}>
                        <Trash2 className="h-4 w-4" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredTodos.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center text-sm text-[var(--muted)]">
                조건에 맞는 할 일이 없습니다. 새 할 일을 추가해 보세요.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <Panel title="최근 알림">
            {notifications.length === 0 ? (
              <EmptyState text="아직 알림이 없습니다." />
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                    className={`rounded-[22px] border p-4 ${notification.isRead ? "border-[var(--border)] bg-[var(--surface)]" : "border-[var(--accent-weak)] bg-[var(--surface-soft)]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold">{notification.title}</div>
                        <div className="mt-1 text-xs text-[var(--muted)]">{notification.body}</div>
                      </div>
                      {!notification.isRead && (
                        <Button variant="secondary" className="h-8 px-3" onClick={() => handleReadNotification(notification.id)}>
                          읽음
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="활성 알림">
            {reminders.length === 0 ? (
              <EmptyState text="활성 리마인더가 없습니다." />
            ) : (
              <div className="space-y-3">
                {reminders.slice(0, 5).map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} onDismiss={handleDismissReminder} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="카테고리">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category.id} tone="accent">
                  {category.name}
                </Badge>
              ))}
              {categories.length === 0 && <EmptyState text="카테고리가 없습니다." />}
            </div>
          </Panel>

          <Panel title="태그">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} tone="neutral">
                  {tag.name}
                </Badge>
              ))}
              {tags.length === 0 && <EmptyState text="태그가 없습니다." />}
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "accent" | "success" | "warning";
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      <div className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <Badge tone={tone}>LIVE</Badge>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
      <h2 className="text-base font-black tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted)]">{text}</div>;
}




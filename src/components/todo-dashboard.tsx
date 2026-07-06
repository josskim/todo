"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Tag, Trash2, PencilLine, BellRing, Search, SlidersHorizontal, Strikethrough, PinOff } from "lucide-react";
import { Badge, Button, Input, Modal, Select, Textarea } from "@/components/ui";
import {
  createTodoAction,
  deleteTodoAction,
  dismissReminderAction,
  markNotificationReadAction,
  toggleTodoPinAction,
  toggleTodoStatusAction,
  updateTodoAction,
} from "@/app/actions/todo-actions";
import {
  formatDatetimeLocal,
  formatKstDateTime,
  todoPriorityLabels,
  todoPriorityTones,
  todoStatusLabels,
} from "@/lib/todo";
import { TODO_TITLE_MAX_LENGTH } from "@/lib/todo-limits";

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
  isPinned: boolean;
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

function parseProcessedText(text: string) {
  const parts: { text: string; processed: boolean }[] = [];
  const pattern = /~~([\s\S]+?)~~/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), processed: false });
    }
    parts.push({ text: match[1], processed: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), processed: false });
  }

  return parts.length ? parts : [{ text, processed: false }];
}

function ProcessedText({ text }: { text: string }) {
  return (
    <>
      {parseProcessedText(text).map((part, index) =>
        part.processed ? (
          <span key={index} className="text-[var(--muted)] line-through decoration-[var(--success)] decoration-2">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
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
  const [titleValue, setTitleValue] = useState(todo?.title || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(todo?.category?.id || "");
  const titleTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titlePreviewRef = useRef<HTMLDivElement | null>(null);
  const reminderValue = todo?.reminders.find((reminder) => reminder.isActive && !reminder.dismissedAt)?.remindAt ?? "";
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

  const markSelectedTitleText = () => {
    const textarea = titleTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      alert("처리한 내용을 드래그로 선택한 뒤 눌러주세요.");
      textarea.focus();
      return;
    }

    const selectedText = titleValue.slice(start, end);
    const selectedIsWrapped = selectedText.startsWith("~~") && selectedText.endsWith("~~");
    const surroundingIsWrapped = titleValue.slice(start - 2, start) === "~~" && titleValue.slice(end, end + 2) === "~~";
    const replacement = selectedIsWrapped
      ? selectedText.slice(2, -2)
      : surroundingIsWrapped
        ? selectedText
        : `~~${selectedText}~~`;
    const nextValue = selectedIsWrapped
      ? `${titleValue.slice(0, start)}${replacement}${titleValue.slice(end)}`
      : surroundingIsWrapped
        ? `${titleValue.slice(0, start - 2)}${replacement}${titleValue.slice(end + 2)}`
        : `${titleValue.slice(0, start)}${replacement}${titleValue.slice(end)}`;
    const nextStart = surroundingIsWrapped && !selectedIsWrapped ? start - 2 : start;

    setTitleValue(nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextStart + replacement.length);
    });
  };

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, onClose, router]);

  if (!open) return null;

  return (
    <Modal open={open} title={mode === "create" ? "할 일 추가" : "할 일 수정"} onClose={onClose}>
      <form
        action={formAction}
        className="space-y-4"
        onSubmit={(event) => {
          if (titleValue.trim().length > TODO_TITLE_MAX_LENGTH) {
            event.preventDefault();
            alert(`할일은 ${TODO_TITLE_MAX_LENGTH}자 이하로 입력해 주세요. 현재 ${titleValue.trim().length}자입니다.`);
          }
        }}
      >
        {mode === "edit" && <input type="hidden" name="todoId" value={todo?.id || ""} />}
        <input type="hidden" name="tagIds" value={JSON.stringify(selectedTagIds)} />
        <input type="hidden" name="dueDate" value="" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold">할일</label>
            <div className="relative overflow-hidden rounded-2xl">
              <div
                ref={titlePreviewRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-2xl border border-transparent px-4 py-3 text-sm leading-6 text-[var(--foreground)]"
              >
                {titleValue ? (
                  <ProcessedText text={titleValue} />
                ) : (
                  <span className="text-[var(--muted)]">해야 할 일을 입력하세요</span>
                )}
              </div>
              <Textarea
                ref={titleTextareaRef}
                name="title"
                value={titleValue}
                onChange={(event) => setTitleValue(event.target.value)}
                rows={5}
                placeholder="해야 할 일을 입력하세요"
                onScroll={(event) => {
                  if (titlePreviewRef.current) titlePreviewRef.current.scrollTop = event.currentTarget.scrollTop;
                }}
                className="relative min-h-[9rem] resize-y overflow-auto bg-transparent text-transparent caret-[var(--foreground)] selection:bg-[var(--accent-weak)] leading-6"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" className="h-9 rounded-full px-3 text-xs" onClick={markSelectedTitleText}>
                <Strikethrough className="h-3.5 w-3.5" />
                처리 표시/해제
              </Button>
            </div>
            <div className={`text-right text-xs ${titleValue.trim().length > TODO_TITLE_MAX_LENGTH ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
              {titleValue.trim().length}/{TODO_TITLE_MAX_LENGTH}
            </div>
            {state.errors?.title && <p className="text-xs text-[var(--danger)]">{state.errors.title[0]}</p>}
          </div>

          <input type="hidden" name="content" value={todo?.content || ""} />

          <div className="space-y-2">
            <label className="text-sm font-semibold">카테고리</label>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-4 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: selectedCategory?.color || "transparent" }}
              />
              <Select
                name="categoryId"
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
                className="pl-10"
              >
                <option value="">선택 안 함</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} style={{ color: category.color || undefined }}>
                    ● {category.name}
                  </option>
                ))}
              </Select>
            </div>
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
          <Button type="submit" disabled={pending} loading={pending}>
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

function CategoryBadge({ category }: { category: Category }) {
  const color = category.color || "#db5461";

  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm"
      style={{
        backgroundColor: color,
        borderColor: color,
      }}
    >
      {category.name}
    </span>
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
  const [filterOpen, setFilterOpen] = useState(false);

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
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
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

  const activeFilterCount = [search.trim(), statusFilter !== "all", categoryFilter !== "all", priorityFilter !== "all", sortBy !== "created_desc"].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setSortBy("created_desc");
  };

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

  const handleTogglePin = async (todo: TodoItem) => {
    const formData = new FormData();
    formData.append("todoId", todo.id);
    await toggleTodoPinAction(formData);
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

      <Button
        onClick={openCreate}
        className="fixed bottom-24 right-5 z-40 h-14 rounded-full px-5 shadow-[0_18px_45px_rgba(219,84,97,0.35)] lg:bottom-8 lg:right-8"
      >
        <Plus className="h-5 w-5" />
        할 일 추가
      </Button>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-5 soft-shadow">
          <div>
            <button
              type="button"
              onClick={() => setFilterOpen((current) => !current)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm font-bold text-[var(--foreground)] transition hover:border-[var(--accent)]"
            >
              <Search className="h-4 w-4" />
              검색/필터
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-black text-white">{activeFilterCount}</span>
              )}
              <SlidersHorizontal className="h-4 w-4 text-[var(--muted)]" />
            </button>
          </div>

          {filterOpen && (
            <div className="mt-4 rounded-[26px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black">검색과 정렬</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">필요할 때만 열어서 목록을 좁혀보세요.</p>
                </div>
                {activeFilterCount > 0 && (
                  <Button type="button" variant="ghost" className="h-9 px-3" onClick={resetFilters}>
                    초기화
                  </Button>
                )}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-4">
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
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {filteredTodos.map((todo) => {
              const latestReminder = todo.reminders.find((reminder) => reminder.isActive && !reminder.dismissedAt);
              const isDone = todo.status === "done";
              return (
                <article
                  key={todo.id}
                  className={`relative overflow-hidden rounded-[28px] border p-4 shadow-[0_16px_34px_rgba(21,18,20,0.10),0_1px_0_rgba(255,255,255,0.62)_inset] transition dark:shadow-[0_18px_46px_rgba(0,0,0,0.42),0_1px_0_rgba(255,255,255,0.06)_inset] ${
                    isDone
                      ? "border-[color-mix(in_srgb,var(--success)_26%,var(--border))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-soft)_86%,white),color-mix(in_srgb,var(--surface)_74%,var(--success)))] opacity-75 dark:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-soft)_84%,black),color-mix(in_srgb,var(--surface)_78%,var(--success)))]"
                      : "border-[color-mix(in_srgb,var(--border)_74%,white)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface)_96%,white),color-mix(in_srgb,var(--surface-soft)_68%,white))] hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(21,18,20,0.14),0_1px_0_rgba(255,255,255,0.72)_inset] dark:border-[color-mix(in_srgb,var(--border)_68%,white)] dark:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface)_90%,white),color-mix(in_srgb,var(--surface-soft)_86%,black))] dark:hover:shadow-[0_24px_56px_rgba(0,0,0,0.52),0_1px_0_rgba(255,255,255,0.08)_inset]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white/70 dark:bg-white/10" />
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={todoPriorityTones[todo.priority] || "neutral"}>{todoPriorityLabels[todo.priority] || todo.priority}</Badge>
                        {todo.category && <CategoryBadge category={todo.category} />}
                        {todo.tags.map((relation) => (
                          <Badge key={relation.id} tone="neutral">
                            <Tag className="mr-1 h-3 w-3" />
                            {relation.tag.name}
                          </Badge>
                        ))}
                      </div>
                      <h3
                        className={`mt-3 whitespace-pre-line text-base font-normal leading-relaxed ${
                          isDone ? "text-[var(--muted)] line-through decoration-[var(--success)] decoration-2 underline-offset-4" : ""
                        }`}
                      >
                        <ProcessedText text={todo.title} />
                      </h3>
                      {todo.content && (
                        <p className={`mt-2 line-clamp-2 text-sm text-[var(--muted)] ${isDone ? "line-through decoration-[var(--success)]" : ""}`}>
                          <ProcessedText text={todo.content} />
                        </p>
                      )}
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

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 xl:max-w-[190px]">
                      <Button
                        variant={todo.isPinned ? "primary" : "secondary"}
                        className="h-8 rounded-full px-2.5 text-xs"
                        onClick={() => handleTogglePin(todo)}
                      >
                        {todo.isPinned ? <PinOff className="h-3.5 w-3.5" /> : null}
                        {todo.isPinned ? "고정 해제" : "고정"}
                      </Button>
                      <Button variant="secondary" className="h-8 rounded-full px-2.5 text-xs text-[var(--muted)]" onClick={() => openEdit(todo)}>
                        <PencilLine className="h-3.5 w-3.5" />
                        수정
                      </Button>
                      {todo.status !== "done" ? (
                        <Button variant="secondary" className="h-8 rounded-full px-2.5 text-xs text-[var(--muted)]" onClick={() => handleQuickStatus(todo, "done")}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          완료
                        </Button>
                      ) : (
                        <Button variant="secondary" className="h-8 rounded-full px-2.5 text-xs text-[var(--muted)]" onClick={() => handleQuickStatus(todo, "todo")}>
                          되돌리기
                        </Button>
                      )}
                      <Button variant="secondary" className="h-8 rounded-full px-2.5 text-xs text-[var(--muted)]" onClick={() => handleDelete(todo)}>
                        <Trash2 className="h-3.5 w-3.5" />
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
                <CategoryBadge key={category.id} category={category} />
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




export const todoStatusLabels: Record<string, string> = {
  todo: "미완료",
  doing: "진행중",
  done: "완료",
  archived: "보관",
  deleted: "삭제됨",
};

export const todoStatusTones: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  todo: "neutral",
  doing: "accent",
  done: "success",
  archived: "warning",
  deleted: "danger",
};

export const todoPriorityLabels: Record<number, string> = {
  1: "높음",
  2: "보통",
  3: "낮음",
};

export const todoPriorityTones: Record<number, "danger" | "warning" | "neutral"> = {
  1: "danger",
  2: "warning",
  3: "neutral",
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDatetimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toKstParts(date: Date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
  };
}

export function formatKstDateTime(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = toKstParts(date);
  return `${parts.year}. ${parts.month}. ${parts.day}. ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

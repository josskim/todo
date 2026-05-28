export function toKstDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
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

export function formatDate(date?: string | Date | null) {
  const parsed = toKstDate(date);
  if (!parsed) return "";

  const parts = toKstParts(parsed);
  return `${parts.year}. ${parts.month}. ${parts.day}. ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function formatDateOnly(date?: string | Date | null) {
  const parsed = toKstDate(date);
  if (!parsed) return "";

  const parts = toKstParts(parsed);
  return `${parts.year}. ${parts.month}. ${parts.day}.`;
}

export function formatKstDateTime(date?: string | Date | null) {
  const parsed = toKstDate(date);
  if (!parsed) return "";

  const parts = toKstParts(parsed);
  return `${parts.year}. ${parts.month}. ${parts.day}. ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function nowKst() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

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

export function parseKstDateTimeLocal(value?: string | null) {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute));
}

export function nowKst() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

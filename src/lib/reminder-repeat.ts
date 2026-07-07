export const reminderRepeatTypes = ["once", "daily", "weekly", "monthly"] as const;

export type ReminderRepeatType = (typeof reminderRepeatTypes)[number];

export type ReminderRepeatConfig = {
  time?: string;
  weekdays?: number[];
  monthDays?: number[];
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function parseTime(value?: string | null) {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute, text: `${pad2(hour)}:${pad2(minute)}` };
}

function toKstParts(date: Date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    weekday: kst.getUTCDay(),
  };
}

function fromKstParts(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute));
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function uniqueNumbers(values: unknown[], min: number, max: number) {
  return [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value >= min && value <= max))].sort((a, b) => a - b);
}

function parseMonthDays(value?: string | null) {
  return uniqueNumbers(String(value || "").split(/[,\s，]+/), 1, 31);
}

export function normalizeReminderRepeatConfig(input: {
  repeatType: ReminderRepeatType;
  time?: string | null;
  weekdays?: unknown[];
  monthDays?: string | null;
}) {
  if (input.repeatType === "once") return { config: null, error: "" };

  const time = parseTime(input.time);
  if (!time) return { config: null, error: "반복 알림 시간을 입력해 주세요." };

  if (input.repeatType === "daily") {
    return { config: { time: time.text } satisfies ReminderRepeatConfig, error: "" };
  }

  if (input.repeatType === "weekly") {
    const weekdays = uniqueNumbers(input.weekdays || [], 0, 6);
    if (!weekdays.length) return { config: null, error: "매주 알림을 받을 요일을 선택해 주세요." };
    return { config: { time: time.text, weekdays } satisfies ReminderRepeatConfig, error: "" };
  }

  const monthDays = parseMonthDays(input.monthDays);
  if (!monthDays.length) return { config: null, error: "매월 알림을 받을 날짜를 입력해 주세요. 예: 2, 16" };
  return { config: { time: time.text, monthDays } satisfies ReminderRepeatConfig, error: "" };
}

export function getNextRepeatReminderAt(repeatType: ReminderRepeatType, config: ReminderRepeatConfig | null | undefined, after = new Date()) {
  if (repeatType === "once") return null;

  const time = parseTime(config?.time);
  if (!time) return null;

  const base = toKstParts(after);

  if (repeatType === "daily") {
    for (let offset = 0; offset <= 2; offset += 1) {
      const candidate = fromKstParts(base.year, base.month, base.day + offset, time.hour, time.minute);
      if (candidate.getTime() > after.getTime()) return candidate;
    }
  }

  if (repeatType === "weekly") {
    const weekdays = uniqueNumbers(config?.weekdays || [], 0, 6);
    for (let offset = 0; offset <= 14; offset += 1) {
      const dayParts = toKstParts(fromKstParts(base.year, base.month, base.day + offset, 12, 0));
      if (!weekdays.includes(dayParts.weekday)) continue;
      const candidate = fromKstParts(dayParts.year, dayParts.month, dayParts.day, time.hour, time.minute);
      if (candidate.getTime() > after.getTime()) return candidate;
    }
  }

  if (repeatType === "monthly") {
    const monthDays = uniqueNumbers(config?.monthDays || [], 1, 31);
    for (let monthOffset = 0; monthOffset <= 24; monthOffset += 1) {
      const monthStart = toKstParts(fromKstParts(base.year, base.month + monthOffset, 1, 12, 0));
      const maxDay = daysInMonth(monthStart.year, monthStart.month);
      for (const day of monthDays) {
        if (day > maxDay) continue;
        const candidate = fromKstParts(monthStart.year, monthStart.month, day, time.hour, time.minute);
        if (candidate.getTime() > after.getTime()) return candidate;
      }
    }
  }

  return null;
}

export function describeReminderRepeat(repeatType?: string | null, config?: ReminderRepeatConfig | null) {
  if (!repeatType || repeatType === "once") return "한 번";
  const time = config?.time || "";
  if (repeatType === "daily") return `매일 ${time}`;
  if (repeatType === "weekly") {
    const labels = uniqueNumbers(config?.weekdays || [], 0, 6).map((day) => weekdayLabels[day]).join(", ");
    return `매주 ${labels} ${time}`.trim();
  }
  if (repeatType === "monthly") {
    const labels = uniqueNumbers(config?.monthDays || [], 1, 31).map((day) => `${day}일`).join(", ");
    return `매월 ${labels} ${time}`.trim();
  }
  return "알림";
}

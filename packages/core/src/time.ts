/** ISO-8601 timestamp, e.g. 2026-10-10T08:30:00.000Z */
export type ISODateTime = string;
/** Calendar date, e.g. 2026-10-10 (local to the family) */
export type ISODate = string;

export const DAY_MS = 24 * 60 * 60 * 1000;

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
}

/** Whole calendar days from a to b (b - a). Negative if b is before a. */
export function daysBetween(a: ISODate, b: ISODate): number {
  const da = fromISODate(a).getTime();
  const db = fromISODate(b).getTime();
  return Math.round((db - da) / DAY_MS);
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

/** 0 = Sunday ... 6 = Saturday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/** The next date on or after `from` that falls on `weekday`. */
export function nextWeekday(from: Date, weekday: Weekday, inclusive = true): Date {
  const start = startOfDay(from);
  let delta = (weekday - start.getDay() + 7) % 7;
  if (delta === 0 && !inclusive) delta = 7;
  return addDays(start, delta);
}

/** The next date on or after `from` whose day-of-month is `day` (clamped to 1..28). */
export function nextDayOfMonth(from: Date, day: number, inclusive = true): Date {
  const d = Math.min(Math.max(1, Math.trunc(day)), 28);
  const start = startOfDay(from);
  const candidate = new Date(start.getFullYear(), start.getMonth(), d);
  if (candidate > start || (inclusive && isSameDay(candidate, start))) return candidate;
  return new Date(start.getFullYear(), start.getMonth() + 1, d);
}

export function relativeDayLabel(target: ISODate, today: ISODate): string {
  const diff = daysBetween(today, target);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1 && diff > -7) return `${-diff} days ago`;
  const d = fromISODate(target);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

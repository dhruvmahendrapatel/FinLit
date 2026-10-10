import { addDays, daysBetween, fromISODate, toISODate, type ISODate } from "./time";
import type { Streak } from "./types";

export function emptyStreak(kidId: string): Streak {
  return { kidId, current: 0, best: 0 };
}

export type StreakStatus = "none" | "active" | "at_risk" | "broken";

export function streakStatus(streak: Streak, today: ISODate): StreakStatus {
  if (!streak.lastActiveOn || streak.current === 0) return "none";
  const gap = daysBetween(streak.lastActiveOn, today);
  if (gap <= 0) return "active";
  if (gap === 1) return "at_risk";
  return "broken";
}

/** The streak a kid can still claim today (0 once broken). */
export function effectiveStreak(streak: Streak, today: ISODate): number {
  return streakStatus(streak, today) === "broken" ? 0 : streak.current;
}

export function recordActivity(streak: Streak, today: ISODate): Streak {
  if (streak.lastActiveOn === today) return streak;
  const yesterday = toISODate(addDays(fromISODate(today), -1));
  const current = streak.lastActiveOn === yesterday ? streak.current + 1 : 1;
  return { ...streak, current, best: Math.max(streak.best, current), lastActiveOn: today };
}

/** Milestones that trigger celebrations */
export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30, 60, 100];

export function isMilestone(current: number): boolean {
  return STREAK_MILESTONES.includes(current);
}

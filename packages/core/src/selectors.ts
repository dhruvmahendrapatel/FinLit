import { describeCadence, nextPayoutDate } from "./allowance";
import { LESSONS } from "./content/lessons";
import { REWARDS } from "./content/rewards";
import { UNITS } from "./content/units";
import { goalFunded } from "./goals";
import { earnedBetween, entriesForKid, jarBalances, totalBalance } from "./ledger";
import { lessonAvailability, lessonsForAgeBand, levelFor, unitsForAgeBand, type LessonAvailability, type LevelStatus } from "./lessons";
import type { Paise } from "./money";
import type { FamilyState } from "./state";
import { effectiveStreak, emptyStreak, streakStatus, type StreakStatus } from "./streaks";
import { addDays, fromISODate, startOfDay, toISODate, type ISODate } from "./time";
import type {
  AllowanceRule,
  Chore,
  Goal,
  InterestRule,
  JarKind,
  Kid,
  LedgerEntry,
  Lesson,
  LessonUnit,
  Reward,
  RewardOrder,
} from "./types";

export function getKid(state: FamilyState, kidId: string): Kid | undefined {
  return state.kids.find((k) => k.id === kidId);
}

/** Monday 00:00 of the week containing `today` (Indian weeks start Monday). */
export function weekStart(today: ISODate): Date {
  const d = startOfDay(fromISODate(today));
  const offset = (d.getDay() + 6) % 7;
  return addDays(d, -offset);
}

export interface KidSummary {
  kid: Kid;
  jars: Record<JarKind, Paise>;
  totalPaise: Paise;
  goalFundsPaise: Paise;
  netWorthPaise: Paise;
  streak: number;
  bestStreak: number;
  streakStatus: StreakStatus;
  level: LevelStatus;
  lessonsCompleted: number;
  lessonsTotal: number;
  earnedThisWeekPaise: Paise;
  /** Claimed, submitted or rejected by this kid */
  pendingChores: Chore[];
  availableChores: Chore[];
  activeGoals: Goal[];
  allowance: AllowanceRule | null;
  allowanceLabel: string | null;
  nextAllowanceOn: ISODate | null;
  interestRule: InterestRule | null;
}

export function kidSummary(state: FamilyState, kidId: string, today: ISODate): KidSummary {
  const kid = state.kids.find((k) => k.id === kidId);
  if (!kid) throw new Error(`Kid ${kidId} not found`);
  const jars = jarBalances(state.ledger, kidId);
  const totalPaise = totalBalance(state.ledger, kidId);
  const goalFundsPaise = state.goals
    .filter((g) => g.kidId === kidId && g.status !== "redeemed")
    .reduce((s, g) => s + goalFunded(g), 0);
  const streak = state.streaks.find((s) => s.kidId === kidId) ?? emptyStreak(kidId);
  const lessons = lessonsForAgeBand(LESSONS, kid.ageBand);
  const completedIds = new Set(state.lessonProgress.filter((p) => p.kidId === kidId).map((p) => p.lessonId));
  const from = weekStart(today).toISOString();
  const to = addDays(fromISODate(today), 1).toISOString();
  const allowance = state.allowanceRules.find((r) => r.kidId === kidId) ?? null;
  const nextAllowanceOn =
    allowance && allowance.active ? toISODate(nextPayoutDate(allowance, fromISODate(today))) : null;
  return {
    kid,
    jars,
    totalPaise,
    goalFundsPaise,
    netWorthPaise: totalPaise + goalFundsPaise,
    streak: effectiveStreak(streak, today),
    bestStreak: streak.best,
    streakStatus: streakStatus(streak, today),
    level: levelFor(kid.xp),
    lessonsCompleted: lessons.filter((l) => completedIds.has(l.id)).length,
    lessonsTotal: lessons.length,
    earnedThisWeekPaise: earnedBetween(state.ledger, kidId, from, to),
    pendingChores: state.chores.filter(
      (c) => c.claimedBy === kidId && (c.status === "claimed" || c.status === "submitted" || c.status === "rejected"),
    ),
    availableChores: state.chores.filter((c) => c.status === "open" && (c.kidId === null || c.kidId === kidId)),
    activeGoals: state.goals.filter((g) => g.kidId === kidId && g.status !== "redeemed"),
    allowance,
    allowanceLabel: allowance ? describeCadence(allowance) : null,
    nextAllowanceOn,
    interestRule: state.interestRules.find((r) => r.kidId === kidId) ?? null,
  };
}

export interface ChoreBuckets {
  available: Chore[];
  inProgress: Chore[];
  awaitingApproval: Chore[];
  needsRetry: Chore[];
  done: Chore[];
}

export function choresForKid(state: FamilyState, kidId: string): ChoreBuckets {
  const mine = (c: Chore) => c.claimedBy === kidId;
  const byDue = (a: Chore, b: Chore) => (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999");
  return {
    available: state.chores.filter((c) => c.status === "open" && (c.kidId === null || c.kidId === kidId)).sort(byDue),
    inProgress: state.chores.filter((c) => c.status === "claimed" && mine(c)),
    awaitingApproval: state.chores.filter((c) => c.status === "submitted" && mine(c)),
    needsRetry: state.chores.filter((c) => c.status === "rejected" && mine(c)),
    done: state.chores
      .filter((c) => c.status === "approved" && mine(c))
      .sort((a, b) => (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? ""))
      .slice(0, 10),
  };
}

export interface PendingApprovals {
  chores: Chore[];
  rewardOrders: RewardOrder[];
  count: number;
}

export function pendingApprovals(state: FamilyState): PendingApprovals {
  const chores = state.chores
    .filter((c) => c.status === "submitted")
    .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  const rewardOrders = state.rewardOrders.filter((o) => o.status === "requested");
  return { chores, rewardOrders, count: chores.length + rewardOrders.length };
}

export interface FamilyOverview {
  kids: KidSummary[];
  familySavingsPaise: Paise;
  familyNetWorthPaise: Paise;
  approvals: PendingApprovals;
  nextAllowance: { kid: Kid; on: ISODate; amountPaise: Paise } | null;
  weeklyEarnedPaise: Paise;
  lessonsCompletedThisWeek: number;
  openChores: Chore[];
}

export function familyOverview(state: FamilyState, today: ISODate): FamilyOverview {
  const kids = state.kids.map((k) => kidSummary(state, k.id, today));
  const weekStartISO = weekStart(today).toISOString();
  let nextAllowance: FamilyOverview["nextAllowance"] = null;
  for (const s of kids) {
    if (!s.allowance || !s.nextAllowanceOn) continue;
    if (!nextAllowance || s.nextAllowanceOn < nextAllowance.on) {
      nextAllowance = { kid: s.kid, on: s.nextAllowanceOn, amountPaise: s.allowance.amountPaise };
    }
  }
  return {
    kids,
    familySavingsPaise: kids.reduce((s, k) => s + k.jars.save, 0),
    familyNetWorthPaise: kids.reduce((s, k) => s + k.netWorthPaise, 0),
    approvals: pendingApprovals(state),
    nextAllowance,
    weeklyEarnedPaise: kids.reduce((s, k) => s + k.earnedThisWeekPaise, 0),
    lessonsCompletedThisWeek: state.lessonProgress.filter((p) => p.completedAt >= weekStartISO).length,
    openChores: state.chores.filter((c) => c.status === "open" || c.status === "claimed"),
  };
}

export function recentActivity(state: FamilyState, kidId: string | null, limit = 20): LedgerEntry[] {
  if (kidId) return entriesForKid(state.ledger, kidId, limit);
  return [...state.ledger].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export interface PathLesson {
  lesson: Lesson;
  availability: LessonAvailability;
}

export interface PathUnit {
  unit: LessonUnit;
  lessons: PathLesson[];
  completed: number;
}

/** The kid's lesson path: units in order, each lesson with lock/complete state. */
export function lessonPath(state: FamilyState, kidId: string): PathUnit[] {
  const kid = getKid(state, kidId);
  if (!kid) return [];
  const bandLessons = lessonsForAgeBand(LESSONS, kid.ageBand);
  return unitsForAgeBand(UNITS, LESSONS, kid.ageBand).map((unit) => {
    const inUnit = bandLessons.filter((l) => l.unitId === unit.id);
    const lessons = inUnit.map((lesson) => ({
      lesson,
      availability: lessonAvailability(lesson, inUnit, state.lessonProgress, kidId, state.planId),
    }));
    return { unit, lessons, completed: lessons.filter((l) => l.availability.completed).length };
  });
}

/** First unlocked, not-yet-completed lesson, or null when the band is finished/locked. */
export function nextLessonFor(state: FamilyState, kidId: string): PathLesson | null {
  for (const unit of lessonPath(state, kidId)) {
    for (const item of unit.lessons) {
      if (item.availability.unlocked && !item.availability.completed) return item;
    }
  }
  return null;
}

export function lessonById(lessonId: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === lessonId);
}

export function unitById(unitId: string): LessonUnit | undefined {
  return UNITS.find((u) => u.id === unitId);
}

export function rewardById(rewardId: string): Reward | undefined {
  return REWARDS.find((r) => r.id === rewardId);
}

export function goalsForKid(state: FamilyState, kidId: string): Goal[] {
  return state.goals
    .filter((g) => g.kidId === kidId)
    .sort((a, b) => (a.status === b.status ? a.createdAt.localeCompare(b.createdAt) : a.status === "active" ? -1 : 1));
}

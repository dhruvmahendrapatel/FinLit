import { assert } from "./errors";
import { canUse, FREE_LESSONS_PER_UNIT, type PlanId } from "./entitlements";
import type { ISODateTime } from "./time";
import type { AgeBand, Kid, Lesson, LessonProgress, LessonUnit } from "./types";

export function lessonsForAgeBand(lessons: readonly Lesson[], band: AgeBand): Lesson[] {
  return lessons.filter((l) => l.ageBands.includes(band));
}

export function unitsForAgeBand(units: readonly LessonUnit[], lessons: readonly Lesson[], band: AgeBand): LessonUnit[] {
  const used = new Set(lessonsForAgeBand(lessons, band).map((l) => l.unitId));
  return units.filter((u) => used.has(u.id)).sort((a, b) => a.order - b.order);
}

export type LessonLockReason = "premium" | "sequence" | null;

export interface LessonAvailability {
  unlocked: boolean;
  completed: boolean;
  reason: LessonLockReason;
  scorePercent: number | null;
}

/**
 * A lesson is unlocked when:
 *  - it is already completed (replays are always allowed), or
 *  - the previous lesson in the unit (for this age band) is completed, and
 *  - it is not premium-locked for this plan (free gets the first N per unit, non-premium ones).
 */
export function lessonAvailability(
  lesson: Lesson,
  unitLessonsForBand: readonly Lesson[],
  progress: readonly LessonProgress[],
  kidId: string,
  planId: PlanId,
): LessonAvailability {
  const done = progress.find((p) => p.kidId === kidId && p.lessonId === lesson.id);
  if (done) return { unlocked: true, completed: true, reason: null, scorePercent: done.scorePercent };
  const index = unitLessonsForBand.findIndex((l) => l.id === lesson.id);
  const premiumLocked =
    !canUse(planId, "full_library") && (lesson.premium || index >= FREE_LESSONS_PER_UNIT);
  if (premiumLocked) return { unlocked: false, completed: false, reason: "premium", scorePercent: null };
  if (index > 0) {
    const prev = unitLessonsForBand[index - 1];
    const prevDone = prev ? progress.some((p) => p.kidId === kidId && p.lessonId === prev.id) : true;
    if (!prevDone) return { unlocked: false, completed: false, reason: "sequence", scorePercent: null };
  }
  return { unlocked: true, completed: false, reason: null, scorePercent: null };
}

export const QUIZ_PASS_PERCENT = 60;

export interface QuizResult {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
}

export function scoreQuiz(lesson: Lesson, answers: ReadonlyArray<number | null>): QuizResult {
  const total = lesson.quiz.length;
  let correct = 0;
  lesson.quiz.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct += 1;
  });
  const percent = total === 0 ? 100 : Math.round((correct / total) * 100);
  return { correct, total, percent, passed: percent >= QUIZ_PASS_PERCENT };
}

/** Half the XP for finishing, the rest scales with the quiz score. */
export function xpForLesson(lesson: Lesson, percent: number): number {
  return Math.round(lesson.xp * (0.5 + (0.5 * Math.max(0, Math.min(100, percent))) / 100));
}

export interface Level {
  level: number;
  title: string;
  minXp: number;
}

export const LEVELS: readonly Level[] = [
  { level: 1, title: "Coin Collector", minXp: 0 },
  { level: 2, title: "Piggy Protector", minXp: 100 },
  { level: 3, title: "Budget Buddy", minXp: 250 },
  { level: 4, title: "Savings Star", minXp: 500 },
  { level: 5, title: "Money Master", minXp: 900 },
  { level: 6, title: "Wealth Wizard", minXp: 1400 },
  { level: 7, title: "Finance Legend", minXp: 2000 },
];

export interface LevelStatus extends Level {
  nextMinXp: number | null;
  /** 0–100 progress toward the next level */
  progressPercent: number;
  xp: number;
}

export function levelFor(xp: number): LevelStatus {
  let current: Level = LEVELS[0] ?? { level: 1, title: "Coin Collector", minXp: 0 };
  let next: Level | null = null;
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    if (lvl && xp >= lvl.minXp) {
      current = lvl;
      next = LEVELS[i + 1] ?? null;
    }
  }
  const span = next ? next.minXp - current.minXp : 1;
  const progressPercent = next ? Math.min(100, Math.round(((xp - current.minXp) / span) * 100)) : 100;
  return { ...current, nextMinXp: next ? next.minXp : null, progressPercent, xp };
}

export interface CompleteLessonResult {
  progress: LessonProgress;
  kid: Kid;
  result: QuizResult;
  xpEarned: number;
  firstTime: boolean;
}

export function completeLesson(
  kid: Kid,
  lesson: Lesson,
  existing: readonly LessonProgress[],
  answers: ReadonlyArray<number | null>,
  now: ISODateTime,
): CompleteLessonResult {
  assert(lesson.ageBands.includes(kid.ageBand), "lesson_band", "This lesson is for a different age band");
  const result = scoreQuiz(lesson, answers);
  const previous = existing.find((p) => p.kidId === kid.id && p.lessonId === lesson.id);
  const firstTime = !previous;
  const xpEarned = firstTime ? xpForLesson(lesson, result.percent) : 0;
  const progress: LessonProgress = {
    kidId: kid.id,
    lessonId: lesson.id,
    completedAt: now,
    scorePercent: previous ? Math.max(previous.scorePercent, result.percent) : result.percent,
    xpEarned: (previous?.xpEarned ?? 0) + xpEarned,
  };
  return { progress, kid: { ...kid, xp: kid.xp + xpEarned }, result, xpEarned, firstTime };
}

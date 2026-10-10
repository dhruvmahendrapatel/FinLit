import { describe, expect, it } from "vitest";
import { LESSONS } from "./content/lessons";
import { UNITS } from "./content/units";
import { completeLesson, lessonAvailability, lessonsForAgeBand, levelFor, scoreQuiz, xpForLesson } from "./lessons";
import type { Kid } from "./types";

const kid: Kid = { id: "k", name: "Aarav", age: 10, ageBand: "earner", avatar: "tiger", xp: 0, createdAt: "2026-01-01T00:00:00.000Z" };

describe("lesson content", () => {
  it("has valid quizzes and units", () => {
    const unitIds = new Set(UNITS.map((u) => u.id));
    for (const lesson of LESSONS) {
      expect(unitIds.has(lesson.unitId)).toBe(true);
      expect(lesson.cards.length).toBeGreaterThanOrEqual(3);
      expect(lesson.quiz.length).toBeGreaterThanOrEqual(2);
      for (const q of lesson.quiz) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    }
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it("covers every age band with at least one free lesson", () => {
    for (const band of ["explorer", "earner", "builder"] as const) {
      const free = lessonsForAgeBand(LESSONS, band).filter((l) => !l.premium);
      expect(free.length).toBeGreaterThan(0);
    }
  });
});

describe("availability", () => {
  const saving = lessonsForAgeBand(LESSONS, "earner").filter((l) => l.unitId === "u_saving");

  it("unlocks the first lesson, locks the next until completed", () => {
    const first = saving[0]!;
    const second = saving[1]!;
    expect(lessonAvailability(first, saving, [], "k", "free").unlocked).toBe(true);
    expect(lessonAvailability(second, saving, [], "k", "free")).toMatchObject({ unlocked: false, reason: "sequence" });
    const progress = [{ kidId: "k", lessonId: first.id, completedAt: "x", scorePercent: 100, xpEarned: 50 }];
    expect(lessonAvailability(second, saving, progress, "k", "free").unlocked).toBe(true);
  });

  it("premium-locks for free families and unlocks with premium", () => {
    const banking = lessonsForAgeBand(LESSONS, "earner").filter((l) => l.unitId === "u_banking");
    const snowball = banking.find((l) => l.premium)!;
    const done = banking.filter((l) => !l.premium).map((l) => ({ kidId: "k", lessonId: l.id, completedAt: "x", scorePercent: 100, xpEarned: 1 }));
    expect(lessonAvailability(snowball, banking, done, "k", "free")).toMatchObject({ unlocked: false, reason: "premium" });
    expect(lessonAvailability(snowball, banking, done, "k", "premium_yearly").unlocked).toBe(true);
  });
});

describe("quiz scoring and xp", () => {
  const lesson = LESSONS.find((l) => l.id === "l_goal_cricket_bat")!;

  it("scores answers", () => {
    const perfect = scoreQuiz(lesson, lesson.quiz.map((q) => q.correctIndex));
    expect(perfect).toEqual({ correct: 2, total: 2, percent: 100, passed: true });
    const half = scoreQuiz(lesson, [lesson.quiz[0]!.correctIndex, null]);
    expect(half.percent).toBe(50);
    expect(half.passed).toBe(false);
  });

  it("awards xp once and tracks levels", () => {
    const first = completeLesson(kid, lesson, [], lesson.quiz.map((q) => q.correctIndex), "2026-10-10T09:00:00.000Z");
    expect(first.xpEarned).toBe(lesson.xp);
    expect(first.kid.xp).toBe(lesson.xp);
    const replay = completeLesson(first.kid, lesson, [first.progress], [0, 0], "2026-10-11T09:00:00.000Z");
    expect(replay.xpEarned).toBe(0);
    expect(replay.progress.scorePercent).toBe(100); // keeps best score
    expect(xpForLesson(lesson, 0)).toBe(lesson.xp / 2);
    expect(levelFor(0)).toMatchObject({ level: 1, title: "Coin Collector", nextMinXp: 100 });
    expect(levelFor(120)).toMatchObject({ level: 2, progressPercent: 13 });
    expect(levelFor(5000)).toMatchObject({ level: 7, nextMinXp: null, progressPercent: 100 });
  });

  it("refuses lessons from another age band", () => {
    const explorerLesson = LESSONS.find((l) => l.id === "l_coins_notes_upi")!;
    expect(() => completeLesson(kid, explorerLesson, [], [0, 0], "2026-10-10T09:00:00.000Z")).toThrow(/age band/);
  });
});

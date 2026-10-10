import { describe, expect, it } from "vitest";
import { LESSONS } from "./content/lessons";
import { LESSON_TRANSLATIONS_HI } from "./content/lessons.hi";
import { localizeLesson, untranslatedLessonIds } from "./localize";

describe("Hindi lessons", () => {
  it("covers every lesson with matching card and quiz shapes", () => {
    expect(untranslatedLessonIds("hi")).toEqual([]);
    for (const lesson of LESSONS) {
      const t = LESSON_TRANSLATIONS_HI[lesson.id]!;
      expect(t.cards, lesson.id).toHaveLength(lesson.cards.length);
      expect(t.quiz, lesson.id).toHaveLength(lesson.quiz.length);
      lesson.quiz.forEach((q, i) => expect(t.quiz[i]!.options, `${lesson.id} q${i}`).toHaveLength(q.options.length));
    }
  });

  it("localizes without touching ids, xp or answers", () => {
    const lesson = LESSONS.find((l) => l.id === "l_otp_rule")!;
    const hi = localizeLesson(lesson, "hi");
    expect(hi.id).toBe(lesson.id);
    expect(hi.xp).toBe(lesson.xp);
    expect(hi.title).not.toBe(lesson.title);
    expect(hi.quiz.map((q) => q.correctIndex)).toEqual(lesson.quiz.map((q) => q.correctIndex));
    expect(localizeLesson(lesson, "en")).toBe(lesson);
  });
});

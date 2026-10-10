import { LESSON_TRANSLATIONS_HI, UNIT_TITLES_HI, type LessonTranslation } from "./content/lessons.hi";
import { LESSONS } from "./content/lessons";
import type { Language } from "./state";
import type { Lesson, LessonUnit } from "./types";

/** Lesson with Hindi text applied when a translation exists; English otherwise. */
export function localizeLesson(lesson: Lesson, language: Language): Lesson {
  if (language !== "hi") return lesson;
  const t: LessonTranslation | undefined = LESSON_TRANSLATIONS_HI[lesson.id];
  if (!t) return lesson;
  return {
    ...lesson,
    title: t.title,
    cards: lesson.cards.map((card, i) => ({ ...card, title: t.cards[i]?.title ?? card.title, body: t.cards[i]?.body ?? card.body })),
    quiz: lesson.quiz.map((q, i) => {
      const tq = t.quiz[i];
      if (!tq || tq.options.length !== q.options.length) return q;
      return { ...q, prompt: tq.prompt, options: tq.options, explanation: tq.explanation };
    }),
  };
}

export function localizeUnit(unit: LessonUnit, language: Language): LessonUnit {
  if (language !== "hi") return unit;
  const title = UNIT_TITLES_HI[unit.id];
  return title ? { ...unit, title } : unit;
}

export function localizedLessonById(lessonId: string, language: Language): Lesson | undefined {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  return lesson ? localizeLesson(lesson, language) : undefined;
}

/** Ids of lessons that still lack a translation for the language (English falls back). */
export function untranslatedLessonIds(language: Language): string[] {
  if (language !== "hi") return [];
  return LESSONS.filter((l) => !LESSON_TRANSLATIONS_HI[l.id]).map((l) => l.id);
}

import type { LessonUnit } from "../types";

/** Units map to NCFE Money Smart School / CBSE–NPCI financial-literacy workbook themes. */
export const UNITS: readonly LessonUnit[] = [
  { id: "u_money", title: "What is Money?", emoji: "🪙", color: "#FFC233", curriculumTag: "NCFE: Money and its uses", order: 1 },
  { id: "u_needs", title: "Needs vs Wants", emoji: "🎯", color: "#FF6B6B", curriculumTag: "NCFE: Smart spending", order: 2 },
  { id: "u_earning", title: "Earning", emoji: "💪", color: "#FB923C", curriculumTag: "CBSE: Work and income", order: 3 },
  { id: "u_saving", title: "Saving & Goals", emoji: "🐷", color: "#14B8A6", curriculumTag: "NCFE: Saving habits", order: 4 },
  { id: "u_banking", title: "Banks & Interest", emoji: "🏦", color: "#3DA9FC", curriculumTag: "RBI: Banking basics", order: 5 },
  { id: "u_safety", title: "UPI & Scam Safety", emoji: "🛡️", color: "#8B5CF6", curriculumTag: "NPCI: Digital payment safety", order: 6 },
  { id: "u_budget", title: "Budgets & Tax", emoji: "🧮", color: "#EC4899", curriculumTag: "CBSE: Budgeting, GST and income tax", order: 7 },
  { id: "u_invest", title: "Growing Money", emoji: "🌱", color: "#22C55E", curriculumTag: "SEBI: Investing basics", order: 8 },
  { id: "u_biz", title: "Young Entrepreneur", emoji: "🚀", color: "#5B4DFF", curriculumTag: "NEP: Life skills and enterprise", order: 9 },
];

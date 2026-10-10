import type { CustomerInfo } from "./billing";
import type { ParentConsent } from "./consent";
import type { PlanId } from "./entitlements";
import type {
  AllowanceRule,
  Chore,
  Family,
  Goal,
  InterestRule,
  Kid,
  LedgerEntry,
  LessonProgress,
  Loan,
  Parent,
  RewardOrder,
  Streak,
} from "./types";

export type Language = "en" | "hi";

export interface FamilySettings {
  /** Parent opted in to personalised ads on parent screens (never affects kid screens) */
  parentAdConsent: boolean;
  /** Soft daily limit for kid mode, in minutes */
  dailyKidMinutes: number;
  language: Language;
  /** Local reminders: allowance day, streak at risk, pending approvals */
  remindersEnabled: boolean;
}

export const DEFAULT_SETTINGS: FamilySettings = {
  parentAdConsent: false,
  dailyKidMinutes: 20,
  language: "en",
  remindersEnabled: true,
};

export const STATE_VERSION = 1 as const;

/** The whole family's data. Shared by the Parent and Kid experiences. */
export interface FamilyState {
  version: typeof STATE_VERSION;
  family: Family | null;
  parent: Parent | null;
  consent: ParentConsent | null;
  kids: Kid[];
  ledger: LedgerEntry[];
  chores: Chore[];
  goals: Goal[];
  allowanceRules: AllowanceRule[];
  interestRules: InterestRule[];
  lessonProgress: LessonProgress[];
  streaks: Streak[];
  rewardOrders: RewardOrder[];
  loans: Loan[];
  planId: PlanId;
  billing: CustomerInfo | null;
  settings: FamilySettings;
}

export function emptyState(): FamilyState {
  return {
    version: STATE_VERSION,
    family: null,
    parent: null,
    consent: null,
    kids: [],
    ledger: [],
    chores: [],
    goals: [],
    allowanceRules: [],
    interestRules: [],
    lessonProgress: [],
    streaks: [],
    rewardOrders: [],
    loans: [],
    planId: "free",
    billing: null,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function isOnboarded(state: FamilyState): boolean {
  return state.family !== null && state.parent !== null && state.consent !== null;
}

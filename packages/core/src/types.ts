import type { ISODate, ISODateTime, Weekday } from "./time";
import type { Paise } from "./money";

// ---------- People ----------

/** Age bands from the market research: Explorers 5–8, Earners 9–12, Builders 13–17 */
export type AgeBand = "explorer" | "earner" | "builder";

export const AGE_BANDS: Record<AgeBand, { label: string; min: number; max: number; tagline: string }> = {
  explorer: { label: "Explorer", min: 5, max: 8, tagline: "Stories, coins and stickers" },
  earner: { label: "Earner", min: 9, max: 12, tagline: "Earn, save and reach goals" },
  builder: { label: "Builder", min: 13, max: 17, tagline: "Budgets, UPI safety and investing" },
};

export function ageBandFor(age: number): AgeBand {
  if (age <= 8) return "explorer";
  if (age <= 12) return "earner";
  return "builder";
}

export interface Parent {
  id: string;
  name: string;
  /** Masked phone for display, e.g. +91 98••• ••321 */
  phoneMasked: string;
  /** 4-digit PIN protecting parent mode. Stored hashed in production; plain in the local MVP. */
  pin: string;
  avatarEmoji: string;
}

export type AvatarId =
  | "tiger"
  | "elephant"
  | "peacock"
  | "panda"
  | "fox"
  | "owl"
  | "unicorn"
  | "robot";

export const AVATARS: Record<AvatarId, { emoji: string; color: string; name: string }> = {
  tiger: { emoji: "🐯", color: "#FFB020", name: "Sheru" },
  elephant: { emoji: "🐘", color: "#8B9DFF", name: "Gajju" },
  peacock: { emoji: "🦚", color: "#14B8A6", name: "Mor" },
  panda: { emoji: "🐼", color: "#A3A3A3", name: "Pandu" },
  fox: { emoji: "🦊", color: "#FF7A45", name: "Lomdi" },
  owl: { emoji: "🦉", color: "#C084FC", name: "Ullu" },
  unicorn: { emoji: "🦄", color: "#F472B6", name: "Pari" },
  robot: { emoji: "🤖", color: "#60A5FA", name: "Bolt" },
};

export interface Kid {
  id: string;
  name: string;
  age: number;
  ageBand: AgeBand;
  avatar: AvatarId;
  xp: number;
  createdAt: ISODateTime;
}

// ---------- Jars ----------

export type JarKind = "spend" | "save" | "share" | "invest";

export const JAR_KINDS: JarKind[] = ["spend", "save", "share", "invest"];

export const JAR_INFO: Record<JarKind, { label: string; emoji: string; blurb: string }> = {
  spend: { label: "Spend", emoji: "🍦", blurb: "For small treats and fun" },
  save: { label: "Save", emoji: "🐷", blurb: "For goals and rainy days" },
  share: { label: "Share", emoji: "💝", blurb: "For a cause you care about" },
  invest: { label: "Grow", emoji: "🌱", blurb: "Money that makes more money" },
};

/** Percent of every rupee earned that goes to each jar. Must sum to 100. */
export type JarAllocation = Record<JarKind, number>;

export const DEFAULT_ALLOCATION: JarAllocation = { spend: 40, save: 40, share: 10, invest: 10 };

// ---------- Ledger ----------

export type LedgerKind =
  | "allowance"
  | "chore"
  | "interest"
  | "gift"
  | "bonus"
  | "spend"
  | "goal_contribution"
  | "reward_purchase"
  | "share_donation"
  | "adjustment";

export interface LedgerEntry {
  id: string;
  kidId: string;
  jar: JarKind;
  /** Positive = credit, negative = debit */
  amountPaise: Paise;
  kind: LedgerKind;
  memo: string;
  at: ISODateTime;
  /** Related object id (chore, goal, reward...) */
  refId?: string;
  emoji?: string;
}

// ---------- Chores ----------

export type ChoreStatus = "open" | "claimed" | "submitted" | "approved" | "rejected";
export type ChoreRecurrence = "once" | "daily" | "weekly";

export interface Chore {
  id: string;
  title: string;
  emoji: string;
  rewardPaise: Paise;
  /** Who may do it. null = any kid in the family. */
  kidId: string | null;
  status: ChoreStatus;
  recurrence: ChoreRecurrence;
  /** Kid who claimed/submitted the chore */
  claimedBy?: string;
  proofNote?: string;
  /** Set when the kid attaches a photo (uri). */
  proofPhotoUri?: string;
  rejectReason?: string;
  createdAt: ISODateTime;
  dueOn?: ISODate;
  claimedAt?: ISODateTime;
  submittedAt?: ISODateTime;
  resolvedAt?: ISODateTime;
}

// ---------- Goals ----------

export type GoalStatus = "active" | "reached" | "redeemed";

export interface Goal {
  id: string;
  kidId: string;
  title: string;
  emoji: string;
  targetPaise: Paise;
  /** Kid's own contributions moved from the Save jar */
  savedPaise: Paise;
  /** Parent match added on top of contributions */
  matchedPaise: Paise;
  /** Parent tops up this % of every contribution (0–100) */
  parentMatchPercent: number;
  status: GoalStatus;
  createdAt: ISODateTime;
  reachedAt?: ISODateTime;
}

// ---------- Allowance & interest ----------

export type AllowanceCadence = "weekly" | "monthly";

export interface AllowanceRule {
  kidId: string;
  amountPaise: Paise;
  cadence: AllowanceCadence;
  /** weekly payout day */
  weekday: Weekday;
  /** monthly payout day (1–28) */
  dayOfMonth: number;
  allocation: JarAllocation;
  active: boolean;
  lastPaidOn?: ISODate;
}

/** "Bank of Mum & Dad": parent pays interest on the Save jar so kids watch compounding happen. */
export interface InterestRule {
  kidId: string;
  annualRatePercent: number;
  active: boolean;
  lastAccruedMonth?: string; // YYYY-MM
}

// ---------- Learning ----------

export type LessonCardKind = "story" | "fact" | "tip" | "challenge";

export interface LessonCard {
  kind: LessonCardKind;
  emoji: string;
  title: string;
  body: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  emoji: string;
  minutes: number;
  ageBands: AgeBand[];
  /** Locked for free families */
  premium: boolean;
  cards: LessonCard[];
  quiz: QuizQuestion[];
  xp: number;
}

export interface LessonUnit {
  id: string;
  title: string;
  emoji: string;
  color: string;
  /** Maps to NCFE / CBSE financial-literacy workbook themes */
  curriculumTag: string;
  order: number;
}

export interface LessonProgress {
  kidId: string;
  lessonId: string;
  completedAt: ISODateTime;
  scorePercent: number;
  xpEarned: number;
}

export interface Streak {
  kidId: string;
  current: number;
  best: number;
  lastActiveOn?: ISODate;
}

export interface ParentGuide {
  id: string;
  title: string;
  ageBand: AgeBand | "all";
  minutes: number;
  emoji: string;
  summary: string;
  tips: string[];
}

// ---------- Rewards marketplace ----------

export type RewardCategory = "books" | "experiences" | "learning" | "treats" | "family";

export interface Reward {
  id: string;
  title: string;
  emoji: string;
  category: RewardCategory;
  pricePaise: Paise;
  partner: string;
  /** Rewards fulfilled by the parent at home (no partner) */
  fulfilledByParent: boolean;
  premiumOnly: boolean;
  blurb: string;
  /** Jar the price is taken from (defaults to Spend) */
  payFromJar?: JarKind;
}

export interface RewardOrder {
  id: string;
  kidId: string;
  rewardId: string;
  pricePaise: Paise;
  at: ISODateTime;
  status: "requested" | "approved" | "delivered";
}

// ---------- Family ----------

export interface Family {
  id: string;
  name: string;
  city: string;
  createdAt: ISODateTime;
}

import { assert } from "./errors";
import { newId } from "./ids";
import { createEntry } from "./ledger";
import { percentOf, type Paise } from "./money";
import type { ISODateTime } from "./time";
import type { Goal, LedgerEntry } from "./types";

export interface NewGoalInput {
  kidId: string;
  title: string;
  emoji: string;
  targetPaise: Paise;
  parentMatchPercent?: number;
  now: ISODateTime;
}

export function createGoal(input: NewGoalInput): Goal {
  assert(input.title.trim().length > 0, "goal_title", "Goal needs a name");
  assert(input.targetPaise > 0, "goal_target", "Goal target must be positive");
  const match = input.parentMatchPercent ?? 0;
  assert(match >= 0 && match <= 100, "goal_match", "Parent match must be 0–100%");
  return {
    id: newId("goal"),
    kidId: input.kidId,
    title: input.title.trim(),
    emoji: input.emoji,
    targetPaise: Math.round(input.targetPaise),
    savedPaise: 0,
    matchedPaise: 0,
    parentMatchPercent: match,
    status: "active",
    createdAt: input.now,
  };
}

export function goalFunded(goal: Goal): Paise {
  return goal.savedPaise + goal.matchedPaise;
}

export interface GoalProgress {
  fundedPaise: Paise;
  remainingPaise: Paise;
  percent: number;
  reached: boolean;
}

export function goalProgress(goal: Goal): GoalProgress {
  const funded = goalFunded(goal);
  return {
    fundedPaise: funded,
    remainingPaise: Math.max(0, goal.targetPaise - funded),
    percent: percentOf(funded, goal.targetPaise),
    reached: funded >= goal.targetPaise,
  };
}

export interface ContributeResult {
  goal: Goal;
  entries: LedgerEntry[];
  matchPaise: Paise;
}

/**
 * Move money from the kid's Save jar into a goal. The parent match is added on top,
 * capped so the goal never overshoots its target.
 */
export function contributeToGoal(
  goal: Goal,
  amountPaise: Paise,
  saveJarBalance: Paise,
  now: ISODateTime,
): ContributeResult {
  assert(goal.status === "active", "goal_state", "This goal is already reached");
  const amount = Math.round(amountPaise);
  assert(amount > 0, "amount_positive", "Contribution must be positive");
  assert(amount <= saveJarBalance, "insufficient_funds", "Not enough in the Save jar");
  const remaining = Math.max(0, goal.targetPaise - goalFunded(goal));
  assert(remaining > 0, "goal_state", "This goal is already fully funded");
  const contribution = Math.min(amount, remaining);
  const rawMatch = Math.round((contribution * goal.parentMatchPercent) / 100);
  const matchPaise = Math.min(rawMatch, remaining - contribution);
  const next: Goal = {
    ...goal,
    savedPaise: goal.savedPaise + contribution,
    matchedPaise: goal.matchedPaise + matchPaise,
  };
  if (goalFunded(next) >= next.targetPaise) {
    next.status = "reached";
    next.reachedAt = now;
  }
  const entries: LedgerEntry[] = [
    createEntry({
      kidId: goal.kidId,
      jar: "save",
      amountPaise: -contribution,
      kind: "goal_contribution",
      memo: `Saved for ${goal.title}`,
      at: now,
      refId: goal.id,
      emoji: goal.emoji,
    }),
  ];
  return { goal: next, entries, matchPaise };
}

export function redeemGoal(goal: Goal, now: ISODateTime): Goal {
  assert(goal.status === "reached", "goal_state", "Goal must be reached before redeeming");
  return { ...goal, status: "redeemed", reachedAt: goal.reachedAt ?? now };
}

/** Whole weeks until the goal is reached at a steady weekly contribution (match included). */
export function weeksToReach(goal: Goal, weeklyContributionPaise: Paise): number | null {
  if (weeklyContributionPaise <= 0) return null;
  const { remainingPaise } = goalProgress(goal);
  if (remainingPaise === 0) return 0;
  const perWeek = weeklyContributionPaise * (1 + goal.parentMatchPercent / 100);
  return Math.ceil(remainingPaise / perWeek);
}

export const GOAL_IDEAS: ReadonlyArray<{ title: string; emoji: string; rupees: number }> = [
  { title: "Cricket bat", emoji: "🏏", rupees: 2499 },
  { title: "New bicycle", emoji: "🚲", rupees: 6500 },
  { title: "LEGO set", emoji: "🧱", rupees: 1999 },
  { title: "Art supplies", emoji: "🎨", rupees: 799 },
  { title: "Football boots", emoji: "⚽", rupees: 1899 },
  { title: "Story books", emoji: "📚", rupees: 599 },
  { title: "Board game", emoji: "🎲", rupees: 1299 },
  { title: "Headphones", emoji: "🎧", rupees: 1499 },
];

/**
 * Pure commands: (state, input, now) → new state. Both apps call these, so every rule
 * lives in one place and is unit-testable without React.
 */
import { accrueInterest } from "./interest";
import { createAllowanceRule, isAllowanceDue, payAllowance } from "./allowance";
import type { CustomerInfo } from "./billing";
import {
  approveChore as approveChoreDomain,
  claimChore as claimChoreDomain,
  createChore,
  rejectChore as rejectChoreDomain,
  submitChore as submitChoreDomain,
  unclaimChore as unclaimChoreDomain,
  type NewChoreInput,
} from "./chores";
import { grantConsent, type ConsentMethod, type ConsentScope } from "./consent";
import { canUse, kidLimitReached } from "./entitlements";
import { assert, DomainError } from "./errors";
import { contributeToGoal as contributeDomain, createGoal as createGoalDomain, redeemGoal as redeemGoalDomain, type NewGoalInput } from "./goals";
import { newId } from "./ids";
import { createEntry, createSplitEntries, debitJar, jarBalances } from "./ledger";
import { completeLesson as completeLessonDomain, levelFor, type QuizResult } from "./lessons";
import type { Paise } from "./money";
import { LESSONS } from "./content/lessons";
import { REWARDS } from "./content/rewards";
import type { FamilySettings, FamilyState } from "./state";
import { emptyStreak, recordActivity } from "./streaks";
import { toISODate, type ISODateTime, type Weekday } from "./time";
import {
  ageBandFor,
  DEFAULT_ALLOCATION,
  type AllowanceCadence,
  type AllowanceRule,
  type AvatarId,
  type Chore,
  type Goal,
  type InterestRule,
  type JarAllocation,
  type JarKind,
  type Kid,
  type RewardOrder,
  type Streak,
} from "./types";

// ───────────────────────── helpers ─────────────────────────

function requireKid(state: FamilyState, kidId: string): Kid {
  const kid = state.kids.find((k) => k.id === kidId);
  assert(kid, "kid_not_found", "Kid not found");
  return kid;
}

function requireChore(state: FamilyState, choreId: string): Chore {
  const chore = state.chores.find((c) => c.id === choreId);
  assert(chore, "chore_not_found", "Chore not found");
  return chore;
}

function requireGoal(state: FamilyState, goalId: string): Goal {
  const goal = state.goals.find((g) => g.id === goalId);
  assert(goal, "goal_not_found", "Goal not found");
  return goal;
}

function replaceById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.map((x) => (x.id === item.id ? item : x));
}

function allocationFor(state: FamilyState, kidId: string): JarAllocation {
  return state.allowanceRules.find((r) => r.kidId === kidId)?.allocation ?? DEFAULT_ALLOCATION;
}

function streakFor(state: FamilyState, kidId: string): Streak {
  return state.streaks.find((s) => s.kidId === kidId) ?? emptyStreak(kidId);
}

function touchStreak(state: FamilyState, kidId: string, now: ISODateTime): FamilyState {
  const today = toISODate(new Date(now));
  const updated = recordActivity(streakFor(state, kidId), today);
  const others = state.streaks.filter((s) => s.kidId !== kidId);
  return { ...state, streaks: [...others, updated] };
}

// ───────────────────────── onboarding ─────────────────────────

export interface SetupFamilyInput {
  familyName: string;
  city: string;
  parentName: string;
  phoneMasked: string;
  pin: string;
  consentMethod: ConsentMethod;
  extraScopes?: ConsentScope[];
}

export function setupFamily(state: FamilyState, input: SetupFamilyInput, now: ISODateTime): FamilyState {
  assert(/^\d{4}$/.test(input.pin), "pin_format", "PIN must be 4 digits");
  assert(input.parentName.trim().length > 0, "parent_name", "Please enter your name");
  const parentId = newId("parent");
  return {
    ...state,
    family: {
      id: newId("family"),
      name: input.familyName.trim() || `${input.parentName.trim()}'s family`,
      city: input.city.trim(),
      createdAt: now,
    },
    parent: {
      id: parentId,
      name: input.parentName.trim(),
      phoneMasked: input.phoneMasked,
      pin: input.pin,
      avatarEmoji: "🧑",
    },
    consent: grantConsent(parentId, input.consentMethod, input.extraScopes ?? [], now),
    settings: { ...state.settings, parentAdConsent: (input.extraScopes ?? []).includes("parent_ads") },
  };
}

export function setParentPin(state: FamilyState, pin: string): FamilyState {
  assert(/^\d{4}$/.test(pin), "pin_format", "PIN must be 4 digits");
  assert(state.parent, "not_onboarded", "Set up the family first");
  return { ...state, parent: { ...state.parent, pin } };
}

export function updateSettings(state: FamilyState, patch: Partial<FamilySettings>): FamilyState {
  return { ...state, settings: { ...state.settings, ...patch } };
}

// ───────────────────────── kids ─────────────────────────

export interface AddKidInput {
  name: string;
  age: number;
  avatar: AvatarId;
  allowance?: {
    amountPaise: Paise;
    cadence: AllowanceCadence;
    weekday?: Weekday;
    dayOfMonth?: number;
    allocation?: JarAllocation;
  };
  interestRatePercent?: number;
}

export function addKid(state: FamilyState, input: AddKidInput, now: ISODateTime): { state: FamilyState; kid: Kid } {
  assert(input.name.trim().length > 0, "kid_name", "Please enter a name");
  assert(input.age >= 5 && input.age <= 17, "kid_age", "Chillar is for kids aged 5–17");
  if (kidLimitReached(state.planId, state.kids.length)) {
    throw new DomainError("kid_limit", "Free families can add 2 kids. Upgrade to Family Premium for unlimited kids.");
  }
  const kid: Kid = {
    id: newId("kid"),
    name: input.name.trim(),
    age: input.age,
    ageBand: ageBandFor(input.age),
    avatar: input.avatar,
    xp: 0,
    createdAt: now,
  };
  const allowanceRules = [...state.allowanceRules];
  if (input.allowance) {
    const a = input.allowance;
    const rule = createAllowanceRule({
      kidId: kid.id,
      amountPaise: a.amountPaise,
      cadence: a.cadence,
      allocation: a.allocation ?? DEFAULT_ALLOCATION,
      startsOn: toISODate(new Date(now)),
      ...(a.weekday !== undefined ? { weekday: a.weekday } : {}),
      ...(a.dayOfMonth !== undefined ? { dayOfMonth: a.dayOfMonth } : {}),
    });
    allowanceRules.push(rule);
  }
  const interestRules = [...state.interestRules];
  if (input.interestRatePercent !== undefined && input.interestRatePercent > 0) {
    interestRules.push({ kidId: kid.id, annualRatePercent: input.interestRatePercent, active: true });
  }
  return {
    state: {
      ...state,
      kids: [...state.kids, kid],
      allowanceRules,
      interestRules,
      streaks: [...state.streaks, emptyStreak(kid.id)],
    },
    kid,
  };
}

export function updateKid(state: FamilyState, kidId: string, patch: Partial<Pick<Kid, "name" | "age" | "avatar">>): FamilyState {
  const kid = requireKid(state, kidId);
  const next: Kid = { ...kid, ...patch };
  if (patch.age !== undefined) next.ageBand = ageBandFor(patch.age);
  return { ...state, kids: replaceById(state.kids, next) };
}

export function removeKid(state: FamilyState, kidId: string): FamilyState {
  requireKid(state, kidId);
  return {
    ...state,
    kids: state.kids.filter((k) => k.id !== kidId),
    ledger: state.ledger.filter((e) => e.kidId !== kidId),
    chores: state.chores.filter((c) => c.kidId !== kidId && c.claimedBy !== kidId),
    goals: state.goals.filter((g) => g.kidId !== kidId),
    allowanceRules: state.allowanceRules.filter((r) => r.kidId !== kidId),
    interestRules: state.interestRules.filter((r) => r.kidId !== kidId),
    lessonProgress: state.lessonProgress.filter((p) => p.kidId !== kidId),
    streaks: state.streaks.filter((s) => s.kidId !== kidId),
    rewardOrders: state.rewardOrders.filter((o) => o.kidId !== kidId),
  };
}

export function upsertAllowanceRule(state: FamilyState, rule: AllowanceRule): FamilyState {
  requireKid(state, rule.kidId);
  const others = state.allowanceRules.filter((r) => r.kidId !== rule.kidId);
  return { ...state, allowanceRules: [...others, rule] };
}

export function upsertInterestRule(state: FamilyState, rule: InterestRule): FamilyState {
  requireKid(state, rule.kidId);
  const others = state.interestRules.filter((r) => r.kidId !== rule.kidId);
  return { ...state, interestRules: [...others, rule] };
}

// ───────────────────────── money ─────────────────────────

/** Gift (shagun) or bonus credited and split into jars. */
export function giftMoney(
  state: FamilyState,
  input: { kidId: string; amountPaise: Paise; from: string; kind?: "gift" | "bonus"; emoji?: string },
  now: ISODateTime,
): FamilyState {
  requireKid(state, input.kidId);
  const entries = createSplitEntries({
    kidId: input.kidId,
    amountPaise: input.amountPaise,
    allocation: allocationFor(state, input.kidId),
    kind: input.kind ?? "gift",
    memo: input.kind === "bonus" ? `Bonus from ${input.from}` : `Shagun from ${input.from}`,
    at: now,
    emoji: input.emoji ?? "🧧",
  });
  return { ...state, ledger: [...state.ledger, ...entries] };
}

export function spendFromJar(
  state: FamilyState,
  input: { kidId: string; jar: JarKind; amountPaise: Paise; memo: string; emoji?: string },
  now: ISODateTime,
): FamilyState {
  requireKid(state, input.kidId);
  const entry = debitJar(state.ledger, {
    kidId: input.kidId,
    jar: input.jar,
    amountPaise: input.amountPaise,
    kind: input.jar === "share" ? "share_donation" : "spend",
    memo: input.memo,
    at: now,
    emoji: input.emoji ?? (input.jar === "share" ? "💝" : "🛍️"),
  });
  return { ...state, ledger: [...state.ledger, entry] };
}

/** Manual parent adjustment (correct a mistake, add cash handed over). */
export function adjustJar(
  state: FamilyState,
  input: { kidId: string; jar: JarKind; amountPaise: Paise; memo: string },
  now: ISODateTime,
): FamilyState {
  requireKid(state, input.kidId);
  assert(input.amountPaise !== 0, "amount_nonzero", "Adjustment cannot be zero");
  const entry = createEntry({ ...input, kind: "adjustment", at: now, emoji: "✏️" });
  return { ...state, ledger: [...state.ledger, entry] };
}

// ───────────────────────── chores ─────────────────────────

export function postChore(state: FamilyState, input: Omit<NewChoreInput, "now">, now: ISODateTime): { state: FamilyState; chore: Chore } {
  if (input.kidId) requireKid(state, input.kidId);
  const chore = createChore({ ...input, now });
  return { state: { ...state, chores: [...state.chores, chore] }, chore };
}

export function deleteChore(state: FamilyState, choreId: string): FamilyState {
  requireChore(state, choreId);
  return { ...state, chores: state.chores.filter((c) => c.id !== choreId) };
}

export function claimChore(state: FamilyState, choreId: string, kidId: string, now: ISODateTime): FamilyState {
  requireKid(state, kidId);
  const chore = claimChoreDomain(requireChore(state, choreId), kidId, now);
  return { ...state, chores: replaceById(state.chores, chore) };
}

export function unclaimChore(state: FamilyState, choreId: string, kidId: string): FamilyState {
  const chore = unclaimChoreDomain(requireChore(state, choreId), kidId);
  return { ...state, chores: replaceById(state.chores, chore) };
}

export function submitChore(
  state: FamilyState,
  choreId: string,
  kidId: string,
  now: ISODateTime,
  proof: { note?: string; photoUri?: string } = {},
): FamilyState {
  requireKid(state, kidId);
  const chore = submitChoreDomain(requireChore(state, choreId), kidId, now, proof);
  return touchStreak({ ...state, chores: replaceById(state.chores, chore) }, kidId, now);
}

export function approveChore(
  state: FamilyState,
  choreId: string,
  now: ISODateTime,
): { state: FamilyState; paidPaise: Paise; kidId: string } {
  const chore = requireChore(state, choreId);
  const kidId = chore.claimedBy;
  assert(kidId, "chore_owner", "Nobody has claimed this chore");
  const result = approveChoreDomain(chore, allocationFor(state, kidId), now);
  const chores = replaceById(state.chores, result.chore);
  if (result.next) chores.push(result.next);
  return {
    state: { ...state, chores, ledger: [...state.ledger, ...result.entries] },
    paidPaise: chore.rewardPaise,
    kidId,
  };
}

export function rejectChore(state: FamilyState, choreId: string, reason: string, now: ISODateTime): FamilyState {
  const chore = rejectChoreDomain(requireChore(state, choreId), reason, now);
  return { ...state, chores: replaceById(state.chores, chore) };
}

// ───────────────────────── goals ─────────────────────────

export function createGoal(state: FamilyState, input: Omit<NewGoalInput, "now">, now: ISODateTime): { state: FamilyState; goal: Goal } {
  requireKid(state, input.kidId);
  const goal = createGoalDomain({ ...input, now });
  return { state: { ...state, goals: [...state.goals, goal] }, goal };
}

export function updateGoalMatch(state: FamilyState, goalId: string, parentMatchPercent: number): FamilyState {
  const goal = requireGoal(state, goalId);
  assert(parentMatchPercent >= 0 && parentMatchPercent <= 100, "goal_match", "Match must be 0–100%");
  return { ...state, goals: replaceById(state.goals, { ...goal, parentMatchPercent }) };
}

export function contributeToGoal(
  state: FamilyState,
  goalId: string,
  amountPaise: Paise,
  now: ISODateTime,
): { state: FamilyState; goal: Goal; matchPaise: Paise } {
  const goal = requireGoal(state, goalId);
  const saveBalance = jarBalances(state.ledger, goal.kidId).save;
  const result = contributeDomain(goal, amountPaise, saveBalance, now);
  return {
    state: { ...state, goals: replaceById(state.goals, result.goal), ledger: [...state.ledger, ...result.entries] },
    goal: result.goal,
    matchPaise: result.matchPaise,
  };
}

export function redeemGoal(state: FamilyState, goalId: string, now: ISODateTime): FamilyState {
  const goal = redeemGoalDomain(requireGoal(state, goalId), now);
  return { ...state, goals: replaceById(state.goals, goal) };
}

// ───────────────────────── learning ─────────────────────────

export interface CompleteLessonOutcome {
  state: FamilyState;
  result: QuizResult;
  xpEarned: number;
  firstTime: boolean;
  leveledUp: boolean;
  streak: Streak;
}

export function completeLesson(
  state: FamilyState,
  kidId: string,
  lessonId: string,
  answers: ReadonlyArray<number | null>,
  now: ISODateTime,
): CompleteLessonOutcome {
  const kid = requireKid(state, kidId);
  const lesson = LESSONS.find((l) => l.id === lessonId);
  assert(lesson, "lesson_not_found", "Lesson not found");
  if (lesson.premium && !canUse(state.planId, "full_library")) {
    throw new DomainError("premium_required", "This lesson is part of Family Premium");
  }
  const outcome = completeLessonDomain(kid, lesson, state.lessonProgress, answers, now);
  const before = levelFor(kid.xp).level;
  const after = levelFor(outcome.kid.xp).level;
  const progress = state.lessonProgress.filter((p) => !(p.kidId === kidId && p.lessonId === lessonId));
  let next: FamilyState = {
    ...state,
    kids: replaceById(state.kids, outcome.kid),
    lessonProgress: [...progress, outcome.progress],
  };
  next = touchStreak(next, kidId, now);
  return {
    state: next,
    result: outcome.result,
    xpEarned: outcome.xpEarned,
    firstTime: outcome.firstTime,
    leveledUp: after > before,
    streak: streakFor(next, kidId),
  };
}

// ───────────────────────── rewards ─────────────────────────

export function requestReward(
  state: FamilyState,
  kidId: string,
  rewardId: string,
  now: ISODateTime,
): { state: FamilyState; order: RewardOrder } {
  requireKid(state, kidId);
  const reward = REWARDS.find((r) => r.id === rewardId);
  assert(reward, "reward_not_found", "Reward not found");
  if (reward.premiumOnly && !canUse(state.planId, "premium_rewards")) {
    throw new DomainError("premium_required", "This reward is a Family Premium exclusive");
  }
  const jar = reward.payFromJar ?? "spend";
  const entry = debitJar(state.ledger, {
    kidId,
    jar,
    amountPaise: reward.pricePaise,
    kind: "reward_purchase",
    memo: reward.title,
    at: now,
    refId: reward.id,
    emoji: reward.emoji,
  });
  const order: RewardOrder = {
    id: newId("order"),
    kidId,
    rewardId,
    pricePaise: reward.pricePaise,
    at: now,
    status: "requested",
  };
  return { state: { ...state, ledger: [...state.ledger, entry], rewardOrders: [...state.rewardOrders, order] }, order };
}

export function updateRewardOrder(state: FamilyState, orderId: string, status: RewardOrder["status"]): FamilyState {
  const order = state.rewardOrders.find((o) => o.id === orderId);
  assert(order, "order_not_found", "Order not found");
  return { ...state, rewardOrders: replaceById(state.rewardOrders, { ...order, status }) };
}

// ───────────────────────── scheduled jobs ─────────────────────────

export interface ScheduledJobsOutcome {
  state: FamilyState;
  allowancesPaid: Array<{ kidId: string; amountPaise: Paise }>;
  interestAccrued: Array<{ kidId: string; amountPaise: Paise }>;
}

/** Pay any due allowances and this month's interest. Safe to call on every app open. */
export function runScheduledJobs(state: FamilyState, now: ISODateTime): ScheduledJobsOutcome {
  const nowDate = new Date(now);
  let ledger = [...state.ledger];
  const allowancesPaid: ScheduledJobsOutcome["allowancesPaid"] = [];
  const allowanceRules = state.allowanceRules.map((rule) => {
    if (!isAllowanceDue(rule, nowDate)) return rule;
    const paid = payAllowance(rule, now);
    ledger = [...ledger, ...paid.entries];
    allowancesPaid.push({ kidId: rule.kidId, amountPaise: rule.amountPaise });
    return paid.rule;
  });
  const interestAccrued: ScheduledJobsOutcome["interestAccrued"] = [];
  const interestRules = state.interestRules.map((rule) => {
    const saveBalance = jarBalances(ledger, rule.kidId).save;
    const accrued = accrueInterest(rule, saveBalance, now);
    if (accrued.entry) {
      ledger = [...ledger, accrued.entry];
      interestAccrued.push({ kidId: rule.kidId, amountPaise: accrued.entry.amountPaise });
    }
    return accrued.rule;
  });
  return { state: { ...state, ledger, allowanceRules, interestRules }, allowancesPaid, interestAccrued };
}

// ───────────────────────── billing ─────────────────────────

export function applyCustomerInfo(state: FamilyState, info: CustomerInfo): FamilyState {
  return { ...state, billing: info, planId: info.activePlan };
}

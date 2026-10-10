import { assert } from "./errors";
import { createSplitEntries, validateAllocation } from "./ledger";
import type { Paise } from "./money";
import {
  addDays,
  fromISODate,
  nextDayOfMonth,
  nextWeekday,
  startOfDay,
  toISODate,
  type ISODate,
  type ISODateTime,
  type Weekday,
} from "./time";
import type { AllowanceCadence, AllowanceRule, JarAllocation, LedgerEntry } from "./types";

export interface NewAllowanceInput {
  kidId: string;
  amountPaise: Paise;
  cadence: AllowanceCadence;
  weekday?: Weekday;
  dayOfMonth?: number;
  allocation: JarAllocation;
  /** First date the rule is eligible to pay (defaults to today) */
  startsOn?: ISODate;
}

export function createAllowanceRule(input: NewAllowanceInput): AllowanceRule {
  assert(input.amountPaise >= 0, "allowance_amount", "Allowance cannot be negative");
  validateAllocation(input.allocation);
  const rule: AllowanceRule = {
    kidId: input.kidId,
    amountPaise: Math.round(input.amountPaise),
    cadence: input.cadence,
    weekday: input.weekday ?? 0,
    dayOfMonth: input.dayOfMonth ?? 1,
    allocation: input.allocation,
    active: true,
  };
  if (input.startsOn !== undefined) {
    // Treat the day before start as "already paid" so the first payout lands on/after startsOn.
    rule.lastPaidOn = toISODate(addDays(fromISODate(input.startsOn), -1));
  }
  return rule;
}

/** Next payout strictly after the last payout (or on/after `from` if never paid). */
export function nextPayoutDate(rule: AllowanceRule, from: Date): Date {
  const anchor = rule.lastPaidOn ? addDays(fromISODate(rule.lastPaidOn), 1) : startOfDay(from);
  return rule.cadence === "weekly"
    ? nextWeekday(anchor, rule.weekday, true)
    : nextDayOfMonth(anchor, rule.dayOfMonth, true);
}

export function isAllowanceDue(rule: AllowanceRule, now: Date): boolean {
  if (!rule.active || rule.amountPaise <= 0) return false;
  const due = nextPayoutDate(rule, now);
  return due.getTime() <= startOfDay(now).getTime();
}

export interface PayAllowanceResult {
  rule: AllowanceRule;
  entries: LedgerEntry[];
}

export function payAllowance(rule: AllowanceRule, now: ISODateTime): PayAllowanceResult {
  const nowDate = new Date(now);
  assert(isAllowanceDue(rule, nowDate), "allowance_not_due", "Allowance is not due yet");
  const entries = createSplitEntries({
    kidId: rule.kidId,
    amountPaise: rule.amountPaise,
    allocation: rule.allocation,
    kind: "allowance",
    memo: rule.cadence === "weekly" ? "Weekly pocket money" : "Monthly pocket money",
    at: now,
    emoji: "💸",
  });
  return { rule: { ...rule, lastPaidOn: toISODate(nowDate) }, entries };
}

/** Human label like "Every Sunday" or "1st of every month". */
export function describeCadence(rule: AllowanceRule): string {
  if (rule.cadence === "weekly") {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `Every ${names[rule.weekday] ?? "Sunday"}`;
  }
  const d = rule.dayOfMonth;
  const suffix = d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th";
  return `${d}${suffix} of every month`;
}

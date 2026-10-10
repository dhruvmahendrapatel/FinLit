import { createEntry } from "./ledger";
import type { Paise } from "./money";
import type { ISODateTime } from "./time";
import type { InterestRule, LedgerEntry } from "./types";

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Interest for one month on a balance at a simple annual rate. */
export function monthlyInterest(saveBalancePaise: Paise, annualRatePercent: number): Paise {
  if (saveBalancePaise <= 0 || annualRatePercent <= 0) return 0;
  return Math.round((saveBalancePaise * annualRatePercent) / 100 / 12);
}

export interface GrowthPoint {
  month: number;
  balancePaise: Paise;
  contributedPaise: Paise;
  interestPaise: Paise;
}

/** Month-by-month projection with monthly compounding — powers the "watch it grow" chart. */
export function projectGrowth(opts: {
  principalPaise: Paise;
  monthlyContributionPaise: Paise;
  annualRatePercent: number;
  months: number;
}): GrowthPoint[] {
  const points: GrowthPoint[] = [];
  let balance = Math.round(opts.principalPaise);
  let contributed = balance;
  let interestTotal = 0;
  points.push({ month: 0, balancePaise: balance, contributedPaise: contributed, interestPaise: 0 });
  for (let m = 1; m <= opts.months; m++) {
    const interest = monthlyInterest(balance, opts.annualRatePercent);
    interestTotal += interest;
    balance += interest + Math.round(opts.monthlyContributionPaise);
    contributed += Math.round(opts.monthlyContributionPaise);
    points.push({ month: m, balancePaise: balance, contributedPaise: contributed, interestPaise: interestTotal });
  }
  return points;
}

export interface AccrueResult {
  rule: InterestRule;
  entry: LedgerEntry | null;
}

/** Pay this month's interest into the Save jar once per calendar month. */
export function accrueInterest(rule: InterestRule, saveBalancePaise: Paise, now: ISODateTime): AccrueResult {
  const key = monthKey(new Date(now));
  if (!rule.active || rule.lastAccruedMonth === key) return { rule, entry: null };
  const amount = monthlyInterest(saveBalancePaise, rule.annualRatePercent);
  const nextRule: InterestRule = { ...rule, lastAccruedMonth: key };
  if (amount <= 0) return { rule: nextRule, entry: null };
  const entry = createEntry({
    kidId: rule.kidId,
    jar: "save",
    amountPaise: amount,
    kind: "interest",
    memo: `Bank of Mum & Dad interest (${rule.annualRatePercent}% p.a.)`,
    at: now,
    emoji: "🏦",
  });
  return { rule: nextRule, entry };
}

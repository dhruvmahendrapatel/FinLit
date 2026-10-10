import { assert } from "./errors";
import { newId } from "./ids";
import { createEntry } from "./ledger";
import { percentOf, type Paise } from "./money";
import type { ISODateTime } from "./time";
import type { AllowanceCadence, LedgerEntry, Loan } from "./types";

export const LOAN_MIN_PAISE = 100_00;
export const LOAN_MAX_PAISE = 5_000_00;
export const LOAN_INSTALMENT_OPTIONS = [4, 8, 12] as const;
export const LOAN_RATE_OPTIONS = [0, 6, 12, 24] as const;

export interface LoanPlanInput {
  principalPaise: Paise;
  annualRatePercent: number;
  instalments: number;
  cadence: AllowanceCadence;
}

export interface LoanPlan {
  interestPaise: Paise;
  totalPaise: Paise;
  emiPaise: Paise;
  lastEmiPaise: Paise;
  schedule: Paise[];
}

/**
 * Flat-rate plan kids can follow: interest = principal × rate × term, split into equal
 * instalments; the last one absorbs the rounding so the schedule sums exactly.
 */
export function planLoan(input: LoanPlanInput): LoanPlan {
  assert(input.principalPaise > 0, "loan_amount", "Loan amount must be positive");
  assert(Number.isInteger(input.instalments) && input.instalments > 0, "loan_term", "Instalments must be a whole number");
  assert(input.annualRatePercent >= 0, "loan_rate", "Rate cannot be negative");
  const periodsPerYear = input.cadence === "weekly" ? 52 : 12;
  const termYears = input.instalments / periodsPerYear;
  const interestPaise = Math.round(input.principalPaise * (input.annualRatePercent / 100) * termYears);
  const totalPaise = Math.round(input.principalPaise) + interestPaise;
  const emiPaise = Math.ceil(totalPaise / input.instalments);
  const schedule: Paise[] = [];
  let remaining = totalPaise;
  for (let i = 0; i < input.instalments; i++) {
    const amount = i === input.instalments - 1 ? remaining : Math.min(emiPaise, remaining);
    schedule.push(amount);
    remaining -= amount;
  }
  return { interestPaise, totalPaise, emiPaise, lastEmiPaise: schedule[schedule.length - 1] ?? emiPaise, schedule };
}

export interface NewLoanInput {
  kidId: string;
  purpose: string;
  emoji: string;
  principalPaise: Paise;
  instalments: number;
  cadence: AllowanceCadence;
  now: ISODateTime;
}

/** Kid asks for a loan; the rate is set by the parent at approval (planned at 0% until then). */
export function requestLoan(input: NewLoanInput): Loan {
  assert(input.purpose.trim().length > 0, "loan_purpose", "Say what the loan is for");
  assert(input.principalPaise >= LOAN_MIN_PAISE && input.principalPaise <= LOAN_MAX_PAISE, "loan_amount", "Loans are between ₹100 and ₹5,000");
  assert((LOAN_INSTALMENT_OPTIONS as readonly number[]).includes(input.instalments), "loan_term", "Pick 4, 8 or 12 instalments");
  const plan = planLoan({ principalPaise: input.principalPaise, annualRatePercent: 0, instalments: input.instalments, cadence: input.cadence });
  return {
    id: newId("loan"),
    kidId: input.kidId,
    purpose: input.purpose.trim(),
    emoji: input.emoji,
    principalPaise: Math.round(input.principalPaise),
    annualRatePercent: 0,
    instalments: input.instalments,
    cadence: input.cadence,
    totalPaise: plan.totalPaise,
    emiPaise: plan.emiPaise,
    repaidPaise: 0,
    status: "requested",
    requestedAt: input.now,
  };
}

export interface ApproveLoanResult {
  loan: Loan;
  /** Disbursement into the Spend jar */
  entry: LedgerEntry;
}

export function approveLoan(loan: Loan, annualRatePercent: number, now: ISODateTime): ApproveLoanResult {
  assert(loan.status === "requested", "loan_state", "Only requested loans can be approved");
  assert(annualRatePercent >= 0 && annualRatePercent <= 36, "loan_rate", "Rate must be 0–36%");
  const plan = planLoan({ principalPaise: loan.principalPaise, annualRatePercent, instalments: loan.instalments, cadence: loan.cadence });
  const active: Loan = { ...loan, status: "active", annualRatePercent, totalPaise: plan.totalPaise, emiPaise: plan.emiPaise, approvedAt: now };
  const entry = createEntry({
    kidId: loan.kidId,
    jar: "spend",
    amountPaise: loan.principalPaise,
    kind: "loan",
    memo: `Loan for ${loan.purpose}`,
    at: now,
    refId: loan.id,
    emoji: loan.emoji,
  });
  return { loan: active, entry };
}

export function declineLoan(loan: Loan, reason: string, now: ISODateTime): Loan {
  assert(loan.status === "requested", "loan_state", "Only requested loans can be declined");
  return { ...loan, status: "declined", declineReason: reason, closedAt: now };
}

export interface LoanProgress {
  remainingPaise: Paise;
  percent: number;
  /** What the next automatic deduction will try to take */
  nextDuePaise: Paise;
  paidInstalments: number;
}

export function loanProgress(loan: Loan): LoanProgress {
  const remaining = Math.max(0, loan.totalPaise - loan.repaidPaise);
  return {
    remainingPaise: remaining,
    percent: percentOf(loan.repaidPaise, loan.totalPaise),
    nextDuePaise: Math.min(loan.emiPaise, remaining),
    paidInstalments: Math.min(loan.instalments, Math.floor(loan.repaidPaise / Math.max(1, loan.emiPaise))),
  };
}

export interface RepayResult {
  loan: Loan;
  entry: LedgerEntry | null;
  paidPaise: Paise;
}

/**
 * Take a repayment from the Spend jar. Pays the requested amount, capped by what is owed and
 * what the jar holds (partial payments are fine; kids see the bar move either way).
 */
export function repayLoan(loan: Loan, requestedPaise: Paise, spendBalancePaise: Paise, now: ISODateTime): RepayResult {
  assert(loan.status === "active", "loan_state", "This loan is not active");
  const { remainingPaise } = loanProgress(loan);
  const amount = Math.max(0, Math.min(Math.round(requestedPaise), remainingPaise, spendBalancePaise));
  if (amount === 0) return { loan, entry: null, paidPaise: 0 };
  const repaid = loan.repaidPaise + amount;
  const next: Loan = { ...loan, repaidPaise: repaid };
  if (repaid >= loan.totalPaise) {
    next.status = "repaid";
    next.closedAt = now;
  }
  const entry = createEntry({
    kidId: loan.kidId,
    jar: "spend",
    amountPaise: -amount,
    kind: "loan_repayment",
    memo: `EMI for ${loan.purpose}`,
    at: now,
    refId: loan.id,
    emoji: "🧾",
  });
  return { loan: next, entry, paidPaise: amount };
}

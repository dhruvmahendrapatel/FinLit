import { describe, expect, it } from "vitest";
import * as cmd from "./commands";
import { DomainError } from "./errors";
import { approveLoan, declineLoan, loanProgress, planLoan, repayLoan, requestLoan } from "./loans";
import { rupees } from "./money";
import { createDemoState } from "./seed";
import { kidSummary, loansForKid, pendingApprovals } from "./selectors";
import { toISODate } from "./time";

const NOW = new Date(2026, 9, 10, 9);
const nowISO = NOW.toISOString();
const today = toISODate(NOW);

function premium(state = createDemoState(NOW)) {
  return cmd.applyCustomerInfo(state, { appUserId: "demo", activePlan: "premium_yearly", expiresAt: null, willRenew: true, isTrial: false, store: "mock" });
}

describe("loan maths", () => {
  it("plans a flat-rate loan whose schedule sums exactly", () => {
    const plan = planLoan({ principalPaise: rupees(1000), annualRatePercent: 12, instalments: 8, cadence: "weekly" });
    // 12% a year for 8 weeks ≈ ₹18.46 interest
    expect(plan.interestPaise).toBe(1846);
    expect(plan.totalPaise).toBe(rupees(1000) + 1846);
    expect(plan.schedule).toHaveLength(8);
    expect(plan.schedule.reduce((s, x) => s + x, 0)).toBe(plan.totalPaise);
    expect(plan.schedule[7]).toBeLessThanOrEqual(plan.emiPaise);
  });

  it("charges no interest at 0%", () => {
    const plan = planLoan({ principalPaise: rupees(500), annualRatePercent: 0, instalments: 4, cadence: "monthly" });
    expect(plan.interestPaise).toBe(0);
    expect(plan.emiPaise).toBe(rupees(125));
  });
});

describe("loan lifecycle", () => {
  it("request → approve credits the Spend jar → repay in parts → repaid", () => {
    let loan = requestLoan({ kidId: "k", purpose: "Cricket bat", emoji: "🏏", principalPaise: rupees(1000), instalments: 4, cadence: "weekly", now: nowISO });
    expect(loan.status).toBe("requested");
    const approved = approveLoan(loan, 12, nowISO);
    loan = approved.loan;
    expect(loan.status).toBe("active");
    expect(approved.entry.jar).toBe("spend");
    expect(approved.entry.amountPaise).toBe(rupees(1000));
    expect(loan.totalPaise).toBeGreaterThan(rupees(1000));
    const first = repayLoan(loan, loan.emiPaise, rupees(5000), nowISO);
    expect(first.paidPaise).toBe(loan.emiPaise);
    expect(loanProgress(first.loan).paidInstalments).toBe(1);
    const partial = repayLoan(first.loan, loan.emiPaise, 500, nowISO); // only ₹5 in the jar
    expect(partial.paidPaise).toBe(500);
    const final = repayLoan(partial.loan, rupees(10000), rupees(10000), nowISO);
    expect(final.loan.status).toBe("repaid");
    expect(final.loan.repaidPaise).toBe(loan.totalPaise);
    expect(() => repayLoan(final.loan, 100, 100, nowISO)).toThrow(/not active/);
  });

  it("can be declined and validates amounts", () => {
    const loan = requestLoan({ kidId: "k", purpose: "Bike", emoji: "🚲", principalPaise: rupees(2000), instalments: 12, cadence: "weekly", now: nowISO });
    expect(declineLoan(loan, "Save a bit more first", nowISO).status).toBe("declined");
    expect(() => requestLoan({ kidId: "k", purpose: "x", emoji: "x", principalPaise: rupees(50), instalments: 4, cadence: "weekly", now: nowISO })).toThrow(/between/);
    expect(() => requestLoan({ kidId: "k", purpose: "x", emoji: "x", principalPaise: rupees(500), instalments: 5, cadence: "weekly", now: nowISO })).toThrow(/4, 8 or 12/);
  });
});

describe("loan commands", () => {
  it("are premium-only and one at a time per kid", () => {
    const free = createDemoState(NOW);
    const aarav = free.kids.find((k) => k.name === "Aarav")!;
    expect(() => cmd.requestLoan(free, { kidId: aarav.id, purpose: "Bat", emoji: "🏏", principalPaise: rupees(500), instalments: 4 }, nowISO)).toThrow(DomainError);
    const state = premium(free);
    const { state: s1, loan } = cmd.requestLoan(state, { kidId: aarav.id, purpose: "Bat", emoji: "🏏", principalPaise: rupees(500), instalments: 4 }, nowISO);
    expect(pendingApprovals(s1).loans).toHaveLength(1);
    expect(pendingApprovals(s1).count).toBe(2); // + the submitted chore from the demo
    expect(kidSummary(s1, aarav.id, today).activeLoan?.id).toBe(loan.id);
    expect(() => cmd.requestLoan(s1, { kidId: aarav.id, purpose: "Another", emoji: "x", principalPaise: rupees(500), instalments: 4 }, nowISO)).toThrow(/waiting/);
  });

  it("auto-deducts an EMI on allowance day", () => {
    const aaravFree = createDemoState(NOW);
    const aarav = aaravFree.kids.find((k) => k.name === "Aarav")!;
    let state = premium(aaravFree);
    const { state: s1, loan } = cmd.requestLoan(state, { kidId: aarav.id, purpose: "Bat", emoji: "🏏", principalPaise: rupees(800), instalments: 8 }, nowISO);
    state = cmd.approveLoan(s1, loan.id, 12, nowISO).state;
    const spendBefore = kidSummary(state, aarav.id, today).jars.spend;
    expect(spendBefore).toBeGreaterThanOrEqual(rupees(800));
    const sunday = new Date(2026, 9, 11, 8).toISOString();
    const jobs = cmd.runScheduledJobs(state, sunday);
    expect(jobs.allowancesPaid.some((p) => p.kidId === aarav.id)).toBe(true);
    expect(jobs.loanRepayments).toHaveLength(1);
    const active = loansForKid(jobs.state, aarav.id)[0]!;
    expect(active.repaidPaise).toBe(active.emiPaise);
    // the same payout day does not deduct twice
    const again = cmd.runScheduledJobs(jobs.state, sunday);
    expect(again.loanRepayments).toHaveLength(0);
  });

  it("lets the kid pay early from the Spend jar", () => {
    const base = premium(createDemoState(NOW));
    const aarav = base.kids.find((k) => k.name === "Aarav")!;
    const { state: s1, loan } = cmd.requestLoan(base, { kidId: aarav.id, purpose: "Bat", emoji: "🏏", principalPaise: rupees(300), instalments: 4 }, nowISO);
    const s2 = cmd.approveLoan(s1, loan.id, 0, nowISO).state;
    const { state: s3, paidPaise } = cmd.repayLoan(s2, loan.id, rupees(300), nowISO);
    expect(paidPaise).toBe(rupees(300));
    expect(loansForKid(s3, aarav.id)[0]?.status).toBe("repaid");
    expect(kidSummary(s3, aarav.id, today).activeLoan).toBeNull();
  });
});

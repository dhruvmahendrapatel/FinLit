import { describe, expect, it } from "vitest";
import { createAllowanceRule, isAllowanceDue, nextPayoutDate, payAllowance } from "./allowance";
import { rupees } from "./money";
import { DEFAULT_ALLOCATION } from "./types";

describe("allowance", () => {
  it("is due on the payout weekday and not again that week", () => {
    const rule = createAllowanceRule({ kidId: "k", amountPaise: rupees(150), cadence: "weekly", weekday: 0, allocation: DEFAULT_ALLOCATION, startsOn: "2026-10-05" });
    expect(isAllowanceDue(rule, new Date(2026, 9, 10))).toBe(false); // Saturday
    expect(isAllowanceDue(rule, new Date(2026, 9, 11))).toBe(true); // Sunday
    const paid = payAllowance(rule, new Date(2026, 9, 11, 9).toISOString());
    expect(paid.rule.lastPaidOn).toBe("2026-10-11");
    expect(paid.entries.reduce((s, e) => s + e.amountPaise, 0)).toBe(rupees(150));
    expect(isAllowanceDue(paid.rule, new Date(2026, 9, 11, 20))).toBe(false);
    expect(isAllowanceDue(paid.rule, new Date(2026, 9, 18))).toBe(true);
  });

  it("catches up a missed payout day", () => {
    const rule = createAllowanceRule({ kidId: "k", amountPaise: rupees(150), cadence: "weekly", weekday: 0, allocation: DEFAULT_ALLOCATION, startsOn: "2026-10-05" });
    // App not opened on Sunday 11th; opened on Tuesday 13th
    expect(isAllowanceDue(rule, new Date(2026, 9, 13))).toBe(true);
  });

  it("handles monthly cadence", () => {
    const rule = createAllowanceRule({ kidId: "k", amountPaise: rupees(500), cadence: "monthly", dayOfMonth: 1, allocation: DEFAULT_ALLOCATION, startsOn: "2026-10-10" });
    expect(nextPayoutDate(rule, new Date(2026, 9, 10)).getDate()).toBe(1);
    expect(nextPayoutDate(rule, new Date(2026, 9, 10)).getMonth()).toBe(10); // November
    expect(isAllowanceDue(rule, new Date(2026, 9, 31))).toBe(false);
    expect(isAllowanceDue(rule, new Date(2026, 10, 1))).toBe(true);
  });

  it("does nothing when inactive or zero", () => {
    const rule = { ...createAllowanceRule({ kidId: "k", amountPaise: 0, cadence: "weekly", weekday: 0, allocation: DEFAULT_ALLOCATION }), active: true };
    expect(isAllowanceDue(rule, new Date(2026, 9, 11))).toBe(false);
  });
});

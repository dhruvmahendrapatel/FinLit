import { describe, expect, it } from "vitest";
import { accrueInterest, monthlyInterest, projectGrowth } from "./interest";
import { rupees } from "./money";

describe("interest", () => {
  it("computes one month of simple interest", () => {
    expect(monthlyInterest(rupees(1000), 12)).toBe(rupees(10));
    expect(monthlyInterest(0, 12)).toBe(0);
    expect(monthlyInterest(rupees(1000), 0)).toBe(0);
  });

  it("projects compounding growth month by month", () => {
    const points = projectGrowth({ principalPaise: rupees(1000), monthlyContributionPaise: rupees(100), annualRatePercent: 12, months: 12 });
    expect(points).toHaveLength(13);
    expect(points[0]?.balancePaise).toBe(rupees(1000));
    const last = points[12]!;
    expect(last.contributedPaise).toBe(rupees(2200));
    expect(last.balancePaise).toBeGreaterThan(last.contributedPaise);
    expect(last.interestPaise).toBe(last.balancePaise - last.contributedPaise);
    for (let i = 1; i < points.length; i++) expect(points[i]!.balancePaise).toBeGreaterThan(points[i - 1]!.balancePaise);
  });

  it("accrues once per calendar month", () => {
    const rule = { kidId: "k", annualRatePercent: 12, active: true };
    const first = accrueInterest(rule, rupees(1000), "2026-10-01T09:00:00.000Z");
    expect(first.entry?.amountPaise).toBe(rupees(10));
    expect(first.rule.lastAccruedMonth).toBe("2026-10");
    const again = accrueInterest(first.rule, rupees(1000), "2026-10-20T09:00:00.000Z");
    expect(again.entry).toBeNull();
    const nextMonth = accrueInterest(first.rule, rupees(1010), "2026-11-01T09:00:00.000Z");
    expect(nextMonth.entry?.amountPaise).toBe(rupees(10.1));
  });
});

import { describe, expect, it } from "vitest";
import * as cmd from "./commands";
import { DomainError } from "./errors";
import { rupees } from "./money";
import { createDemoState } from "./seed";
import { simulationProgress } from "./selectors";
import { CHAI_COST_PER_CUP, CHAI_SIM_ID, CHAI_STALL_RENT, demandFor, forecastFor, playChaiDay, scoreChaiGame } from "./simulation";

const NOW = new Date(2026, 9, 10, 9);
const nowISO = NOW.toISOString();

describe("chai stall", () => {
  it("sells fewer cups as the price rises and more when it is cold", () => {
    expect(demandFor(rupees(10), "sunny")).toBeGreaterThan(demandFor(rupees(20), "sunny"));
    expect(demandFor(rupees(20), "sunny")).toBeGreaterThan(demandFor(rupees(30), "sunny"));
    expect(demandFor(rupees(15), "cold")).toBeGreaterThan(demandFor(rupees(15), "sunny"));
    expect(demandFor(rupees(15), "rainy")).toBeLessThan(demandFor(rupees(15), "sunny"));
  });

  it("computes a day's profit from sales, cup cost and rent", () => {
    const day = playChaiDay(1, "sunny", { pricePaise: rupees(15), cupsMade: 40 });
    expect(day.sold).toBeLessThanOrEqual(40);
    expect(day.revenuePaise).toBe(day.sold * rupees(15));
    expect(day.costPaise).toBe(40 * CHAI_COST_PER_CUP + CHAI_STALL_RENT);
    expect(day.profitPaise).toBe(day.revenuePaise - day.costPaise);
    expect(day.wasted + day.sold).toBe(40);
  });

  it("gives a deterministic forecast and scores stars from total profit", () => {
    expect(forecastFor(3)).toEqual(forecastFor(3));
    expect(forecastFor(3)).toHaveLength(5);
    const loss = scoreChaiGame([playChaiDay(1, "rainy", { pricePaise: rupees(30), cupsMade: 80 })]);
    expect(loss.totalProfitPaise).toBeLessThan(0);
    expect(loss.stars).toBe(1);
    const good = scoreChaiGame(forecastFor(1).map((w, i) => playChaiDay(i + 1, w, { pricePaise: rupees(15), cupsMade: w === "cold" ? 80 : w === "rainy" ? 20 : 40 })));
    expect(good.stars).toBeGreaterThanOrEqual(2);
    expect(good.xp).toBeGreaterThanOrEqual(60);
  });

  it("records completion with XP once and needs premium", () => {
    const free = createDemoState(NOW);
    const aarav = free.kids.find((k) => k.name === "Aarav")!;
    expect(() => cmd.completeSimulation(free, aarav.id, CHAI_SIM_ID, { percent: 100, xp: 90 }, nowISO)).toThrow(DomainError);
    const state = cmd.applyCustomerInfo(free, { appUserId: "demo", activePlan: "premium_monthly", expiresAt: null, willRenew: true, isTrial: false, store: "mock" });
    const first = cmd.completeSimulation(state, aarav.id, CHAI_SIM_ID, { percent: 66, xp: 60 }, nowISO);
    expect(first.xpEarned).toBe(60);
    expect(first.firstTime).toBe(true);
    expect(simulationProgress(first.state, aarav.id, CHAI_SIM_ID)?.scorePercent).toBe(66);
    const second = cmd.completeSimulation(first.state, aarav.id, CHAI_SIM_ID, { percent: 100, xp: 90 }, nowISO);
    expect(second.xpEarned).toBe(0);
    expect(simulationProgress(second.state, aarav.id, CHAI_SIM_ID)?.scorePercent).toBe(100);
    expect(second.state.kids.find((k) => k.id === aarav.id)?.xp).toBe(aarav.xp + 60);
  });
});

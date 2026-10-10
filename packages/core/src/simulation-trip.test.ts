import { describe, expect, it } from "vitest";
import * as cmd from "./commands";
import { DomainError } from "./errors";
import { createDemoState } from "./seed";
import { simulationProgress } from "./selectors";
import { CHAI_SIM_ID } from "./simulation";
import {
  chooseTripOption,
  currentTripStep,
  isTripComplete,
  minRemainingTripCost,
  scoreTrip,
  startTrip,
  surpriseFor,
  TRIP_BUDGET_PAISE,
  TRIP_BUFFER_PAISE,
  TRIP_GREAT_SCORE,
  TRIP_SIM_ID,
  TRIP_STEP_COUNT,
  TRIP_SURPRISES,
  tripLeft,
  tripLines,
  tripSpent,
  tripStepsFor,
  tripTip,
  type TripState,
} from "./simulation-trip";

const NOW = new Date(2026, 9, 10, 9);
const nowISO = NOW.toISOString();

/** Play a whole trip by picking the option at `rank` (0 = cheapest, -1 = priciest) at every step. */
function playByCost(seed: number, rank: number): TripState {
  let state = startTrip(seed);
  while (!isTripComplete(state)) {
    const step = currentTripStep(state)!;
    const sorted = [...step.options].sort((a, b) => a.costPaise - b.costPaise);
    const pick = sorted.at(rank)!;
    state = chooseTripOption(state, pick.id);
  }
  return state;
}

function playIds(seed: number, ids: readonly string[]): TripState {
  return ids.reduce((s, id) => chooseTripOption(s, id), startTrip(seed));
}

/** The sensible middle road: train, homestay, thali, Tiger Point, the mid-cost fix for the surprise, chikki. */
function sensibleTrip(seed: number): TripState {
  const surprise = surpriseFor(seed);
  const mid = [...surprise.options].sort((a, b) => a.costPaise - b.costPaise)[1]!;
  return playIds(seed, ["travel_train", "stay_homestay", "food_thali", "fun_points", mid.id, "shop_chikki"]);
}

describe("family trip budget", () => {
  it("is deterministic from its seed and always has six steps ending in souvenirs", () => {
    for (const seed of [0, 1, 2, 3, 7, 42]) {
      expect(startTrip(seed)).toEqual(startTrip(seed));
      expect(tripStepsFor(seed)).toEqual(tripStepsFor(seed));
      const steps = tripStepsFor(seed);
      expect(steps).toHaveLength(TRIP_STEP_COUNT);
      expect(steps).toHaveLength(6);
      expect(steps.map((s) => s.id)).toEqual(["travel", "stay", "food", "activity", "surprise", "shopping"]);
      expect(steps[4]?.kind).toBe("surprise");
    }
    expect(surpriseFor(0)).toBe(TRIP_SURPRISES[0]);
    expect(surpriseFor(1)).toBe(TRIP_SURPRISES[1]);
    expect(surpriseFor(TRIP_SURPRISES.length)).toBe(TRIP_SURPRISES[0]);
    expect(surpriseFor(-1)).toBe(TRIP_SURPRISES[1]);
    expect(scoreTrip(sensibleTrip(2))).toEqual(scoreTrip(sensibleTrip(2)));
  });

  it("gives every option a unique id, a non-negative cost in whole paise and pips in range", () => {
    // tripStepsFor(0) already includes the first surprise, so add only the other surprises.
    const everyStep = [...tripStepsFor(0), ...TRIP_SURPRISES.slice(1)];
    const allIds = everyStep.flatMap((s) => s.options.map((o) => o.id));
    expect(new Set(allIds).size).toBe(allIds.length);
    for (const step of everyStep) {
      expect(step.options.length).toBeGreaterThanOrEqual(3);
      for (const o of step.options) {
        expect(Number.isInteger(o.costPaise)).toBe(true);
        expect(o.costPaise).toBeGreaterThanOrEqual(0);
        expect(o.costPaise % 100).toBe(0);
        expect(o.fun).toBeGreaterThanOrEqual(0);
        expect(o.fun).toBeLessThanOrEqual(3);
        expect(o.comfort).toBeGreaterThanOrEqual(0);
        expect(o.comfort).toBeLessThanOrEqual(3);
      }
    }
  });

  it("keeps spend, leftover and the breakdown consistent after every pick", () => {
    let state = startTrip(1);
    expect(tripSpent(state)).toBe(0);
    expect(tripLeft(state)).toBe(TRIP_BUDGET_PAISE);
    expect(minRemainingTripCost(state)).toBe(320_00 + 1_200_00 + 600_00 + 0 + 0 + 0);
    let expected = 0;
    while (!isTripComplete(state)) {
      const step = currentTripStep(state)!;
      const pick = step.options[step.options.length - 1]!;
      state = chooseTripOption(state, pick.id);
      expected += pick.costPaise;
      expect(tripSpent(state)).toBe(expected);
      expect(tripLeft(state)).toBe(TRIP_BUDGET_PAISE - expected);
      expect(tripLines(state).at(-1)?.option.id).toBe(pick.id);
    }
    const out = scoreTrip(state);
    expect(out.complete).toBe(true);
    expect(out.lines).toHaveLength(6);
    expect(out.spentPaise).toBe(expected);
    expect(out.leftPaise).toBe(TRIP_BUDGET_PAISE - expected);
    expect(out.fun).toBe(out.lines.reduce((s, l) => s + l.option.fun, 0));
    expect(out.comfort).toBe(out.lines.reduce((s, l) => s + l.option.comfort, 0));
    expect(out.happiness).toBe(out.fun + out.comfort);
    expect(out.fun).toBeLessThanOrEqual(out.maxFun);
    expect(out.comfort).toBeLessThanOrEqual(out.maxComfort);
    // Finished trips ignore further picks; unknown options are a programming error.
    expect(chooseTripOption(state, "travel_bus")).toBe(state);
    expect(() => chooseTripOption(startTrip(0), "nope")).toThrow(/Unknown option/);
  });

  it("lets a splurge run over budget and teaches needs, buffer and trade-offs", () => {
    for (const seed of [0, 1, 2]) {
      const state = playByCost(seed, -1);
      const out = scoreTrip(state);
      expect(out.overBudget).toBe(true);
      expect(out.leftPaise).toBeLessThan(0);
      expect(out.overByPaise).toBe(-out.leftPaise);
      expect(out.stars).toBe(1);
      expect(out.xp).toBe(40);
      expect(out.verdict).toMatch(/Over budget/);
      expect(out.lessons.some((l) => /Needs first/.test(l))).toBe(true);
      expect(out.lessons.some((l) => /Trade-offs/.test(l))).toBe(true);
      expect(tripTip(state)).toMatch(/Over budget by ₹/);
    }
    // The tip warns about a big spend, then about a thin cushion, before the budget is actually gone.
    expect(tripTip(playIds(0, ["travel_car"]))).toMatch(/^Big spend! That was 48%/);
    const mid = playIds(0, ["travel_car", "stay_hotel"]);
    expect(tripLeft(mid) - minRemainingTripCost(mid)).toBeLessThan(TRIP_BUFFER_PAISE);
    expect(tripTip(mid)).toMatch(/^Careful: ₹800 left/);
    expect(tripTip(playIds(0, ["travel_train"]))).toMatch(/^Good call\. ₹4,680 left for 5 more choices/);
    expect(tripTip(playIds(0, ["travel_train", "stay_homestay", "food_thali", "fun_trek"]))).toMatch(/^Free!/);
    expect(tripTip(sensibleTrip(0))).toMatch(/^Trip planned with ₹1,560 to spare/);
  });

  it("gives three stars to a sensible trip with buffer money left, two without a buffer, two to a joyless one", () => {
    for (const seed of [0, 1, 2]) {
      const out = scoreTrip(sensibleTrip(seed));
      expect(out.overBudget).toBe(false);
      expect(out.leftPaise).toBeGreaterThanOrEqual(TRIP_BUFFER_PAISE);
      expect(out.happiness).toBeGreaterThanOrEqual(TRIP_GREAT_SCORE);
      expect(out.stars).toBe(3);
      expect(out.xp).toBe(90);
      expect(out.verdict).toMatch(/Trip champion/);
      expect(out.lessons.length).toBeGreaterThanOrEqual(2);
      expect(out.lessons.length).toBeLessThanOrEqual(3);
    }
    // Great trip, but it leaves only ₹460: no buffer, so two stars and the buffer lesson.
    const tight = playIds(0, ["travel_train", "stay_resort", "food_dhaba", "fun_trek", "rain_chai", "shop_none"]);
    const tightOut = scoreTrip(tight);
    expect(tightOut.leftPaise).toBe(460_00);
    expect(tightOut.stars).toBe(2);
    expect(tightOut.verdict).toMatch(/So close/);
    expect(tightOut.lessons.some((l) => /Buffer money: keep/.test(l))).toBe(true);
    // Cheapest everything: lots of money left but little joy.
    const miser = playByCost(1, 0);
    const miserOut = scoreTrip(miser);
    expect(miserOut.overBudget).toBe(false);
    expect(miserOut.stars).toBeLessThan(3);
    expect(miserOut.leftPaise).toBeGreaterThan(TRIP_BUFFER_PAISE);
  });

  it("records completion with XP under its own id without touching the chai stall record", () => {
    const free = createDemoState(NOW);
    const aarav = free.kids.find((k) => k.name === "Aarav")!;
    expect(TRIP_SIM_ID).not.toBe(CHAI_SIM_ID);
    expect(() => cmd.completeSimulation(free, aarav.id, TRIP_SIM_ID, { percent: 100, xp: 90 }, nowISO)).toThrow(DomainError);
    const premium = cmd.applyCustomerInfo(free, { appUserId: "demo", activePlan: "premium_monthly", expiresAt: null, willRenew: true, isTrial: false, store: "mock" });
    const chai = cmd.completeSimulation(premium, aarav.id, CHAI_SIM_ID, { percent: 66, xp: 60 }, nowISO);
    const out = scoreTrip(sensibleTrip(0));
    const trip = cmd.completeSimulation(chai.state, aarav.id, TRIP_SIM_ID, { percent: Math.round((out.stars / 3) * 100), xp: out.xp }, nowISO);
    expect(trip.firstTime).toBe(true);
    expect(trip.xpEarned).toBe(90);
    expect(simulationProgress(trip.state, aarav.id, TRIP_SIM_ID)?.scorePercent).toBe(100);
    expect(simulationProgress(trip.state, aarav.id, CHAI_SIM_ID)?.scorePercent).toBe(66);
    expect(trip.state.kids.find((k) => k.id === aarav.id)?.xp).toBe(aarav.xp + 60 + 90);
    const replay = cmd.completeSimulation(trip.state, aarav.id, TRIP_SIM_ID, { percent: 33, xp: 40 }, nowISO);
    expect(replay.xpEarned).toBe(0);
    expect(simulationProgress(replay.state, aarav.id, TRIP_SIM_ID)?.scorePercent).toBe(100);
  });
});

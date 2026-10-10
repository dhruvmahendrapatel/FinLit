import { describe, expect, it } from "vitest";
import { contributeToGoal, createGoal, goalProgress, weeksToReach } from "./goals";
import { rupees } from "./money";

const NOW = "2026-10-10T09:00:00.000Z";

describe("goals", () => {
  it("adds the parent match on top of a contribution", () => {
    const goal = createGoal({ kidId: "k", title: "Cricket bat", emoji: "🏏", targetPaise: rupees(2499), parentMatchPercent: 25, now: NOW });
    const { goal: next, entries, matchPaise } = contributeToGoal(goal, rupees(200), rupees(500), NOW);
    expect(matchPaise).toBe(rupees(50));
    expect(next.savedPaise).toBe(rupees(200));
    expect(next.matchedPaise).toBe(rupees(50));
    expect(entries).toHaveLength(1);
    expect(entries[0]?.jar).toBe("save");
    expect(entries[0]?.amountPaise).toBe(-rupees(200));
    expect(goalProgress(next).percent).toBeCloseTo(10.0, 0);
  });

  it("caps the final contribution and marks the goal reached", () => {
    const goal = createGoal({ kidId: "k", title: "Book", emoji: "📚", targetPaise: rupees(100), parentMatchPercent: 50, now: NOW });
    const { goal: next, matchPaise } = contributeToGoal(goal, rupees(90), rupees(500), NOW);
    expect(next.savedPaise).toBe(rupees(90));
    expect(matchPaise).toBe(rupees(10)); // capped so funded == target
    expect(next.status).toBe("reached");
    expect(goalProgress(next).reached).toBe(true);
  });

  it("refuses to overdraw the Save jar", () => {
    const goal = createGoal({ kidId: "k", title: "Bag", emoji: "🎒", targetPaise: rupees(899), now: NOW });
    expect(() => contributeToGoal(goal, rupees(100), rupees(50), NOW)).toThrow(/Not enough/);
  });

  it("estimates weeks to reach a goal including the match", () => {
    const goal = createGoal({ kidId: "k", title: "Bat", emoji: "🏏", targetPaise: rupees(2500), parentMatchPercent: 25, now: NOW });
    expect(weeksToReach(goal, rupees(100))).toBe(20); // ₹125/week effective
    expect(weeksToReach(goal, 0)).toBeNull();
  });
});

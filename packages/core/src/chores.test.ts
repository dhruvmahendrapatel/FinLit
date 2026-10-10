import { beforeEach, describe, expect, it } from "vitest";
import { approveChore, claimChore, createChore, rejectChore, submitChore, unclaimChore } from "./chores";
import { setIdGenerator } from "./ids";
import { rupees } from "./money";
import { DEFAULT_ALLOCATION } from "./types";

const NOW = "2026-10-10T09:00:00.000Z";

beforeEach(() => {
  let n = 0;
  setIdGenerator((p) => `${p}_${++n}`);
});

describe("chore lifecycle", () => {
  it("walks open → claimed → submitted → approved and pays into jars", () => {
    let chore = createChore({ title: "Wash the car", emoji: "🚗", rewardPaise: rupees(100), now: NOW });
    chore = claimChore(chore, "kid_1", NOW);
    expect(chore.status).toBe("claimed");
    chore = submitChore(chore, "kid_1", NOW, { note: "Shiny!" });
    expect(chore.status).toBe("submitted");
    const { chore: approved, entries, next } = approveChore(chore, DEFAULT_ALLOCATION, NOW);
    expect(approved.status).toBe("approved");
    expect(next).toBeNull();
    expect(entries).toHaveLength(4);
    expect(entries.reduce((s, e) => s + e.amountPaise, 0)).toBe(rupees(100));
    expect(entries.every((e) => e.kidId === "kid_1" && e.kind === "chore")).toBe(true);
  });

  it("stops a kid from claiming another kid's chore", () => {
    const chore = createChore({ title: "Feed the dog", emoji: "🐶", rewardPaise: 1000, kidId: "kid_2", now: NOW });
    expect(() => claimChore(chore, "kid_1", NOW)).toThrow(/someone else/);
  });

  it("refuses invalid transitions", () => {
    const chore = createChore({ title: "Bed", emoji: "🛏️", rewardPaise: 1000, now: NOW });
    expect(() => approveChore(chore, DEFAULT_ALLOCATION, NOW)).toThrow(/Cannot approve/);
    expect(() => rejectChore(chore, "nope", NOW)).toThrow(/Cannot reject/);
  });

  it("lets a rejected chore be resubmitted by the same kid", () => {
    let chore = createChore({ title: "Desk", emoji: "🧹", rewardPaise: 2500, now: NOW });
    chore = submitChore(chore, "kid_1", NOW);
    chore = rejectChore(chore, "Still messy", NOW);
    expect(chore.status).toBe("rejected");
    expect(chore.rejectReason).toBe("Still messy");
    chore = submitChore(chore, "kid_1", NOW, { note: "Better now" });
    expect(chore.status).toBe("submitted");
    expect(chore.rejectReason).toBeUndefined();
    expect(() => submitChore(rejectChore(chore, "x", NOW), "kid_2", NOW)).toThrow(/Only the claimer/);
  });

  it("unclaims back to open", () => {
    const chore = claimChore(createChore({ title: "Plants", emoji: "🪴", rewardPaise: 1500, now: NOW }), "kid_1", NOW);
    const open = unclaimChore(chore, "kid_1");
    expect(open.status).toBe("open");
    expect(open.claimedBy).toBeUndefined();
  });

  it("spawns the next occurrence for recurring chores", () => {
    let chore = createChore({ title: "Bed", emoji: "🛏️", rewardPaise: 1000, recurrence: "daily", dueOn: "2026-10-10", now: NOW });
    chore = submitChore(chore, "kid_1", NOW);
    const { next } = approveChore(chore, DEFAULT_ALLOCATION, NOW);
    expect(next?.status).toBe("open");
    expect(next?.dueOn).toBe("2026-10-11");
    expect(next?.id).not.toBe(chore.id);
  });
});

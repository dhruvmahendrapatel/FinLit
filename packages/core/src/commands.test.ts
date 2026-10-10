import { describe, expect, it } from "vitest";
import * as cmd from "./commands";
import { DomainError } from "./errors";
import { rupees } from "./money";
import { createDemoState } from "./seed";
import { familyOverview, kidSummary, lessonPath, nextLessonFor, pendingApprovals } from "./selectors";
import { toISODate } from "./time";

const NOW = new Date(2026, 9, 10, 9, 0, 0); // Saturday 10 Oct 2026, local
const nowISO = NOW.toISOString();
const today = toISODate(NOW);

describe("demo family", () => {
  const state = createDemoState(NOW);
  const aarav = state.kids.find((k) => k.name === "Aarav")!;
  const meera = state.kids.find((k) => k.name === "Meera")!;

  it("is onboarded with two kids and a lived-in history", () => {
    expect(state.family?.name).toBe("The Sharma Family");
    expect(state.kids).toHaveLength(2);
    expect(state.ledger.length).toBeGreaterThan(20);
    const summary = kidSummary(state, aarav.id, today);
    expect(summary.totalPaise).toBeGreaterThan(0);
    for (const jar of Object.values(summary.jars)) expect(jar).toBeGreaterThanOrEqual(0);
    expect(summary.activeGoals).toHaveLength(1);
    expect(summary.streak).toBe(5);
    expect(summary.streakStatus).toBe("at_risk");
    expect(summary.lessonsCompleted).toBe(3);
    expect(summary.level.level).toBeGreaterThanOrEqual(2);
    expect(kidSummary(state, meera.id, today).streakStatus).toBe("active");
  });

  it("has one chore waiting for approval and nothing due today", () => {
    const overview = familyOverview(state, today);
    expect(overview.approvals.count).toBe(1);
    expect(overview.nextAllowance?.on).toBe("2026-10-11");
    const jobs = cmd.runScheduledJobs(state, nowISO);
    expect(jobs.allowancesPaid).toHaveLength(0);
    expect(jobs.interestAccrued.length).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic", () => {
    expect(JSON.stringify(createDemoState(NOW))).toBe(JSON.stringify(state));
  });
});

describe("commands", () => {
  it("approving a chore pays the kid into jars by their allocation", () => {
    const state = createDemoState(NOW);
    const pending = pendingApprovals(state).chores[0]!;
    const before = kidSummary(state, pending.claimedBy!, today);
    const { state: next, paidPaise } = cmd.approveChore(state, pending.id, nowISO);
    const after = kidSummary(next, pending.claimedBy!, today);
    expect(paidPaise).toBe(pending.rewardPaise);
    expect(after.totalPaise - before.totalPaise).toBe(pending.rewardPaise);
    expect(next.chores.find((c) => c.id === pending.id)?.status).toBe("approved");
    // daily chore spawns tomorrow's copy
    expect(next.chores.some((c) => c.title === pending.title && c.status === "open" && c.dueOn === "2026-10-11")).toBe(true);
  });

  it("pays allowance when the payout day arrives", () => {
    const state = createDemoState(NOW);
    const sunday = new Date(2026, 9, 11, 8).toISOString();
    const { state: next, allowancesPaid } = cmd.runScheduledJobs(state, sunday);
    expect(allowancesPaid).toHaveLength(2);
    const again = cmd.runScheduledJobs(next, sunday);
    expect(again.allowancesPaid).toHaveLength(0);
  });

  it("contributes to a goal and records the parent match", () => {
    const state = createDemoState(NOW);
    const goal = state.goals.find((g) => g.title === "Cricket bat")!;
    const saveBefore = kidSummary(state, goal.kidId, today).jars.save;
    const { state: next, matchPaise, goal: updated } = cmd.contributeToGoal(state, goal.id, rupees(100), nowISO);
    expect(matchPaise).toBe(rupees(25));
    expect(updated.savedPaise).toBe(goal.savedPaise + rupees(100));
    expect(kidSummary(next, goal.kidId, today).jars.save).toBe(saveBefore - rupees(100));
  });

  it("completes a lesson, awards xp and touches the streak", () => {
    const state = createDemoState(NOW);
    const aarav = state.kids.find((k) => k.name === "Aarav")!;
    const next = nextLessonFor(state, aarav.id)!;
    const answers = next.lesson.quiz.map((q) => q.correctIndex);
    const outcome = cmd.completeLesson(state, aarav.id, next.lesson.id, answers, nowISO);
    expect(outcome.result.percent).toBe(100);
    expect(outcome.xpEarned).toBe(next.lesson.xp);
    expect(outcome.streak.current).toBe(6);
    expect(kidSummary(outcome.state, aarav.id, today).streakStatus).toBe("active");
    expect(lessonPath(outcome.state, aarav.id).some((u) => u.lessons.some((l) => l.lesson.id === next.lesson.id && l.availability.completed))).toBe(true);
  });

  it("enforces the free kid limit and premium gates", () => {
    const state = createDemoState(NOW);
    expect(() => cmd.addKid(state, { name: "Kabir", age: 13, avatar: "fox" }, nowISO)).toThrow(DomainError);
    const premium = cmd.applyCustomerInfo(state, {
      appUserId: "demo",
      activePlan: "premium_yearly",
      expiresAt: null,
      willRenew: true,
      isTrial: false,
      store: "mock",
    });
    expect(cmd.addKid(premium, { name: "Kabir", age: 13, avatar: "fox" }, nowISO).kid.ageBand).toBe("builder");
    const aarav = state.kids.find((k) => k.name === "Aarav")!;
    expect(() => cmd.completeLesson(state, aarav.id, "l_compounding_snowball", [1, 1], nowISO)).toThrow(/Premium/);
    expect(() => cmd.requestReward(state, aarav.id, "r_science_kit", nowISO)).toThrow(/Premium/);
  });

  it("buys a reward from the Spend jar and queues it for approval", () => {
    const state = createDemoState(NOW);
    const aarav = state.kids.find((k) => k.name === "Aarav")!;
    const spendBefore = kidSummary(state, aarav.id, today).jars.spend;
    const { state: next, order } = cmd.requestReward(state, aarav.id, "r_movie_night", nowISO);
    expect(order.status).toBe("requested");
    expect(kidSummary(next, aarav.id, today).jars.spend).toBe(spendBefore - rupees(150));
    expect(pendingApprovals(next).rewardOrders).toHaveLength(1);
    expect(() => cmd.requestReward(next, aarav.id, "r_amar_chitra", nowISO)).toThrow(/Not enough/);
  });
});

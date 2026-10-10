import { describe, expect, it } from "vitest";
import { effectiveStreak, emptyStreak, recordActivity, streakStatus } from "./streaks";

describe("streaks", () => {
  it("grows on consecutive days and resets after a gap", () => {
    let s = emptyStreak("k");
    s = recordActivity(s, "2026-10-01");
    s = recordActivity(s, "2026-10-02");
    s = recordActivity(s, "2026-10-02"); // same day: no change
    expect(s.current).toBe(2);
    s = recordActivity(s, "2026-10-05");
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
  });

  it("reports status relative to today", () => {
    const s = { kidId: "k", current: 5, best: 9, lastActiveOn: "2026-10-09" };
    expect(streakStatus(s, "2026-10-09")).toBe("active");
    expect(streakStatus(s, "2026-10-10")).toBe("at_risk");
    expect(streakStatus(s, "2026-10-11")).toBe("broken");
    expect(effectiveStreak(s, "2026-10-10")).toBe(5);
    expect(effectiveStreak(s, "2026-10-11")).toBe(0);
    expect(streakStatus(emptyStreak("k"), "2026-10-10")).toBe("none");
  });
});

/**
 * Demo family used for development, screenshots and tests. Built through the same
 * commands the apps use, with backdated timestamps so history looks lived-in.
 */
import * as cmd from "./commands";
import { setIdGenerator } from "./ids";
import { rupees } from "./money";
import { emptyState, type FamilyState } from "./state";
import { addDays, toISODate } from "./time";

function iso(d: Date, hour = 9, minute = 0): string {
  const out = new Date(d);
  out.setHours(hour, minute, 0, 0);
  return out.toISOString();
}

export function createDemoState(now: Date = new Date()): FamilyState {
  const counters = new Map<string, number>();
  setIdGenerator((prefix) => {
    const n = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, n);
    return `demo_${prefix}_${n}`;
  });
  try {
    return build(now);
  } finally {
    setIdGenerator(null);
  }
}

function build(now: Date): FamilyState {
  const d = (daysAgo: number, hour = 9) => iso(addDays(now, -daysAgo), hour);
  const today = toISODate(now);

  let s = cmd.setupFamily(
    emptyState(),
    {
      familyName: "The Sharma Family",
      city: "Pune",
      parentName: "Priya Sharma",
      phoneMasked: "+91 98••• ••321",
      pin: "1234",
      consentMethod: "otp_demo",
    },
    d(45),
  );

  // Kids
  const aaravRes = cmd.addKid(
    s,
    {
      name: "Aarav",
      age: 10,
      avatar: "tiger",
      allowance: { amountPaise: rupees(150), cadence: "weekly", weekday: 0 },
      interestRatePercent: 12,
    },
    d(45),
  );
  s = aaravRes.state;
  const aarav = aaravRes.kid.id;

  const meeraRes = cmd.addKid(
    s,
    {
      name: "Meera",
      age: 7,
      avatar: "unicorn",
      allowance: { amountPaise: rupees(60), cadence: "weekly", weekday: 0, allocation: { spend: 50, save: 30, share: 10, invest: 10 } },
      interestRatePercent: 12,
    },
    d(45),
  );
  s = meeraRes.state;
  const meera = meeraRes.kid.id;

  // Six weeks of allowance for both kids (paid by hand so dates are in the past)
  for (let week = 6; week >= 1; week--) {
    s = cmd.giftMoney(s, { kidId: aarav, amountPaise: rupees(150), from: "Mummy", kind: "bonus", emoji: "💸" }, d(week * 7, 8));
    s = cmd.giftMoney(s, { kidId: meera, amountPaise: rupees(60), from: "Mummy", kind: "bonus", emoji: "💸" }, d(week * 7, 8));
  }
  // Relabel those as allowance for realism
  s = {
    ...s,
    ledger: s.ledger.map((e) => (e.kind === "bonus" && e.memo === "Bonus from Mummy" ? { ...e, kind: "allowance", memo: "Weekly pocket money" } : e)),
  };
  // Mark allowance rules as paid last Sunday so nothing is due at first open
  s = {
    ...s,
    allowanceRules: s.allowanceRules.map((r) => {
      const lastSunday = addDays(now, -((now.getDay() + 7) % 7 || 7));
      return { ...r, lastPaidOn: toISODate(lastSunday) };
    }),
  };

  // Diwali shagun from Nani
  s = cmd.giftMoney(s, { kidId: aarav, amountPaise: rupees(501), from: "Nani" }, d(20, 18));
  s = cmd.giftMoney(s, { kidId: meera, amountPaise: rupees(251), from: "Nani" }, d(20, 18));

  // Chores: approved history
  const history: Array<[string, string, string, number, number]> = [
    [aarav, "Wash the car with Papa", "🚗", 100, 30],
    [aarav, "Help Dadi with groceries", "🛒", 50, 24],
    [meera, "Water the plants", "🪴", 15, 18],
    [aarav, "Clean your study desk", "🧹", 25, 12],
    [meera, "Make your bed", "🛏️", 10, 6],
    [aarav, "Fold the laundry", "🧺", 30, 4],
  ];
  for (const [kidId, title, emoji, rs, daysAgo] of history) {
    const posted = cmd.postChore(s, { title, emoji, rewardPaise: rupees(rs), kidId }, d(daysAgo + 1));
    s = posted.state;
    s = cmd.claimChore(s, posted.chore.id, kidId, d(daysAgo, 10));
    s = cmd.submitChore(s, posted.chore.id, kidId, d(daysAgo, 17), { note: "Done!" });
    s = cmd.approveChore(s, posted.chore.id, d(daysAgo, 19)).state;
  }

  // Interest paid last month
  s = cmd.giftMoney(s, { kidId: aarav, amountPaise: rupees(9), from: "Bank of Mum & Dad", kind: "bonus", emoji: "🏦" }, d(10, 7));
  s = {
    ...s,
    ledger: s.ledger.map((e) =>
      e.memo === "Bonus from Bank of Mum & Dad"
        ? { ...e, kind: "interest", jar: "save", memo: "Bank of Mum & Dad interest (12% p.a.)" }
        : e,
    ),
  };

  // A spend and a donation
  s = cmd.spendFromJar(s, { kidId: aarav, jar: "spend", amountPaise: rupees(60), memo: "Comics at the book fair", emoji: "📚" }, d(9, 16));
  s = cmd.spendFromJar(s, { kidId: meera, jar: "share", amountPaise: rupees(20), memo: "Street dog food", emoji: "🐶" }, d(8, 11));

  // Goals
  const bat = cmd.createGoal(s, { kidId: aarav, title: "Cricket bat", emoji: "🏏", targetPaise: rupees(2499), parentMatchPercent: 25 }, d(28));
  s = bat.state;
  s = cmd.contributeToGoal(s, bat.goal.id, rupees(300), d(21)).state;
  s = cmd.contributeToGoal(s, bat.goal.id, rupees(200), d(7)).state;

  const bag = cmd.createGoal(s, { kidId: meera, title: "Unicorn backpack", emoji: "🎒", targetPaise: rupees(899), parentMatchPercent: 50 }, d(14));
  s = bag.state;
  s = cmd.contributeToGoal(s, bag.goal.id, rupees(100), d(5)).state;

  // Open chores for today
  s = cmd.postChore(s, { title: "Make your bed", emoji: "🛏️", rewardPaise: rupees(10), kidId: null, recurrence: "daily", dueOn: today }, d(1)).state;
  s = cmd.postChore(s, { title: "Read for 20 minutes", emoji: "📚", rewardPaise: rupees(20), kidId: null, recurrence: "daily", dueOn: today }, d(1)).state;
  s = cmd.postChore(s, { title: "Water the plants", emoji: "🪴", rewardPaise: rupees(15), kidId: meera, recurrence: "daily", dueOn: today }, d(1)).state;
  const homework = cmd.postChore(s, { title: "Finish homework before 7pm", emoji: "✏️", rewardPaise: rupees(20), kidId: aarav, recurrence: "daily", dueOn: today }, d(1));
  s = homework.state;
  const laundry = cmd.postChore(s, { title: "Fold the laundry", emoji: "🧺", rewardPaise: rupees(30), kidId: aarav, recurrence: "weekly", dueOn: toISODate(addDays(now, 2)) }, d(1));
  s = laundry.state;

  // One chore waiting for Priya's approval, one in progress
  s = cmd.claimChore(s, homework.chore.id, aarav, d(0, 8));
  s = cmd.submitChore(s, homework.chore.id, aarav, d(0, 8, ), { note: "All maths done 📐" });
  s = cmd.claimChore(s, laundry.chore.id, aarav, d(0, 8));

  // Lessons: Aarav has done 3 (streak alive), Meera 2
  s = cmd.completeLesson(s, aarav, "l_three_jars", [1, 2, 1], d(4, 18)).state;
  s = cmd.completeLesson(s, aarav, "l_where_money_comes_from", [1, 1], d(3, 18)).state;
  s = cmd.completeLesson(s, aarav, "l_goal_cricket_bat", [3, 2], d(2, 18)).state;
  s = cmd.completeLesson(s, meera, "l_coins_notes_upi", [2, 2], d(1, 17)).state;
  s = cmd.completeLesson(s, meera, "l_needs_wants_sheru", [1, 1], d(0, 8)).state;

  // Hand-set streaks for a lively demo: Aarav 5 days (at risk today), Meera 2 (active)
  s = {
    ...s,
    streaks: s.streaks.map((st) =>
      st.kidId === aarav
        ? { ...st, current: 5, best: 9, lastActiveOn: toISODate(addDays(now, -1)) }
        : { ...st, current: 2, best: 4, lastActiveOn: today },
    ),
  };

  return s;
}

export const DEMO_PARENT_PIN = "1234";

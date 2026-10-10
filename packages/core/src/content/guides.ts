import type { ParentGuide } from "../types";

export const PARENT_GUIDES: readonly ParentGuide[] = [
  {
    id: "g_first_allowance",
    title: "Starting pocket money: how much and how often?",
    ageBand: "all",
    minutes: 3,
    emoji: "💸",
    summary: "A simple rule: ₹10–15 per year of age per week, paid on a fixed day, split into jars from day one.",
    tips: [
      "Pay on the same day every week so it feels like a salary, not a favour.",
      "Let the kid see the split happen. The jars teach more than the amount.",
      "Don't dock pocket money for behaviour; keep money lessons and discipline separate.",
    ],
  },
  {
    id: "g_chores_vs_duties",
    title: "Which chores should be paid?",
    ageBand: "all",
    minutes: 3,
    emoji: "🧹",
    summary: "Family duties (your own bed, your own plate) stay unpaid. Extra help (washing the car, helping Dadi) earns.",
    tips: [
      "Post 2–3 paid chores a week, not 20. Scarcity keeps them valuable.",
      "Ask for a photo or a show-me before approving. It builds the habit of finishing properly.",
      "Approve within a day. Delayed rewards teach less.",
    ],
  },
  {
    id: "g_parent_bank",
    title: "Be the Bank of Mum & Dad",
    ageBand: "earner",
    minutes: 4,
    emoji: "🏦",
    summary: "Pay 1% a month on the Save jar. It costs you a few rupees and teaches compounding years before school does.",
    tips: [
      "Announce interest day. Let them calculate it before the app shows it.",
      "Offer a 25% match on goals they stick with for a month.",
      "When they ask to borrow for something big, say yes with EMIs and a little interest.",
    ],
  },
  {
    id: "g_talking_money_5_8",
    title: "Talking about money with 5–8 year olds",
    ageBand: "explorer",
    minutes: 3,
    emoji: "🧸",
    summary: "Keep it concrete and physical: coins they can hold, jars they can see, choices they can make at the shop.",
    tips: [
      "Give them ₹20 at the kirana and let them choose. Mistakes at ₹20 are cheap lessons.",
      "Use “we are choosing not to” instead of “we can't afford it”.",
      "Count the Share jar together and pick a cause they understand (animals, a neighbour's school fees).",
    ],
  },
  {
    id: "g_scam_proof_teens",
    title: "Scam-proof your teenager",
    ageBand: "builder",
    minutes: 4,
    emoji: "🛡️",
    summary: "Teens lose money to fake jobs, fake refunds and “accidentally sent you money” tricks. Rehearse the scripts at home.",
    tips: [
      "Role-play: you are the scammer. Call, create urgency, ask for an OTP. See if they freeze.",
      "Rule: no payment request is accepted, no screenshot is trusted, no OTP is read out. Ever.",
      "Set up UPI Circle so you approve payments while they learn.",
    ],
  },
  {
    id: "g_screen_time",
    title: "Keep the app a tool, not a timesink",
    ageBand: "all",
    minutes: 2,
    emoji: "⏱️",
    summary: "Chillar is built for 5–10 minutes a day. Lessons are capped, there are no infinite feeds, and kid mode has no ads inside lessons.",
    tips: [
      "Make Sunday the money day: allowance, chores review, one lesson together.",
      "Celebrate streaks, not screen time.",
      "Use the daily limit in Settings to lock kid mode after the session.",
    ],
  },
];

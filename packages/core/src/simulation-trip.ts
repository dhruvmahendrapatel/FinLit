/**
 * Family trip budget simulation: plan two days in Lonavala for a family of four on a fixed
 * ₹5,000. Six choices in a row (travel, stay, food, the big day out, a surprise, souvenirs),
 * each with a cost and an effect on fun and comfort. Teaches needs vs wants, trade-offs and
 * keeping buffer money. Pure, deterministic functions; the screen only renders results.
 */
import { formatINR, type Paise } from "./money";

export const TRIP_SIM_ID = "sim_family_trip";
export const TRIP_BUDGET_PAISE: Paise = 5_000_00;
export const TRIP_FAMILY_SIZE = 4;
/** Keep at least this much unspent to earn the third star: real trips always have surprises. */
export const TRIP_BUFFER_PAISE: Paise = 500_00;
/** Fun + comfort needed for a "great" trip (3 stars) and an "okay" trip (2 stars). */
export const TRIP_GREAT_SCORE = 20;
export const TRIP_OK_SCORE = 14;

export type TripStepId = "travel" | "stay" | "food" | "activity" | "surprise" | "shopping";

/** 0 = none, 3 = lots. */
export type TripPips = 0 | 1 | 2 | 3;

export interface TripOption {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  costPaise: Paise;
  fun: TripPips;
  comfort: TripPips;
}

export interface TripStep {
  id: TripStepId;
  title: string;
  emoji: string;
  prompt: string;
  /** A surprise is an "uh-oh" moment the kid did not plan for. */
  kind: "choice" | "surprise";
  options: readonly TripOption[];
}

export interface TripPick {
  stepId: TripStepId;
  optionId: string;
}

export interface TripState {
  seed: number;
  budgetPaise: Paise;
  steps: readonly TripStep[];
  picks: readonly TripPick[];
}

export interface TripLine {
  step: TripStep;
  option: TripOption;
}

export interface TripOutcome {
  budgetPaise: Paise;
  spentPaise: Paise;
  /** Negative when over budget. */
  leftPaise: Paise;
  overBudget: boolean;
  overByPaise: Paise;
  fun: number;
  comfort: number;
  maxFun: number;
  maxComfort: number;
  /** fun + comfort */
  happiness: number;
  stars: 1 | 2 | 3;
  xp: number;
  verdict: string;
  lessons: readonly string[];
  lines: readonly TripLine[];
  complete: boolean;
}

const PLANNED_STEPS: readonly TripStep[] = [
  {
    id: "travel",
    title: "Getting there and back",
    emoji: "🚌",
    prompt: "Pune to Lonavala and home again, for all four of you.",
    kind: "choice",
    options: [
      { id: "travel_train", label: "Local train", emoji: "🚆", blurb: "Ghat tunnels, waterfalls out of the window and chai-wallahs on board. Crowded, though.", costPaise: 320_00, fun: 2, comfort: 1 },
      { id: "travel_bus", label: "State bus", emoji: "🚌", blurb: "The red ST bus, ₹60 a ticket each way. A seat for everyone and a window if you're quick.", costPaise: 480_00, fun: 1, comfort: 2 },
      { id: "travel_car", label: "Hire a car with driver", emoji: "🚗", blurb: "AC, door to door, stop wherever you like. It eats nearly half the budget, though.", costPaise: 2_400_00, fun: 2, comfort: 3 },
    ],
  },
  {
    id: "stay",
    title: "A place to sleep",
    emoji: "🛏️",
    prompt: "One night for the family. Where will you stay?",
    kind: "choice",
    options: [
      { id: "stay_homestay", label: "Homestay", emoji: "🏡", blurb: "Aunty's spare rooms, home-cooked breakfast and a friendly dog called Sheru.", costPaise: 1_200_00, fun: 2, comfort: 2 },
      { id: "stay_hotel", label: "Budget hotel", emoji: "🏨", blurb: "Clean room, TV, hot water. Nothing fancy, nothing wrong.", costPaise: 1_800_00, fun: 1, comfort: 2 },
      { id: "stay_resort", label: "Hill resort", emoji: "🏖️", blurb: "Swimming pool, buffet breakfast and a view of the valley. The budget groans.", costPaise: 3_500_00, fun: 3, comfort: 3 },
    ],
  },
  {
    id: "food",
    title: "Eating for two days",
    emoji: "🍽️",
    prompt: "Four hungry people, four meals. How will you feed them?",
    kind: "choice",
    options: [
      { id: "food_dhaba", label: "Roadside dhaba", emoji: "🫓", blurb: "Dal, roti and hot bhajiyas by the highway. Tasty and basic.", costPaise: 600_00, fun: 2, comfort: 1 },
      { id: "food_thali", label: "Thali restaurant", emoji: "🍛", blurb: "Unlimited thali, twice a day. Everyone leaves full and happy.", costPaise: 900_00, fun: 2, comfort: 2 },
      { id: "food_fancy", label: "Fancy restaurant", emoji: "🍕", blurb: "Pizza, cold drinks and dessert for all four. Twice.", costPaise: 1_800_00, fun: 3, comfort: 3 },
    ],
  },
  {
    id: "activity",
    title: "The big day out",
    emoji: "🎢",
    prompt: "A whole day free in the hills. What will you do?",
    kind: "choice",
    options: [
      { id: "fun_trek", label: "Trek to Lohagad fort", emoji: "🥾", blurb: "Free! Steep steps, misty views and a packed lunch from the homestay.", costPaise: 0, fun: 2, comfort: 1 },
      { id: "fun_points", label: "Tiger Point & Bhushi Dam", emoji: "🚕", blurb: "An auto for the day, hot bhutta at the dam and splashing in the steps.", costPaise: 600_00, fun: 2, comfort: 2 },
      { id: "fun_park", label: "Adventure park", emoji: "🎢", blurb: "Zip-line, go-karts and the giant swing. Thrilling, and pricey.", costPaise: 2_000_00, fun: 3, comfort: 2 },
    ],
  },
];

const SHOPPING_STEP: TripStep = {
  id: "shopping",
  title: "Souvenirs on the way home",
  emoji: "🛍️",
  prompt: "Last stop: the chikki shops by the highway. What comes home with you?",
  kind: "choice",
  options: [
    { id: "shop_none", label: "Just photos", emoji: "📸", blurb: "Memories are free. Dadi gets a video call instead of a gift.", costPaise: 0, fun: 1, comfort: 1 },
    { id: "shop_chikki", label: "Chikki for everyone at home", emoji: "🍬", blurb: "Lonavala's famous chikki and fudge for the whole family.", costPaise: 300_00, fun: 2, comfort: 1 },
    { id: "shop_toys", label: "Toys and T-shirts for all", emoji: "🧸", blurb: "Everyone picks a toy and a Lonavala T-shirt. Fun now, forgotten by Monday.", costPaise: 1_500_00, fun: 3, comfort: 1 },
  ],
};

/** The three "uh-oh" moments a trip can throw at you; which one happens is decided by the seed. */
export const TRIP_SURPRISES: readonly TripStep[] = [
  {
    id: "surprise",
    title: "Uh-oh: a cloudburst!",
    emoji: "⛈️",
    prompt: "The sky opens up and all four of you are getting soaked.",
    kind: "surprise",
    options: [
      { id: "rain_raincoats", label: "Buy 4 raincoats", emoji: "🧥", blurb: "Dry and warm all afternoon. Handy next monsoon too.", costPaise: 400_00, fun: 1, comfort: 3 },
      { id: "rain_chai", label: "Wait it out at a chai shop", emoji: "☕", blurb: "Hot chai and bhajiyas while the rain passes. Cosy.", costPaise: 120_00, fun: 2, comfort: 2 },
      { id: "rain_dance", label: "Dance in the rain!", emoji: "💃", blurb: "Free and fun... until everyone is cold, wet and sneezing.", costPaise: 0, fun: 3, comfort: 0 },
    ],
  },
  {
    id: "surprise",
    title: "Uh-oh: a flat tyre!",
    emoji: "🛞",
    prompt: "Your ride stops on the ghat road with a flat tyre.",
    kind: "surprise",
    options: [
      { id: "tyre_mechanic", label: "Pay a roadside mechanic", emoji: "🔧", blurb: "Fixed in 30 minutes and back on the road.", costPaise: 500_00, fun: 1, comfort: 3 },
      { id: "tyre_wait", label: "Wait for the next ride", emoji: "⏳", blurb: "Two hours on the roadside. Free, but hot and boring.", costPaise: 0, fun: 0, comfort: 1 },
      { id: "tyre_jeep", label: "Hire a jeep to finish the trip", emoji: "🚙", blurb: "Quick, but it costs more than the whole ride did.", costPaise: 1_200_00, fun: 1, comfort: 2 },
    ],
  },
  {
    id: "surprise",
    title: "Uh-oh: tummy trouble!",
    emoji: "🤒",
    prompt: "Your little brother feels sick after the winding ghat road.",
    kind: "surprise",
    options: [
      { id: "sick_doctor", label: "Visit a doctor", emoji: "🩺", blurb: "Medicine and a quick check-up. Everyone relaxes.", costPaise: 600_00, fun: 1, comfort: 3 },
      { id: "sick_rest", label: "Rest with a lemon soda", emoji: "🍋", blurb: "An hour at a cafe and he's smiling again.", costPaise: 150_00, fun: 1, comfort: 2 },
      { id: "sick_ignore", label: "Carry on, he'll be fine", emoji: "🤷", blurb: "Saves money, but a grumpy, sick brother spoils the mood for everyone.", costPaise: 0, fun: 1, comfort: 0 },
    ],
  },
];

/** Deterministic surprise so a game is reproducible from its seed. */
export function surpriseFor(seed: number): TripStep {
  const index = Math.abs(Math.trunc(seed)) % TRIP_SURPRISES.length;
  return TRIP_SURPRISES[index] ?? TRIP_SURPRISES[0]!;
}

/** The six steps of a trip: four planned choices, the surprise, then souvenirs with whatever is left. */
export function tripStepsFor(seed: number): readonly TripStep[] {
  return [...PLANNED_STEPS, surpriseFor(seed), SHOPPING_STEP];
}

export const TRIP_STEP_COUNT = PLANNED_STEPS.length + 2;

export function startTrip(seed = 0): TripState {
  return { seed, budgetPaise: TRIP_BUDGET_PAISE, steps: tripStepsFor(seed), picks: [] };
}

export function currentTripStep(state: TripState): TripStep | undefined {
  return state.steps[state.picks.length];
}

export function isTripComplete(state: TripState): boolean {
  return state.picks.length >= state.steps.length;
}

export function tripLines(state: TripState): TripLine[] {
  const lines: TripLine[] = [];
  state.picks.forEach((pick, i) => {
    const step = state.steps[i];
    const option = step?.options.find((o) => o.id === pick.optionId);
    if (step && option) lines.push({ step, option });
  });
  return lines;
}

export function tripSpent(state: TripState): Paise {
  return tripLines(state).reduce((s, l) => s + l.option.costPaise, 0);
}

export function tripLeft(state: TripState): Paise {
  return state.budgetPaise - tripSpent(state);
}

/** The cheapest way to finish the remaining steps. */
export function minRemainingTripCost(state: TripState): Paise {
  return state.steps.slice(state.picks.length).reduce((s, step) => s + Math.min(...step.options.map((o) => o.costPaise)), 0);
}

export function chooseTripOption(state: TripState, optionId: string): TripState {
  const step = currentTripStep(state);
  if (!step) return state;
  const option = step.options.find((o) => o.id === optionId);
  if (!option) throw new Error(`Unknown option "${optionId}" for trip step "${step.id}"`);
  return { ...state, picks: [...state.picks, { stepId: step.id, optionId }] };
}

function pct(part: Paise, whole: Paise): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function inr(paise: Paise): string {
  return formatINR(Math.abs(paise), { showPaise: false });
}

/** A one-line coaching tip about the most recent pick. */
export function tripTip(state: TripState): string {
  const lines = tripLines(state);
  const last = lines[lines.length - 1];
  if (!last) return "Pick what feels right. There's no single correct trip, only trade-offs.";
  const left = tripLeft(state);
  const remaining = state.steps.length - state.picks.length;
  const minAhead = minRemainingTripCost(state);
  const priciest = Math.max(...last.step.options.map((o) => o.costPaise));
  if (left < 0) return `Over budget by ${inr(-left)}! On a real trip that means borrowing money or going home early.`;
  if (last.option.costPaise === priciest && last.option.costPaise >= state.budgetPaise * 0.3) {
    return `Big spend! That was ${pct(last.option.costPaise, state.budgetPaise)}% of the whole budget in one go. Was it a need or a want?`;
  }
  if (remaining > 0 && left - minAhead < TRIP_BUFFER_PAISE) {
    return `Careful: ${inr(left)} left, and the cheapest way to finish the trip costs ${inr(minAhead)}. Not much room for surprises.`;
  }
  if (remaining === 0) return left >= TRIP_BUFFER_PAISE ? `Trip planned with ${inr(left)} to spare. That spare money is your safety cushion.` : `Trip planned with just ${inr(left)} to spare. Phew, that was close.`;
  if (last.option.costPaise === 0) return `Free! Some of the best trip memories cost nothing. ${inr(left)} left for ${remaining} more choices.`;
  if (last.step.kind === "surprise") return `Surprises are why smart planners keep spare money. ${inr(left)} left for ${remaining} more choice${remaining === 1 ? "" : "s"}.`;
  return `Good call. ${inr(left)} left for ${remaining} more choice${remaining === 1 ? "" : "s"}.`;
}

export function scoreTrip(state: TripState): TripOutcome {
  const lines = tripLines(state);
  const complete = isTripComplete(state);
  const spentPaise = lines.reduce((s, l) => s + l.option.costPaise, 0);
  const leftPaise = state.budgetPaise - spentPaise;
  const overBudget = leftPaise < 0;
  const overByPaise = Math.max(0, -leftPaise);
  const fun = lines.reduce((s, l) => s + l.option.fun, 0);
  const comfort = lines.reduce((s, l) => s + l.option.comfort, 0);
  const maxFun = state.steps.reduce((s, step) => s + Math.max(...step.options.map((o) => o.fun)), 0);
  const maxComfort = state.steps.reduce((s, step) => s + Math.max(...step.options.map((o) => o.comfort)), 0);
  const happiness = fun + comfort;
  const hasBuffer = leftPaise >= TRIP_BUFFER_PAISE;

  let stars: 1 | 2 | 3;
  if (overBudget || happiness < TRIP_OK_SCORE) stars = 1;
  else if (hasBuffer && happiness >= TRIP_GREAT_SCORE) stars = 3;
  else stars = 2;
  const xp = stars === 3 ? 90 : stars === 2 ? 60 : 40;

  let verdict: string;
  if (overBudget) verdict = `Over budget by ${inr(overByPaise)}. The family had fun, but someone had to borrow to get home.`;
  else if (happiness < TRIP_OK_SCORE) verdict = `You came home with ${inr(leftPaise)}, but nobody had much fun. Money saved is only useful if you spend it well one day.`;
  else if (stars === 3) verdict = `Trip champion! Everyone had a great time and you still came home with ${inr(leftPaise)} in your pocket.`;
  else if (!hasBuffer) verdict = `So close! A great trip, but only ${inr(leftPaise)} to spare. One more surprise and you'd have been stuck.`;
  else verdict = `A good trip with money to spare. Spend a little more where it matters most and you'll hit three stars.`;

  const lessons: string[] = [];
  const bigWants = lines.filter((l) => l.step.kind === "choice" && l.option.costPaise >= state.budgetPaise * 0.3);
  if (overBudget) {
    lessons.push("Needs first: travel, a safe place to sleep and food must fit the budget before the fun extras.");
    if (bigWants.length > 0) lessons.push(`Trade-offs: "${bigWants[0]!.option.label}" alone cost ${inr(bigWants[0]!.option.costPaise)}. One big want can squeeze out everything after it.`);
  } else if (!hasBuffer) {
    lessons.push(`Buffer money: keep about ${inr(TRIP_BUFFER_PAISE)} unspent. Real trips always have a flat tyre, a cloudburst or a tummy ache.`);
  } else {
    lessons.push("Buffer money: you kept spare cash for surprises. That's exactly what grown-up planners do.");
  }
  if (happiness < TRIP_OK_SCORE) {
    lessons.push("Trade-offs: a trip is for making memories too. Pick the two things the family cares about most and spend there.");
  } else if (comfort <= Math.floor(maxComfort / 3)) {
    lessons.push("Comfort and safety count: cold, tired or sick people don't enjoy even the cheapest trip.");
  } else if (!overBudget) {
    lessons.push("Trade-offs: every rupee has one job. Spending big on one thing means going simple on another, and that's fine.");
  }
  if (lessons.length < 3) lessons.push("Wants vs needs: ask \"what happens if we skip this?\" If the answer is \"nothing much\", it's a want.");

  return { budgetPaise: state.budgetPaise, spentPaise, leftPaise, overBudget, overByPaise, fun, comfort, maxFun, maxComfort, happiness, stars, xp, verdict, lessons, lines, complete };
}

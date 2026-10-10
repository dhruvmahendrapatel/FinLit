/**
 * Chai stall simulation: five days of running a stall at the school mela. Teaches cost,
 * price, demand and profit by doing. Pure functions; the screen only renders results.
 */
import type { Paise } from "./money";

export const CHAI_SIM_ID = "sim_chai_stall";
export const CHAI_DAYS = 5;
export const CHAI_COST_PER_CUP = 8_00;
export const CHAI_STALL_RENT = 50_00;
export const CHAI_PRICE_OPTIONS = [10_00, 15_00, 20_00, 30_00] as const;
export const CHAI_CUPS_OPTIONS = [20, 40, 60, 80] as const;

export type Weather = "sunny" | "cold" | "rainy";

export const WEATHER_INFO: Record<Weather, { emoji: string; label: string; hint: string }> = {
  sunny: { emoji: "☀️", label: "Sunny", hint: "A normal day. Steady crowd." },
  cold: { emoji: "🥶", label: "Cold & foggy", hint: "Everyone wants chai. Big crowd!" },
  rainy: { emoji: "🌧️", label: "Rainy", hint: "Fewer people come out. Careful." },
};

/** Deterministic forecast so a game is reproducible from its seed. */
export function forecastFor(seed: number): Weather[] {
  const cycle: Weather[] = ["sunny", "cold", "rainy", "sunny", "cold", "rainy", "sunny"];
  const start = Math.abs(Math.trunc(seed)) % cycle.length;
  return Array.from({ length: CHAI_DAYS }, (_, i) => cycle[(start + i) % cycle.length] ?? "sunny");
}

const BASE_DEMAND: Record<Weather, number> = { sunny: 55, cold: 85, rainy: 30 };

/** How many cups the crowd wants at a price: cheaper sells more, with diminishing returns. */
export function demandFor(pricePaise: Paise, weather: Weather): number {
  const rupees = pricePaise / 100;
  const factor = Math.max(0.15, Math.min(1.5, 1.7 - rupees / 22));
  return Math.round(BASE_DEMAND[weather] * factor);
}

export interface ChaiDayInput {
  pricePaise: Paise;
  cupsMade: number;
}

export interface ChaiDayResult {
  day: number;
  weather: Weather;
  pricePaise: Paise;
  cupsMade: number;
  demand: number;
  sold: number;
  wasted: number;
  missed: number;
  revenuePaise: Paise;
  costPaise: Paise;
  profitPaise: Paise;
  tip: string;
}

export function playChaiDay(day: number, weather: Weather, input: ChaiDayInput): ChaiDayResult {
  const demand = demandFor(input.pricePaise, weather);
  const sold = Math.min(input.cupsMade, demand);
  const wasted = input.cupsMade - sold;
  const missed = Math.max(0, demand - input.cupsMade);
  const revenuePaise = sold * input.pricePaise;
  const costPaise = input.cupsMade * CHAI_COST_PER_CUP + CHAI_STALL_RENT;
  const profitPaise = revenuePaise - costPaise;
  let tip: string;
  if (wasted >= 15) tip = `${wasted} cups went cold. Making fewer cups keeps costs down.`;
  else if (missed >= 15) tip = `${missed} customers walked away. You could make more cups, or charge a little more.`;
  else if (profitPaise < 0) tip = "A loss today: your price didn't cover the ₹8 per cup plus ₹50 rent.";
  else if (input.pricePaise >= 30_00 && sold < demand / 2) tip = "High price, few buyers. Try a lower price for more customers.";
  else tip = "Nice balance of price and cups. That's how real stalls make money.";
  return { day, weather, pricePaise: input.pricePaise, cupsMade: input.cupsMade, demand, sold, wasted, missed, revenuePaise, costPaise, profitPaise, tip };
}

export interface ChaiGameScore {
  totalProfitPaise: Paise;
  bestDayPaise: Paise;
  stars: 1 | 2 | 3;
  xp: number;
  verdict: string;
}

export function scoreChaiGame(results: readonly ChaiDayResult[]): ChaiGameScore {
  const totalProfitPaise = results.reduce((s, r) => s + r.profitPaise, 0);
  const bestDayPaise = results.reduce((m, r) => Math.max(m, r.profitPaise), 0);
  const stars: 1 | 2 | 3 = totalProfitPaise >= 1_500_00 ? 3 : totalProfitPaise >= 500_00 ? 2 : 1;
  const xp = stars === 3 ? 90 : stars === 2 ? 60 : 40;
  const verdict =
    stars === 3
      ? "Mela champion! You read the weather and priced like a pro."
      : stars === 2
        ? "Solid business. Match cups to the weather and you'll hit three stars."
        : totalProfitPaise < 0
          ? "You lost money, and that's the best way to learn: costs come first, price must beat them."
          : "A small profit. Watch the wasted cups and the missed customers.";
  return { totalProfitPaise, bestDayPaise, stars, xp, verdict };
}

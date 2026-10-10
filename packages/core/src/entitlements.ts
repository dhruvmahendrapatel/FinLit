import type { Paise } from "./money";

export type PlanId = "free" | "premium_monthly" | "premium_yearly";

export interface Plan {
  id: PlanId;
  name: string;
  pricePaise: Paise;
  period: "month" | "year" | null;
  /** e.g. "Best value" */
  badge?: string;
  /** e.g. "Save 16%" */
  savingsLabel?: string;
  trialDays: number;
  /** Store SKU used by the billing provider */
  productId: string | null;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Chillar Free",
    pricePaise: 0,
    period: null,
    trialDays: 0,
    productId: null,
  },
  premium_monthly: {
    id: "premium_monthly",
    name: "Family Premium",
    pricePaise: 99_00,
    period: "month",
    trialDays: 0,
    productId: "chillar_premium_monthly",
  },
  premium_yearly: {
    id: "premium_yearly",
    name: "Family Premium",
    pricePaise: 999_00,
    period: "year",
    badge: "Best value",
    savingsLabel: "Save 16%",
    trialDays: 7,
    productId: "chillar_premium_yearly",
  },
};

export type Feature =
  | "ad_free"
  | "unlimited_kids"
  | "full_library"
  | "simulations"
  | "ai_coach"
  | "family_loans"
  | "advanced_insights"
  | "premium_rewards"
  | "school_link";

export interface FeatureInfo {
  title: string;
  description: string;
  emoji: string;
  /** Shown on the paywall in this order */
  order: number;
}

export const FEATURE_INFO: Record<Feature, FeatureInfo> = {
  ad_free: { title: "No ads, anywhere", description: "A calm, ad-free app for the whole family", emoji: "🧘", order: 1 },
  unlimited_kids: { title: "Unlimited kids", description: "Free covers 2 kids. Premium covers everyone", emoji: "👨‍👩‍👧‍👦", order: 2 },
  full_library: { title: "Every lesson & cartoon", description: "The full age-banded library in English, Hindi and more", emoji: "🎬", order: 3 },
  simulations: { title: "Money simulations", description: "Run a chai stall, plan a trip, play the stock market", emoji: "🎮", order: 4 },
  ai_coach: { title: "AI money coach", description: "Safe, age-gated answers to “why can't I buy it now?”", emoji: "🤖", order: 5 },
  family_loans: { title: "Family loans & EMIs", description: "Borrow for big buys and repay in instalments", emoji: "🧾", order: 6 },
  advanced_insights: { title: "Parent insights", description: "Weekly reports on saving habits and learning", emoji: "📈", order: 7 },
  premium_rewards: { title: "Premium rewards", description: "Exclusive partner rewards in the shop", emoji: "🎁", order: 8 },
  school_link: { title: "School link", description: "Pay for verified attendance streaks and report cards", emoji: "🏫", order: 9 },
};

export const FREE_KID_LIMIT = 2;
/** Free families get the first N lessons of every unit. */
export const FREE_LESSONS_PER_UNIT = 2;

export interface Entitlements {
  planId: PlanId;
  isPremium: boolean;
  maxKids: number;
  features: ReadonlySet<Feature>;
}

const PREMIUM_FEATURES: readonly Feature[] = [
  "ad_free",
  "unlimited_kids",
  "full_library",
  "simulations",
  "ai_coach",
  "family_loans",
  "advanced_insights",
  "premium_rewards",
  "school_link",
];

export function isPremiumPlan(planId: PlanId): boolean {
  return planId !== "free";
}

export function entitlementsFor(planId: PlanId): Entitlements {
  const premium = isPremiumPlan(planId);
  return {
    planId,
    isPremium: premium,
    maxKids: premium ? Number.POSITIVE_INFINITY : FREE_KID_LIMIT,
    features: new Set<Feature>(premium ? PREMIUM_FEATURES : []),
  };
}

export function canUse(planId: PlanId, feature: Feature): boolean {
  return entitlementsFor(planId).features.has(feature);
}

export function kidLimitReached(planId: PlanId, kidCount: number): boolean {
  return kidCount >= entitlementsFor(planId).maxKids;
}

/** Features listed on the paywall, in display order. */
export function paywallFeatures(): Array<{ feature: Feature } & FeatureInfo> {
  return (Object.entries(FEATURE_INFO) as Array<[Feature, FeatureInfo]>)
    .map(([feature, info]) => ({ feature, ...info }))
    .sort((a, b) => a.order - b.order);
}

/** Monthly-equivalent price of a plan in paise, for "₹83/month" copy. */
export function monthlyEquivalent(plan: Plan): Paise {
  if (plan.period === "year") return Math.round(plan.pricePaise / 12);
  return plan.pricePaise;
}

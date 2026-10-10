# Monetization

Everything below is implemented or stubbed in code; prices and gates live in `packages/core/src/entitlements.ts` and `billing.ts`.

## Plans

| Plan | Price | Store SKU | Notes |
|---|---|---|---|
| Chillar Free | ₹0 | – | 2 kids, jars, chores, goals, interest, first 2 lessons of every unit, contextual ads |
| Family Premium · Monthly | ₹99 / month | `chillar_premium_monthly` | |
| Family Premium · Yearly | ₹999 / year (₹83/month) | `chillar_premium_yearly` | 7-day trial, "Best value", "Save 16%" — the default selection |

Research benchmark: Kutuki charges ₹1,999/year; education apps convert a median 2.3% (RevenueCat). The model assumes 1% → 3.5% conversion over five years.

## What Premium unlocks (`Feature`)

`ad_free`, `unlimited_kids`, `full_library`, `simulations`, `ai_coach`, `family_loans`, `advanced_insights`, `premium_rewards`, `school_link`.

Gates in the UI:

* 3rd kid → `UpsellCard feature="unlimited_kids"` in the add-kid flow.
* Premium lessons and lessons beyond the first two per unit → gold lock on the learning path; kids see "ask a parent", parents see the upsell on the Learn tab.
* Premium-only rewards → lock badge in the shop; `commands.requestReward` throws `premium_required`.
* Parent home → "Weekly insights" upsell.

## Billing abstraction

`BillingProvider` (configure / getOfferings / purchase / restorePurchases / getCustomerInfo) mirrors RevenueCat's shapes so the mock can be replaced by a `react-native-purchases` adapter without touching screens. `applyCustomerInfo` writes the active plan into `FamilyState`; entitlements derive from it. The mock simulates latency, cancellation and declines for testing.

## Ads

`adPolicy({ audience, planId, parentAdConsent, kidAgeBand, inLesson })` returns `none | contextual | consented_personalized`. Expected yield from the research: ₹35–45 per family a year, so ads are deliberately under 20% of year-5 revenue and never block the kid experience.

## Other streams (modelled, not yet wired)

* **Bank & mutual-fund partners**: ~₹300–360 per savings account, 0.5–1% SIP trail. Surface: parent `AdSlot` and a future "Grow jar → real SIP" flow.
* **Rewards marketplace**: 5–10% commission on partner rewards (`REWARDS[].partner`); parent-fulfilled rewards cost nothing and keep engagement.
* **CSR school programmes**: ~₹1 lakh per school per year; **school premium** ~₹60 per student. The `school_link` consent scope and feature flag exist; the ERP connector is V2.

## Guardrails that protect the brand

No ads inside lessons for under-9s · frequency caps · no selling of data · every partner offer shown to the parent, never the child · DPDP consent before any processing.

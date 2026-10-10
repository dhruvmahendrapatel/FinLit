# Roadmap

Mapped to the research's phases and 90-day plan. ✅ = in this repo.

## MVP (this repo)

- ✅ Parent onboarding with DPDP consent scopes and parent PIN
- ✅ Kids with age bands, avatars, allowance rules (weekly/monthly), jar allocation
- ✅ Pocket-money ledger in integer paise; Spend/Save/Share/Grow jars
- ✅ Chore board: post → claim → submit (with photo proof + note) → approve/reject, recurring chores
- ✅ Goals with parent match; Bank of Mum & Dad monthly interest; compounding chart
- ✅ 29 lessons / 9 units mapped to NCFE & CBSE themes, quizzes, XP, levels, streaks
- ✅ Scam & UPI safety lessons for 9–17
- ✅ Parent guides
- ✅ Family Premium plans, entitlements, paywall, mock billing (RevenueCat-shaped)
- ✅ Ad policy + placeholder slots (contextual for kids, consented for parents, none on Premium)
- ✅ Rewards marketplace with partner and parent-fulfilled rewards
- ✅ Enforced daily kid-mode time limit with a gentle stop screen and parent PIN override
- ✅ JSON data export and delete-all (DPDP access, portability, erasure)
- ✅ Local reminders: allowance day, streak nudge, pending approvals
- ✅ Cloud sync + kid-device pairing on a live Supabase project in Mumbai (schema, RLS, RPCs, realtime, conflict replay, chore-photo Storage)
- ✅ Family loans & EMIs: kid requests, parent sets 0–24% rate, EMIs auto-deduct from the Spend jar on pocket-money day, early repayment
- ✅ Chai-stall simulation: five days of price, cups and weather with cost/revenue/profit feedback and XP
- ✅ Family trip budget simulation: ₹5,000 for four, travel/stay/food/activity/surprise/souvenir trade-offs, stars for staying under budget with a buffer
- ✅ Honest paywall: AI coach, parent insights and school link are labelled "coming soon"
- ✅ Hindi versions of all 29 lessons, switchable from Settings
- ✅ Demo family, 60 core unit tests, typecheck, lint, web export, Playwright e2e smoke (11 steps) in CI, EAS build profiles

## Next 90 days

1. **Finish backend sign-in** – in the Supabase dashboard enable Anonymous sign-ins and Phone OTP with an Indian SMS provider (MSG91/Twilio); then run the parent-phone → kid-phone pairing smoke test with a photo chore.
2. **Store billing** – RevenueCat adapter for `BillingProvider`, products `chillar_premium_*`, server-side receipt validation.
3. **DigiLocker consent** – verifiable parental consent token in the pilot (DPDP Rule 10).
4. **Hindi UI** – lessons are translated; app chrome (buttons, labels) is still English. Native-speaker review of the lesson translations.
5. **Cartoon episodes** – 3 pilot episodes (one per band) on YouTube, embedded in lessons as "watch" cards.
6. **Analytics & experiments** – privacy-preserving, no ad IDs in the kid build.
7. **Device QA** – EAS development builds on iOS and Android (camera, notifications, sharing are native-only paths exercised by hand).
8. **More simulations** – a GST shopping game and a festival-savings challenge, on the simulation pattern (pure core reducer + screen).

## V2

- School connector (Entab / MyClassboard / Edunext) with verified achievement bounties
- Family tax (teaches income tax and GST)
- Shagun gifting links for relatives (viral loop)
- More simulations (family trip, virtual stock market, GST shopping)
- Parent insights report (weekly)

## V3

- Real money: UPI Circle delegation via licensed apps, partner-bank minor accounts and cards
- Kids' SIP with an AMFI-registered partner, shown as the Grow jar's real balance
- AI money coach (age-gated), teen entrepreneur track

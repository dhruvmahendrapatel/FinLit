# Roadmap

Mapped to the research's phases and 90-day plan. ✅ = in this repo.

## MVP (this repo)

- ✅ Parent onboarding with DPDP consent scopes and parent PIN
- ✅ Kids with age bands, avatars, allowance rules (weekly/monthly), jar allocation
- ✅ Pocket-money ledger in integer paise; Spend/Save/Share/Grow jars
- ✅ Chore board: post → claim → submit → approve/reject, recurring chores, photo-proof hook
- ✅ Goals with parent match; Bank of Mum & Dad monthly interest; compounding chart
- ✅ 17 lessons / 9 units mapped to NCFE & CBSE themes, quizzes, XP, levels, streaks
- ✅ Scam & UPI safety lessons for 9–17
- ✅ Parent guides
- ✅ Family Premium plans, entitlements, paywall, mock billing (RevenueCat-shaped)
- ✅ Ad policy + placeholder slots (contextual for kids, consented for parents, none on Premium)
- ✅ Rewards marketplace with partner and parent-fulfilled rewards
- ✅ Demo family, 45 core unit tests, typecheck, lint, web export, screenshots

## Next 90 days

1. **Backend & auth** – Supabase (Postgres + RLS per family), phone OTP login, sync `FamilyState` + command log; DigiLocker consent token in the pilot.
2. **Store billing** – RevenueCat adapter for `BillingProvider`, products `chillar_premium_*`, server-side receipt validation.
3. **Photo proof** – `expo-image-picker` on chore submit; parent sees the photo in the approval card.
4. **Hindi** – lesson content in Hindi (the `language` setting exists), Baloo 2 covers Devanagari.
5. **Cartoon episodes** – 3 pilot episodes (one per band) on YouTube, embedded in lessons as "watch" cards.
6. **Daily kid-mode limit** – enforce `dailyKidMinutes` with a gentle stop screen.
7. **Analytics & experiments** – privacy-preserving, no ad IDs in the kid build.

## V2

- School connector (Entab / MyClassboard / Edunext) with verified achievement bounties
- Family loans & EMIs, family tax (teaches income tax and GST)
- Shagun gifting links for relatives (viral loop)
- Simulations (chai stall, family trip, virtual stock market, GST shopping)
- Parent insights report (weekly)

## V3

- Real money: UPI Circle delegation via licensed apps, partner-bank minor accounts and cards
- Kids' SIP with an AMFI-registered partner, shown as the Grow jar's real balance
- AI money coach (age-gated), teen entrepreneur track

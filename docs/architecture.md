# Architecture

## One core, two experiences, three builds

The research rejected "one combined app" (kids see parent screens and ads; DPDP risk) and "two apps by feature" (double acquisition cost, loses the school link). It recommended **two apps by user on one shared core**. The codebase mirrors that:

```
packages/core  ──►  apps/mobile ──►  APP_VARIANT=family  (dev/demo: both experiences behind a PIN)
                                ──►  APP_VARIANT=parent  (Chillar for Parents)
                                ──►  APP_VARIANT=kid     (Chillar Kids – Google Play Families ready)
```

* **`packages/core`** is pure TypeScript with no React or Expo imports. Every business rule (jar splits, chore state machine, goal matching, interest accrual, lesson unlocking, entitlements, ad policy, consent) is a pure function with unit tests. Both experiences call the same `commands`.
* **`apps/mobile`** is one Expo Router project. `/kid/*` and `/parent/*` are separate route trees with their own theme, tab bar and stack. `app.config.ts` reads `APP_VARIANT` to set the name and bundle id, so the parent and kid apps ship from the same code without a monorepo of three apps.

Why not split the apps into separate packages now? Two app shells would double the navigation, theming and release plumbing before there is a backend to share. Splitting later is a move of two folders because the route trees are already independent.

## State

```
FamilyState (core/state.ts)        ← single serialisable object for the whole family
   │
   ├── commands.*(state, input, now) → state     pure, tested, throw DomainError on rule breaks
   ├── selectors.*(state, today)     → views     kidSummary, familyOverview, lessonPath…
   │
useFamilyStore (zustand + AsyncStorage)          persists FamilyState, exposes dispatch(cmd)
useSessionStore                                  which kid is active, parent PIN unlock (10 min)
```

`runScheduledJobs` runs on every launch: it pays due allowances (catching up missed payout days) and accrues one month of Bank-of-Mum-&-Dad interest per calendar month.

## Routing

```
/welcome                 marketing + "Try the demo family"
/onboarding/parent       name, phone (demo OTP), city
/onboarding/consent      DPDP scopes (required/optional), DigiLocker placeholder, parent PIN
/onboarding/kids         add kids: age, avatar, weekly allowance, interest toggle (free: 2 kids)
/who                     profile picker (Netflix-style)
/pin                     4-digit keypad, shake on error
/kid                     Home · Chores · Goals · Learn · Shop (floating pill tab bar)
/kid/lesson/[id]         card → quiz → results (XP, streak, confetti)
/kid/goal/new|[id]       create / fund a goal from the Save jar (parent match applied)
/kid/jar/[jar]           jar history; Save jar has the compounding "watch it grow" chart
/parent                  Home · Chores · Learn · Family (badge = pending approvals)
/parent/kid/[id]         jars, shagun/bonus, allowance rule, interest rule, goal match, ledger
/parent/chore/new        post a chore (ideas, reward, assignee, recurrence, due)
/parent/premium          paywall (parent-only, offers never reach kids)
/parent/settings         PIN, kid-mode time limit, language, ad consent, export, delete
```

## Trust & compliance by construction

* **Consent model** (`core/consent.ts`): versioned notice, required vs optional scopes, method `digilocker` (pilot) or `otp_demo`. Settings exposes export and delete.
* **Ad policy** (`core/ads.ts`): kids → contextual only; no ads inside lessons for under-9s; parent personalised ads only with opt-in; Premium → none. The `AdSlot` component cannot render anything the policy forbids.
* **No offers to children**: premium-locked lessons and rewards show "ask a parent"; the paywall is only reachable under `/parent`.
* **PIN gate**: `/parent/_layout.tsx` redirects to `/pin` unless the session was unlocked in the last 10 minutes.
* **Money is integer paise**: no floating-point drift; Indian digit grouping (₹12,34,567).

## Backend (next)

Core is designed to sit behind a sync layer: `FamilyState` is a plain JSON document keyed by family, commands are deterministic given `now`, and ids are injectable. A Supabase/Postgres backend with row-level security per family and a `commands` log is the intended next step; the app keeps working offline against the persisted state.

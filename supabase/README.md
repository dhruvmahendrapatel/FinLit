# Chillar backend (Supabase)

Schema, row-level security, RPCs and Storage policies for family sync.

| | |
|---|---|
| Project | `chillar` — ref `fgrlwxzpmeffljphhmqb` |
| Region | `ap-south-1` (Mumbai) for DPDP data residency |
| API URL | `https://fgrlwxzpmeffljphhmqb.supabase.co` |
| Applied | `20261010120000_init`, `20261010170000_chore_proofs_bucket` |

The app ships with the project URL and **publishable** key as defaults (`apps/mobile/app.config.ts`).
The publishable key is public by design; every table has RLS and every RPC is `authenticated`-only.
Never put the `service_role` key in the app.

## Applying future migrations

```bash
npm i -g supabase
supabase login
supabase link --project-ref fgrlwxzpmeffljphhmqb
supabase db push                       # applies new files in supabase/migrations/*.sql
```

## Dashboard checklist (one-time, cannot be done from SQL)

1. **Authentication › Sign In / Providers › Anonymous sign-ins: ON** — kid devices sign in anonymously, then redeem a pairing code.
2. **Authentication › Sign In / Providers › Phone: ON** and add an SMS provider (MSG91 or Twilio) with an Indian sender id — parents sign in with phone OTP.
3. **Authentication › Rate limits** — keep OTP sends at the default or lower; kids never receive SMS.
4. Optional: **Storage › chore-proofs** — confirm the bucket is private (it is created private by the migration).

## Local overrides

```
EXPO_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
# or build a no-cloud app:
EXPO_PUBLIC_SUPABASE_URL=off
```

See `docs/backend.md` for the data model, sync protocol and photo storage.

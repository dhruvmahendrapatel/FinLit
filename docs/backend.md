# Backend & sync

The MVP runs entirely on-device. Cloud sync is built and env-gated so the Parent app and Kid app can share one family across phones once a backend is provisioned. Nothing is provisioned yet.

## Data model (Supabase / Postgres)

| Table | Purpose |
|---|---|
| `families` | id, name, city, created_by |
| `family_members` | (family_id, user_id) → role `parent` \| `kid`, `kid_id` for kid devices |
| `family_state` | one JSON document per family (`FamilyState`), `revision` for optimistic concurrency |
| `command_log` | optional audit trail of command names/payloads |
| `pairing_codes` | 6-digit, 15-minute codes a parent mints for a kid's phone |

Row-level security scopes every row to family membership. Writes go through `security definer` RPCs:

* `create_family(name, city, state)` — parent uploads the local family once
* `save_family_state(family, state, expected_revision)` — fails with `40001 conflict` if the caller is stale
* `create_pairing_code(family, kid_id)` / `redeem_pairing_code(code)` — kid device joins as that kid
* `my_membership()` — which family and role the current user has

`family_state` is in the realtime publication, so every open device gets updates live.

## Auth

* Parents: phone OTP (`signInWithOtp` / `verifyOtp`).
* Kids: anonymous sign-in, then a pairing code. No phone numbers, no emails for children.

## Sync protocol (`apps/mobile/src/lib/sync.ts`)

1. On launch `initSync()` restores the session, reads membership, pulls the latest document and subscribes to realtime.
2. Every `dispatch` in the family store schedules a debounced push (800 ms) and keeps the command as a replayable function.
3. Push calls `save_family_state` with the last seen revision. On conflict the device pulls the newer document, **replays its pending commands** (they are pure functions) and pushes again. Commands that no longer apply (e.g. a chore someone else already approved) are dropped.
4. Realtime updates with a higher revision replace the local document.

Because the entire state is one document, this is last-writer-wins at the document level with command replay to avoid losing work. It is the right trade-off for a family of a few devices; a per-entity CRDT is unnecessary at this scale.

## Provisioning checklist

1. Create a Supabase project (India/Mumbai region `ap-south-1` for DPDP data residency).
2. `supabase link` + `supabase db push` (see `supabase/README.md`).
3. Authentication › Providers: enable Phone (Twilio/MSG91) and Anonymous sign-ins.
4. Set `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` as EAS secrets.
5. Smoke-test: parent signs in → Family › Cloud sync › Upload → Get code → kid phone joins.

## Not yet covered

Photo proof uploads (currently local URIs; add Supabase Storage with family-scoped paths), server-side receipt validation for Premium, and the school ERP connector.

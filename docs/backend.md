# Backend & sync

Every build works fully on-device; cloud sync lets the Parent app and Kid app share one family across phones. The backend is a Supabase project in Mumbai (`ap-south-1`, ref `fgrlwxzpmeffljphhmqb`) and the app ships with its URL and publishable key as defaults, so a fresh install can sign in and link a family without any configuration.

## Data model (Supabase / Postgres)

| Table | Purpose |
|---|---|
| `families` | id, name, city, created_by |
| `family_members` | (family_id, user_id) → role `parent` \| `kid`, `kid_id` for kid devices |
| `family_state` | one JSON document per family (`FamilyState`), `revision` for optimistic concurrency |
| `command_log` | optional audit trail of command names/payloads |
| `pairing_codes` | 6-digit, 15-minute codes a parent mints for a kid's phone; rows are superseded or marked `redeemed_at`, never deleted |

Row-level security scopes every row to family membership. Writes go through `security definer` RPCs:

* `create_family(name, city, state)` — parent uploads the local family once
* `save_family_state(family, state, expected_revision)` — fails with `40001 conflict` if the caller is stale
* `create_pairing_code(family, kid_id)` / `redeem_pairing_code(code)` — kid device joins as that kid
* `my_membership()` — which family and role the current user has

All RPCs are `authenticated`-only (kid devices sign in anonymously and still carry that role); nothing is callable with the bare publishable key. `family_state` is in the realtime publication, so every open device gets updates live.

## Chore photo storage

Private bucket `chore-proofs`, 5 MB limit, images only. Object paths are `<family_id>/<chore_id>/<timestamp>.<ext>` and the Storage policies reuse `is_family_member()` on the first path segment, so a photo is only ever readable by that kid's own family. The app stores `supabase://chore-proofs/<path>` in `Chore.proofPhotoUri` and resolves it to a one-hour signed URL for display (`apps/mobile/src/lib/storage.ts`, `ProofImage`). When the family is not cloud-linked, or the upload fails, the local file URI is used and the flow never blocks.

## Auth

* Parents: phone OTP (`signInWithOtp` / `verifyOtp`).
* Kids: anonymous sign-in, then a pairing code. No phone numbers, no emails for children.

## Sync protocol (`apps/mobile/src/lib/sync.ts`)

1. On launch `initSync()` restores the session, reads membership, pulls the latest document and subscribes to realtime.
2. Every `dispatch` in the family store schedules a debounced push (800 ms) and keeps the command as a replayable function.
3. Push calls `save_family_state` with the last seen revision. On conflict the device pulls the newer document, **replays its pending commands** (they are pure functions) and pushes again. Commands that no longer apply (e.g. a chore someone else already approved) are dropped.
4. Realtime updates with a higher revision replace the local document.

Because the entire state is one document, this is last-writer-wins at the document level with command replay to avoid losing work. It is the right trade-off for a family of a few devices; a per-entity CRDT is unnecessary at this scale.

## Provisioning status

| Step | Status |
|---|---|
| Supabase project in `ap-south-1` | Done (`chillar`, ref `fgrlwxzpmeffljphhmqb`) |
| Schema, RLS, RPCs (`20261010120000_init`) | Applied |
| Storage bucket + policies (`20261010170000_chore_proofs_bucket`) | Applied |
| Security advisor | Clean apart from the expected "signed-in users can call SECURITY DEFINER RPCs" notice |
| App defaults (`app.config.ts` → `extra.supabaseUrl/AnonKey`) | Shipped; `EXPO_PUBLIC_SUPABASE_URL=off` builds a no-cloud app |
| Anonymous sign-ins (dashboard) | **To do** — Authentication › Providers |
| Phone OTP + SMS provider (dashboard) | **To do** — Authentication › Providers (MSG91/Twilio) |

Smoke-test once the two dashboard toggles are on: parent signs in → Family › Cloud sync › Upload → Get code → kid phone joins → kid submits a chore with a photo → parent sees the photo on the Approvals card.

## Not yet covered

Server-side receipt validation for Premium, a purge job for old pairing codes and orphaned proof photos, and the school ERP connector.

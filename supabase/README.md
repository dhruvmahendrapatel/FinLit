# Chillar backend (Supabase)

Schema and policies for family sync. Not yet provisioned: apply with the Supabase CLI once a project exists.

```bash
npm i -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase db push                       # applies supabase/migrations/*.sql
```

Then set the app's environment (EAS secrets or a local `.env`):

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Enable **Phone** (OTP) and **Anonymous sign-ins** under Authentication › Providers. See `docs/backend.md` for the data model and sync protocol.

-- Chillar backend: one family = one JSON state document, synced by every member device.
-- Parents sign in with phone OTP; kid devices sign in anonymously and join with a pairing code.
-- Row-level security scopes everything to family membership.

create extension if not exists "pgcrypto";

create type public.member_role as enum ('parent', 'kid');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default '',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  -- Kid.id inside the FamilyState document, for kid devices
  kid_id text,
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create index family_members_user_idx on public.family_members (user_id);

create table public.family_state (
  family_id uuid primary key references public.families (id) on delete cascade,
  state jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

-- Audit trail of commands applied by devices (name + payload; state is the source of truth).
create table public.command_log (
  id bigint generated always as identity primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  actor uuid references auth.users (id),
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index command_log_family_idx on public.command_log (family_id, created_at desc);

-- Short-lived codes a parent generates so a kid's device can join as that kid.
create table public.pairing_codes (
  code text primary key,
  family_id uuid not null references public.families (id) on delete cascade,
  kid_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_state enable row level security;
alter table public.command_log enable row level security;
alter table public.pairing_codes enable row level security;

-- ───────── helpers ─────────

create function public.is_family_member(f uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_members m where m.family_id = f and m.user_id = auth.uid());
$$;

create function public.is_family_parent(f uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = f and m.user_id = auth.uid() and m.role = 'parent'
  );
$$;

-- ───────── policies ─────────

create policy "members read their family" on public.families
  for select using (public.is_family_member(id));
create policy "parents update their family" on public.families
  for update using (public.is_family_parent(id));

create policy "members see membership" on public.family_members
  for select using (public.is_family_member(family_id));

create policy "members read state" on public.family_state
  for select using (public.is_family_member(family_id));

create policy "members read command log" on public.command_log
  for select using (public.is_family_member(family_id));
create policy "members append to command log" on public.command_log
  for insert with check (public.is_family_member(family_id) and actor = auth.uid());

create policy "parents manage pairing codes" on public.pairing_codes
  for select using (public.is_family_parent(family_id));

-- ───────── RPCs (the only write paths besides command_log) ─────────

-- A signed-in parent creates the family and seeds the state document.
create function public.create_family(p_name text, p_city text, p_state jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  insert into public.families (name, city, created_by) values (p_name, coalesce(p_city, ''), auth.uid())
    returning id into v_family;
  insert into public.family_members (family_id, user_id, role) values (v_family, auth.uid(), 'parent');
  insert into public.family_state (family_id, state, revision, updated_by) values (v_family, p_state, 1, auth.uid());
  return v_family;
end;
$$;

-- Optimistic-concurrency write: succeeds only when the caller saw the latest revision.
create function public.save_family_state(p_family uuid, p_state jsonb, p_expected bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_revision bigint;
begin
  if not public.is_family_member(p_family) then
    raise exception 'not a member';
  end if;
  update public.family_state
    set state = p_state, revision = revision + 1, updated_at = now(), updated_by = auth.uid()
    where family_id = p_family and revision = p_expected
    returning revision into v_revision;
  if v_revision is null then
    raise exception 'conflict' using errcode = '40001';
  end if;
  return v_revision;
end;
$$;

-- Parent mints a 6-digit code valid for 15 minutes for one kid profile.
create function public.create_pairing_code(p_family uuid, p_kid_id text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  if not public.is_family_parent(p_family) then
    raise exception 'parents only';
  end if;
  delete from public.pairing_codes where expires_at < now() or (family_id = p_family and kid_id = p_kid_id);
  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.pairing_codes where code = v_code);
  end loop;
  insert into public.pairing_codes (code, family_id, kid_id, expires_at)
    values (v_code, p_family, p_kid_id, now() + interval '15 minutes');
  return v_code;
end;
$$;

-- A kid device (anonymous auth user) redeems the code and joins the family as that kid.
create function public.redeem_pairing_code(p_code text)
returns table (family_id uuid, kid_id text) language plpgsql security definer set search_path = public as $$
declare
  v_row public.pairing_codes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select * into v_row from public.pairing_codes c where c.code = p_code and c.expires_at > now();
  if v_row.code is null then
    raise exception 'invalid or expired code';
  end if;
  insert into public.family_members (family_id, user_id, role, kid_id)
    values (v_row.family_id, auth.uid(), 'kid', v_row.kid_id)
    on conflict (family_id, user_id) do update set role = 'kid', kid_id = excluded.kid_id;
  delete from public.pairing_codes c where c.code = p_code;
  return query select v_row.family_id, v_row.kid_id;
end;
$$;

-- Which family does the current user belong to? (one family per device in the MVP)
create function public.my_membership()
returns table (family_id uuid, role public.member_role, kid_id text, revision bigint)
language sql stable security definer set search_path = public as $$
  select m.family_id, m.role, m.kid_id, s.revision
  from public.family_members m
  join public.family_state s on s.family_id = m.family_id
  where m.user_id = auth.uid()
  order by m.created_at desc
  limit 1;
$$;

grant execute on function public.create_family(text, text, jsonb) to authenticated;
grant execute on function public.save_family_state(uuid, jsonb, bigint) to authenticated;
grant execute on function public.create_pairing_code(uuid, text) to authenticated;
grant execute on function public.redeem_pairing_code(text) to authenticated;
grant execute on function public.my_membership() to authenticated;

-- Live updates for every device that has the family open.
alter publication supabase_realtime add table public.family_state;

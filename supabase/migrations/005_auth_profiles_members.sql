-- PDL-MATCH authentication foundation
-- Adds profiles, tournament membership roles, and tournament ownership.
-- Existing tournaments remain intact; owner_id is nullable for legacy data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

alter table public.tournaments
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create table if not exists public.tournament_members (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin', 'scorer', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

create index if not exists tournament_members_user_idx
  on public.tournament_members(user_id);
create index if not exists tournament_members_tournament_idx
  on public.tournament_members(tournament_id);

alter table public.tournament_members enable row level security;

create or replace function public.user_tournament_role(tournament_uuid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tm.role
  from public.tournament_members tm
  where tm.tournament_id = tournament_uuid
    and tm.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.user_tournament_role(uuid) from public;
grant execute on function public.user_tournament_role(uuid) to authenticated;

drop policy if exists tournament_members_select on public.tournament_members;
create policy tournament_members_select on public.tournament_members
for select to authenticated
using (
  user_id = auth.uid()
  or public.user_tournament_role(tournament_id) = 'admin'
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, 'player@example.com'), '@', 1), '')
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists tournament_members_touch_updated_at on public.tournament_members;
create trigger tournament_members_touch_updated_at before update on public.tournament_members
for each row execute function public.touch_updated_at();

-- Important: existing public tournament/match policies stay unchanged in this step.
-- Owner/admin/scorer write policies will be added after the login UI is deployed.

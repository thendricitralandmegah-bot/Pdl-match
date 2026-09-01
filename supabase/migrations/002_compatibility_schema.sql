-- PDL-MATCH compatibility migration
-- Safe for an existing database: only creates missing tables/columns/indexes.
-- It does not drop or delete existing data.

create extension if not exists pgcrypto;

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'New Tournament',
  match_type text not null default 'Americano',
  target_points integer not null default 21,
  court_count integer not null default 1,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tournaments add column if not exists name text;
alter table public.tournaments add column if not exists match_type text default 'Americano';
alter table public.tournaments add column if not exists target_points integer default 21;
alter table public.tournaments add column if not exists court_count integer default 1;
alter table public.tournaments add column if not exists status text default 'Active';
alter table public.tournaments add column if not exists created_at timestamptz default now();
alter table public.tournaments add column if not exists updated_at timestamptz default now();

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  matches_played integer not null default 0,
  wins integer not null default 0,
  points_for integer not null default 0,
  points_against integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.players add column if not exists tournament_id uuid;
alter table public.players add column if not exists name text;
alter table public.players add column if not exists matches_played integer default 0;
alter table public.players add column if not exists wins integer default 0;
alter table public.players add column if not exists points_for integer default 0;
alter table public.players add column if not exists points_against integer default 0;
alter table public.players add column if not exists created_at timestamptz default now();

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_number integer not null,
  court_number integer not null,
  badge text not null default 'OPEN',
  team_a jsonb not null default '[]'::jsonb,
  team_b jsonb not null default '[]'::jsonb,
  score_a integer not null default 0,
  score_b integer not null default 0,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches add column if not exists tournament_id uuid;
alter table public.matches add column if not exists round_number integer;
alter table public.matches add column if not exists court_number integer;
alter table public.matches add column if not exists badge text default 'OPEN';
alter table public.matches add column if not exists team_a jsonb default '[]'::jsonb;
alter table public.matches add column if not exists team_b jsonb default '[]'::jsonb;
alter table public.matches add column if not exists score_a integer default 0;
alter table public.matches add column if not exists score_b integer default 0;
alter table public.matches add column if not exists is_completed boolean default false;
alter table public.matches add column if not exists created_at timestamptz default now();
alter table public.matches add column if not exists updated_at timestamptz default now();

create index if not exists tournaments_created_at_idx on public.tournaments(created_at desc);
create index if not exists players_tournament_id_idx on public.players(tournament_id);
create index if not exists matches_tournament_round_idx on public.matches(tournament_id, round_number);
create index if not exists matches_tournament_court_idx on public.matches(tournament_id, court_number);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tournaments_touch_updated_at on public.tournaments;
create trigger tournaments_touch_updated_at before update on public.tournaments
for each row execute function public.touch_updated_at();

drop trigger if exists matches_touch_updated_at on public.matches;
create trigger matches_touch_updated_at before update on public.matches
for each row execute function public.touch_updated_at();

-- Add matches to Realtime only when it is not already present.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end;
$$;

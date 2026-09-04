-- PD-Match Dadakan: Session Manager compatibility migration
-- Run this in the Supabase SQL editor before using the new create-session fields.

alter table if exists public.tournaments
  add column if not exists scheduled_at timestamptz,
  add column if not exists location text,
  add column if not exists format text,
  add column if not exists match_type text default 'Americano',
  add column if not exists court_count integer default 1,
  add column if not exists total_rounds integer default 4,
  add column if not exists target_points integer default 21,
  add column if not exists scoring_type text default 'Point scoring',
  add column if not exists gender text default 'Any',
  add column if not exists visibility text default 'Public',
  add column if not exists share_slug text,
  add column if not exists status text default 'Active';

update public.tournaments
set
  match_type = coalesce(match_type, 'Americano'),
  court_count = coalesce(court_count, 1),
  total_rounds = coalesce(total_rounds, 4),
  target_points = coalesce(target_points, 21),
  scoring_type = coalesce(scoring_type, 'Point scoring'),
  gender = coalesce(gender, 'Any'),
  visibility = coalesce(visibility, 'Public'),
  status = coalesce(status, 'Active')
where true;

create index if not exists tournaments_scheduled_at_idx on public.tournaments (scheduled_at);
create index if not exists tournaments_visibility_idx on public.tournaments (visibility);
create index if not exists tournaments_status_idx on public.tournaments (status);

-- Optional constraints. They are intentionally bounded to the current UI values.
alter table if exists public.tournaments
  drop constraint if exists tournaments_court_count_check;
alter table if exists public.tournaments
  add constraint tournaments_court_count_check check (court_count between 1 and 4);

alter table if exists public.tournaments
  drop constraint if exists tournaments_total_rounds_check;
alter table if exists public.tournaments
  add constraint tournaments_total_rounds_check check (total_rounds between 1 and 100);

alter table if exists public.tournaments
  drop constraint if exists tournaments_target_points_check;
alter table if exists public.tournaments
  add constraint tournaments_target_points_check check (target_points between 0 and 32);

-- RLS-safe session creation used by the web app.
-- This keeps tournament_members in sync with the session owner.
create or replace function public.create_tournament_with_admin(
  tournament_name text,
  tournament_match_type text,
  tournament_target_points integer,
  tournament_court_count integer,
  tournament_total_rounds integer
)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  created_tournament public.tournaments;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a session';
  end if;

  insert into public.tournaments (
    owner_id,
    name,
    match_type,
    target_points,
    court_count,
    total_rounds,
    status
  ) values (
    auth.uid(),
    coalesce(nullif(trim(tournament_name), ''), 'New Session'),
    coalesce(nullif(trim(tournament_match_type), ''), 'Americano'),
    greatest(0, least(coalesce(tournament_target_points, 21), 99)),
    greatest(1, least(coalesce(tournament_court_count, 1), 20)),
    greatest(1, least(coalesce(tournament_total_rounds, 4), 100)),
    'Active'
  )
  returning * into created_tournament;

  insert into public.tournament_members (tournament_id, user_id, role)
  values (created_tournament.id, auth.uid(), 'admin')
  on conflict (tournament_id, user_id) do update set role = 'admin';

  return created_tournament;
end;
$$;

revoke all on function public.create_tournament_with_admin(text, text, integer, integer, integer) from public;
grant execute on function public.create_tournament_with_admin(text, text, integer, integer, integer) to authenticated;

-- Make sure the browser can call the RPC, while the function itself performs
-- the privileged insert under its controlled search path.

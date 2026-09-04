-- PD-Match Dadakan: focused repair for session creation
-- Run this when the full session_manager_migration.sql stops on a legacy-data constraint.
-- It intentionally does not add check constraints or update old rows.

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

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'create_tournament_with_admin';

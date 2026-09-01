-- PDL-MATCH role-based access control
-- Public users can read active/completed tournaments, while authenticated
-- members receive admin/scorer/viewer permissions per tournament.

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
    raise exception 'You must be signed in to create a tournament';
  end if;

  insert into public.tournaments (
    owner_id, name, match_type, target_points, court_count, total_rounds, status
  ) values (
    auth.uid(),
    coalesce(nullif(trim(tournament_name), ''), 'New Tournament'),
    coalesce(nullif(trim(tournament_match_type), ''), 'Americano'),
    greatest(1, least(coalesce(tournament_target_points, 21), 99)),
    greatest(1, least(coalesce(tournament_court_count, 1), 20)),
    greatest(1, least(coalesce(tournament_total_rounds, 8), 30)),
    'Active'
  )
  returning * into created_tournament;

  insert into public.tournament_members (tournament_id, user_id, role)
  values (created_tournament.id, auth.uid(), 'admin');

  return created_tournament;
end;
$$;

create or replace function public.claim_tournament(tournament_uuid uuid)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_tournament public.tournaments;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to claim a tournament';
  end if;

  update public.tournaments
  set owner_id = auth.uid()
  where id = tournament_uuid
    and owner_id is null
  returning * into claimed_tournament;

  if claimed_tournament.id is null then
    raise exception 'Tournament is already claimed';
  end if;

  insert into public.tournament_members (tournament_id, user_id, role)
  values (tournament_uuid, auth.uid(), 'admin')
  on conflict (tournament_id, user_id) do update set role = 'admin';

  return claimed_tournament;
end;
$$;

revoke all on function public.create_tournament_with_admin(text, text, integer, integer, integer) from public;
grant execute on function public.create_tournament_with_admin(text, text, integer, integer, integer) to authenticated;
revoke all on function public.claim_tournament(uuid) from public;
grant execute on function public.claim_tournament(uuid) to authenticated;
grant execute on function public.user_tournament_role(uuid) to anon;

-- RLS is intentionally enabled in a later migration after the role-aware UI is deployed.
-- Policies are defined below now, but remain inactive while RLS is disabled.

drop policy if exists tournaments_select_public_or_member on public.tournaments;
create policy tournaments_select_public_or_member on public.tournaments
for select to anon, authenticated
using (
  status in ('Active', 'active', 'Completed', 'completed')
  or owner_id = auth.uid()
  or public.user_tournament_role(id) is not null
);

drop policy if exists tournaments_update_admin on public.tournaments;
create policy tournaments_update_admin on public.tournaments
for update to authenticated
using (public.user_tournament_role(id) = 'admin')
with check (public.user_tournament_role(id) = 'admin');

drop policy if exists tournaments_delete_admin on public.tournaments;
create policy tournaments_delete_admin on public.tournaments
for delete to authenticated
using (public.user_tournament_role(id) = 'admin');

drop policy if exists players_select_public_or_member on public.players;
create policy players_select_public_or_member on public.players
for select to anon, authenticated
using (
  exists (
    select 1 from public.tournaments t
    where t.id = tournament_id
      and (
        t.status in ('Active', 'active', 'Completed', 'completed')
        or t.owner_id = auth.uid()
        or public.user_tournament_role(t.id) is not null
      )
  )
);

drop policy if exists players_manage_admin on public.players;
create policy players_manage_admin on public.players
for all to authenticated
using (public.user_tournament_role(tournament_id) = 'admin')
with check (public.user_tournament_role(tournament_id) = 'admin');

drop policy if exists players_update_scorer on public.players;
create policy players_update_scorer on public.players
for update to authenticated
using (public.user_tournament_role(tournament_id) in ('admin', 'scorer'))
with check (public.user_tournament_role(tournament_id) in ('admin', 'scorer'));

drop policy if exists matches_select_public_or_member on public.matches;
create policy matches_select_public_or_member on public.matches
for select to anon, authenticated
using (
  exists (
    select 1 from public.tournaments t
    where t.id = tournament_id
      and (
        t.status in ('Active', 'active', 'Completed', 'completed')
        or t.owner_id = auth.uid()
        or public.user_tournament_role(t.id) is not null
      )
  )
);

drop policy if exists matches_insert_admin on public.matches;
create policy matches_insert_admin on public.matches
for insert to authenticated
with check (public.user_tournament_role(tournament_id) = 'admin');

drop policy if exists matches_update_admin_scorer on public.matches;
create policy matches_update_admin_scorer on public.matches
for update to authenticated
using (public.user_tournament_role(tournament_id) in ('admin', 'scorer'))
with check (public.user_tournament_role(tournament_id) in ('admin', 'scorer'));

drop policy if exists matches_delete_admin on public.matches;
create policy matches_delete_admin on public.matches
for delete to authenticated
using (public.user_tournament_role(tournament_id) = 'admin');

drop policy if exists tournament_members_manage_admin on public.tournament_members;
create policy tournament_members_manage_admin on public.tournament_members
for all to authenticated
using (public.user_tournament_role(tournament_id) = 'admin')
with check (public.user_tournament_role(tournament_id) = 'admin');

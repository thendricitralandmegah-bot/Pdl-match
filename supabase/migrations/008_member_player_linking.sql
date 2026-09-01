-- Account membership management and optional player-to-account linking.
-- Run after migrations 005, 006, and 007.

alter table public.players
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists players_user_id_idx
  on public.players(user_id);

create or replace function public.list_tournament_members(tournament_uuid uuid)
returns table (
  user_id uuid,
  email text,
  display_name text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.user_tournament_role(tournament_uuid) <> 'admin' then
    raise exception 'Only tournament admins can list members';
  end if;

  return query
  select u.id, u.email::text, p.display_name, tm.role
  from public.tournament_members tm
  join auth.users u on u.id = tm.user_id
  left join public.profiles p on p.id = u.id
  where tm.tournament_id = tournament_uuid
  order by case when tm.role = 'admin' then 1 when tm.role = 'scorer' then 2 else 3 end, lower(coalesce(p.display_name, u.email));
end;
$$;

create or replace function public.upsert_tournament_member_by_email(
  tournament_uuid uuid,
  member_email text,
  member_role text
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user auth.users;
  normalized_email text := lower(trim(member_email));
  normalized_role text := lower(trim(member_role));
begin
  if public.user_tournament_role(tournament_uuid) <> 'admin' then
    raise exception 'Only tournament admins can manage members';
  end if;

  if normalized_email = '' then
    raise exception 'Member email is required';
  end if;

  if normalized_role not in ('admin', 'scorer', 'viewer') then
    raise exception 'Role must be admin, scorer, or viewer';
  end if;

  select * into target_user
  from auth.users
  where lower(email) = normalized_email
  limit 1;

  if target_user.id is null then
    raise exception 'No registered account found for this email';
  end if;

  if exists (
    select 1 from public.tournaments
    where id = tournament_uuid and owner_id = target_user.id
  ) and normalized_role <> 'admin' then
    raise exception 'Tournament owner must remain an admin';
  end if;

  insert into public.tournament_members (tournament_id, user_id, role)
  values (tournament_uuid, target_user.id, normalized_role)
  on conflict (tournament_id, user_id)
  do update set role = excluded.role, updated_at = now();

  return query
  select target_user.id, target_user.email::text, p.display_name, normalized_role
  from public.profiles p
  where p.id = target_user.id;
end;
$$;

revoke all on function public.list_tournament_members(uuid) from public;
grant execute on function public.list_tournament_members(uuid) to authenticated;
revoke all on function public.upsert_tournament_member_by_email(uuid, text, text) from public;
grant execute on function public.upsert_tournament_member_by_email(uuid, text, text) to authenticated;

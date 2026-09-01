create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 120),
  format text not null check (format in ('Americano', 'Mexicano', 'Team Americano', 'Mix Americano')),
  target_points smallint not null default 21 check (target_points between 1 and 99),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  share_slug text not null unique default encode(gen_random_bytes(9), 'hex'),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_members (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'admin', 'scorer', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 80),
  gender text check (gender in ('male', 'female', 'other', 'unknown')),
  external_ref text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  court_number smallint not null check (court_number > 0),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (event_id, court_number)
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  round_number smallint not null check (round_number > 0),
  status text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, round_number)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  round_id uuid not null references public.rounds(id) on delete cascade,
  court_id uuid not null references public.courts(id) on delete restrict,
  match_number smallint not null check (match_number > 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'completed', 'cancelled')),
  side_1_score smallint check (side_1_score is null or side_1_score >= 0),
  side_2_score smallint check (side_2_score is null or side_2_score >= 0),
  winner_side smallint check (winner_side is null or winner_side in (1, 2)),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (round_id, match_number)
);

create table if not exists public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  side smallint not null check (side in (1, 2)),
  position smallint not null check (position > 0),
  primary key (match_id, player_id),
  unique (match_id, side, position)
);

create unique index if not exists players_event_display_name_unique
  on public.players (event_id, lower(display_name));

create index if not exists events_owner_id_idx on public.events(owner_id);
create index if not exists event_members_user_id_idx on public.event_members(user_id);
create index if not exists players_event_active_idx on public.players(event_id, is_active);
create index if not exists courts_event_active_idx on public.courts(event_id, is_active);
create index if not exists rounds_event_number_idx on public.rounds(event_id, round_number);
create index if not exists matches_event_round_status_idx on public.matches(event_id, round_id, status);
create index if not exists match_players_player_id_idx on public.match_players(player_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at before update on public.players
for each row execute function public.set_updated_at();

create or replace function public.is_event_member(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e where e.id = target_event_id and e.owner_id = auth.uid()
  ) or exists (
    select 1 from public.event_members em
    where em.event_id = target_event_id and em.user_id = auth.uid()
  );
$$;

create or replace function public.is_event_editor(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e where e.id = target_event_id and e.owner_id = auth.uid()
  ) or exists (
    select 1 from public.event_members em
    where em.event_id = target_event_id
      and em.user_id = auth.uid()
      and em.role in ('owner', 'admin', 'scorer')
  );
$$;

create or replace view public.event_leaderboard as
select
  p.event_id,
  p.id as player_id,
  p.display_name,
  count(mp.match_id) filter (where m.status = 'completed')::int as played,
  count(mp.match_id) filter (
    where m.status = 'completed' and ((mp.side = 1 and m.winner_side = 1) or (mp.side = 2 and m.winner_side = 2))
  )::int as won,
  coalesce(sum(case when mp.side = 1 then m.side_1_score when mp.side = 2 then m.side_2_score else 0 end)
    filter (where m.status = 'completed'), 0)::int as points_for,
  coalesce(sum(case when mp.side = 1 then m.side_2_score when mp.side = 2 then m.side_1_score else 0 end)
    filter (where m.status = 'completed'), 0)::int as points_against
from public.players p
left join public.match_players mp on mp.player_id = p.id
left join public.matches m on m.id = mp.match_id
where p.is_active = true
group by p.event_id, p.id, p.display_name;

alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.players enable row level security;
alter table public.courts enable row level security;
alter table public.rounds enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;

create policy events_select_member_or_shared on public.events
for select using (public.is_event_member(id) or status in ('active', 'completed'));

create policy events_insert_authenticated on public.events
for insert to authenticated with check (owner_id = auth.uid());

create policy events_update_editor on public.events
for update using (public.is_event_editor(id)) with check (public.is_event_editor(id));

create policy events_delete_owner on public.events
for delete using (owner_id = auth.uid());

create policy event_members_select_member on public.event_members
for select using (public.is_event_member(event_id));

create policy event_members_manage_editor on public.event_members
for all using (public.is_event_editor(event_id)) with check (public.is_event_editor(event_id));

create policy players_select_shared_or_member on public.players
for select using (public.is_event_member(event_id) or exists (
  select 1 from public.events e where e.id = event_id and e.status in ('active', 'completed')
));

create policy players_manage_editor on public.players
for all using (public.is_event_editor(event_id)) with check (public.is_event_editor(event_id));

create policy courts_select_shared_or_member on public.courts
for select using (public.is_event_member(event_id) or exists (
  select 1 from public.events e where e.id = event_id and e.status in ('active', 'completed')
));

create policy courts_manage_editor on public.courts
for all using (public.is_event_editor(event_id)) with check (public.is_event_editor(event_id));

create policy rounds_select_shared_or_member on public.rounds
for select using (public.is_event_member(event_id) or exists (
  select 1 from public.events e where e.id = event_id and e.status in ('active', 'completed')
));

create policy rounds_manage_editor on public.rounds
for all using (public.is_event_editor(event_id)) with check (public.is_event_editor(event_id));

create policy matches_select_shared_or_member on public.matches
for select using (public.is_event_member(event_id) or exists (
  select 1 from public.events e where e.id = event_id and e.status in ('active', 'completed')
));

create policy matches_manage_editor on public.matches
for all using (public.is_event_editor(event_id)) with check (public.is_event_editor(event_id));

create policy match_players_select_shared_or_member on public.match_players
for select using (exists (
  select 1 from public.matches m
  where m.id = match_id and (public.is_event_member(m.event_id) or exists (
    select 1 from public.events e where e.id = m.event_id and e.status in ('active', 'completed')
  ))
));

create policy match_players_manage_editor on public.match_players
for all using (exists (
  select 1 from public.matches m where m.id = match_id and public.is_event_editor(m.event_id)
)) with check (exists (
  select 1 from public.matches m where m.id = match_id and public.is_event_editor(m.event_id)
));

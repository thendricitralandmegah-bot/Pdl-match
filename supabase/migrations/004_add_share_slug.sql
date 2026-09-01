-- Adds a stable, non-sequential public identifier for tournament sharing.
alter table public.tournaments
  add column if not exists share_slug text;

update public.tournaments
set share_slug = encode(gen_random_bytes(9), 'hex')
where share_slug is null or trim(share_slug) = '';

create unique index if not exists tournaments_share_slug_unique
  on public.tournaments(share_slug);

alter table public.tournaments
  alter column share_slug set default encode(gen_random_bytes(9), 'hex');

alter table public.tournaments
  alter column share_slug set not null;

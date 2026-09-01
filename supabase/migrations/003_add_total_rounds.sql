-- Adds configurable round count to existing tournaments without deleting data.
alter table public.tournaments
  add column if not exists total_rounds integer;

update public.tournaments
set total_rounds = 8
where total_rounds is null;

alter table public.tournaments
  alter column total_rounds set default 8;

alter table public.tournaments
  alter column total_rounds set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tournaments_total_rounds_check'
      and conrelid = 'public.tournaments'::regclass
  ) then
    alter table public.tournaments
      add constraint tournaments_total_rounds_check check (total_rounds between 1 and 30);
  end if;
end;
$$;

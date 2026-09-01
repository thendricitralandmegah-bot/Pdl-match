-- Enable the role policies after the role-aware application is deployed.
-- Run this only after migration 005, 006, and the Auth UI are available.

alter table public.tournaments enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;

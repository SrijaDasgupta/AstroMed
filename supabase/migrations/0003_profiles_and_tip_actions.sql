-- Applied 2026-11-11.
-- Personal profile: display name and which crew member's data the user follows as "me".
create table if not exists public.profiles (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  crew_id      text check (char_length(crew_id) <= 32),
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "create own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Health-tip habits the user completed, one row per tip per day.
create table if not exists public.tip_actions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tip_id     text not null check (char_length(tip_id) <= 64),
  done_on    date not null,
  created_at timestamptz not null default now(),
  unique (user_id, tip_id, done_on)
);
alter table public.tip_actions enable row level security;

create policy "read own tip actions" on public.tip_actions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "add own tip actions" on public.tip_actions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "delete own tip actions" on public.tip_actions
  for delete to authenticated using ((select auth.uid()) = user_id);

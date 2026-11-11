-- The user's own missions. env_type picks the environment preset (gravity, radiation, delay).
create table if not exists public.missions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name              text not null check (char_length(name) between 1 and 80),
  env_type          text not null check (env_type in ('earth-analog', 'leo', 'lunar-surface', 'mars-transit', 'mars-surface')),
  start_date        date not null,
  end_date          date check (end_date is null or end_date >= start_date),
  dose_rate_msv_day numeric(6,3) check (dose_rate_msv_day is null or dose_rate_msv_day between 0 and 50),
  location          text check (char_length(location) <= 120),
  crew_size         smallint check (crew_size is null or crew_size between 1 and 50),
  objectives        text check (char_length(objectives) <= 1000),
  is_active         boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists missions_user on public.missions (user_id);
-- At most one active mission per user.
create unique index if not exists missions_one_active on public.missions (user_id) where is_active;
alter table public.missions enable row level security;
create policy "own missions" on public.missions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Private journal for mental well-being.
create table if not exists public.journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  mood       smallint check (mood between 1 and 5),
  prompt     text check (char_length(prompt) <= 200),
  body       text not null check (char_length(body) between 1 and 5000),
  tags       text[] not null default '{}' check (coalesce(array_length(tags, 1), 0) <= 10),
  created_at timestamptz not null default now()
);
create index if not exists journal_user_date on public.journal_entries (user_id, entry_date desc);
alter table public.journal_entries enable row level security;
create policy "own journal" on public.journal_entries for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

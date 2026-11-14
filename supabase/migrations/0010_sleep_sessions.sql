-- Sleep and nap sessions with start and wake times (mission time, UTC), for the Sleep orbit.
-- The id comes from the browser so a retried save updates the same row instead of adding a duplicate.
create table if not exists public.sleep_sessions (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('sleep', 'nap')),
  started_at  timestamptz not null,
  ended_at    timestamptz not null,
  created_at  timestamptz not null default now(),
  check (ended_at > started_at and ended_at - started_at <= interval '24 hours')
);
create index if not exists sleep_sessions_user on public.sleep_sessions (user_id, started_at desc);
alter table public.sleep_sessions enable row level security;
create policy "own sleep sessions" on public.sleep_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- AstroMed: completed guided checkups.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

create table if not exists public.checkup_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  crew_id     text not null check (char_length(crew_id) <= 32),
  checkup_id  text not null check (char_length(checkup_id) <= 32),
  answers     jsonb not null default '{}'::jsonb,
  escalation  text not null check (escalation in ('none', 'routine', 'today', 'now')),
  created_at  timestamptz not null default now()
);

create index if not exists checkup_logs_user_recent
  on public.checkup_logs (user_id, crew_id, checkup_id, created_at desc);

-- Each signed-in user can only see, add and delete their own records.
alter table public.checkup_logs enable row level security;

drop policy if exists "read own checkups" on public.checkup_logs;
create policy "read own checkups" on public.checkup_logs
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "add own checkups" on public.checkup_logs;
create policy "add own checkups" on public.checkup_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "delete own checkups" on public.checkup_logs;
create policy "delete own checkups" on public.checkup_logs
  for delete to authenticated using ((select auth.uid()) = user_id);

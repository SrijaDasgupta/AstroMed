-- Medicines a person takes (entered by them, as prescribed), and their own reminders.
create table if not exists public.medications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  dose         text check (char_length(dose) <= 60),
  instructions text check (char_length(instructions) <= 200),
  times        text[] not null default '{}' check (coalesce(array_length(times, 1), 0) <= 6),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.medication_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete cascade,
  taken_on      date not null,
  scheduled_for text not null check (scheduled_for ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  status        text not null check (status in ('taken', 'skipped')),
  created_at    timestamptz not null default now(),
  unique (user_id, medication_id, taken_on, scheduled_for)
);

create table if not exists public.reminders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 80),
  category   text not null check (category in ('exercise', 'water', 'checkup', 'sleep', 'other')),
  times      text[] not null default '{}' check (coalesce(array_length(times, 1), 0) <= 6),
  days       smallint[] not null default '{0,1,2,3,4,5,6}',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reminder_id   uuid not null references public.reminders (id) on delete cascade,
  done_on       date not null,
  scheduled_for text not null check (scheduled_for ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  created_at    timestamptz not null default now(),
  unique (user_id, reminder_id, done_on, scheduled_for)
);

create index if not exists medication_logs_med on public.medication_logs (medication_id);
create index if not exists reminder_logs_rem on public.reminder_logs (reminder_id);

alter table public.medications enable row level security;
alter table public.medication_logs enable row level security;
alter table public.reminders enable row level security;
alter table public.reminder_logs enable row level security;

-- Each user can only see and change their own rows.
create policy "own medications" on public.medications for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own reminders" on public.reminders for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Logs: own rows only, and only against the user's own medicine or reminder.
create policy "own medication logs" on public.medication_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.medications m where m.id = medication_id and m.user_id = (select auth.uid())));
create policy "own reminder logs" on public.reminder_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.reminders r where r.id = reminder_id and r.user_id = (select auth.uid())));

-- Added after the performance advisor flagged unindexed foreign keys.
create index if not exists medications_user on public.medications (user_id);
create index if not exists reminders_user on public.reminders (user_id);

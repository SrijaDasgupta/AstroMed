-- Medicine tracking: what each medicine is for, when it was started, that the dose was confirmed
-- with a flight surgeon or doctor, and side effects the person notes.

alter table public.medications
  add column if not exists purpose      text check (purpose is null or char_length(purpose) <= 30),
  add column if not exists started_on   date,
  add column if not exists confirmed_at timestamptz;

create table if not exists public.medication_effects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete cascade,
  noted_on      date not null default current_date,
  severity      text not null check (severity in ('mild', 'moderate', 'severe')),
  note          text check (char_length(note) <= 200),
  created_at    timestamptz not null default now()
);

create index if not exists medication_effects_user on public.medication_effects (user_id);
create index if not exists medication_effects_med on public.medication_effects (medication_id);
create index if not exists medication_logs_user_day on public.medication_logs (user_id, taken_on);

alter table public.medication_effects enable row level security;

create policy "own medication effects" on public.medication_effects for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.medications m where m.id = medication_id and m.user_id = (select auth.uid())));

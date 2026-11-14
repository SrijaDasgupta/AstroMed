-- Photo import: text read from a photo can be saved as a radiation reading, a sleep session or a health record.

-- Dosimeter readings typed in or read from a photo, shown on My exposure.
create table if not exists public.radiation_readings (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  dose_msv    numeric not null check (dose_msv >= 0 and dose_msv <= 100000),
  hours       numeric not null check (hours > 0 and hours <= 100000),
  source      text not null check (source in ('crew-entered', 'photo-import')),
  created_at  timestamptz not null default now()
);
create index if not exists radiation_readings_user on public.radiation_readings (user_id, created_at);
alter table public.radiation_readings enable row level security;
create policy "own radiation readings" on public.radiation_readings for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Where a sleep session came from.
alter table public.sleep_sessions add column if not exists source text not null default 'manual'
  check (source in ('manual', 'photo-import'));

-- The reviewed text from an imported photo, kept with the photo in My records.
alter table public.records add column if not exists findings text check (char_length(findings) <= 12000);

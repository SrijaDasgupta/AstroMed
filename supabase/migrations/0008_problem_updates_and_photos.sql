-- Broader problem types, a photo per note, and follow-up updates for ongoing problems.
alter table public.body_notes drop constraint if exists body_notes_kind_check;
alter table public.body_notes add constraint body_notes_kind_check check (kind in (
  'pain', 'injury', 'swelling', 'numbness', 'stiffness', 'skin', 'vision', 'hearing-balance', 'breathing',
  'headache', 'nausea-gut', 'urinary', 'dental', 'fever-infection', 'bleeding', 'sleep', 'mood-stress',
  'exposure', 'fatigue', 'other'));
alter table public.body_notes add column if not exists photo_path text check (photo_path is null or char_length(photo_path) <= 300);
alter table public.body_notes add column if not exists topics text[] not null default '{}' check (coalesce(array_length(topics, 1), 0) <= 10);
alter table public.body_notes drop constraint if exists body_notes_notes_check;
alter table public.body_notes add constraint body_notes_notes_check check (char_length(notes) <= 3000);

create table if not exists public.body_note_updates (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.body_notes (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  severity   smallint not null check (severity between 0 and 10),
  body       text check (char_length(body) <= 3000),
  photo_path text check (photo_path is null or char_length(photo_path) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists body_note_updates_note on public.body_note_updates (note_id, created_at);
create index if not exists body_note_updates_user on public.body_note_updates (user_id);
alter table public.body_note_updates enable row level security;
create policy "own body note updates" on public.body_note_updates for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.body_notes n where n.id = note_id and n.user_id = (select auth.uid())));

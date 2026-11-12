-- Details the user records about their own body: pain, injuries, swelling and so on, by body area.
create table if not exists public.body_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  area        text not null check (area ~ '^[a-z-]{2,30}$'),
  side        text check (side in ('left', 'right', 'both')),
  kind        text not null check (kind in ('pain', 'injury', 'swelling', 'numbness', 'stiffness', 'skin', 'vision', 'hearing-balance', 'breathing', 'other')),
  severity    smallint not null check (severity between 0 and 10),
  started_on  date not null,
  notes       text check (char_length(notes) <= 1000),
  resolved_on date check (resolved_on is null or resolved_on >= started_on),
  created_at  timestamptz not null default now()
);
create index if not exists body_notes_user on public.body_notes (user_id, created_at desc);
alter table public.body_notes enable row level security;
create policy "own body notes" on public.body_notes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

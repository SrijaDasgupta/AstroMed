-- Profile details and the user's own usual values (their baseline).
alter table public.profiles
  add column if not exists birth_year  smallint check (birth_year between 1900 and 2100),
  add column if not exists sex         text check (sex in ('female', 'male', 'other')),
  add column if not exists height_cm   numeric(5,1) check (height_cm between 50 and 250),
  add column if not exists weight_kg   numeric(5,1) check (weight_kg between 20 and 300),
  add column if not exists blood_type  text check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  add column if not exists allergies   text check (char_length(allergies) <= 300),
  add column if not exists conditions  text check (char_length(conditions) <= 300),
  add column if not exists baseline    jsonb not null default '{}'::jsonb;

-- Uploaded health records (files live in the private "records" storage bucket).
create table if not exists public.records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  kind        text not null check (kind in ('lab', 'imaging', 'prescription', 'report', 'wearable', 'other')),
  recorded_on date,
  file_path   text not null check (char_length(file_path) <= 300),
  file_name   text not null check (char_length(file_name) <= 200),
  mime_type   text not null,
  size_bytes  integer not null check (size_bytes between 1 and 10485760),
  notes       text check (char_length(notes) <= 500),
  created_at  timestamptz not null default now()
);
create index if not exists records_user on public.records (user_id);
alter table public.records enable row level security;
create policy "own records" on public.records for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Private bucket, 10 MB per file, documents and images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('records', 'records', false, 10485760,
        array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'text/csv', 'text/plain'])
on conflict (id) do nothing;

-- Files are stored under "<user id>/..." and only that user can read, add or delete them.
create policy "read own record files" on storage.objects for select to authenticated
  using (bucket_id = 'records' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "add own record files" on storage.objects for insert to authenticated
  with check (bucket_id = 'records' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own record files" on storage.objects for delete to authenticated
  using (bucket_id = 'records' and (storage.foldername(name))[1] = (select auth.uid())::text);

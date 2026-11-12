-- AI analysis of problem photos (only when the user opts in for that photo).
alter table public.body_notes add column if not exists photo_analysis jsonb;
alter table public.body_note_updates add column if not exists photo_analysis jsonb;

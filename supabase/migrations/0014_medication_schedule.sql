-- How often a medicine is taken: every day, on chosen weekdays (e.g. weekly vitamin D),
-- every N days, or as needed (no reminders; doses are logged when taken).

alter table public.medications
  add column if not exists schedule   text not null default 'daily' check (schedule in ('daily', 'weekdays', 'interval', 'as-needed')),
  add column if not exists days       smallint[] check (days is null or (coalesce(array_length(days, 1), 0) <= 7 and days <@ array[0,1,2,3,4,5,6]::smallint[])),
  add column if not exists every_days smallint check (every_days is null or every_days between 2 and 90);

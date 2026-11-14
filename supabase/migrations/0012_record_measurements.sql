-- Readings found in an imported photo (label, value, unit), kept with the record.
alter table public.records add column if not exists measurements jsonb
  check (measurements is null or (jsonb_typeof(measurements) = 'array' and jsonb_array_length(measurements) <= 60));

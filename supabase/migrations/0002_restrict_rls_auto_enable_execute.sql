-- Applied 2026-11-11 after Supabase security advisors flagged it.
-- rls_auto_enable() is Supabase's helper that turns on row-level security for new public tables.
-- It runs only as an event trigger (ensure_rls), so API roles don't need to execute it.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

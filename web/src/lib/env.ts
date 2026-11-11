export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** Real sign-in is available only once both Supabase values are set in .env.local. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

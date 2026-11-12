import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/env";

/**
 * Called once a day by Vercel Cron (vercel.json). Supabase pauses free projects that see little database
 * activity over 7 days, and a paused project can only be restored with one click for 90 days. A small
 * daily query keeps the project active so everyone's data stays available for years.
 * The query reads nothing private: row-level security returns no rows to an anonymous caller.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  if (!isSupabaseConfigured) return Response.json({ ok: false, reason: "Supabase not configured" });
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { error } = await supabase.from("profiles").select("user_id", { head: true, count: "exact" }).limit(1);
  return Response.json({ ok: !error, at: new Date().toISOString(), ...(error ? { error: error.message } : {}) });
}

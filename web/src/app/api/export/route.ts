import { getViewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";

/**
 * "Download my data": everything the signed-in person has entered, as one JSON file they keep.
 * Row-level security means each query only ever returns the caller's own rows.
 * Photos and uploaded files aren't embedded (they can be large); their names and dates are listed.
 */
export const dynamic = "force-dynamic";

const TABLES = [
  "profiles", "checkup_logs", "missions", "journal_entries", "body_notes", "body_note_updates",
  "medications", "medication_logs", "reminders", "reminder_logs", "tip_actions", "records",
] as const;

export async function GET() {
  const viewer = await getViewer();
  if (!viewer || viewer.kind !== "user") return new Response("Sign in to download your data.", { status: 401 });
  const supabase = await createClient();
  const out: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    account: viewer.email,
    note: "Your AstroMed data. Photos and uploaded files are listed by name; download them from My records or the problem cards.",
  };
  for (const table of TABLES) {
    const { data, error } = await fetchAll<Record<string, unknown>>((from, to) => supabase.from(table).select("*").range(from, to), 200000);
    out[table] = error ? { error } : data;
  }
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(out, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="astromed-data-${day}.json"`,
      "cache-control": "no-store",
    },
  });
}

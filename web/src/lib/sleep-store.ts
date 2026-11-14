import { cookies } from "next/headers";
import type { SleepRecord } from "@/components/astromed/sleep-records";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";

const DEMO = "astromed_demo_sleep";
export const DEMO_SLEEP_COOKIE = DEMO;
const DEMO_MAX = 16;
const DAY_MS = 86_400_000;

/** Compact demo form: [id, "s" | "n", start (unix seconds), end (unix seconds), 1 if from a photo]. */
type DemoRow = [string, "s" | "n", number, number, 1?];

const toRecord = ([id, k, s, e, photo]: DemoRow): SleepRecord => ({
  id, kind: k === "n" ? "nap" : "sleep", source: photo ? "photo-import" : "manual", startedAt: new Date(s * 1000).toISOString(), endedAt: new Date(e * 1000).toISOString(),
});
const toRow = (r: SleepRecord): DemoRow => {
  const row: DemoRow = [r.id, r.kind === "nap" ? "n" : "s", Math.round(Date.parse(r.startedAt) / 1000), Math.round(Date.parse(r.endedAt) / 1000)];
  if (r.source === "photo-import") row.push(1);
  return row;
};

async function readDemo(): Promise<DemoRow[]> {
  try {
    const v = JSON.parse((await cookies()).get(DEMO)?.value ?? "[]");
    return Array.isArray(v) ? v.filter((r) => Array.isArray(r) && (r.length === 4 || r.length === 5)) : [];
  } catch {
    return [];
  }
}

export async function writeDemoSleep(rows: SleepRecord[]) {
  const sorted = [...rows].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt)).slice(-DEMO_MAX);
  (await cookies()).set(DEMO, JSON.stringify(sorted.map(toRow)), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
}

export async function listSleep(viewer: Viewer): Promise<{ records: SleepRecord[]; problem?: string }> {
  if (viewer.kind === "demo") return { records: (await readDemo()).map(toRecord) };
  const supabase = await createClient();
  const { data, error } = await fetchAll<{ id: string; kind: "sleep" | "nap"; started_at: string; ended_at: string; source: string }>(
    (from, to) => supabase.from("sleep_sessions").select("id, kind, started_at, ended_at, source").order("started_at", { ascending: true }).range(from, to),
  );
  return {
    problem: error,
    records: (data ?? []).map((r) => ({ id: r.id, kind: r.kind, source: r.source === "photo-import" ? "photo-import" : "manual", startedAt: new Date(r.started_at).toISOString(), endedAt: new Date(r.ended_at).toISOString() })),
  };
}

/** Checks a session from the browser. Returns an error message, or null when it's fine. */
export function checkSleep(r: { id?: unknown; kind?: unknown; startedAt?: unknown; endedAt?: unknown }): string | null {
  if (typeof r.id !== "string" || !/^[0-9a-f-]{36}$/i.test(r.id)) return "Invalid session.";
  if (r.kind !== "sleep" && r.kind !== "nap") return "Choose sleep or nap.";
  const s = Date.parse(String(r.startedAt)), e = Date.parse(String(r.endedAt));
  if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return "Enter a wake time after the sleep start.";
  if (e - s > DAY_MS) return "A session can't be longer than 24 hours.";
  if (e > Date.now() + DAY_MS) return "That wake time is in the future.";
  return null;
}

/** Saves a session; saving the same id again updates it (safe to retry). Refuses sessions that overlap another. */
export async function saveSleep(viewer: Viewer, r: SleepRecord): Promise<{ problem?: string }> {
  const s = Date.parse(r.startedAt), e = Date.parse(r.endedAt);
  const { records } = await listSleep(viewer);
  if (records.some((x) => x.id !== r.id && Date.parse(x.startedAt) < e && Date.parse(x.endedAt) > s)) return { problem: "That session overlaps an existing sleep entry." };
  if (viewer.kind === "demo") {
    const rows = (await readDemo()).map(toRecord).filter((x) => x.id !== r.id);
    await writeDemoSleep([...rows, r]);
    return {};
  }
  const { error } = await (await createClient()).from("sleep_sessions").upsert({
    id: r.id, user_id: viewer.id, kind: r.kind, started_at: r.startedAt, ended_at: r.endedAt, source: r.source === "photo-import" ? "photo-import" : "manual",
  });
  return { problem: error?.message };
}

import { cookies } from "next/headers";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";

/** A dosimeter reading the astronaut typed in or read from a photo. */
export type RadiationReading = { id: string; name: string; doseMsv: number; hours: number; source: "crew-entered" | "photo-import"; createdAt: string };

const DEMO = "astromed_demo_radiation";
export const DEMO_RADIATION_COOKIE = DEMO;
const DEMO_MAX = 8;

type DemoRow = [string, string, number, number, "c" | "p", number];

async function readDemo(): Promise<RadiationReading[]> {
  try {
    const v = JSON.parse((await cookies()).get(DEMO)?.value ?? "[]");
    if (!Array.isArray(v)) return [];
    return v.filter((r): r is DemoRow => Array.isArray(r) && r.length === 6).map(([id, name, doseMsv, hours, s, t]) => ({
      id, name, doseMsv, hours, source: s === "p" ? "photo-import" : "crew-entered", createdAt: new Date(t * 1000).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function listRadiation(viewer: Viewer): Promise<{ readings: RadiationReading[]; problem?: string }> {
  if (viewer.kind === "demo") return { readings: await readDemo() };
  const supabase = await createClient();
  const { data, error } = await fetchAll<{ id: string; name: string; dose_msv: number; hours: number; source: RadiationReading["source"]; created_at: string }>(
    (from, to) => supabase.from("radiation_readings").select("id, name, dose_msv, hours, source, created_at").order("created_at").range(from, to),
  );
  return {
    problem: error,
    readings: (data ?? []).map((r) => ({ id: r.id, name: r.name, doseMsv: Number(r.dose_msv), hours: Number(r.hours), source: r.source, createdAt: r.created_at })),
  };
}

/** Returns an error message, or null when the reading is fine. */
export function checkRadiation(r: { id?: unknown; name?: unknown; doseMsv?: unknown; hours?: unknown; source?: unknown }): string | null {
  if (typeof r.id !== "string" || !/^[0-9a-f-]{36}$/i.test(r.id)) return "Invalid reading.";
  if (typeof r.name !== "string" || !r.name.trim() || r.name.length > 80) return "Enter a name of up to 80 characters.";
  const dose = Number(r.doseMsv), hours = Number(r.hours);
  if (!Number.isFinite(dose) || dose < 0 || dose > 100000) return "Enter a dose of 0 or more.";
  if (!Number.isFinite(hours) || hours <= 0 || hours > 100000) return "Enter a time longer than 0 hours.";
  if (r.source !== "crew-entered" && r.source !== "photo-import") return "Invalid source.";
  return null;
}

/** Saves a reading; saving the same id again updates it (safe to retry). */
export async function saveRadiation(viewer: Viewer, r: Omit<RadiationReading, "createdAt">): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    const list = (await readDemo()).filter((x) => x.id !== r.id);
    list.push({ ...r, createdAt: new Date().toISOString() });
    const rows: DemoRow[] = list.slice(-DEMO_MAX).map((x) => [x.id, x.name.slice(0, 40), x.doseMsv, x.hours, x.source === "photo-import" ? "p" : "c", Math.round(Date.parse(x.createdAt) / 1000)]);
    (await cookies()).set(DEMO, JSON.stringify(rows), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return {};
  }
  const { error } = await (await createClient()).from("radiation_readings").upsert({
    id: r.id, user_id: viewer.id, name: r.name.trim(), dose_msv: r.doseMsv, hours: r.hours, source: r.source,
  });
  return { problem: error?.message };
}

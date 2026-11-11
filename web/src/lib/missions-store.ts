import { cookies } from "next/headers";
import type { EnvironmentId } from "@/lib/environments";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type Mission = {
  id: string;
  name: string;
  envType: EnvironmentId;
  startDate: string;
  endDate?: string;
  doseRate?: number;
  location?: string;
  crewSize?: number;
  objectives?: string;
  active: boolean;
};

const DEMO = "astromed_demo_missions";
export const DEMO_MISSIONS_COOKIE = DEMO;

async function readDemo(): Promise<Mission[]> {
  try {
    const v = JSON.parse((await cookies()).get(DEMO)?.value ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
async function writeDemo(list: Mission[]) {
  (await cookies()).set(DEMO, JSON.stringify(list.slice(0, 4)), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
}

export async function listMissions(viewer: Viewer): Promise<Mission[]> {
  if (viewer.kind === "demo") return readDemo();
  const { data } = await (await createClient())
    .from("missions")
    .select("id, name, env_type, start_date, end_date, dose_rate_msv_day, location, crew_size, objectives, is_active")
    .order("start_date", { ascending: false });
  return (data ?? []).map((m) => ({
    id: m.id, name: m.name, envType: m.env_type, startDate: m.start_date, endDate: m.end_date ?? undefined,
    doseRate: m.dose_rate_msv_day === null ? undefined : Number(m.dose_rate_msv_day),
    location: m.location ?? undefined, crewSize: m.crew_size ?? undefined, objectives: m.objectives ?? undefined, active: m.is_active,
  }));
}

export async function addMission(viewer: Viewer, m: Omit<Mission, "id" | "active">): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    const list = (await readDemo()).map((x) => ({ ...x, active: false }));
    if (list.length >= 4) return { problem: "The demo holds up to 4 missions." };
    await writeDemo([{ ...m, id: crypto.randomUUID(), active: true }, ...list]);
    return {};
  }
  const supabase = await createClient();
  // The newest mission becomes the active one; only one can be active.
  const off = await supabase.from("missions").update({ is_active: false }).eq("is_active", true);
  if (off.error) return { problem: off.error.message };
  const { error } = await supabase.from("missions").insert({
    user_id: viewer.id, name: m.name, env_type: m.envType, start_date: m.startDate, end_date: m.endDate ?? null,
    dose_rate_msv_day: m.doseRate ?? null, location: m.location ?? null, crew_size: m.crewSize ?? null, objectives: m.objectives ?? null, is_active: true,
  });
  return { problem: error?.message };
}

export async function setActiveMission(viewer: Viewer, id: string | null): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    await writeDemo((await readDemo()).map((x) => ({ ...x, active: x.id === id })));
    return {};
  }
  const supabase = await createClient();
  const off = await supabase.from("missions").update({ is_active: false }).eq("is_active", true);
  if (off.error) return { problem: off.error.message };
  if (!id) return {};
  const { error } = await supabase.from("missions").update({ is_active: true }).eq("id", id);
  return { problem: error?.message };
}

export async function deleteMission(viewer: Viewer, id: string): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    await writeDemo((await readDemo()).filter((x) => x.id !== id));
    return {};
  }
  const { error } = await (await createClient()).from("missions").delete().eq("id", id);
  return { problem: error?.message };
}

import { cookies } from "next/headers";
import { CREW } from "@/lib/crew";
import { localDate } from "@/lib/dates";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";

export type ProfileDetails = {
  birthYear?: number;
  sex?: "female" | "male" | "other";
  heightCm?: number;
  weightKg?: number;
  bloodType?: string;
  allergies?: string;
  conditions?: string;
};
/** The user's own usual values, keyed by metric (e.g. restingHr: 58). */
export type EnteredBaseline = Partial<Record<string, number>>;
export type Profile = { displayName: string; crewId: string; details: ProfileDetails; baseline: EnteredBaseline };
export type TipAction = { tipId: string; doneOn: string };

const DEMO_PROFILE = "astromed_demo_profile";
const DEMO_TIPS = "astromed_demo_tips";
export const DEMO_COOKIES = [DEMO_PROFILE, DEMO_TIPS];

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

const validCrew = (id: unknown) => (typeof id === "string" && CREW.some((c) => c.id === id) ? id : CREW[0].id);
const num = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? undefined : Number(v));
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
function cleanBaseline(b: unknown): EnteredBaseline {
  if (!b || typeof b !== "object") return {};
  return Object.fromEntries(Object.entries(b as Record<string, unknown>).filter(([, v]) => typeof v === "number" && Number.isFinite(v))) as EnteredBaseline;
}

export async function getProfile(viewer: Viewer): Promise<Profile> {
  if (viewer.kind === "demo") {
    try {
      const raw = JSON.parse((await cookies()).get(DEMO_PROFILE)?.value ?? "{}");
      return { displayName: String(raw.n ?? "").slice(0, 40) || "Demo astronaut", crewId: validCrew(raw.c), details: raw.d ?? {}, baseline: cleanBaseline(raw.b) };
    } catch {
      return { displayName: "Demo astronaut", crewId: CREW[0].id, details: {}, baseline: {} };
    }
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, crew_id, birth_year, sex, height_cm, weight_kg, blood_type, allergies, conditions, baseline")
    .maybeSingle();
  return {
    displayName: (data?.display_name as string | null) || viewer.email.split("@")[0],
    crewId: validCrew(data?.crew_id),
    details: {
      birthYear: num(data?.birth_year),
      sex: (str(data?.sex) as ProfileDetails["sex"]) ?? undefined,
      heightCm: num(data?.height_cm),
      weightKg: num(data?.weight_kg),
      bloodType: str(data?.blood_type),
      allergies: str(data?.allergies),
      conditions: str(data?.conditions),
    },
    baseline: cleanBaseline(data?.baseline),
  };
}

export async function saveProfile(viewer: Viewer, p: Profile): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    (await cookies()).set(DEMO_PROFILE, JSON.stringify({ n: p.displayName, c: p.crewId, d: p.details, b: p.baseline }), cookieOptions);
    return {};
  }
  const supabase = await createClient();
  const d = p.details;
  const { error } = await supabase.from("profiles").upsert({
    user_id: viewer.id,
    display_name: p.displayName,
    crew_id: p.crewId,
    birth_year: d.birthYear ?? null,
    sex: d.sex ?? null,
    height_cm: d.heightCm ?? null,
    weight_kg: d.weightKg ?? null,
    blood_type: d.bloodType ?? null,
    allergies: d.allergies ?? null,
    conditions: d.conditions ?? null,
    baseline: p.baseline,
    updated_at: new Date().toISOString(),
  });
  return error ? { problem: error.message } : {};
}

async function readDemoTips(): Promise<TipAction[]> {
  try {
    const raw = JSON.parse((await cookies()).get(DEMO_TIPS)?.value ?? "[]");
    return Array.isArray(raw) ? raw.filter((e) => Array.isArray(e) && e.length === 2).map(([tipId, doneOn]) => ({ tipId, doneOn })) : [];
  } catch {
    return [];
  }
}

export async function loadTipActions(viewer: Viewer): Promise<TipAction[]> {
  if (viewer.kind === "demo") return readDemoTips();
  const supabase = await createClient();
  const { data } = await fetchAll<{ tip_id: string; done_on: string }>((from, to) => supabase.from("tip_actions").select("tip_id, done_on").order("done_on", { ascending: false }).order("tip_id").range(from, to));
  return (data ?? []).map((r) => ({ tipId: r.tip_id as string, doneOn: r.done_on as string }));
}

export async function setTipDone(viewer: Viewer, tipId: string, done: boolean): Promise<{ problem?: string }> {
  const today = localDate();
  if (viewer.kind === "demo") {
    const list = (await readDemoTips()).filter((a) => !(a.tipId === tipId && a.doneOn === today));
    if (done) list.push({ tipId, doneOn: today });
    (await cookies()).set(DEMO_TIPS, JSON.stringify(list.slice(-80).map((a) => [a.tipId, a.doneOn])), cookieOptions);
    return {};
  }
  const supabase = await createClient();
  const { error } = done
    ? await supabase.from("tip_actions").upsert({ user_id: viewer.id, tip_id: tipId, done_on: today }, { onConflict: "user_id,tip_id,done_on", ignoreDuplicates: true })
    : await supabase.from("tip_actions").delete().eq("tip_id", tipId).eq("done_on", today);
  return error ? { problem: error.message } : {};
}

import { cookies } from "next/headers";
import { CREW } from "@/lib/crew";
import { localDate } from "@/lib/dates";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type Profile = { displayName: string; crewId: string };
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

export async function getProfile(viewer: Viewer): Promise<Profile> {
  if (viewer.kind === "demo") {
    try {
      const raw = JSON.parse((await cookies()).get(DEMO_PROFILE)?.value ?? "{}");
      return { displayName: String(raw.n ?? "").slice(0, 40) || "Demo astronaut", crewId: validCrew(raw.c) };
    } catch {
      return { displayName: "Demo astronaut", crewId: CREW[0].id };
    }
  }
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name, crew_id").maybeSingle();
  return {
    displayName: (data?.display_name as string | null) || viewer.email.split("@")[0],
    crewId: validCrew(data?.crew_id),
  };
}

export async function saveProfile(viewer: Viewer, p: Profile): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    (await cookies()).set(DEMO_PROFILE, JSON.stringify({ n: p.displayName, c: p.crewId }), cookieOptions);
    return {};
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: viewer.id, display_name: p.displayName, crew_id: p.crewId, updated_at: new Date().toISOString() });
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
  const { data } = await supabase.from("tip_actions").select("tip_id, done_on").order("done_on", { ascending: false }).limit(500);
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

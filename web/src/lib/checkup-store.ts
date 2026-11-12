import { cookies } from "next/headers";
import type { Answers, Escalation } from "@/lib/checkups";
import { METRICS } from "@/lib/crew";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type CheckupLog = {
  crewId: string;
  checkupId: string;
  escalation: Escalation;
  createdAt: string;
  answers?: Answers;
};

export type LoadResult = { logs: CheckupLog[]; storage: "supabase" | "demo"; problem?: string };

const DEMO_LOGS_COOKIE = "astromed_demo_checkups";
const DEMO_MAX = 25;
const SETUP_HINT = "The checkup_logs table isn't set up in Supabase yet. Run supabase/migrations/0001_checkup_logs.sql in the Supabase SQL Editor.";

type DemoEntry = [crew: string, checkup: string, escalation: Escalation, epochSeconds: number, readings?: Record<string, number>];
// Numeric answers worth keeping in demo mode: chart readings, plus what marks checkups as done.
const KEEP_KEYS = new Set<string>([...METRICS.map((m) => m.key), "resistiveMin", "aerobicMin", "mood", "stress", "waterL", "kcal", "evaHours", "weightKg"]);
/** Browsers drop cookies over 4 KB, so the demo log trims its oldest entries to stay under this. */
const DEMO_MAX_BYTES = 3800;
/** Measured as the cookie is actually stored: URL-encoded, which makes JSON about 1.5× longer. */
export function fitDemoLogs(entries: unknown[]) {
  let list = entries.slice(-DEMO_MAX);
  while (list.length > 1 && encodeURIComponent(JSON.stringify(list)).length > DEMO_MAX_BYTES) list = list.slice(1);
  return list;
}

async function readDemo(): Promise<DemoEntry[]> {
  try {
    const raw = (await cookies()).get(DEMO_LOGS_COOKIE)?.value;
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => Array.isArray(e) && (e.length === 4 || e.length === 5)) : [];
  } catch {
    return [];
  }
}

function friendly(message: string) {
  return /checkup_logs|relation|schema cache/i.test(message) ? SETUP_HINT : message;
}

export async function loadLogs(viewer: Viewer, crewId?: string): Promise<LoadResult> {
  if (viewer.kind === "demo") {
    const logs = (await readDemo())
      .filter(([c]) => !crewId || c === crewId)
      .map(([crew, checkup, escalation, t, readings]) => ({ crewId: crew, checkupId: checkup, escalation, createdAt: new Date(t * 1000).toISOString(), answers: readings }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { logs, storage: "demo" };
  }

  const supabase = await createClient();
  let query = supabase
    .from("checkup_logs")
    .select("crew_id, checkup_id, escalation, answers, created_at")
    .order("created_at", { ascending: false })
    .limit(3000);
  if (crewId) query = query.eq("crew_id", crewId);
  const { data, error } = await query;
  if (error) return { logs: [], storage: "supabase", problem: friendly(error.message) };
  return {
    storage: "supabase",
    logs: (data ?? []).map((r) => ({
      crewId: r.crew_id as string,
      checkupId: r.checkup_id as string,
      escalation: r.escalation as Escalation,
      answers: r.answers as Answers,
      createdAt: r.created_at as string,
    })),
  };
}

export async function saveLog(viewer: Viewer, log: Omit<CheckupLog, "createdAt"> & { createdAt?: string }): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    const entries = await readDemo();
    // Keep only numeric readings that feed the charts, to stay within the cookie size limit.
    const readings = Object.fromEntries(Object.entries(log.answers ?? {}).filter(([k, v]) => KEEP_KEYS.has(k) && typeof v === "number")) as Record<string, number>;
    const t = Math.floor((log.createdAt ? Date.parse(log.createdAt) : Date.now()) / 1000);
    entries.push(Object.keys(readings).length ? [log.crewId, log.checkupId, log.escalation, t, readings] : [log.crewId, log.checkupId, log.escalation, t]);
    (await cookies()).set(DEMO_LOGS_COOKIE, JSON.stringify(fitDemoLogs(entries)), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return {};
  }
  const supabase = await createClient();
  const { error } = await supabase.from("checkup_logs").insert({
    crew_id: log.crewId,
    checkup_id: log.checkupId,
    escalation: log.escalation,
    answers: log.answers ?? {},
    ...(log.createdAt ? { created_at: log.createdAt } : {}),
  });
  return error ? { problem: friendly(error.message) } : {};
}

export const DEMO_LOGS_COOKIE_NAME = DEMO_LOGS_COOKIE;

export function clearDemoLogsCookieName() {
  return DEMO_LOGS_COOKIE;
}

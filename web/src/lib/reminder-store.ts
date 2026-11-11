import { cookies } from "next/headers";
import { localDate } from "@/lib/dates";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type Medication = { id: string; name: string; dose: string; instructions: string; times: string[]; active: boolean };
export type ReminderCategory = "exercise" | "water" | "checkup" | "sleep" | "other";
export type Reminder = { id: string; title: string; category: ReminderCategory; times: string[]; days: number[]; active: boolean };
export type MedLog = { medicationId: string; time: string; status: "taken" | "skipped" };
export type RemLog = { reminderId: string; time: string };

export type ScheduleData = { meds: Medication[]; reminders: Reminder[]; medLogs: MedLog[]; remLogs: RemLog[]; today: string; problem?: string };

export const CATEGORIES: { id: ReminderCategory; label: string }[] = [
  { id: "water", label: "Water" },
  { id: "exercise", label: "Exercise" },
  { id: "checkup", label: "Checkup" },
  { id: "sleep", label: "Sleep" },
  { id: "other", label: "Other" },
];

export const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

// ---------------------------------------------------------------------------
// Demo mode keeps everything in one small cookie, with only today's ticks.
// ---------------------------------------------------------------------------

const DEMO = "astromed_demo_meds";
type DemoState = { m: Medication[]; r: Reminder[]; d: string; ml: MedLog[]; rl: RemLog[] };

async function readDemo(): Promise<DemoState> {
  const today = localDate();
  try {
    const s = JSON.parse((await cookies()).get(DEMO)?.value ?? "") as DemoState;
    return s.d === today ? s : { ...s, d: today, ml: [], rl: [] };
  } catch {
    return { m: [], r: [], d: today, ml: [], rl: [] };
  }
}
async function writeDemo(s: DemoState) {
  (await cookies()).set(DEMO, JSON.stringify(s), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
}
export const DEMO_MEDS_COOKIE = DEMO;

// ---------------------------------------------------------------------------

export async function loadSchedule(viewer: Viewer): Promise<ScheduleData> {
  const today = localDate();
  if (viewer.kind === "demo") {
    const s = await readDemo();
    return { meds: s.m, reminders: s.r, medLogs: s.ml, remLogs: s.rl, today };
  }
  const supabase = await createClient();
  const [m, r, ml, rl] = await Promise.all([
    supabase.from("medications").select("id, name, dose, instructions, times, active").order("created_at"),
    supabase.from("reminders").select("id, title, category, times, days, active").order("created_at"),
    supabase.from("medication_logs").select("medication_id, scheduled_for, status").eq("taken_on", today),
    supabase.from("reminder_logs").select("reminder_id, scheduled_for").eq("done_on", today),
  ]);
  const err = m.error ?? r.error ?? ml.error ?? rl.error;
  return {
    today,
    problem: err?.message,
    meds: (m.data ?? []).map((x) => ({ id: x.id, name: x.name, dose: x.dose ?? "", instructions: x.instructions ?? "", times: x.times ?? [], active: x.active })),
    reminders: (r.data ?? []).map((x) => ({ id: x.id, title: x.title, category: x.category, times: x.times ?? [], days: x.days ?? [], active: x.active })),
    medLogs: (ml.data ?? []).map((x) => ({ medicationId: x.medication_id, time: x.scheduled_for, status: x.status })),
    remLogs: (rl.data ?? []).map((x) => ({ reminderId: x.reminder_id, time: x.scheduled_for })),
  };
}

type Result = { problem?: string };

export async function addMedication(viewer: Viewer, med: Omit<Medication, "id" | "active">): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    if (s.m.length >= 6) return { problem: "The demo holds up to 6 medicines." };
    s.m.push({ ...med, id: crypto.randomUUID(), active: true });
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("medications").insert({ user_id: viewer.id, ...med });
  return { problem: error?.message };
}

export async function addReminder(viewer: Viewer, rem: Omit<Reminder, "id" | "active">): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    if (s.r.length >= 8) return { problem: "The demo holds up to 8 reminders." };
    s.r.push({ ...rem, id: crypto.randomUUID(), active: true });
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("reminders").insert({ user_id: viewer.id, ...rem });
  return { problem: error?.message };
}

export async function setActive(viewer: Viewer, kind: "med" | "rem", id: string, active: boolean): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    const list: { id: string; active: boolean }[] = kind === "med" ? s.m : s.r;
    const item = list.find((x) => x.id === id);
    if (item) item.active = active;
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from(kind === "med" ? "medications" : "reminders").update({ active }).eq("id", id);
  return { problem: error?.message };
}

export async function removeItem(viewer: Viewer, kind: "med" | "rem", id: string): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    if (kind === "med") { s.m = s.m.filter((x) => x.id !== id); s.ml = s.ml.filter((x) => x.medicationId !== id); }
    else { s.r = s.r.filter((x) => x.id !== id); s.rl = s.rl.filter((x) => x.reminderId !== id); }
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from(kind === "med" ? "medications" : "reminders").delete().eq("id", id);
  return { problem: error?.message };
}

/** Record or clear today's tick for one scheduled time. status null clears it. */
export async function tick(viewer: Viewer, kind: "med" | "rem", id: string, time: string, status: "taken" | "skipped" | "done" | null): Promise<Result> {
  const today = localDate();
  if (viewer.kind === "demo") {
    const s = await readDemo();
    if (kind === "med") {
      s.ml = s.ml.filter((x) => !(x.medicationId === id && x.time === time));
      if (status === "taken" || status === "skipped") s.ml.push({ medicationId: id, time, status });
    } else {
      s.rl = s.rl.filter((x) => !(x.reminderId === id && x.time === time));
      if (status) s.rl.push({ reminderId: id, time });
    }
    await writeDemo(s);
    return {};
  }
  const supabase = await createClient();
  if (kind === "med") {
    const { error } = status
      ? await supabase.from("medication_logs").upsert({ user_id: viewer.id, medication_id: id, taken_on: today, scheduled_for: time, status }, { onConflict: "user_id,medication_id,taken_on,scheduled_for" })
      : await supabase.from("medication_logs").delete().eq("medication_id", id).eq("taken_on", today).eq("scheduled_for", time);
    return { problem: error?.message };
  }
  const { error } = status
    ? await supabase.from("reminder_logs").upsert({ user_id: viewer.id, reminder_id: id, done_on: today, scheduled_for: time }, { onConflict: "user_id,reminder_id,done_on,scheduled_for" })
    : await supabase.from("reminder_logs").delete().eq("reminder_id", id).eq("done_on", today).eq("scheduled_for", time);
  return { problem: error?.message };
}

export type ScheduleItem = { key: string; kind: "med" | "rem"; id: string; time: string; title: string; detail: string; state: "open" | "taken" | "skipped" | "done" };

/** Today's schedule, sorted by time. */
export function todaySchedule(d: ScheduleData): ScheduleItem[] {
  const weekday = new Date().getDay();
  const items: ScheduleItem[] = [];
  for (const m of d.meds.filter((x) => x.active)) {
    for (const t of m.times) {
      const log = d.medLogs.find((l) => l.medicationId === m.id && l.time === t);
      items.push({ key: `med-${m.id}-${t}`, kind: "med", id: m.id, time: t, title: m.name, detail: [m.dose, m.instructions].filter(Boolean).join(" · "), state: log?.status ?? "open" });
    }
  }
  for (const r of d.reminders.filter((x) => x.active && x.days.includes(weekday))) {
    for (const t of r.times) {
      const done = d.remLogs.some((l) => l.reminderId === r.id && l.time === t);
      items.push({ key: `rem-${r.id}-${t}`, kind: "rem", id: r.id, time: t, title: r.title, detail: r.category, state: done ? "done" : "open" });
    }
  }
  return items.sort((a, b) => a.time.localeCompare(b.time));
}

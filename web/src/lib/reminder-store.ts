import { cookies } from "next/headers";
import { addDays, localDate, weekdayOf } from "@/lib/dates";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type Medication = {
  id: string; name: string; dose: string; instructions: string; times: string[]; active: boolean;
  /** What it's for (a med-effect purpose id), when it was started, and whether the dose was confirmed with a doctor. */
  purpose?: string; startedOn?: string; confirmed?: boolean;
};
export type ReminderCategory = "exercise" | "water" | "checkup" | "sleep" | "other";
export type Reminder = { id: string; title: string; category: ReminderCategory; times: string[]; days: number[]; active: boolean };
export type MedLog = { medicationId: string; time: string; status: "taken" | "skipped"; date: string };
export type SideEffect = { id: string; medicationId: string; date: string; severity: "mild" | "moderate" | "severe"; note: string };
export type RemLog = { reminderId: string; time: string };

/** medLogs: today's ticks. medHistory: the last 4 weeks of ticks, for adherence and "is it working?". */
export type ScheduleData = { meds: Medication[]; reminders: Reminder[]; medLogs: MedLog[]; medHistory: MedLog[]; effects: SideEffect[]; remLogs: RemLog[]; today: string; problem?: string };

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
type DemoState = { m: Medication[]; r: Reminder[]; d: string; ml: MedLog[]; rl: RemLog[]; fx?: SideEffect[] };
const HISTORY_DAYS = 28;

async function readDemo(): Promise<DemoState> {
  const today = localDate();
  const oldest = addDays(today, -(HISTORY_DAYS - 1));
  try {
    const s = JSON.parse((await cookies()).get(DEMO)?.value ?? "") as DemoState;
    // Medicine ticks are kept for 4 weeks (older demo cookies have no dates: treat them as the cookie's day).
    const ml = (s.ml ?? []).map((l) => ({ ...l, date: l.date ?? s.d })).filter((l) => l.date >= oldest);
    return s.d === today ? { ...s, ml, fx: s.fx ?? [] } : { ...s, d: today, ml, rl: [], fx: s.fx ?? [] };
  } catch {
    return { m: [], r: [], d: today, ml: [], rl: [], fx: [] };
  }
}
async function writeDemo(s: DemoState) {
  // Browsers drop cookies over 4 KB: keep the most recent ticks and short side-effect notes.
  s.ml = s.ml.slice(-30);
  s.fx = (s.fx ?? []).slice(0, 6).map((f) => ({ ...f, note: f.note.slice(0, 80) }));
  (await cookies()).set(DEMO, JSON.stringify(s), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
}
export const DEMO_MEDS_COOKIE = DEMO;

// ---------------------------------------------------------------------------

export async function loadSchedule(viewer: Viewer): Promise<ScheduleData> {
  const today = localDate();
  if (viewer.kind === "demo") {
    const s = await readDemo();
    return { meds: s.m, reminders: s.r, medLogs: s.ml.filter((l) => l.date === today), medHistory: s.ml, effects: s.fx ?? [], remLogs: s.rl, today };
  }
  const supabase = await createClient();
  const [m, r, ml, rl, fx] = await Promise.all([
    supabase.from("medications").select("id, name, dose, instructions, times, active, purpose, started_on, confirmed_at").order("created_at"),
    supabase.from("reminders").select("id, title, category, times, days, active").order("created_at"),
    supabase.from("medication_logs").select("medication_id, scheduled_for, status, taken_on").gte("taken_on", addDays(today, -(HISTORY_DAYS - 1))).lte("taken_on", today),
    supabase.from("reminder_logs").select("reminder_id, scheduled_for").eq("done_on", today),
    supabase.from("medication_effects").select("id, medication_id, noted_on, severity, note").order("noted_on", { ascending: false }).limit(50),
  ]);
  const err = m.error ?? r.error ?? ml.error ?? rl.error ?? fx.error;
  const medHistory: MedLog[] = (ml.data ?? []).map((x) => ({ medicationId: x.medication_id, time: x.scheduled_for, status: x.status, date: x.taken_on }));
  return {
    today,
    problem: err?.message,
    meds: (m.data ?? []).map((x) => ({ id: x.id, name: x.name, dose: x.dose ?? "", instructions: x.instructions ?? "", times: x.times ?? [], active: x.active, purpose: x.purpose ?? undefined, startedOn: x.started_on ?? undefined, confirmed: !!x.confirmed_at })),
    reminders: (r.data ?? []).map((x) => ({ id: x.id, title: x.title, category: x.category, times: x.times ?? [], days: x.days ?? [], active: x.active })),
    medHistory,
    effects: (fx.data ?? []).map((x) => ({ id: x.id, medicationId: x.medication_id, date: x.noted_on, severity: x.severity, note: x.note ?? "" })),
    medLogs: medHistory.filter((l) => l.date === today),
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
  const { purpose, startedOn, confirmed, ...rest } = med;
  const { error } = await (await createClient()).from("medications").insert({ user_id: viewer.id, ...rest, purpose: purpose ?? null, started_on: startedOn ?? null, confirmed_at: confirmed ? new Date().toISOString() : null });
  return { problem: error?.message };
}

export async function addSideEffect(viewer: Viewer, fx: Omit<SideEffect, "id">): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    if (!s.m.some((m) => m.id === fx.medicationId)) return { problem: "Unknown medicine." };
    s.fx = [{ ...fx, id: crypto.randomUUID() }, ...(s.fx ?? [])].slice(0, 10);
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("medication_effects").insert({ user_id: viewer.id, medication_id: fx.medicationId, noted_on: fx.date, severity: fx.severity, note: fx.note || null });
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
    if (kind === "med") { s.m = s.m.filter((x) => x.id !== id); s.ml = s.ml.filter((x) => x.medicationId !== id); s.fx = (s.fx ?? []).filter((x) => x.medicationId !== id); }
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
      s.ml = s.ml.filter((x) => !(x.medicationId === id && x.time === time && x.date === today));
      if (status === "taken" || status === "skipped") s.ml.push({ medicationId: id, time, status, date: today });
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
  const weekday = weekdayOf(d.today);
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

export type RoutineStats = {
  days: number;
  meds: { name: string; expected: number; taken: number; skipped: number }[];
  remindersExpected: number;
  remindersDone: number;
};

/**
 * Medicines and reminders over the last `days` days, counting each scheduled time once a day
 * from when the medicine or reminder was added. Demo mode only keeps today's ticks.
 */
export async function routineStats(viewer: Viewer, days: number): Promise<RoutineStats> {
  const today = localDate();
  const dayList = Array.from({ length: days }, (_, i) => {
    const date = addDays(today, -(days - 1 - i));
    return { date, weekday: weekdayOf(date) };
  });
  if (viewer.kind === "demo") {
    const s = await loadSchedule(viewer);
    const meds = s.meds.filter((m) => m.active).map((m) => ({
      name: m.name, expected: m.times.length,
      taken: s.medLogs.filter((l) => l.medicationId === m.id && l.status === "taken").length,
      skipped: s.medLogs.filter((l) => l.medicationId === m.id && l.status === "skipped").length,
    }));
    const weekday = weekdayOf(today);
    const remindersExpected = s.reminders.filter((r) => r.active && r.days.includes(weekday)).reduce((n, r) => n + r.times.length, 0);
    return { days: 1, meds, remindersExpected, remindersDone: s.remLogs.length };
  }
  const supabase = await createClient();
  const from = dayList[0].date;
  const [m, r, ml, rl] = await Promise.all([
    supabase.from("medications").select("id, name, times, active, created_at"),
    supabase.from("reminders").select("id, times, days, active, created_at"),
    supabase.from("medication_logs").select("medication_id, status").gte("taken_on", from).lte("taken_on", today),
    supabase.from("reminder_logs").select("reminder_id").gte("done_on", from).lte("done_on", today),
  ]);
  const meds = (m.data ?? []).filter((x) => x.active).map((x) => {
    const since = localDate(new Date(x.created_at));
    const activeDays = dayList.filter((d) => d.date >= since).length;
    const logs = (ml.data ?? []).filter((l) => l.medication_id === x.id);
    return { name: x.name as string, expected: activeDays * (x.times?.length ?? 0), taken: logs.filter((l) => l.status === "taken").length, skipped: logs.filter((l) => l.status === "skipped").length };
  });
  const remindersExpected = (r.data ?? []).filter((x) => x.active).reduce((n, x) => {
    const since = localDate(new Date(x.created_at));
    return n + dayList.filter((d) => d.date >= since && (x.days ?? []).includes(d.weekday)).length * (x.times?.length ?? 0);
  }, 0);
  return { days, meds, remindersExpected, remindersDone: (rl.data ?? []).length };
}

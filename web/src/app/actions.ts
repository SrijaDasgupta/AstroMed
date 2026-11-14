"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { ENV_COOKIE, ENVIRONMENTS } from "@/lib/environments";
import { DEMO_COOKIE, getViewer, type Viewer } from "@/lib/session";
import { evaluate, getCheckup, parseAnswers, type Escalation, type Finding } from "@/lib/checkups";
import { getCrewMember } from "@/lib/crew";
import { clearDemoLogsCookieName, saveLog } from "@/lib/checkup-store";
import { DEMO_COOKIES, getProfile, saveProfile as storeProfile, setTipDone } from "@/lib/profile-store";
import { CREW } from "@/lib/crew";
import { TIPS } from "@/lib/tips";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const NOT_CONFIGURED = "Sign-in isn't set up yet. Add your Supabase keys to web/.env.local, or try the demo.";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  (await cookies()).delete(DEMO_COOKIE);
  redirect("/start");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const { email, password } = readCredentials(formData);
  if (!email || password.length < 8) return { error: "Enter an email and a password of at least 8 characters." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/start");
  return { message: "Check your email for a confirmation link, then sign in." };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  store.delete(ENV_COOKIE);
  store.delete(clearDemoLogsCookieName());
  DEMO_COOKIES.forEach((c) => store.delete(c));
  store.delete((await import("@/lib/reminder-store")).DEMO_MEDS_COOKIE);
  store.delete((await import("@/lib/missions-store")).DEMO_MISSIONS_COOKIE);
  store.delete((await import("@/lib/journal-store")).DEMO_JOURNAL_COOKIE);
  store.delete((await import("@/lib/body-notes-store")).DEMO_BODY_COOKIE);
  store.delete((await import("@/lib/sleep-store")).DEMO_SLEEP_COOKIE);
  store.delete((await import("@/lib/radiation-store")).DEMO_RADIATION_COOKIE);
  store.delete((await import("@/lib/records-store")).DEMO_IMPORTS_COOKIE);
  redirect("/");
}

export async function startDemo() {
  (await cookies()).set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  // Fill the demo with a sample mission and two weeks of data so every feature has something to show.
  await (await import("@/lib/demo-seed")).seedDemo();
  redirect("/start");
}

export async function setEnvironment(formData: FormData) {
  const id = String(formData.get("environment") ?? "");
  if (id === "none") {
    (await cookies()).delete(ENV_COOKIE);
    revalidatePath("/", "layout");
    return;
  }
  if (!ENVIRONMENTS.some((e) => e.id === id)) return;
  (await cookies()).set(ENV_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  revalidatePath("/", "layout");
}

export type CheckupState = {
  error?: string;
  result?: { level: Escalation; findings: Finding[]; saved: boolean; problem?: string; contact: { title: string; body: string } };
};

export async function submitCheckup(_prev: CheckupState, formData: FormData): Promise<CheckupState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const checkup = getCheckup(String(formData.get("checkupId") ?? ""));
  if (!checkup) return { error: "Unknown checkup." };
  const member = getCrewMember((await getProfile(viewer)).crewId)!;

  const parsed = parseAnswers(checkup, formData);
  if ("error" in parsed) return { error: parsed.error };

  // The reaction test is compared with the person's own earlier results.
  let priorReaction: number[] | undefined;
  if (checkup.id === "reaction") {
    const { loadLogs } = await import("@/lib/checkup-store");
    priorReaction = (await loadLogs(viewer)).logs.filter((l) => l.checkupId === "reaction" && typeof l.answers?.rtMedianMs === "number").map((l) => l.answers!.rtMedianMs as number);
  }
  const { level, findings } = evaluate(checkup, member, parsed.answers, { priorReaction });
  const { problem } = await saveLog(viewer, { crewId: member.id, checkupId: checkup.id, escalation: level, answers: parsed.answers });
  revalidatePath("/", "layout");
  const { contactText } = await import("@/lib/contact");
  const { getMissionContext } = await import("@/lib/mission");
  return { result: { level, findings, saved: !problem, problem, contact: contactText(level, (await getMissionContext()).env) } };
}

export async function toggleHabit(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const tipId = String(formData.get("tipId") ?? "");
  if (!TIPS.some((t) => t.id === tipId && t.habit)) return;
  await setTipDone(viewer, tipId, formData.get("done") === "1");
  revalidatePath("/", "layout");
}

export type ProfileState = { error?: string; saved?: boolean };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { BASELINE_FIELDS } = await import("@/lib/personal-baseline");
  const current = await getProfile(viewer);
  const text = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const displayName = text("displayName", 40);
  const crewId = String(formData.get("crewId") ?? current.crewId);
  if (!displayName) return { error: "Enter a name." };
  if (!CREW.some((c) => c.id === crewId)) return { error: "Choose a baseline recording." };

  function optionalNumber(k: string, min: number, max: number, label: string): number | undefined | string {
    const raw = text(k, 20);
    if (!raw) return undefined;
    const v = Number(raw);
    return Number.isFinite(v) && v >= min && v <= max ? v : `${label} must be between ${min} and ${max}.`;
  }
  const checks = {
    birthYear: optionalNumber("birthYear", 1900, new Date().getFullYear(), "Birth year"),
    heightCm: optionalNumber("heightCm", 50, 250, "Height"),
    weightKg: optionalNumber("weightKg", 20, 300, "Weight"),
  };
  for (const v of Object.values(checks)) if (typeof v === "string") return { error: v };
  const sex = text("sex", 10);
  const bloodType = text("bloodType", 3);
  const baseline: Record<string, number> = {};
  for (const f of BASELINE_FIELDS) {
    const v = optionalNumber(`baseline_${f.key}`, f.min, f.max, `Usual ${f.label.toLowerCase()}`);
    if (typeof v === "string") return { error: v };
    if (typeof v === "number") baseline[f.key] = v;
  }
  if ((baseline.systolic === undefined) !== (baseline.diastolic === undefined)) return { error: "Enter both usual blood pressure numbers, or neither." };

  const { problem } = await storeProfile(viewer, {
    displayName,
    crewId,
    details: {
      birthYear: checks.birthYear as number | undefined,
      sex: ["female", "male", "other"].includes(sex) ? (sex as "female" | "male" | "other") : undefined,
      heightCm: checks.heightCm as number | undefined,
      weightKg: checks.weightKg as number | undefined,
      bloodType: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(bloodType) ? bloodType : undefined,
      allergies: text("allergies", 300) || undefined,
      conditions: text("conditions", 300) || undefined,
    },
    baseline,
  });
  if (problem) return { error: problem };
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function askAssistant(question: string): Promise<import("@/lib/assistant").Answer> {
  const viewer = await getViewer();
  if (!viewer) return { blocks: [{ type: "text", text: "Your session has ended. Sign in again." }], suggestions: [] };
  const { answer } = await import("@/lib/assistant");
  const { getMyHealth } = await import("@/lib/my-health");
  const { getMissionContext } = await import("@/lib/mission");
  const { dailyMissions, progress } = await import("@/lib/gamification");
  const { loadTipActions } = await import("@/lib/profile-store");
  const q = String(question ?? "").slice(0, 300);
  const [health, actions] = await Promise.all([getMyHealth(viewer), loadTipActions(viewer)]);
  const missions = dailyMissions(health.assessment, health.env);
  const { listEntries } = await import("@/lib/journal-store");
  const p = progress(health.logs, actions, missions.map((m) => m.id), undefined, (await listEntries(viewer, 400)).entries.map((e) => e.date));
  return answer(q, {
    assessment: health.assessment,
    env: health.env,
    logs: health.logs,
    recordedDays: health.recordedDays,
    progress: p,
    missions,
    doneToday: p.doneToday,
    ...(await getMissionContext().then((c) => ({ missionDay: c.day, doseSoFar: c.doseSoFar, missionName: c.mission?.name }))),
  });
}

export async function submitDailyLog(_prev: CheckupState, formData: FormData): Promise<CheckupState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { DAILY_LOG_ID, evaluateDailyLog, parseDailyLog } = await import("@/lib/daily-log");
  const parsed = parseDailyLog(formData);
  if ("error" in parsed) return { error: parsed.error };
  const profile = await getProfile(viewer);
  const member = getCrewMember(profile.crewId)!;
  const { energyTarget } = await import("@/lib/nutrition");
  const { localDate } = await import("@/lib/dates");
  const { level, findings } = evaluateDailyLog(member, parsed.answers, energyTarget(profile.details, Number(localDate().slice(0, 4))).kcal);
  const answers = parsed.notes ? { ...parsed.answers, notes: parsed.notes } : parsed.answers;
  const { problem } = await saveLog(viewer, { crewId: member.id, checkupId: DAILY_LOG_ID, escalation: level, answers: answers as import("@/lib/checkups").Answers, createdAt: parsed.loggedAt });
  revalidatePath("/", "layout");
  const { contactText } = await import("@/lib/contact");
  const { getMissionContext } = await import("@/lib/mission");
  return { result: { level, findings, saved: !problem, problem, contact: contactText(level, (await getMissionContext()).env) } };
}

export type FormState = { error?: string; ok?: boolean; message?: string };

function readTimes(formData: FormData) {
  return [...new Set(formData.getAll("time").map(String).map((t) => t.trim()).filter(Boolean))].sort();
}

export async function addMedicationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { addMedication, TIME_RE } = await import("@/lib/reminder-store");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const dose = String(formData.get("dose") ?? "").trim().slice(0, 60);
  const instructions = String(formData.get("instructions") ?? "").trim().slice(0, 200);
  const times = readTimes(formData);
  if (!name) return { error: "Enter the medicine's name." };
  if (times.length === 0) return { error: "Add at least one time." };
  if (times.length > 6 || !times.every((t) => TIME_RE.test(t))) return { error: "Times must look like 08:00 (up to 6)." };
  const { problem } = await addMedication(viewer, { name, dose, instructions, times });
  if (problem) return { error: problem };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addReminderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { addReminder, CATEGORIES, TIME_RE } = await import("@/lib/reminder-store");
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const category = String(formData.get("category") ?? "other");
  const times = readTimes(formData);
  const days = formData.getAll("day").map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  if (!title) return { error: "Enter what to be reminded about." };
  if (!CATEGORIES.some((c) => c.id === category)) return { error: "Choose a type." };
  if (times.length === 0) return { error: "Add at least one time." };
  if (times.length > 6 || !times.every((t) => TIME_RE.test(t))) return { error: "Times must look like 08:00 (up to 6)." };
  if (days.length === 0) return { error: "Choose at least one day." };
  const { problem } = await addReminder(viewer, { title, category: category as import("@/lib/reminder-store").ReminderCategory, times, days: [...new Set(days)].sort() });
  if (problem) return { error: problem };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reminderItemAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const store = await import("@/lib/reminder-store");
  const kind = formData.get("kind") === "med" ? "med" : "rem";
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  if (!id) return;
  if (op === "stop" || op === "resume") await store.setActive(viewer, kind, id, op === "resume");
  else if (op === "remove") await store.removeItem(viewer, kind, id);
  else {
    const time = String(formData.get("time") ?? "");
    if (!store.TIME_RE.test(time)) return;
    const status = op === "taken" || op === "skipped" || op === "done" ? op : op === "undo" ? null : undefined;
    if (status === undefined) return;
    await store.tick(viewer, kind, id, time, status);
  }
  revalidatePath("/", "layout");
}

export async function uploadRecordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { RECORD_KINDS, uploadRecord } = await import("@/lib/records-store");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  const title = String(formData.get("title") ?? "").trim().slice(0, 120) || file.name.slice(0, 120);
  const kind = String(formData.get("kind") ?? "other");
  if (!RECORD_KINDS.some((k) => k.id === kind)) return { error: "Choose a record type." };
  const recordedOn = String(formData.get("recordedOn") ?? "");
  if (recordedOn && !/^\d{4}-\d{2}-\d{2}$/.test(recordedOn)) return { error: "Enter a valid date." };
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500) || undefined;
  const { problem } = await uploadRecord(viewer, file, { title, kind: kind as import("@/lib/records-store").RecordKind, recordedOn: recordedOn || undefined, notes });
  if (problem) return { error: problem };
  revalidatePath("/records");
  return { ok: true };
}

export async function deleteRecordAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { deleteRecord } = await import("@/lib/records-store");
  await deleteRecord(viewer, String(formData.get("id") ?? ""));
  revalidatePath("/records");
}

export async function importCsvAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  if (viewer.kind === "demo") return { error: "Importing needs an account. Sign in to import your data." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." };
  if (file.size > 2 * 1024 * 1024) return { error: "CSV files must be under 2 MB." };
  if (!/\.(csv|txt)$/i.test(file.name) && !["text/csv", "text/plain", "application/vnd.ms-excel"].includes(file.type)) return { error: "Choose a .csv file." };

  const { readImport } = await import("@/lib/csv-import");
  const { localDate, middayOf } = await import("@/lib/dates");
  const { createClient } = await import("@/lib/supabase/server");
  const result = readImport(await file.text());
  if (result.error) return { error: result.error };
  if (result.days.length === 0) return { error: `No usable readings found (${result.skippedRows} rows skipped). Check the dates and values.` };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("checkup_logs").select("created_at").eq("checkup_id", "import");
  const already = new Set((existing ?? []).map((r) => localDate(new Date(r.created_at as string))));
  const crewId = (await getProfile(viewer)).crewId;
  const rows = result.days
    .filter((d) => !already.has(d.date))
    .map((d) => ({ user_id: viewer.id, crew_id: crewId, checkup_id: "import", escalation: "none", answers: d.answers, created_at: middayOf(d.date).toISOString() }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from("checkup_logs").insert(rows.slice(i, i + 500));
    if (error) return { error: `Imported ${i} days, then stopped: ${error.message}` };
  }
  revalidatePath("/", "layout");
  const cols = result.matched.map((m) => `${m.column} → ${m.key}`).join(", ");
  const dup = result.days.length - rows.length;
  return {
    ok: true,
    message: `Imported ${rows.length} day${rows.length === 1 ? "" : "s"} (${result.days[0].date} to ${result.days[result.days.length - 1].date}).` +
      (dup ? ` ${dup} day${dup === 1 ? " was" : "s were"} already imported and skipped.` : "") +
      ` Columns used: ${cols}.` +
      (result.ignoredColumns.length ? ` Not used: ${result.ignoredColumns.slice(0, 6).join(", ")}${result.ignoredColumns.length > 6 ? "…" : ""}.` : "") +
      (result.skippedRows ? ` ${result.skippedRows} row${result.skippedRows === 1 ? "" : "s"} had no usable date or values.` : ""),
  };
}

export async function addMissionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { addMission } = await import("@/lib/missions-store");
  const text = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const name = text("name", 80);
  const envType = text("envType", 20);
  const startDate = text("startDate", 10);
  const endDate = text("endDate", 10);
  const dose = text("doseRate", 10);
  const crew = text("crewSize", 3);
  if (!name) return { error: "Give your mission a name." };
  if (!ENVIRONMENTS.some((e) => e.id === envType)) return { error: "Choose a mission type." };
  const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!isDate(startDate)) return { error: "Enter a start date." };
  if (endDate && (!isDate(endDate) || endDate < startDate)) return { error: "The end date must be on or after the start date." };
  const doseRate = dose ? Number(dose) : undefined;
  if (doseRate !== undefined && (!Number.isFinite(doseRate) || doseRate < 0 || doseRate > 50)) return { error: "Dose rate must be between 0 and 50 mSv/day." };
  const crewSize = crew ? Number(crew) : undefined;
  if (crewSize !== undefined && (!Number.isInteger(crewSize) || crewSize < 1 || crewSize > 50)) return { error: "Crew size must be 1 to 50." };
  const { problem } = await addMission(viewer, {
    name, envType: envType as import("@/lib/environments").EnvironmentId, startDate, endDate: endDate || undefined, doseRate, crewSize,
    location: text("location", 120) || undefined, objectives: text("objectives", 1000) || undefined,
  });
  if (problem) return { error: problem };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function missionItemAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const store = await import("@/lib/missions-store");
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  if (op === "activate" && id) await store.setActiveMission(viewer, id);
  else if (op === "deactivate") await store.setActiveMission(viewer, null);
  else if (op === "delete" && id) await store.deleteMission(viewer, id);
  revalidatePath("/", "layout");
}

export type JournalState = { error?: string; ok?: boolean; support?: boolean; lowMood?: boolean };

export async function addJournalAction(_prev: JournalState, formData: FormData): Promise<JournalState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { JOURNAL_TOPICS, PROMPTS, needsSupport } = await import("@/lib/journal");
  const { addEntry } = await import("@/lib/journal-store");
  const body = String(formData.get("body") ?? "").trim().slice(0, 5000);
  const date = String(formData.get("date") ?? "");
  const moodRaw = String(formData.get("mood") ?? "");
  const prompt = String(formData.get("prompt") ?? "");
  if (!body) return { error: "Write something first." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a date." };
  const mood = moodRaw ? Number(moodRaw) : undefined;
  if (mood !== undefined && (!Number.isInteger(mood) || mood < 1 || mood > 5)) return { error: "Choose a mood from 1 to 5." };
  const tags = formData.getAll("tag").map(String).filter((t) => JOURNAL_TOPICS.some((x) => x.id === t)).slice(0, 10);
  const { problem } = await addEntry(viewer, { date, mood, body, tags, prompt: PROMPTS.includes(prompt) ? prompt : undefined });
  if (problem) return { error: problem };
  revalidatePath("/", "layout");
  return { ok: true, support: needsSupport(body), lowMood: mood !== undefined && mood <= 2 };
}

export async function deleteJournalAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { deleteEntry } = await import("@/lib/journal-store");
  await deleteEntry(viewer, String(formData.get("id") ?? ""));
  revalidatePath("/journal");
}

export type BodyNoteState = { error?: string; ok?: boolean; level?: import("@/lib/checkups").Escalation; headline?: string; title?: string; related?: string[]; redFlags?: string[] };

const KIND_FROM_CATEGORY: Record<string, string> = {
  environmental: "exposure", eyes: "vision", ent: "other", dental: "dental", heart: "pain", lungs: "breathing", gut: "nausea-gut",
  urinary: "urinary", musculoskeletal: "pain", skin: "skin", neuro: "other", mind: "mood-stress", other: "other",
};

export async function addBodyNoteAction(_prev: BodyNoteState, formData: FormData): Promise<BodyNoteState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { BODY_AREAS, NOTE_KINDS, adviceFor, noteTitle } = await import("@/lib/body-notes");
  const { addBodyNote, checkPhoto, listBodyNotes } = await import("@/lib/body-notes-store");
  const { analyzeText } = await import("@/lib/space-conditions");
  const { localDate } = await import("@/lib/dates");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 3000) || undefined;
  const pickedKind = NOTE_KINDS.find((k) => k.id === String(formData.get("kind") ?? ""))?.id;
  if (!notes && !pickedKind) return { error: "Describe what's happening, or choose what you noticed." };
  const analysis = analyzeText(notes ?? "", String(formData.get("area") ?? ""));
  const best = analysis.matches[0]?.condition;
  const area = BODY_AREAS.find((a) => a.id === String(formData.get("area") ?? ""))
    ?? BODY_AREAS.find((a) => a.id === best?.areas[0])
    ?? BODY_AREAS.find((a) => a.id === "whole-body")!;
  const kind = (pickedKind ?? (best ? KIND_FROM_CATEGORY[best.category] : "other")) as (typeof NOTE_KINDS)[number]["id"];
  const severity = Number(formData.get("severity"));
  if (!Number.isInteger(severity) || severity < 0 || severity > 10) return { error: "Rate it from 0 to 10." };
  const today = localDate();
  const startedOn = String(formData.get("startedOn") ?? "") || today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startedOn) || startedOn > today) return { error: "Choose a start date that isn't in the future." };
  const sideRaw = String(formData.get("side") ?? "");
  const side = area.sided && ["left", "right", "both"].includes(sideRaw) ? (sideRaw as "left" | "right" | "both") : undefined;
  const photo = formData.get("photo") instanceof File ? (formData.get("photo") as File) : null;
  const bad = checkPhoto(photo);
  if (bad) return { error: bad };
  const note = { area: area.id, side, kind, severity, startedOn, notes, topics: analysis.matches.slice(0, 3).map((m) => m.condition.id) };
  const { problem } = await addBodyNote(viewer, note, photo);
  if (problem) return { error: problem };
  const { notes: all } = await listBodyNotes(viewer);
  const { getMissionContext } = await import("@/lib/mission");
  const advice = adviceFor({ ...note, id: "new", createdAt: new Date().toISOString() }, all, today, (await getMissionContext()).env);
  revalidatePath("/", "layout");
  return { ok: true, level: advice.level, headline: advice.headline, title: noteTitle(note), related: advice.related.map((r) => r.name), redFlags: advice.redFlags };
}

export type UpdateState = { error?: string; ok?: boolean };

export async function addProblemUpdateAction(_prev: UpdateState, formData: FormData): Promise<UpdateState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { addNoteUpdate, checkPhoto } = await import("@/lib/body-notes-store");
  const id = String(formData.get("id") ?? "");
  const severity = Number(formData.get("severity"));
  if (!Number.isInteger(severity) || severity < 0 || severity > 10) return { error: "Rate it from 0 to 10." };
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000) || undefined;
  const photo = formData.get("photo") instanceof File ? (formData.get("photo") as File) : null;
  const bad = checkPhoto(photo);
  if (bad) return { error: bad };
  const { problem } = await addNoteUpdate(viewer, id, { severity, body }, photo);
  if (problem) return { error: problem };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function bodyNoteItemAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { deleteBodyNote, resolveBodyNote } = await import("@/lib/body-notes-store");
  const { localDate } = await import("@/lib/dates");
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  if (op === "resolve") await resolveBodyNote(viewer, id, localDate());
  else if (op === "reopen") await resolveBodyNote(viewer, id, null);
  else if (op === "delete") await deleteBodyNote(viewer, id);
  revalidatePath("/", "layout");
}

export async function savePhotoAnalysisAction(target: "note" | "update", id: string, analysis: unknown): Promise<{ error?: string }> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const { StoredAnalysisSchema } = await import("@/lib/ai-analysis");
  const parsed = StoredAnalysisSchema.safeParse(analysis);
  if (!parsed.success || (target !== "note" && target !== "update") || !/^[0-9a-f-]{36}$/i.test(id)) return { error: "That analysis couldn't be saved." };
  const clip = (xs: string[]) => xs.slice(0, 8).map((x) => x.slice(0, 400));
  const a = parsed.data;
  const clean = { ...a, description: a.description.slice(0, 800), urgencyReason: a.urgencyReason.slice(0, 400), observations: clip(a.observations), possibleConditions: clip(a.possibleConditions), warningSigns: clip(a.warningSigns), selfCare: clip(a.selfCare), conditionIds: a.conditionIds.slice(0, 6) };
  const { savePhotoAnalysis } = await import("@/lib/body-notes-store");
  const { problem } = await savePhotoAnalysis(viewer, target, id, clean);
  if (problem) return { error: problem };
  revalidatePath("/", "layout");
  return {};
}

/** Saves a sleep or nap session from the Sleep orbit. Throws on failure so the card can offer a retry. */
export async function saveSleepSessionAction(record: { id: string; kind: "sleep" | "nap"; startedAt: string; endedAt: string }): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Your session has ended. Sign in again.");
  const { checkSleep, saveSleep } = await import("@/lib/sleep-store");
  const problem = checkSleep(record ?? {});
  if (problem) throw new Error(problem);
  const saved = await saveSleep(viewer, {
    id: record.id, kind: record.kind, source: "manual",
    startedAt: new Date(record.startedAt).toISOString(), endedAt: new Date(record.endedAt).toISOString(),
  });
  if (saved.problem) throw new Error(saved.problem);
  revalidatePath("/vitals");
}

/** Saves a dosimeter reading from My exposure. Throws on failure so the form can retry. */
export async function saveRadiationReadingAction(reading: { id: string; name: string; doseMsv: number; hours: number }): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Your session has ended. Sign in again.");
  const { checkRadiation, saveRadiation } = await import("@/lib/radiation-store");
  const input = { ...reading, source: "crew-entered" as const };
  const problem = checkRadiation(input);
  if (problem) throw new Error(problem);
  const saved = await saveRadiation(viewer, { id: input.id, name: input.name.trim(), doseMsv: Number(input.doseMsv), hours: Number(input.hours), source: "crew-entered" });
  if (saved.problem) throw new Error(saved.problem);
  revalidatePath("/hazards");
}

/**
 * Saves what the astronaut confirmed from a photo: a radiation reading, a sleep session, or a health
 * record (the photo itself plus the reviewed text, in My records). Throws on failure so the card can retry.
 */
export async function savePhotoImportAction(formData: FormData): Promise<{ href: string; note?: string } | { error: string }> {
  // Errors are returned, not thrown, so the reason (such as an overlapping sleep) reaches the person.
  try {
    return await savePhotoImport(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The save didn't work." };
  }
}

async function savePhotoImport(formData: FormData): Promise<{ href: string; note?: string }> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Your session has ended. Sign in again.");
  const category = String(formData.get("category") ?? "");
  let record: Record<string, unknown>;
  try {
    record = JSON.parse(String(formData.get("record") ?? "{}"));
  } catch {
    throw new Error("Invalid import.");
  }

  if (category === "radiation") {
    const { checkRadiation, saveRadiation } = await import("@/lib/radiation-store");
    const input = { id: record.id, name: record.name, doseMsv: record.cumulativeDoseMsv, hours: record.durationHours, source: "photo-import" };
    const problem = checkRadiation(input);
    if (problem) throw new Error(problem);
    const saved = await saveRadiation(viewer, { id: String(input.id), name: String(input.name).trim(), doseMsv: Number(input.doseMsv), hours: Number(input.hours), source: "photo-import" });
    if (saved.problem) throw new Error(saved.problem);
    revalidatePath("/hazards");
    return { href: "/hazards" };
  }

  if (category === "sleep") {
    const { checkSleep, saveSleep } = await import("@/lib/sleep-store");
    const problem = checkSleep(record);
    if (problem) throw new Error(problem);
    const saved = await saveSleep(viewer, {
      id: String(record.id), kind: record.kind === "nap" ? "nap" : "sleep", source: "photo-import",
      startedAt: new Date(String(record.startedAt)).toISOString(), endedAt: new Date(String(record.endedAt)).toISOString(),
    });
    if (saved.problem) throw new Error(saved.problem);
    revalidatePath("/vitals");
    return { href: "/vitals" };
  }

  if (category === "health") {
    const { addDemoImport, uploadRecord } = await import("@/lib/records-store");
    const { extractHealthMeasurements } = await import("@/components/astromed/photo-import-data");
    const id = String(record.id ?? "");
    const title = String(record.title ?? "").trim().slice(0, 120);
    const findings = String(record.findings ?? "").trim().slice(0, 12000);
    const observedOn = record.observedOn ? String(record.observedOn) : undefined;
    if (!/^[0-9a-f-]{36}$/i.test(id) || !title || !findings) throw new Error("Add a title and the findings.");
    if (observedOn && !/^\d{4}-\d{2}-\d{2}$/.test(observedOn)) throw new Error("Enter a valid date.");
    // Rebuilt from the reviewed text on the server rather than trusted from the browser.
    const measurements = extractHealthMeasurements(findings).slice(0, 60)
      .map((m) => ({ label: m.label.slice(0, 80), value: m.value.slice(0, 40), unit: m.unit.slice(0, 20) }));
    if (viewer.kind === "demo") {
      await addDemoImport({ id, title, recordedOn: observedOn, findings, measurements });
    } else {
      const image = formData.get("image");
      if (!(image instanceof File) || image.size === 0) throw new Error("The photo is missing.");
      const { problem } = await uploadRecord(viewer, image, { id, title, kind: "report", recordedOn: observedOn, findings, measurements, notes: "Imported from a photo" });
      if (problem) throw new Error(problem);
    }
    revalidatePath("/records");
    const note = formData.get("addToVitals") === "1" ? await logPhotoReadings(viewer, id, measurements, observedOn) : undefined;
    return { href: "/records", ...(note ? { note } : {}) };
  }
  throw new Error("Choose a record type.");
}

/**
 * Adds readings from a photo import to that day's log, so they feed My vitals, trends and alerts,
 * and checks them with the same rules as the daily log. Returns a short note for the person.
 */
async function logPhotoReadings(viewer: Viewer, importId: string, measurements: { label: string; value: string; unit: string }[], observedOn?: string): Promise<string | undefined> {
  const { mapPhotoReadings, PHOTO_LOG_ID, PHOTO_MEASURE_NAMES } = await import("@/lib/photo-readings");
  const { answers, used } = mapPhotoReadings(measurements);
  if (used.length === 0) return undefined;
  const { evaluateDailyLog } = await import("@/lib/daily-log");
  const { localDate, middayOf } = await import("@/lib/dates");
  const today = localDate();
  if (observedOn && observedOn > today) throw new Error("The observation date is in the future.");
  // A retried save carries the same import id, so don't add the readings twice.
  const { loadLogs } = await import("@/lib/checkup-store");
  if ((await loadLogs(viewer)).logs.some((l) => l.checkupId === PHOTO_LOG_ID && l.answers?.importId === importId)) return undefined;
  const profile = await getProfile(viewer);
  const member = getCrewMember(profile.crewId)!;
  const { level, findings } = evaluateDailyLog(member, answers);
  const { problem } = await saveLog(viewer, {
    crewId: member.id, checkupId: PHOTO_LOG_ID, escalation: level,
    answers: { ...answers, importId } as import("@/lib/checkups").Answers,
    createdAt: (observedOn && observedOn !== today ? middayOf(observedOn) : new Date()).toISOString(),
  });
  if (problem) return `The record was saved, but the readings couldn't be added to My vitals: ${problem}`;
  revalidatePath("/", "layout");
  const names = [...new Set(used.map((u) => PHOTO_MEASURE_NAMES[u.key]))].join(", ");
  if (level === "none") return `Added ${names} to My vitals.`;
  const { contactText } = await import("@/lib/contact");
  const { getMissionContext } = await import("@/lib/mission");
  const worst = findings.find((f) => f.level === level) ?? findings[0];
  return `Added ${names} to My vitals. ${worst ? `${worst.text} ` : ""}${contactText(level, (await getMissionContext()).env).title}`;
}

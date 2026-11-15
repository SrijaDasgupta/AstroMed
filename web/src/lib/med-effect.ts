/**
 * "Is it working?" for a medicine the astronaut takes as prescribed: compares the measure the
 * medicine is for (sleep, blood pressure, headaches…) in the 2 weeks before starting with the
 * days since, using the person's own logs. It reports what the numbers show; decisions about the
 * medicine stay with the flight surgeon. Pure functions, no I/O.
 */
import type { Answers } from "@/lib/checkups";
import { addDays, daysBetween, localDate } from "@/lib/dates";
import { dosesBetween, isDueOn, type MedScheduleFields } from "@/lib/med-schedule";

type LogLike = { createdAt: string; checkupId?: string; answers?: Answers };

export type Purpose = {
  id: string;
  label: string;
  /** "measure": a number averaged per day; "symptom": share of logged days with the symptom ticked. */
  kind: "measure" | "symptom";
  key: string;
  better: "higher" | "lower";
  unit: string;
  decimals: number;
  /** Smallest change worth calling a difference, in the measure's units (symptoms: share of days). */
  minChange: number;
  /** How the measure reads in a sentence. */
  noun: string;
};

export const PURPOSES: Purpose[] = [
  { id: "sleep", label: "Sleep", kind: "measure", key: "sleepHours", better: "higher", unit: "h", decimals: 1, minChange: 0.3, noun: "sleep" },
  { id: "blood-pressure", label: "Blood pressure", kind: "measure", key: "systolic", better: "lower", unit: "mmHg", decimals: 0, minChange: 5, noun: "systolic blood pressure" },
  { id: "blood-sugar", label: "Blood sugar", kind: "measure", key: "glucose", better: "lower", unit: "mg/dL", decimals: 0, minChange: 8, noun: "fasting blood sugar" },
  { id: "heart-rate", label: "Heart rate", kind: "measure", key: "restingHr", better: "lower", unit: "bpm", decimals: 0, minChange: 4, noun: "resting heart rate" },
  { id: "fever", label: "Fever", kind: "measure", key: "temperature", better: "lower", unit: "°C", decimals: 1, minChange: 0.3, noun: "temperature" },
  { id: "mood", label: "Mood", kind: "measure", key: "mood", better: "higher", unit: "/5", decimals: 1, minChange: 0.5, noun: "mood rating" },
  { id: "stress", label: "Stress or anxiety", kind: "measure", key: "stress", better: "lower", unit: "/5", decimals: 1, minChange: 0.5, noun: "stress rating" },
  { id: "headache", label: "Headaches", kind: "symptom", key: "headache", better: "lower", unit: "", decimals: 0, minChange: 0.2, noun: "headaches" },
  { id: "motion-sickness", label: "Nausea or motion sickness", kind: "symptom", key: "nausea", better: "lower", unit: "", decimals: 0, minChange: 0.2, noun: "nausea or dizziness" },
  { id: "congestion", label: "Blocked nose", kind: "symptom", key: "congestion", better: "lower", unit: "", decimals: 0, minChange: 0.2, noun: "a blocked nose or sore throat" },
  { id: "back-pain", label: "Back pain", kind: "symptom", key: "backPain", better: "lower", unit: "", decimals: 0, minChange: 0.2, noun: "back pain" },
];

export const getPurpose = (id: string | undefined) => PURPOSES.find((p) => p.id === id);

/** Days of readings needed on each side before comparing. */
export const MIN_DAYS = 3;
const WINDOW = 14;

export type EffectStatus = "better" | "same" | "worse" | "early" | "no-before" | "untracked";
export type Effect = { status: EffectStatus; text: string; before?: number; after?: number; beforeDays: number; afterDays: number };

/** One value per day: the day's average for a measure, or 1/0 for a symptom on days with a daily log. */
function perDay(logs: LogLike[], p: Purpose, from: string, to: string) {
  const days = new Map<string, number[]>();
  for (const l of logs) {
    const day = localDate(new Date(l.createdAt));
    if (day < from || day > to || !l.answers) continue;
    let v: number | undefined;
    if (p.kind === "measure") v = typeof l.answers[p.key] === "number" ? (l.answers[p.key] as number) : undefined;
    // Symptoms are only recorded when ticked, so every day with a daily log entry counts as logged.
    else if (l.checkupId === "daily") v = l.answers[p.key] === true ? 1 : 0;
    if (v !== undefined) days.set(day, [...(days.get(day) ?? []), v]);
  }
  return [...days.values()].map((vs) => (p.kind === "symptom" ? Math.max(...vs) : vs.reduce((a, b) => a + b, 0) / vs.length));
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function fmt(p: Purpose, v: number) {
  return p.kind === "symptom" ? `${Math.round(v * 100)}% of days` : `${v.toFixed(p.decimals)}${p.unit === "/5" ? "/5" : ` ${p.unit}`}`;
}

/** Compares the 2 weeks before `startedOn` with the days since (up to 2 weeks). */
export function assessEffect(purposeId: string | undefined, startedOn: string | undefined, logs: LogLike[], today = localDate()): Effect {
  const p = getPurpose(purposeId);
  if (!p || !startedOn) return { status: "untracked", text: "Choose what it's for to see whether it's helping.", beforeDays: 0, afterDays: 0 };
  const before = perDay(logs, p, addDays(startedOn, -WINDOW), addDays(startedOn, -1));
  const afterFrom = daysBetween(startedOn, today) >= WINDOW ? addDays(today, -(WINDOW - 1)) : startedOn;
  const after = perDay(logs, p, afterFrom, today);
  const base = { beforeDays: before.length, afterDays: after.length };
  const log = p.kind === "symptom" ? "daily log" : `${p.noun} readings`;
  if (before.length < MIN_DAYS) {
    return { ...base, status: "no-before", text: `There aren't enough ${log} from before you started to compare. AstroMed will keep tracking your ${p.noun} from here.`, after: after.length ? mean(after) : undefined };
  }
  if (after.length < MIN_DAYS) {
    return { ...base, status: "early", text: `Keep logging: after ${MIN_DAYS} days of ${log} since starting, AstroMed compares before and after.`, before: mean(before) };
  }
  const b = mean(before), a = mean(after);
  const delta = a - b;
  const improved = p.better === "higher" ? delta >= p.minChange : -delta >= p.minChange;
  const worsened = p.better === "higher" ? -delta >= p.minChange : delta >= p.minChange;
  const compare = `${fmt(p, a)} since you started, vs. ${fmt(p, b)} in the 2 weeks before.`;
  const what = p.kind === "symptom" ? `You've had ${p.noun} on ${compare}` : `Your ${p.noun} averaged ${compare}`;
  if (improved) return { ...base, status: "better", before: b, after: a, text: `${what} Looks like it's helping.` };
  if (worsened) return { ...base, status: "worse", before: b, after: a, text: `${what} It's going the wrong way: bring it up with your flight surgeon at your next conference, and keep taking it as prescribed unless they say otherwise.` };
  return { ...base, status: "same", before: b, after: a, text: `${what} No clear change yet. Some medicines take longer; mention it at your next conference if it stays the same.` };
}

/**
 * Share of scheduled doses marked taken since the start: over the last 2 weeks, or 4 weeks for
 * medicines taken less than daily. Doses later today aren't due yet, so only today's ticked doses count.
 * As-needed medicines have no schedule, so this returns undefined.
 */
export function adherence(m: MedScheduleFields, taken: { date: string; status: "taken" | "skipped" }[], today = localDate()) {
  if (!m.times.length || m.schedule === "as-needed") return undefined;
  const sparse = m.schedule === "interval" || (m.schedule === "weekdays" && (m.days ?? []).length < 7);
  const windowDays = sparse ? 28 : WINDOW;
  const earliest = addDays(today, -(windowDays - 1));
  const from = m.startedOn && m.startedOn > earliest ? m.startedOn : earliest;
  const inRange = taken.filter((t) => t.date >= from && t.date <= today);
  const expected = (today > from ? dosesBetween(m, from, addDays(today, -1)) : 0) + (isDueOn(m, today) ? inRange.filter((t) => t.date === today).length : 0);
  const done = inRange.filter((t) => t.status === "taken").length;
  if (expected === 0) return undefined;
  return { expected, taken: Math.min(done, expected), pct: Math.min(100, Math.round((done / expected) * 100)), days: daysBetween(from, today) + 1 };
}

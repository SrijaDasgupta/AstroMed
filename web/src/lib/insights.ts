/**
 * Data-driven context for a reading that's out of the person's normal range: what else in their
 * own logs changed over the same days (sleep, stress, exercise, water, temperature, food, cabin air,
 * spacewalks), and one practical next step. It points at likely contributors; it doesn't diagnose.
 * Pure functions, no I/O.
 */
import type { Answers } from "@/lib/checkups";
import { addDays, localDate } from "@/lib/dates";

type LogLike = { createdAt: string; answers?: Answers };

/** Average per day of a numeric answer, for days in [from, to]. */
function perDay(logs: LogLike[], key: string, from: string, to: string, combine: "mean" | "sum" | "max" = "mean") {
  const days = new Map<string, number[]>();
  for (const l of logs) {
    const v = l.answers?.[key];
    if (typeof v !== "number") continue;
    const d = localDate(new Date(l.createdAt));
    if (d < from || d > to) continue;
    days.set(d, [...(days.get(d) ?? []), v]);
  }
  return [...days.entries()].map(([date, vs]) => ({ date, value: combine === "sum" ? vs.reduce((a, b) => a + b, 0) : combine === "max" ? Math.max(...vs) : vs.reduce((a, b) => a + b, 0) / vs.length }));
}

const mean = (xs: { value: number }[]) => (xs.length ? xs.reduce((a, b) => a + b.value, 0) / xs.length : undefined);
const r1 = (n: number) => n.toFixed(1).replace(/\.0$/, "");

type Factor = "sleep" | "stress" | "exercise" | "water" | "fever" | "co2" | "noise" | "cabinTemp" | "eva" | "food";

const FACTORS: Record<string, Factor[]> = {
  systolic: ["sleep", "stress", "exercise", "co2"],
  diastolic: ["sleep", "stress", "exercise", "co2"],
  restingHr: ["fever", "water", "sleep", "stress", "eva"],
  hrv: ["sleep", "stress", "fever", "eva"],
  temperature: ["fever", "cabinTemp", "eva"],
  glucose: ["food", "exercise", "sleep"],
  spo2: ["co2"],
  sleepHours: ["stress", "noise", "co2", "cabinTemp", "eva"],
  sleepEfficiency: ["stress", "noise", "co2", "cabinTemp"],
  moodPositive: ["sleep", "exercise", "stress"],
  moodNegative: ["sleep", "exercise", "stress"],
};

/** Factors in the last 3 days that may explain a change in `key`, compared with the 2 weeks before. */
export function contributors(key: string, logs: LogLike[], today = localDate()): string[] {
  const recentFrom = addDays(today, -2), priorFrom = addDays(today, -16), priorTo = addDays(today, -3);
  const recent = (k: string, c?: "mean" | "sum" | "max") => perDay(logs, k, recentFrom, today, c);
  const prior = (k: string, c?: "mean" | "sum" | "max") => perDay(logs, k, priorFrom, priorTo, c);
  const out: string[] = [];
  for (const f of FACTORS[key] ?? []) {
    if (f === "sleep") {
      const r = mean(recent("sleepHours")), p = mean(prior("sleepHours"));
      if (r !== undefined && (r < 6 || (p !== undefined && p - r >= 0.5))) out.push(`sleep averaged ${r1(r)} h over the last 3 nights${p !== undefined ? ` (${r1(p)} h before)` : ""}`);
    } else if (f === "stress") {
      const high = recent("stress").filter((d) => d.value >= 4).length;
      if (high) out.push(`stress was 4/5 or higher on ${high} of the last 3 days`);
    } else if (f === "exercise") {
      const rDays = [...recent("resistiveMin"), ...recent("aerobicMin")];
      if (!rDays.length) continue; // no logs lately isn't the same as no exercise
      const r = rDays.reduce((s, d) => s + d.value, 0);
      const pDays = new Set([...prior("resistiveMin"), ...prior("aerobicMin")].map((d) => d.date)).size;
      const p = [...prior("resistiveMin"), ...prior("aerobicMin")].reduce((s, d) => s + d.value, 0);
      const usual3 = pDays ? (p / pDays) * 3 : undefined;
      if (usual3 !== undefined && usual3 > 0 && r < usual3 * 0.5) out.push(`exercise was ${Math.round(r)} min over the last 3 days, against about ${Math.round(usual3)} min usually`);
    } else if (f === "water") {
      const r = mean(recent("waterL"));
      if (r !== undefined && r < 2.5) out.push(`water averaged ${r1(r)} L a day, under the 2.5 L minimum`);
    } else if (f === "fever") {
      const r = recent("temperature", "max");
      const top = r.length ? Math.max(...r.map((d) => d.value)) : undefined;
      if (top !== undefined && top >= 37.5) out.push(`your temperature reached ${r1(top)} °C`);
    } else if (f === "co2") {
      const r = recent("co2Mmhg", "max");
      const top = r.length ? Math.max(...r.map((d) => d.value)) : undefined;
      if (top !== undefined && top > 3) out.push(`cabin CO₂ reached ${r1(top)} mmHg (limit 3)`);
    } else if (f === "noise") {
      const r = recent("noiseDba", "max");
      const top = r.length ? Math.max(...r.map((d) => d.value)) : undefined;
      if (top !== undefined && top > 70) out.push(`cabin noise reached ${Math.round(top)} dBA`);
    } else if (f === "cabinTemp") {
      const r = recent("cabinTempC", "max");
      const top = r.length ? Math.max(...r.map((d) => d.value)) : undefined;
      if (top !== undefined && (top > 27 || top < 18)) out.push(`the cabin was ${r1(top)} °C`);
    } else if (f === "eva") {
      const r = recent("evaHours", "sum").filter((d) => d.value > 0);
      if (r.length) out.push(`you did a ${r1(r.reduce((s, d) => s + d.value, 0))}-hour spacewalk`);
    } else if (f === "food") {
      const r = mean(recent("kcal")), p = mean(prior("kcal"));
      if (r !== undefined && p !== undefined && r > p * 1.2) out.push(`you ate about ${Math.round(((r - p) / p) * 100)}% more than usual`);
    }
  }
  return out;
}

/** One practical next step for a reading that's out of range, in the direction it moved. */
export function nextStep(key: string, direction: "high" | "low"): string {
  switch (key) {
    case "systolic":
    case "diastolic":
      return "Re-measure tomorrow morning at the same time, after 5 minutes seated and before caffeine or exercise, to see whether it holds.";
    case "restingHr":
      return direction === "high" ? "Take it again first thing tomorrow, before getting up, and drink to thirst today." : "Re-check at rest; a low resting rate is often just fitness, but mention it if you also feel dizzy.";
    case "hrv":
      return "Prioritize sleep and an easier training day, then compare tomorrow's reading.";
    case "temperature":
      return "Re-check in 2–4 hours and note any symptoms; rest and keep drinking.";
    case "glucose":
      return "Re-check fasting tomorrow morning; regular meals and your planned exercise help most.";
    case "spo2":
      return "Re-measure at rest on a warm finger with no nail polish, and check the cabin air readings.";
    case "sleepHours":
    case "sleepEfficiency":
      return "Keep tonight's sleep period free of work, dark and cool, and log it tomorrow.";
    default:
      return "Keep logging daily; a short note on what was different helps you and your flight surgeon spot the cause.";
  }
}

/** "In your logs: sleep averaged 5.4 h …; stress was 4/5 …" or undefined when nothing stands out. */
export function contributorsLine(key: string, logs: LogLike[], today?: string) {
  const c = contributors(key, logs, today);
  return c.length ? `In your logs, ${c.join("; ")}.` : undefined;
}

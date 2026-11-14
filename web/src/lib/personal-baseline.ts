import type { CheckupLog } from "@/lib/checkup-store";
import type { Baseline, CrewMember, MetricKey } from "@/lib/crew";
import { localDate } from "@/lib/dates";
import type { EnteredBaseline } from "@/lib/profile-store";

/** Usual values a person can set for themselves. */
export const BASELINE_FIELDS: { key: MetricKey; label: string; unit: string; min: number; max: number; step: number }[] = [
  { key: "restingHr", label: "Resting heart rate", unit: "bpm", min: 30, max: 120, step: 1 },
  { key: "systolic", label: "Blood pressure, systolic", unit: "mmHg", min: 80, max: 180, step: 1 },
  { key: "diastolic", label: "Blood pressure, diastolic", unit: "mmHg", min: 40, max: 120, step: 1 },
  { key: "glucose", label: "Fasting blood glucose", unit: "mg/dL", min: 50, max: 200, step: 1 },
  { key: "temperature", label: "Body temperature", unit: "°C", min: 35, max: 38, step: 0.1 },
  { key: "spo2", label: "Oxygen saturation", unit: "%", min: 90, max: 100, step: 1 },
  { key: "sleepHours", label: "Sleep", unit: "h", min: 3, max: 12, step: 0.25 },
];

/** Days of own readings needed before they set the baseline. */
export const MIN_DAYS_FOR_BASELINE = 7;

export type BaselineSource = "entered" | "readings";

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * The person's own baseline for each measure: values they entered first, then the median of
 * their own daily readings once there are enough days, otherwise the sample recording's value.
 */
export function personalize(member: CrewMember, entered: EnteredBaseline, logs: CheckupLog[]) {
  const byDay: Record<string, Record<string, number[]>> = {};
  for (const l of logs) {
    if (!l.answers) continue;
    const day = localDate(new Date(l.createdAt));
    for (const f of BASELINE_FIELDS) {
      const v = l.answers[f.key];
      if (typeof v === "number") ((byDay[f.key] ??= {})[day] ??= []).push(v);
    }
  }
  const values: Partial<Record<MetricKey, number>> = {};
  const sources: Partial<Record<MetricKey, BaselineSource>> = {};
  const readingDays: Partial<Record<MetricKey, number>> = {};
  for (const f of BASELINE_FIELDS) {
    const days = Object.values(byDay[f.key] ?? {}).map((vs) => vs.reduce((a, b) => a + b, 0) / vs.length);
    readingDays[f.key] = days.length;
    if (typeof entered[f.key] === "number") { values[f.key] = entered[f.key]; sources[f.key] = "entered"; }
    else if (days.length >= MIN_DAYS_FOR_BASELINE) { values[f.key] = Number(median(days).toFixed(1)); sources[f.key] = "readings"; }
  }
  const me: CrewMember = {
    ...member,
    baseline: {
      ...member.baseline,
      restingHr: values.restingHr ?? member.baseline.restingHr,
      sleepHours: values.sleepHours ?? member.baseline.sleepHours,
    } as Baseline,
    simulated: {
      systolic: values.systolic ?? member.simulated.systolic,
      diastolic: values.diastolic ?? member.simulated.diastolic,
      glucose: values.glucose ?? member.simulated.glucose,
      temperature: values.temperature ?? member.simulated.temperature,
      spo2: values.spo2 ?? member.simulated.spo2,
    },
  };
  return { me, sources, readingDays };
}

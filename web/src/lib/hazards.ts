import { MISSION_DAYS, type Assessment, type MetricKey } from "@/lib/crew";
import type { EnvironmentId, MissionEnvironment } from "@/lib/environments";

/** NASA career limit for spaceflight radiation (NASA-STD-3001 Vol. 1, p. 40). */
export const CAREER_LIMIT_MSV = 600;

/** Hip and spine bone density loss in microgravity, % per month (Bone fracture report, p. 42). */
export const BONE_LOSS_PCT_PER_MONTH: [number, number] = [1, 1.5];

export const LENGTH_OPTIONS = [
  { days: 30, label: "30 days" },
  { days: 180, label: "6 months" },
  { days: 365, label: "1 year" },
  { days: 900, label: "Mars round trip (900 days)" },
];

/** A sensible default length to project to for each mission. */
export const DEFAULT_LENGTH: Record<EnvironmentId, number> = {
  "earth-analog": 365,
  leo: 180,
  "lunar-surface": 30,
  "mars-transit": 900,
  "mars-surface": 900,
};

export type Gravity = "earth" | "micro" | "partial";

export function gravityOf(env: MissionEnvironment): Gravity {
  if (env.id === "earth-analog") return "earth";
  if (env.id === "leo" || env.id === "mars-transit") return "micro";
  return "partial";
}

export type Point = { day: number; low: number; high: number };

/** Evenly spaced sample days from 0 to `length`, always including `today` and the end. */
function sampleDays(length: number, today: number) {
  const step = Math.max(1, Math.round(length / 120));
  const days = new Set<number>([0, length, Math.min(today, length)]);
  for (let d = 0; d <= length; d += step) days.add(d);
  return [...days].sort((a, b) => a - b);
}

export function radiationSeries(env: MissionEnvironment, length: number, today: number): Point[] {
  return sampleDays(length, today).map((day) => {
    const v = env.radiationMsvPerDay * day;
    return { day, low: v, high: v };
  });
}

/**
 * Estimated hip/spine bone density loss (%). Linear at 1–1.5% per month in microgravity.
 * NASA does not know whether the loss levels off, or whether Moon or Mars gravity slows it
 * (Bone fracture report, p. 11), so for partial gravity the low end is 0 and the high end
 * is the microgravity rate.
 */
export function boneSeries(env: MissionEnvironment, length: number, today: number): Point[] | null {
  const g = gravityOf(env);
  if (g === "earth") return null;
  const [lo, hi] = BONE_LOSS_PCT_PER_MONTH;
  return sampleDays(length, today).map((day) => {
    const months = day / 30.4;
    return { day, low: g === "partial" ? 0 : lo * months, high: hi * months };
  });
}

export type ImmuneSignal = { key: MetricKey; label: string };

/** Measures that can hint at infection or stress-related immune changes. */
export const IMMUNE_SIGNAL_LABELS: ImmuneSignal[] = [
  { key: "temperature", label: "Raised temperature" },
  { key: "sleepHours", label: "Short sleep" },
  { key: "moodNegative", label: "Raised negative mood (stress)" },
];

/** Changes in the person's own heart and immune-related measures (last 3 days vs. baseline). */
export function myHazards(a: Assessment) {
  const metric = (k: MetricKey) => a.metrics.find((m) => m.def.key === k)!;
  const change = (k: MetricKey) => metric(k).recentMean - metric(k).baseline;
  return {
    cardio: (["restingHr", "systolic", "diastolic"] as MetricKey[]).map((k) => ({ metric: metric(k), change: change(k) })),
    immune: IMMUNE_SIGNAL_LABELS.filter((s) => metric(s.key).status !== "good"),
    today: MISSION_DAYS,
  };
}

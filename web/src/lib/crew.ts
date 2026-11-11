import baselineFile from "@/data/mmash_baselines.json";
import type { EnvironmentId, MissionEnvironment } from "@/lib/environments";

/** What we measured for one MMASH participant over ~24 hours (see scripts/build_baselines.py). */
export type Baseline = (typeof baselineFile.participants)[number];

/** Vitals MMASH did not record. Generated once per person within normal healthy-adult ranges. */
export type SimulatedBaseline = { systolic: number; diastolic: number; glucose: number; temperature: number };

export type CrewMember = {
  id: string;
  callSign: string;
  role: string;
  participant: string;
  baseline: Baseline;
  simulated: SimulatedBaseline;
};

// Six participants with complete heart, sleep and saliva records. Call signs are invented;
// the dataset contains no names.
const ROSTER = [
  { id: "vega", callSign: "Vega", role: "Commander", participant: "user_1" },
  { id: "orion", callSign: "Orion", role: "Pilot", participant: "user_3" },
  { id: "lyra", callSign: "Lyra", role: "Flight engineer", participant: "user_12" },
  { id: "atlas", callSign: "Atlas", role: "Mission specialist", participant: "user_14" },
  { id: "nova", callSign: "Nova", role: "Medical officer", participant: "user_17" },
  { id: "draco", callSign: "Draco", role: "Mission specialist", participant: "user_20" },
];

export const CREW: CrewMember[] = ROSTER.map((r) => {
  const baseline = baselineFile.participants.find((p) => p.participant === r.participant);
  if (!baseline) throw new Error(`Missing MMASH baseline for ${r.participant}`);
  const rand = seededRandom(`${r.id}:baseline`);
  const between = (lo: number, hi: number, dp: number) => Number((lo + rand() * (hi - lo)).toFixed(dp));
  const simulated = {
    systolic: between(108, 124, 0),
    diastolic: between(66, 80, 0),
    glucose: between(80, 95, 0),
    temperature: between(36.4, 36.9, 1),
  };
  return { ...r, baseline, simulated };
});

export const BASELINE_SOURCE = baselineFile.source;

export function getCrewMember(id: string) {
  return CREW.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// Metrics and personal normal ranges
// ---------------------------------------------------------------------------

export type MetricKey =
  | "restingHr" | "hrv" | "systolic" | "diastolic"
  | "glucose" | "temperature"
  | "sleepHours" | "sleepEfficiency"
  | "moodPositive" | "moodNegative";

export type MetricGroup = "Heart and circulation" | "Metabolism and temperature" | "Sleep" | "Mood";
export const METRIC_GROUPS: MetricGroup[] = ["Heart and circulation", "Metabolism and temperature", "Sleep", "Mood"];

export type MetricDef = {
  key: MetricKey;
  label: string;
  unit: string;
  decimals: number;
  group: MetricGroup;
  /** Whether the personal baseline comes from the person's real MMASH recording or is simulated. */
  baselineKind: "measured" | "simulated";
  /** Which direction is a concern. */
  worseWhen: "higher" | "lower";
  baseline: (m: CrewMember) => number;
  /**
   * Day-to-day variation within one healthy person. MMASH has one day per person, so for most
   * measures this is a conservative assumption. Mood uses the person's real spread across the day.
   */
  dailySd: (base: number, m: CrewMember) => number;
};

export const METRICS: MetricDef[] = [
  { key: "restingHr", label: "Resting heart rate", unit: "bpm", decimals: 0, group: "Heart and circulation", baselineKind: "measured", worseWhen: "higher", baseline: (m) => m.baseline.restingHr ?? 60, dailySd: () => 3 },
  { key: "hrv", label: "Heart rate variability", unit: "ms", decimals: 0, group: "Heart and circulation", baselineKind: "measured", worseWhen: "lower", baseline: (m) => m.baseline.hrvRmssdMs ?? 50, dailySd: (x) => x * 0.12 },
  { key: "systolic", label: "Blood pressure, systolic", unit: "mmHg", decimals: 0, group: "Heart and circulation", baselineKind: "simulated", worseWhen: "higher", baseline: (m) => m.simulated.systolic, dailySd: () => 6 },
  { key: "diastolic", label: "Blood pressure, diastolic", unit: "mmHg", decimals: 0, group: "Heart and circulation", baselineKind: "simulated", worseWhen: "higher", baseline: (m) => m.simulated.diastolic, dailySd: () => 5 },
  { key: "glucose", label: "Blood glucose (fasting)", unit: "mg/dL", decimals: 0, group: "Metabolism and temperature", baselineKind: "simulated", worseWhen: "higher", baseline: (m) => m.simulated.glucose, dailySd: () => 6 },
  { key: "temperature", label: "Body temperature", unit: "°C", decimals: 1, group: "Metabolism and temperature", baselineKind: "simulated", worseWhen: "higher", baseline: (m) => m.simulated.temperature, dailySd: () => 0.2 },
  { key: "sleepHours", label: "Sleep", unit: "h", decimals: 1, group: "Sleep", baselineKind: "measured", worseWhen: "lower", baseline: (m) => m.baseline.sleepHours ?? 6, dailySd: () => 0.5 },
  { key: "sleepEfficiency", label: "Sleep efficiency", unit: "%", decimals: 0, group: "Sleep", baselineKind: "measured", worseWhen: "lower", baseline: (m) => m.baseline.sleepEfficiencyPct ?? 85, dailySd: () => 4 },
  { key: "moodPositive", label: "Positive mood", unit: "pts", decimals: 0, group: "Mood", baselineKind: "measured", worseWhen: "lower", baseline: (m) => m.baseline.moodPositive ?? 25, dailySd: (_, m) => Math.max(2, m.baseline.moodPositiveSd ?? 3) },
  { key: "moodNegative", label: "Negative mood", unit: "pts", decimals: 0, group: "Mood", baselineKind: "measured", worseWhen: "higher", baseline: (m) => m.baseline.moodNegative ?? 13, dailySd: (_, m) => Math.max(2, m.baseline.moodNegativeSd ?? 2) },
];

export function getMetric(key: MetricKey) {
  return METRICS.find((d) => d.key === key)!;
}

/** Normal range shown on charts: the personal baseline ± 2 day-to-day SDs. */
export function normalRange(def: MetricDef, m: CrewMember): [number, number] {
  const base = def.baseline(m);
  const sd = def.dailySd(base, m);
  return [base - 2 * sd, base + 2 * sd];
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export const MISSION_DAYS = 30;

type Effect = Partial<Record<MetricKey, number>>;

/**
 * Average shift once adapted to each environment, in each metric's own units (HRV in %).
 * Directions follow the NASA evidence where it exists: blood pressure lower in flight
 * (Cardiovascular report p. 23), glucose unchanged (p. 40), temperature regulation impaired
 * over long flights (p. 84), about 6 h sleep in space (Sleep report p. 11). Sizes are illustrative.
 */
const ENV_EFFECT: Record<EnvironmentId, { adapted: Effect; perDay: Effect }> = {
  "earth-analog": { adapted: { hrv: -3, sleepHours: -0.2, sleepEfficiency: -1, moodPositive: -1, moodNegative: 0.5 }, perDay: {} },
  leo: { adapted: { restingHr: -1, hrv: -5, systolic: -5, diastolic: -3, sleepHours: -0.5, sleepEfficiency: -2 }, perDay: { temperature: 0.006 } },
  "lunar-surface": { adapted: { restingHr: 2, hrv: -8, systolic: -2, diastolic: -1, temperature: 0.1, sleepHours: -0.6, sleepEfficiency: -3, moodNegative: 0.5 }, perDay: {} },
  "mars-transit": { adapted: { hrv: -5, systolic: -5, diastolic: -3, sleepHours: -0.5, sleepEfficiency: -2 }, perDay: { hrv: -0.15, temperature: 0.006, moodPositive: -0.05 } },
  "mars-surface": { adapted: { restingHr: 2, hrv: -6, systolic: -2, diastolic: -1, temperature: 0.1, sleepHours: -0.4, sleepEfficiency: -2, moodPositive: -1 }, perDay: {} },
};

/** Scripted health events so the demo shows how alerts look. */
const EVENTS: Record<string, { fromDay: number; note: string; effect: Effect }> = {
  atlas: { fromDay: 27, note: "Simulated run of disrupted sleep over the last few nights.", effect: { sleepHours: -1.6, sleepEfficiency: -12 } },
  nova: { fromDay: 28, note: "Simulated rise in resting heart rate with falling variability, as can happen with illness or overexertion.", effect: { restingHr: 9, hrv: -38 } },
  orion: { fromDay: 29, note: "Simulated short night after a schedule shift.", effect: { sleepHours: -0.9, sleepEfficiency: -5 } },
  lyra: { fromDay: 28, note: "Simulated low-grade fever with a faster resting heart rate, as with an infection.", effect: { temperature: 0.9, restingHr: 6, hrv: -15 } },
  draco: { fromDay: 25, note: "Simulated dip in mood over several days, with slightly shorter sleep.", effect: { moodPositive: -8, moodNegative: 12, sleepHours: -0.4 } },
};

function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

export type DaySeries = Record<MetricKey, number[]>;

const LIMITS: Partial<Record<MetricKey, [number, number]>> = {
  sleepEfficiency: [0, 100],
  moodPositive: [10, 50],
  moodNegative: [10, 50],
};

export function simulate(member: CrewMember, env: MissionEnvironment): DaySeries {
  const rand = seededRandom(`${member.id}:${env.id}`);
  const { adapted, perDay } = ENV_EFFECT[env.id];
  const event = EVENTS[member.id];
  const out = Object.fromEntries(METRICS.map((d) => [d.key, [] as number[]])) as DaySeries;

  for (let day = 1; day <= MISSION_DAYS; day++) {
    const adapt = 1 - Math.exp(-day / 4); // effects build up over the first week
    const ev = event && day >= event.fromDay ? event.effect : {};
    for (const def of METRICS) {
      const k = def.key;
      const base = def.baseline(member);
      const shift = (adapted[k] ?? 0) * adapt + (perDay[k] ?? 0) * day + (ev[k] ?? 0);
      let v = k === "hrv" ? base * (1 + shift / 100) : base + shift;
      v += gaussian(rand) * def.dailySd(base, member) * 0.6;
      const [lo, hi] = LIMITS[k] ?? [0, Infinity];
      out[k].push(Math.min(hi, Math.max(lo, v)));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export type Status = "good" | "warning" | "critical";

export type MetricAssessment = {
  def: MetricDef;
  values: number[];
  latest: number;
  recentMean: number;
  baseline: number;
  range: [number, number];
  /** How many day-to-day SDs the last 3 days sit from baseline, in the concerning direction. */
  deviation: number;
  status: Status;
};

export type Assessment = {
  member: CrewMember;
  metrics: MetricAssessment[];
  status: Status;
  eventNote?: string;
  cumulativeDoseMsv: number;
};

const RANK: Record<Status, number> = { good: 0, warning: 1, critical: 2 };

export function assess(member: CrewMember, env: MissionEnvironment): Assessment {
  const series = simulate(member, env);
  const metrics = METRICS.map((def): MetricAssessment => {
    const values = series[def.key];
    const base = def.baseline(member);
    const recent = values.slice(-3);
    const recentMean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const signed = (recentMean - base) / def.dailySd(base, member);
    const deviation = def.worseWhen === "higher" ? signed : -signed;
    const status: Status = deviation >= 3 ? "critical" : deviation >= 2 ? "warning" : "good";
    return { def, values, latest: values[values.length - 1], recentMean, baseline: base, range: normalRange(def, member), deviation, status };
  });
  const status = metrics.reduce<Status>((s, m) => (RANK[m.status] > RANK[s] ? m.status : s), "good");
  const event = EVENTS[member.id];
  return {
    member,
    metrics,
    status,
    eventNote: status !== "good" ? event?.note : undefined,
    cumulativeDoseMsv: env.radiationMsvPerDay * MISSION_DAYS,
  };
}

export function formatValue(v: number, def: MetricDef) {
  return `${v.toFixed(def.decimals)} ${def.unit}`;
}

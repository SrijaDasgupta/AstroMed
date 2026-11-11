import type { Assessment, MetricAssessment, MetricKey, Status } from "@/lib/crew";

/** The headline vitals shown on summaries, in display order. Blood pressure combines two measures. */
export const SUMMARY_COLUMNS: { label: string; keys: MetricKey[] }[] = [
  { label: "Heart rate", keys: ["restingHr"] },
  { label: "Blood pressure", keys: ["systolic", "diastolic"] },
  { label: "Glucose", keys: ["glucose"] },
  { label: "Temperature", keys: ["temperature"] },
  { label: "Sleep", keys: ["sleepHours"] },
  { label: "Mood", keys: ["moodPositive"] },
];

const RANK: Record<Status, number> = { good: 0, warning: 1, critical: 2 };

export function summaryCell(a: Assessment, keys: MetricKey[]) {
  const ms = keys.map((k) => a.metrics.find((m) => m.def.key === k)!) as MetricAssessment[];
  const status = ms.reduce<Status>((s, m) => (RANK[m.status] > RANK[s] ? m.status : s), "good");
  const value =
    keys.length === 2
      ? `${ms[0].latest.toFixed(0)}/${ms[1].latest.toFixed(0)}`
      : ms[0].latest.toFixed(ms[0].def.decimals);
  return { value, unit: ms[0].def.unit, status, simulated: ms.every((m) => m.def.baselineKind === "simulated") };
}

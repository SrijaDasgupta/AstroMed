import { evaluate, type Answers, type Checkup, type Escalation, type Finding } from "@/lib/checkups";
import type { CrewMember, MetricKey } from "@/lib/crew";

export const DAILY_LOG_ID = "daily";

type NumberField = { id: string; label: string; unit: string; min: number; max: number; step: number; metric?: MetricKey };
type ScaleField = { id: string; label: string; low: string; high: string };

export const DAILY_SECTIONS: { title: string; numbers?: NumberField[]; scales?: ScaleField[] }[] = [
  {
    title: "Vital signs",
    numbers: [
      { id: "restingHr", label: "Resting heart rate", unit: "bpm", min: 25, max: 220, step: 1, metric: "restingHr" },
      { id: "systolic", label: "Blood pressure, systolic", unit: "mmHg", min: 60, max: 260, step: 1, metric: "systolic" },
      { id: "diastolic", label: "Blood pressure, diastolic", unit: "mmHg", min: 30, max: 160, step: 1, metric: "diastolic" },
      { id: "temperature", label: "Temperature", unit: "°C", min: 33, max: 43, step: 0.1, metric: "temperature" },
      { id: "spo2", label: "Oxygen saturation (SpO₂)", unit: "%", min: 50, max: 100, step: 1, metric: "spo2" },
      { id: "glucose", label: "Blood glucose, fasting", unit: "mg/dL", min: 20, max: 600, step: 1, metric: "glucose" },
    ],
  },
  {
    title: "Sleep",
    numbers: [{ id: "sleepHours", label: "Hours slept last night", unit: "h", min: 0, max: 16, step: 0.25, metric: "sleepHours" }],
    scales: [{ id: "quality", label: "How well did you sleep?", low: "Very badly", high: "Very well" }],
  },
  {
    title: "Exercise and water",
    numbers: [
      { id: "resistiveMin", label: "Resistance exercise", unit: "min", min: 0, max: 240, step: 5 },
      { id: "aerobicMin", label: "Aerobic exercise", unit: "min", min: 0, max: 240, step: 5 },
      { id: "waterL", label: "Water drunk", unit: "L", min: 0, max: 10, step: 0.1 },
    ],
  },
  {
    title: "Food and weight",
    numbers: [
      { id: "kcal", label: "Food energy eaten (estimate)", unit: "kcal", min: 0, max: 8000, step: 50 },
      { id: "evaHours", label: "Spacewalk (EVA) time", unit: "h", min: 0, max: 12, step: 0.5 },
      { id: "weightKg", label: "Body weight", unit: "kg", min: 30, max: 250, step: 0.1 },
    ],
  },
  {
    title: "Mood",
    scales: [
      { id: "mood", label: "Mood today", low: "Very low", high: "Very good" },
      { id: "stress", label: "Stress today", low: "Very low", high: "Very high" },
    ],
  },
];

export const SYMPTOMS = [
  { id: "headache", label: "Headache" },
  { id: "nausea", label: "Nausea or dizziness" },
  { id: "congestion", label: "Blocked nose or sore throat" },
  { id: "backPain", label: "Back pain" },
  { id: "blurred", label: "Change in vision" },
  { id: "rash", label: "Rash or skin problem" },
  { id: "coldSore", label: "Cold sore, mouth ulcer or blisters" },
  { id: "neckSwelling", label: "Swelling, heaviness or pain in the neck, face or one arm" },
  { id: "flankPain", label: "Pain in your side or back, or blood in your urine" },
];

const NUMBERS = DAILY_SECTIONS.flatMap((s) => s.numbers ?? []);
const SCALES = DAILY_SECTIONS.flatMap((s) => s.scales ?? []);

/** When an entry made offline was really logged: accepted up to 7 days back, never in the future. */
function loggedAt(form: FormData): string | undefined {
  const t = Date.parse(String(form.get("loggedAt") ?? ""));
  if (!Number.isFinite(t) || t > Date.now() + 5 * 60000 || t < Date.now() - 7 * 86400000) return undefined;
  return new Date(t).toISOString();
}

export function parseDailyLog(form: FormData): { answers: Answers; notes: string; loggedAt?: string } | { error: string } {
  const answers: Answers = {};
  for (const f of NUMBERS) {
    const raw = String(form.get(f.id) ?? "").trim();
    if (raw === "") continue;
    const v = Number(raw);
    if (!Number.isFinite(v) || v < f.min || v > f.max) return { error: `${f.label} must be between ${f.min} and ${f.max} ${f.unit}.` };
    answers[f.id] = v;
  }
  for (const f of SCALES) {
    const raw = form.get(f.id);
    if (raw === null || raw === "") continue;
    const v = Number(raw);
    if (!Number.isInteger(v) || v < 1 || v > 5) return { error: `Choose 1–5 for: ${f.label}` };
    answers[f.id] = v;
  }
  for (const s of SYMPTOMS) if (form.get(s.id) === "on") answers[s.id] = true;
  const notes = String(form.get("notes") ?? "").trim().slice(0, 300);
  if (Object.keys(answers).length === 0 && !notes) return { error: "Enter at least one thing to log." };
  if ((answers.systolic === undefined) !== (answers.diastolic === undefined)) return { error: "Enter both blood pressure numbers, or neither." };
  return { answers, notes, loggedAt: loggedAt(form) };
}

/** Same rules as the guided checkups, plus symptoms and water. */
export function evaluateDailyLog(member: CrewMember, a: Answers, kcalTarget?: number): { level: Escalation; findings: Finding[] } {
  const asCheckup: Checkup = {
    id: DAILY_LOG_ID, title: "Daily log", summary: "", everyDays: 1, steps: [], why: [],
    fields: NUMBERS.map((f) => ({ ...f, kind: "number" as const, optional: true })),
  };
  // The daily log has its own headache wording, so leave it out of the shared rules.
  const { headache: _h, ...rest } = a;
  void _h;
  const base = evaluate(asCheckup, member, rest);
  const extra: Finding[] = [];
  if (a.headache) extra.push({ level: "routine", text: "Headache. If it's severe, sudden or comes with vision changes, contact your flight surgeon today." });
  if (a.nausea) extra.push({ level: "routine", text: "Nausea or dizziness. If you can't keep fluids down or it lasts more than a day, contact your flight surgeon." });
  if (a.backPain) extra.push({ level: "routine", text: "Back pain. Common while adapting to weightlessness; mention it if it continues." });
  if (a.rash) extra.push({ level: "routine", text: "Rash or skin problem. Report it if it spreads or looks infected." });
  if (a.coldSore) extra.push({ level: "routine", text: "Cold sore, mouth ulcer or blisters. Stress in spaceflight has been linked to dormant viruses reactivating, so mention it; report blisters in a band on one side of the body today (Behavioral health evidence report, p. 31)." });
  if (a.neckSwelling) extra.push({ level: "today", text: "Swelling, heaviness or pain in the neck, face or one arm. Blood can pool in the neck veins in weightlessness, and clots there have been found in astronauts; contact the flight surgeon today and ask about a neck-vein ultrasound. Sudden breathlessness or chest pain: contact now." });
  if (a.flankPain) extra.push({ level: "today", text: "Pain in your side or back, or blood in your urine, can be a kidney stone. Drink water steadily and contact the flight surgeon today. Severe pain, fever or not being able to pass urine: contact now." });
  if (a.congestion) extra.push({ level: "none", text: "Blocked nose or sore throat. Take your temperature to check for fever." });
  if (typeof a.kcal === "number" && kcalTarget) {
    const need = kcalTarget + 200 * (typeof a.evaHours === "number" ? a.evaHours : 0);
    const pct = Math.round((a.kcal / need) * 100);
    if (pct < 75) extra.push({ level: "routine", text: `You ate about ${a.kcal.toLocaleString("en-US")} kcal, ${pct}% of your ~${need.toLocaleString("en-US")} kcal need. Regular shortfalls lead to weight and muscle loss; tell your flight surgeon if it keeps happening (NASA-STD-3001 Vol. 1, p. 37).` });
    else if (pct < 90) extra.push({ level: "none", text: `You ate about ${a.kcal.toLocaleString("en-US")} kcal, ${pct}% of your ~${need.toLocaleString("en-US")} kcal need. Try to make it up tomorrow.` });
  }
  if (typeof a.evaHours === "number" && a.evaHours > 0) extra.push({ level: "none", text: "After a spacewalk, do the After-spacewalk check for signs of decompression sickness and hand or suit injuries." });
  if (typeof a.waterL === "number" && a.waterL < 2.5) extra.push({ level: "none", text: `${a.waterL} L of water is below NASA's 2.5 L daily minimum (NASA-STD-3001 Vol. 2, p. 68).` });
  const order = { none: 0, routine: 1, today: 2, now: 3 } as const;
  const findings = [...base.findings, ...extra].sort((x, y) => order[y.level] - order[x.level]);
  const level = findings.reduce<Escalation>((l, f) => (order[f.level] > order[l] ? f.level : l), "none");
  return { level, findings };
}

/** Which guided checkups a daily log entry also counts as. */
export function dailyLogCovers(checkupId: string, a: Answers | undefined) {
  if (!a) return false;
  const has = (k: string) => a[k] !== undefined;
  if (checkupId === "vitals") return has("restingHr") || has("systolic") || has("temperature");
  if (checkupId === "sleep") return has("sleepHours");
  if (checkupId === "exercise") return has("resistiveMin") || has("aerobicMin");
  if (checkupId === "mood") return has("mood") || has("stress");
  return false;
}

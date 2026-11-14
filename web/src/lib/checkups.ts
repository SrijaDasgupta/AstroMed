import { getMetric, normalRange, type CrewMember, type MetricKey } from "@/lib/crew";
import { reactionFindings } from "@/lib/reaction";
import type { SourceId } from "@/lib/tips";

export type Field =
  | { id: string; label: string; kind: "number"; unit: string; min: number; max: number; step: number; metric?: MetricKey; optional?: boolean; hint?: string; filledByTest?: boolean }
  | { id: string; label: string; kind: "yesno" }
  | { id: string; label: string; kind: "scale"; low: string; high: string };

export type Checkup = {
  id: string;
  title: string;
  summary: string;
  /** Suggested interval in days. NASA requires periodic monitoring but doesn't set intervals; these are AstroMed defaults. */
  everyDays: number;
  steps: string[];
  fields: Field[];
  /** Why this check exists, with the NASA page it comes from. */
  why: { text: string; source: SourceId; page: number }[];
  /** An interactive tool shown with the steps: the reaction-time test fills the form, the Amsler grid is a visual aid. */
  widget?: "reaction" | "amsler";
  /** Every field is optional, but at least one must be filled. */
  atLeastOne?: boolean;
  /** Short label for where this check sits among NASA's five hazards. */
  hazard?: string;
};

export const CHECKUPS: Checkup[] = [
  {
    id: "vitals",
    title: "Vital signs",
    summary: "Resting heart rate, blood pressure and temperature.",
    everyDays: 1,
    steps: [
      "Do this at the same time each day, before exercise or caffeine.",
      "Sit (or, in microgravity, stay restrained in place) quietly for 5 minutes.",
      "Put the blood pressure cuff on your bare upper arm, at heart level, with the arm supported.",
      "Take the blood pressure reading without talking or moving. Note your pulse from the monitor.",
      "Take your temperature with the thermometer under your tongue, mouth closed, until it beeps.",
      "If you have a pulse oximeter, clip it on a warm finger (no nail polish), keep still for 30 seconds and note the SpO₂ percentage.",
      "If you have a glucose meter and haven't eaten for 8 hours, you can add a fasting blood glucose reading.",
      "Enter the readings below.",
    ],
    fields: [
      { id: "restingHr", label: "Resting heart rate", kind: "number", unit: "bpm", min: 25, max: 220, step: 1, metric: "restingHr" },
      { id: "systolic", label: "Blood pressure, systolic (top number)", kind: "number", unit: "mmHg", min: 60, max: 260, step: 1, metric: "systolic" },
      { id: "diastolic", label: "Blood pressure, diastolic (bottom number)", kind: "number", unit: "mmHg", min: 30, max: 160, step: 1, metric: "diastolic" },
      { id: "temperature", label: "Temperature", kind: "number", unit: "°C", min: 33, max: 43, step: 0.1, metric: "temperature" },
      { id: "spo2", label: "Oxygen saturation, SpO₂ (optional)", kind: "number", unit: "%", min: 50, max: 100, step: 1, metric: "spo2", optional: true },
      { id: "glucose", label: "Blood glucose, fasting (optional)", kind: "number", unit: "mg/dL", min: 20, max: 600, step: 1, metric: "glucose", optional: true },
    ],
    why: [{ text: "NASA requires in-mission capability for assessing, recording, monitoring and trending vital signs.", source: "std1", page: 21 }],
  },
  {
    id: "sleep",
    title: "Sleep and alertness",
    summary: "Last night's sleep, and anything that got in the way.",
    everyDays: 1,
    steps: [
      "Fill this in within an hour of waking.",
      "Estimate how long you actually slept, not how long you were in your sleep station.",
      "Note whether work ran into your rest time, and whether you took sleep or alertness medicine.",
    ],
    fields: [
      { id: "sleepHours", label: "Hours slept", kind: "number", unit: "h", min: 0, max: 16, step: 0.25, metric: "sleepHours" },
      { id: "quality", label: "How well did you sleep?", kind: "scale", low: "Very badly", high: "Very well" },
      { id: "workCreep", label: "Did work run into your rest time?", kind: "yesno" },
      { id: "medication", label: "Did you take sleep or alertness medicine?", kind: "yesno" },
    ],
    why: [
      { text: "NASA requires monitoring of work/rest schedules and sleep.", source: "std1", page: 20 },
      { text: "Schedule shifts and work running into off-duty time hurt astronauts' sleep.", source: "sleep", page: 16 },
    ],
  },
  {
    id: "exercise",
    title: "Exercise session",
    summary: "Resistance and aerobic exercise done today.",
    everyDays: 1,
    steps: [
      "Fill this in after your last exercise session of the day.",
      "Count resistance training (weights or resistive device) and aerobic exercise (treadmill, bike) separately.",
      "Note any pain or injury during the session.",
    ],
    fields: [
      { id: "resistiveMin", label: "Resistance exercise", kind: "number", unit: "min", min: 0, max: 240, step: 5 },
      { id: "aerobicMin", label: "Aerobic exercise", kind: "number", unit: "min", min: 0, max: 240, step: 5 },
      { id: "pain", label: "Any pain or injury during exercise?", kind: "yesno" },
    ],
    why: [
      { text: "NASA requires maintaining and periodically monitoring aerobic and strength fitness.", source: "std1", page: 20 },
      { text: "Resistive exercise reduces bone loss, which runs at 1–1.5% a month in microgravity.", source: "bone", page: 42 },
      { text: "Exercise prevents cardiovascular deconditioning in flight.", source: "cardio", page: 87 },
    ],
  },
  {
    id: "mood",
    title: "Mood and team check-in",
    summary: "How you're feeling, stress, and how the crew is getting on.",
    everyDays: 7,
    steps: [
      "Find a private moment. Your answers are only for you and your flight surgeon.",
      "Think about the past week as a whole, not just today.",
      "Answer honestly. Asking for a private conference is routine, not a sign of failure.",
    ],
    fields: [
      { id: "mood", label: "Overall mood this week", kind: "scale", low: "Very low", high: "Very good" },
      { id: "stress", label: "Stress this week", kind: "scale", low: "Very low", high: "Very high" },
      { id: "conflict", label: "Any unresolved conflict with a crewmate?", kind: "yesno" },
      { id: "wantsConference", label: "Would you like a private conference?", kind: "yesno" },
    ],
    why: [
      { text: "NASA requires periodic monitoring of psychosocial countermeasures for team cohesion, privacy and isolation.", source: "std1", page: 20 },
      { text: "With communication delays, crews will need to monitor their own behavioral health and act on it.", source: "behavioral", page: 55 },
    ],
  },
  {
    id: "vision",
    title: "Vision check",
    summary: "Amsler grid and near-vision card, for eye changes linked to spaceflight (SANS).",
    everyDays: 7,
    widget: "amsler",
    hazard: "Altered gravity",
    steps: [
      "Wear your usual reading glasses. Hold this screen at reading distance (about 35 cm) in good light.",
      "Amsler grid: cover your left eye and look only at the centre dot of the grid below. Without looking away, notice whether any lines look wavy, bent, blurred or missing. Tap those squares to mark them.",
      "Switch to the other eye and repeat.",
      "Near-vision card: cover one eye and read the smallest line you can on the onboard card, then the other eye. Compare with last week: is anything blurrier, or do you need the card further away?",
      "Note any headaches.",
    ],
    fields: [
      { id: "amslerLeft", label: "Left eye: did any grid lines look wavy, bent, blurred or missing?", kind: "yesno" },
      { id: "amslerRight", label: "Right eye: did any grid lines look wavy, bent, blurred or missing?", kind: "yesno" },
      { id: "blurred", label: "Is near or far vision blurrier than before?", kind: "yesno" },
      { id: "oneEye", label: "Is the change worse in one eye?", kind: "yesno" },
      { id: "headache", label: "New or frequent headaches?", kind: "yesno" },
    ],
    why: [
      { text: "NASA requires periodic monitoring for Spaceflight Associated Neuro-Ocular Syndrome (SANS).", source: "std1", page: 20 },
      { text: "Crews carry glasses with stronger lenses because SANS can change eyesight in flight.", source: "std1", page: 21 },
    ],
  },
  {
    id: "reaction",
    title: "Reaction-time test",
    summary: "A 3-minute alertness test: tap as soon as the light appears.",
    everyDays: 1,
    widget: "reaction",
    hazard: "Isolation and confinement",
    steps: [
      "Find 3 minutes without interruptions. Do it at a similar time each day, ideally after waking or before a demanding task.",
      "Press Start. Whenever the target lights up and starts counting, tap it (or press the space bar) as fast as you can.",
      "Don't tap early: wait for the light. Taps before it appears count as false starts.",
      "The test ends by itself after 3 minutes and fills in your results. Then press Save and check.",
    ],
    fields: [
      { id: "rtMedianMs", label: "Median reaction time", kind: "number", unit: "ms", min: 100, max: 5000, step: 1, filledByTest: true },
      { id: "rtLapses", label: "Lapses (slower than 355 ms)", kind: "number", unit: "", min: 0, max: 200, step: 1, filledByTest: true },
      { id: "rtFalseStarts", label: "False starts", kind: "number", unit: "", min: 0, max: 200, step: 1, filledByTest: true },
      { id: "rtTrials", label: "Responses", kind: "number", unit: "", min: 5, max: 300, step: 1, filledByTest: true },
    ],
    why: [
      { text: "NASA requires crew cognitive status to be assessed and monitored through all mission phases.", source: "std1", page: 35 },
      { text: "The psychomotor vigilance task is the main way to measure the effect of sleep loss; this 3-minute version (PVT-B) was developed for operational settings such as spaceflight.", source: "sleep", page: 25 },
      { text: "ISS astronauts who slept under 6 hours did worse on this test and reported more stress and workload.", source: "behavioral", page: 43 },
    ],
  },
  {
    id: "cabin",
    title: "Cabin air and noise",
    summary: "CO₂, temperature, humidity and noise where you live and work.",
    everyDays: 1,
    atLeastOne: true,
    hazard: "Hostile closed environment",
    steps: [
      "Read the values from your module's environment display or a portable monitor, where you spend most of your time (sleep station, workstation).",
      "Enter whichever readings you have. You can leave the rest blank.",
      "If the CO₂ reading is high, also check the area near you: CO₂ can pool around your head where air flow is poor, especially in a sleep station.",
    ],
    fields: [
      { id: "co2Mmhg", label: "Carbon dioxide (ppCO₂)", kind: "number", unit: "mmHg", min: 0, max: 30, step: 0.1, optional: true, hint: "If your monitor shows ppm: at sea-level cabin pressure, 1 mmHg is about 1,300 ppm." },
      { id: "cabinTempC", label: "Cabin temperature", kind: "number", unit: "°C", min: 0, max: 50, step: 0.5, optional: true },
      { id: "humidityPct", label: "Relative humidity", kind: "number", unit: "%", min: 0, max: 100, step: 1, optional: true },
      { id: "noiseDba", label: "Noise level", kind: "number", unit: "dBA", min: 20, max: 140, step: 1, optional: true },
    ],
    why: [
      { text: "NASA limits the one-hour average CO₂ in the habitat to no more than 3 mmHg.", source: "std2", page: 51 },
      { text: "Cabin temperature and humidity must stay within 18–27 °C and 25–75% humidity for crew health; 20–25 °C and 30–60% support comfort and performance.", source: "std2", page: 54 },
      { text: "Sound above 85 dBA is hazardous, and noise exposure above about 70 dBA over 24 hours increases the risk of hearing loss.", source: "std2", page: 94 },
    ],
  },
];

export function getCheckup(id: string) {
  return CHECKUPS.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// When to contact the flight surgeon
// ---------------------------------------------------------------------------

export type Escalation = "none" | "routine" | "today" | "now";
export const ESCALATION_RANK: Record<Escalation, number> = { none: 0, routine: 1, today: 2, now: 3 };

export const ESCALATION_TEXT: Record<Escalation, { title: string; body: string }> = {
  now: { title: "Contact the flight surgeon now", body: "Use the emergency or next available channel. Don't wait for a scheduled conference." },
  today: { title: "Contact the flight surgeon today", body: "Send a message or request a call within the day." },
  routine: { title: "Raise it at your next private conference", body: "Not urgent, but worth discussing. Keep tracking it." },
  none: { title: "No action needed", body: "Everything is within the expected range. Keep up the routine." },
};

export type Answers = Record<string, number | boolean | string>;
export type Finding = { level: Escalation; text: string };

/**
 * Absolute limits are general clinical thresholds chosen for this demo, not from the NASA
 * documents. A real program's flight surgeons would set their own.
 */
export function evaluate(checkup: Checkup, member: CrewMember, a: Answers, context?: { priorReaction?: number[] }): { level: Escalation; findings: Finding[] } {
  const f: Finding[] = [];
  const num = (k: string) => (typeof a[k] === "number" ? (a[k] as number) : undefined);
  const yes = (k: string) => a[k] === true;

  // Compare readings with this person's own normal range.
  for (const field of checkup.fields) {
    if (field.kind !== "number" || !field.metric) continue;
    const v = num(field.id);
    if (v === undefined) continue;
    const def = getMetric(field.metric);
    const [lo, hi] = normalRange(def, member);
    const sd = (hi - lo) / 4;
    const base = (hi + lo) / 2;
    const off = def.worseWhen === "higher" ? (v - base) / sd : (base - v) / sd;
    // Personal-range differences alone are worth discussing, not urgent; the absolute limits below set urgency.
    if (off >= 3) f.push({ level: "routine", text: `${def.label} of ${v} ${def.unit} is far outside your usual range (${lo.toFixed(def.decimals)}–${hi.toFixed(def.decimals)}).` });
    else if (off >= 2) f.push({ level: "none", text: `${def.label} of ${v} ${def.unit} is a little outside your usual range (${lo.toFixed(def.decimals)}–${hi.toFixed(def.decimals)}). Keep an eye on it.` });
  }

  const hr = num("restingHr"), sys = num("systolic"), dia = num("diastolic"), temp = num("temperature");
  if (temp !== undefined) {
    if (temp >= 39) f.push({ level: "now", text: `High fever (${temp} °C).` });
    else if (temp >= 38) f.push({ level: "today", text: `Fever (${temp} °C).` });
    else if (temp < 35) f.push({ level: "now", text: `Low body temperature (${temp} °C).` });
  }
  if (sys !== undefined && dia !== undefined) {
    if (sys >= 180 || dia >= 120) f.push({ level: "now", text: `Very high blood pressure (${sys}/${dia} mmHg).` });
    else if (sys >= 140 || dia >= 90) f.push({ level: "today", text: `High blood pressure (${sys}/${dia} mmHg).` });
    if (sys < 90) f.push({ level: "today", text: `Low blood pressure (${sys}/${dia} mmHg). If you feel faint or dizzy, contact now.` });
  }
  if (hr !== undefined) {
    if (hr > 120 || hr < 40) f.push({ level: "now", text: `Resting heart rate of ${hr} bpm is outside safe limits.` });
    else if (hr > 100) f.push({ level: "today", text: `Fast resting heart rate (${hr} bpm).` });
  }

  const spo2 = num("spo2");
  if (spo2 !== undefined) {
    if (spo2 < 90) f.push({ level: "now", text: `Low oxygen saturation (${spo2}%). Check the cabin air and your oximeter reading again; if you're short of breath, confused or have blue lips, this is an emergency.` });
    else if (spo2 < 94) f.push({ level: "today", text: `Oxygen saturation of ${spo2}% is below the usual 95–100%. Re-measure at rest on a warm finger; if it stays low or you feel breathless, dizzy or have a headache, it can be a sign of hypoxia.` });
  }

  const glucose = num("glucose");
  if (glucose !== undefined) {
    if (glucose < 54) f.push({ level: "now", text: `Very low blood glucose (${glucose} mg/dL).` });
    else if (glucose < 70) f.push({ level: "today", text: `Low blood glucose (${glucose} mg/dL).` });
    else if (glucose >= 200) f.push({ level: "today", text: `Very high blood glucose (${glucose} mg/dL).` });
    else if (glucose >= 126) f.push({ level: "routine", text: `High fasting blood glucose (${glucose} mg/dL).` });
  }

  const sleepH = num("sleepHours");
  if (sleepH !== undefined && sleepH < 4) f.push({ level: "routine", text: `Very short sleep (${sleepH} h). If this repeats, contact the flight surgeon.` });
  if (num("quality") === 1) f.push({ level: "routine", text: "Very poor sleep quality." });
  if (yes("workCreep")) f.push({ level: "routine", text: "Work ran into rest time. Flag it to mission planners as well." });

  const resist = num("resistiveMin"), aero = num("aerobicMin");
  if (resist === 0 && aero === 0) f.push({ level: "routine", text: "No exercise today. Missing sessions speeds bone and heart deconditioning." });
  if (yes("pain")) f.push({ level: "today", text: "Pain or injury during exercise." });

  if (num("mood") === 1 || num("stress") === 5) f.push({ level: "today", text: "Very low mood or very high stress this week." });
  else if ((num("mood") ?? 5) <= 2 || (num("stress") ?? 1) >= 4) f.push({ level: "routine", text: "Low mood or high stress this week." });
  if (yes("wantsConference")) f.push({ level: "routine", text: "You asked for a private conference. It will be scheduled." });
  if (yes("conflict")) f.push({ level: "routine", text: "Unresolved crew conflict." });

  const eyes = [yes("amslerLeft") && "left", yes("amslerRight") && "right"].filter(Boolean);
  if (eyes.length) f.push({ level: "today", text: `Wavy, bent or missing grid lines in your ${eyes.join(" and ")} eye. New distortion can be an early sign of eye changes from spaceflight (SANS) and needs an eye check today.` });

  const co2 = num("co2Mmhg");
  if (co2 !== undefined) {
    if (co2 > 3) f.push({ level: "today", text: `CO₂ of ${co2} mmHg is above NASA's 3 mmHg one-hour limit. Tell the crew and mission control, check the ventilation near you, and move to a better-ventilated area. High CO₂ can cause headaches, tiredness and poor concentration.` });
    else if (co2 > 2.5) f.push({ level: "none", text: `CO₂ of ${co2} mmHg is close to NASA's 3 mmHg limit. Some astronauts get headaches at these levels; keep air flowing around your sleep station.` });
  }
  const cabinT = num("cabinTempC");
  if (cabinT !== undefined && (cabinT < 18 || cabinT > 27)) f.push({ level: "routine", text: `Cabin temperature of ${cabinT} °C is outside NASA's 18–27 °C crew health range. Report it to mission control.` });
  const rh = num("humidityPct");
  if (rh !== undefined && (rh < 25 || rh > 75)) f.push({ level: "routine", text: `Humidity of ${rh}% is outside NASA's 25–75% range. ${rh < 25 ? "Dry air irritates eyes, nose and skin and builds static." : "Damp air encourages mould and bacteria."} Report it to mission control.` });
  const noise = num("noiseDba");
  if (noise !== undefined) {
    if (noise >= 85) f.push({ level: "today", text: `Noise of ${noise} dBA is at NASA's hazardous level (85 dBA). Wear hearing protection, report the source, and mention any ringing or muffled hearing to the flight surgeon.` });
    else if (noise > 70) f.push({ level: "none", text: `Noise of ${noise} dBA. If it is this loud all day, it's above the 24-hour exposure level NASA uses to protect hearing (about 70 dBA); use hearing protection when you can.` });
  }

  if (yes("blurred")) f.push({ level: "today", text: "Change in vision. This needs an eye check for SANS." });
  if (yes("oneEye")) f.push({ level: "today", text: "Vision change worse in one eye." });
  if (yes("headache")) f.push({ level: "routine", text: "New or frequent headaches." });

  if (checkup.id === "reaction") f.push(...reactionFindings(a, context?.priorReaction ?? []));

  const level = f.reduce<Escalation>((l, x) => (ESCALATION_RANK[x.level] > ESCALATION_RANK[l] ? x.level : l), "none");
  f.sort((x, y) => ESCALATION_RANK[y.level] - ESCALATION_RANK[x.level]);
  return { level, findings: f };
}

/** Read the form into typed answers; returns an error message for bad input. */
export function parseAnswers(checkup: Checkup, form: FormData): { answers: Answers } | { error: string } {
  const answers: Answers = {};
  for (const field of checkup.fields) {
    const raw = form.get(field.id);
    if (field.kind === "yesno") {
      if (raw !== "yes" && raw !== "no") return { error: `Answer: ${field.label}` };
      answers[field.id] = raw === "yes";
    } else if (field.kind === "scale") {
      const v = Number(raw);
      if (!Number.isInteger(v) || v < 1 || v > 5) return { error: `Choose 1–5 for: ${field.label}` };
      answers[field.id] = v;
    } else {
      if (field.optional && (raw === null || raw === "")) continue;
      const v = Number(raw);
      if (raw === null || raw === "" || !Number.isFinite(v) || v < field.min || v > field.max)
        return { error: `${field.label} must be between ${field.min} and ${field.max} ${field.unit}.` };
      answers[field.id] = v;
    }
  }
  if (checkup.atLeastOne && Object.keys(answers).length === 0) return { error: "Enter at least one reading." };
  return { answers };
}

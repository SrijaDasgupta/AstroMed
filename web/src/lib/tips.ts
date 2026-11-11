import type { MetricKey } from "@/lib/crew";
import type { EnvironmentId } from "@/lib/environments";

/** NASA documents the tips are drawn from (copies in data/raw/nasa). Page numbers are PDF pages. */
export const SOURCES = {
  sleep: {
    short: "Sleep evidence report",
    title: "Evidence Report: Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload (NASA HRP, 2016)",
    url: "https://humanresearchroadmap.nasa.gov/Evidence/reports/Sleep.pdf",
  },
  cardio: {
    short: "Cardiovascular evidence report",
    title: "Evidence Report: Risk of Cardiovascular Adaptations Contributing to Adverse Mission Performance and Health Outcomes (NASA HRP, approved Dec 2022)",
    url: "https://humanresearchroadmap.nasa.gov/Evidence/reports/Cardio%20Risk%20EB%202022%20FINAL_4-3-2023.pdf",
  },
  behavioral: {
    short: "Behavioral health evidence report",
    title: "Evidence Report: Risk of Adverse Cognitive or Behavioral Changes and Psychiatric Disorders (NASA HRP, 2025)",
    url: "https://humanresearchroadmap.nasa.gov/Evidence/reports/HRP-ER-BMED-HFBP-20250210.pdf",
  },
  bone: {
    short: "Bone fracture evidence report",
    title: "Evidence Report: Risk of Bone Fracture due to Spaceflight-induced Changes to Bone (NASA HRP, 2024)",
    url: "https://humanresearchroadmap.nasa.gov/Evidence/reports/Bone%20Fracture%20Evidence%20Report_07-18-2024.pdf",
  },
  radiation: {
    short: "Radiation evidence report",
    title: "Evidence Report: Risk of Ionizing Radiation Carcinogenesis (NASA HRP, 2026)",
    url: "https://humanresearchroadmap.nasa.gov/Evidence/reports/HRP-ER-CANCER-SR-20260811.pdf",
  },
  std1: {
    short: "NASA-STD-3001 Vol. 1",
    title: "NASA-STD-3001 Volume 1, Revision C: Crew Health (2023)",
    url: "https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf",
  },
  std2: {
    short: "NASA-STD-3001 Vol. 2",
    title: "NASA-STD-3001 Volume 2, Revision F: Human Factors, Habitability, and Environmental Health (2026)",
    url: "https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf",
  },
  pharma: {
    short: "Pharmaceutical care brief",
    title: "Pharmaceutical Care, OCHMO-MTB-012 Rev B, NASA-STD-3001 Medical Technical Brief (2026)",
    url: "https://www.nasa.gov/wp-content/uploads/2026/01/ochmo-mtb-012-pharmaceutical-care.pdf",
  },
} as const;

export type SourceId = keyof typeof SOURCES;

export type Topic = "Sleep" | "Heart" | "Behavioral health" | "Bone" | "Radiation" | "Medicine";
export const TOPICS: Topic[] = ["Sleep", "Heart", "Behavioral health", "Bone", "Radiation", "Medicine"];

export type Tip = {
  id: string;
  topic: Topic;
  title: string;
  /** What to do, in plain words. */
  action: string;
  /** What the NASA document says, paraphrased. */
  evidence: string;
  source: SourceId;
  page: number;
  /** Alerts on these measures bring this tip up on a crew member's page. */
  metrics: MetricKey[];
  environments: EnvironmentId[] | "all";
};

const SPACE: EnvironmentId[] = ["leo", "lunar-surface", "mars-transit", "mars-surface"];
const BEYOND_LEO: EnvironmentId[] = ["lunar-surface", "mars-transit", "mars-surface"];
const MARS: EnvironmentId[] = ["mars-transit", "mars-surface"];

export const TIPS: Tip[] = [
  {
    id: "protect-sleep-period",
    topic: "Sleep",
    title: "Expect shorter sleep in space and protect the sleep period",
    action: "Treat scheduled sleep as protected time, and compare each person's sleep with their own normal rather than with Earth norms.",
    evidence: "Across seven studies of 177 astronauts, crews slept about six hours a night in space, whatever the mission. That is less than sleep experts recommend.",
    source: "sleep", page: 11,
    metrics: ["sleepHours"], environments: SPACE,
  },
  {
    id: "avoid-slam-shifts",
    topic: "Sleep",
    title: "Watch for sudden schedule shifts and work creeping into rest time",
    action: "When a crew member's sleep drops, check for recent schedule changes or tasks that ran into their off-duty time.",
    evidence: "Astronauts named night operations, sudden schedule shifts (\"slam shifts\") and \"schedule creep\" of work into off-duty time as factors that hurt their sleep.",
    source: "sleep", page: 16,
    metrics: ["sleepHours", "sleepEfficiency"], environments: "all",
  },
  {
    id: "sleep-environment",
    topic: "Sleep",
    title: "Give each person control over their sleep space",
    action: "Make sure ear plugs, eye masks and light blockers are on hand, and let each person adjust their own light, noise and temperature.",
    evidence: "NASA's habitability standard requires sleep quarters with control of vibration, lighting, noise and temperature, plus privacy. It notes that preferences differ, so each person needs individual control.",
    source: "std2", page: 134,
    metrics: ["sleepEfficiency", "sleepHours"], environments: "all",
  },
  {
    id: "lighting-circadian",
    topic: "Sleep",
    title: "Use lighting to keep the body clock on schedule",
    action: "Use the habitat's adjustable lighting to signal day and night, especially around schedule changes.",
    evidence: "NASA deployed solid-state lighting on the ISS to help keep the body clock aligned, to shift sleep timing and to boost alertness during critical operations.",
    source: "sleep", page: 6,
    metrics: ["sleepEfficiency"], environments: "all",
  },
  {
    id: "stimulant-timing",
    topic: "Sleep",
    title: "Be careful with stimulants when sleep is already poor",
    action: "If sleep efficiency is dropping, review caffeine and other wake-promoting medicine use, especially later in the day.",
    evidence: "In one survey, 75% of astronauts reported using alertness medicines in flight, and those who used caffeine pills or modafinil also reported more trouble falling asleep.",
    source: "sleep", page: 23,
    metrics: ["sleepEfficiency", "sleepHours"], environments: "all",
  },
  {
    id: "sleep-medication-oversight",
    topic: "Sleep",
    title: "Sleep medication is common but needs medical oversight",
    action: "Sleep aids should be discussed with the flight surgeon rather than used to quietly cover a growing problem.",
    evidence: "Sleep medication is the most common sleep countermeasure on the ISS, but how well these countermeasures work in flight is still unknown.",
    source: "sleep", page: 5,
    metrics: ["sleepHours"], environments: SPACE,
  },
  {
    id: "combine-signals",
    topic: "Behavioral health",
    title: "Read heart rate, heart rate variability and sleep together",
    action: "A change in one measure can be noise. Several measures moving the wrong way together, as AstroMed shows, deserves a closer look.",
    evidence: "NASA's behavioral health work combines heart rate, heart rate variability and sleep-wake patterns into one view of well-being tracked over time.",
    source: "behavioral", page: 91,
    metrics: ["hrv", "restingHr", "sleepHours", "moodPositive", "moodNegative", "temperature"], environments: "all",
  },
  {
    id: "private-conference",
    topic: "Behavioral health",
    title: "Use private medical and psychological check-ins",
    action: "If a crew member's measures stay outside their normal range, schedule a private conference with the flight surgeon or psychologist.",
    evidence: "On the ISS, private psychological conferences and crew care packages help keep crew members well and let problems be spotted early. The same conferences can be used for treatment.",
    source: "behavioral", page: 11,
    metrics: ["hrv", "restingHr", "moodPositive", "moodNegative"], environments: ["earth-analog", "leo", "lunar-surface"],
  },
  {
    id: "self-monitoring-delay",
    topic: "Behavioral health",
    title: "With long signal delays, the crew must spot and act on problems themselves",
    action: "On Mars missions, agree in advance which warning signs trigger which response, so the crew can act without waiting for Earth.",
    evidence: "Communication delays will mean crews have to watch their own key health indicators and start countermeasures on their own, without real-time help from the ground.",
    source: "behavioral", page: 55,
    metrics: ["hrv", "restingHr", "sleepHours", "moodPositive", "moodNegative", "temperature"], environments: MARS,
  },
  {
    id: "contact-home",
    topic: "Behavioral health",
    title: "Keep contact with home, adapted to the delay",
    action: "Plan recorded messages and other delay-friendly ways to stay in touch with family and friends.",
    evidence: "ISS crews value real-time calls home, but lunar and Mars communication delays will change how these family conferences work.",
    source: "behavioral", page: 61,
    metrics: ["moodPositive", "moodNegative"], environments: MARS,
  },
  {
    id: "exercise-heart",
    topic: "Heart",
    title: "Keep up daily exercise to protect the heart",
    action: "A rising resting heart rate can be a sign of deconditioning. Check that exercise sessions are happening as planned.",
    evidence: "Exercise prevents cardiovascular deconditioning in flight, but on its own it does not prevent dizziness and fainting on return to gravity.",
    source: "cardio", page: 87,
    metrics: ["restingHr"], environments: SPACE,
  },
  {
    id: "landing-orthostatic",
    topic: "Heart",
    title: "Prepare for dizziness when gravity returns",
    action: "Before landing, combine exercise with fluid loading. Have help ready for the first time crew members stand up.",
    evidence: "Dizziness or fainting on standing after spaceflight (orthostatic intolerance) is well documented. Fluid loading at the end of a mission helped Shuttle astronauts, and exercise alone does not prevent it.",
    source: "cardio", page: 87,
    metrics: [], environments: ["leo", "mars-transit", "mars-surface", "lunar-surface"],
  },
  {
    id: "bp-lower-in-flight",
    topic: "Heart",
    title: "Blood pressure usually runs lower in microgravity",
    action: "Judge blood pressure against the person's own in-flight normal. A rise above it in microgravity goes against the usual pattern and is worth a check.",
    evidence: "On Space Shuttle missions, heart rate and both systolic and diastolic blood pressure were lower in flight than before launch. They rose past preflight levels during re-entry, and blood pressure dropped when crew stood up after landing.",
    source: "cardio", page: 23,
    metrics: ["systolic", "diastolic"], environments: ["leo", "mars-transit"],
  },
  {
    id: "sleep-and-bp",
    topic: "Heart",
    title: "Short sleep and blood pressure are linked",
    action: "When blood pressure and sleep are both off, address sleep first. It is one of the few things the crew can change themselves.",
    evidence: "Studies on Earth report that sleeping less than six hours a night significantly raises the chance of developing high blood pressure and metabolic syndrome later.",
    source: "cardio", page: 39,
    metrics: ["systolic", "diastolic", "sleepHours"], environments: "all",
  },
  {
    id: "glucose-insulin",
    topic: "Heart",
    title: "Normal blood sugar doesn't rule out insulin resistance",
    action: "Keep tracking glucose, but don't treat a normal reading as the full metabolic picture on long missions.",
    evidence: "After long-duration flights, blood glucose was unchanged, but insulin was about 50% higher and a measure of insulin resistance (HOMA-IR) was almost 60% higher.",
    source: "cardio", page: 40,
    metrics: ["glucose"], environments: SPACE,
  },
  {
    id: "temperature-regulation",
    topic: "Heart",
    title: "Watch body temperature, especially before landing",
    action: "Treat a rise above the person's normal as a possible infection first. Before landing or a spacewalk, also think about heat load from suits.",
    evidence: "The body's temperature control at rest and during exercise is impaired after six months in space, even with exercise. A raised core temperature may make dizziness on standing more likely on landing.",
    source: "cardio", page: 84,
    metrics: ["temperature"], environments: "all",
  },
  {
    id: "resistive-exercise-bone",
    topic: "Bone",
    title: "Resistive exercise slows bone loss",
    action: "Keep up resistance training throughout the mission. Bone loss isn't visible in daily measures, so the schedule itself is what to track.",
    evidence: "Astronauts lose about 1–1.5% of their weight-bearing bone density (hip, spine, legs) per month in flight. Resistive exercise can reduce the loss.",
    source: "bone", page: 42,
    metrics: [], environments: SPACE,
  },
  {
    id: "career-limit",
    topic: "Radiation",
    title: "Track total radiation against the career limit",
    action: "Add each mission's dose to the crew member's lifetime total. AstroMed shows the dose for the current mission.",
    evidence: "A crew member's total career radiation dose from spaceflight must stay below 600 mSv, the same limit for all ages and sexes.",
    source: "std1", page: 40,
    metrics: [], environments: SPACE,
  },
  {
    id: "solar-storm-shelter",
    topic: "Radiation",
    title: "Shelter during solar storms and cut spacewalks short",
    action: "When monitoring shows a solar particle event, move the crew to the most shielded area and end spacewalks early.",
    evidence: "Most solar storms are made up of low-energy protons, so local polyethylene shielding inside a lightly shielded vehicle or habitat can bring most recorded events below 100 mSv.",
    source: "radiation", page: 48,
    metrics: [], environments: BEYOND_LEO,
  },
  {
    id: "mars-exceeds-limit",
    topic: "Radiation",
    title: "A Mars mission is expected to exceed today's limit",
    action: "Plan Mars crews and their missions with the expected dose in mind from the start.",
    evidence: "NASA estimates about 1,413 mSv for a 730–1,224-day Mars mission, which exceeds the 600 mSv career limit.",
    source: "radiation", page: 54,
    metrics: [], environments: MARS,
  },
  {
    id: "medicine-shelf-life",
    topic: "Medicine",
    title: "Plan for medicines outlasting their expiry dates",
    action: "For long missions, choose medicines known to stay stable, and track expiry dates in the onboard kit.",
    evidence: "Missions of 1–5 years will outlast typical medicine expiry dates of 1–2 years. Some medicines degraded less than 5–10% after 550 days on the ISS.",
    source: "pharma", page: 3,
    metrics: [], environments: MARS,
  },
];

export function tipsForEnvironment(env: EnvironmentId) {
  return TIPS.filter((t) => t.environments === "all" || t.environments.includes(env));
}

/**
 * Tips for the measures that are out of range, for this mission. Each flagged measure, most
 * abnormal first, gets its most specific tip; any space left goes to broader tips.
 */
export function tipsForAlerts(flagged: { key: MetricKey; deviation: number }[], env: EnvironmentId, limit = 3) {
  const pool = tipsForEnvironment(env).filter((t) => t.metrics.length > 0);
  const chosen: Tip[] = [];
  for (const { key } of [...flagged].sort((a, b) => b.deviation - a.deviation)) {
    const best = pool
      .filter((t) => t.metrics.includes(key) && !chosen.includes(t))
      .sort((a, b) => a.metrics.length - b.metrics.length)[0];
    if (best && chosen.length < limit) chosen.push(best);
  }
  const keys = flagged.map((f) => f.key);
  const rest = pool
    .filter((t) => !chosen.includes(t))
    .map((t) => ({ t, score: t.metrics.filter((m) => keys.includes(m)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  for (const { t } of rest) if (chosen.length < limit) chosen.push(t);
  return chosen;
}

export function sourceLink(tip: Tip) {
  return `${SOURCES[tip.source].url}#page=${tip.page}`;
}

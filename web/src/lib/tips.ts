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
  hypoxia: {
    short: "NASA: Risk of Hypoxia",
    title: "Risk of Hypoxia, NASA Human Research Program",
    url: "https://www.nasa.gov/reference/risk-of-hypoxia/",
    web: true,
  },
  hrpRisks: {
    short: "NASA: Risks of Human Spaceflight",
    title: "Risks of Human Spaceflight, NASA Human Research Program",
    url: "https://www.nasa.gov/hrp/risks/",
    web: true,
  },
  csaRadiation: {
    short: "CSA: Monitoring radiation for astronaut health",
    title: "Monitoring radiation for astronaut health, Canadian Space Agency (2026)",
    url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    web: true,
  },
} as const;

export type SourceId = keyof typeof SOURCES;

export type Topic =
  | "Sleep and body clock"
  | "Heart and blood pressure"
  | "Metabolism and temperature"
  | "Bone and muscle"
  | "Gravity changes and landing"
  | "Mind, team and support"
  | "Radiation"
  | "Infection and hygiene"
  | "Spacewalks and pressure"
  | "Medicine";

export const TOPICS: { id: Topic; slug: string; blurb: string }[] = [
  { id: "Sleep and body clock", slug: "sleep", blurb: "Getting enough sleep, at the right time, in a good sleep space." },
  { id: "Heart and blood pressure", slug: "heart", blurb: "How the heart and circulation adapt, and how to keep them fit." },
  { id: "Metabolism and temperature", slug: "metabolism", blurb: "Food, blood sugar, insulin and body temperature in flight." },
  { id: "Bone and muscle", slug: "bone", blurb: "Slowing the bone and muscle loss that weightlessness causes." },
  { id: "Gravity changes and landing", slug: "landing", blurb: "Getting through the switch back to gravity." },
  { id: "Mind, team and support", slug: "mind", blurb: "Mood, stress, crew relations, and getting help." },
  { id: "Radiation", slug: "radiation", blurb: "Tracking dose and protecting yourself from solar storms." },
  { id: "Infection and hygiene", slug: "infection", blurb: "Lowering the chance of infection when immunity and microbes change in flight." },
  { id: "Spacewalks and pressure", slug: "eva", blurb: "Avoiding the bends and other pressure problems around spacewalks." },
  { id: "Medicine", slug: "medicine", blurb: "Planning the medical kit for long missions." },
];

export function topicBySlug(slug: string | undefined) {
  return TOPICS.find((t) => t.slug === slug);
}

export type Tip = {
  id: string;
  topic: Topic;
  title: string;
  /** What to do, in plain words. */
  action: string;
  /** A small thing a person can do today, for daily missions. Omitted for planning-level tips. */
  habit?: string;
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
    topic: "Sleep and body clock",
    title: "Expect shorter sleep in space and protect the sleep period",
    action: "Treat scheduled sleep as protected time, and compare each person's sleep with their own normal rather than with Earth norms.",
    habit: "Keep tonight's sleep period free of work.",
    evidence: "Across seven studies of 177 astronauts, crews slept about six hours a night in space, whatever the mission. That is less than sleep experts recommend.",
    source: "sleep", page: 11,
    metrics: ["sleepHours"], environments: SPACE,
  },
  {
    id: "avoid-slam-shifts",
    topic: "Sleep and body clock",
    title: "Watch for sudden schedule shifts and work creeping into rest time",
    action: "When a crew member's sleep drops, check for recent schedule changes or tasks that ran into their off-duty time.",
    habit: "Check tomorrow's schedule and flag any big shift in wake time.",
    evidence: "Astronauts named night operations, sudden schedule shifts (\"slam shifts\") and \"schedule creep\" of work into off-duty time as factors that hurt their sleep.",
    source: "sleep", page: 16,
    metrics: ["sleepHours", "sleepEfficiency"], environments: "all",
  },
  {
    id: "sleep-environment",
    topic: "Sleep and body clock",
    title: "Give each person control over their sleep space",
    action: "Make sure ear plugs, eye masks and light blockers are on hand, and let each person adjust their own light, noise and temperature.",
    habit: "Set up your eye mask, ear plugs and lights before bed.",
    evidence: "NASA's habitability standard requires sleep quarters with control of vibration, lighting, noise and temperature, plus privacy. It notes that preferences differ, so each person needs individual control.",
    source: "std2", page: 134,
    metrics: ["sleepEfficiency", "sleepHours"], environments: "all",
  },
  {
    id: "lighting-circadian",
    topic: "Sleep and body clock",
    title: "Use lighting to keep the body clock on schedule",
    action: "Use the habitat's adjustable lighting to signal day and night, especially around schedule changes.",
    habit: "Use bright light after waking and dim light in the hour before sleep.",
    evidence: "NASA deployed solid-state lighting on the ISS to help keep the body clock aligned, to shift sleep timing and to boost alertness during critical operations.",
    source: "sleep", page: 6,
    metrics: ["sleepEfficiency"], environments: "all",
  },
  {
    id: "stimulant-timing",
    topic: "Sleep and body clock",
    title: "Be careful with stimulants when sleep is already poor",
    action: "If sleep efficiency is dropping, review caffeine and other wake-promoting medicine use, especially later in the day.",
    habit: "No caffeine after mid-afternoon today.",
    evidence: "In one survey, 75% of astronauts reported using alertness medicines in flight, and those who used caffeine pills or modafinil also reported more trouble falling asleep.",
    source: "sleep", page: 23,
    metrics: ["sleepEfficiency", "sleepHours"], environments: "all",
  },
  {
    id: "sleep-medication-oversight",
    topic: "Sleep and body clock",
    title: "Sleep medication is common but needs medical oversight",
    action: "Sleep aids should be discussed with the flight surgeon rather than used to quietly cover a growing problem.",
    evidence: "Sleep medication is the most common sleep countermeasure on the ISS, but how well these countermeasures work in flight is still unknown.",
    source: "sleep", page: 5,
    metrics: ["sleepHours"], environments: SPACE,
  },
  {
    id: "combine-signals",
    topic: "Mind, team and support",
    title: "Read heart rate, heart rate variability and sleep together",
    action: "A change in one measure can be noise. Several measures moving the wrong way together, as AstroMed shows, deserves a closer look.",
    habit: "Look over your own trend charts for anything moving together.",
    evidence: "NASA's behavioral health work combines heart rate, heart rate variability and sleep-wake patterns into one view of well-being tracked over time.",
    source: "behavioral", page: 91,
    metrics: ["hrv", "restingHr", "sleepHours", "moodPositive", "moodNegative", "temperature"], environments: "all",
  },
  {
    id: "private-conference",
    topic: "Mind, team and support",
    title: "Use private medical and psychological check-ins",
    action: "If a crew member's measures stay outside their normal range, schedule a private conference with the flight surgeon or psychologist.",
    evidence: "On the ISS, private psychological conferences and crew care packages help keep crew members well and let problems be spotted early. The same conferences can be used for treatment.",
    source: "behavioral", page: 11,
    metrics: ["hrv", "restingHr", "moodPositive", "moodNegative"], environments: ["earth-analog", "leo", "lunar-surface"],
  },
  {
    id: "self-monitoring-delay",
    topic: "Mind, team and support",
    title: "With long signal delays, the crew must spot and act on problems themselves",
    action: "On Mars missions, agree in advance which warning signs trigger which response, so the crew can act without waiting for Earth.",
    habit: "Review your personal warning-signs plan.",
    evidence: "Communication delays will mean crews have to watch their own key health indicators and start countermeasures on their own, without real-time help from the ground.",
    source: "behavioral", page: 55,
    metrics: ["hrv", "restingHr", "sleepHours", "moodPositive", "moodNegative", "temperature"], environments: MARS,
  },
  {
    id: "contact-home",
    topic: "Mind, team and support",
    title: "Keep contact with home, adapted to the delay",
    action: "Plan recorded messages and other delay-friendly ways to stay in touch with family and friends.",
    habit: "Record or send a message home.",
    evidence: "ISS crews value real-time calls home, but lunar and Mars communication delays will change how these family conferences work.",
    source: "behavioral", page: 61,
    metrics: ["moodPositive", "moodNegative"], environments: MARS,
  },
  {
    id: "exercise-heart",
    topic: "Heart and blood pressure",
    title: "Keep up daily exercise to protect the heart",
    action: "A rising resting heart rate can be a sign of deconditioning. Check that exercise sessions are happening as planned.",
    habit: "Finish today's aerobic exercise session.",
    evidence: "Exercise prevents cardiovascular deconditioning in flight, but on its own it does not prevent dizziness and fainting on return to gravity.",
    source: "cardio", page: 87,
    metrics: ["restingHr"], environments: SPACE,
  },
  {
    id: "landing-orthostatic",
    topic: "Gravity changes and landing",
    title: "Prepare for dizziness when gravity returns",
    action: "Before landing, combine exercise with fluid loading. Have help ready for the first time crew members stand up.",
    evidence: "Dizziness or fainting on standing after spaceflight (orthostatic intolerance) is well documented. Fluid loading at the end of a mission helped Shuttle astronauts, and exercise alone does not prevent it.",
    source: "cardio", page: 87,
    metrics: [], environments: ["leo", "mars-transit", "mars-surface", "lunar-surface"],
  },
  {
    id: "bp-lower-in-flight",
    topic: "Heart and blood pressure",
    title: "Blood pressure usually runs lower in microgravity",
    action: "Judge blood pressure against the person's own in-flight normal. A rise above it in microgravity goes against the usual pattern and is worth a check.",
    habit: "Do your vital signs check.",
    evidence: "On Space Shuttle missions, heart rate and both systolic and diastolic blood pressure were lower in flight than before launch. They rose past preflight levels during re-entry, and blood pressure dropped when crew stood up after landing.",
    source: "cardio", page: 23,
    metrics: ["systolic", "diastolic"], environments: ["leo", "mars-transit"],
  },
  {
    id: "sleep-and-bp",
    topic: "Heart and blood pressure",
    title: "Short sleep and blood pressure are linked",
    action: "When blood pressure and sleep are both off, address sleep first. It is one of the few things the crew can change themselves.",
    habit: "Aim for more than 6 hours of sleep tonight.",
    evidence: "Studies on Earth report that sleeping less than six hours a night significantly raises the chance of developing high blood pressure and metabolic syndrome later.",
    source: "cardio", page: 39,
    metrics: ["systolic", "diastolic", "sleepHours"], environments: "all",
  },
  {
    id: "glucose-insulin",
    topic: "Metabolism and temperature",
    title: "Normal blood sugar doesn't rule out insulin resistance",
    action: "Keep tracking glucose, but don't treat a normal reading as the full metabolic picture on long missions.",
    evidence: "After long-duration flights, blood glucose was unchanged, but insulin was about 50% higher and a measure of insulin resistance (HOMA-IR) was almost 60% higher.",
    source: "cardio", page: 40,
    metrics: ["glucose"], environments: SPACE,
  },
  {
    id: "temperature-regulation",
    topic: "Metabolism and temperature",
    title: "Watch body temperature, especially before landing",
    action: "Treat a rise above the person's normal as a possible infection first. Before landing or a spacewalk, also think about heat load from suits.",
    habit: "Take your temperature as part of your vital signs check.",
    evidence: "The body's temperature control at rest and during exercise is impaired after six months in space, even with exercise. A raised core temperature may make dizziness on standing more likely on landing.",
    source: "cardio", page: 84,
    metrics: ["temperature"], environments: "all",
  },
  {
    id: "eat-to-need",
    topic: "Metabolism and temperature",
    title: "Eat to your calculated energy need",
    action: "Aim to eat your full daily energy need, worked out from your age, sex, weight and height. Appetite often drops in flight, so plan snacks rather than waiting to feel hungry.",
    habit: "Log roughly what you ate today in the daily log.",
    evidence: "NASA requires each crewmember to get 100% of their calculated nutrient and energy needs, based on age, sex, body mass, height and activity.",
    source: "std1", page: 37,
    metrics: [], environments: "all",
  },
  {
    id: "eva-food",
    topic: "Metabolism and temperature",
    title: "Eat more on spacewalk days",
    action: "Add about 200 kcal for each hour of spacewalk, with food similar to the rest of your diet.",
    evidence: "NASA's food system provides an extra 837 kJ (200 kcal) per EVA hour so crewmembers keep their lean body weight.",
    source: "std2", page: 116,
    metrics: [], environments: SPACE,
  },
  {
    id: "vitamin-d",
    topic: "Metabolism and temperature",
    title: "Vitamin D is set higher for spaceflight",
    action: "Eat the vitamin D foods planned in your menu, and ask your flight surgeon whether you need a supplement.",
    evidence: "NASA's nutrient guideline for spaceflight sets vitamin D at 25 µg a day in the diet.",
    source: "std2", page: 117,
    metrics: [], environments: SPACE,
  },
  {
    id: "resistive-exercise-bone",
    topic: "Bone and muscle",
    title: "Resistive exercise slows bone loss",
    action: "Keep up resistance training throughout the mission. Bone loss isn't visible in daily measures, so the schedule itself is what to track.",
    habit: "Do a resistance exercise session today.",
    evidence: "Astronauts lose about 1–1.5% of their weight-bearing bone density (hip, spine, legs) per month in flight. Resistive exercise can reduce the loss.",
    source: "bone", page: 42,
    metrics: [], environments: SPACE,
  },
  {
    id: "career-limit",
    topic: "Radiation",
    title: "Track total radiation against the career limit",
    action: "Add each mission's dose to the crew member's lifetime total. AstroMed shows the dose for the current mission.",
    habit: "Check your radiation total in the radiation calculator.",
    evidence: "A crew member's total career radiation dose from spaceflight must stay below 600 mSv, the same limit for all ages and sexes.",
    source: "std1", page: 40,
    metrics: [], environments: SPACE,
  },
  {
    id: "solar-storm-shelter",
    topic: "Radiation",
    title: "Shelter during solar storms and cut spacewalks short",
    action: "When monitoring shows a solar particle event, move the crew to the most shielded area and end spacewalks early.",
    habit: "Know the route to your most shielded area.",
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
    habit: "Check expiry dates on one section of the medical kit.",
    evidence: "Missions of 1–5 years will outlast typical medicine expiry dates of 1–2 years. Some medicines degraded less than 5–10% after 550 days on the ISS.",
    source: "pharma", page: 3,
    metrics: [], environments: MARS,
  },
  {
    id: "protect-immunity",
    topic: "Infection and hygiene",
    title: "Protect your immune system before and during flight",
    action: "Follow your flight medicine team's vaccination plan and the pre-launch health stabilization period, which limits contact with sick people before launch. In flight, eat your full rations: nutrition supports immune function.",
    habit: "Eat all of today's planned meals.",
    evidence: "NASA's preventive care includes vaccinations recommended by the flight medicine team, a pre-mission health stabilization program to reduce infections before launch, and monitoring nutrition to support immune function.",
    source: "std1", page: 19,
    metrics: [], environments: SPACE,
  },
  {
    id: "clean-shared-spaces",
    topic: "Infection and hygiene",
    title: "Keep hygiene and food areas clean to control microbes",
    action: "Clean and sanitize hygiene and food equipment as scheduled, contain food spills straight away, and keep your personal hygiene items to yourself.",
    habit: "Wipe down your hygiene area and gear.",
    evidence: "Cleaning and sanitizing hygiene equipment controls odor and microbial growth; containing food spills keeps the spacecraft and food system from being contaminated.",
    source: "std2", page: 122,
    metrics: [], environments: SPACE,
  },
  {
    id: "prebreathe",
    topic: "Spacewalks and pressure",
    title: "Never shorten the prebreathe before a spacewalk",
    action: "Complete the full oxygen prebreathe and pressure protocol before every spacewalk. Report joint pain, itching, tingling or rash after any pressure change straight away.",
    evidence: "NASA prevents pressure-related illness, such as decompression sickness, by using the appropriate prebreathe and equipment protocols.",
    source: "std1", page: 20,
    metrics: [], environments: SPACE,
  },
  {
    id: "landing-restraints",
    topic: "Gravity changes and landing",
    title: "Snug restraints and a well-fitted helmet for launch and landing",
    action: "Before launch, reentry and landing, tighten your seat restraints and check that your helmet fits closely. Stow loose items.",
    habit: "Check your seat restraint and helmet fit at the next suit check.",
    evidence: "During the STS-107 reentry, seat-belt reels that failed and helmets that didn't fit closely contributed to flail and head injuries, so vehicles must limit injury from dynamic loads.",
    source: "std2", page: 83,
    metrics: [], environments: SPACE,
  },
  {
    id: "know-your-cmo",
    topic: "Mind, team and support",
    title: "Know your crew medical officers and the medical kit",
    action: "Know which two crewmates are crew medical officers, where the medical kit and procedures are kept, and practise the first aid you were trained in. Far from Earth, the crew handles problems first.",
    habit: "Find the medical kit and one procedure you'd need in an emergency.",
    evidence: "Programs must train at least two crew members per vehicle as crew medical officers so a backup is always available, and crew medical training covers first aid, CPR, the medical kit, decompression sickness, CO₂ and toxic exposures.",
    source: "std1", page: 48,
    metrics: [], environments: SPACE,
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
  return pageHref(SOURCES[tip.source], tip.page);
}

type AnySource = (typeof SOURCES)[SourceId];
/** Link to a source: PDFs open at the page, web pages as they are. */
export const pageHref = (src: AnySource, page: number) => ("web" in src ? src.url : `${src.url}#page=${page}`);
/** "Short name, p. 12" for PDFs, just the short name for web pages. */
export const pageLabel = (src: AnySource, page: number) => ("web" in src ? src.short : `${src.short}, p. ${page}`);

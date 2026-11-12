/**
 * The Health indicators guide: for each indicator, the questions the challenge asks.
 * Which measurements can be performed in space? Why is an exam needed? How do spaceflight hazards
 * affect it? When does a result need the crew or the flight surgeon? What prevents a critical condition?
 *
 * "When" thresholds are the ones AstroMed actually uses (lib/checkups.ts, lib/daily-log.ts,
 * lib/summary.ts): general clinical limits chosen for this demo, plus each person's own normal range.
 * Every "why", "hazard" and "prevent" statement cites a NASA page.
 */
import type { Cite } from "@/lib/body";
import type { Escalation } from "@/lib/checkups";
import type { MetricKey } from "@/lib/crew";
import type { Hazard } from "@/lib/space-conditions";

export type Fact = { text: string; cite: Cite };
export type Indicator = {
  id: string;
  name: string;
  unit: string;
  /** Live value shown from the person's assessment, if this maps to a tracked metric. */
  metrics?: MetricKey[];
  measure: { how: string; steps: string[]; often: string };
  why: Fact[];
  hazards: { hazard: Hazard; effect: Fact }[];
  when: { level: Escalation; rule: string }[];
  prevent: Fact[];
  links: { text: string; href: string }[];
};

const PERSONAL = "Outside your own normal range (more than 2 day-to-day variations from your baseline) for several days";

export const INDICATORS: Indicator[] = [
  {
    id: "blood-pressure", name: "Blood pressure", unit: "mmHg", metrics: ["systolic", "diastolic"],
    measure: {
      how: "Automatic cuff on the upper arm.",
      steps: ["Same time each day, before exercise or caffeine.", "Rest 5 minutes; in microgravity stay restrained in place.", "Cuff on the bare upper arm at heart level, arm supported; don't talk or move."],
      often: "Daily, in the vital signs checkup or daily log.",
    },
    why: [{ text: "NASA requires in-mission capability for assessing, recording, monitoring and trending vital signs.", cite: { source: "std1", page: 21 } }],
    hazards: [
      { hazard: "gravity", effect: { text: "On Shuttle missions blood pressure was lower in flight than before launch, rose past preflight levels during re-entry, and dropped when crew stood up after landing.", cite: { source: "cardio", page: 23 } } },
      { hazard: "isolation", effect: { text: "Sleeping under six hours a night is linked on Earth to a higher chance of high blood pressure later.", cite: { source: "cardio", page: 39 } } },
    ],
    when: [
      { level: "now", rule: "180/120 mmHg or higher" },
      { level: "today", rule: "140/90 mmHg or higher, or systolic under 90 mmHg (contact now if you feel faint)" },
      { level: "routine", rule: PERSONAL },
    ],
    prevent: [
      { text: "Exercise prevents cardiovascular deconditioning in flight.", cite: { source: "cardio", page: 87 } },
      { text: "Before landing, fluid loading helped Shuttle astronauts avoid dizziness and fainting on standing.", cite: { source: "cardio", page: 87 } },
    ],
    links: [{ text: "Vital signs checkup", href: "/checkups/vitals" }, { text: "Blood pressure trend", href: "/vitals" }],
  },
  {
    id: "heart-rate", name: "Heart rate and heart rate variability", unit: "bpm, ms", metrics: ["restingHr", "hrv"],
    measure: {
      how: "Pulse from the blood pressure cuff or a wearable; heart rate variability from a wearable or chest strap.",
      steps: ["Measure at rest, at the same time each day.", "Import wearable data as a CSV in My records for continuous trends."],
      often: "Daily.",
    },
    why: [
      { text: "NASA requires in-mission capability for assessing, recording, monitoring and trending vital signs.", cite: { source: "std1", page: 21 } },
      { text: "NASA's behavioral health work combines heart rate, heart rate variability and sleep-wake patterns into one view of well-being over time.", cite: { source: "behavioral", page: 91 } },
    ],
    hazards: [
      { hazard: "gravity", effect: { text: "Heart rate was lower in flight than before launch on Shuttle missions.", cite: { source: "cardio", page: 23 } } },
      { hazard: "isolation", effect: { text: "Heart rate variability is used alongside sleep to track stress and well-being.", cite: { source: "behavioral", page: 91 } } },
    ],
    when: [
      { level: "now", rule: "Resting heart rate over 120 or under 40 bpm, or a racing heart with chest pain or fainting" },
      { level: "today", rule: "Resting heart rate over 100 bpm, or an irregular heartbeat" },
      { level: "routine", rule: PERSONAL },
    ],
    prevent: [{ text: "Exercise prevents cardiovascular deconditioning in flight.", cite: { source: "cardio", page: 87 } }],
    links: [{ text: "Vital signs checkup", href: "/checkups/vitals" }, { text: "Import wearable data", href: "/records" }],
  },
  {
    id: "glucose", name: "Blood sugar (fasting glucose)", unit: "mg/dL", metrics: ["glucose"],
    measure: {
      how: "Finger-prick glucose meter.",
      steps: ["After at least 8 hours without food, usually on waking.", "Wash and dry your hands; contain the blood drop so it doesn't float away."],
      often: "Weekly, or as your flight surgeon asks.",
    },
    why: [{ text: "Blood sugar alone can look normal while insulin resistance builds up, so it's tracked over time.", cite: { source: "cardio", page: 40 } }],
    hazards: [{ hazard: "gravity", effect: { text: "After long flights blood glucose was unchanged, but insulin was about 50% higher and insulin resistance almost 60% higher.", cite: { source: "cardio", page: 40 } } }],
    when: [
      { level: "now", rule: "Under 54 mg/dL" },
      { level: "today", rule: "Under 70 mg/dL, or 200 mg/dL and over" },
      { level: "routine", rule: "126 mg/dL and over when fasting, or outside your own normal range" },
    ],
    prevent: [{ text: "Eat to your calculated energy needs; NASA plans 100% of each crewmember's needs.", cite: { source: "std1", page: 37 } }],
    links: [{ text: "Vital signs checkup", href: "/checkups/vitals" }],
  },
  {
    id: "temperature", name: "Body temperature", unit: "°C", metrics: ["temperature"],
    measure: { how: "Oral thermometer.", steps: ["Under the tongue, mouth closed, until it beeps.", "Not within 15 minutes of eating, drinking or exercise."], often: "Daily, and whenever you feel unwell." },
    why: [
      { text: "NASA requires in-mission capability for assessing, recording, monitoring and trending vital signs.", cite: { source: "std1", page: 21 } },
      { text: "Infections such as respiratory infections are on NASA's list of conditions to plan for on spaceflight missions.", cite: { source: "std1", page: 84 } },
    ],
    hazards: [
      { hazard: "gravity", effect: { text: "Temperature control at rest and in exercise is impaired after six months in space, and a raised core temperature may make dizziness on landing more likely.", cite: { source: "cardio", page: 84 } } },
      { hazard: "environment", effect: { text: "Spacesuits and closed cabins add heat load; heat illness and hypothermia are on NASA's list of spaceflight conditions.", cite: { source: "std1", page: 83 } } },
    ],
    when: [
      { level: "now", rule: "39 °C or higher, or under 35 °C" },
      { level: "today", rule: "38 °C or higher" },
      { level: "routine", rule: PERSONAL },
    ],
    prevent: [{ text: "Treat a rise above your normal as a possible infection first; before landing or a spacewalk, think about suit heat load.", cite: { source: "cardio", page: 84 } }],
    links: [{ text: "Vital signs checkup", href: "/checkups/vitals" }],
  },
  {
    id: "sleep", name: "Sleep", unit: "hours", metrics: ["sleepHours"],
    measure: { how: "Self-report within an hour of waking; a wearable can add sleep timing.", steps: ["Count time actually asleep, not time in the sleep station.", "Note if work ran into rest time or you took sleep or alertness medicine."], often: "Daily." },
    why: [
      { text: "NASA requires monitoring of work/rest schedules and sleep.", cite: { source: "std1", page: 20 } },
      { text: "Schedule shifts and work running into off-duty time hurt astronauts' sleep.", cite: { source: "sleep", page: 16 } },
    ],
    hazards: [
      { hazard: "isolation", effect: { text: "Across 177 astronauts, crews slept about six hours a night in space, less than recommended.", cite: { source: "sleep", page: 11 } } },
      { hazard: "environment", effect: { text: "Sleep quarters need control of noise, light, vibration and temperature, and individual privacy.", cite: { source: "std2", page: 134 } } },
    ],
    when: [
      { level: "routine", rule: "Under 4 hours in a night, very poor quality, or work running into rest time" },
      { level: "routine", rule: "Under 6 hours on most nights in a week" },
    ],
    prevent: [
      { text: "Lighting can keep the body clock aligned and shift sleep timing.", cite: { source: "sleep", page: 6 } },
      { text: "Astronauts who used caffeine pills or modafinil reported more trouble falling asleep.", cite: { source: "sleep", page: 23 } },
    ],
    links: [{ text: "Sleep checkup", href: "/checkups/sleep" }, { text: "Sleep tool", href: "/tools#sleep" }],
  },
  {
    id: "mood", name: "Mood and stress", unit: "1–5 scales", metrics: ["moodPositive", "moodNegative"],
    measure: { how: "Self-rating, plus a private journal.", steps: ["Rate the past week as a whole, in a private moment.", "Note conflict with crew and whether you'd like a private conference."], often: "Daily in the log, weekly check-in." },
    why: [
      { text: "NASA requires periodic monitoring of psychosocial countermeasures for team cohesion, privacy and isolation.", cite: { source: "std1", page: 20 } },
      { text: "With communication delays, crews must monitor their own behavioral health and act on it.", cite: { source: "behavioral", page: 55 } },
    ],
    hazards: [
      { hazard: "isolation", effect: { text: "Monotony and confinement can lead to boredom, interpersonal conflict and loss of motivation.", cite: { source: "behavioral", page: 46 } } },
      { hazard: "distance", effect: { text: "Lunar and Mars communication delays change how calls home work.", cite: { source: "behavioral", page: 61 } } },
      { hazard: "radiation", effect: { text: "Radiation, isolation and altered gravity are expected to act together on the brain, cognition and behavior.", cite: { source: "behavioral", page: 10 } } },
    ],
    when: [
      { level: "now", rule: "Any thoughts of harming yourself" },
      { level: "today", rule: "Very low mood (1 of 5) or very high stress (5 of 5)" },
      { level: "routine", rule: "Low mood or high stress, unresolved crew conflict, or low mood several days in a row" },
    ],
    prevent: [
      { text: "Private psychological conferences and care packages help keep crews well and let problems be spotted early.", cite: { source: "behavioral", page: 11 } },
      { text: "Stress in spaceflight has been linked to immune changes, so acting on it early matters.", cite: { source: "behavioral", page: 31 } },
    ],
    links: [{ text: "Mood check-in", href: "/checkups/mood" }, { text: "Journal", href: "/journal" }],
  },
  {
    id: "nutrition", name: "Food energy and body weight", unit: "kcal, kg",
    measure: { how: "Estimate of food eaten; body mass measurement.", steps: ["Log a rough calorie estimate for the day and any spacewalk hours.", "Weigh at the same time of day, on the onboard body-mass device in microgravity."], often: "Food daily; weight weekly or as planned." },
    why: [{ text: "Nutritional status is assessed and monitored throughout the mission, and needs are calculated from age, sex, body mass, height and activity.", cite: { source: "std1", page: 37 } }],
    hazards: [
      { hazard: "environment", effect: { text: "Spacewalks raise energy use; NASA adds 200 kcal per EVA hour.", cite: { source: "std2", page: 116 } } },
      { hazard: "isolation", effect: { text: "Nutritional deficiency is on NASA's list of conditions to plan for in spaceflight.", cite: { source: "std1", page: 83 } } },
    ],
    when: [
      { level: "routine", rule: "Eating under 75% of your need on a day, or under 90% on average over several days" },
      { level: "routine", rule: "Weight down 2% or more over recent weigh-ins" },
    ],
    prevent: [
      { text: "NASA's energy target: its published equation with activity factor 1.25, or 3,035 kcal a day by default.", cite: { source: "std2", page: 116 } },
      { text: "Vitamin D is set at 25 µg a day in the spaceflight diet.", cite: { source: "std2", page: 117 } },
    ],
    links: [{ text: "Log food and weight", href: "/log" }, { text: "My profile (for your target)", href: "/profile" }],
  },
  {
    id: "water", name: "Water intake", unit: "litres a day",
    measure: { how: "Count drinks through the day.", steps: ["Add up drink bags or bottles; log the total in the daily log."], often: "Daily." },
    why: [{ text: "NASA's minimum is 2.5 litres of water per crewmember per day.", cite: { source: "std2", page: 68 } }],
    hazards: [{ hazard: "environment", effect: { text: "Under-hydration causes poor performance, nosebleeds, headache and poor sleep, and can lead to urinary infections or stones.", cite: { source: "std2", page: 66 } } }],
    when: [{ level: "none", rule: "Under 2.5 L in a day: drink more and set a water reminder" }],
    prevent: [{ text: "Drink more around spacewalks and exercise.", cite: { source: "std2", page: 66 } }],
    links: [{ text: "Add a water reminder", href: "/reminders" }],
  },
  {
    id: "vision", name: "Vision", unit: "near-vision card",
    measure: { how: "Onboard near-vision card; eye exams and imaging by the flight surgeon.", steps: ["Good light, usual reading distance.", "Cover each eye in turn and read the smallest line; compare with last week."], often: "Weekly." },
    why: [
      { text: "NASA requires periodic monitoring for Spaceflight Associated Neuro-ocular Syndrome (SANS).", cite: { source: "std1", page: 20 } },
      { text: "Crews carry glasses with stronger lenses because SANS can change eyesight in flight.", cite: { source: "std1", page: 21 } },
    ],
    hazards: [{ hazard: "gravity", effect: { text: "The headward fluid shift in weightlessness is thought to contribute to SANS.", cite: { source: "cardio", page: 95 } } }],
    when: [
      { level: "now", rule: "Sudden loss of vision, a curtain over your sight, or flashes of light" },
      { level: "today", rule: "Any blurring of near or far vision, especially in one eye" },
    ],
    prevent: [{ text: "Keep stronger in-flight glasses to hand and report changes early.", cite: { source: "std1", page: 21 } }],
    links: [{ text: "Vision check", href: "/checkups/vision" }],
  },
  {
    id: "fitness", name: "Exercise, bone and muscle", unit: "minutes a day",
    measure: { how: "Exercise log; bone density by scans before and after flight.", steps: ["Log resistance and aerobic minutes separately after your last session.", "Note any pain or injury."], often: "Daily." },
    why: [
      { text: "NASA requires maintaining and periodically monitoring aerobic and strength fitness.", cite: { source: "std1", page: 20 } },
      { text: "Resistive exercise can reduce weight-bearing bone loss, which daily vital signs can't show.", cite: { source: "bone", page: 42 } },
    ],
    hazards: [
      { hazard: "gravity", effect: { text: "Astronauts lose about 1–1.5% of hip and spine bone density per month in weightlessness.", cite: { source: "bone", page: 42 } } },
      { hazard: "gravity", effect: { text: "NASA's fitness standard assumes aerobic capacity drops about 15% on long flights.", cite: { source: "std1", page: 34 } } },
    ],
    when: [
      { level: "today", rule: "Pain or injury during exercise" },
      { level: "routine", rule: "No exercise on a day; exercise on fewer than 4 days in a week" },
    ],
    prevent: [{ text: "Resistive exercise reduces bone loss.", cite: { source: "bone", page: 42 } }],
    links: [{ text: "Exercise plan", href: "/exercise" }, { text: "Bone loss tool", href: "/tools#bone" }],
  },
  {
    id: "radiation", name: "Radiation dose", unit: "mSv",
    measure: { how: "Personal and area dosimeters; AstroMed estimates from mission type and days.", steps: ["Record dosimeter readings after solar events.", "Keep your mission dates current on the Mission page."], often: "Continuously; review weekly and after any alert." },
    why: [{ text: "A crew member's career radiation dose must stay below 600 mSv.", cite: { source: "std1", page: 40 } }],
    hazards: [
      { hazard: "radiation", effect: { text: "NASA estimates about 1,413 mSv for a long Mars mission, above the 600 mSv career limit.", cite: { source: "radiation", page: 54 } } },
      { hazard: "radiation", effect: { text: "Space weather events can expose crews above permissible limits; crews must be alerted and able to shelter even without contact with the ground.", cite: { source: "std2", page: 109 } } },
    ],
    when: [
      { level: "now", rule: "A radiation alert: follow your shelter procedure" },
      { level: "today", rule: "Nausea, vomiting, diarrhea or skin redness after a radiation event" },
      { level: "routine", rule: "Estimated dose over half of the 600 mSv career limit" },
    ],
    prevent: [{ text: "Local polyethylene shielding can bring most recorded solar events below 100 mSv.", cite: { source: "radiation", page: 48 } }],
    links: [{ text: "My exposure", href: "/hazards" }, { text: "Radiation tool", href: "/tools#radiation" }],
  },
  {
    id: "symptoms", name: "Symptoms, injuries and other problems", unit: "your own words, photos",
    measure: { how: "Describe it in Problems & advice, with a photo from the camera if it helps.", steps: ["Say where, how bad (0–10), and when it started.", "Add updates and photos so changes are visible."], often: "Whenever something comes up, and daily while it lasts." },
    why: [{ text: "NASA's list of high-likelihood or high-consequence spaceflight conditions covers about 80 problems, from scrapes and rashes to decompression sickness.", cite: { source: "std1", page: 83 } }],
    hazards: [
      { hazard: "environment", effect: { text: "Skin abrasions and rashes are among the most likely medical conditions on a mission.", cite: { source: "std1", page: 82 } } },
      { hazard: "isolation", effect: { text: "Stress has been linked to dormant viruses reactivating.", cite: { source: "behavioral", page: 31 } } },
    ],
    when: [
      { level: "now", rule: "Chest pain, trouble breathing, stroke signs, fainting, heavy bleeding, fire, smoke or toxic exposure" },
      { level: "today", rule: "7 out of 10 or worse, getting worse quickly, eye injuries, new numbness, or spreading infection" },
      { level: "routine", rule: "4–6 out of 10, lasting 2 weeks, or not improving after a week" },
    ],
    prevent: [{ text: "Report problems early; with long delays crews must start care themselves.", cite: { source: "behavioral", page: 55 } }],
    links: [{ text: "Report a problem", href: "/problems" }],
  },
];

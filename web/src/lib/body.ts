import type { MetricKey } from "@/lib/crew";
import type { SourceId } from "@/lib/tips";

export type Cite = { source: SourceId; page: number };
export type Fact = { text: string; cite: Cite };

export type BodyPart = {
  id: string;
  name: string;
  /** Hotspot position on the 240 × 520 figure. */
  x: number;
  y: number;
  summary: string;
  effects: Fact[];
  /** From NASA's sample medical-risk model: expected cases per mission (NASA-STD-3001 Vol. 1, p. 82). */
  conditions: { name: string; perMission?: number; note?: Fact }[];
  metrics: MetricKey[];
  /** Other personal data shown for this part. */
  extra?: "vision" | "exercise" | "bone" | "radiation";
  actions: { text: string; href?: string }[];
  tipIds: string[];
};

const IMM: Cite = { source: "std1", page: 82 };
export const IMM_NOTE = "Expected cases per mission in NASA's sample medical-risk model output (NASA-STD-3001 Vol. 1, p. 82). It's an example model run, not a prediction for you.";

export const BODY_PARTS: BodyPart[] = [
  {
    id: "brain", name: "Brain and mind", x: 120, y: 34,
    summary: "Sleep, mood, stress and thinking under isolation, workload and schedule changes.",
    effects: [
      { text: "Astronauts sleep about six hours a night in space, less than recommended.", cite: { source: "sleep", page: 11 } },
      { text: "Stress in spaceflight has been linked to immune changes such as dormant viruses reactivating.", cite: { source: "behavioral", page: 31 } },
      { text: "With communication delays, crews must spot and handle behavioral health problems themselves.", cite: { source: "behavioral", page: 55 } },
    ],
    conditions: [{ name: "Late insomnia", perMission: 13.85 }, { name: "Late headache", perMission: 5.25 }, { name: "Insomnia from adapting to space", perMission: 2.7 }, { name: "Headache from CO₂", perMission: 2.15 }],
    metrics: ["sleepHours", "sleepEfficiency", "moodPositive", "moodNegative"],
    actions: [{ text: "Log last night's sleep", href: "/checkups/sleep" }, { text: "Do the weekly mood check-in", href: "/checkups/mood" }, { text: "Check your sleep in the sleep tool", href: "/tools#sleep" }],
    tipIds: ["protect-sleep-period", "private-conference"],
  },
  {
    id: "eyes", name: "Eyes", x: 106, y: 56,
    summary: "Vision changes linked to spaceflight (SANS), and everyday eye injuries.",
    effects: [
      { text: "The headward fluid shift in weightlessness is thought to contribute to Spaceflight Associated Neuro-ocular Syndrome (SANS); one sign is swelling of the layer behind the eye.", cite: { source: "cardio", page: 95 } },
      { text: "Crews carry glasses with stronger lenses because SANS can change eyesight in flight.", cite: { source: "std1", page: 21 } },
    ],
    conditions: [{ name: "Eye abrasion (scratch)", perMission: 7.42 }, { name: "SANS", perMission: 2.08 }, { name: "Eye chemical burn", perMission: 0.64 }, { name: "Eye infection", perMission: 0.53 }],
    metrics: [],
    extra: "vision",
    actions: [{ text: "Do the weekly vision check", href: "/checkups/vision" }],
    tipIds: [],
  },
  {
    id: "ears", name: "Inner ear and balance", x: 155, y: 58,
    summary: "Balance and motion sickness while adapting to a new gravity level.",
    effects: [
      { text: "NASA requires preventive measures for balance (neuro-vestibular) problems during gravity changes such as launch and landing.", cite: { source: "std1", page: 20 } },
      { text: "Space motion sickness accounted for 47% of medications used on Space Shuttle missions.", cite: { source: "behavioral", page: 54 } },
      { text: "Motion sickness medicine is used most often on the first day of a mission.", cite: { source: "pharma", page: 9 } },
    ],
    conditions: [{ name: "Space motion sickness", perMission: 4.37 }, { name: "Ear or sinus block (barotrauma)", perMission: 3.28 }, { name: "Hearing loss", perMission: 0.57 }],
    metrics: [],
    actions: [{ text: "Tell your flight surgeon about nausea or dizziness, especially in the first days or after landing" }],
    tipIds: ["landing-orthostatic"],
  },
  {
    id: "airways", name: "Nose, throat and lungs", x: 96, y: 140,
    summary: "Congestion and respiratory infections in a closed habitat.",
    effects: [
      { text: "Blood markers in flight suggest a low-level, ongoing inflammation.", cite: { source: "cardio", page: 96 } },
    ],
    conditions: [{ name: "Nasal congestion", perMission: 3.51 }, { name: "Respiratory infection", perMission: 3.46 }, { name: "Sore throat (pharyngitis)", perMission: 1.17 }, { name: "Sinusitis", perMission: 0.64 }],
    metrics: ["temperature"],
    actions: [{ text: "Record your temperature if you feel unwell", href: "/checkups/vitals" }],
    tipIds: ["temperature-regulation"],
  },
  {
    id: "heart", name: "Heart and blood vessels", x: 136, y: 142,
    summary: "How the heart and circulation adapt to weightlessness and readapt to gravity.",
    effects: [
      { text: "In flight, heart rate and blood pressure were lower than before launch; after landing, blood pressure dropped on standing.", cite: { source: "cardio", page: 23 } },
      { text: "Exercise prevents cardiovascular deconditioning but doesn't prevent fainting on return without fluid loading.", cite: { source: "cardio", page: 87 } },
      { text: "Temperature control is impaired after six months in space, which may add to dizziness on landing.", cite: { source: "cardio", page: 84 } },
    ],
    conditions: [{ name: "Dizziness or fainting on standing after landing (orthostatic intolerance)", note: { text: "Well documented after spaceflight.", cite: { source: "cardio", page: 21 } } }],
    metrics: ["restingHr", "hrv", "systolic", "diastolic"],
    actions: [{ text: "Record vital signs", href: "/checkups/vitals" }, { text: "Log today's exercise", href: "/checkups/exercise" }],
    tipIds: ["exercise-heart", "bp-lower-in-flight"],
  },
  {
    id: "gut", name: "Gut and metabolism", x: 140, y: 212,
    summary: "Digestion, blood sugar and how medicines are absorbed.",
    effects: [
      { text: "After long flights, blood glucose was unchanged but insulin was about 50% higher, a sign of insulin resistance.", cite: { source: "cardio", page: 40 } },
      { text: "Motion sickness and its medicines change how the stomach empties, and food moves through the gut faster and less predictably.", cite: { source: "pharma", page: 4 } },
    ],
    conditions: [{ name: "Diarrhea", perMission: 3.53 }, { name: "Constipation", perMission: 1.02 }, { name: "Indigestion", perMission: 0.64 }],
    metrics: ["glucose"],
    actions: [{ text: "Add a fasting glucose reading to your vital signs", href: "/checkups/vitals" }],
    tipIds: ["glucose-insulin"],
  },
  {
    id: "kidneys", name: "Kidneys and bladder", x: 98, y: 212,
    summary: "Kidney stones linked to bone loss, and urinary infections.",
    effects: [
      { text: "Calcium released by bone loss can raise the risk of kidney stones, which may affect a mission more than the bone loss itself.", cite: { source: "std1", page: 39 } },
      { text: "Exercise helps reduce kidney stone formation.", cite: { source: "std1", page: 20 } },
      { text: "NASA's minimum drinking water is 2.5 L per crewmember per day.", cite: { source: "std2", page: 68 } },
    ],
    conditions: [{ name: "Urinary tract infection", perMission: 1.44 }, { name: "Kidney stone", note: { text: "A recognized spaceflight risk.", cite: { source: "pharma", page: 2 } } }],
    metrics: [],
    actions: [{ text: "Drink at least 2.5 L of water a day" }, { text: "Keep up resistance exercise", href: "/checkups/exercise" }],
    tipIds: ["resistive-exercise-bone"],
  },
  {
    id: "bones", name: "Bones and spine", x: 120, y: 262,
    summary: "Bone density loss in the hips and spine, and back problems.",
    effects: [
      { text: "Astronauts lose about 1–1.5% of hip and spine bone density per month in weightlessness.", cite: { source: "bone", page: 42 } },
      { text: "Nobody yet knows whether Moon or Mars gravity slows the loss, or whether it levels off.", cite: { source: "bone", page: 11 } },
      { text: "A model predicts 62% of astronauts would return from a Mars mission with osteoporosis-range hip bone density.", cite: { source: "bone", page: 25 } },
    ],
    conditions: [{ name: "Back injury", perMission: 3.41 }, { name: "Back pain from adapting to space", perMission: 3.15 }, { name: "Neck injury", perMission: 0.99 }],
    metrics: [],
    extra: "bone",
    actions: [{ text: "Estimate your bone loss", href: "/tools#bone" }, { text: "Log resistance exercise", href: "/checkups/exercise" }],
    tipIds: ["resistive-exercise-bone"],
  },
  {
    id: "muscles", name: "Muscles and joints", x: 100, y: 352,
    summary: "Strength, fitness and sprains.",
    effects: [
      { text: "NASA requires keeping up strength and aerobic fitness, which crews need for emergency tasks such as leaving the vehicle.", cite: { source: "std1", page: 20 } },
      { text: "NASA's fitness standard assumes aerobic capacity (VO₂max) drops about 15% on average in long flights, and can be rebuilt afterwards.", cite: { source: "std1", page: 34 } },
    ],
    conditions: [{ name: "Shoulder sprain", perMission: 2.43 }, { name: "Elbow sprain", perMission: 1.32 }, { name: "Ankle sprain", perMission: 1.22 }, { name: "Knee sprain", perMission: 0.78 }],
    metrics: [],
    extra: "exercise",
    actions: [{ text: "Log today's exercise", href: "/checkups/exercise" }],
    tipIds: ["exercise-heart", "resistive-exercise-bone"],
  },
  {
    id: "skin", name: "Skin", x: 186, y: 250,
    summary: "Scrapes, rashes and skin infections, the most common problems in flight.",
    effects: [{ text: "Skin abrasions and rashes are the second and third most likely medical conditions in NASA's sample model.", cite: IMM }],
    conditions: [{ name: "Skin abrasion", perMission: 9.86 }, { name: "Skin rash", perMission: 9.83 }, { name: "Skin infection", perMission: 1.38 }],
    metrics: [],
    actions: [{ text: "Clean and cover scrapes promptly; report rashes that spread" }],
    tipIds: [],
  },
];

/** Whole-body systems shown as buttons under the figure. */
export const SYSTEMS: BodyPart[] = [
  {
    id: "immune", name: "Immune system", x: 0, y: 0,
    summary: "Not measured directly yet; AstroMed watches for indirect warning signs.",
    effects: [
      { text: "Stress in spaceflight has been linked to dormant viruses reactivating, more inflammation and changes in protective proteins in saliva.", cite: { source: "behavioral", page: 31 } },
      { text: "Blood markers in flight suggest a low-level, ongoing inflammation.", cite: { source: "cardio", page: 96 } },
    ],
    conditions: [{ name: "Respiratory infection", perMission: 3.46 }, { name: "Allergic reaction", perMission: 1.18 }],
    metrics: ["temperature", "sleepHours", "moodNegative"],
    actions: [{ text: "See your immune warning signs", href: "/hazards" }],
    tipIds: ["temperature-regulation", "private-conference"],
  },
  {
    id: "radiation", name: "Radiation (whole body)", x: 0, y: 0,
    summary: "Long-term cancer risk from space radiation.",
    effects: [
      { text: "Your total career dose from spaceflight must stay below 600 mSv.", cite: { source: "std1", page: 40 } },
      { text: "A full Mars mission is estimated at about 1,413 mSv, more than the career limit.", cite: { source: "radiation", page: 54 } },
    ],
    conditions: [{ name: "Increased long-term cancer risk", note: { text: "The reason for the career limit.", cite: { source: "radiation", page: 52 } } }],
    metrics: [],
    extra: "radiation",
    actions: [{ text: "Enter your dosimeter reading", href: "/tools#radiation" }, { text: "See your exposure", href: "/hazards" }],
    tipIds: ["career-limit", "solar-storm-shelter"],
  },
];

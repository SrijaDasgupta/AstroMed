import type { CheckupLog } from "@/lib/checkup-store";
import type { Assessment } from "@/lib/crew";
import { addDays, localDate } from "@/lib/dates";
import type { EnvironmentId } from "@/lib/environments";
import type { SourceId } from "@/lib/tips";

export type Cited = { text: string; source: SourceId; page: number };

/** What NASA's documents say about exercise. Every line is checked against the cited page. */
export const EVIDENCE: Cited[] = [
  { text: "ISS crews are scheduled 2.5 hours a day for exercise, including setup and clean-up, with continuous or interval aerobic exercise plus resistance exercise.", source: "cardio", page: 30 },
  { text: "Aerobic capacity must stay at or above 80% of the pre-mission level during the mission.", source: "std1", page: 33 },
  { text: "Muscle strength must stay at or above 80% of baseline during the mission.", source: "std1", page: 38 },
  { text: "With a resistance device, cycle and treadmill, most crews return from 6 months with under 5% bone loss in the hip and spine.", source: "std1", page: 39 },
  { text: "Regular moderate-to-vigorous aerobic exercise in flight reduced the racing heart rate on standing after landing, though more exercise didn't prevent fainting.", source: "cardio", page: 30 },
  { text: "Spacewalks on the Moon or Mars need more aerobic capacity than spacewalks in orbit.", source: "std1", page: 33 },
  { text: "Aerobic capacity and leg strength can drop by about 10–30% after spaceflight; returning crews get a daily reconditioning schedule.", source: "std1", page: 34 },
  { text: "NASA also requires keeping up flexibility, agility and balance.", source: "std1", page: 20 },
];

export type Block = { title: string; minutes: string; what: string; examples: string[] };
export type Plan = { id: string; name: string; when: string; focus: string; blocks: Block[]; week: { day: string; plan: string }[]; cite: Cited[] };

const AEROBIC_CONTINUOUS: Block = { title: "Aerobic, steady", minutes: "30–45 min", what: "Steady effort you could keep up while speaking in short sentences.", examples: ["Cycle ergometer", "Treadmill (with harness in weightlessness)", "Rowing or running on the ground"] };
const AEROBIC_INTERVALS: Block = { title: "Aerobic, intervals", minutes: "20–30 min", what: "Short hard efforts with easy recovery in between, after a warm-up.", examples: ["4 × 4 min hard, 3 min easy", "8 × 30 s very hard, 90 s easy"] };
const RESIST_LOWER: Block = { title: "Resistance, lower body", minutes: "30–45 min", what: "Loaded movements through the hips, legs and spine, the sites that lose most bone.", examples: ["Squats", "Deadlifts", "Heel raises", "Single-leg work"] };
const RESIST_UPPER: Block = { title: "Resistance, upper body and core", minutes: "20–30 min", what: "Pushing, pulling and core strength for work and emergency tasks.", examples: ["Bench or overhead press", "Rows", "Core holds"] };
const MOBILITY: Block = { title: "Flexibility and balance", minutes: "10–15 min", what: "Range of motion, balance and coordination.", examples: ["Stretching", "Balance holds", "Agility drills (in gravity)"] };

const microWeek = [
  { day: "Mon", plan: "Intervals + lower body" },
  { day: "Tue", plan: "Steady aerobic + upper body" },
  { day: "Wed", plan: "Intervals + lower body" },
  { day: "Thu", plan: "Steady aerobic + upper body + flexibility" },
  { day: "Fri", plan: "Intervals + lower body" },
  { day: "Sat", plan: "Steady aerobic + upper body" },
  { day: "Sun", plan: "Light aerobic + flexibility and balance" },
];

export const PLANS: Plan[] = [
  {
    id: "micro", name: "In weightlessness", when: "Space station, Mars transit",
    focus: "Daily aerobic and resistance exercise to protect heart fitness, muscle and bone, within the 2.5-hour daily exercise slot.",
    blocks: [AEROBIC_INTERVALS, AEROBIC_CONTINUOUS, RESIST_LOWER, RESIST_UPPER, MOBILITY],
    week: microWeek,
    cite: [EVIDENCE[0], EVIDENCE[3]],
  },
  {
    id: "surface", name: "On the Moon or Mars", when: "Lunar or Mars surface",
    focus: "Same daily pattern, with extra aerobic work because surface spacewalks need more aerobic capacity.",
    blocks: [AEROBIC_INTERVALS, AEROBIC_CONTINUOUS, RESIST_LOWER, RESIST_UPPER, MOBILITY],
    week: microWeek.map((d) => (d.day === "Sun" ? { day: "Sun", plan: "Steady aerobic + flexibility and balance" } : d)),
    cite: [EVIDENCE[5]],
  },
  {
    id: "earth", name: "Earth analog or training", when: "Habitat, analog mission, or training on the ground",
    focus: "Build and keep the fitness and strength you'll need: NASA sets minimum strength standards before flight.",
    blocks: [AEROBIC_CONTINUOUS, AEROBIC_INTERVALS, RESIST_LOWER, RESIST_UPPER, MOBILITY],
    week: [
      { day: "Mon", plan: "Lower body + steady aerobic" },
      { day: "Tue", plan: "Intervals" },
      { day: "Wed", plan: "Upper body + flexibility" },
      { day: "Thu", plan: "Steady aerobic" },
      { day: "Fri", plan: "Lower body + intervals" },
      { day: "Sat", plan: "Upper body + steady aerobic" },
      { day: "Sun", plan: "Rest or light activity" },
    ],
    cite: [EVIDENCE[2]],
  },
  {
    id: "return", name: "After returning to gravity", when: "First weeks after landing",
    focus: "Gradual reconditioning, guided by your flight surgeon and trainers, to get back to your pre-mission fitness and strength.",
    blocks: [{ ...AEROBIC_CONTINUOUS, minutes: "15–30 min", what: "Start easy and build up; stop if you feel dizzy or faint." }, { ...RESIST_LOWER, minutes: "15–30 min", what: "Light loads first, building up as balance and strength return." }, MOBILITY],
    week: [
      { day: "Week 1", plan: "Short easy sessions, balance work, as cleared by your flight surgeon" },
      { day: "Weeks 2–3", plan: "Build steady aerobic time; add light resistance" },
      { day: "Week 4+", plan: "Return toward your full pre-mission plan" },
    ],
    cite: [EVIDENCE[6], EVIDENCE[4]],
  },
];

export function planFor(env: EnvironmentId) {
  return env === "leo" || env === "mars-transit" ? PLANS[0] : env === "earth-analog" ? PLANS[2] : PLANS[1];
}

export type DayLog = { date: string; resistive: number; aerobic: number };

/** Exercise minutes per day over the last 7 days, from exercise checkups and daily logs. */
export function lastWeek(logs: CheckupLog[], today = localDate()): DayLog[] {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return days.map((date) => {
    let resistive = 0, aerobic = 0;
    for (const l of logs) {
      if (!l.answers || localDate(new Date(l.createdAt)) !== date) continue;
      if (typeof l.answers.resistiveMin === "number") resistive += l.answers.resistiveMin;
      if (typeof l.answers.aerobicMin === "number") aerobic += l.answers.aerobicMin;
    }
    return { date, resistive, aerobic };
  });
}

/** Safety-first adjustments for today, based on the person's own alerts. General guidance only. */
export function todayAdvice(a: Assessment): { level: "go" | "easy" | "stop"; text: string }[] {
  const m = (k: string) => a.metrics.find((x) => x.def.key === k)!;
  const out: { level: "go" | "easy" | "stop"; text: string }[] = [];
  if (m("temperature").status !== "good") out.push({ level: "stop", text: "Your temperature is above your normal. Skip hard exercise and check with your flight surgeon; exercising with a fever isn't advised." });
  if (m("restingHr").status === "critical") out.push({ level: "stop", text: "Your resting heart rate is well above your normal. Check with your flight surgeon before training hard." });
  else if (m("restingHr").status === "warning" || m("hrv").status !== "good") out.push({ level: "easy", text: "Your heart measures suggest you're not fully recovered. Choose steady aerobic work over intervals today." });
  if (m("sleepHours").status !== "good") out.push({ level: "easy", text: "You've been sleeping less than usual. Keep today's session moderate, and keep the resistance work for bone." });
  if (out.length === 0) out.push({ level: "go", text: "Your measures are within your normal range. Follow today's plan." });
  return out;
}

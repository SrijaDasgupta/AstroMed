/**
 * Builds the My summary page: physical, mental and routine pictures from the person's own data,
 * ranked suggestions, and questions for the flight surgeon. Suggestions explain the data behind
 * them and cite the NASA page they rest on. No diagnosis and no medicine recommendations.
 */
import { adviceFor, noteTitle, type BodyNote } from "@/lib/body-notes";
import type { CheckupLog } from "@/lib/checkup-store";
import type { Assessment, MetricKey, Status } from "@/lib/crew";
import { addDays, localDate } from "@/lib/dates";
import { JOURNAL_TOPICS } from "@/lib/journal";
import type { JournalEntry } from "@/lib/journal-store";
import type { MissionContext } from "@/lib/mission";
import type { RoutineStats } from "@/lib/reminder-store";
import type { SourceId } from "@/lib/tips";

export type Area = "physical" | "mental" | "routine";
export type Cite = { source: SourceId; page: number };
export type Suggestion = { id: string; area: Area; priority: 1 | 2 | 3; title: string; reason: string; action?: { text: string; href: string }; cite?: Cite };
export type Question = { text: string; reason: string; cite?: Cite };
export type AreaStatus = "good" | "watch" | "concern" | "nodata";

type Input = {
  assessment: Assessment;
  logs: CheckupLog[];
  journal: JournalEntry[];
  ctx: MissionContext;
  routine: RoutineStats;
  checkupsDue: number;
  progress: { xp: number; rank: string; streak: number };
  days: number;
  today?: string;
  /** Daily food energy need in kcal (NASA's formula from the profile, or its default). */
  energyTarget?: number;
  /** Body notes (pain, injuries…) the person recorded on the body map. */
  bodyNotes?: BodyNote[];
  /** Demo mode: also use sample-data alerts so suggestions can be explored. */
  includeSample?: boolean;
  /** Per medicine: whether it seems to be helping, and side effects noted. */
  medInsights?: { name: string; status: string; noun?: string; sideEffects: { date: string; severity: string; note: string }[] }[];
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);

/** Daily averages of the person's own numeric answers within the period. */
function daily(logs: CheckupLog[], key: string, from: string, to: string) {
  const byDay: Record<string, number[]> = {};
  for (const l of logs) {
    const v = l.answers?.[key];
    if (typeof v !== "number") continue;
    const d = localDate(new Date(l.createdAt));
    if (d < from || d > to) continue;
    (byDay[d] ??= []).push(v);
  }
  return Object.entries(byDay).map(([date, vs]) => ({ date, value: avg(vs)! })).sort((a, b) => a.date.localeCompare(b.date));
}

export function buildSummary(i: Input) {
  const today = i.today ?? localDate();
  const from = addDays(today, -(i.days - 1));
  const a = i.assessment;
  const metric = (k: MetricKey) => a.metrics.find((m) => m.def.key === k)!;
  const suggestions: Suggestion[] = [];
  const questions: Question[] = [];

  // ---------------- Physical ----------------
  const VITALS: MetricKey[] = ["restingHr", "systolic", "diastolic", "temperature", "spo2", "glucose"];
  const vitals = VITALS.map((k) => {
    const m = metric(k);
    const own = daily(i.logs, k, from, today);
    return { key: k, label: m.def.label, unit: m.def.unit, decimals: m.def.decimals, days: own.length, avg: avg(own.map((x) => x.value)), latest: own.at(-1)?.value, range: m.range, status: m.status };
  });
  const sleep = daily(i.logs, "sleepHours", from, today);
  const sleepAvg = avg(sleep.map((x) => x.value));
  const shortNights = sleep.filter((x) => x.value < 6).length;
  const resist = daily(i.logs, "resistiveMin", from, today);
  const aero = daily(i.logs, "aerobicMin", from, today);
  const exerciseDates = new Set([...resist, ...aero].filter((x) => x.value > 0).map((x) => x.date));
  const exerciseMin = [...resist, ...aero].reduce((s, x) => s + x.value, 0);
  const water = daily(i.logs, "waterL", from, today);
  const waterAvg = avg(water.map((x) => x.value));
  // Nutrition: energy eaten against the person's need (+200 kcal per EVA hour), and weight change.
  const kcal = daily(i.logs, "kcal", from, today);
  const eva = daily(i.logs, "evaHours", from, today);
  const need = (d: string) => (i.energyTarget ?? 3035) + 200 * (eva.find((x) => x.date === d)?.value ?? 0);
  const kcalAvg = avg(kcal.map((x) => x.value));
  const kcalPct = kcal.length ? avg(kcal.map((x) => (x.value / need(x.date)) * 100)) : undefined;
  const lowFoodDays = kcal.filter((x) => x.value < need(x.date) * 0.9).length;
  const weights = daily(i.logs, "weightKg", addDays(today, -29), today);
  const weightNow = weights.at(-1)?.value;
  const weightChange = weights.length >= 2 ? weights.at(-1)!.value - weights[0].value : undefined;
  const weightChangePct = weightChange !== undefined ? (weightChange / weights[0].value) * 100 : undefined;
  const lastReading = [...i.logs].filter((l) => l.answers && VITALS.some((k) => typeof l.answers![k] === "number")).map((l) => localDate(new Date(l.createdAt))).sort().at(-1);
  const dosePct = (i.ctx.doseSoFar / 600) * 100;

  // Only alerts backed by the person's own recent readings (sample data can't tell us about them).
  const flagged = a.metrics.filter((m) => m.status !== "good" && (i.includeSample || m.recorded.slice(-3).some(Boolean)));
  for (const m of flagged) {
    suggestions.push({
      id: `metric-${m.def.key}`, area: m.def.group === "Mood" ? "mental" : "physical", priority: m.status === "critical" ? 1 : 2,
      title: `${m.def.label} is outside your normal range`,
      reason: `Your last 3 days averaged ${m.recentMean.toFixed(m.def.decimals)} ${m.def.unit}; your normal is ${m.range[0].toFixed(m.def.decimals)}–${m.range[1].toFixed(m.def.decimals)}.`,
      action: { text: "See the trend", href: "/vitals" },
    });
    if (m.status === "critical") questions.push({ text: `My ${m.def.label.toLowerCase()} has been well outside my normal range for the last few days. What should I do?`, reason: `${m.recentMean.toFixed(m.def.decimals)} ${m.def.unit} vs. normal ${m.range[0].toFixed(m.def.decimals)}–${m.range[1].toFixed(m.def.decimals)}` });
  }
  if (!lastReading || lastReading < addDays(today, -2)) {
    suggestions.push({ id: "record-vitals", area: "physical", priority: 3, title: "Record your vital signs", reason: lastReading ? `Your last reading was on ${lastReading}.` : "You haven't recorded any vital signs yet, so your summary uses sample data.", action: { text: "Log today's data", href: "/log" }, cite: { source: "std1", page: 21 } });
  }
  if (sleep.length >= 3 && sleepAvg !== undefined && sleepAvg < 6) {
    suggestions.push({ id: "sleep-short", area: "physical", priority: shortNights >= 5 ? 1 : 2, title: "Protect your sleep period", reason: `You averaged ${sleepAvg.toFixed(1)} h over ${sleep.length} logged nights; ${shortNights} were under 6 hours. Under 6 hours a night over time is linked to higher blood pressure.`, action: { text: "Sleep tips", href: "/tips?topic=sleep" }, cite: { source: "cardio", page: 39 } });
    if (shortNights >= 5) questions.push({ text: "I've slept under 6 hours most nights recently. Could a schedule change or sleep medicine help?", reason: `${shortNights} short nights in ${i.days} days`, cite: { source: "sleep", page: 5 } });
  }
  if (exerciseDates.size < Math.min(4, i.days)) {
    suggestions.push({ id: "exercise", area: "physical", priority: i.ctx.env.id === "earth-analog" ? 3 : 2, title: "Exercise more days this week", reason: `You logged exercise on ${exerciseDates.size} of the last ${i.days} days. ISS crews are scheduled exercise time every day to protect heart, muscle and bone.`, action: { text: "Today's plan", href: "/exercise" }, cite: { source: "cardio", page: 30 } });
  }
  if (water.length >= 2 && waterAvg !== undefined && waterAvg < 2.5) {
    suggestions.push({ id: "water", area: "physical", priority: 3, title: "Drink more water", reason: `You averaged ${waterAvg.toFixed(1)} L a day; NASA's minimum is 2.5 L per crewmember per day.`, action: { text: "Add a water reminder", href: "/reminders" }, cite: { source: "std2", page: 68 } });
  }
  if (kcal.length >= 3 && kcalPct !== undefined && kcalPct < 90) {
    suggestions.push({ id: "food", area: "physical", priority: kcalPct < 75 ? 1 : 2, title: "Eat enough to meet your energy needs", reason: `You averaged ${Math.round(kcalAvg!).toLocaleString("en-US")} kcal a day, ${Math.round(kcalPct)}% of your need, and fell short on ${lowFoodDays} of ${kcal.length} logged days. NASA plans for each crewmember to get 100% of their calculated needs.`, action: { text: "Log today's food", href: "/log" }, cite: { source: "std1", page: 37 } });
    if (kcalPct < 75) questions.push({ text: "I've been eating well under my energy needs. Should we change my menu or add snacks or supplements?", reason: `${Math.round(kcalPct)}% of need over ${kcal.length} days` });
  }
  if (weightChangePct !== undefined && weightChangePct <= -2) {
    suggestions.push({ id: "weight", area: "physical", priority: weightChangePct <= -5 ? 1 : 2, title: "Your weight is dropping", reason: `Down ${Math.abs(weightChange!).toFixed(1)} kg (${Math.abs(weightChangePct).toFixed(1)}%) over your last ${weights.length} weigh-ins. Losing weight in flight usually means eating less than you use.`, action: { text: "Log food and weight", href: "/log" }, cite: { source: "std1", page: 37 } });
    questions.push({ text: "My weight has been going down. Is my food intake enough for my exercise and spacewalks?", reason: `${weightChange!.toFixed(1)} kg in ${weights.length} weigh-ins` });
  }
  if (kcal.length === 0 && i.ctx.env.id !== "earth-analog") {
    suggestions.push({ id: "log-food", area: "physical", priority: 3, title: "Track what you eat", reason: `Your need is about ${(i.energyTarget ?? 3035).toLocaleString("en-US")} kcal a day, plus 200 kcal per spacewalk hour. Logging a rough estimate shows whether you're keeping up.`, action: { text: "Log today's food", href: "/log" }, cite: { source: "std2", page: 116 } });
  }
  if (dosePct >= 50) {
    suggestions.push({ id: "radiation", area: "physical", priority: dosePct >= 90 ? 1 : 2, title: "Your radiation dose is getting high", reason: `About ${i.ctx.doseSoFar.toFixed(0)} mSv so far on this mission, ${dosePct.toFixed(0)}% of NASA's 600 mSv career limit, before any earlier missions.`, action: { text: "Check in the radiation tool", href: "/tools#radiation" }, cite: { source: "std1", page: 40 } });
  }

  // ---------------- Mental ----------------
  const moodByDay: Record<string, number[]> = {};
  for (const e of i.journal) if (e.mood && e.date >= from && e.date <= today) (moodByDay[e.date] ??= []).push(e.mood);
  for (const d of daily(i.logs, "mood", from, today)) (moodByDay[d.date] ??= []).push(d.value);
  const moods = Object.entries(moodByDay).map(([date, vs]) => ({ date, value: avg(vs)! })).sort((x, y) => x.date.localeCompare(y.date));
  const moodAvg = avg(moods.map((m) => m.value));
  const lowDays = moods.filter((m) => m.value <= 2).length;
  let lowStreak = 0;
  for (let d = today, run = 0; d >= from; d = addDays(d, -1)) {
    const m = moods.find((x) => x.date === d);
    if (m && m.value <= 2) { run++; lowStreak = Math.max(lowStreak, run); } else if (m) run = 0;
  }
  const stress = daily(i.logs, "stress", from, today);
  const stressAvg = avg(stress.map((s) => s.value));
  const entries = i.journal.filter((e) => e.date >= from && e.date <= today);
  const topics = JOURNAL_TOPICS.map((t) => ({ ...t, n: entries.filter((e) => e.tags.includes(t.id)).length })).filter((t) => t.n > 0).sort((x, y) => y.n - x.n);

  if (lowStreak >= 3 || (moods.length >= 3 && moodAvg !== undefined && moodAvg <= 2.5)) {
    suggestions.push({ id: "low-mood", area: "mental", priority: 1, title: "Talk to someone about how you're feeling", reason: lowStreak >= 3 ? `Your mood has been low ${lowStreak} days in a row.` : `Your mood averaged ${moodAvg!.toFixed(1)} out of 5 over ${moods.length} days.`, action: { text: "Do the mood check-in", href: "/checkups/mood" }, cite: { source: "behavioral", page: 11 } });
    questions.push({ text: "My mood has been low for several days. Can we schedule a private conference?", reason: `${lowDays} low-mood day${lowDays === 1 ? "" : "s"} in the last ${i.days}`, cite: { source: "behavioral", page: 11 } });
  } else if (lowDays >= 2) {
    suggestions.push({ id: "some-low-mood", area: "mental", priority: 2, title: "Keep an eye on your mood", reason: `${lowDays} of your last ${moods.length} rated days were low.`, action: { text: "Write in your journal", href: "/journal" } });
  }
  if (stress.length >= 2 && stressAvg !== undefined && stressAvg >= 4) {
    suggestions.push({ id: "stress", area: "mental", priority: 2, title: "Your stress has been high", reason: `Stress averaged ${stressAvg.toFixed(1)} out of 5. In spaceflight, stress has been linked to immune changes, so it's worth acting on.`, action: { text: "Mind, team and support tips", href: "/tips?topic=mind" }, cite: { source: "behavioral", page: 31 } });
  }
  if (moods.length > 0 && topics.some((t) => t.id === "contact") && (moodAvg ?? 5) < 3.5) {
    suggestions.push({ id: "contact-home", area: "mental", priority: 3, title: "Stay in touch with home", reason: "You've been writing about contact with home while your mood has been lower than usual.", action: { text: "Add a reminder", href: "/reminders" }, cite: { source: "behavioral", page: 61 } });
  }
  if (i.ctx.env.id === "mars-transit" || i.ctx.env.id === "mars-surface") {
    suggestions.push({ id: "self-monitor", area: "mental", priority: 3, title: "Keep your own warning-signs plan up to date", reason: "With long signal delays, crews need to notice and act on behavioral health changes themselves.", cite: { source: "behavioral", page: 55 } });
  }
  if (entries.length === 0) {
    suggestions.push({ id: "journal", area: "mental", priority: 3, title: "Try writing a short journal entry", reason: `No journal entries in the last ${i.days} days. NASA studied astronaut journals to understand how crews adjust.`, action: { text: "Open the journal", href: "/journal" }, cite: { source: "behavioral", page: 21 } });
  }

  // ---------------- Routine ----------------
  const expected = i.routine.meds.reduce((s, m) => s + m.expected, 0);
  const taken = i.routine.meds.reduce((s, m) => s + m.taken, 0);
  const adherence = expected > 0 ? Math.min(100, (taken / expected) * 100) : undefined;
  const missed = i.routine.meds.map((m) => ({ ...m, missed: Math.max(0, m.expected - m.taken) })).filter((m) => m.missed > 0);
  const remindersPct = i.routine.remindersExpected > 0 ? Math.min(100, (i.routine.remindersDone / i.routine.remindersExpected) * 100) : undefined;

  if (adherence !== undefined && adherence < 80) {
    suggestions.push({ id: "meds", area: "routine", priority: adherence < 50 ? 1 : 2, title: "Some medicine doses weren't marked as taken", reason: `${taken} of ${expected} scheduled doses marked taken${i.routine.days > 1 ? ` in the last ${i.routine.days} days` : " today"}.`, action: { text: "Today's schedule", href: "/reminders" } });
    for (const m of missed.filter((x) => x.missed >= 2)) questions.push({ text: `I missed ${m.missed} doses of ${m.name}. What should I do about missed doses?`, reason: `${m.taken} of ${m.expected} taken, ${m.skipped} skipped` });
  }
  if (i.routine.meds.length > 0 && (i.ctx.length ?? 0) > 365) {
    questions.push({ text: "Will my medicines stay effective for the whole mission?", reason: `Your mission is planned for ${i.ctx.length} days; many medicines expire within 1–2 years.`, cite: { source: "pharma", page: 3 } });
  }
  if (i.routine.meds.length >= 2) {
    questions.push({ text: "Is it safe to take my current medicines together?", reason: `You have ${i.routine.meds.length} active medicines. Spaceflight medicines can interact.`, cite: { source: "cardio", page: 36 } });
  }
  for (const m of i.medInsights ?? []) {
    if (m.status === "worse") {
      suggestions.push({ id: `med-${m.name}`, area: "routine", priority: 2, title: `${m.name} may not be helping your ${m.noun ?? "symptoms"}`, reason: "Your readings since starting are worse than before.", action: { text: "Medicines", href: "/reminders" } });
      questions.push({ text: `My ${m.noun ?? "symptoms"} got worse after starting ${m.name}. Should we change anything?`, reason: "Before-and-after comparison of your own readings" });
    } else if (m.status === "same") {
      questions.push({ text: `I haven't seen a change in my ${m.noun ?? "symptoms"} since starting ${m.name}. How long should it take to work?`, reason: "Before-and-after comparison of your own readings" });
    }
    const fx = m.sideEffects.filter((e) => e.date >= from);
    if (fx.length) {
      if (fx.some((e) => e.severity === "severe")) suggestions.push({ id: `fx-${m.name}`, area: "routine", priority: 1, title: `Severe side effect from ${m.name}`, reason: "Contact your flight surgeon before the next dose.", action: { text: "Medicines", href: "/reminders" } });
      const notes = fx.map((e) => e.note).filter(Boolean).slice(0, 2).join("; ");
      questions.push({ text: `I've had side effects from ${m.name}${notes ? ` (${notes})` : ""}. Should we change anything?`, reason: `${fx.length} noted in this period` });
    }
  }
  if (i.checkupsDue > 0) {
    suggestions.push({ id: "checkups", area: "routine", priority: 3, title: `${i.checkupsDue} checkup${i.checkupsDue === 1 ? " is" : "s are"} due`, reason: "Regular checks keep your trends and alerts accurate.", action: { text: "Open checkups", href: "/checkups" } });
  }

  // Flagged checkup answers in the period (e.g. vision change, pain) become questions.
  for (const l of i.logs) {
    const d = localDate(new Date(l.createdAt));
    if (d < from || !l.answers) continue;
    if (l.answers.blurred === true) questions.push({ text: "I noticed a change in my vision. Should I have an eye exam for SANS?", reason: `Reported on ${d}`, cite: { source: "std1", page: 20 } });
    if (l.answers.pain === true) questions.push({ text: "I had pain during exercise. Should I change my exercise plan?", reason: `Reported on ${d}` });
  }

  // Open body notes from the body map: their advice becomes suggestions and questions.
  const bodyNotes = i.bodyNotes ?? [];
  const openNotes = bodyNotes.filter((n) => !n.resolvedOn).map((n) => ({ n, a: adviceFor(n, bodyNotes, today, i.ctx.env) }));
  for (const { n, a } of openNotes) {
    const priority = a.level === "now" || a.level === "today" ? 1 : a.level === "routine" ? 2 : 3;
    suggestions[a.level === "now" ? "unshift" : "push"]({ id: `body-${n.id}`, area: "physical", priority, title: `${noteTitle(n)}: ${a.headline.toLowerCase()}`, reason: `${n.severity}/10 since ${n.startedOn}. ${a.why[0]}`, action: { text: "See the advice", href: `/problems#p-${n.id}` }, cite: a.context?.cite });
    if (a.question) questions.push({ text: a.question, reason: a.why.join(" ") });
  }
  const bodyWorst = openNotes.some(({ a }) => a.level === "now" || a.level === "today") ? "urgent" : openNotes.some(({ a }) => a.level === "routine") ? "routine" : undefined;

  // ---------------- Statuses ----------------
  const physicalStatus: AreaStatus = flagged.some((m) => m.status === "critical" && m.def.group !== "Mood") || bodyWorst === "urgent" ? "concern"
    : flagged.some((m) => m.def.group !== "Mood") || shortNights >= 3 || bodyWorst === "routine" ? "watch"
    : vitals.some((v) => v.days > 0) || sleep.length > 0 || openNotes.length > 0 ? "good" : "nodata";
  const mentalStatus: AreaStatus = moods.length === 0 && stress.length === 0 ? "nodata"
    : lowStreak >= 3 || (moodAvg ?? 5) <= 2.5 ? "concern"
    : lowDays >= 2 || (stressAvg ?? 0) >= 4 ? "watch" : "good";
  const routineStatus: AreaStatus = adherence === undefined && remindersPct === undefined ? (i.checkupsDue > 2 ? "watch" : "nodata")
    : (adherence ?? 100) < 50 ? "concern" : (adherence ?? 100) < 80 || (remindersPct ?? 100) < 50 ? "watch" : "good";

  const unique = (qs: Question[]) => qs.filter((q, idx) => qs.findIndex((x) => x.text === q.text) === idx);
  return {
    from, to: today,
    physical: { status: physicalStatus, vitals, sleepAvg, sleepNights: sleep.length, shortNights, exerciseDays: exerciseDates.size, exerciseMin, waterAvg, dose: i.ctx.doseSoFar, dosePct, missionDay: i.ctx.day, lastReading, bodyNotesOpen: openNotes.length, kcalAvg, kcalPct, kcalDays: kcal.length, energyTarget: i.energyTarget ?? 3035, weightNow, weightChange },
    mental: { status: mentalStatus, moodAvg, moodDays: moods.length, lowDays, lowStreak, stressAvg, entries: entries.length, topics, moods },
    routine: { status: routineStatus, adherence, taken, expected, missed, remindersPct, remindersDone: i.routine.remindersDone, remindersExpected: i.routine.remindersExpected, checkupsDue: i.checkupsDue, streak: i.progress.streak, xp: i.progress.xp, rank: i.progress.rank, statsDays: i.routine.days },
    suggestions: suggestions.sort((x, y) => x.priority - y.priority).slice(0, 8),
    questions: unique(questions).slice(0, 8),
  };
}

export type Summary = ReturnType<typeof buildSummary>;
export const STATUS_TEXT: Record<AreaStatus, string> = { good: "Doing well", watch: "Worth watching", concern: "Needs attention", nodata: "Not enough data" };
export type { Status };

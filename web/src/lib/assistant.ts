/**
 * AstroMed's built-in assistant. It answers questions from the person's own data using simple
 * rules, not an AI model: it finds which measure and time period the question is about and
 * builds an answer from My vitals, checkups, exposure and progress. An AI model can later be
 * placed in front of this, using the same data.
 */
import { analyzeText, type Analysis } from "@/lib/space-conditions";
import { contactText } from "@/lib/contact";
import { CHECKUPS, getCheckup } from "@/lib/checkups";
import type { CheckupLog } from "@/lib/checkup-store";
import { dueStatus } from "@/lib/checkup-schedule";
import { MISSION_DAYS, type Assessment, type MetricAssessment, type MetricKey } from "@/lib/crew";
import type { MissionEnvironment } from "@/lib/environments";
import { BONE_LOSS_PCT_PER_MONTH, CAREER_LIMIT_MSV, gravityOf } from "@/lib/hazards";
import { tipsForAlerts, TIPS } from "@/lib/tips";

export type ChartData = { label: string; unit: string; decimals: number; values: number[]; range: [number, number]; baseline: number; baselineKind: "measured" | "simulated"; recorded: boolean[] };

export type Block =
  | { type: "text"; text: string; tone?: "normal" | "warning" | "muted" }
  | { type: "stats"; items: { label: string; value: string }[] }
  | { type: "chart"; chart: ChartData }
  | { type: "tips"; tipIds: string[] }
  | { type: "links"; links: { href: string; label: string }[] };

export type Answer = { blocks: Block[]; suggestions: string[] };

export type AssistantContext = {
  assessment: Assessment;
  env: MissionEnvironment;
  logs: CheckupLog[];
  recordedDays: number;
  progress: { xp: number; rank: string; nextRank?: string; toNext: number; streak: number; bestStreak: number; badges: { name: string; earned: boolean }[] };
  missions: { id: string; habit?: string }[];
  doneToday: Set<string>;
  missionDay: number;
  doseSoFar: number;
  missionName?: string;
};

// ---------------------------------------------------------------------------
// Understanding the question
// ---------------------------------------------------------------------------

const METRIC_WORDS: { keys: MetricKey[]; words: RegExp }[] = [
  { keys: ["systolic", "diastolic"], words: /\b(blood pressure|bp|systolic|diastolic|pressure)\b/ },
  { keys: ["hrv"], words: /\b(hrv|variability)\b/ },
  { keys: ["restingHr"], words: /\b(heart ?rate|pulse|hr|bpm|heartbeat|heart)\b/ },
  { keys: ["glucose"], words: /\b(glucose|blood sugar|sugar)\b/ },
  { keys: ["temperature"], words: /\b(temperature|temp|fever)\b/ },
  { keys: ["sleepEfficiency"], words: /\b(sleep efficiency|efficiency)\b/ },
  { keys: ["sleepHours"], words: /\b(sleep|slept|sleeping|rest)\b/ },
  { keys: ["moodPositive", "moodNegative"], words: /\b(mood|stress|stressed|feeling|feel|anxiety|anxious|happy|sad)\b/ },
];

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, ten: 10, fourteen: 14, thirty: 30 };

type Period = { from: number; to: number; label: string }; // indices into the 30-day series (last = today)

function parsePeriod(q: string): Period | undefined {
  const last = MISSION_DAYS - 1;
  const num = (s: string) => NUMBER_WORDS[s] ?? Number(s);
  let m;
  if (/\btoday\b|\bnow\b|\bcurrent(ly)?\b|\blatest\b/.test(q)) return { from: last, to: last, label: "today" };
  if (/\byesterday\b/.test(q)) return { from: last - 1, to: last - 1, label: "yesterday" };
  if ((m = q.match(/\b(\d+|one|two|three|four|five|six|seven|ten)\s+days?\s+ago\b/))) {
    const n = Math.min(last, num(m[1]));
    return { from: last - n, to: last - n, label: `${n} day${n > 1 ? "s" : ""} ago` };
  }
  if ((m = q.match(/\b(?:last|past|previous)?\s*(\d+|two|three|four|five|six|seven|ten|fourteen|thirty)\s+days?\b/))) {
    const n = Math.max(1, Math.min(MISSION_DAYS, num(m[1])));
    return { from: MISSION_DAYS - n, to: last, label: `the last ${n} days` };
  }
  if (/\b(two|2) weeks?\b|\bfortnight\b/.test(q)) return { from: MISSION_DAYS - 14, to: last, label: "the last 14 days" };
  if (/\bmonth\b|\b30\b|\ball\b/.test(q)) return { from: 0, to: last, label: `the last ${MISSION_DAYS} days` };
  if (/\bweek\b/.test(q)) return { from: MISSION_DAYS - 7, to: last, label: "the last 7 days" };
  return undefined;
}

const has = (q: string, re: RegExp) => re.test(q);

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

const dayName = (i: number) => {
  const ago = MISSION_DAYS - 1 - i;
  return ago === 0 ? "today" : ago === 1 ? "yesterday" : `${ago} days ago`;
};
const fmt = (v: number, dp: number) => v.toFixed(dp);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** How a measure reads inside a sentence, e.g. "systolic blood pressure". */
const SPOKEN: Partial<Record<MetricKey, string>> = {
  systolic: "systolic blood pressure",
  diastolic: "diastolic blood pressure",
  glucose: "fasting blood glucose",
  hrv: "heart rate variability",
};
const spoken = (m: MetricAssessment) => SPOKEN[m.def.key] ?? m.def.label.toLowerCase();

function metricBlock(m: MetricAssessment, period: Period): Block[] {
  const d = m.def;
  const vals = m.values.slice(period.from, period.to + 1);
  const own = m.recorded.slice(period.from, period.to + 1).filter(Boolean).length;
  const [lo, hi] = m.range;
  const v = (x: number) => `${fmt(x, d.decimals)} ${d.unit}`;
  const blocks: Block[] = [];

  if (vals.length === 1) {
    const x = vals[0];
    const where = x < lo ? "below" : x > hi ? "above" : "within";
    blocks.push({ type: "text", text: `Your ${spoken(m)} ${period.label}: ${v(x)} (${m.recorded[period.from] ? "your reading" : "sample data"}). That is ${where} your normal range of ${fmt(lo, d.decimals)}–${fmt(hi, d.decimals)} ${d.unit}.` });
  } else {
    const minI = vals.indexOf(Math.min(...vals)) + period.from;
    const maxI = vals.indexOf(Math.max(...vals)) + period.from;
    const outside = vals.filter((x) => x < lo || x > hi).length;
    blocks.push({
      type: "stats",
      items: [
        { label: "Latest", value: v(m.latest) },
        { label: `Average, ${period.label}`, value: v(mean(vals)) },
        { label: "Lowest", value: `${v(Math.min(...vals))} (${dayName(minI)})` },
        { label: "Highest", value: `${v(Math.max(...vals))} (${dayName(maxI)})` },
        { label: "Your normal", value: `${fmt(lo, d.decimals)}–${fmt(hi, d.decimals)} ${d.unit}` },
        { label: "Days outside normal", value: `${outside} of ${vals.length}` },
      ],
    });
    // Trend: first half vs second half of the period, compared with the normal day-to-day spread.
    const half = Math.floor(vals.length / 2);
    if (vals.length >= 4) {
      const diff = mean(vals.slice(half)) - mean(vals.slice(0, half));
      const sd = (hi - lo) / 4;
      const trend = Math.abs(diff) < sd * 0.5 ? "steady" : diff > 0 ? "rising" : "falling";
      blocks.push({ type: "text", text: `Over ${period.label} your ${spoken(m)} has been ${trend}${trend === "steady" ? "" : ` (about ${fmt(Math.abs(diff), d.decimals)} ${d.unit})`}.` });
    }
    blocks.push({ type: "text", tone: "muted", text: own === 0 ? `No readings of your own in this period; these are sample values from your baseline.` : `${own} of these ${vals.length} days are your own readings; the rest are sample values from your baseline.` });
  }

  if (m.status !== "good") {
    blocks.push({ type: "text", tone: "warning", text: `Your last 3 days averaged ${v(m.recentMean)}, outside your usual ${v(m.baseline)}. ${m.status === "critical" ? "Consider contacting your flight surgeon." : "Keep an eye on it."}` });
  }
  if (d.baselineKind === "simulated") blocks.push({ type: "text", tone: "muted", text: `Your ${spoken(m)} baseline is simulated, because the MMASH recording didn't measure it.` });
  return blocks;
}

function chartOf(m: MetricAssessment): Block {
  return { type: "chart", chart: { label: m.def.label, unit: m.def.unit, decimals: m.def.decimals, values: m.values, range: m.range, baseline: m.baseline, baselineKind: m.def.baselineKind, recorded: m.recorded } };
}

function tipsFor(keys: MetricKey[], ctx: AssistantContext): Block[] {
  const flagged = ctx.assessment.metrics.filter((m) => keys.includes(m.def.key)).map((m) => ({ key: m.def.key, deviation: Math.max(m.deviation, 0.1) }));
  const tips = tipsForAlerts(flagged, ctx.env.id, 2);
  return tips.length ? [{ type: "tips", tipIds: tips.map((t) => t.id) }] : [];
}

const SUGGESTIONS = [
  "How am I doing?",
  "Give me the details for my blood pressure",
  "What was my temperature yesterday?",
  "How did I sleep this week?",
  "How much radiation have I had?",
  "Which checkups are due?",
];

function help(): Answer {
  return {
    blocks: [
      { type: "text", text: "I can answer questions about your own data in AstroMed: your vitals (heart rate, blood pressure, glucose, temperature, sleep, mood, heart rate variability), your checkups, radiation and bone exposure, and your progress." },
      { type: "text", tone: "muted", text: "You can add a time: today, yesterday, 3 days ago, this week, last 14 days, this month." },
    ],
    suggestions: SUGGESTIONS,
  };
}

export function answer(rawQuestion: string, ctx: AssistantContext): Answer {
  const q = ` ${rawQuestion.toLowerCase().replace(/[^\w\s.-]/g, " ").replace(/\s+/g, " ")} `;
  const a = ctx.assessment;
  const metric = (k: MetricKey) => a.metrics.find((m) => m.def.key === k)!;

  if (q.trim().length < 2 || has(q, /\b(help|what can you|how do i use|examples?)\b/)) return help();

  // Emergency warning signs come before anything else.
  const read = analyzeText(rawQuestion);
  if (read.redFlags.length) {
    return {
      blocks: [
        { type: "text", tone: "warning", text: `That sounds like it could be an emergency (${read.redFlags.map((f) => f.label.toLowerCase()).join(", ")}). ${contactText("now", ctx.env).title}. ${contactText("now", ctx.env).body}${read.redFlags.some((f) => f.id === "self-harm") ? " If you're thinking about harming yourself, please reach out now. On Earth in the US you can call or text 988." : ""}` },
        { type: "links", links: [{ href: "/problems", label: "Record it in Problems & advice" }] },
      ],
      suggestions: [],
    };
  }

  // Checkups
  if (has(q, /\b(checkups?|check-ups?|due|reminders?|exam)\b/)) {
    const rows = CHECKUPS.map((c) => ({ c, s: dueStatus(c, ctx.logs) }));
    const due = rows.filter((r) => r.s.due);
    const last = ctx.logs[0];
    return {
      blocks: [
        { type: "text", text: due.length === 0 ? "All your checkups are done for now." : `${due.length} checkup${due.length > 1 ? "s are" : " is"} due: ${due.map((r) => r.c.title.toLowerCase()).join(", ")}.` },
        ...(last ? [{ type: "text" as const, tone: "muted" as const, text: `Your last entry was ${last.checkupId === "daily" ? "a daily log" : getCheckup(last.checkupId)?.title.toLowerCase()} on ${new Date(last.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.` }] : []),
        { type: "links", links: [{ href: "/checkups", label: "Open checkups" }, ...(due[0] ? [{ href: `/checkups/${due[0].c.id}`, label: `Start ${due[0].c.title.toLowerCase()}` }] : [])] },
      ],
      suggestions: ["Give me the details for my heart rate", "How am I doing?"],
    };
  }

  // Radiation
  if (has(q, /\b(radiation|dose|msv|sievert|exposure|cosmic|solar)\b/)) {
    const soFar = ctx.doseSoFar;
    return {
      blocks: [
        { type: "stats", items: [
          { label: "Estimated dose so far", value: `${fmt(soFar, 1)} mSv` },
          { label: "Daily rate here", value: `≈ ${ctx.env.radiationMsvPerDay} mSv/day` },
          { label: "Share of career limit", value: `${fmt((soFar / CAREER_LIMIT_MSV) * 100, 1)}% of 600 mSv` },
        ] },
        { type: "text", tone: "muted", text: `Estimated from ${ctx.missionDay} day${ctx.missionDay === 1 ? "" : "s"} on ${ctx.missionName ?? `your current mission (${ctx.env.name}, assumed length)`}, not counting earlier missions or solar storms. ${ctx.env.radiationSource}` },
        { type: "tips", tipIds: ["career-limit", ...(ctx.env.id === "leo" || ctx.env.id === "earth-analog" ? [] : ["solar-storm-shelter"])] },
        { type: "links", links: [{ href: "/tools#radiation", label: "Enter your dosimeter reading" }, { href: "/hazards", label: "My exposure" }] },
      ],
      suggestions: ["How much bone have I lost?", "How am I doing?"],
    };
  }

  // Bone
  if (has(q, /\b(bones?|bone density|skeleton|osteo)/)) {
    const g = gravityOf(ctx.env);
    const months = ctx.missionDay / 30.4;
    const [l, h] = BONE_LOSS_PCT_PER_MONTH;
    return {
      blocks: [
        { type: "text", text: g === "earth" ? "No spaceflight bone loss is expected in Earth gravity." : `Estimated hip and spine bone loss so far: ${fmt(g === "partial" ? 0 : l * months, 1)}–${fmt(h * months, 1)}%, based on 1–1.5% a month in weightlessness (Bone fracture report, p. 42).` },
        ...(g === "earth" ? [] : [{ type: "tips" as const, tipIds: ["resistive-exercise-bone"] }, { type: "links" as const, links: [{ href: "/tools#bone", label: "Bone loss calculator" }] }]),
      ],
      suggestions: ["How much radiation have I had?", "Which checkups are due?"],
    };
  }

  // Progress
  if (has(q, /\b(xp|points?|rank|level|streak|badges?|progress|missions?|habits?|score)\b/)) {
    const p = ctx.progress;
    const done = ctx.missions.filter((m) => ctx.doneToday.has(m.id)).length;
    return {
      blocks: [
        { type: "stats", items: [
          { label: "Rank", value: p.rank },
          { label: "XP", value: `${p.xp}${p.nextRank ? ` (${p.toNext} to ${p.nextRank})` : ""}` },
          { label: "Streak", value: `${p.streak} day${p.streak === 1 ? "" : "s"} (best ${p.bestStreak})` },
          { label: "Today's missions", value: `${done} of ${ctx.missions.length} done` },
          { label: "Badges", value: `${p.badges.filter((b) => b.earned).length} of ${p.badges.length}` },
        ] },
        ...(done < ctx.missions.length ? [{ type: "text" as const, text: `Still to do today: ${ctx.missions.filter((m) => !ctx.doneToday.has(m.id)).map((m) => m.habit).join(" ")}` }] : []),
        { type: "links", links: [{ href: "/me", label: "Open My space" }] },
      ],
      suggestions: ["Which checkups are due?", "How am I doing?"],
    };
  }

  // A specific vital sign
  const found = METRIC_WORDS.find((w) => w.words.test(q));
  if (found) {
    const period = parsePeriod(q) ?? { from: MISSION_DAYS - 7, to: MISSION_DAYS - 1, label: "the last 7 days" };
    const blocks: Block[] = [];
    for (const k of found.keys) {
      const m = metric(k);
      if (found.keys.length > 1) blocks.push({ type: "text", text: m.def.label });
      blocks.push(...metricBlock(m, period));
      blocks.push(chartOf(m));
    }
    blocks.push(...tipsFor(found.keys, ctx));
    blocks.push({ type: "links", links: [{ href: "/vitals", label: "Open My vitals" }, ...(found.keys.some((k) => ["restingHr", "systolic", "diastolic", "glucose", "temperature"].includes(k)) ? [{ href: "/checkups/vitals", label: "Record vital signs" }] : found.keys.includes("sleepHours") ? [{ href: "/checkups/sleep", label: "Log sleep" }] : [])] });
    const other = SUGGESTIONS.filter((s) => !found.words.test(s.toLowerCase())).slice(0, 3);
    return { blocks, suggestions: [`${found.keys.includes("sleepHours") ? "How did I sleep" : "What was it"} yesterday?`.replace("What was it", `What was my ${spoken(metric(found.keys[0]))}`), ...other] };
  }

  // Overall
  if (has(q, /\b(how am i|how are my|overall|summary|status|am i ok|am i okay|health|vitals|everything|doing)\b/)) {
    const flagged = a.metrics.filter((m) => m.status !== "good");
    return {
      blocks: [
        { type: "text", tone: flagged.length ? "warning" : "normal", text: flagged.length === 0 ? "Everything is within your normal range over the last 3 days." : `${flagged.length} measure${flagged.length > 1 ? "s are" : " is"} outside your normal range: ${flagged.map((m) => m.def.label.toLowerCase()).join(", ")}.` },
        { type: "stats", items: a.metrics.filter((m) => ["restingHr", "systolic", "glucose", "temperature", "sleepHours", "moodPositive"].includes(m.def.key)).map((m) => ({ label: m.def.label, value: `${fmt(m.latest, m.def.decimals)} ${m.def.unit}${m.status !== "good" ? " · outside normal" : ""}` })) },
        { type: "text", tone: "muted", text: ctx.recordedDays === 0 ? "You haven't recorded readings yet, so this uses sample data from your baseline." : `Based on your readings from ${ctx.recordedDays} day${ctx.recordedDays > 1 ? "s" : ""} plus sample data for the rest.` },
        ...(flagged.length ? [{ type: "tips" as const, tipIds: tipsForAlerts(flagged.map((m) => ({ key: m.def.key, deviation: m.deviation })), ctx.env.id, 2).map((t) => t.id) }] : []),
        { type: "links", links: [{ href: "/vitals", label: "Open My vitals" }] },
      ],
      suggestions: flagged.length ? [`Give me the details for my ${flagged[0].def.label.toLowerCase()}`, "Which checkups are due?"] : ["Give me the details for my blood pressure", "How did I sleep this week?"],
    };
  }

  // Tips about a topic
  if (read.matches.length && has(q, /\b(advice|should i|what can i do|what do i do|help with|is it normal|my)\b/)) return problemAnswer(read, ctx);
  if (has(q, /\b(tip|tips|advice|recommend|should i|what can i do)\b/)) {
    return { blocks: [{ type: "text", text: "Here are tips for your mission. Ask about a specific measure, such as \"tips for sleep\", for more targeted ones." }, { type: "tips", tipIds: TIPS.filter((t) => t.habit).slice(0, 3).map((t) => t.id) }, { type: "links", links: [{ href: "/tips", label: "All health tips" }] }], suggestions: SUGGESTIONS.slice(0, 3) };
  }

  // A symptom or spaceflight problem described in the person's own words.
  if (read.matches.length) return problemAnswer(read, ctx);

  return { blocks: [{ type: "text", text: "Sorry, I didn't understand that. I can answer questions about your vitals, checkups, radiation, bone loss and progress." }, ...help().blocks.slice(1)], suggestions: SUGGESTIONS };
}

function problemAnswer(read: Analysis, ctx: AssistantContext): Answer {
  const c = read.matches[0].condition;
  const contact = contactText(c.level, ctx.env);
  const WHEN = { [c.level]: c.level === "none" ? "Usually fine to manage yourself; keep an eye on it." : `${contact.title}. ${contact.body}` } as Record<string, string>;
  const others = read.matches.slice(1, 3).map((m) => m.condition.name.toLowerCase());
  return {
    blocks: [
      { type: "text", text: `That sounds most like ${c.name.toLowerCase()}${others.length ? ` (or possibly ${others.join(" or ")})` : ""}. ${WHEN[c.level]}`, tone: c.level === "today" || c.level === "now" ? "warning" : "normal" },
      { type: "text", text: `Meanwhile: ${c.care.join(" ")}` },
      ...(c.watch.length ? [{ type: "text" as const, text: `Get help sooner if: ${c.watch.join("; ").toLowerCase()}.`, tone: "muted" as const }] : []),
      ...(c.fact ? [{ type: "text" as const, text: `In space: ${c.fact.text}`, tone: "muted" as const }] : []),
      { type: "links", links: [{ href: "/problems", label: "Record it and get advice as it changes" }, ...(c.links ?? []).map((l) => ({ href: l.href, label: l.text }))].slice(0, 3) },
    ],
    suggestions: ["How am I doing?", "Which checkups are due?"],
  };
}

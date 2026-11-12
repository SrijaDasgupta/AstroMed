import type { Escalation } from "@/lib/checkups";
import { BODY_PARTS, type Cite } from "@/lib/body";
import { daysBetween } from "@/lib/dates";
import { analyzeText, CONDITIONS, conditionCite, HAZARDS, type Condition, type Hazard } from "@/lib/space-conditions";
import type { StoredAnalysis } from "@/lib/ai-analysis";
import { contactText } from "@/lib/contact";
import type { MissionEnvironment } from "@/lib/environments";

/**
 * Where a problem is. Body areas have x/y on the 300 × 640 front-view figure (the figure's left is the
 * person's right). Areas without a position (whole body, mind, environment) aren't pinned on the figure.
 */
export type BodyArea = { id: string; name: string; part: string; sided: boolean; x?: number; y?: number; xLeft?: number; one?: string };

export const BODY_AREAS: BodyArea[] = [
  { id: "head", name: "Head", part: "brain", sided: false, x: 150, y: 40 },
  { id: "eyes", name: "Eyes", one: "Eye", part: "eyes", sided: true, x: 138, y: 58, xLeft: 162 },
  { id: "ears", name: "Ears", one: "Ear", part: "ears", sided: true, x: 125, y: 64, xLeft: 175 },
  { id: "nose-throat", name: "Nose and throat", part: "airways", sided: false, x: 150, y: 80 },
  { id: "mouth", name: "Mouth and teeth", part: "airways", sided: false, x: 150, y: 70 },
  { id: "neck", name: "Neck", part: "bones", sided: false, x: 150, y: 108 },
  { id: "chest", name: "Chest", part: "heart", sided: false, x: 150, y: 168 },
  { id: "upper-back", name: "Upper back", part: "bones", sided: false, x: 150, y: 150 },
  { id: "lower-back", name: "Lower back", part: "bones", sided: false, x: 150, y: 262 },
  { id: "abdomen", name: "Abdomen", part: "gut", sided: false, x: 150, y: 240 },
  { id: "pelvis", name: "Pelvis and bladder", part: "kidneys", sided: false, x: 150, y: 300 },
  { id: "shoulder", name: "Shoulder", part: "muscles", sided: true, x: 96, y: 132, xLeft: 204 },
  { id: "arm", name: "Upper arm and elbow", part: "muscles", sided: true, x: 80, y: 210, xLeft: 220 },
  { id: "hand", name: "Wrist and hand", part: "muscles", sided: true, x: 60, y: 320, xLeft: 240 },
  { id: "hip", name: "Hip", part: "bones", sided: true, x: 116, y: 296, xLeft: 184 },
  { id: "thigh", name: "Thigh", part: "muscles", sided: true, x: 124, y: 370, xLeft: 176 },
  { id: "knee", name: "Knee", part: "muscles", sided: true, x: 126, y: 440, xLeft: 174 },
  { id: "lower-leg", name: "Lower leg", part: "muscles", sided: true, x: 128, y: 510, xLeft: 172 },
  { id: "foot", name: "Ankle and foot", part: "muscles", sided: true, x: 128, y: 596, xLeft: 172 },
  { id: "skin", name: "Skin (anywhere)", part: "skin", sided: false, x: 214, y: 260 },
  { id: "whole-body", name: "Whole body or general", part: "immune", sided: false },
  { id: "mind", name: "Mind, mood, sleep or team", part: "brain", sided: false },
  { id: "environment", name: "Cabin, suit or environment", part: "radiation", sided: false },
];

export const NOTE_KINDS = [
  { id: "pain", name: "Pain or ache" },
  { id: "injury", name: "Injury (cut, bruise, sprain, knock)" },
  { id: "swelling", name: "Swelling" },
  { id: "numbness", name: "Numbness, tingling or weakness" },
  { id: "stiffness", name: "Stiffness or less movement" },
  { id: "skin", name: "Rash, itch or skin change" },
  { id: "vision", name: "Vision change" },
  { id: "hearing-balance", name: "Hearing, dizziness or balance" },
  { id: "breathing", name: "Breathing trouble or cough" },
  { id: "headache", name: "Headache" },
  { id: "nausea-gut", name: "Nausea, vomiting or gut problem" },
  { id: "urinary", name: "Urinary or reproductive problem" },
  { id: "dental", name: "Tooth or mouth problem" },
  { id: "fever-infection", name: "Fever or infection" },
  { id: "bleeding", name: "Bleeding" },
  { id: "sleep", name: "Sleep problem" },
  { id: "mood-stress", name: "Mood, stress, focus or team problem" },
  { id: "exposure", name: "Exposure (radiation, chemical, smoke, dust, noise, heat, cold, pressure)" },
  { id: "fatigue", name: "Tiredness or low energy" },
  { id: "other", name: "Something else" },
] as const;
export type NoteKind = (typeof NOTE_KINDS)[number]["id"];

export type NoteUpdate = { id: string; severity: number; body?: string; photoPath?: string; photoAnalysis?: StoredAnalysis; createdAt: string };

export type BodyNote = {
  id: string;
  area: string;
  side?: "left" | "right" | "both";
  kind: NoteKind;
  severity: number;
  startedOn: string;
  notes?: string;
  photoPath?: string;
  photoAnalysis?: StoredAnalysis;
  topics?: string[];
  resolvedOn?: string;
  createdAt: string;
  updates?: NoteUpdate[];
};

export const areaOf = (id: string) => BODY_AREAS.find((a) => a.id === id);
export const kindName = (id: string) => NOTE_KINDS.find((k) => k.id === id)?.name ?? id;
export function noteTitle(n: Pick<BodyNote, "area" | "side" | "kind">) {
  const a = areaOf(n.area);
  const single = n.side === "left" || n.side === "right";
  const where = `${single ? `${n.side} ` : ""}${((single && a?.one) || a?.name || n.area).toLowerCase()}`;
  return `${kindName(n.kind).split(" (")[0]}: ${where}`;
}
export function pinOf(n: Pick<BodyNote, "area" | "side">) {
  const a = areaOf(n.area);
  if (!a || a.x === undefined || a.y === undefined) return undefined;
  return { x: n.side === "left" && a.xLeft !== undefined ? a.xLeft : a.x, y: a.y };
}

/** The most recent AI photo analysis for this problem, if any. */
export function latestAnalysis(n: BodyNote): StoredAnalysis | undefined {
  const all = [n.photoAnalysis, ...(n.updates ?? []).map((u) => u.photoAnalysis)].filter(Boolean) as StoredAnalysis[];
  return all.sort((a, b) => a.analyzedAt.localeCompare(b.analyzedAt)).at(-1);
}

/** Severity readings over time: the first report, then each update. */
export function severitySeries(n: BodyNote) {
  return [{ at: n.createdAt, severity: n.severity }, ...(n.updates ?? []).map((u) => ({ at: u.createdAt, severity: u.severity }))];
}
export const currentSeverity = (n: BodyNote) => severitySeries(n).at(-1)!.severity;

export type Trend = "new" | "better" | "worse" | "same";

export type Advice = {
  level: Escalation;
  headline: string;
  /** How to act at this distance from Earth (crew first on Mars missions). */
  howTo?: string;
  why: string[];
  selfCare: string[];
  watch: string[];
  links: { text: string; href: string }[];
  context?: { text: string; cite: Cite };
  /** Space-medicine topics this most likely relates to, from NASA's condition list. */
  related: { id: string; name: string; perMission?: number; cite: Cite }[];
  hazards: { id: Hazard; name: string }[];
  redFlags: string[];
  trend: Trend;
  /** A question worth taking to the flight surgeon, if any. */
  question?: string;
};

const RANK: Record<Escalation, number> = { none: 0, routine: 1, today: 2, now: 3 };
const raise = (a: Escalation, b: Escalation) => (RANK[b] > RANK[a] ? b : a);

const SELF_CARE: Record<NoteKind, string[]> = {
  pain: ["Rest the area and note what makes it better or worse.", "Add an update each day so you can see whether it's improving."],
  injury: ["Clean and cover cuts and scrapes promptly.", "For a sprain or bruise, rest it and use a cold pack in the first day or two if your mission has one.", "Watch for redness, warmth, pus or spreading pain, which can mean infection."],
  swelling: ["Note whether it's on one side or both, and whether it's getting bigger.", "Some puffiness in the face and thinner legs is expected in weightlessness as fluid shifts toward the head."],
  numbness: ["Note exactly where, when it started and whether it comes and goes.", "Avoid pressure on the area, such as tight straps or restraints."],
  stiffness: ["Gentle movement and stretching within your exercise plan.", "Warm up before resistance exercise."],
  skin: ["Keep the area clean and dry.", "Report a rash that spreads, blisters or comes with fever."],
  vision: ["Do the vision check so the change is recorded.", "Note whether it's near or far vision, one eye or both."],
  "hearing-balance": ["Move your head slowly, especially in the first days after a gravity change.", "Note when it happens and how long it lasts."],
  breathing: ["Note when it happens (rest, exercise, sleep) and any cough or fever.", "Check the cabin air readings and tell your crew."],
  headache: ["Drink water, rest and check the cabin CO₂ reading.", "Note when it started and what you were doing."],
  "nausea-gut": ["Sip fluids little and often and eat small amounts.", "Wash hands carefully to protect the crew."],
  urinary: ["Drink water steadily and note any pain, burning or blood."],
  dental: ["Keep brushing gently and avoid chewing on that side."],
  "fever-infection": ["Record your temperature every few hours, rest and drink fluids.", "Limit close contact with the crew."],
  bleeding: ["Apply firm, steady pressure with a clean dressing.", "Contain droplets so they don't float around the cabin."],
  sleep: ["Keep a regular sleep period in a dark, quiet, cool sleep station.", "Avoid screens and caffeine before sleep."],
  "mood-stress": ["Talk to a crewmate you trust, or ask for a private conference with your support team.", "Keep up exercise, routine and contact with home."],
  exposure: ["Follow your mission's emergency or contamination procedure first.", "Note what you were exposed to, when and for how long."],
  fatigue: ["Check your sleep, food and fluid intake.", "Record your heart rate and temperature."],
  other: ["Write down what you notice and when, and add an update if it changes."],
};

const KIND_LINKS: Partial<Record<NoteKind, { text: string; href: string }[]>> = {
  vision: [{ text: "Do the vision check", href: "/checkups/vision" }],
  stiffness: [{ text: "See your exercise plan", href: "/exercise" }],
  pain: [{ text: "Log it in today's daily log", href: "/log" }],
  breathing: [{ text: "Record your vitals", href: "/checkups/vitals" }],
  "fever-infection": [{ text: "Record your temperature", href: "/checkups/vitals" }],
  "mood-stress": [{ text: "Do the mood check-in", href: "/checkups/mood" }, { text: "Write in your journal", href: "/journal" }],
  sleep: [{ text: "Check your sleep in the sleep tool", href: "/tools#sleep" }],
  exposure: [{ text: "See My exposure", href: "/hazards" }],
};

const uniq = <T,>(xs: T[]) => [...new Set(xs)];

/** Everything the person has written about this problem. */
export function problemText(n: BodyNote) {
  return [n.notes ?? "", ...(n.updates ?? []).map((u) => u.body ?? "")].join(". ");
}

/**
 * Advice for one problem, using its description, every update, the trend in severity and NASA's
 * spaceflight condition list. General safety thresholds; not a diagnosis, and never medicine advice.
 */
export function adviceFor(note: BodyNote, history: BodyNote[], today: string, env?: Pick<MissionEnvironment, "id" | "commDelay">): Advice {
  const why: string[] = [];
  let level: Escalation = "none";
  const series = severitySeries(note);
  const s = series.at(-1)!.severity;
  const area = note.area;
  const k = note.kind;
  const open = !note.resolvedOn;

  // What the person wrote, read for topics and emergency warning signs.
  const written = analyzeText(problemText(note), area);
  // If they didn't write much, fall back to the area and type they picked (never for emergency signs).
  const picked = analyzeText(`${areaOf(area)?.name ?? ""} ${kindName(k)}`, area);
  const matches = written.matches.length ? written.matches : picked.matches;
  const best: Condition | undefined = matches[0]?.condition;

  if (written.redFlags.length) {
    level = "now";
    why.push(`You described ${written.redFlags.map((f) => f.label.toLowerCase()).join(" and ")}.`);
  }

  // Structured rules (area, type and severity).
  if (area === "chest" && (k === "pain" || k === "breathing") && s >= 4) { level = "now"; why.push("Chest pain, pressure or trouble breathing can be a sign of a heart or lung emergency."); }
  if (k === "breathing" && s >= 7) { level = "now"; why.push("Severe trouble breathing needs help straight away."); }
  if (area === "head" && k === "numbness") { level = "now"; why.push("Sudden numbness, weakness or confusion can be a sign of a stroke."); }
  if (k === "vision" && s >= 7) { level = "now"; why.push("A sudden, severe change in vision needs urgent assessment."); }
  if (k === "bleeding" && s >= 7) { level = "now"; why.push("Heavy bleeding needs help straight away."); }
  if (k === "exposure" && s >= 7) { level = "now"; why.push("A severe exposure needs your emergency procedure and the flight surgeon now."); }

  if (s >= 7) { level = raise(level, "today"); why.push(`You rated it ${s} out of 10, which is severe.`); }
  if (k === "vision") { level = raise(level, "today"); why.push("Vision changes in spaceflight can be linked to SANS, so NASA has them checked."); }
  if (area === "eyes" && k === "injury") { level = raise(level, "today"); why.push("Eye injuries need checking the same day, even small scratches."); }
  if (k === "numbness" && area !== "head") { level = raise(level, "today"); why.push("New numbness or weakness should be checked in case a nerve is involved."); }
  if (area === "head" && (k === "pain" || k === "headache") && s >= 6) { level = raise(level, "today"); why.push("A strong headache is worth reporting, especially if it's new or unusual for you."); }
  if (k === "swelling" && note.side && note.side !== "both" && ["lower-leg", "foot", "thigh"].includes(area)) { level = raise(level, "today"); why.push("Swelling in one leg should be checked the same day, in case of a blood clot."); }
  if (s >= 4 && s < 7) { level = raise(level, "routine"); why.push(`You rated it ${s} out of 10.`); }

  // What NASA's condition list says about the best match.
  // The more urgent of the two closest matches decides, so a serious possibility isn't hidden by a milder one.
  for (const { condition: c } of matches.slice(0, 2)) {
    if (RANK[c.level] > RANK[level] && (written.matches.length || c.level !== "now")) {
      level = c.level;
      why.push(`It sounds like ${c.name.toLowerCase()}, which is usually worth ${c.level === "now" ? "urgent help" : c.level === "today" ? "a same-day call" : "raising at your next check-in"}.`);
    }
  }

  // The user's own AI looked at a photo: it can raise the urgency, never lower it.
  const ai = latestAnalysis(note);
  if (ai && ai.isHealthPhoto) {
    if (RANK[ai.urgency] > RANK[level]) { level = ai.urgency; why.push(`Photo analysis: ${ai.urgencyReason}`); }
    if (ai.change === "worse") { level = raise(level, "routine"); why.push("Your latest photo looks worse than the earlier one."); }
  }

  // Ongoing problems: how it's changing.
  let trend: Trend = "new";
  const days = daysBetween(note.startedOn, note.resolvedOn ?? today);
  if (series.length > 1) {
    const first = series[0].severity, prev = series.at(-2)!.severity;
    trend = s > prev ? "worse" : s < first ? "better" : "same";
    if (s > prev) {
      level = raise(level, s - prev >= 3 || s >= 7 ? "today" : "routine");
      why.push(`It's worse since your last update (${prev} → ${s}).`);
    } else if (s < first) {
      why.push(`It's improving (${first} → ${s}).`);
    } else if (days >= 7 && s >= 3) {
      level = raise(level, "routine");
      why.push(`It hasn't improved in ${days} days (${first} → ${s}).`);
    }
  }
  if (open && days >= 14 && s > 0) { level = raise(level, "routine"); why.push(`It's been going on for ${days} days.`); }
  const earlier = history
    .filter((h) => h.id !== note.id && h.area === note.area && h.kind === note.kind && (h.side ?? "") === (note.side ?? "") && h.createdAt < note.createdAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (open && earlier) why.push(`You've reported this before (since ${earlier.startedOn}).`);

  if (!open) { level = "none"; why.length = 0; why.push("Marked as resolved."); }

  const part = BODY_PARTS.find((p) => p.id === areaOf(area)?.part);
  const contact = contactText(level, env);
  const headline = level === "none" ? (open ? "Keep an eye on it" : "Resolved") : contact.title;

  const fromPhoto = (ai?.isHealthPhoto ? ai.conditionIds : []).map((id) => CONDITIONS.find((c) => c.id === id)).filter((c): c is Condition => Boolean(c));
  const relatedConditions = [...matches.slice(0, 3).map((m) => m.condition), ...fromPhoto].filter((c, i, all) => all.findIndex((x) => x.id === c.id) === i).slice(0, 4);
  const related = relatedConditions.map((c) => ({ id: c.id, name: c.name, perMission: c.perMission, cite: conditionCite(c) }));
  return {
    level,
    headline,
    howTo: level === "none" ? undefined : contact.body,
    why: why.length ? uniq(why) : ["Mild, recent and not getting worse."],
    selfCare: open ? uniq([...(best?.care ?? []), ...SELF_CARE[k]]).slice(0, 5) : [],
    watch: open ? uniq([...(ai?.isHealthPhoto ? ai.warningSigns : []), ...matches.slice(0, 2).flatMap((m) => m.condition.watch)]).slice(0, 6) : [],
    links: open ? uniq([...(best?.links ?? []), ...(KIND_LINKS[k] ?? []), ...(part ? [{ text: `Learn about ${part.name.toLowerCase()} in space`, href: `/body?part=${part.id}` }] : [])].map((l) => JSON.stringify(l))).map((l) => JSON.parse(l)).slice(0, 4) : [],
    context: best?.fact ?? part?.effects[0],
    related,
    hazards: uniq(matches.slice(0, 2).flatMap((m) => m.condition.hazards)).map((h) => ({ id: h, name: HAZARDS[h].name })),
    redFlags: written.redFlags.map((f) => f.label),
    trend,
    question: open && RANK[level] >= RANK.routine
      ? `${best ? `${best.name}? ` : ""}${noteTitle(note)}, ${s}/10 since ${note.startedOn}${trend === "worse" ? ", getting worse" : trend === "same" && series.length > 1 ? ", not improving" : ""}: what should I watch for, and does it affect my exercise or duties?`
      : undefined,
  };
}

export const ESCALATION_RANK = RANK;

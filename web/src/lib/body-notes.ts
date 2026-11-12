import type { Escalation } from "@/lib/checkups";
import { BODY_PARTS, type Cite } from "@/lib/body";
import { daysBetween } from "@/lib/dates";

/** Where on the body a note can be pinned. x/y are on the 300 × 640 front-view figure (the figure's left is the person's right). */
export type BodyArea = { id: string; name: string; part: string; sided: boolean; x: number; y: number; xLeft?: number; one?: string };

export const BODY_AREAS: BodyArea[] = [
  { id: "head", name: "Head", part: "brain", sided: false, x: 150, y: 40 },
  { id: "eyes", name: "Eyes", one: "Eye", part: "eyes", sided: true, x: 138, y: 58, xLeft: 162 },
  { id: "ears", name: "Ears", one: "Ear", part: "ears", sided: true, x: 125, y: 64, xLeft: 175 },
  { id: "nose-throat", name: "Nose and throat", part: "airways", sided: false, x: 150, y: 76 },
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
];

export const NOTE_KINDS = [
  { id: "pain", name: "Pain or ache" },
  { id: "injury", name: "Injury (cut, bruise, sprain)" },
  { id: "swelling", name: "Swelling" },
  { id: "numbness", name: "Numbness, tingling or weakness" },
  { id: "stiffness", name: "Stiffness or less movement" },
  { id: "skin", name: "Rash, itch or skin change" },
  { id: "vision", name: "Vision change" },
  { id: "hearing-balance", name: "Hearing, dizziness or balance" },
  { id: "breathing", name: "Breathing trouble or cough" },
  { id: "other", name: "Something else" },
] as const;
export type NoteKind = (typeof NOTE_KINDS)[number]["id"];

export type BodyNote = {
  id: string;
  area: string;
  side?: "left" | "right" | "both";
  kind: NoteKind;
  severity: number;
  startedOn: string;
  notes?: string;
  resolvedOn?: string;
  createdAt: string;
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
  if (!a) return undefined;
  return { x: n.side === "left" && a.xLeft !== undefined ? a.xLeft : a.x, y: a.y };
}

export type Advice = {
  level: Escalation;
  headline: string;
  why: string[];
  selfCare: string[];
  links: { text: string; href: string }[];
  context?: { text: string; cite: Cite };
  /** A question worth taking to the flight surgeon, if any. */
  question?: string;
};

const RANK: Record<Escalation, number> = { none: 0, routine: 1, today: 2, now: 3 };
const raise = (a: Escalation, b: Escalation) => (RANK[b] > RANK[a] ? b : a);

const SELF_CARE: Record<NoteKind, string[]> = {
  pain: ["Rest the area and note what makes it better or worse.", "Update this note each day so you can see whether it's improving."],
  injury: ["Clean and cover cuts and scrapes promptly.", "For a sprain or bruise, rest it and use a cold pack in the first day or two if your mission has one.", "Watch for redness, warmth, pus or spreading pain, which can mean infection."],
  swelling: ["Note whether it's on one side or both, and whether it's getting bigger.", "Some puffiness in the face and thinner legs is expected in weightlessness as fluid shifts toward the head."],
  numbness: ["Note exactly where, when it started and whether it comes and goes.", "Avoid pressure on the area, such as tight straps or restraints."],
  stiffness: ["Gentle movement and stretching within your exercise plan.", "Warm up before resistance exercise."],
  skin: ["Keep the area clean and dry.", "Report a rash that spreads, blisters or comes with fever."],
  vision: ["Do the vision check so the change is recorded.", "Note whether it's near or far vision, one eye or both."],
  "hearing-balance": ["Move your head slowly, especially in the first days after a gravity change.", "Note when it happens and how long it lasts."],
  breathing: ["Note when it happens (rest, exercise, sleep) and any cough or fever.", "Headaches with breathing changes can be linked to cabin CO₂; tell your crew and flight surgeon."],
  other: ["Write down what you notice and when, and update the note if it changes."],
};

const LINKS: Partial<Record<NoteKind, { text: string; href: string }[]>> = {
  vision: [{ text: "Do the vision check", href: "/checkups/vision" }],
  stiffness: [{ text: "See your exercise plan", href: "/exercise" }],
  pain: [{ text: "Log it in today's daily log", href: "/log" }],
  injury: [{ text: "Log it in today's daily log", href: "/log" }],
  breathing: [{ text: "Record your vitals", href: "/checkups/vitals" }],
};

/** Rule-based advice for one body note, using general safety thresholds. Not a diagnosis, and never medicine advice. */
export function adviceFor(note: BodyNote, history: BodyNote[], today: string): Advice {
  const why: string[] = [];
  let level: Escalation = "none";
  const s = note.severity;
  const area = note.area;
  const k = note.kind;

  // Red flags: possible emergencies.
  if (area === "chest" && (k === "pain" || k === "breathing") && s >= 4) { level = "now"; why.push("Chest pain, pressure or trouble breathing can be a sign of a heart or lung emergency."); }
  if (k === "breathing" && s >= 7) { level = "now"; why.push("Severe trouble breathing needs help straight away."); }
  if (area === "head" && k === "numbness") { level = "now"; why.push("Sudden numbness, weakness or confusion can be a sign of a stroke."); }
  if (k === "vision" && s >= 7) { level = "now"; why.push("A sudden, severe change in vision needs urgent assessment."); }

  // Same day.
  if (s >= 7 && RANK[level] < RANK.today) { level = raise(level, "today"); why.push(`You rated it ${s} out of 10, which is severe.`); }
  if (k === "vision") { level = raise(level, "today"); why.push("Vision changes in spaceflight can be linked to SANS, so NASA has them checked."); }
  if (area === "eyes" && k === "injury") { level = raise(level, "today"); why.push("Eye injuries need checking the same day, even small scratches."); }
  if (k === "numbness" && area !== "head") { level = raise(level, "today"); why.push("New numbness or weakness should be checked in case a nerve is involved."); }
  if (area === "head" && k === "pain" && s >= 6) { level = raise(level, "today"); why.push("A strong headache is worth reporting, especially if it's new or unusual for you."); }

  // Next check-in.
  if (s >= 4 && s < 7) { level = raise(level, "routine"); why.push(`You rated it ${s} out of 10.`); }
  const open = !note.resolvedOn;
  const days = daysBetween(note.startedOn, note.resolvedOn ?? today);
  if (open && days >= 14) { level = raise(level, "routine"); why.push(`It's been going on for ${days} days.`); }
  const earlier = history
    .filter((h) => h.id !== note.id && h.area === note.area && h.kind === note.kind && (h.side ?? "") === (note.side ?? "") && h.createdAt < note.createdAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (open && earlier && note.severity > earlier.severity) { level = raise(level, "routine"); why.push(`It's worse than your last note (${earlier.severity} → ${note.severity}).`); }
  if (open && (k === "swelling") && note.side && note.side !== "both" && ["lower-leg", "foot", "thigh"].includes(area)) { level = raise(level, "today"); why.push("Swelling in one leg should be checked the same day, in case of a blood clot."); }

  if (!open) { level = "none"; why.length = 0; why.push("Marked as resolved."); }

  const part = BODY_PARTS.find((p) => p.id === areaOf(area)?.part);
  const headline = {
    now: "Contact your flight surgeon or emergency services now",
    today: "Contact your flight surgeon today",
    routine: "Bring this up at your next check-in",
    none: open ? "Keep an eye on it" : "Resolved",
  }[level];

  return {
    level,
    headline,
    why: why.length ? why : ["Mild, recent and not getting worse."],
    selfCare: open ? SELF_CARE[k] : [],
    links: open ? [...(LINKS[k] ?? []), ...(part ? [{ text: `Learn about ${part.name.toLowerCase()} in space`, href: `/body?part=${part.id}` }] : [])] : [],
    context: part?.effects[0],
    question: open && RANK[level] >= RANK.routine ? `${noteTitle(note)}, ${s}/10 since ${note.startedOn}: what should I watch for, and does it affect my exercise or duties?` : undefined,
  };
}

export const ESCALATION_RANK = RANK;

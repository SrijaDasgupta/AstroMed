/**
 * Rules for the balance and stand-up test, the after-spacewalk check and the weekly immune check.
 * Orthostatic limits (heart rate up 30 bpm or more, systolic down 20 mmHg or more after 3 minutes
 * standing) are general clinical thresholds, not NASA values. Pure functions.
 */
import type { Answers, Finding } from "@/lib/checkups";

const num = (a: Answers, k: string) => (typeof a[k] === "number" ? (a[k] as number) : undefined);
const yes = (a: Answers, k: string) => a[k] === true;

export function balanceFindings(a: Answers): Finding[] {
  const f: Finding[] = [];
  const hrL = num(a, "hrLying"), hrS = num(a, "hrStanding"), sysL = num(a, "sysLying"), sysS = num(a, "sysStanding");
  if (yes(a, "fainted")) f.push({ level: "today", text: "You fainted or nearly fainted on standing. Sit or lie down before standing, stand up slowly, drink fluids, and don't climb ladders or drive until you've spoken to the flight surgeon. If it came with chest pain or a racing heartbeat, contact now." });
  if (hrL !== undefined && hrS !== undefined && hrS - hrL >= 30) f.push({ level: "today", text: `Heart rate rose ${hrS - hrL} bpm on standing (${hrL} → ${hrS}). A rise of 30 or more is a sign of orthostatic intolerance, common after a gravity change. Stand up slowly and keep up fluids.` });
  if (sysL !== undefined && sysS !== undefined && sysL - sysS >= 20) f.push({ level: "today", text: `Systolic blood pressure fell ${sysL - sysS} mmHg on standing (${sysL} → ${sysS}). A drop of 20 or more is orthostatic hypotension and raises the risk of fainting.` });
  if (yes(a, "dizzyStanding") && !yes(a, "fainted")) f.push({ level: "routine", text: "Dizzy or light-headed on standing. Stand up in stages and drink fluids; mention it if it continues." });
  const one = num(a, "singleLegSec"), tandem = num(a, "tandemSec");
  const short = [one !== undefined && one < 10 && `one leg ${one} s`, tandem !== undefined && tandem < 10 && `heel-to-toe ${tandem} s`].filter(Boolean);
  if (short.length) f.push({ level: "routine", text: `Balance is reduced (${short.join(", ")}; under 10 s). Take extra care on ladders, hatches and uneven ground, hold handrails, and avoid driving a rover until it improves.` });
  if (yes(a, "tiredBreathless")) f.push({ level: "routine", text: "Unusually tired or out of breath with light effort. Spaceflight speeds up red blood cell destruction (space anemia), which adds to dizziness and fatigue after landing; ask for a blood count. Breathless at rest or chest pain: contact now." });
  if (yes(a, "vertigo")) f.push({ level: "routine", text: "Spinning, motion sickness or misjudging movement. Your balance system is still adapting: move your head slowly and avoid tasks where a fall or misjudgment is dangerous." });
  if (f.length === 0 && (hrL !== undefined || one !== undefined || tandem !== undefined)) f.push({ level: "none", text: "No signs of orthostatic intolerance or reduced balance in this test." });
  return f;
}

export function afterEvaFindings(a: Answers): Finding[] {
  const f: Finding[] = [];
  const serious = ["dcsNeuro", "dcsChokes", "dcsBrain"].filter((k) => yes(a, k));
  const mild = ["dcsJoint", "dcsSkin"].filter((k) => yes(a, k));
  if (serious.length) f.push({ level: "now", text: "Possible serious decompression sickness (nerve, chest or brain symptoms). Tell your crew now and contact the flight surgeon: treatment means getting back to higher pressure and oxygen as soon as possible." });
  else if (mild.length) f.push({ level: "now", text: `Possible decompression sickness (${mild.map((k) => (k === "dcsJoint" ? "joint pain" : "skin changes")).join(" and ")}). Tell your crew now: treatment works best when it starts quickly, even for symptoms that seem mild.` });
  if (yes(a, "handInjury")) f.push({ level: "routine", text: "Finger or nail injury from the gloves. Keep nails short, report it to the flight surgeon, and flag the glove fit before the next spacewalk. Numbness that hasn't gone by tomorrow: contact today." });
  if (yes(a, "suitRub")) f.push({ level: "routine", text: "Suit rubbing or pressure marks. Keep the skin clean and dry, watch for infection, and report the location so padding can be adjusted." });
  if (num(a, "evaTired") === 5) f.push({ level: "routine", text: "Exhausted after the spacewalk. Eat and drink to make up for it (spacewalks add about 200 kcal an hour) and protect your next sleep period." });
  if (f.length === 0) f.push({ level: "none", text: "No signs of decompression sickness or suit injury. If anything changes in the next 24 hours, do this check again." });
  return f;
}

export function immuneFindings(a: Answers): Finding[] {
  const f: Finding[] = [];
  if (yes(a, "imShingles")) f.push({ level: "today", text: "A painful band of rash or blisters on one side of the body can be shingles, a reawakened virus. Contact the flight surgeon today and keep the area covered." });
  if (yes(a, "imWound")) f.push({ level: "today", text: "A cut that's slow to heal, red, warm or oozing may be infected. Clean and cover it and contact the flight surgeon today." });
  if (yes(a, "imUrine")) f.push({ level: "today", text: "Burning when passing urine can be a urinary infection. Drink plenty and contact the flight surgeon today." });
  if (yes(a, "imColdSore")) f.push({ level: "routine", text: "Cold sores or mouth ulcers. Stress in spaceflight can wake dormant viruses; mention it at your next conference, and report it if it spreads." });
  if (yes(a, "imRash")) f.push({ level: "routine", text: "A rash or itchy skin. Report it if it spreads, blisters or looks infected." });
  if (yes(a, "imGut")) f.push({ level: "routine", text: "Stomach upset lasting more than a day. Keep drinking; contact the flight surgeon today if you can't keep fluids down or see blood." });
  if (yes(a, "imCold")) f.push({ level: "none", text: "Cold or sore throat symptoms. Take your temperature, wash hands often, and avoid sharing food and drink with crewmates." });
  if (a.imCleaned === false) f.push({ level: "none", text: "This week's cleaning isn't done yet. Cleaning hygiene and food areas controls microbes in a closed cabin." });
  if (f.length === 0) f.push({ level: "none", text: "No signs of infection or reawakened viruses this week." });
  return f;
}

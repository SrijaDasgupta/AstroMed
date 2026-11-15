/**
 * Speed-of-processing drill, modelled on the "useful field of view" style of training used in the
 * ACTIVE and INHANCE trials: identify the object in the centre and, at the same time, where a target
 * appeared at the edge of vision. The display time adapts (2 right in a row: shorter; a miss: longer),
 * so the drill stays hard as the person gets faster. Pure functions, no I/O.
 */
import type { Answers, Finding } from "@/lib/checkups";

export const START_MS = 500;
export const MIN_MS = 33;
export const MAX_MS = 1000;
/** From this display time on, distractor shapes surround the target. */
export const DISTRACTOR_MS = 200;
export const POSITIONS = 8;
export const CENTRE = ["rocket", "satellite"] as const;
export type Centre = (typeof CENTRE)[number];

export type Trial = { displayMs: number; centre: Centre; position: number; distractors: boolean };
export type Answer = { centre: Centre; position: number };

/** Next display time after a trial. `streak` is the run of correct answers including this one. */
export function nextDisplay(ms: number, correct: boolean, streak: number) {
  if (!correct) return Math.min(MAX_MS, Math.round(ms * 1.2));
  if (streak % 2 === 0) return Math.max(MIN_MS, Math.round(ms * 0.85));
  return ms;
}

export function makeTrial(displayMs: number, rand = Math.random): Trial {
  return {
    displayMs,
    centre: CENTRE[Math.floor(rand() * CENTRE.length)],
    position: Math.floor(rand() * POSITIONS),
    distractors: displayMs <= DISTRACTOR_MS,
  };
}

export const isCorrect = (t: Trial, a: Answer) => t.centre === a.centre && t.position === a.position;

export type DrillResult = { sdThresholdMs: number; sdAccuracy: number; sdTrials: number; sdMinutes: number };

/** Summary: the median display time over the last 10 trials (the level reached), accuracy and time spent. */
export function summarizeDrill(trials: { displayMs: number; correct: boolean }[], minutes: number): DrillResult | undefined {
  if (trials.length < 5) return undefined;
  const last = trials.slice(-10).map((t) => t.displayMs).sort((a, b) => a - b);
  const mid = Math.floor(last.length / 2);
  const median = last.length % 2 ? last[mid] : (last[mid - 1] + last[mid]) / 2;
  return {
    sdThresholdMs: Math.round(median),
    sdAccuracy: Math.round((trials.filter((t) => t.correct).length / trials.length) * 100),
    sdTrials: trials.length,
    sdMinutes: Math.max(1, Math.round(minutes)),
  };
}

/** Feedback compared with earlier sessions (most recent first). Training only: never an alert. */
export function drillFindings(a: Answers, priorThresholds: number[]): Finding[] {
  const ms = typeof a.sdThresholdMs === "number" ? a.sdThresholdMs : undefined;
  const minutes = typeof a.sdMinutes === "number" ? a.sdMinutes : 0;
  if (ms === undefined) return [];
  const f: Finding[] = [];
  const best = priorThresholds.length ? Math.min(...priorThresholds) : undefined;
  if (best === undefined) f.push({ level: "none", text: `First session: you reached a ${ms} ms display time. Lower is faster; aim for 2–3 sessions a week.` });
  else if (ms < best) f.push({ level: "none", text: `New best: ${ms} ms, down from ${best} ms.` });
  else f.push({ level: "none", text: `You reached ${ms} ms (your best is ${best} ms). Day-to-day ups and downs are normal; sleep and stress affect speed.` });
  const total = priorThresholds.length + 1;
  f.push({ level: "none", text: minutes >= 10 ? `${minutes} minutes of training: today's brain health habit is done.` : `${minutes} minute${minutes === 1 ? "" : "s"} of training. Sessions of 10 minutes or more count as today's brain health habit.` });
  if (total >= 3) f.push({ level: "none", text: `${total} sessions so far. The research protocol is 10–15 hours over 5–6 weeks, then regular top-ups.` });
  return f;
}

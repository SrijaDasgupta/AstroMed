/**
 * The 3-minute psychomotor vigilance test (PVT-B, Basner et al. 2011, reviewed in NASA's Sleep
 * evidence report p. 25): stimuli 1–4 s apart, responses of 355 ms or slower count as lapses and
 * taps under 100 ms (or before the stimulus) as false starts. Pure functions.
 */
import type { Answers, Finding } from "@/lib/checkups";

export const TEST_MS = 3 * 60 * 1000;
export const LAPSE_MS = 355;
export const FALSE_START_MS = 100;
/** A response this slow means the person looked away; the trial ends and counts as a lapse. */
export const TIMEOUT_MS = 10_000;

/** Wait before the next stimulus: 1–4 s, as in PVT-B. */
export function nextDelay(rand = Math.random) {
  return 1000 + Math.floor(rand() * 3000);
}

export type ReactionResult = { rtMedianMs: number; rtLapses: number; rtFalseStarts: number; rtTrials: number; rtMeanMs: number; fastest: number; slowest: number };

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Summarize the reaction times (ms) of valid responses plus the false-start count. */
export function summarize(rts: number[], falseStarts: number): ReactionResult | undefined {
  if (rts.length === 0) return undefined;
  return {
    rtMedianMs: Math.round(median(rts)),
    rtLapses: rts.filter((t) => t >= LAPSE_MS).length,
    rtFalseStarts: falseStarts,
    rtTrials: rts.length,
    rtMeanMs: Math.round(rts.reduce((a, b) => a + b, 0) / rts.length),
    fastest: Math.round(Math.min(...rts)),
    slowest: Math.round(Math.max(...rts)),
  };
}

/** How many earlier results are needed before comparing with the person's own usual speed. */
export const MIN_PRIOR = 3;

/**
 * Findings for a reaction test, compared with the person's own earlier medians (most recent first).
 * Never urgent on its own: slowing is a prompt to look at sleep, workload and cabin CO₂.
 */
export function reactionFindings(a: Answers, priorMedians: number[]): Finding[] {
  const f: Finding[] = [];
  const med = typeof a.rtMedianMs === "number" ? a.rtMedianMs : undefined;
  const lapses = typeof a.rtLapses === "number" ? a.rtLapses : 0;
  const falseStarts = typeof a.rtFalseStarts === "number" ? a.rtFalseStarts : 0;
  if (med === undefined) return f;
  const causes = "Common causes are short sleep, a shifted schedule, heavy workload, high cabin CO₂ or feeling unwell.";
  const prior = priorMedians.slice(0, 10);
  if (prior.length >= MIN_PRIOR) {
    const usual = median(prior);
    const slower = (med - usual) / usual;
    if (slower >= 0.2) f.push({ level: "routine", text: `Median reaction time ${med} ms is ${Math.round(slower * 100)}% slower than your usual ${Math.round(usual)} ms. ${causes} Avoid safety-critical tasks if you feel drowsy, and mention it if it continues.` });
    else if (slower >= 0.1) f.push({ level: "none", text: `Median reaction time ${med} ms is a little slower than your usual ${Math.round(usual)} ms.` });
    else f.push({ level: "none", text: `Median reaction time ${med} ms, in line with your usual ${Math.round(usual)} ms.` });
  } else {
    f.push({ level: "none", text: `Median reaction time ${med} ms. After ${MIN_PRIOR} tests AstroMed compares each result with your own usual speed.` });
  }
  if (lapses >= 5) f.push({ level: "routine", text: `${lapses} lapses (responses of 355 ms or slower). Several lapses in 3 minutes is a typical sign of sleepiness. ${causes}` });
  if (med >= 500 && lapses < 5) f.push({ level: "routine", text: `A median of ${med} ms is slow for this test. ${causes}` });
  if (falseStarts >= 5) f.push({ level: "none", text: `${falseStarts} false starts (tapping before the light). Results are less reliable; try again when you can focus.` });
  return f;
}

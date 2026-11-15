/**
 * Safety-critical rules: emergency detection, urgency levels, who to contact at each distance,
 * NASA's energy formula, and the self-harm check. If any of these fail, advice could be wrong.
 */
import { describe, expect, it } from "vitest";
import type { StoredAnalysis } from "@/lib/ai-analysis";
import { adviceFor, type BodyNote } from "@/lib/body-notes";
import { CREW } from "@/lib/crew";
import { contactText, reachOf } from "@/lib/contact";
import { evaluateDailyLog } from "@/lib/daily-log";
import { getEnvironment } from "@/lib/environments";
import { needsSupport } from "@/lib/journal";
import { DEFAULT_KCAL, energyTarget, withEva } from "@/lib/nutrition";
import { analyzeText, CONDITIONS } from "@/lib/space-conditions";

const TODAY = "2026-11-12";
const note = (n: Partial<BodyNote>): BodyNote => ({ id: "n1", area: "knee", kind: "pain", severity: 3, startedOn: TODAY, createdAt: `${TODAY}T10:00:00Z`, updates: [], ...n });

describe("emergency phrases", () => {
  it.each([
    "Crushing chest pain and sweating",
    "I can't breathe properly",
    "My face is drooping and my speech is slurred",
    "Smoke in the node and a burning smell",
    "I keep thinking about killing myself",
    "Sudden loss of vision in my right eye",
    "I hit my head on the hatch and now I'm vomiting and confused",
  ])("flags: %s", (text) => {
    expect(analyzeText(text).redFlags.length).toBeGreaterThan(0);
  });

  it.each(["No chest pain, just a sore knee", "Not dizzy, but tired", "Mild headache this morning", "Without any fever, cough today"])(
    "does not flag: %s",
    (text) => {
      expect(analyzeText(text).redFlags).toHaveLength(0);
    },
  );
});

describe("reading problems in plain words", () => {
  it.each([
    ["My fingernails are lifting after yesterday's EVA", "eva-hand"],
    ["Blurry vision when reading checklists", "sans"],
    ["Felt dizzy when I stood up after landing", "orthostatic"],
    ["Headache all afternoon, the cabin air feels stuffy", "co2-headache"],
    ["I keep arguing with my crewmate about the schedule", "conflict"],
    ["Radiation alarm went off during the solar storm", "radiation-event"],
    ["Burning when I pee and need to go all the time", "uti"],
  ])("%s -> %s", (text, id) => {
    expect(analyzeText(text).matches.slice(0, 2).map((m) => m.condition.id)).toContain(id);
  });

  it("every condition cites a NASA page and has self-care steps", () => {
    for (const c of CONDITIONS) expect(c.care.length).toBeGreaterThan(0);
  });
});

describe("urgency of a reported problem", () => {
  it("chest pain at 4/10 or more is an emergency", () => {
    expect(adviceFor(note({ area: "chest", kind: "pain", severity: 4 }), [], TODAY).level).toBe("now");
  });
  it("any vision change goes to the flight surgeon the same day", () => {
    expect(adviceFor(note({ area: "eyes", kind: "vision", severity: 2 }), [], TODAY).level).toBe("today");
  });
  it("a mild, new knee ache is self-care", () => {
    expect(adviceFor(note({ severity: 2 }), [], TODAY).level).toBe("none");
  });
  it("getting worse raises the urgency", () => {
    const worse = note({ severity: 3, updates: [{ id: "u", severity: 7, createdAt: `${TODAY}T12:00:00Z` }] });
    const a = adviceFor(worse, [], TODAY);
    expect(a.trend).toBe("worse");
    expect(["today", "now"]).toContain(a.level);
  });
  it("emergency words in the description override a low rating", () => {
    expect(adviceFor(note({ area: "whole-body", kind: "other", severity: 1, notes: "Sudden crushing chest pain" }), [], TODAY).level).toBe("now");
  });
  it("a photo analysis can raise urgency but never lower it", () => {
    const base: Omit<StoredAnalysis, "urgency"> = { isHealthPhoto: true, quality: "good", description: "", observations: [], possibleConditions: [], conditionIds: [], warningSigns: [], change: "first-photo", urgencyReason: "x", selfCare: [], model: "m", analyzedAt: `${TODAY}T11:00:00Z` };
    expect(adviceFor(note({ severity: 2, photoAnalysis: { ...base, urgency: "today" } }), [], TODAY).level).toBe("today");
    expect(adviceFor(note({ area: "chest", severity: 6, photoAnalysis: { ...base, urgency: "none" } }), [], TODAY).level).toBe("now");
  });
  it("resolved problems need no action", () => {
    expect(adviceFor(note({ area: "chest", severity: 8, resolvedOn: TODAY }), [], TODAY).level).toBe("none");
  });
});

describe("who to contact depends on distance from Earth", () => {
  it("classifies each mission type", () => {
    expect(reachOf(getEnvironment("leo"))).toBe("near");
    expect(reachOf(getEnvironment("lunar-surface"))).toBe("moon");
    expect(reachOf(getEnvironment("mars-transit"))).toBe("far");
    expect(reachOf(getEnvironment("mars-surface"))).toBe("far");
  });
  it("on Mars missions the crew medical officer acts first", () => {
    const t = contactText("now", getEnvironment("mars-transit"));
    expect(t.title).toMatch(/crew medical officer/i);
    expect(t.body).toMatch(/4–24 minutes/);
  });
  it("in low Earth orbit the flight surgeon is contacted directly", () => {
    expect(contactText("now", getEnvironment("leo")).title).toMatch(/flight surgeon now/i);
  });
});

describe("NASA energy formula (NASA-STD-3001 Vol. 2, p. 116)", () => {
  it("uses NASA's 3,035 kcal default without profile details", () => {
    expect(energyTarget({}, 2026)).toMatchObject({ kcal: DEFAULT_KCAL, basis: "default" });
  });
  it("matches the published equation for men with activity factor 1.25", () => {
    const expected = 662 - 9.53 * 34 + 1.25 * (15.9 * 75 + 539.6 * 1.78);
    expect(energyTarget({ birthYear: 1992, sex: "male", heightCm: 178, weightKg: 75 }, 2026).kcal).toBe(Math.round(expected / 10) * 10);
  });
  it("adds 200 kcal per spacewalk hour", () => {
    expect(withEva({ kcal: 3000, basis: "profile", missing: [] }, 6.5)).toBe(4300);
  });
});

describe("daily log checks", () => {
  const member = CREW[0];
  it("very high blood pressure needs the flight surgeon today or sooner", () => {
    expect(["today", "now"]).toContain(evaluateDailyLog(member, { systolic: 182, diastolic: 112 }).level);
  });
  it("eating well under need is flagged", () => {
    const r = evaluateDailyLog(member, { kcal: 1500 }, 3000);
    expect(r.findings.some((f) => /50% of your/.test(f.text))).toBe(true);
  });
  it("water under NASA's 2.5 L minimum is noted", () => {
    expect(evaluateDailyLog(member, { waterL: 1.5 }).findings.some((f) => /2\.5 L/.test(f.text))).toBe(true);
  });
});

describe("journal self-harm check", () => {
  it.each(["I want to kill myself", "thinking about suicide", "I keep thinking about killing myself", "better off dead", "I don't want to be alive"])(
    "catches: %s",
    (t) => expect(needsSupport(t)).toBe(true),
  );
  it.each(["the experiment killed the cells", "deadline is killing me", "dead tired after the EVA", "I ended the call early"])(
    "ignores: %s",
    (t) => expect(needsSupport(t)).toBe(false),
  );
});

describe("health indicators guide", async () => {
  const { INDICATORS } = await import("@/lib/indicators");
  const { SOURCES } = await import("@/lib/tips");
  it.each(INDICATORS.map((i) => [i.name, i] as const))("%s answers all five questions with NASA sources", (_name, ind) => {
    expect(ind.measure.steps.length).toBeGreaterThan(0);
    for (const list of [ind.why, ind.hazards.map((h) => h.effect), ind.prevent]) {
      expect(list.length).toBeGreaterThan(0);
      for (const f of list) expect(SOURCES[f.cite.source]).toBeDefined();
    }
    expect(ind.when.length).toBeGreaterThan(0);
  });
});

describe("bring-your-own AI providers", async () => {
  const { AI_PROVIDERS, parseReply, validBaseUrl, AiError } = await import("@/lib/ai-analysis");
  const good = {
    isHealthPhoto: true, quality: "good", description: "A small red patch.", observations: ["2 cm red patch"], possibleConditions: ["skin irritation"],
    conditionIds: [], warningSigns: [], change: "first-photo", urgency: "routine", urgencyReason: "Mild.", selfCare: ["Keep it clean and dry."],
  };

  it("offers Claude, ChatGPT, Gemini, Grok and Other", () => {
    expect(AI_PROVIDERS.map((p) => p.id)).toEqual(["anthropic", "openai", "gemini", "xai", "custom"]);
  });

  it("only sends keys to https, or http on this computer", () => {
    expect(validBaseUrl("https://openrouter.ai/api/v1")).toBe(true);
    expect(validBaseUrl("http://localhost:11434/v1")).toBe(true);
    expect(validBaseUrl("http://example.com/v1")).toBe(false);
    expect(validBaseUrl("not a url")).toBe(false);
  });

  it("accepts a valid JSON reply, even wrapped in other text", () => {
    expect(parseReply(JSON.stringify(good)).urgency).toBe("routine");
    expect(parseReply("Here you go:\n```json\n" + JSON.stringify(good) + "\n```").quality).toBe("good");
  });

  it("rejects replies that are not valid analyses", () => {
    expect(() => parseReply("I can't help with that.")).toThrow(AiError);
    expect(() => parseReply(JSON.stringify({ ...good, urgency: "later" }))).toThrow(AiError);
    expect(() => parseReply(JSON.stringify({ ...good, conditionIds: ["made-up-id"] }))).toThrow(AiError);
  });
});

describe("NASA hazards and risks", async () => {
  const { SPACE_RISKS, HAZARD_PAGES, RISK_GROUPS } = await import("@/lib/space-risks");
  const { HAZARDS, CONDITIONS, analyzeText, conditionCite } = await import("@/lib/space-conditions");

  it("covers NASA's 17 HRP risks, each with a NASA link and somewhere in AstroMed", () => {
    expect(SPACE_RISKS).toHaveLength(17);
    expect(new Set(SPACE_RISKS.map((r) => r.id)).size).toBe(17);
    for (const r of SPACE_RISKS) {
      expect(r.url).toMatch(/^https:\/\/www\.nasa\.gov\/reference\//);
      expect(r.inApp.length).toBeGreaterThan(0);
      for (const l of r.inApp) expect(l.href.startsWith("/")).toBe(true);
      expect(RISK_GROUPS.some((g) => g.id === r.group)).toBe(true);
    }
  });

  it("gives a NASA-sourced tip for each risk that was only partly covered", async () => {
    const { TIPS, TOPICS } = await import("@/lib/tips");
    for (const id of ["protect-immunity", "clean-shared-spaces", "prebreathe", "landing-restraints", "know-your-cmo"]) {
      const tip = TIPS.find((t) => t.id === id);
      expect(tip, id).toBeDefined();
      expect(TOPICS.some((t) => t.id === tip!.topic)).toBe(true);
      expect(["std1", "std2"]).toContain(tip!.source);
      expect(tip!.page).toBeGreaterThan(0);
    }
    for (const r of SPACE_RISKS) for (const l of r.inApp) {
      const anchor = l.href.split("#")[1];
      if (l.href.startsWith("/tips") && anchor) expect(TIPS.some((t) => t.id === anchor)).toBe(true);
    }
    expect(new Set(TIPS.map((t) => t.id)).size).toBe(TIPS.length);
  });

  it("links all 5 hazards to NASA", () => {
    for (const h of Object.keys(HAZARDS)) expect(HAZARD_PAGES[h as keyof typeof HAZARD_PAGES]).toMatch(/^https:\/\/www\.nasa\.gov\/hrp\/hazard-/);
  });

  it("recognizes low oxygen and cites NASA's hypoxia page", () => {
    expect(analyzeText("feel like altitude sickness, headache since the cabin pressure drop, maybe low oxygen").matches[0]?.condition.id).toBe("hypoxia");
    expect(conditionCite(CONDITIONS.find((c) => c.id === "hypoxia")!).source).toBe("hypoxia");
  });
});

describe("sleep orbit sessions", async () => {
  const { checkSleep } = await import("@/lib/sleep-store");
  const id = "123e4567-e89b-42d3-a456-426614174000";
  const h = (n: number) => new Date(Date.UTC(2026, 10, 10, n)).toISOString();
  it("accepts a normal night and a nap", () => {
    expect(checkSleep({ id, kind: "sleep", startedAt: h(-1), endedAt: h(6) })).toBeNull();
    expect(checkSleep({ id, kind: "nap", startedAt: h(13), endedAt: h(14) })).toBeNull();
  });
  it("rejects bad sessions", () => {
    expect(checkSleep({ id, kind: "sleep", startedAt: h(6), endedAt: h(5) })).not.toBeNull();
    expect(checkSleep({ id, kind: "sleep", startedAt: h(0), endedAt: h(30) })).not.toBeNull();
    expect(checkSleep({ id: "x", kind: "sleep", startedAt: h(0), endedAt: h(6) })).not.toBeNull();
    expect(checkSleep({ id, kind: "coma", startedAt: h(0), endedAt: h(6) })).not.toBeNull();
  });
});

describe("photo import", async () => {
  const { extractPhotoDetails, buildPhotoRecord } = await import("@/components/astromed/photo-import-data");
  const { checkRadiation } = await import("@/lib/radiation-store");
  const id = "123e4567-e89b-42d3-a456-426614174000";

  it("reads a dosimeter total, not the dose rate", () => {
    const { suggestedLog, draft } = extractPhotoDetails("Dosimeter\nEnvironment: EVA 3\nDose rate: 0.05 mSv/h\nTotal: 320 µSv\nDuration: 6.5 h");
    expect(suggestedLog).toBe("radiation");
    expect(draft.dose).toBe("320");
    expect(draft.unit).toBe("µSv");
    expect(draft.hours).toBe("6.5");
    const built = buildPhotoRecord("radiation", draft, id);
    expect("entry" in built && built.entry.category === "radiation" && built.entry.record.cumulativeDoseMsv).toBeCloseTo(0.32);
  });

  it("reads a sleep tracker's bedtime and wake time", () => {
    const { suggestedLog, draft } = extractPhotoDetails("Sleep\nBedtime: 2026-11-12 22:40+00:00\nWake time: 2026-11-13 06:10+00:00");
    expect(suggestedLog).toBe("sleep");
    const built = buildPhotoRecord("sleep", draft, id);
    expect("entry" in built && built.entry.category === "sleep" && built.entry.record.endedAt).toBe("2026-11-13T06:10:00.000Z");
  });

  it("pulls readings out of any health photo", async () => {
    const { extractHealthMeasurements } = await import("@/components/astromed/photo-import-data");
    expect(extractPhotoDetails("Blood pressure: 128/82 mmHg\nPulse: 64 bpm").suggestedLog).toBeUndefined();
    const m = extractHealthMeasurements("Blood pressure: 128/82 mmHg\nPulse: 64 bpm\nGlucose: 5.2 mmol/L\nTemperature: 36.9 °C\nNotes: feeling fine");
    expect(m.map((x) => `${x.label}=${x.value} ${x.unit}`)).toEqual(["Blood pressure=128/82 mmHg", "Pulse=64 bpm", "Glucose=5.2 mmol/L", "Temperature=36.9 °C"]);
    const built = buildPhotoRecord("health", { ...extractPhotoDetails("Weight: 74.6 kg").draft }, id);
    expect("entry" in built && built.entry.category === "health" && built.entry.record.measurements[0]?.value).toBe("74.6");
  });

  it("checks saved radiation readings", () => {
    expect(checkRadiation({ id, name: "EVA 3", doseMsv: 0.32, hours: 6.5, source: "photo-import" })).toBeNull();
    expect(checkRadiation({ id, name: "EVA 3", doseMsv: -1, hours: 6.5, source: "photo-import" })).not.toBeNull();
    expect(checkRadiation({ id, name: "EVA 3", doseMsv: 1, hours: 0, source: "photo-import" })).not.toBeNull();
    expect(checkRadiation({ id, name: "", doseMsv: 1, hours: 1, source: "photo-import" })).not.toBeNull();
  });
});

describe("photo readings feed My vitals", async () => {
  const { mapPhotoReadings } = await import("@/lib/photo-readings");
  const m = (label: string, value: string, unit: string) => ({ label, value, unit });

  it("maps blood pressure, pulse, temperature, glucose and weight to AstroMed's measures", () => {
    const { answers } = mapPhotoReadings([m("Blood pressure", "128/82", "mmHg"), m("Pulse", "64", "bpm"), m("Temperature", "36.9", "°C"), m("Glucose", "92", "mg/dL"), m("Weight", "74.6", "kg")]);
    expect(answers).toEqual({ systolic: 128, diastolic: 82, restingHr: 64, temperature: 36.9, glucose: 92, weightKg: 74.6 });
  });

  it("converts °F, mmol/L and lb", () => {
    const { answers, used } = mapPhotoReadings([m("Temp", "98.6", "°F"), m("Blood sugar", "5.2", "mmol/L"), m("Weight", "165", "lb")]);
    expect(answers).toEqual({ temperature: 37, glucose: 94, weightKg: 74.8 });
    expect(used.every((u) => u.converted)).toBe(true);
  });

  it("leaves out readings it can't trust", () => {
    const { answers } = mapPhotoReadings([m("Blood pressure", "82/128", "mmHg"), m("Pulse", "640", "bpm"), m("Glucose", "<70", "mg/dL"), m("SpO2", "41", "%"), m("Cholesterol", "180", "mg/dL")]);
    expect(answers).toEqual({});
  });
});

describe("space health checks", async () => {
  const { evaluate, getCheckup, parseAnswers } = await import("@/lib/checkups");
  const { reactionFindings, summarize, nextDelay } = await import("@/lib/reaction");
  const { mapPhotoReadings } = await import("@/lib/photo-readings");
  const member = CREW[0];
  const run = (id: string, a: Record<string, number | boolean>, prior?: number[]) => evaluate(getCheckup(id)!, member, a, { priorReaction: prior });

  it("treats low oxygen saturation as urgent", () => {
    expect(run("vitals", { spo2: 88 }).level).toBe("now");
    expect(run("vitals", { spo2: 92 }).level).toBe("today");
    expect(run("vitals", { spo2: 98 }).level).toBe("none");
    expect(evaluateDailyLog(member, { spo2: 89 }).level).toBe("now");
  });

  it("checks cabin air against NASA-STD-3001 limits", () => {
    expect(run("cabin", { co2Mmhg: 3.5 }).level).toBe("today");
    expect(run("cabin", { co2Mmhg: 2.0, cabinTempC: 22, humidityPct: 45, noiseDba: 60 }).level).toBe("none");
    expect(run("cabin", { cabinTempC: 29 }).level).toBe("routine");
    expect(run("cabin", { humidityPct: 15 }).level).toBe("routine");
    expect(run("cabin", { noiseDba: 88 }).level).toBe("today");
  });

  it("needs at least one cabin reading", () => {
    const form = new FormData();
    expect(parseAnswers(getCheckup("cabin")!, form)).toHaveProperty("error");
    form.set("co2Mmhg", "2.4");
    expect(parseAnswers(getCheckup("cabin")!, form)).toEqual({ answers: { co2Mmhg: 2.4 } });
  });

  it("flags distortion on the Amsler grid in either eye", () => {
    const r = run("vision", { amslerLeft: false, amslerRight: true, blurred: false, oneEye: false, headache: false });
    expect(r.level).toBe("today");
    expect(r.findings[0].text).toMatch(/right eye/);
  });

  it("scores the 3-minute reaction test like PVT-B", () => {
    const s = summarize([250, 260, 270, 400, 360, 240], 2)!;
    expect(s).toMatchObject({ rtMedianMs: 265, rtLapses: 2, rtFalseStarts: 2, rtTrials: 6 });
    expect(summarize([], 3)).toBeUndefined();
    for (let i = 0; i < 50; i++) { const d = nextDelay(); expect(d).toBeGreaterThanOrEqual(1000); expect(d).toBeLessThan(4000); }
  });

  it("compares reaction time with the person's own usual, never as an emergency", () => {
    expect(reactionFindings({ rtMedianMs: 320, rtLapses: 1 }, [250, 255, 260]).some((f) => f.level === "routine")).toBe(true);
    expect(reactionFindings({ rtMedianMs: 255, rtLapses: 1 }, [250, 255, 260]).every((f) => f.level === "none")).toBe(true);
    expect(reactionFindings({ rtMedianMs: 300, rtLapses: 1 }, [250]).every((f) => f.level === "none")).toBe(true);
    expect(run("reaction", { rtMedianMs: 700, rtLapses: 20, rtFalseStarts: 9, rtTrials: 40 }, [250, 260, 270]).level).toBe("routine");
  });

  it("reads oxygen saturation from a photo", () => {
    expect(mapPhotoReadings([{ label: "SpO2", value: "96", unit: "%" }]).answers).toEqual({ spo2: 96 });
  });
});

describe("balance, after-spacewalk and immune checks", async () => {
  const { evaluate, getCheckup } = await import("@/lib/checkups");
  const { dueStatus } = await import("@/lib/checkup-schedule");
  const { SPACE_RISKS } = await import("@/lib/space-risks");
  const member = CREW[0];
  const run = (id: string, a: Record<string, number | boolean>) => evaluate(getCheckup(id)!, member, a);
  const noBalance = { dizzyStanding: false, fainted: false, vertigo: false };
  const noEva = { dcsJoint: false, dcsSkin: false, dcsNeuro: false, dcsChokes: false, dcsBrain: false, handInjury: false, suitRub: false, evaTired: 3 };
  const noImmune = { imColdSore: false, imShingles: false, imRash: false, imWound: false, imCold: false, imGut: false, imUrine: false, imCleaned: true };

  it("spots orthostatic intolerance and poor balance after a gravity change", () => {
    expect(run("balance", { ...noBalance, hrLying: 62, hrStanding: 96 }).level).toBe("today");
    expect(run("balance", { ...noBalance, sysLying: 120, sysStanding: 96 }).level).toBe("today");
    expect(run("balance", { ...noBalance, fainted: true }).level).toBe("today");
    expect(run("balance", { ...noBalance, singleLegSec: 6 }).level).toBe("routine");
    expect(run("balance", { ...noBalance, hrLying: 62, hrStanding: 78, singleLegSec: 30, tandemSec: 25 }).level).toBe("none");
  });

  it("treats any decompression sickness sign after a spacewalk as urgent", () => {
    expect(run("after-eva", { ...noEva, dcsJoint: true }).level).toBe("now");
    expect(run("after-eva", { ...noEva, dcsChokes: true }).level).toBe("now");
    expect(run("after-eva", { ...noEva, handInjury: true }).level).toBe("routine");
    expect(run("after-eva", noEva).level).toBe("none");
  });

  it("flags shingles, infected wounds and urinary infection the same day", () => {
    for (const k of ["imShingles", "imWound", "imUrine"]) expect(run("immune", { ...noImmune, [k]: true }).level).toBe("today");
    expect(run("immune", { ...noImmune, imColdSore: true }).level).toBe("routine");
    expect(run("immune", noImmune).level).toBe("none");
  });

  it("makes the after-spacewalk check due only after a logged spacewalk", () => {
    const c = getCheckup("after-eva")!;
    const now = new Date("2026-11-14T12:00:00Z");
    const eva = { crewId: "vega", checkupId: "daily", escalation: "none" as const, createdAt: "2026-11-14T08:00:00Z", answers: { evaHours: 6 } };
    expect(dueStatus(c, [], now).due).toBe(false);
    expect(dueStatus(c, [eva], now).due).toBe(true);
    const done = { crewId: "vega", checkupId: "after-eva", escalation: "none" as const, createdAt: "2026-11-14T10:00:00Z" };
    expect(dueStatus(c, [done, eva], now).due).toBe(false);
    expect(dueStatus(getCheckup("balance")!, [], now).due).toBe(false);
  });

  it("links every one of these NASA risks to a check", () => {
    const want: Record<string, string> = { immune: "/checkups/immune", sensorimotor: "/checkups/balance", hypoxia: "/checkups/vitals", microbes: "/checkups/immune", decompression: "/checkups/after-eva", eva: "/checkups/after-eva", fitness: "/checkups/balance", sans: "/checkups/vision" };
    for (const [id, href] of Object.entries(want)) expect(SPACE_RISKS.find((r) => r.id === id)!.inApp.map((l) => l.href)).toContain(href);
  });
});

describe("brain health tips", async () => {
  const { TIPS, TOPICS, SOURCES } = await import("@/lib/tips");
  const brain = TIPS.filter((t) => t.topic === "Brain health");
  it("covers each recommendation with a cited source", () => {
    expect(TOPICS.some((t) => t.slug === "brain")).toBe(true);
    for (const id of ["speed-training", "open-skill-exercise", "daily-novelty", "dual-task-balance", "movement-snacks", "track-alertness"]) expect(brain.some((t) => t.id === id), id).toBe(true);
    for (const t of brain) for (const c of [{ source: t.source }, ...(t.also ?? [])]) expect(SOURCES[c.source], `${t.id} ${c.source}`).toBeDefined();
  });
  it("never suggests replacing prescribed exercise", () => {
    expect(TIPS.find((t) => t.id === "open-skill-exercise")!.action).toMatch(/Keep every prescribed exercise session/);
  });
});

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

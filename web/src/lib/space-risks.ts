/**
 * NASA Human Research Program: the 5 hazards and the 18 risks of human spaceflight,
 * from https://www.nasa.gov/hrp/hazards/ and https://www.nasa.gov/hrp/risks/,
 * each mapped to where AstroMed helps an astronaut track it. Summaries are AstroMed's own wording.
 */
import type { Hazard } from "@/lib/space-conditions";

export const HRP_HAZARDS_URL = "https://www.nasa.gov/hrp/hazards/";
export const HRP_RISKS_URL = "https://www.nasa.gov/hrp/risks/";
export const HRP_RESEARCH_URL = "https://www.nasa.gov/hrp/ongoing-hrp-research/";

export const HAZARD_PAGES: Record<Hazard, string> = {
  radiation: "https://www.nasa.gov/hrp/hazard-space-radiation/",
  isolation: "https://www.nasa.gov/hrp/hazard-isolation-and-confinement/",
  distance: "https://www.nasa.gov/hrp/hazard-distance-from-earth/",
  gravity: "https://www.nasa.gov/hrp/hazard-gravity-fields/",
  environment: "https://www.nasa.gov/hrp/hazard-hostile-closed-environments/",
};

export type RiskGroup = "physiology" | "behavior" | "radiation";
export const RISK_GROUPS: { id: RiskGroup; name: string }[] = [
  { id: "physiology", name: "Human physiology" },
  { id: "behavior", name: "Behavioral performance and human factors" },
  { id: "radiation", name: "Space radiation" },
];

export type SpaceRisk = {
  id: string;
  name: string;
  group: RiskGroup;
  url: string;
  /** One plain sentence on what the risk is. */
  summary: string;
  /** Where AstroMed helps with it. */
  inApp: { text: string; href: string }[];
};

const ref = (slug: string) => `https://www.nasa.gov/reference/${slug}/`;

export const SPACE_RISKS: SpaceRisk[] = [
  { id: "immune", name: "Altered immune system responses", group: "physiology", url: ref("risk-of-altered-immune-system-responses"),
    summary: "Spaceflight stress can wake up dormant viruses and change how the immune system works, causing rashes and other symptoms.",
    inApp: [{ text: "Weekly immune and infection check", href: "/checkups/immune" }, { text: "Tip: protect your immune system", href: "/tips?all=1&topic=infection#protect-immunity" }, { text: "Immune warning signs in My exposure", href: "/hazards" }, { text: "Report a rash or cold sore", href: "/problems" }] },
  { id: "sensorimotor", name: "Altered sensorimotor and vestibular function", group: "physiology", url: ref("risk-of-altered-sensorimotor-and-vestibular-function"),
    summary: "Gravity changes can bring motion sickness, dizziness and poorer coordination, which matters when walking or driving after landing.",
    inApp: [{ text: "Balance and stand-up test", href: "/checkups/balance" }, { text: "Report dizziness or motion sickness", href: "/problems" }, { text: "Gravity and landing tips", href: "/tips" }] },
  { id: "cardiovascular", name: "Cardiovascular adaptations", group: "physiology", url: ref("risk-of-cardiovascular-adaptations"),
    summary: "Weightlessness changes blood flow and how the heart and vessels work.",
    inApp: [{ text: "Stand-up test for dizziness on standing", href: "/checkups/balance" }, { text: "Blood pressure and heart rate", href: "/indicators#blood-pressure" }, { text: "My vitals", href: "/vitals" }] },
  { id: "decompression", name: "Decompression sickness", group: "physiology", url: ref("risk-of-decompression-sickness"),
    summary: "Moving from the cabin to a lower-pressure suit can let dissolved nitrogen form bubbles in the body (\"the bends\").",
    inApp: [{ text: "After-spacewalk check for the bends", href: "/checkups/after-eva" }, { text: "Tip: never shorten the prebreathe", href: "/tips?all=1&topic=eva#prebreathe" }, { text: "Report symptoms after a spacewalk", href: "/problems" }] },
  { id: "microbes", name: "Host-microorganism interactions", group: "physiology", url: ref("risk-of-host-microorganism-interactions"),
    summary: "Skin and gut microbes change in space, which may make crew members more likely to get sick.",
    inApp: [{ text: "Weekly immune and infection check", href: "/checkups/immune" }, { text: "Tip: keep hygiene areas clean", href: "/tips?all=1&topic=infection#clean-shared-spaces" }, { text: "Temperature and infection signs", href: "/indicators#temperature" }, { text: "Report an infection", href: "/problems" }] },
  { id: "hypoxia", name: "Hypoxia", group: "physiology", url: ref("risk-of-hypoxia"),
    summary: "Lower-pressure cabins planned for frequent spacewalks raise the chance of mild low oxygen, much like altitude sickness.",
    inApp: [{ text: "Record oxygen saturation (SpO₂)", href: "/checkups/vitals" }, { text: "Log cabin CO₂ and air", href: "/checkups/cabin" }, { text: "Report low-oxygen symptoms", href: "/problems" }] },
  { id: "nutrition", name: "Inadequate food and nutrition", group: "physiology", url: ref("risk-of-inadequate-food-and-nutrition"),
    summary: "Long missions need enough food that stays nutritious and that crews want to eat.",
    inApp: [{ text: "Food energy and weight", href: "/indicators#nutrition" }, { text: "Log food", href: "/log" }] },
  { id: "eva", name: "Injury and compromised performance from spacewalks", group: "physiology", url: ref("risk-of-injury-and-compromised-performance-from-extravehicular-activity-eva"),
    summary: "Spacesuit work brings fatigue, injury, the bends, and low oxygen or high carbon dioxide.",
    inApp: [{ text: "After-spacewalk check", href: "/checkups/after-eva" }, { text: "Log spacewalk hours (adds to your food target)", href: "/log" }, { text: "Report a suit injury", href: "/problems" }] },
  { id: "fitness", name: "Reduced cardiorespiratory and musculoskeletal fitness", group: "physiology", url: ref("risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness"),
    summary: "Without exercise, bone, muscle strength and heart fitness fall, which affects spacewalks too.",
    inApp: [{ text: "Exercise plan", href: "/exercise" }, { text: "Exercise, bone and muscle", href: "/indicators#fitness" }, { text: "Balance and stand-up test", href: "/checkups/balance" }] },
  { id: "sans", name: "Spaceflight Associated Neuro-ocular Syndrome (SANS)", group: "physiology", url: ref("risk-of-spaceflight-associated-neuro-ocular-syndrome-sans"),
    summary: "The structure of the eyes and brain can change during spaceflight.",
    inApp: [{ text: "Vision check with Amsler grid", href: "/checkups/vision" }, { text: "Vision indicator", href: "/indicators#vision" }] },
  { id: "bone", name: "Spaceflight-induced bone changes", group: "physiology", url: ref("risk-of-spaceflight-induced-bone-changes"),
    summary: "Bones lose density without gravity and become easier to break.",
    inApp: [{ text: "Bone-loss projection", href: "/hazards" }, { text: "Exercise plan", href: "/exercise" }] },
  { id: "behavioral", name: "Behavioral conditions and psychiatric disorders", group: "behavior", url: ref("risk-of-behavioral-conditions-and-psychiatric-disorders"),
    summary: "Isolation, distance and other stressors can affect mental health.",
    inApp: [{ text: "Mood and stress", href: "/indicators#mood" }, { text: "Reaction-time test", href: "/checkups/reaction" }, { text: "Journal and breathing break", href: "/journal" }] },
  { id: "teamwork", name: "Inadequate teamwork", group: "behavior", url: ref("risk-of-inadequate-teamwork"),
    summary: "Small crews in long isolation must communicate well and recover from tension.",
    inApp: [{ text: "Tag crew-relations entries in your journal", href: "/journal" }] },
  { id: "sleep", name: "Inadequate sleep and irregular schedules", group: "behavior", url: ref("risk-from-inadequate-sleep-and-irregular-schedules"),
    summary: "Chronic sleep loss, heavy workloads and a disrupted body clock add up.",
    inApp: [{ text: "Reaction-time test for alertness", href: "/checkups/reaction" }, { text: "Sleep indicator", href: "/indicators#sleep" }, { text: "Log sleep", href: "/log" }] },
  { id: "systems", name: "Inadequate systems operations support", group: "behavior", url: ref("risk-of-inadequate-systems-operations-support"),
    summary: "Far from Earth, crews must handle unexpected problems with the information and training they have on board.",
    inApp: [{ text: "Tip: know your crew medical officers", href: "/tips?all=1&topic=mind#know-your-cmo" }, { text: "Advice for your distance from Earth", href: "/mission" }, { text: "Getting started guide", href: "/guide" }] },
  { id: "dynamic-loads", name: "Injury from dynamic loads", group: "behavior", url: ref("risk-of-injury-from-dynamic-loads"),
    summary: "Landing and other sudden forces can injure the crew.",
    inApp: [{ text: "Tip: restraints and helmet fit", href: "/tips?all=1&topic=landing#landing-restraints" }, { text: "Report an injury", href: "/problems" }, { text: "Landing tips", href: "/tips" }] },
  { id: "cancer", name: "Radiation-induced cancers", group: "radiation", url: ref("risk-of-radiation-induced-cancers"),
    summary: "Space radiation may raise the chance of developing cancer later.",
    inApp: [{ text: "Radiation dose so far", href: "/hazards" }, { text: "Radiation dose indicator", href: "/indicators#radiation" }] },
];

/** Other agencies' resources from the challenge, with what each adds. */
export const PARTNER_RESOURCES = [
  { agency: "CSA (Canadian Space Agency)", title: "Monitoring radiation for astronaut health",
    url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp",
    takeaway: "Neutrons make up about 30% of the radiation on the ISS and can cause serious biological damage. CSA is developing CANS, a compact instrument that measures neutron exposure continuously and on its own." },
  { agency: "CSA (Canadian Space Agency)", title: "Why do we conduct science experiments in space?",
    url: "https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp",
    takeaway: "Moon and Mars missions mean more weightlessness, more radiation, longer isolation, longer communication delays and less help from Earth. Body changes in space resemble faster ageing, so this research also helps people on Earth." },
] as const;

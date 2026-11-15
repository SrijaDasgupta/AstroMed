/**
 * Spaceflight problems that can develop without symptoms. For each: what happens, how flight
 * surgeons detect it, and what the astronaut can watch for or do in AstroMed. AstroMed can't
 * replace the clinical tests (ultrasound, OCT, blood and urine analysis); it prompts the
 * self-checks and tells people when to ask for them.
 */
import type { SourceId } from "@/lib/tips";

type Cite = { source: SourceId; page: number };

export type HiddenRisk = {
  id: string;
  name: string;
  what: string;
  detect: string;
  self: string[];
  links: { text: string; href: string }[];
  cites: Cite[];
};

const web = (source: SourceId): Cite => ({ source, page: 0 });

export const HIDDEN_RISKS: HiddenRisk[] = [
  {
    id: "jugular-clot",
    name: "Stagnant blood flow and clots in the neck veins",
    what: "Without gravity, blood and fluid shift towards the head and the internal jugular veins swell. In a study of 11 ISS crew members, 6 had stagnant or backward flow in a jugular vein around flight day 50, and one developed a blocking clot that caused no symptoms and was found only on a research ultrasound.",
    detect: "Ultrasound of the neck veins with Doppler, which shows the direction of blood flow and whether the vein compresses normally. Crew members can run these scans with guidance from the ground.",
    self: [
      "Report new swelling, heaviness, pain or a feeling of fullness in your neck, face or one arm the same day. These are in the daily log symptoms.",
      "Ask whether neck-vein ultrasound is part of your mission's routine scans, especially on long missions.",
    ],
    links: [{ text: "Daily log symptoms", href: "/log" }, { text: "Report a problem", href: "/problems" }],
    cites: [web("jugularVte"), { source: "cardio", page: 19 }],
  },
  {
    id: "sans",
    name: "Eye and optic nerve changes (SANS)",
    what: "The headward fluid shift can flatten the back of the eye, swell the optic nerve head and fold the retina, often shifting vision towards farsightedness. Not everyone is affected: among 16 NASA astronauts who flew two long missions, whether they had SANS on the first mission predicted the second.",
    detect: "Optical coherence tomography (OCT) scans of the retina and optic nerve, eye ultrasound, fundus photos, and vision tests before, during and after flight.",
    self: [
      "Do the weekly vision check with the Amsler grid and the near-vision card; it records any change.",
      "Report blurred vision, a new need for stronger glasses, or wavy grid lines the same day, and tell the flight surgeon if you had SANS on a previous mission.",
    ],
    links: [{ text: "Vision check with Amsler grid", href: "/checkups/vision" }],
    cites: [{ source: "std1", page: 20 }, web("sansPredict")],
  },
  {
    id: "latent-virus",
    name: "Silent reactivation of dormant viruses",
    what: "Viruses most people carry without symptoms (Epstein-Barr, varicella-zoster which causes chickenpox and shingles, and cytomegalovirus) wake up more often in space. On long ISS missions they were shed more often, for longer and in larger amounts than on short shuttle flights, mostly without any symptoms.",
    detect: "Saliva and urine samples tested for viral DNA (quantitative PCR), alongside stress hormone (cortisol) measurements.",
    self: [
      "Do the weekly immune and infection check: cold sores, mouth ulcers, a one-sided band of blisters (shingles) and slow-healing cuts.",
      "Protect sleep and manage stress; the study linked reactivation to changes in the daily cortisol rhythm.",
    ],
    links: [{ text: "Immune and infection check", href: "/checkups/immune" }],
    cites: [web("latentVirus"), { source: "behavioral", page: 31 }],
  },
  {
    id: "space-anemia",
    name: "Space anemia: faster red blood cell destruction",
    what: "In 14 astronauts on 6-month ISS missions, the body destroyed 54% more red blood cells than before flight, for the whole mission, and effects were still present a year after landing. Anemia affects fatigue, exercise tolerance and dizziness on standing, which matters most after landing on another world without full medical support.",
    detect: "Carbon monoxide in exhaled breath (released each time haemoglobin is broken down) and blood tests for haemoglobin, iron and young red blood cells.",
    self: [
      "Report unusual tiredness, breathlessness with light effort, a racing heart or looking pale, and ask for a blood count (haemoglobin).",
      "After landing, do the Balance and stand-up test: anemia adds to dizziness on standing.",
    ],
    links: [{ text: "Balance and stand-up test", href: "/checkups/balance" }, { text: "Report a problem", href: "/problems" }],
    cites: [web("spaceAnemia")],
  },
  {
    id: "kidney-stones",
    name: "Silent kidney stone formation",
    what: "Bone loss in weightlessness raises calcium in the urine at the same time as crews tend to drink less, so stone-forming crystals can build up for months without symptoms. NASA's medical model ranks a kidney stone as the second most likely reason for an emergency evacuation from the ISS.",
    detect: "24-hour urine chemistry (calcium, oxalate, citrate, pH and volume) and kidney ultrasound to spot small stones before they cause pain. Simpler tests such as first-morning urine calcium are being studied for small spacecraft.",
    self: [
      "Log your water every day; AstroMed flags anything under NASA's 2.5 L minimum. A modelling study estimated about 3.2 L a day would bring stone risk back to pre-flight levels.",
      "Keep up resistance exercise, which protects bone and lowers the calcium load.",
      "Report pain in your side or back, or blood in your urine, the same day. These are in the daily log symptoms.",
    ],
    links: [{ text: "Log water", href: "/log" }, { text: "Exercise plan", href: "/exercise" }],
    cites: [web("nasaFundamentals"), web("stoneRisk"), web("boneKidney")],
  },
];

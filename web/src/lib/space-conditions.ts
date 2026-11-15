/**
 * What can go wrong for an astronaut, and what to do about it.
 *
 * The condition list follows NASA-STD-3001 Vol. 1 Rev C, Table E.2-2 "Medical Conditions Considered
 * of High Likelihood or High Consequence for Spaceflight Missions" (pp. 83–86), with expected cases per
 * mission from the sample Integrated Medical Model output (Table E.2-1, pp. 82–83). Each condition is
 * grouped under the Human Research Program's five hazards of spaceflight (Behavioral evidence report, p. 14).
 *
 * Advice here is general first-aid and self-monitoring guidance plus when to involve the flight surgeon.
 * It never diagnoses and never recommends medicines or doses.
 */
import type { Cite } from "@/lib/body";
import type { Escalation } from "@/lib/checkups";
import { needsSupport } from "@/lib/journal";

export type Hazard = "radiation" | "isolation" | "distance" | "gravity" | "environment";

export const HAZARDS: Record<Hazard, { name: string; blurb: string }> = {
  radiation: { name: "Space radiation", blurb: "Galactic cosmic rays and solar particle events beyond Earth's protection." },
  isolation: { name: "Isolation and confinement", blurb: "Small crews in small spaces for months: sleep, mood, stress and teamwork." },
  distance: { name: "Distance from Earth", blurb: "Delayed or lost contact with home and mission control; crews must handle problems themselves." },
  gravity: { name: "Altered gravity", blurb: "Weightlessness and gravity changes affect balance, fluids, heart, eyes, bones and muscles." },
  environment: { name: "Hostile and closed environment", blurb: "Cabin air, CO₂, noise, toxic chemicals, dust, temperature, pressure and spacewalks." },
};
export const HAZARD_CITE: Cite = { source: "behavioral", page: 14 };

export type Category = "environmental" | "eyes" | "ent" | "dental" | "heart" | "lungs" | "gut" | "urinary" | "musculoskeletal" | "skin" | "neuro" | "mind" | "other";

export const CATEGORIES: Record<Category, { name: string; page: number }> = {
  environmental: { name: "Environment and spaceflight", page: 83 },
  eyes: { name: "Eyes", page: 84 },
  ent: { name: "Ears, nose and throat", page: 84 },
  dental: { name: "Teeth and mouth", page: 84 },
  heart: { name: "Heart and circulation", page: 84 },
  lungs: { name: "Lungs and chest", page: 84 },
  gut: { name: "Stomach and gut", page: 84 },
  urinary: { name: "Kidneys, bladder and reproductive", page: 85 },
  musculoskeletal: { name: "Bones, muscles and joints", page: 85 },
  skin: { name: "Skin", page: 85 },
  neuro: { name: "Brain, nerves and balance", page: 85 },
  mind: { name: "Mind, mood, sleep and team", page: 86 },
  other: { name: "Other", page: 86 },
};

export type Condition = {
  id: string;
  name: string;
  category: Category;
  hazards: Hazard[];
  /** Body areas (from body-notes BODY_AREAS) this usually affects. */
  areas: string[];
  /** Plain-language words people use for it. */
  terms: RegExp;
  /** How soon to involve the flight surgeon when this is the best match. */
  level: Escalation;
  /** What to do meanwhile: general, non-drug steps. */
  care: string[];
  /** Signs that make it more urgent. */
  watch: string[];
  /** Expected cases per mission in NASA's sample model, if listed. */
  perMission?: number;
  fact?: { text: string; cite: Cite };
  /** Page of Table E.2-2 that lists it, when it differs from its category's page. */
  page?: number;
  /** For conditions not in Table E.2-2: where they come from instead. */
  source?: Cite;
  links?: { text: string; href: string }[];
};

const s1 = (page: number): Cite => ({ source: "std1", page });
const s2 = (page: number): Cite => ({ source: "std2", page });

export const CONDITIONS: Condition[] = [
  // ---------------- Environment and spaceflight (Vol. 1 p. 83) ----------------
  { id: "radiation-event", name: "Radiation exposure or solar particle event", category: "environmental", hazards: ["radiation"], areas: ["environment", "whole-body"],
    terms: /radiation|dosimeter|solar (particle|flare|storm|event)|\bSPE\b|space weather|cosmic ray/i, level: "routine",
    care: ["Follow your mission's radiation shelter procedure if an alert sounds.", "Record your dosimeter reading and the time of the event.", "Log any nausea, vomiting, diarrhea, tiredness or skin redness afterwards."],
    watch: ["Nausea, vomiting or diarrhea after a radiation event", "Skin redness or unusual tiredness after an event"],
    fact: { text: "Space weather events can expose crews to radiation above the permissible limits, so crews must be alerted and able to follow sheltering procedures even without contact with the ground.", cite: s2(109) },
    links: [{ text: "Check your dose in the radiation tool", href: "/tools#radiation" }, { text: "See My exposure", href: "/hazards" }] },
  { id: "allergic", name: "Allergic reaction", category: "environmental", hazards: ["environment"], areas: ["skin", "whole-body", "nose-throat"],
    terms: /allerg|hives|itchy (eyes|skin|throat)|swollen (lips|face|tongue)/i, level: "routine", perMission: 1.18,
    care: ["Move away from whatever you think caused it, if you can.", "Note what you touched, ate or breathed in before it started."],
    watch: ["Swelling of the lips, tongue or throat", "Trouble breathing or swallowing", "Feeling faint"] },
  { id: "back-pain-sas", name: "Back pain from adapting to space", category: "environmental", hazards: ["gravity"], areas: ["lower-back", "upper-back"],
    terms: /back ?(pain|ache|hurts|sore)|(lower|upper|mid) back|spine (pain|ache)|backache/i, level: "none", perMission: 3.15,
    care: ["Gentle stretching, such as curling your knees toward your chest, often eases it.", "It is common in the first days of weightlessness as the spine lengthens."],
    watch: ["Numbness or weakness in the legs", "Trouble controlling bladder or bowels", "Pain after an injury or that keeps getting worse"],
    links: [{ text: "See your exercise plan", href: "/exercise" }] },
  { id: "barotrauma", name: "Ear or sinus block (barotrauma)", category: "environmental", hazards: ["environment"], areas: ["ears", "nose-throat"],
    terms: /ears? (block|blocked|popp|pressure|won'?t pop|squeak)|sinus (pressure|block)|equaliz|barotrauma|pressure change/i, level: "routine", perMission: 3.28,
    care: ["Equalize gently; stop if it hurts.", "Tell your crew before the next pressure change (for example, before or after a spacewalk)."],
    watch: ["Hearing loss", "Severe ear pain or fluid from the ear", "Spinning dizziness"],
    fact: { text: "Some crewmembers can't equalize pressure in their ears and sinuses, so cabin pressure changes have to allow for it.", cite: s2(53) } },
  { id: "burn", name: "Burn", category: "environmental", hazards: ["environment"], areas: ["skin", "hand", "arm"],
    terms: /\bburn(t|ed|s)?\b|scald|blister(ed)? from (heat|hot)/i, level: "routine",
    care: ["Cool the burn with clean, cool (not icy) water for at least 10 minutes.", "Cover loosely with a clean dressing; don't pop blisters."],
    watch: ["Burns larger than your palm, on the face, hands, joints or genitals", "Blistered or white, leathery skin", "Signs of infection"] },
  { id: "smoke-fire", name: "Smoke, fire or combustion fumes", category: "environmental", hazards: ["environment"], areas: ["environment", "chest"],
    terms: /smoke|fire\b|fumes|burning smell|smell(s)? (of )?burning|combustion/i, level: "now",
    care: ["Follow your vehicle's fire or toxic-atmosphere emergency procedure first.", "Put on your emergency mask if instructed."],
    watch: ["Cough, wheezing or trouble breathing", "Headache, dizziness or confusion"] },
  { id: "toxic", name: "Toxic chemical exposure", category: "environmental", hazards: ["environment"], areas: ["environment", "skin", "eyes"],
    terms: /toxic|chemical (smell|leak|spill|exposure)|ammonia|hydrazine|propellant|glycol|coolant leak|off-?gas|strange smell|fumes/i, level: "today",
    care: ["Follow your contamination procedure and use protective equipment.", "Flush any skin or eye contact with plenty of clean water.", "Note the substance, time and how long you were exposed."],
    watch: ["Trouble breathing, chest tightness or coughing", "Eye pain or vision changes", "Headache, nausea or dizziness"],
    fact: { text: "Toxic substances such as propellants and ammonia need to be monitored after spacewalks.", cite: s2(60) } },
  { id: "dust", name: "Lunar or planetary dust exposure", category: "environmental", hazards: ["environment"], areas: ["environment", "eyes", "nose-throat"],
    terms: /dust|regolith|(lunar|moon|mars|martian) (soil|dirt)/i, level: "routine",
    care: ["Avoid rubbing your eyes; rinse them with clean water.", "Clean dust off suits and skin before it spreads in the cabin."],
    watch: ["Persistent cough or wheezing", "Eye pain or redness that doesn't settle"],
    fact: { text: "Vehicles must monitor celestial dust and alert the crew as it approaches defined limits.", cite: s2(60) } },
  { id: "cold", name: "Cold injury or hypothermia", category: "environmental", hazards: ["environment"], areas: ["hand", "foot", "whole-body"],
    terms: /frost|chilblain|freez(ing|e)|hypotherm|(too|very|so) cold|cold (hands|feet|fingers|toes)|shivering/i, level: "routine",
    care: ["Warm up gradually; don't rub frozen skin.", "Add layers and keep dry."],
    watch: ["Confusion, slurred speech or drowsiness", "Skin that stays white, grey or numb"] },
  { id: "heat", name: "Heat illness", category: "environmental", hazards: ["environment"], areas: ["whole-body"],
    terms: /overheat|heat (exhaustion|stroke|illness)|(too|very|so) hot|sweating (a lot|heavily)|suit (is|feels) (hot|warm|too warm)/i, level: "routine",
    care: ["Stop work, cool down and drink water.", "In a suit, report it and use the suit's cooling."],
    watch: ["Confusion, fainting or a very high temperature", "Stopping sweating while hot"] },
  { id: "decompression", name: "Decompression sickness", category: "environmental", hazards: ["environment"], areas: ["environment", "whole-body", "skin"],
    terms: /decompression|\bbends\b|\bDCS\b|(after|since) (the |my )?(EVA|spacewalk|space walk|suit).{0,40}(joint|ache|itch|tingl|rash|mottl|pain)/i, level: "now",
    care: ["Tell your crew now and contact the flight surgeon: treatment means getting back to higher pressure and oxygen as soon as possible.", "Note when it started relative to the pressure change."],
    watch: ["Numbness, weakness or confusion", "Chest pain or trouble breathing"],
    fact: { text: "Programs must keep the chance of decompression sickness below 4%, with 95% confidence.", cite: s2(53) } },
  // Not in Table E.2-2; added from NASA HRP's hypoxia risk page (future deep-space cabins at lower pressure).
  { id: "hypoxia", name: "Low oxygen (hypoxia)", category: "environmental", hazards: ["environment"], areas: ["environment", "head", "whole-body"], source: { source: "hypoxia", page: 0 },
    terms: /hypoxi|low (on )?oxygen|oxygen (is |was |level )?(low|dropp)|altitude sickness|(air|cabin|suit) (feels|is) thin|O2 (alarm|warning|low)/i, level: "today",
    care: ["Tell your crew and check the cabin or suit oxygen and pressure readings.", "Stop strenuous work and rest until it passes.", "Note when it started and any recent pressure change, such as before a spacewalk."],
    watch: ["Confusion, fainting or slurred speech", "Blue lips or trouble breathing", "Symptoms in more than one crew member at once"],
    fact: { text: "Deep-space cabins may be kept at lower pressure to cut spacewalk preparation; mild hypoxia, similar to altitude sickness, can cause confusion, headaches, vision problems and trouble sleeping.", cite: { source: "hypoxia", page: 0 } } },
  { id: "nosebleed", name: "Nosebleed", category: "environmental", hazards: ["gravity", "environment"], areas: ["nose-throat"],
    terms: /nose ?bleed|epistaxis|bleeding (from|out of) (my )?nose|nose (is )?bleeding/i, level: "none",
    care: ["Lean forward and pinch the soft part of your nose for 10 to 15 minutes.", "Catch the blood so droplets don't float around the cabin."],
    watch: ["Bleeding that doesn't stop after 20 minutes", "Bleeding after a blow to the head or face"],
    fact: { text: "Dehydration can cause dry mucous membranes, nosebleeds, headache and poor sleep.", cite: s2(66) } },
  { id: "dehydration", name: "Dehydration", category: "environmental", hazards: ["environment", "gravity"], areas: ["whole-body"],
    terms: /dehydrat|thirsty|dark (urine|pee)|dry mouth|not drinking (enough)?/i, level: "none",
    care: ["Drink regularly through the day; aim for at least 2.5 L.", "Drink more around spacewalks and exercise."],
    watch: ["Dizziness, confusion or very little urine"],
    fact: { text: "Under-hydration can lead to poor performance, nosebleeds, headache and poor sleep, and to urinary infections or stones.", cite: s2(66) },
    links: [{ text: "Add a water reminder", href: "/reminders" }] },
  { id: "co2-headache", name: "Headache from cabin CO₂", category: "environmental", hazards: ["environment"], areas: ["head", "environment"],
    terms: /\bCO2\b|CO₂|carbon dioxide|stuffy (air|cabin)|stale air|poor (ventilation|airflow)|air (feels|is) (stale|stuffy|bad)/i, level: "routine", perMission: 2.15,
    care: ["Move to an area with better airflow, and check the CO₂ reading.", "Tell your crew; others may feel it too."],
    watch: ["Confusion, shortness of breath or a severe headache"],
    fact: { text: "The average CO₂ level over any hour should be no more than 3 mmHg.", cite: s2(51) } },
  { id: "headache", name: "Headache", category: "neuro", hazards: ["gravity", "environment"], areas: ["head"],
    terms: /headache|head ?ache|head (hurts|is pounding|pain)|migraine/i, level: "none", perMission: 5.25,
    care: ["Drink water, rest and check cabin CO₂.", "Note when it started and what you were doing."],
    watch: ["The worst headache of your life, or one that comes on suddenly", "Headache with confusion, vision change, stiff neck or fever", "Headache after hitting your head"] },
  { id: "noise-hearing", name: "Hearing loss or ringing from noise", category: "environmental", hazards: ["environment"], areas: ["ears"],
    terms: /hearing (loss|worse|muffled)|can'?t hear|ringing (in )?(my )?ears?|tinnitus|muffled|(too|very) loud|noise/i, level: "routine", perMission: 0.57,
    care: ["Use hearing protection in loud areas and during exercise on noisy equipment.", "Note whether it's one ear or both."],
    watch: ["Sudden hearing loss", "Hearing loss with dizziness"],
    fact: { text: "Noise above 85 dBA for more than 8 hours has been shown to increase the risk of hearing loss.", cite: s2(92) } },
  { id: "motion-sickness", name: "Space motion sickness", category: "environmental", hazards: ["gravity"], areas: ["whole-body", "abdomen"],
    terms: /motion sick|space sick|nause|queasy|vomit|throw(ing)? up|threw up|sick to my stomach/i, level: "none", perMission: 4.37,
    care: ["Move your head slowly and keep a consistent up/down orientation.", "Sip fluids and eat small amounts; it usually settles within a few days."],
    watch: ["Can't keep fluids down for a day", "Vomiting after a radiation event", "Vomiting with severe headache or after a head injury"] },
  { id: "nasal-congestion", name: "Stuffy nose and puffy face", category: "environmental", hazards: ["gravity"], areas: ["nose-throat"],
    terms: /stuffy nose|congest|blocked nose|puffy face|face (is )?puffy|head (feels )?(full|stuffy)/i, level: "none", perMission: 3.51,
    care: ["It is common: fluid shifts toward the head in weightlessness.", "Stay hydrated; mention it if it affects sleep."],
    watch: ["Fever, facial pain or thick discoloured discharge"] },
  { id: "nutrition", name: "Poor appetite or weight loss", category: "environmental", hazards: ["isolation", "gravity"], areas: ["whole-body", "abdomen"],
    terms: /appetite|not hungry|weight loss|losing weight|lost weight|not eating|food (aversion|fatigue)|menu fatigue|nutrition|deficien/i, level: "routine",
    care: ["Eat regular meals even when not hungry; vary your menu.", "Log your weight so changes are visible."],
    watch: ["Losing weight week after week", "Tiredness, dizziness or bleeding gums"],
    fact: { text: "NASA requires each crewmember to get 100% of their calculated nutrient and energy needs.", cite: s1(37) },
    links: [{ text: "Log food and weight", href: "/log" }] },
  { id: "med-reaction", name: "Reaction to a medicine", category: "environmental", hazards: ["distance"], areas: ["whole-body"],
    terms: /side ?effect|reaction to (my |the |a )?(medicine|medication|pill|drug|tablet)|after (i )?took (my |the )?(medicine|medication|pill)/i, level: "today",
    care: ["Don't take more of it until you've spoken with your flight surgeon.", "Note the medicine, the time you took it and what happened."],
    watch: ["Swelling of the face or throat, trouble breathing, or a spreading rash"] },
  { id: "urinary-retention", page: 83, name: "Trouble passing urine", category: "urinary", hazards: ["gravity"], areas: ["pelvis"],
    terms: /can'?t (pee|urinate)|unable to (pee|urinate)|trouble (peeing|urinating)|urinary retention|bladder (feels )?full/i, level: "today", perMission: 0.11,
    care: ["Relax, take your time and try again in a quiet, private moment.", "Report it the same day if you still can't go."],
    watch: ["Not able to pass urine for 8 hours or more", "Painful, swollen lower belly"] },
  { id: "incontinence", page: 83, name: "Leaking urine", category: "urinary", hazards: ["gravity"], areas: ["pelvis"],
    terms: /leak(ing)? (urine|pee)|incontinen|wet myself|can'?t hold (my )?(urine|pee|bladder)/i, level: "routine",
    care: ["Use the toilet on a regular schedule.", "Mention it at your next check-in; it is common while adapting."],
    watch: ["Leaking with back pain, numbness or leg weakness"] },

  // ---------------- Eyes (p. 84) ----------------
  { id: "sans", name: "Vision change (possible SANS)", category: "eyes", hazards: ["gravity"], areas: ["eyes"],
    terms: /blurr(y|ed)|vision (is )?(change|worse|blurry|fuzzy)|can'?t (see|read) (well|clearly|close|near|far)|eyesight|reading glasses|(near|far|distance) vision|double vision/i, level: "today", perMission: 2.08,
    care: ["Do the vision check so the change is on record.", "Try your stronger in-flight glasses if you have them."],
    watch: ["Sudden loss of vision or a curtain over your sight", "Eye pain or headache with the change"],
    fact: { text: "Crews carry glasses with stronger lenses because SANS can change eyesight in flight.", cite: s1(21) },
    links: [{ text: "Do the vision check", href: "/checkups/vision" }] },
  { id: "eye-foreign-body", name: "Something in the eye or eye scratch", category: "eyes", hazards: ["environment", "gravity"], areas: ["eyes"],
    terms: /something in (my )?eye|in my eye|eye (scratch|abrasion|irritat|gritty)|gritty eye|scratched (my )?eye|debris|particle in/i, level: "today", perMission: 7.42,
    care: ["Don't rub it.", "Flush gently with clean water, as in your eye-wash procedure.", "Floating debris is common in weightlessness: wear eye protection when cleaning or opening packages."],
    watch: ["Pain that gets worse, light sensitivity or vision change"] },
  { id: "eye-chemical", name: "Chemical in the eye", category: "eyes", hazards: ["environment"], areas: ["eyes"],
    terms: /chemical in (my )?eyes?|splash(ed)? (in|into) (my )?eyes?|eye (chemical )?burn|eyes? (burn|burning|sting)/i, level: "now", perMission: 0.64,
    care: ["Flush the eye with plenty of clean water right away, for at least 15 minutes.", "Then contact your flight surgeon."],
    watch: ["Any vision change or ongoing pain"] },
  { id: "eye-infection", name: "Red or infected eye", category: "eyes", hazards: ["environment"], areas: ["eyes"],
    terms: /red eye|pink ?eye|eye (infection|discharge|crust|pus)|swollen eyelid|stye|conjunctiv/i, level: "routine", perMission: 0.53,
    care: ["Keep your hands away from your eyes and wash them often.", "Don't share towels; stop using contact lenses."],
    watch: ["Eye pain, light sensitivity or blurred vision"] },
  { id: "vision-loss", name: "Sudden vision loss or flashes", category: "eyes", hazards: ["gravity", "radiation"], areas: ["eyes"],
    terms: /lost (my )?vision|vision loss|can'?t see (anything|out of)|blind|curtain|flash(es)? of light|new floaters|shower of floaters/i, level: "now",
    care: ["Stop what you're doing and get urgent medical help now."],
    watch: [] },

  // ---------------- Ears, nose and throat (p. 84) ----------------
  { id: "sinusitis", name: "Sinus infection", category: "ent", hazards: ["gravity"], areas: ["nose-throat"],
    terms: /sinus(itis| infection| pain)|facial pain|pressure (behind|around) (my )?(eyes|cheeks)/i, level: "routine", perMission: 0.64,
    care: ["Rest and drink fluids; avoid hot steam, which can scald in weightlessness."],
    watch: ["High fever, swelling around the eye, or severe headache"] },
  { id: "ear-infection", name: "Earache or ear infection", category: "ent", hazards: ["environment"], areas: ["ears"],
    terms: /ear ?(ache|pain|infection|discharge|itch)|ear (hurts|is sore)|otitis/i, level: "routine",
    care: ["Keep the ear dry; don't put anything in it."],
    watch: ["Fever, discharge, hearing loss or dizziness"] },
  { id: "respiratory-infection", name: "Cold, cough or sore throat", category: "ent", hazards: ["isolation", "environment"], areas: ["nose-throat", "chest", "whole-body"],
    terms: /sore throat|cough|common cold|a cold|\bflu\b|runny nose|sneez|chest cold|pharyngitis|influenza/i, level: "routine", perMission: 3.46,
    care: ["Rest, drink fluids and wash hands often; illness spreads easily in a small cabin.", "Record your temperature."],
    watch: ["Trouble breathing or chest pain", "High fever or coughing up blood"],
    links: [{ text: "Record your temperature", href: "/checkups/vitals" }] },
  { id: "earwax", name: "Blocked ear (earwax)", category: "ent", hazards: ["gravity"], areas: ["ears"],
    terms: /ear ?wax|ear (feels )?(blocked|full|plugged)|cerumen/i, level: "none",
    care: ["Don't use cotton buds; mention it at your next check-in."], watch: ["Pain, discharge or hearing loss"] },

  // ---------------- Teeth and mouth (p. 84) ----------------
  { id: "dental", name: "Tooth, filling or gum problem", category: "dental", hazards: ["distance"], areas: ["mouth"],
    terms: /tooth|teeth|toothache|filling|crown|gum(s)? (bleed|sore|swollen)|jaw (pain|swollen)|dental/i, level: "routine", perMission: 0.88,
    care: ["Keep brushing gently and rinse after meals.", "Avoid chewing on that side; keep a lost crown or filling."],
    watch: ["Swelling of the face or jaw, or fever (possible abscess)", "A knocked-out tooth"] },
  { id: "mouth-ulcer", name: "Mouth ulcer", category: "dental", hazards: ["isolation"], areas: ["mouth"],
    terms: /mouth (ulcer|sore)|canker|ulcer in (my )?mouth|cold sore/i, level: "none", perMission: 0.96,
    care: ["Avoid spicy or sharp foods; rinse with salt water if available."], watch: ["Lasting more than two weeks"] },

  // ---------------- Heart and circulation (p. 84) ----------------
  { id: "chest-pain", name: "Chest pain or pressure", category: "heart", hazards: ["gravity", "radiation"], areas: ["chest"],
    terms: /chest (pain|pressure|tight|hurts|discomfort)|tight(ness)? in (my )?chest|heart (attack|pain)|angina/i, level: "now",
    care: ["Stop activity and rest, and get urgent medical help now: your crew medical officer, flight surgeon or emergency services."], watch: [] },
  { id: "palpitations", name: "Racing or irregular heartbeat", category: "heart", hazards: ["gravity"], areas: ["chest"],
    terms: /palpitat|heart (is )?(racing|pounding|skipping|fluttering|flutter)|irregular (heart|pulse|heartbeat)|skipped beats/i, level: "today",
    care: ["Sit or rest quietly and record your heart rate.", "Note what you were doing and how long it lasted."],
    watch: ["With chest pain, fainting or shortness of breath"],
    links: [{ text: "Record your vitals", href: "/checkups/vitals" }] },
  { id: "orthostatic", name: "Dizziness or fainting on standing (after gravity return)", category: "heart", hazards: ["gravity"], areas: ["whole-body", "head"],
    terms: /(dizzy|lightheaded|light-headed|faint|blacking out|grey(ing)? out) (when|on|after) (i )?(stand|standing|getting up|landing)|after landing|since (we )?landed|orthostatic/i, level: "routine",
    care: ["Stand up slowly and sit or lie down if you feel faint.", "Drink fluids before standing activities after landing."],
    watch: ["Actually fainting, or fainting with chest pain"],
    fact: { text: "Orthostatic intolerance after spaceflight has been seen even after short stays in weightlessness.", cite: { source: "cardio", page: 21 } } },
  { id: "high-bp", name: "High blood pressure", category: "heart", hazards: ["gravity", "isolation"], areas: ["chest"],
    terms: /(blood pressure|\bBP\b) (is )?(high|up|raised)|hypertension/i, level: "routine",
    care: ["Record your blood pressure at the same time each day."], watch: ["Very high readings with headache, chest pain or vision change"],
    links: [{ text: "See your blood pressure trend", href: "/vitals" }] },
  { id: "vte", name: "Possible blood clot", category: "heart", hazards: ["gravity"], areas: ["lower-leg", "thigh", "arm", "neck"],
    terms: /blood clot|\bclot\b|\bDVT\b|swollen (leg|calf|arm|neck)|(neck|face) (is )?(swollen|swelling|puffy and (sore|painful))|swelling (in|of) (my )?(neck|face)|jugular|(leg|calf|arm) (is )?(swollen|swelling).{0,30}(one|only|left|right)|(one|left|right) (leg|calf) (is )?swollen|swollen (left|right|one) (leg|calf|arm)/i, level: "today",
    care: ["Keep the limb still and report it today. Don't massage or rub it: that could move a clot.", "In the neck, a clot can form without symptoms; ask whether a neck-vein ultrasound can be done."],
    watch: ["Sudden shortness of breath or chest pain", "Headache, vision change or swelling of the face"],
    fact: { text: "Venous thromboembolism is a recognized in-flight risk for astronauts.", cite: { source: "cardio", page: 19 } },
    links: [{ text: "Hidden risks: clots in the neck veins", href: "/risks#jugular-clot" }] },

  // ---------------- Lungs and chest (p. 84) ----------------
  { id: "breathing", name: "Wheezing or shortness of breath", category: "lungs", hazards: ["environment"], areas: ["chest"],
    terms: /wheez|short(ness)? of breath|breathless|out of breath|can'?t catch my breath|asthma|hard to breathe/i, level: "today",
    care: ["Stop and rest; check cabin air readings.", "Record your heart rate and how long it lasts."],
    watch: ["Can't speak in full sentences", "Lips or face turning blue", "Chest pain"] },
  { id: "chest-injury", name: "Chest or rib injury", category: "lungs", hazards: ["environment"], areas: ["chest"],
    terms: /(hit|bumped|banged|injured) (my )?(chest|ribs?)|rib (pain|injury)|cracked rib/i, level: "today",
    care: ["Rest and avoid heavy exercise until checked."], watch: ["Shortness of breath or pain when breathing"] },

  // ---------------- Stomach and gut (p. 84) ----------------
  { id: "abdominal-pain", name: "Stomach or belly pain", category: "gut", hazards: ["environment"], areas: ["abdomen"],
    terms: /(stomach|belly|abdominal|tummy|gut) (pain|ache|cramp|hurts)|stomach ?ache|cramps/i, level: "routine",
    care: ["Rest, sip fluids and note where exactly it hurts."],
    watch: ["Severe or constant pain, especially low on the right", "Pain with fever, vomiting or a hard, tender belly", "Blood in vomit or black stools"] },
  { id: "constipation", name: "Constipation", category: "gut", hazards: ["gravity"], areas: ["abdomen"],
    terms: /constipat|can'?t (poop|go to the toilet)|no bowel movement|hard stool|haven'?t pooped/i, level: "none", perMission: 1.02,
    care: ["Drink more water, eat fiber and stay active."], watch: ["No bowel movement for 4 days or more, or belly pain and vomiting"] },
  { id: "diarrhea", name: "Diarrhea", category: "gut", hazards: ["environment", "radiation"], areas: ["abdomen"],
    terms: /diarrh|loose (stool|bowel)|runny (stool|poo)|stomach bug|gastroenteritis|food poisoning/i, level: "routine", perMission: 3.53,
    care: ["Drink plenty of fluids; wash hands carefully to protect the crew.", "Note anything you ate that others didn't."],
    watch: ["Blood in stool or signs of dehydration", "Diarrhea after a radiation event"],
    fact: { text: "High-volume diarrhea in flight can come from acute radiation events beyond low Earth orbit or from food that wasn't properly stored or prepared.", cite: s2(125) } },
  { id: "reflux", name: "Heartburn or indigestion", category: "gut", hazards: ["gravity"], areas: ["abdomen", "chest"],
    terms: /heartburn|indigestion|reflux|acid (in my throat|reflux)|burping/i, level: "none", perMission: 0.64,
    care: ["Eat smaller meals and avoid eating just before sleep."], watch: ["Chest pain that might be your heart", "Trouble swallowing"] },
  { id: "hemorrhoids", name: "Hemorrhoids", category: "gut", hazards: ["gravity"], areas: ["pelvis"],
    terms: /h(a)?emorrhoid|piles|blood on (the )?(toilet )?paper|rectal (pain|bleeding)/i, level: "routine", perMission: 0.22,
    care: ["Avoid straining; drink water and eat fiber."], watch: ["Heavy bleeding or dark, tarry stools"] },
  { id: "hernia", name: "Hernia", category: "gut", hazards: ["gravity"], areas: ["abdomen", "pelvis"],
    terms: /hernia|bulge in (my )?(groin|belly|abdomen)|lump in (my )?groin/i, level: "routine",
    care: ["Avoid heavy lifting and straining until checked."], watch: ["The bulge becomes painful, hard or can't be pushed back"] },

  // ---------------- Kidneys, bladder, reproductive (p. 85) ----------------
  { id: "uti", name: "Urinary infection", category: "urinary", hazards: ["environment"], areas: ["pelvis"],
    terms: /burn(s|ing)? (when|while) (i )?(pee|urinat)|(pee|peeing|urinating) (burns|hurts)|\bUTI\b|urinary (infection|frequency)|cloudy urine|need to pee (all the time|often)/i, level: "routine", perMission: 1.44,
    care: ["Drink more water and record your temperature."], watch: ["Fever, back or side pain, or blood in urine"] },
  { id: "kidney-stone", name: "Possible kidney stone", category: "urinary", hazards: ["gravity"], areas: ["lower-back", "abdomen", "pelvis"],
    terms: /kidney (stone|pain)|flank pain|pain in (my )?side.{0,20}(back|groin)|blood in (my )?(urine|pee)|renal colic/i, level: "today",
    care: ["Drink water steadily and report it today."], watch: ["Severe pain, fever, or not being able to pass urine"],
    fact: { text: "NASA's medical model ranks a kidney stone as the second most likely reason for an emergency evacuation from the ISS.", cite: { source: "nasaFundamentals", page: 0 } },
    links: [{ text: "Hidden risks: silent kidney stones", href: "/risks#kidney-stones" }] },
  { id: "gynecologic", name: "Period, vaginal or pelvic problem", category: "urinary", hazards: ["gravity"], areas: ["pelvis"],
    terms: /period|menstrua|vaginal|yeast infection|uterine|pelvic pain|spotting/i, level: "routine",
    care: ["Note dates and how it differs from your usual pattern."], watch: ["Heavy bleeding, severe pelvic pain or fever"] },

  // ---------------- Bones, muscles and joints (p. 85) ----------------
  { id: "sprain", name: "Sprain or strain", category: "musculoskeletal", hazards: ["gravity", "environment"], areas: ["shoulder", "arm", "hand", "hip", "knee", "foot", "neck", "thigh", "lower-leg"],
    terms: /sprain|strain|twist(ed)? (my )?|pulled (a )?muscle|sore (muscle|joint)|joint pain|(shoulder|elbow|wrist|knee|ankle|hip) (pain|hurts|sore|aches?)|(sore|painful|stiff) (shoulder|elbow|wrist|knee|ankle|hip)|(shoulder|elbow|wrist|knee|ankle|hip|neck) (is |feels )?(stiff|swollen)/i, level: "none",
    care: ["Rest the joint and use a cold pack in the first day or two if available.", "Restart exercise gradually, without pain."],
    watch: ["Can't move or bear weight on it", "Numbness, deformity or severe swelling"],
    links: [{ text: "See your exercise plan", href: "/exercise" }] },
  { id: "fracture", name: "Possible broken bone", category: "musculoskeletal", hazards: ["gravity", "environment"], areas: ["hand", "arm", "foot", "lower-leg", "hip", "shoulder"],
    terms: /broke|broken|fracture|crack(ed)? (a )?bone|deform|bent wrong|can'?t (put weight|move it|bend)/i, level: "today",
    care: ["Keep it still; splint it in the position you found it if trained to.", "Report it today; bone heals more slowly in weightlessness."],
    watch: ["Bone through the skin, cold or numb fingers or toes"] },
  { id: "dislocation", name: "Dislocation", category: "musculoskeletal", hazards: ["environment"], areas: ["hand", "arm", "shoulder"],
    terms: /dislocat|popped out|out of (its )?socket/i, level: "today",
    care: ["Don't try to push it back unless trained to; keep it still."], watch: ["Numbness or cold fingers"] },
  { id: "eva-hand", name: "Spacesuit glove injury (hands and fingernails)", category: "musculoskeletal", hazards: ["environment"], areas: ["hand"],
    terms: /fingernail|nail(s)? (lift|lifting|coming off|delaminat|black)|(glove|EVA|spacewalk|suit).{0,40}(hand|finger|nail|knuckle)|finger ?tips? (numb|pain|sore)|hot ?spot/i, level: "routine", perMission: 0.4,
    care: ["Record which fingers and photograph them after each spacewalk.", "Tell the suit team about glove fit before the next spacewalk."],
    watch: ["Nail coming off, signs of infection or numbness that doesn't fade"] },
  { id: "suit-contact", name: "Spacesuit rubbing or pressure injury", category: "musculoskeletal", hazards: ["environment"], areas: ["shoulder", "skin", "foot", "knee"],
    terms: /suit (rub|chaf|pressure point|bruise|hot spot)|chaf(e|ing)|pressure sore/i, level: "routine",
    care: ["Protect the area with padding before the next suit run.", "Report it to the suit team."], watch: ["Broken skin or signs of infection"] },
  { id: "stress-fracture", name: "Leg or foot pain from exercise", category: "musculoskeletal", hazards: ["gravity"], areas: ["lower-leg", "foot"],
    terms: /shin (pain|splint)|pain (when|while) (running|on the treadmill)|treadmill.{0,30}(pain|hurts)|foot pain|stress fracture/i, level: "routine", perMission: 0.13,
    care: ["Stop impact exercise and ask for it to be checked; a stress fracture needs imaging to confirm.", "Swap in cycling or upper-body work meanwhile, and return gradually once cleared."],
    watch: ["Pain at one spot on the bone, or pain at rest"],
    links: [{ text: "See your exercise plan", href: "/exercise" }] },
  { id: "overuse", name: "Overuse injury or tendon pain", category: "musculoskeletal", hazards: ["gravity", "environment"], areas: ["arm", "hand", "shoulder", "knee"],
    terms: /overuse|repetitive|tendon|tendinitis|tendonitis|(elbow|wrist|shoulder) pain from/i, level: "routine",
    care: ["Rest the movement that causes it and vary your tasks."], watch: ["Weakness or swelling"] },
  { id: "subungual", name: "Bruised nail (blood under the nail)", category: "musculoskeletal", hazards: ["environment"], areas: ["hand", "foot"],
    terms: /blood under (my |the )?nail|black(ened)? (finger|toe)?nail|bruised nail/i, level: "none",
    care: ["Keep the finger protected; mention it before the next spacewalk."], watch: ["Severe throbbing pain or signs of infection"] },
  { id: "disc", name: "Back pain spreading into a leg", category: "musculoskeletal", hazards: ["gravity"], areas: ["lower-back"],
    terms: /sciatica|pain (down|shooting|going) (into )?(my )?(leg|buttock)|slipped disc|disc (injury|pain)/i, level: "routine",
    care: ["Keep gently moving; avoid heavy loading until checked."], watch: ["Numbness, weakness, or trouble with bladder or bowels"] },
  { id: "bone-loss", name: "Bone loss concern", category: "musculoskeletal", hazards: ["gravity"], areas: ["hip", "lower-back"],
    terms: /bone (loss|density)|osteopor|weak bones/i, level: "none",
    care: ["Keep up resistance exercise and calcium and vitamin D in your diet as planned."], watch: ["Any bone pain after a minor knock"],
    fact: { text: "Astronauts lose about 1–1.5% of hip and spine bone density per month in weightlessness.", cite: { source: "bone", page: 42 } },
    links: [{ text: "Estimate your bone loss", href: "/tools#bone" }] },
  { id: "muscle-loss", name: "Losing strength or fitness", category: "musculoskeletal", hazards: ["gravity"], areas: ["thigh", "whole-body"],
    terms: /muscle (loss|wasting)|getting weaker|losing (strength|fitness|muscle)|atrophy|deconditioned/i, level: "none",
    care: ["Keep to your exercise plan, including resistance training."], watch: ["Weakness on one side or that comes on suddenly"],
    fact: { text: "NASA's fitness standard assumes aerobic capacity drops about 15% on average in long flights, and can be rebuilt afterwards.", cite: s1(34) },
    links: [{ text: "See your exercise plan", href: "/exercise" }] },
  { id: "compartment", name: "Severe pain in a tight, swollen limb", category: "musculoskeletal", hazards: ["environment"], areas: ["lower-leg", "arm", "thigh"],
    terms: /compartment syndrome|(severe|extreme) pain.{0,30}(tight|swollen|hard) (leg|arm|calf|limb)/i, level: "now",
    care: ["Loosen anything tight around the limb and get urgent medical help now."], watch: [] },

  // ---------------- Skin (p. 85) ----------------
  { id: "abrasion", name: "Scrape or cut", category: "skin", hazards: ["environment"], areas: ["skin", "hand", "arm", "knee"],
    terms: /scrape|scraped|abrasion|\bcut\b|laceration|graze|grazed|gash/i, level: "none", perMission: 9.86,
    care: ["Clean with clean water and cover with a dressing.", "Change the dressing daily and keep it dry."],
    watch: ["Deep or gaping wound, or bleeding that won't stop", "Redness, warmth, swelling or pus"] },
  { id: "rash", name: "Rash or itchy skin", category: "skin", hazards: ["environment"], areas: ["skin"],
    terms: /rash|itch|eczema|dry skin|peeling|flaky skin|skin (irritation|bumps)/i, level: "none", perMission: 9.83,
    care: ["Keep the skin clean, dry and moisturized; avoid scratching.", "Note any new soap, wipe, clothing or exposure."],
    watch: ["Spreading rash, blisters, fever, or swelling of the face"] },
  { id: "skin-infection", name: "Skin infection", category: "skin", hazards: ["environment"], areas: ["skin"],
    terms: /(red|warm|hot) and (swollen|painful)|pus|infected|cellulitis|\bboil\b|abscess|red streak/i, level: "today", perMission: 1.38,
    care: ["Keep it clean and covered, and mark the edge of any redness to see if it spreads."], watch: ["Red streaks, fever or fast spreading"] },
  { id: "shingles", name: "Shingles (painful band of blisters)", category: "skin", hazards: ["isolation", "radiation"], areas: ["skin", "chest", "upper-back"],
    terms: /shingles|band of (rash|blisters)|blisters on one side|herpes zoster/i, level: "today", perMission: 0.11,
    care: ["Keep it covered and report it today; early treatment matters."], watch: ["Near the eye"],
    fact: { text: "Stress in spaceflight has been linked to dormant viruses reactivating.", cite: { source: "behavioral", page: 31 } } },
  { id: "skin-chemical", name: "Chemical on the skin", category: "skin", hazards: ["environment"], areas: ["skin", "hand"],
    terms: /chemical (on|burn|got on) (my )?(skin|hand|arm)|skin (contact|exposure) (with|to)/i, level: "today",
    care: ["Remove contaminated clothing and flush the skin with water for at least 15 minutes."], watch: ["Blistering or breathing symptoms"] },

  // ---------------- Brain, nerves and balance (p. 85) ----------------
  { id: "vestibular", name: "Dizziness or balance problems after a gravity change", category: "neuro", hazards: ["gravity"], areas: ["ears", "head"],
    terms: /dizz|vertigo|spinning|balance|unsteady|disorient|room (is )?spinning|wobbly/i, level: "routine",
    care: ["Move your head slowly and hold on when moving.", "Avoid demanding tasks until it settles."],
    watch: ["With slurred speech, weakness, severe headache or double vision"],
    fact: { text: "NASA requires preventive measures for balance problems during gravity changes such as launch and landing.", cite: s1(20) } },
  { id: "head-trauma", name: "Head injury", category: "neuro", hazards: ["environment", "gravity"], areas: ["head"],
    terms: /(hit|bumped|banged|knocked) (my )?head|head (injury|bump|knock|trauma)|concussion/i, level: "today",
    care: ["Rest and have a crewmate check on you over the next few hours."],
    watch: ["Vomiting, confusion, drowsiness, unequal pupils or worsening headache"] },
  { id: "paresthesia", name: "Numbness, tingling or weakness", category: "neuro", hazards: ["environment", "gravity"], areas: ["hand", "arm", "foot", "whole-body"],
    terms: /tingl|pins and needles|numb|weakness in|lost feeling/i, level: "today",
    care: ["Note exactly where, when it started and whether it comes and goes.", "Loosen anything pressing on the area."],
    watch: ["Sudden weakness or numbness on one side of the body", "With confusion, speech trouble or vision loss"] },
  { id: "cognitive", name: "Trouble focusing or thinking clearly", category: "neuro", hazards: ["isolation", "radiation", "gravity"], areas: ["mind", "head"],
    terms: /forgetful|can'?t (focus|concentrate|think)|brain fog|foggy|slow(er)? thinking|making (more )?mistakes|space fog|confus/i, level: "routine",
    care: ["Protect your sleep and take short breaks between demanding tasks.", "Use checklists for critical tasks."],
    watch: ["Sudden confusion", "With headache, vision change or after a head knock"] },

  // ---------------- Mind, mood, sleep and team (p. 86) ----------------
  { id: "anxiety", name: "Stress, anxiety or panic", category: "mind", hazards: ["isolation", "distance"], areas: ["mind"],
    terms: /anxi|panic|stress(ed|ful)?|overwhelm|worried|worrying|nervous|on edge|tense/i, level: "routine",
    care: ["Slow breathing: breathe in for 4, out for 6, for a few minutes.", "Talk to a crewmate or arrange a private conference with your support team."],
    watch: ["Panic that keeps coming back or stops you working", "Thoughts of harming yourself"],
    fact: { text: "Stress in spaceflight has been linked to immune changes such as dormant viruses reactivating.", cite: { source: "behavioral", page: 31 } },
    links: [{ text: "Write in your journal", href: "/journal" }, { text: "Do the mood check-in", href: "/checkups/mood" }] },
  { id: "low-mood", name: "Low mood or irritability", category: "mind", hazards: ["isolation", "distance"], areas: ["mind"],
    terms: /depress|sad\b|hopeless|feeling (down|low|empty|flat)|low mood|crying|irritab|snapping at|angry|no joy/i, level: "routine",
    care: ["Keep a routine, exercise, and stay in touch with people you trust.", "Ask for a private conference with your behavioral health team."],
    watch: ["Low mood for two weeks or more", "Thoughts of harming yourself"],
    links: [{ text: "Do the mood check-in", href: "/checkups/mood" }, { text: "Write in your journal", href: "/journal" }] },
  { id: "sleep", name: "Poor sleep or body clock out of sync", category: "mind", hazards: ["isolation", "gravity", "environment"], areas: ["mind"],
    terms: /can'?t sleep|insomnia|sleep(ing)? (badly|poorly|terribly)|(waking|wake) up (a lot|at night|early)|tired|exhausted|jet ?lag|circadian|shift (change|schedule)|sleep shift/i, level: "none", perMission: 13.85,
    care: ["Keep a regular sleep period; use eye mask, earplugs and a dark, cool sleep station.", "Avoid screens and caffeine before sleep."],
    watch: ["Sleeping under 6 hours most nights for a week", "Falling asleep during critical tasks"],
    fact: { text: "Astronauts sleep about six hours a night in space, less than recommended.", cite: { source: "sleep", page: 11 } },
    links: [{ text: "Check your sleep in the sleep tool", href: "/tools#sleep" }] },
  { id: "conflict", name: "Tension or conflict with crew, ground or family", category: "mind", hazards: ["isolation", "distance"], areas: ["mind"],
    terms: /conflict|argu(e|ed|ing|ment)|tension with|fight with|annoyed (with|by)|crew ?mate|(crew|team|ground|mission control|family) (problem|issue)|not getting along|frustrated with/i, level: "routine",
    care: ["Raise it early, calmly and privately; focus on the task, not the person.", "Use your crew's agreed ways to resolve disagreements."],
    watch: ["It affects safety, sleep or your ability to work"],
    fact: { text: "Monotony and the confined environment can lead to boredom, interpersonal conflict and loss of motivation.", cite: { source: "behavioral", page: 46 } } },
  { id: "isolation", name: "Loneliness or homesickness", category: "mind", hazards: ["isolation", "distance"], areas: ["mind"],
    terms: /lonely|isolat|homesick|miss (my )?(family|home|kids|partner|friends)|cut off|far from home|communication delay|no contact/i, level: "routine",
    care: ["Plan regular contact with home and keep messages going even with delays.", "Share meals and downtime with the crew."],
    watch: ["Withdrawing from the crew or low mood lasting weeks"],
    fact: { text: "With communication delays, crews must spot and handle behavioral health problems themselves.", cite: { source: "behavioral", page: 55 } } },
  { id: "monotony", name: "Boredom, low motivation or burnout", category: "mind", hazards: ["isolation"], areas: ["mind"],
    terms: /bored|monoton|same (thing )?every day|unmotivated|no motivation|apath|burn(ed|t) ?out|overload|too much work|overworked/i, level: "routine",
    care: ["Add variety: hobbies, new tasks, a change of routine.", "Talk to mission control about workload."],
    watch: ["Mistakes in critical tasks or losing interest in everything"],
    fact: { text: "Monotony and the confined environment can lead to boredom, interpersonal conflict and loss of motivation.", cite: { source: "behavioral", page: 46 } } },
  { id: "grief", name: "Grief or bad news from home", category: "mind", hazards: ["distance", "isolation"], areas: ["mind"],
    terms: /grie(f|ving)|someone died|passed away|bad news (from home)?|funeral|loss of (my|a)/i, level: "routine",
    care: ["Ask for a private conference with your support team and family.", "Let your crew know you need some space or support."],
    watch: ["You can't function or are thinking about harming yourself"] },

  // ---------------- Other (p. 86) ----------------
  { id: "fatigue", name: "Unusual tiredness or weakness", category: "other", hazards: ["gravity", "isolation", "radiation"], areas: ["whole-body"],
    terms: /fatigue|always tired|tired all the time|no energy|weak(ness)?\b/i, level: "routine",
    care: ["Check your sleep, food and fluid intake.", "Record your heart rate and temperature."],
    watch: ["Shortness of breath, fainting or a racing heart"] },
  { id: "space-anemia", name: "Possible anemia (low red blood cells)", category: "other", hazards: ["gravity"], areas: ["whole-body"],
    terms: /an(a)?emi|\bpale\b|look(ing)? pale|out of breath (easily|quickly|with (little|light) (effort|exercise))|breathless (on|with) (light )?(effort|exertion|stairs)|low (h(a)?emoglobin|iron|blood count)/i, level: "routine",
    care: ["Ask for a blood count (haemoglobin) at your next medical check.", "Stand up slowly and keep up food and fluids, especially after landing."],
    watch: ["Breathless at rest, chest pain, fainting or a racing heart"],
    source: { source: "spaceAnemia", page: 0 },
    fact: { text: "On 6-month ISS missions astronauts destroyed 54% more red blood cells than before flight, and effects lasted a year after landing.", cite: { source: "spaceAnemia", page: 0 } },
    links: [{ text: "Hidden risks: space anemia", href: "/risks#space-anemia" }, { text: "Balance and stand-up test", href: "/checkups/balance" }] },
  { id: "fever", name: "Fever or feeling unwell", category: "other", hazards: ["isolation", "environment"], areas: ["whole-body"],
    terms: /fever|feverish|chills|temperature (is )?(high|up)|feel(ing)? (unwell|ill)|hot and cold/i, level: "routine",
    care: ["Record your temperature every few hours, rest and drink fluids.", "Limit close contact with the crew."],
    watch: ["Temperature above 38.5 °C, confusion, or a racing heart"],
    links: [{ text: "Record your vitals", href: "/checkups/vitals" }] },
];

// ---------------------------------------------------------------------------
// Emergency phrases. Any match means "contact your flight surgeon or emergency services now".
// ---------------------------------------------------------------------------

export const RED_FLAGS: { id: string; label: string; re: RegExp }[] = [
  { id: "chest", label: "Chest pain or pressure", re: /chest (pain|pressure|tightness)|crushing|heart attack/i },
  { id: "breath", label: "Severe breathing trouble", re: /can'?t breathe|cannot breathe|struggling to breathe|choking|throat (is )?(closing|swelling)|lips? (are )?(swelling|swollen|blue)|turning blue/i },
  { id: "stroke", label: "Possible stroke", re: /face (is )?droop|slurred speech|can'?t (move|feel) (my )?(arm|leg|face|one side)|sudden(ly)? (weak|numb)|stroke/i },
  { id: "consciousness", label: "Fainting, seizure or unconsciousness", re: /passed out|fainted|unconscious|blacked out|unresponsive|seizure|convuls/i },
  { id: "bleeding", label: "Heavy or internal bleeding", re: /won'?t stop bleeding|bleeding (heavily|a lot)|vomit(ing|ed)? blood|cough(ing|ed)? (up )?blood|blood in (my )?vomit|black,? tarry/i },
  { id: "vision", label: "Sudden vision loss", re: /sudden(ly)? (lost|loss of|can'?t see)|curtain over|lost (my )?vision/i },
  { id: "headache", label: "Sudden severe headache", re: /worst headache|thunderclap|stiff neck (and|with) (a )?fever/i },
  { id: "environment", label: "Fire, smoke, leak or loss of pressure", re: /\bfire\b|smoke|depressur|pressure (leak|drop|loss)|suit (leak|breach|tear)|toxic (leak|spill|fumes)|ammonia (leak|smell)/i },
  { id: "allergy", label: "Severe allergic reaction", re: /anaphyla|allergic reaction.{0,40}(breath|throat|swell)/i },
  { id: "abdomen", label: "Severe abdominal pain", re: /severe (stomach|belly|abdominal) pain|rigid (belly|stomach|abdomen)/i },
  { id: "head-injury", label: "Head injury with warning signs", re: /(hit|bumped|banged) (my )?head.{0,60}(vomit|confus|drows|sleepy|pass)/i },
  { id: "self-harm", label: "Thoughts of self-harm", re: /suicid|kill(ing)? myself|end(ing)? (my life|it all)|hurt(ing)? myself|self[- ]harm|don'?t want to (live|be alive)|better off dead/i },
];

/** True if the words just before a match negate it ("no chest pain", "not dizzy"). */
function negated(text: string, index: number) {
  const before = text.slice(Math.max(0, index - 30), index).toLowerCase();
  return /\b(no|not|never|without|denies|deny|don'?t have|didn'?t have|isn'?t|wasn'?t|free of)\b[^.,;!?]*$/.test(before);
}

function hits(re: RegExp, text: string) {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  let n = 0;
  for (const m of text.matchAll(g)) if (!negated(text, m.index ?? 0)) n++;
  return n;
}

export type Analysis = {
  matches: { condition: Condition; score: number }[];
  redFlags: { id: string; label: string }[];
  hazards: Hazard[];
};

/**
 * Reads the person's own words (plus the area they chose) and finds the most likely space-medicine
 * topics and any emergency warning signs. Keyword-based: it doesn't understand meaning, so it errs on
 * the side of flagging.
 */
export function analyzeText(text: string, area?: string): Analysis {
  const t = text.replace(/\s+/g, " ").trim();
  const redFlags = t ? RED_FLAGS.filter((f) => hits(f.re, t) > 0).map(({ id, label }) => ({ id, label })) : [];
  if (t && needsSupport(t) && !redFlags.some((f) => f.id === "self-harm")) redFlags.push({ id: "self-harm", label: "Thoughts of self-harm" });
  const matches = t
    ? CONDITIONS.map((c) => {
        const n = hits(c.terms, t);
        return { condition: c, score: n === 0 ? 0 : n + (area && c.areas.includes(area) ? 1 : 0) };
      }).filter((m) => m.score > 0).sort((a, b) => b.score - a.score || RANK[b.condition.level] - RANK[a.condition.level])
    : [];
  const hazards = [...new Set(matches.slice(0, 3).flatMap((m) => m.condition.hazards))];
  return { matches: matches.slice(0, 4), redFlags, hazards };
}

const RANK: Record<Escalation, number> = { none: 0, routine: 1, today: 2, now: 3 };

export function conditionCite(c: Condition): Cite {
  return c.source ?? s1(c.page ?? CATEGORIES[c.category].page);
}

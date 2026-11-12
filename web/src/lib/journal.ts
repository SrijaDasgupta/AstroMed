/** Topics from NASA's astronaut journal study: 10 categories covered 88% of ISS journal entries (Behavioral health report, p. 21). */
export const JOURNAL_TOPICS = [
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact with home" },
  { id: "adjustment", label: "Adjusting" },
  { id: "crew", label: "Crew relations" },
  { id: "leisure", label: "Leisure" },
  { id: "equipment", label: "Equipment" },
  { id: "events", label: "Events" },
  { id: "schedule", label: "Schedule and planning" },
  { id: "sleep", label: "Sleep" },
  { id: "food", label: "Food" },
] as const;

export const PROMPTS = [
  "What went well today, and why?",
  "How are you adjusting, physically and mentally?",
  "How are things with the people around you?",
  "Who did you connect with outside the mission today?",
  "What's on your mind about work or the schedule?",
  "What did you do just for yourself today?",
  "What's one thing you're looking forward to?",
];

export const MOODS = [
  { value: 1, label: "Very low", face: "😞" },
  { value: 2, label: "Low", face: "🙁" },
  { value: 3, label: "Okay", face: "😐" },
  { value: 4, label: "Good", face: "🙂" },
  { value: 5, label: "Very good", face: "😄" },
];

/** A different prompt each day. */
export function promptOfDay(date: string) {
  const n = [...date].reduce((h, c) => h + c.charCodeAt(0), 0);
  return PROMPTS[n % PROMPTS.length];
}

/** Words that mean the person may be at risk. Shown support resources, never blocked or stored differently. */
const RISK = /\b(suicid\w*|kill(ing)? (my|him|her)self|end(ing)? (my life|it all)|self[- ]?harm|hurt(ing)? myself|want to die|don'?t want to (live|be here|be alive)|no reason to live|better off dead)\b/i;
export function needsSupport(text: string) {
  return RISK.test(text);
}

import type { CheckupLog } from "@/lib/checkup-store";
import { CHECKUPS } from "@/lib/checkups";
import type { Assessment } from "@/lib/crew";
import { addDays, localDate } from "@/lib/dates";
import type { MissionEnvironment } from "@/lib/environments";
import type { TipAction } from "@/lib/profile-store";
import { TIPS, tipsForAlerts, tipsForEnvironment, type Tip } from "@/lib/tips";

export const XP = { habit: 10, checkup: 20, journal: 10, allMissionsBonus: 15 };

export const RANKS = [
  { xp: 0, name: "Cadet" },
  { xp: 100, name: "Astronaut candidate" },
  { xp: 300, name: "Mission specialist" },
  { xp: 700, name: "Flight engineer" },
  { xp: 1500, name: "Commander" },
];

export const MISSIONS_PER_DAY = 3;

/** Three habits for today: first ones that answer this person's alerts, then ones for the mission, rotating daily. */
export function dailyMissions(a: Assessment, env: MissionEnvironment, date = localDate()): Tip[] {
  const flagged = a.metrics.filter((m) => m.status !== "good").map((m) => ({ key: m.def.key, deviation: m.deviation }));
  const withHabit = (t: Tip) => Boolean(t.habit);
  const picked = tipsForAlerts(flagged, env.id, 6).filter(withHabit).slice(0, 2);
  const pool = tipsForEnvironment(env.id).filter((t) => withHabit(t) && !picked.includes(t));
  const seed = [...date].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  for (let i = 0; picked.length < MISSIONS_PER_DAY && pool.length > 0; i++) {
    picked.push(pool.splice((seed + i * 7) % pool.length, 1)[0]);
  }
  return picked;
}

export type Badge = { id: string; name: string; description: string; earned: boolean };

export function progress(logs: CheckupLog[], actions: TipAction[], missionIds: string[], today = localDate(), journalDates: string[] = []) {
  // Imported readings are history, not activity: they earn no XP and don't build streaks.
  logs = logs.filter((l) => l.checkupId !== "import" && l.checkupId !== "photo");
  const journalDays = new Set(journalDates);
  const activeDays = new Set<string>([...actions.map((a) => a.doneOn), ...logs.map((l) => localDate(new Date(l.createdAt))), ...journalDays]);

  // Days on which every one of that day's missions was done earn a bonus; only today's list is known, so count today.
  const doneToday = new Set(actions.filter((a) => a.doneOn === today).map((a) => a.tipId));
  const allMissionsToday = missionIds.length > 0 && missionIds.every((id) => doneToday.has(id));

  const xp = actions.length * XP.habit + logs.length * XP.checkup + journalDays.size * XP.journal + (allMissionsToday ? XP.allMissionsBonus : 0);
  const rankIndex = RANKS.reduce((i, r, idx) => (xp >= r.xp ? idx : i), 0);
  const next = RANKS[rankIndex + 1];

  let streak = 0;
  let day = activeDays.has(today) ? today : addDays(today, -1);
  while (activeDays.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  const sorted = [...activeDays].sort();
  let best = 0, run = 0, prev = "";
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  const checkupTypes = new Set(logs.map((l) => l.checkupId));
  const topicsDone = new Set(actions.map((a) => TIPS.find((t) => t.id === a.tipId)?.topic).filter(Boolean));
  const badges: Badge[] = [
    { id: "first-step", name: "First step", description: "Complete your first health habit or checkup.", earned: actions.length + logs.length > 0 },
    { id: "full-board", name: "Full board", description: "Finish all of today's missions.", earned: allMissionsToday },
    { id: "streak-3", name: "Three in a row", description: "Be active 3 days in a row.", earned: best >= 3 },
    { id: "streak-7", name: "Week in orbit", description: "Be active 7 days in a row.", earned: best >= 7 },
    { id: "all-checkups", name: "Full physical", description: "Do each of the 5 checkup types at least once.", earned: CHECKUPS.every((c) => checkupTypes.has(c.id)) },
    { id: "explorer", name: "Explorer", description: "Complete habits from 4 different topics.", earned: topicsDone.size >= 4 },
    { id: "habit-25", name: "Creature of habit", description: "Complete 25 habits.", earned: actions.length >= 25 },
    { id: "reflective", name: "Reflective", description: "Write in your journal on 5 different days.", earned: journalDays.size >= 5 },
  ];

  return {
    xp,
    rank: RANKS[rankIndex].name,
    nextRank: next?.name,
    toNext: next ? next.xp - xp : 0,
    rankProgress: next ? (xp - RANKS[rankIndex].xp) / (next.xp - RANKS[rankIndex].xp) : 1,
    streak,
    bestStreak: best,
    doneToday,
    allMissionsToday,
    badges,
    activeDays,
  };
}

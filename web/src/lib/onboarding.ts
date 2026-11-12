import { loadLogs } from "@/lib/checkup-store";
import { DAILY_LOG_ID } from "@/lib/daily-log";
import { listEntries } from "@/lib/journal-store";
import { listMissions } from "@/lib/missions-store";
import { getProfile } from "@/lib/profile-store";
import { listRecords } from "@/lib/records-store";
import { loadSchedule } from "@/lib/reminder-store";
import type { Viewer } from "@/lib/session";

export type SetupStep = {
  id: string;
  title: string;
  why: string;
  href: string;
  cta: string;
  area: "General" | "Personalized";
  done: boolean;
};

/** The first steps that unlock most of AstroMed, each ticked off from the user's own data. */
export async function setupSteps(viewer: Viewer): Promise<SetupStep[]> {
  const [profile, missions, { logs }, schedule, journal, records] = await Promise.all([
    getProfile(viewer),
    listMissions(viewer),
    loadLogs(viewer),
    loadSchedule(viewer),
    listEntries(viewer, 1),
    viewer.kind === "user" ? listRecords(viewer) : Promise.resolve({ records: [] }),
  ]);
  const own = logs.filter((l) => l.checkupId !== "import");
  const hasDetails = Object.values(profile.details).some((v) => v !== undefined && v !== "") || Object.keys(profile.baseline).length > 0;

  return [
    { id: "profile", area: "Personalized", title: "Fill in your profile", why: "Your age, height, weight and usual values (like resting heart rate) let AstroMed compare you with your own normal, not an average.", href: "/profile", cta: "Open my profile", done: hasDetails },
    { id: "mission", area: "General", title: "Add your mission", why: "Your mission's type and dates set the radiation estimate, gravity effects, exercise plan and tips. Until then AstroMed assumes you're on Earth.", href: "/mission", cta: "Add a mission", done: missions.length > 0 },
    { id: "log", area: "General", title: "Log today's data", why: "A one-minute daily log of vitals, sleep, exercise, mood and symptoms. Seven days of logs build your personal baseline.", href: "/log", cta: "Log today", done: own.some((l) => l.checkupId === DAILY_LOG_ID) },
    { id: "checkup", area: "General", title: "Do a guided checkup", why: "Step-by-step checks (vitals, sleep, exercise, mood, vision) that tell you when something needs your flight surgeon.", href: "/checkups", cta: "See checkups", done: own.some((l) => l.checkupId !== DAILY_LOG_ID) },
    { id: "reminders", area: "Personalized", title: "Set a medicine or reminder", why: "Add the medicines your flight surgeon prescribed, or any routine, and tick them off each day.", href: "/reminders", cta: "Set reminders", done: schedule.meds.length + schedule.reminders.length > 0 },
    { id: "journal", area: "Personalized", title: "Write a journal entry", why: "A few lines on how you feel. It counts toward your mental well-being in My summary.", href: "/journal", cta: "Open journal", done: journal.entries.length > 0 },
    { id: "import", area: "Personalized", title: "Add records or smartwatch data", why: "Upload lab reports, or import a smartwatch CSV to fill in weeks of readings at once. Needs an account.", href: "/records", cta: "Open my records", done: records.records.length > 0 || logs.some((l) => l.checkupId === "import") },
  ];
}

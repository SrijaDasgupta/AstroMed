/**
 * How often a medicine is taken, as prescribed: every day, on chosen days of the week (a weekly
 * dose is one day), every N days from the start date, or as needed (no reminders). Pure functions.
 */
import { addDays, daysBetween, weekdayOf } from "@/lib/dates";

export type ScheduleKind = "daily" | "weekdays" | "interval" | "as-needed";
export type MedScheduleFields = { schedule?: ScheduleKind; days?: number[]; everyDays?: number; startedOn?: string; times: string[] };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Whether doses are scheduled on `date`. */
export function isDueOn(m: MedScheduleFields, date: string) {
  if (m.startedOn && date < m.startedOn) return false;
  switch (m.schedule ?? "daily") {
    case "as-needed": return false;
    case "weekdays": return (m.days ?? []).includes(weekdayOf(date));
    case "interval": {
      const every = m.everyDays ?? 1;
      if (!m.startedOn) return true;
      return daysBetween(m.startedOn, date) % every === 0;
    }
    default: return true;
  }
}

/** The next day (from `today`, inclusive) with doses scheduled, within a quarter. */
export function nextDueDate(m: MedScheduleFields, today: string) {
  for (let i = 0; i <= 92; i++) {
    const d = addDays(today, i);
    if (isDueOn(m, d)) return d;
  }
  return undefined;
}

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

/** "Every day at 08:00", "Weekly on Sunday at 08:00", "Every 14 days at 08:00 · next Sat, Nov 22", "As needed". */
export function describeSchedule(m: MedScheduleFields, today: string) {
  const at = m.times.length ? ` at ${m.times.join(", ")}` : "";
  const kind = m.schedule ?? "daily";
  if (kind === "as-needed") return "As needed (no reminders)";
  let text: string;
  if (kind === "weekdays") {
    const days = [...(m.days ?? [])].sort();
    text = days.length === 1 ? `Weekly on ${DAY_NAMES[days[0]]}${at}` : days.length === 7 ? `Every day${at}` : `${days.map((d) => SHORT[d]).join(", ")}${at}`;
  } else if (kind === "interval") {
    text = `Every ${m.everyDays} days${at}`;
  } else {
    text = `Every day${at}`;
  }
  if (kind !== "daily" && !(kind === "weekdays" && (m.days ?? []).length === 7)) {
    const next = nextDueDate(m, today);
    if (next) text += next === today ? " · due today" : ` · next ${fmtDay(next)}`;
  }
  return text;
}

/** Number of scheduled doses between two dates (inclusive). */
export function dosesBetween(m: MedScheduleFields, from: string, to: string) {
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) if (isDueOn(m, d)) n += m.times.length;
  return n;
}

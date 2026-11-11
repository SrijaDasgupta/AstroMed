import { CHECKUPS, type Checkup } from "@/lib/checkups";
import { DAILY_LOG_ID, dailyLogCovers } from "@/lib/daily-log";
import type { CheckupLog } from "@/lib/checkup-store";

const DAY = 24 * 60 * 60 * 1000;

export type DueStatus = { due: boolean; last?: CheckupLog; nextDue?: Date };

/** A check is due again once 90% of its interval has passed, so a daily check done yesterday morning is due this morning. */
export function dueStatus(checkup: Checkup, logs: CheckupLog[], now = new Date()): DueStatus {
  // A daily log entry with the right readings also counts as doing the checkup.
  const last = logs.find((l) => l.checkupId === checkup.id || (l.checkupId === DAILY_LOG_ID && dailyLogCovers(checkup.id, l.answers)));
  if (!last) return { due: true };
  const nextDue = new Date(new Date(last.createdAt).getTime() + checkup.everyDays * DAY * 0.9);
  return { due: now >= nextDue, last, nextDue };
}

export function dueCount(logs: CheckupLog[]) {
  return CHECKUPS.filter((c) => dueStatus(c, logs).due).length;
}

export function ago(iso: string, now = new Date()) {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function until(date: Date, now = new Date()) {
  const h = Math.max(1, Math.round((date.getTime() - now.getTime()) / 3600000));
  return h < 24 ? `in ${h} h` : `in ${Math.round(h / 24)} d`;
}

export function everyLabel(days: number) {
  return days === 1 ? "Daily" : days === 7 ? "Weekly" : `Every ${days} days`;
}

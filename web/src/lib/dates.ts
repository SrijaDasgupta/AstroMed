import { cache } from "react";

/**
 * Calendar dates follow the user's own time zone, not the server's (servers online run in UTC).
 * The browser stores its zone in a cookie; getViewer() reads it once per request.
 */
export const ZONE_COOKIE = "astromed_tz";

const requestZone = cache(() => ({ tz: undefined as string | undefined }));

export function isValidZone(tz: string | undefined): tz is string {
  if (!tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function setRequestZone(tz: string | undefined) {
  if (isValidZone(tz)) requestZone().tz = tz;
}

export function currentZone(): string | undefined {
  return requestZone().tz ?? (isValidZone(process.env.APP_TIME_ZONE) ? process.env.APP_TIME_ZONE : undefined);
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string | undefined) {
  const key = tz ?? "";
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    formatters.set(key, f);
  }
  return f;
}

/** Calendar date as YYYY-MM-DD in the user's time zone. */
export function localDate(d = new Date(), tz = currentZone()) {
  const p = Object.fromEntries(formatter(tz).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

function toUtc(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, n: number) {
  return new Date(toUtc(date) + n * 86400000).toISOString().slice(0, 10);
}

/** Day of the week for a YYYY-MM-DD date (0 = Sunday). */
export function weekdayOf(date: string) {
  return new Date(toUtc(date)).getUTCDay();
}

/** Whole calendar days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string) {
  return Math.round((toUtc(to) - toUtc(from)) / 86400000);
}

/** Noon on a YYYY-MM-DD date in the user's time zone, as an instant. */
export function middayOf(date: string, tz = currentZone()) {
  const guess = new Date(toUtc(date) + 12 * 3600000);
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(guess).map((x) => [x.type, x.value]));
  const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return new Date(guess.getTime() - (shown - guess.getTime()));
}

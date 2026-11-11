/** Local calendar date as YYYY-MM-DD (the server runs on the user's machine in development). */
export function localDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number);
  return localDate(new Date(y, m - 1, d + n));
}

/** Whole calendar days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string) {
  const [a, b] = [from, to].map((d) => { const [y, m, day] = d.split("-").map(Number); return Date.UTC(y, m - 1, day); });
  return Math.round((b - a) / 86400000);
}

/**
 * Import daily readings from a CSV exported by a smartwatch or health app. Columns are matched
 * by name; units are converted where they can be recognised. Pure functions, no I/O.
 */
import type { MetricKey } from "@/lib/crew";

type Col = { key: MetricKey; names: string[] };
const COLUMNS: Col[] = [
  { key: "restingHr", names: ["restingheartrate", "restinghr", "rhr", "restingheartratebpm", "restingpulse", "heartrate", "hr", "pulse", "averageheartrate", "avgheartrate"] },
  { key: "systolic", names: ["systolic", "sys", "bpsystolic", "systolicbloodpressure", "bloodpressuresystolic", "systolicmmhg"] },
  { key: "diastolic", names: ["diastolic", "dia", "bpdiastolic", "diastolicbloodpressure", "bloodpressurediastolic", "diastolicmmhg"] },
  { key: "temperature", names: ["temperature", "temp", "bodytemperature", "bodytemp", "temperaturec", "temperaturef"] },
  { key: "spo2", names: ["spo2", "oxygensaturation", "bloodoxygen", "bloodoxygensaturation", "o2saturation", "o2sat", "sao2", "spo2percent", "oxygen"] },
  { key: "glucose", names: ["glucose", "bloodglucose", "bloodsugar", "glucosemgdl", "glucosemmoll"] },
  { key: "sleepHours", names: ["sleephours", "sleep", "sleepduration", "totalsleep", "asleep", "hoursslept", "sleeptime", "sleepminutes", "minutesasleep", "totalsleepminutes"] },
];
const DATE_NAMES = ["date", "day", "datetime", "timestamp", "startdate", "start", "time", "datelocal", "calendardate", "datum", "fecha", "data", "jour"];
const RANGES: Record<MetricKey, [number, number]> = {
  restingHr: [25, 220], systolic: [60, 260], diastolic: [30, 160], temperature: [33, 43], glucose: [20, 600], sleepHours: [0, 16], spo2: [50, 100],
  hrv: [0, 0], sleepEfficiency: [0, 0], moodPositive: [0, 0], moodNegative: [0, 0],
};

const norm = (h: string) => h.toLowerCase().replace(/\(.*?\)/g, (m) => m.replace(/[()]/g, "")).replace(/[^a-z0-9]/g, "");

export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : firstLine.includes("\t") && !firstLine.includes(",") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cell.trim()); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell.trim());
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

/** Returns YYYY-MM-DD or undefined. Accepts ISO dates/timestamps, YYYY/MM/DD, MM/DD/YYYY, DD/MM/YYYY (when day > 12), DD.MM.YYYY. */
export function parseDate(raw: string): string | undefined {
  const s = raw.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  let y: number, mo: number, d: number;
  if (m) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/))) {
    const a = Number(m[1]), b = Number(m[2]);
    y = Number(m[3]);
    if (s.includes(".") || a > 12) [d, mo] = [a, b];
    else [mo, d] = [a, b];
  } else return undefined;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return undefined;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export type ImportResult = {
  days: { date: string; answers: Partial<Record<MetricKey, number>> }[];
  matched: { key: MetricKey; column: string; note?: string }[];
  ignoredColumns: string[];
  skippedRows: number;
  error?: string;
};

export function readImport(text: string, maxDays = 3650): ImportResult {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const empty: ImportResult = { days: [], matched: [], ignoredColumns: [], skippedRows: 0 };
  if (rows.length < 2) return { ...empty, error: "The file needs a header row and at least one data row." };
  const header = rows[0].map(norm);
  const dateCol = header.findIndex((h) => DATE_NAMES.includes(h) || /date/.test(h));
  if (dateCol < 0) return { ...empty, error: "Couldn't find a date column. Name it \"date\"." };

  const used = new Set<number>([dateCol]);
  const matched: ImportResult["matched"] = [];
  const cols: { key: MetricKey; idx: number; unit?: "min" | "f" | "mmol" }[] = [];
  for (const c of COLUMNS) {
    const idx = header.findIndex((h, i) => !used.has(i) && c.names.includes(h));
    if (idx < 0) continue;
    used.add(idx);
    const h = header[idx];
    const unit = c.key === "sleepHours" && /min/.test(h) ? "min" : c.key === "temperature" && h.endsWith("f") ? "f" : c.key === "glucose" && /mmol/.test(h) ? "mmol" : undefined;
    cols.push({ key: c.key, idx, unit });
    matched.push({ key: c.key, column: rows[0][idx] });
  }
  if (cols.length === 0) return { ...empty, error: "Couldn't find any columns AstroMed can use (heart rate, blood pressure, temperature, oxygen saturation, glucose or sleep)." };

  const byDate: Record<string, Partial<Record<MetricKey, number[]>>> = {};
  let skipped = 0;
  for (const r of rows.slice(1)) {
    const date = parseDate(r[dateCol] ?? "");
    if (!date) { skipped++; continue; }
    let any = false;
    for (const c of cols) {
      const rawV = (r[c.idx] ?? "").replace(",", ".");
      if (rawV === "") continue;
      let v = Number(rawV);
      if (!Number.isFinite(v)) continue;
      // Unit conversions, by column name or by value.
      if (c.key === "sleepHours" && (c.unit === "min" || v > 24)) v = v / 60;
      if (c.key === "temperature" && (c.unit === "f" || v > 45)) v = ((v - 32) * 5) / 9;
      if (c.key === "glucose" && (c.unit === "mmol" || v < 35)) v = v * 18;
      const [lo, hi] = RANGES[c.key];
      if (v < lo || v > hi) continue;
      ((byDate[date] ??= {})[c.key] ??= []).push(v);
      any = true;
    }
    if (!any) skipped++;
  }
  for (const m of matched) {
    const c = cols.find((x) => x.key === m.key)!;
    if (c.unit === "min" || (m.key === "sleepHours")) m.note = "minutes converted to hours where needed";
    if (m.key === "temperature") m.note = "°F converted to °C where needed";
    if (m.key === "glucose") m.note = "mmol/L converted to mg/dL where needed";
  }
  const days = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-maxDays)
    .map(([date, vals]) => ({
      date,
      answers: Object.fromEntries(Object.entries(vals).map(([k, vs]) => [k, Number(((vs as number[]).reduce((a, b) => a + b, 0) / (vs as number[]).length).toFixed(k === "temperature" || k === "sleepHours" ? 2 : 1))])) as Partial<Record<MetricKey, number>>,
    }));
  const ignoredColumns = rows[0].filter((_, i) => !used.has(i) && rows[0][i]);
  return { days, matched, ignoredColumns, skippedRows: skipped };
}

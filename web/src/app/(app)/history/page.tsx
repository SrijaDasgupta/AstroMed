import Link from "next/link";
import { ClipboardList, Upload } from "lucide-react";
import { HistoryChart } from "@/components/HistoryChart";
import type { MetricKey } from "@/lib/crew";
import { addDays, localDate } from "@/lib/dates";
import { getMyHealth } from "@/lib/my-health";
import { requireViewer } from "@/lib/session";

const RANGES = [
  { id: "90", label: "90 days", days: 90 },
  { id: "365", label: "1 year", days: 365 },
  { id: "1825", label: "5 years", days: 1825 },
  { id: "all", label: "All time", days: 0 },
];
const KEYS: MetricKey[] = ["restingHr", "systolic", "diastolic", "glucose", "temperature", "sleepHours"];

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const viewer = await requireViewer();
  const { logs, assessment } = await getMyHealth(viewer);
  const requested = (await searchParams).range;
  const range = RANGES.find((r) => r.id === requested) ?? RANGES[0];
  const today = localDate();

  // Daily averages of the person's own readings.
  const byKey: Partial<Record<MetricKey, Record<string, number[]>>> = {};
  for (const l of logs) {
    if (!l.answers) continue;
    const day = localDate(new Date(l.createdAt));
    for (const k of KEYS) {
      const v = l.answers[k];
      if (typeof v === "number") ((byKey[k] ??= {})[day] ??= []).push(v);
    }
  }
  const allDays = Object.values(byKey).flatMap((d) => Object.keys(d ?? {})).sort();
  const earliest = range.days ? addDays(today, -(range.days - 1)) : allDays[0] ?? today;
  // Always show at least a week, so a few readings don't make a confusing axis.
  const from = earliest < addDays(today, -6) ? earliest : addDays(today, -6);

  const series = KEYS.map((k) => {
    const m = assessment.metrics.find((x) => x.def.key === k)!;
    const points = Object.entries(byKey[k] ?? {})
      .filter(([d]) => d >= from)
      .map(([date, vs]) => ({ date, value: vs.reduce((a, b) => a + b, 0) / vs.length }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const vals = points.map((p) => p.value);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    // Change: first 30 days of the range vs. last 30 days, when the range spans 60+ days of data.
    let change: number | undefined;
    if (points.length >= 4) {
      const first = points[0].date, last = points[points.length - 1].date;
      if (new Date(last).getTime() - new Date(first).getTime() >= 59 * 86400000) {
        const a = points.filter((p) => p.date <= addDays(first, 29)).map((p) => p.value);
        const b = points.filter((p) => p.date >= addDays(last, -29)).map((p) => p.value);
        if (a.length && b.length) change = b.reduce((x, y) => x + y, 0) / b.length - a.reduce((x, y) => x + y, 0) / a.length;
      }
    }
    return { m, points, avg, min: Math.min(...vals), max: Math.max(...vals), change };
  });
  const total = new Set(allDays.filter((d) => d >= from)).size;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Long-term history</h1>
        <p className="mt-1 text-slate-400">Only your own readings, from daily logs, checkups and imports. No sample data.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <Link key={r.id} href={`/history?range=${r.id}`} aria-current={r.id === range.id ? "true" : undefined} className={`rounded-full px-3 py-1 ${r.id === range.id ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5"}`}>{r.label}</Link>
        ))}
        <span className="ml-2 text-slate-500">{total} day{total === 1 ? "" : "s"} with readings</span>
      </div>

      {total === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
          <p>No readings of your own in this period yet.</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link href="/log" className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200"><ClipboardList className="h-4 w-4" aria-hidden />Log today&apos;s data</Link>
            <Link href="/records#import" className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200"><Upload className="h-4 w-4" aria-hidden />Import a CSV from a smartwatch or app</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {series.map(({ m, points, avg, min, max, change }) => (
            <div key={m.def.key} className="space-y-2">
              {points.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">{m.def.label}: no readings in this period.</div>
              ) : (
                <>
                  <HistoryChart label={m.def.label} unit={m.def.unit} decimals={m.def.decimals} points={points} range={m.range} from={from} to={today} />
                  <dl className="grid grid-cols-4 gap-2 text-xs">
                    {[["Days", String(points.length)], ["Average", avg.toFixed(m.def.decimals)], ["Range", `${min.toFixed(m.def.decimals)}–${max.toFixed(m.def.decimals)}`], ["Change", change === undefined ? "needs 60 days" : `${change > 0 ? "+" : ""}${change.toFixed(m.def.decimals)} ${m.def.unit}`]].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-white/[0.03] px-2 py-1.5"><dt className="text-slate-500">{k}</dt><dd className="tabular-nums text-slate-200">{v}</dd></div>
                    ))}
                  </dl>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500">&ldquo;Change&rdquo; compares your average in the first 30 days of the range with the last 30 days. Normal ranges use your current baseline.</p>
    </div>
  );
}

"use client";

import { useId, useRef, useState } from "react";

type Point = { date: string; value: number };
type Props = { label: string; unit: string; decimals: number; points: Point[]; range: [number, number]; from: string; to: string };

const W = 560, H = 180;
const PAD = { top: 12, right: 16, bottom: 26, left: 44 };
const SERIES = "#3987e5", OUTSIDE = "#fab219", SURFACE = "#070b16";
const DAY = 86400000;
const t = (d: string) => new Date(`${d}T12:00:00`).getTime();
const short = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function ticks(min: number, max: number, count = 4) {
  const raw = (max - min || 1) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

export function HistoryChart({ label, unit, decimals, points, range, from, to }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const id = useId();
  const fmt = (v: number) => v.toFixed(decimals);
  const out = (v: number) => v < range[0] || v > range[1];

  const x0 = t(from), x1 = Math.max(t(to), x0 + DAY);
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals, range[0]), hi = Math.max(...vals, range[1]);
  const pad = (hi - lo) * 0.1 || 1;
  const ys = ticks(lo - pad, hi + pad);
  const yMin = Math.min(ys[0], lo - pad), yMax = Math.max(ys[ys.length - 1], hi + pad);
  const x = (d: string) => PAD.left + ((t(d) - x0) / (x1 - x0)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
  const mid = new Date((x0 + x1) / 2);
  const xTicks = [from, `${mid.getFullYear()}-${String(mid.getMonth() + 1).padStart(2, "0")}-${String(mid.getDate()).padStart(2, "0")}`, to];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    points.forEach((p, i) => { if (Math.abs(x(p.date) - px) < Math.abs(x(points[best].date) - px)) best = i; });
    setHover(best);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") setHover((h) => Math.min(points.length - 1, (h ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? points.length) - 1));
    else return;
    e.preventDefault();
  }
  const hp = hover !== null ? points[hover] : null;

  return (
    <figure className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span id={id} className="text-sm font-medium text-slate-100">{label}</span>
        <span className="text-xs text-slate-400">Your normal: {fmt(range[0])}–{fmt(range[1])} {unit}</span>
      </figcaption>
      <div className="relative mt-2">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none rounded outline-none focus-visible:ring-2 focus-visible:ring-sky-400" role="img" aria-labelledby={id}
          aria-describedby={`${id}-d`} tabIndex={0} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onBlur={() => setHover(null)} onKeyDown={onKey}>
          <desc id={`${id}-d`}>{`${label}: ${points.length} days of your readings from ${short(from)} to ${short(to)}. Use left and right arrow keys to read each reading.`}</desc>
          {ys.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#ffffff14" />
              <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px]">{v}</text>
            </g>
          ))}
          {xTicks.map((d, i) => <text key={i} x={x(d)} y={H - 6} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} className="fill-slate-500 text-[11px]">{short(d)}</text>)}
          <rect x={PAD.left} width={W - PAD.left - PAD.right} y={y(range[1])} height={y(range[0]) - y(range[1])} fill="#fff" opacity={0.06} />
          <path d={points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join("")} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" />
          {points.map((p) => <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={points.length > 60 ? 2.5 : 4} fill={out(p.value) ? OUTSIDE : SERIES} stroke={SURFACE} strokeWidth={points.length > 60 ? 1 : 2} />)}
          {hp && <><line x1={x(hp.date)} x2={x(hp.date)} y1={PAD.top} y2={H - PAD.bottom} stroke="#ffffff55" /><circle cx={x(hp.date)} cy={y(hp.value)} r={5} fill={out(hp.value) ? OUTSIDE : SERIES} stroke={SURFACE} strokeWidth={2} /></>}
        </svg>
        {hp && (
          <div className="pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-lg" style={{ left: `${(x(hp.date) / W) * 100}%`, transform: `translateX(${x(hp.date) > W / 2 ? "-110%" : "10%"})` }}>
            <div className="text-sm font-semibold text-white">{fmt(hp.value)} {unit}</div>
            <div className="text-slate-400">{short(hp.date)}{out(hp.value) ? " · outside your normal" : ""}</div>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: SERIES }} />Your reading (daily average)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm bg-white/10" />Your normal range</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: OUTSIDE }} />Outside range</span>
      </div>
      <details className="mt-2 text-xs text-slate-400">
        <summary className="cursor-pointer hover:text-slate-200">Show as table</summary>
        <div className="mt-2 max-h-48 overflow-auto">
          <table className="w-full text-left">
            <thead><tr className="text-slate-500"><th className="py-1 font-normal">Date</th><th className="py-1 font-normal">{label} ({unit})</th><th className="py-1 font-normal">In range</th></tr></thead>
            <tbody>{[...points].reverse().map((p) => <tr key={p.date} className="border-t border-white/5"><td className="py-1">{short(p.date)}</td><td className="py-1 text-slate-200">{fmt(p.value)}</td><td className="py-1">{out(p.value) ? "No" : "Yes"}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

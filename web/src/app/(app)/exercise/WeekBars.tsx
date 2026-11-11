"use client";

import { useState } from "react";

type Day = { label: string; resistive: number; aerobic: number };
const RESIST = "#3987e5";
const AERO = "#d95926";
const W = 520, H = 170, PAD = { top: 12, right: 8, bottom: 24, left: 36 };

/** A bar with a 4px rounded top (when `round`) and a square bottom. */
function bar(x: number, y: number, w: number, h: number, round: boolean) {
  if (h <= 0) return "";
  const r = round ? Math.min(4, h, w / 2) : 0;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export function WeekBars({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(60, ...days.map((d) => d.resistive + d.aerobic));
  const step = max > 150 ? 60 : 30;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const band = (W - PAD.left - PAD.right) / days.length;
  const bw = Math.min(24, band * 0.5);
  const y = (v: number) => PAD.top + (1 - v / top) * (H - PAD.top - PAD.bottom);

  return (
    <figure className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <figcaption className="text-sm font-medium">Exercise minutes, last 7 days</figcaption>
      <div className="relative mt-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Exercise minutes per day for the last 7 days. Values are in the table below.">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#ffffff14" />
              <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px]">{t}</text>
            </g>
          ))}
          {days.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const r = d.resistive, a = d.aerobic;
            const base = y(0);
            return (
              <g key={d.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} role="img" aria-label={`${d.label}: ${r} minutes resistance, ${a} minutes aerobic`} className="outline-none">
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={H - PAD.top - PAD.bottom} fill={hover === i ? "#ffffff08" : "transparent"} />
                {/* Resistance sits on the baseline; aerobic stacks above it with a 2px gap. Only the top segment gets rounded corners. */}
                {r > 0 && <path d={bar(cx - bw / 2, y(r), bw, base - y(r), a === 0)} fill={RESIST} />}
                {a > 0 && <path d={bar(cx - bw / 2, y(r + a), bw, y(r) - y(r + a) - (r > 0 ? 2 : 0), true)} fill={AERO} />}
                <text x={cx} y={H - 6} textAnchor="middle" className="fill-slate-500 text-[11px]">{d.label}</text>
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-lg" style={{ left: `${((PAD.left + band * hover + band / 2) / W) * 100}%`, transform: `translateX(${hover > 3 ? "-110%" : "10%"})` }}>
            <div className="text-sm font-semibold text-white">{days[hover].resistive + days[hover].aerobic} min</div>
            <div className="flex items-center gap-1.5 text-slate-300"><span className="h-0.5 w-3" style={{ background: RESIST }} />{days[hover].resistive} resistance</div>
            <div className="flex items-center gap-1.5 text-slate-300"><span className="h-0.5 w-3" style={{ background: AERO }} />{days[hover].aerobic} aerobic</div>
            <div className="text-slate-500">{days[hover].label}</div>
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: RESIST }} />Resistance</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ background: AERO }} />Aerobic</span>
      </div>
      <details className="mt-2 text-xs text-slate-400">
        <summary className="cursor-pointer hover:text-slate-200">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr className="text-slate-500"><th className="py-1 font-normal">Day</th><th className="py-1 font-normal">Resistance (min)</th><th className="py-1 font-normal">Aerobic (min)</th></tr></thead>
          <tbody>{days.map((d) => <tr key={d.label} className="border-t border-white/5"><td className="py-1">{d.label}</td><td className="py-1 text-slate-200">{d.resistive}</td><td className="py-1 text-slate-200">{d.aerobic}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

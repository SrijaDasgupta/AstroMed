"use client";

import { useId, useRef, useState } from "react";

type Props = {
  label: string;
  unit: string;
  decimals: number;
  values: number[];
  range: [number, number];
  baseline: number;
  /** Where the personal baseline comes from. */
  baselineKind: "measured" | "simulated" | "yours";
  /** Days that hold the person's own reading (others are sample data). */
  recorded?: boolean[];
};

const W = 560;
const H = 170;
const PAD = { top: 12, right: 16, bottom: 26, left: 40 };
const SERIES = "#3987e5";
const OUTSIDE = "#fab219";
const SURFACE = "#070b16";

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) ticks.push(Number(t.toFixed(6)));
  return ticks;
}

export function MetricChart({ label, unit, decimals, values, range, baseline, baselineKind, recorded }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const titleId = useId();

  const lo = Math.min(...values, range[0]);
  const hi = Math.max(...values, range[1]);
  const pad = (hi - lo) * 0.1 || 1;
  const ticks = niceTicks(lo - pad, hi + pad);
  const yMin = Math.min(ticks[0], lo - pad);
  const yMax = Math.max(ticks[ticks.length - 1], hi + pad);

  const last = values.length - 1;
  const x = (i: number) => PAD.left + (i / (values.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
  const fmt = (v: number) => v.toFixed(decimals);
  const outside = (v: number) => v < range[0] || v > range[1];
  const isMine = (i: number) => Boolean(recorded?.[i]);
  const dayLabel = (i: number) => (i === last ? "Today" : `${last - i} d ago`);
  const anyMine = recorded?.some(Boolean) ?? false;

  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const xTicks = [0, 9, 19, last];

  function onPointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * last);
    setHover(Math.max(0, Math.min(last, i)));
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") setHover((h) => Math.min(last, (h ?? -1) + 1));
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? last + 1) - 1));
    else return;
    e.preventDefault();
  }

  const hv = hover !== null ? values[hover] : null;

  return (
    <figure className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2">
          <span id={titleId} className="text-sm font-medium text-slate-100">{label}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${baselineKind === "yours" ? "bg-emerald-400/10 text-emerald-200" : baselineKind === "measured" ? "bg-sky-400/10 text-sky-200" : "bg-white/5 text-slate-400"}`}
            title={baselineKind === "yours" ? "Baseline from your own values or readings" : baselineKind === "measured" ? "Baseline from a real MMASH recording" : "Baseline simulated within a normal adult range; MMASH did not record this"}
          >
            {baselineKind === "yours" ? "Your baseline" : baselineKind === "measured" ? "Sample baseline" : "Simulated baseline"}
          </span>
        </span>
        <span className="text-xs text-slate-400">
          Your normal: {fmt(range[0])}–{fmt(range[1])} {unit}
        </span>
      </figcaption>

      <div className="relative mt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={`${titleId}-desc`}
          tabIndex={0}
          onPointerMove={onPointer}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          <desc id={`${titleId}-desc`}>
            {`${label} over the last ${values.length} days${anyMine ? ", including your own readings" : ""}. Latest ${fmt(values[last])} ${unit}; personal normal range ${fmt(range[0])} to ${fmt(range[1])} ${unit}. Use left and right arrow keys to read each day.`}
          </desc>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#ffffff14" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px]">{t}</text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="fill-slate-500 text-[11px]">{dayLabel(i)}</text>
          ))}

          <rect x={PAD.left} width={W - PAD.left - PAD.right} y={y(range[1])} height={y(range[0]) - y(range[1])} fill="#ffffff" opacity={0.06} />
          <line x1={PAD.left} x2={W - PAD.right} y1={y(baseline)} y2={y(baseline)} stroke="#ffffff40" strokeWidth={1} />

          <path d={path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {values.map((v, i) =>
            outside(v) ? (
              <circle key={i} cx={x(i)} cy={y(v)} r={4} fill={OUTSIDE} stroke={isMine(i) ? "#ffffff" : SURFACE} strokeWidth={2} />
            ) : isMine(i) ? (
              <circle key={i} cx={x(i)} cy={y(v)} r={4} fill={SERIES} stroke="#ffffff" strokeWidth={1.5} />
            ) : null,
          )}
          {!outside(values[last]) && <circle cx={x(last)} cy={y(values[last])} r={4} fill={SERIES} stroke={SURFACE} strokeWidth={2} />}

          {hover !== null && hv !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="#ffffff55" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(hv)} r={5} fill={outside(hv) ? OUTSIDE : SERIES} stroke={SURFACE} strokeWidth={2} />
            </>
          )}
        </svg>

        {hover !== null && hv !== null && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-lg"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > last / 2 ? "-110%" : "10%"})` }}
          >
            <div className="text-sm font-semibold text-white">{fmt(hv)} {unit}</div>
            <div className="text-slate-400">{dayLabel(hover)} · {isMine(hover) ? "your reading" : "sample"}{outside(hv) ? " · outside normal range" : ""}</div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES }} />Daily value</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm bg-white/10" />Personal normal range</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: OUTSIDE }} />Outside range</span>
        {anyMine && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-white" style={{ background: SERIES }} />Your reading</span>}
      </div>

      <details className="mt-2 text-xs text-slate-400">
        <summary className="cursor-pointer hover:text-slate-200">Show as table</summary>
        <div className="mt-2 max-h-48 overflow-auto">
          <table className="w-full text-left">
            <thead><tr className="text-slate-500"><th className="py-1 font-normal">Day</th><th className="py-1 font-normal">{label} ({unit})</th><th className="py-1 font-normal">In range</th><th className="py-1 font-normal">Source</th></tr></thead>
            <tbody>
              {values.map((v, i) => (
                <tr key={i} className="border-t border-white/5"><td className="py-1">{dayLabel(i)}</td><td className="py-1 text-slate-200">{fmt(v)}</td><td className="py-1">{outside(v) ? "No" : "Yes"}</td><td className="py-1">{isMine(i) ? "Your reading" : "Sample"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

"use client";

import { useId, useRef, useState } from "react";

type Point = { day: number; low: number; high: number };

type Props = {
  label: string;
  unit: string;
  decimals: number;
  points: Point[];
  today: number;
  threshold?: { value: number; label: string };
};

const W = 560;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
const SERIES = "#3987e5";
const SURFACE = "#070b16";
const LIMIT = "#d03b3b";

function niceTicks(max: number, count = 4) {
  const raw = (max || 1) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let t = 0; t <= max + step * 0.999; t += step) ticks.push(Number(t.toFixed(6)));
  return ticks;
}

export function ProjectionChart({ label, unit, decimals, points, today, threshold }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const titleId = useId();

  const isBand = points.some((p) => p.high !== p.low);
  const dataMax = Math.max(...points.map((p) => p.high));
  const showLimit = threshold && dataMax >= threshold.value * 0.25;
  const ticks = niceTicks(Math.max(dataMax, showLimit ? threshold!.value : 0) * 1.05);
  const yMax = ticks[ticks.length - 1];
  const length = points[points.length - 1].day;
  const last = points.length - 1;

  const x = (d: number) => PAD.left + (d / length) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / yMax) * (H - PAD.top - PAD.bottom);
  const fmt = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  const range = (p: Point) => (isBand ? `${fmt(p.low)}–${fmt(p.high)}` : fmt(p.high));

  const past = points.filter((p) => p.day <= today);
  const future = points.filter((p) => p.day >= today);
  const line = (pts: Point[], key: "low" | "high") => pts.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p[key]).toFixed(1)}`).join("");
  const area = (pts: Point[]) =>
    `${line(pts, "high")}L${[...pts].reverse().map((p) => `${x(p.day).toFixed(1)},${y(p.low).toFixed(1)}`).join("L")}Z`;

  const xTicks = [0, Math.round(length / 3), Math.round((2 * length) / 3), length];
  const todayIndex = points.findIndex((p) => p.day === today);

  function onPointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const day = (((e.clientX - rect.left) / rect.width) * W - PAD.left) / (W - PAD.left - PAD.right) * length;
    let best = 0;
    points.forEach((p, i) => { if (Math.abs(p.day - day) < Math.abs(points[best].day - day)) best = i; });
    setHover(best);
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") setHover((h) => Math.min(last, (h ?? (todayIndex >= 0 ? todayIndex : 0) - 1) + 1));
    else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? (todayIndex >= 0 ? todayIndex : last) + 1) - 1));
    else return;
    e.preventDefault();
  }

  const hp = hover !== null ? points[hover] : null;
  const todayPoint = points[todayIndex >= 0 ? todayIndex : 0];
  const endPoint = points[last];

  return (
    <figure className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <figcaption id={titleId} className="text-sm font-medium text-slate-100">{label}</figcaption>
      <div className="relative mt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none rounded outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={`${titleId}-d`}
          tabIndex={0}
          onPointerMove={onPointer}
          onPointerLeave={() => setHover(null)}
          onBlur={() => setHover(null)}
          onKeyDown={onKey}
        >
          <desc id={`${titleId}-d`}>
            {`${label}: ${range(todayPoint)} ${unit} by day ${today}; projected ${range(endPoint)} ${unit} by day ${length}.${threshold ? ` ${threshold.label}: ${threshold.value.toLocaleString("en-US")} ${unit}.` : ""} Use left and right arrow keys to read values.`}
          </desc>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#ffffff14" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[11px]">{t.toLocaleString("en-US")}</text>
            </g>
          ))}
          {xTicks.map((d, i) => (
            <text key={d} x={x(d)} y={H - 8} textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"} className="fill-slate-500 text-[11px]">Day {d}</text>
          ))}

          {showLimit && (
            <g>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(threshold!.value)} y2={y(threshold!.value)} stroke={LIMIT} strokeWidth={1} />
              <text x={W - PAD.right} y={y(threshold!.value) - 5} textAnchor="end" className="fill-slate-300 text-[11px]">{threshold!.label} · {threshold!.value.toLocaleString("en-US")} {unit}</text>
            </g>
          )}

          {isBand && (
            <>
              <path d={area(past)} fill={SERIES} opacity={0.25} />
              <path d={area(future)} fill={SERIES} opacity={0.1} />
            </>
          )}
          {(isBand ? (["low", "high"] as const) : (["high"] as const)).map((k) => (
            <g key={k}>
              <path d={line(past, k)} fill="none" stroke={SERIES} strokeWidth={2} strokeLinecap="round" />
              <path d={line(future, k)} fill="none" stroke={SERIES} strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round" />
            </g>
          ))}

          {today < length && (
            <g>
              <line x1={x(today)} x2={x(today)} y1={PAD.top} y2={H - PAD.bottom} stroke="#ffffff40" strokeWidth={1} />
              <text x={x(today) + 4} y={PAD.top + 10} className="fill-slate-400 text-[11px]">Today</text>
            </g>
          )}
          <circle cx={x(today)} cy={y(todayPoint.high)} r={4} fill={SERIES} stroke={SURFACE} strokeWidth={2} />

          {hp && (
            <>
              <line x1={x(hp.day)} x2={x(hp.day)} y1={PAD.top} y2={H - PAD.bottom} stroke="#ffffff66" strokeWidth={1} />
              <circle cx={x(hp.day)} cy={y(hp.high)} r={5} fill={SERIES} stroke={SURFACE} strokeWidth={2} />
            </>
          )}
        </svg>
        {hp && (
          <div
            className="pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-lg"
            style={{ left: `${(x(hp.day) / W) * 100}%`, transform: `translateX(${hp.day > length / 2 ? "-110%" : "10%"})` }}
          >
            <div className="text-sm font-semibold text-white">{range(hp)} {unit}</div>
            <div className="text-slate-400">Day {hp.day} · {hp.day <= today ? "so far" : "projected"}</div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES }} />So far</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed" style={{ borderColor: SERIES }} />Projected</span>
        {isBand && <span className="inline-flex items-center gap-1.5"><span className="h-3 w-4 rounded-sm" style={{ background: SERIES, opacity: 0.25 }} />Likely range</span>}
        {showLimit && <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: LIMIT }} />{threshold!.label}</span>}
        {threshold && !showLimit && <span>{threshold.label} ({threshold.value.toLocaleString("en-US")} {unit}) is far above this scale</span>}
      </div>

      <details className="mt-2 text-xs text-slate-400">
        <summary className="cursor-pointer hover:text-slate-200">Show as table</summary>
        <div className="mt-2 max-h-48 overflow-auto">
          <table className="w-full text-left">
            <thead><tr className="text-slate-500"><th className="py-1 font-normal">Day</th><th className="py-1 font-normal">{label} ({unit})</th><th className="py-1 font-normal" /></tr></thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.day} className="border-t border-white/5"><td className="py-1">{p.day}</td><td className="py-1 text-slate-200">{range(p)}</td><td className="py-1">{p.day <= today ? "so far" : "projected"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

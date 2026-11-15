"use client";

import { useState } from "react";

const N = 20;
const CELL = 16;
const SIZE = N * CELL;

type Eye = "left" | "right";

/**
 * Amsler grid for a home check of central vision. The person looks at the centre dot with one eye
 * covered and taps any squares where lines look wavy, bent, blurred or missing. The marks are a
 * visual aid only; the yes/no answers in the form are what gets saved.
 */
export function AmslerGrid() {
  const [eye, setEye] = useState<Eye>("left");
  const [marks, setMarks] = useState<Record<Eye, Set<number>>>({ left: new Set(), right: new Set() });
  const toggle = (i: number) =>
    setMarks((m) => {
      const next = new Set(m[eye]);
      if (next.has(i)) next.delete(i); else next.add(i);
      return { ...m, [eye]: next };
    });
  const count = marks[eye].size;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">Amsler grid</h2>
        <div role="radiogroup" aria-label="Eye being tested" className="flex gap-2">
          {(["left", "right"] as Eye[]).map((e) => (
            <button key={e} type="button" role="radio" aria-checked={eye === e} onClick={() => setEye(e)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${eye === e ? "border-sky-400 bg-sky-400/15 text-sky-100" : "border-white/15 text-slate-300"}`}>
              {e === "left" ? "Left eye" : "Right eye"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Testing your <span className="text-slate-100">{eye}</span> eye: cover your {eye === "left" ? "right" : "left"} eye and keep looking at the centre dot.
      </p>
      <div className="mt-4 flex justify-center">
        <svg viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`} className="w-full max-w-[22rem] rounded-md bg-white" role="img" aria-label="Amsler grid: a square grid of black lines with a dot in the centre. Tap squares that look distorted.">
          {Array.from({ length: N * N }, (_, i) => (
            <rect key={i} x={(i % N) * CELL} y={Math.floor(i / N) * CELL} width={CELL} height={CELL}
              fill={marks[eye].has(i) ? "rgba(244,63,94,0.45)" : "transparent"} onClick={() => toggle(i)} className="cursor-pointer" />
          ))}
          {Array.from({ length: N + 1 }, (_, i) => (
            <g key={i} stroke="#0f172a" strokeWidth={0.8} pointerEvents="none">
              <line x1={i * CELL} y1={0} x2={i * CELL} y2={SIZE} />
              <line x1={0} y1={i * CELL} x2={SIZE} y2={i * CELL} />
            </g>
          ))}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={4} fill="#0f172a" pointerEvents="none" />
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className={count ? "text-rose-300" : "text-slate-400"} aria-live="polite">
          {count ? `${count} square${count > 1 ? "s" : ""} marked for your ${eye} eye. Answer Yes for this eye below.` : "Nothing marked for this eye."}
        </p>
        {count > 0 && <button type="button" onClick={() => setMarks((m) => ({ ...m, [eye]: new Set() }))} className="text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-white">Clear marks</button>}
      </div>
      <p className="mt-3 text-xs text-slate-500">New distortion? Answer Yes below and AstroMed will tell you who to contact.</p>
    </div>
  );
}

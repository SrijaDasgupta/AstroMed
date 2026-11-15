"use client";

import { useEffect, useRef, useState } from "react";
import { Rocket, Satellite } from "lucide-react";
import { isCorrect, makeTrial, nextDisplay, POSITIONS, START_MS, summarizeDrill, type Answer, type Centre, type DrillResult, type Trial } from "@/lib/speed-drill";

type Phase = "idle" | "fixation" | "show" | "mask" | "centre" | "where" | "feedback" | "done";

const SIZE = 320;
const C = SIZE / 2;
const RING = 125;
const DIRECTIONS = ["top", "top right", "right", "bottom right", "bottom", "bottom left", "left", "top left"];
const at = (i: number, r = RING) => {
  const a = (i / POSITIONS) * 2 * Math.PI - Math.PI / 2;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};

function Star({ x, y }: { x: number; y: number }) {
  const pts = Array.from({ length: 10 }, (_, k) => {
    const r = k % 2 ? 7 : 16;
    const a = (k / 10) * 2 * Math.PI - Math.PI / 2;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(" ");
  return <polygon points={pts} fill="#fbbf24" />;
}

function Distractor({ x, y }: { x: number; y: number }) {
  return <polygon points={`${x},${y - 14} ${x + 13},${y + 10} ${x - 13},${y + 10}`} fill="#94a3b8" />;
}

const CentreIcon = ({ kind, size = 56 }: { kind: Centre; size?: number }) =>
  kind === "rocket"
    ? <Rocket x={C - size / 2} y={C - size / 2} width={size} height={size} color="#e2e8f0" />
    : <Satellite x={C - size / 2} y={C - size / 2} width={size} height={size} color="#e2e8f0" />;

/** Fixed-seed noise mask, so it looks the same on server and client. */
const MASK = Array.from({ length: 140 }, (_, i) => ({ x: (i * 73) % SIZE, y: (i * 151) % SIZE, s: 10 + ((i * 7) % 18), g: 40 + ((i * 37) % 160) }));

/**
 * Adaptive speed-of-processing drill. A rocket or satellite flashes in the centre while a star
 * flashes at one of 8 places at the edge; then a mask covers them. Report both. Two right in a row
 * makes the flash shorter; a miss makes it longer. Distractor shapes appear once the flash is short.
 */
export function SpeedDrill({ onDone, onReset }: { onDone: (r: DrillResult) => void; onReset?: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [minutes, setMinutes] = useState(10);
  const [trial, setTrial] = useState<Trial>();
  const [pick, setPick] = useState<Centre>();
  const [last, setLast] = useState<boolean>();
  const [result, setResult] = useState<DrillResult>();
  const [left, setLeft] = useState(0);
  const s = useRef({ display: START_MS, streak: 0, start: 0, end: 0, log: [] as { displayMs: number; correct: boolean }[], timer: 0 });

  useEffect(() => () => window.clearTimeout(s.current.timer), []);
  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    const id = window.setInterval(() => setLeft(Math.max(0, s.current.end - Date.now())), 500);
    return () => window.clearInterval(id);
  }, [phase]);

  const later = (ms: number, fn: () => void) => { window.clearTimeout(s.current.timer); s.current.timer = window.setTimeout(fn, ms); };

  const finish = () => {
    window.clearTimeout(s.current.timer);
    const r = summarizeDrill(s.current.log, (Date.now() - s.current.start) / 60000);
    setPhase(r ? "done" : "idle");
    if (r) { setResult(r); onDone(r); }
  };

  const nextTrial = () => {
    if (Date.now() >= s.current.end) return finish();
    const t = makeTrial(s.current.display);
    setTrial(t);
    setPick(undefined);
    setPhase("fixation");
    later(500, () => {
      setPhase("show");
      later(t.displayMs, () => {
        setPhase("mask");
        later(300, () => setPhase("centre"));
      });
    });
  };

  const start = () => {
    const now = Date.now();
    s.current = { ...s.current, display: START_MS, streak: 0, start: now, end: now + minutes * 60000, log: [] };
    setResult(undefined);
    setLeft(minutes * 60000);
    onReset?.();
    nextTrial();
  };

  const answer = (a: Answer) => {
    if (!trial) return;
    const ok = isCorrect(trial, a);
    const st = s.current;
    st.log.push({ displayMs: trial.displayMs, correct: ok });
    st.streak = ok ? st.streak + 1 : 0;
    st.display = nextDisplay(st.display, ok, st.streak);
    setLast(ok);
    setPhase("feedback");
    later(700, nextTrial);
  };

  const secs = Math.ceil(left / 1000);
  const running = phase !== "idle" && phase !== "done";
  const done = s.current.log.length;
  const correct = s.current.log.filter((t) => t.correct).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium">Speed drill</h2>
        {running && <p className="text-sm tabular-nums text-slate-400">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")} left · {correct}/{done} right · flash {s.current.display} ms</p>}
      </div>

      {!running ? (
        <div className="mt-4 space-y-4">
          {result && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Flash time reached", `${result.sdThresholdMs} ms`], ["Accuracy", `${result.sdAccuracy}%`], ["Rounds", `${result.sdTrials}`], ["Minutes", `${result.sdMinutes}`]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/5 p-3"><dt className="text-xs text-slate-400">{k}</dt><dd className="text-lg font-semibold tabular-nums">{v}</dd></div>
              ))}
            </dl>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-300">Session length</span>
            {[5, 10, 15].map((m) => (
              <button key={m} type="button" onClick={() => setMinutes(m)} aria-pressed={minutes === m}
                className={`rounded-lg border px-3 py-1.5 text-sm ${minutes === m ? "border-sky-400 bg-sky-400/15 text-sky-100" : "border-white/15 text-slate-300"}`}>{m} min</button>
            ))}
          </div>
          <button type="button" onClick={start} className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400">
            {result ? "Train again" : "Start training"}
          </button>
          {result && <p className="text-sm text-slate-400">Your results are filled in below. Press Save and check to record them.</p>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto block w-full max-w-sm rounded-2xl bg-slate-950" role="img"
            aria-label={phase === "where" ? "Choose where the star was" : phase === "show" ? "Look now" : "Keep your eyes on the centre"}>
            <circle cx={C} cy={C} r={RING} fill="none" stroke="#1e293b" strokeDasharray="3 6" />
            {(phase === "fixation" || phase === "centre" || phase === "feedback") && <path d={`M${C - 10} ${C}H${C + 10}M${C} ${C - 10}V${C + 10}`} stroke="#64748b" strokeWidth="2" />}
            {phase === "show" && trial && (
              <g>
                <CentreIcon kind={trial.centre} />
                {trial.distractors && Array.from({ length: POSITIONS }, (_, i) => i).filter((i) => i !== trial.position).map((i) => { const [x, y] = at(i); return <Distractor key={i} x={x} y={y} />; })}
                {(() => { const [x, y] = at(trial.position); return <Star x={x} y={y} />; })()}
              </g>
            )}
            {phase === "mask" && MASK.map((m, i) => <rect key={i} x={m.x} y={m.y} width={m.s} height={m.s} fill={`rgb(${m.g},${m.g},${m.g})`} />)}
            {phase === "where" && Array.from({ length: POSITIONS }, (_, i) => {
              const [x, y] = at(i);
              return (
                <g key={i} role="button" tabIndex={0} aria-label={`The star was at the ${DIRECTIONS[i]}`} className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-sky-300"
                  onClick={() => pick && answer({ centre: pick, position: i })}
                  onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && pick) { e.preventDefault(); answer({ centre: pick, position: i }); } }}>
                  <circle cx={x} cy={y} r={22} fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                </g>
              );
            })}
            {phase === "feedback" && <text x={C} y={C + 50} textAnchor="middle" fontSize="18" fill={last ? "#6ee7b7" : "#fda4af"}>{last ? "Right" : "Not this time"}</text>}
          </svg>

          {phase === "centre" && (
            <div className="flex flex-wrap items-center justify-center gap-3" aria-live="polite">
              <span className="w-full text-center text-sm text-slate-300">What was in the centre?</span>
              {(["rocket", "satellite"] as const).map((k) => (
                <button key={k} type="button" autoFocus={k === "rocket"} onClick={() => { setPick(k); setPhase("where"); }}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-100 hover:bg-white/5">
                  {k === "rocket" ? <Rocket className="h-5 w-5" aria-hidden /> : <Satellite className="h-5 w-5" aria-hidden />} {k === "rocket" ? "Rocket" : "Satellite"}
                </button>
              ))}
            </div>
          )}
          {phase === "where" && <p className="text-center text-sm text-slate-300" aria-live="polite">Where was the star? Tap its place on the ring.</p>}
          <div className="flex justify-end">
            <button type="button" onClick={finish} className="text-sm text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-white">Finish now</button>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">Keep your eyes on the centre cross. The flash gets shorter as you get faster, and grey shapes appear around the star once it&apos;s quick. Modelled on the speed training in the ACTIVE and INHANCE trials.</p>
    </div>
  );
}

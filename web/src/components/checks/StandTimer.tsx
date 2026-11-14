"use client";

import { useEffect, useRef, useState } from "react";

const STAND_S = 180;
const BALANCE_MAX_S = 30;

/** A 3-minute stand timer for the heart-rate test and a stopwatch for the balance holds. */
export function StandTimer() {
  const [standLeft, setStandLeft] = useState<number | null>(null);
  const [hold, setHold] = useState<{ start: number; elapsed: number } | null>(null);
  const [holds, setHolds] = useState<number[]>([]);
  const timers = useRef<{ stand: number; hold: number }>({ stand: 0, hold: 0 });

  useEffect(() => () => { window.clearInterval(timers.current.stand); window.clearInterval(timers.current.hold); }, []);

  const startStand = () => {
    const end = Date.now() + STAND_S * 1000;
    setStandLeft(STAND_S);
    window.clearInterval(timers.current.stand);
    timers.current.stand = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setStandLeft(left);
      if (left === 0) {
        window.clearInterval(timers.current.stand);
        navigator.vibrate?.(300);
      }
    }, 250);
  };

  const stopHold = (start: number) => {
    window.clearInterval(timers.current.hold);
    const secs = Math.min(BALANCE_MAX_S, Math.floor((Date.now() - start) / 1000));
    setHolds((h) => [...h, secs].slice(-6));
    setHold(null);
  };
  const toggleHold = () => {
    if (hold) return stopHold(hold.start);
    const start = Date.now();
    setHold({ start, elapsed: 0 });
    timers.current.hold = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      if (elapsed >= BALANCE_MAX_S) { navigator.vibrate?.(200); stopHold(start); }
      else setHold({ start, elapsed });
    }, 100);
  };

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2">
      <div>
        <h2 className="font-medium">Stand timer</h2>
        <p className="mt-1 text-sm text-slate-400">Start it as you stand up. Take your heart rate when it reaches 0:00.</p>
        <p className={`mt-3 text-4xl font-semibold tabular-nums ${standLeft === 0 ? "text-emerald-300" : ""}`} aria-live="polite">
          {standLeft === null ? mmss(STAND_S) : standLeft === 0 ? "Measure now" : mmss(standLeft)}
        </p>
        <button type="button" onClick={startStand} className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5">
          {standLeft === null ? "Start 3 minutes" : "Restart"}
        </button>
      </div>
      <div>
        <h2 className="font-medium">Balance stopwatch</h2>
        <p className="mt-1 text-sm text-slate-400">Start when you take your stance, stop when you put a foot down or open your eyes. Stops at 30 s.</p>
        <p className="mt-3 text-4xl font-semibold tabular-nums">{(hold?.elapsed ?? 0).toFixed(1)} s</p>
        <button type="button" onClick={toggleHold} className={`mt-3 rounded-lg px-3 py-1.5 text-sm font-medium ${hold ? "bg-amber-300 text-slate-950" : "bg-sky-500 text-slate-950 hover:bg-sky-400"}`}>
          {hold ? "Stop" : "Start hold"}
        </button>
        {holds.length > 0 && <p className="mt-2 text-sm text-slate-300">Your holds: {holds.map((h) => `${h} s`).join(", ")} · best {Math.max(...holds)} s</p>}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FALSE_START_MS, LAPSE_MS, nextDelay, summarize, TEST_MS, TIMEOUT_MS, type ReactionResult } from "@/lib/reaction";

type Phase = "idle" | "wait" | "go" | "done";

/**
 * 3-minute psychomotor vigilance test. A target lights up at random 1–4 s intervals; the person taps
 * it (or presses the space bar) as fast as they can. Timing uses performance.now().
 */
export function ReactionTest({ onDone, onReset }: { onDone: (r: ReactionResult) => void; onReset?: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [counter, setCounter] = useState(0);
  const [left, setLeft] = useState(TEST_MS);
  const [last, setLast] = useState<{ ms?: number; early?: boolean } | null>(null);
  const [result, setResult] = useState<ReactionResult>();
  const s = useRef({ phase: "idle" as Phase, start: 0, stimAt: 0, rts: [] as number[], falseStarts: 0, timer: 0, raf: 0, tick: 0 });

  const clear = () => {
    window.clearTimeout(s.current.timer);
    cancelAnimationFrame(s.current.raf);
  };
  const set = (p: Phase) => { s.current.phase = p; setPhase(p); };

  const finish = useCallback(() => {
    clear();
    window.clearInterval(s.current.tick);
    const r = summarize(s.current.rts, s.current.falseStarts);
    set(r ? "done" : "idle");
    if (r) { setResult(r); onDone(r); }
  }, [onDone]);

  const schedule = useCallback(() => {
    clear();
    if (performance.now() - s.current.start >= TEST_MS) return finish();
    set("wait");
    s.current.timer = window.setTimeout(() => {
      s.current.stimAt = performance.now();
      set("go");
      const loop = () => {
        setCounter(Math.round(performance.now() - s.current.stimAt));
        s.current.raf = requestAnimationFrame(loop);
      };
      loop();
      // No response at all: count it as a lapse and move on.
      s.current.timer = window.setTimeout(() => { s.current.rts.push(TIMEOUT_MS); setLast({ ms: TIMEOUT_MS }); schedule(); }, TIMEOUT_MS);
    }, nextDelay());
  }, [finish]);

  const start = () => {
    Object.assign(s.current, { start: performance.now(), rts: [], falseStarts: 0 });
    setResult(undefined);
    setLast(null);
    setLeft(TEST_MS);
    onReset?.();
    window.clearInterval(s.current.tick);
    s.current.tick = window.setInterval(() => {
      const remaining = Math.max(0, TEST_MS - (performance.now() - s.current.start));
      setLeft(remaining);
      if (remaining === 0 && s.current.phase === "wait") finish();
    }, 250);
    schedule();
  };

  const stop = () => {
    clear();
    window.clearInterval(s.current.tick);
    set("idle");
    setLast(null);
  };

  const respond = useCallback(() => {
    const st = s.current;
    if (st.phase === "wait") {
      st.falseStarts += 1;
      setLast({ early: true });
      schedule();
    } else if (st.phase === "go") {
      const rt = performance.now() - st.stimAt;
      if (rt < FALSE_START_MS) { st.falseStarts += 1; setLast({ early: true }); }
      else { st.rts.push(rt); setLast({ ms: Math.round(rt) }); }
      setCounter(Math.round(rt));
      schedule();
    }
  }, [schedule]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (s.current.phase !== "wait" && s.current.phase !== "go")) return;
      e.preventDefault();
      if (!e.repeat) respond();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [respond]);

  useEffect(() => () => { clear(); window.clearInterval(s.current.tick); }, []);

  const running = phase === "wait" || phase === "go";
  const secs = Math.ceil(left / 1000);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium">Reaction-time test</h2>
        {running && <p className="text-sm tabular-nums text-slate-400" aria-live="off">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")} left · {s.current.rts.length} responses</p>}
      </div>

      {phase === "idle" || phase === "done" ? (
        <div className="mt-4 space-y-4">
          {result && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Median", `${result.rtMedianMs} ms`],
                ["Lapses", `${result.rtLapses}`],
                ["False starts", `${result.rtFalseStarts}`],
                ["Fastest", `${result.fastest} ms`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/5 p-3">
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className="text-lg font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <button type="button" onClick={start} className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400">
            {result ? "Do the test again" : "Start the 3-minute test"}
          </button>
          {result && <p className="text-sm text-slate-400">Your results are filled in below. Press Save and check to record them.</p>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); respond(); }}
            className={`flex h-56 w-full select-none touch-manipulation flex-col items-center justify-center rounded-2xl border-2 text-center outline-none transition-colors duration-75 focus-visible:ring-2 focus-visible:ring-sky-400 sm:h-64 ${phase === "go" ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/10 bg-slate-950 text-slate-500"}`}
            aria-label={phase === "go" ? "Tap now" : "Wait for the light"}
          >
            {phase === "go" ? (
              <span className="text-5xl font-bold tabular-nums">{counter}</span>
            ) : (
              <span className="text-sm">Wait for the light…</span>
            )}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className={last?.early ? "text-amber-300" : last?.ms !== undefined && last.ms >= LAPSE_MS ? "text-amber-200" : "text-slate-400"} aria-live="polite">
              {last?.early ? "Too early: wait for the light." : last?.ms !== undefined ? (last.ms >= TIMEOUT_MS ? "Missed" : `${last.ms} ms`) : "Tap the target or press the space bar."}
            </p>
            <button type="button" onClick={stop} className="text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-white">Stop</button>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">Touch screens add a little delay, so compare results on the same device. Results are compared with your own earlier tests, not with other people.</p>
    </div>
  );
}

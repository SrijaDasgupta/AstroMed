"use client";

import { useId, useState, type CSSProperties } from "react";
import { button, inset, ModuleCard } from "./ui";
import styles from "./motion.module.css";

export type VitalReading = {
  label: string;
  /** Formatted value, or null when the person hasn't recorded it. */
  value: string | null;
  unit: string;
  /** "Today", "3 days ago" and so on. */
  when?: string;
};

// One heartbeat, 90 px wide; the trace shows four.
const pulse = "l11 0 q4 -10 9 0 l8 0 3 8 5 -39 5 49 4 -18 9 0 q8 -13 16 0 l20 0";
const BEATS = 4;

/**
 * Illustrative ECG sweep paced at the person's own heart rate, with their latest readings.
 * AstroMed does not record an ECG, so the trace is labeled as an illustration.
 */
export function VitalSigns({ readings, heartRateBpm }: { readings: readonly VitalReading[]; heartRateBpm?: number | null }) {
  const [paused, setPaused] = useState(false);
  const grid = useId();
  const rate = typeof heartRateBpm === "number" && heartRateBpm >= 30 && heartRateBpm <= 220 ? heartRateBpm : null;
  const seconds = (BEATS * 60) / (rate ?? 72);

  return (
    <ModuleCard title="Heartbeat and latest readings" intro={rate ? `The sweep beats at your latest resting heart rate, ${Math.round(rate)} bpm.` : "Record your heart rate and the sweep will beat at your own pace."}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">Illustrative waveform, not your ECG. AstroMed doesn&apos;t record an ECG.</p>
        <button type="button" className={button} onClick={() => setPaused(!paused)}>{paused ? "Resume sweep" : "Pause sweep"}</button>
      </div>
      <svg role="img" aria-label={`Illustrative ECG waveform${rate ? ` at ${Math.round(rate)} beats per minute` : ""}`} viewBox="0 0 360 114" className="block w-full rounded-xl bg-[#0c1425]">
        <defs>
          <pattern id={grid} width="18" height="19" patternUnits="userSpaceOnUse"><path d="M18 0H0V19" fill="none" stroke="#243b51" /></pattern>
        </defs>
        <rect width="360" height="114" fill={`url(#${grid})`} />
        <path d={`M0 60${pulse.repeat(BEATS)}`} fill="none" stroke="#38bdf8" strokeWidth="1.7" />
        <path d="M0 0V114" stroke="#bae6fd" strokeWidth="2" style={{ "--sweep-duration": `${seconds.toFixed(2)}s` } as CSSProperties} className={`${styles.sweep} ${paused ? styles.paused : ""}`} />
      </svg>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {readings.map(({ label, value, unit, when }) => (
          <div key={label} className={inset}>
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd key={value ?? "missing"} className={`mt-1 text-lg font-semibold tabular-nums text-sky-200 ${styles.reveal}`}>
              {value !== null ? <>{value} <span className="text-xs font-normal">{unit}</span></> : <span className="text-base font-normal text-slate-400">Not recorded yet</span>}
            </dd>
            {value !== null && when && <dd className="text-xs text-slate-500">{when}</dd>}
          </div>
        ))}
      </dl>
    </ModuleCard>
  );
}

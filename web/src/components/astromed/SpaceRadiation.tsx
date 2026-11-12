"use client";

import { useId, useState, type CSSProperties } from "react";
import { button, field, inset, ModuleCard } from "./ui";
import styles from "./motion.module.css";

export type RadiationEnvironment = {
  id: string;
  name: string;
  /** Average dose rate, mSv per day. */
  msvPerDay: number;
  /** Where the figure comes from. */
  source: string;
};

const format = (n: number) => n.toLocaleString("en-US", { maximumSignificantDigits: 3 });

/** Compares average daily dose across mission environments, with particles scaled to the rate. */
export function SpaceRadiation({ environments, initialId }: { environments: readonly RadiationEnvironment[]; initialId?: string }) {
  const [selection, setSelection] = useState(initialId);
  const [paused, setPaused] = useState(false);
  const select = useId();
  const halo = useId();
  const valid = environments.filter(({ msvPerDay }) => Number.isFinite(msvPerDay) && msvPerDay >= 0);
  const current = valid.find(({ id }) => id === selection) ?? valid[0];
  const maximumRate = valid.reduce((max, e) => Math.max(max, e.msvPerDay), 0);
  if (!current) return <ModuleCard title="Radiation by environment"><p className="text-sm text-slate-400">No dose figures available.</p></ModuleCard>;

  const particleCount = maximumRate === 0 ? 0 : Math.max(1, Math.ceil(18 * (current.msvPerDay / maximumRate)));
  return (
    <ModuleCard title="Radiation by environment" intro="Compare how fast dose builds up in each place. Particle density is an illustration scaled to the average daily dose.">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label htmlFor={select} className="min-w-0 flex-1 text-sm text-slate-300">
          Mission environment
          <select id={select} value={current.id} onChange={(event) => setSelection(event.target.value)} className={`mt-1 ${field}`}>
            {valid.map(({ id, name }) => <option key={id} value={id}>{name}{id === initialId ? " (your mission)" : ""}</option>)}
          </select>
        </label>
        <button type="button" className={button} onClick={() => setPaused(!paused)}>{paused ? "Resume particles" : "Pause particles"}</button>
      </div>
      <svg viewBox="0 0 360 155" aria-hidden="true" className="block w-full overflow-hidden rounded-xl bg-[#0c1425]">
        <defs>
          <radialGradient id={halo}><stop stopColor="#38bdf8" stopOpacity=".32" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx="180" cy="78" r="72" fill={`url(#${halo})`} />
        <circle cx="180" cy="78" r="52" fill="none" stroke="#45718f" strokeDasharray="2 4" />
        <path d="M151 84L180 58 209 84 198 94H162ZM180 58V94M159 77H201" stroke="#bae6fd" strokeLinejoin="round" fill="#183c55" />
        {Array.from({ length: particleCount }, (_, index) => {
          const x = (index * 83 + 17) % 360;
          const y = (index * 47 + 29) % 153;
          const duration = 2.8 + (index % 5) * 0.6;
          return <path key={index} d={`M-3 ${y}l-12 2`} stroke={index % 4 === 0 ? "#c4b5fd" : "#38bdf8"} strokeWidth="2" strokeLinecap="round"
            style={{ "--flight-duration": `${duration}s`, "--flight-delay": `-${duration * x / 360}s`, "--rest-offset": `${x + 3}px` } as CSSProperties}
            className={`${styles.particle} ${paused ? styles.paused : ""}`} />;
        })}
      </svg>
      <div className={`mt-4 ${inset}`} aria-live="polite">
        <p className="text-sm text-slate-300">{current.name}: average dose</p>
        <p key={current.id} className={`text-xl font-semibold text-sky-200 ${styles.reveal}`}>
          ≈ {format(current.msvPerDay)} mSv <span className="text-sm font-normal text-slate-300">a day · {format(current.msvPerDay * 30)} mSv a month</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">{current.source}</p>
      </div>
      <h3 className="mb-2 mt-4 text-sm font-medium">Average daily dose by environment</h3>
      <ul className="space-y-3">
        {valid.map(({ id, name, msvPerDay }) => (
          <li key={id} aria-current={id === current.id ? "true" : undefined}>
            <div className="flex flex-wrap justify-between gap-x-2 text-sm">
              <span className={id === current.id ? "text-sky-200" : "text-slate-300"}>{name}</span>
              <span className="tabular-nums">{format(msvPerDay)} mSv/day</span>
            </div>
            <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-sky-400 motion-safe:transition-[width]" style={{ width: `${maximumRate > 0 ? (msvPerDay / maximumRate) * 100 : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">Daily averages don&apos;t include solar storms, which can add large doses quickly.</p>
    </ModuleCard>
  );
}

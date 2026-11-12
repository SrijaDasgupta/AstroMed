"use client";

import { useId, useState, type CSSProperties } from "react";
import { RadiationEntry } from "./RadiationEntry";
import { button, field, inset, ModuleCard } from "./ui";
import styles from "./motion.module.css";

export type RadiationEnvironment = {
  id: string;
  name: string;
  /** Average dose rate, mSv per day. */
  msvPerDay: number;
  /** Where the figure comes from. */
  source: string;
  /** True for a reading the person typed in on this page. */
  own?: boolean;
};

const format = (n: number) => n.toLocaleString("en-US", { maximumSignificantDigits: 3 });

function ParticleScene({ particleCount, matched = false, reinforced = false }: { particleCount: number; matched?: boolean; reinforced?: boolean }) {
  const [paused, setPaused] = useState(false);
  const halo = useId();
  return (
    <div>
      <svg viewBox="0 0 360 155" aria-hidden="true" className="block w-full overflow-hidden rounded-xl bg-[#0c1425]">
        <defs>
          <radialGradient id={halo}><stop stopColor="#38bdf8" stopOpacity=".32" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx="180" cy="78" r="72" fill={`url(#${halo})`} />
        <circle cx="180" cy="78" r="52" fill="none" stroke="#45718f" strokeDasharray="2 4" />
        {matched && <circle cx="180" cy="78" r="43" fill={`url(#${halo})`} stroke="#6ee7b7" className={styles.matchGlow} />}
        {reinforced && <path d="M143 84L180 51 217 84 202 102H158Z" fill="none" stroke="#a5b4fc" strokeWidth="1.5" />}
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
      {particleCount > 0 && (
        <button type="button" className={`mt-2 ${button}`} onClick={() => setPaused(!paused)}>{paused ? "Resume particles" : "Pause particles"}</button>
      )}
    </div>
  );
}

/* ---------- Dose match game ---------- */

const TARGET_HOURS = [8, 12, 16] as const;
const MAX_HOURS = 24;
// Practice cabins for the game. The reinforced one lets dose build up 1.5 times more slowly.
const CABINS = [
  { name: "Standard cabin", slowdown: 1 },
  { name: "Shielded cabin", slowdown: 1.5 },
] as const;

function DoseMeter({ progress, target, matched }: { progress: number; target: number; matched: boolean }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium">Dose so far</p>
      <div className="relative mt-2 h-3 rounded-full bg-slate-800" aria-hidden="true">
        <div className={`h-full rounded-full ${styles.doseFill} ${matched ? "bg-emerald-300" : "bg-sky-400"}`} style={{ width: `${Math.min(1, progress) * 100}%` }} />
        <div className="absolute inset-y-[-3px] w-0.5 -translate-x-1/2 rounded bg-white" style={{ left: `${target * 100}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-400">The white marker is the target dose.</p>
    </div>
  );
}

function MissionTimeline({ elapsed, slowdown }: { elapsed: number; slowdown: number }) {
  const x = 8 + (304 * elapsed) / MAX_HOURS;
  const height = 56 / slowdown;
  const y = 64 - (height * elapsed) / MAX_HOURS;
  return (
    <svg viewBox="0 0 320 72" aria-hidden="true" className="mt-2 block w-full rounded-lg bg-[#070b16]">
      <path d="M8 8V64H312M8 36H312" fill="none" stroke="#28435e" />
      <path d={`M8 64L312 ${64 - height}`} fill="none" stroke="#45627c" strokeDasharray="3 4" />
      <path d={`M8 64L${x} ${y}`} fill="none" stroke="#38bdf8" strokeWidth="2" />
      <path d={`M${x} 8V64`} fill="none" stroke="#7dd3fc" strokeDasharray="2 3" />
      <circle cx={x} cy={y} r="3.5" fill="#bae6fd" />
    </svg>
  );
}

function DoseGame({ env }: { env: RadiationEnvironment }) {
  const [round, setRound] = useState(0);
  const [hours, setHours] = useState(0);
  const [cabin, setCabin] = useState<0 | 1>(0);
  const [result, setResult] = useState<"match" | "below" | "above">();
  const slider = useId();
  const perHour = env.msvPerDay / 24;
  const targetHours = TARGET_HOURS[round];
  const targetDose = perHour * targetHours;
  const { slowdown } = CABINS[cabin];
  const doseAt = (s: number) => (perHour * hours) / s;
  const correctHours = targetHours * slowdown;
  const matched = result === "match";

  if (perHour <= 0) return <p className={`mt-4 text-sm text-slate-300 ${inset}`}>This reading has no dose, so there&apos;s nothing to match. Pick another.</p>;

  return (
    <section className={`mt-4 min-w-0 ${inset}`}>
      <h3 className="font-medium">Match the radiation dose</h3>
      <p className="mt-1 text-sm text-slate-300">Slide the mission clock until the dose reaches the target, then check. Try the shielded cabin to see how shielding buys time.</p>
      <dl className="my-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="break-words text-slate-400">Target · {env.name}</dt>
          <dd className="text-lg font-semibold text-sky-200">{format(targetDose)} mSv</dd>
        </div>
        <div>
          <dt className="text-slate-400">Dose rate in this cabin</dt>
          <dd className="text-lg font-semibold text-sky-200">{format(perHour / slowdown)} mSv/h</dd>
        </div>
      </dl>
      <ParticleScene particleCount={Math.ceil((18 * hours) / MAX_HOURS / slowdown)} matched={matched} reinforced={cabin === 1} />
      <DoseMeter progress={doseAt(slowdown) / (perHour * MAX_HOURS)} target={targetHours / MAX_HOURS} matched={matched} />
      <label className="mt-4 block text-sm font-medium" htmlFor={slider}>Mission clock · {hours} h</label>
      <MissionTimeline elapsed={hours} slowdown={slowdown} />
      <input id={slider} className="mt-2 block w-full accent-sky-400" type="range" min="0" max={MAX_HOURS} step="1" value={hours} aria-valuetext={`${hours} hours`}
        onChange={(event) => { setHours(Number(event.target.value)); setResult(undefined); }} />
      <div className="flex justify-between text-xs text-slate-400" aria-hidden="true"><span>0 h</span><span>{MAX_HOURS} h</span></div>
      <p className="mt-2 text-sm text-slate-300">Dose · <output htmlFor={slider} className="font-semibold text-sky-200">{format(doseAt(slowdown))} mSv</output></p>
      <fieldset className="mt-4 min-w-0">
        <legend className="text-sm font-medium">Compare cabins at the same time</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CABINS.map(({ name, slowdown: s }, index) => (
            <label key={name} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-600 p-2 text-sm has-[:checked]:border-sky-300">
              <input className="mt-1 accent-sky-400" type="radio" name={`${slider}-cabin`} checked={cabin === index}
                onChange={() => { setCabin(index === 0 ? 0 : 1); setResult(undefined); }} />
              <span>{name}<span className="block tabular-nums text-sky-200">{format(doseAt(s))} mSv</span></span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">Practice cabins: the shielded one is an example that slows dose by a third, not a real spacecraft figure. Real crews shelter in the most shielded area during solar storms.</p>
      </fieldset>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={button} onClick={() => setResult(hours === correctHours ? "match" : hours < correctHours ? "below" : "above")}>Check dose</button>
        <button type="button" className={button} onClick={() => { setRound((round + 1) % TARGET_HOURS.length); setHours(0); setResult(undefined); }}>New round</button>
      </div>
      <p role="status" className={`mt-2 text-sm ${matched ? "text-emerald-300" : "text-sky-200"}`}>
        {matched && `Target matched! ${cabin === 1 ? `The shielded cabin took ${correctHours} h instead of ${targetHours} h.` : "Now try the shielded cabin."}`}
        {result === "below" && "Below the target. Move the clock forward."}
        {result === "above" && "Above the target. Move the clock back."}
      </p>
    </section>
  );
}

/* ---------- Card ---------- */

/** Compares average daily dose across mission environments, with a reading of your own and a dose-matching game. */
export function SpaceRadiation({ environments, initialId }: { environments: readonly RadiationEnvironment[]; initialId?: string }) {
  const [selection, setSelection] = useState(initialId);
  const [own, setOwn] = useState<RadiationEnvironment[]>([]);
  const [gameOpen, setGameOpen] = useState(false);
  const select = useId();
  const ownId = useId();
  const valid = [...environments, ...own].filter(({ msvPerDay }) => Number.isFinite(msvPerDay) && msvPerDay >= 0);
  const current = valid.find(({ id }) => id === selection) ?? valid[0];
  const maximumRate = valid.reduce((max, e) => Math.max(max, e.msvPerDay), 0);
  if (!current) return <ModuleCard title="Radiation by environment"><p className="text-sm text-slate-400">No dose figures available.</p></ModuleCard>;
  const particleCount = maximumRate === 0 ? 0 : Math.max(current.msvPerDay > 0 ? 1 : 0, Math.ceil(18 * (current.msvPerDay / maximumRate)));
  const tab = (on: boolean) => `${button} ${on ? "border-sky-300 bg-sky-400/25" : ""}`;

  return (
    <ModuleCard title="Radiation by environment" intro="Compare how fast dose builds up in each place, or play the dose-matching game.">
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Radiation activity">
        <button type="button" className={tab(!gameOpen)} aria-pressed={!gameOpen} onClick={() => setGameOpen(false)}>Compare</button>
        <button type="button" className={tab(gameOpen)} aria-pressed={gameOpen} onClick={() => setGameOpen(true)}>Play dose match</button>
      </div>
      <label htmlFor={select} className="mb-4 block text-sm text-slate-300">
        {gameOpen ? "Environment for the game" : "Mission environment"}
        <select id={select} value={current.id} onChange={(event) => setSelection(event.target.value)} className={`mt-1 ${field}`}>
          {valid.map(({ id, name, own: mine }) => <option key={id} value={id}>{name}{id === initialId ? " (your mission)" : mine ? " (your reading)" : ""}</option>)}
        </select>
      </label>

      {gameOpen ? <DoseGame key={current.id} env={current} /> : (
        <>
          <ParticleScene particleCount={particleCount} />
          <p className="mt-2 text-xs text-slate-500">Particle density is an illustration scaled to the average daily dose.</p>
          <div className={`mt-4 ${inset}`} aria-live="polite">
            <p className="text-sm text-slate-300">{current.name}: average dose</p>
            <p key={current.id} className={`text-xl font-semibold text-sky-200 ${styles.reveal}`}>
              ≈ {format(current.msvPerDay)} mSv <span className="text-sm font-normal text-slate-300">a day · {format(current.msvPerDay * 30)} mSv a month</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{current.source}</p>
          </div>
          <h3 className="mb-2 mt-4 text-sm font-medium">Average daily dose by environment</h3>
          <ul className="space-y-3 break-words">
            {valid.map(({ id, name, msvPerDay, own: mine }) => (
              <li key={id} aria-current={id === current.id ? "true" : undefined}>
                <div className="flex flex-wrap justify-between gap-x-2 text-sm">
                  <span className={id === current.id ? "text-sky-200" : "text-slate-300"}>{name}{mine ? " · your reading" : ""}</span>
                  <span className="tabular-nums">{format(msvPerDay)} mSv/day</span>
                </div>
                <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div className={`h-full rounded-full motion-safe:transition-[width] ${mine ? "bg-violet-300" : "bg-sky-400"}`} style={{ width: `${maximumRate > 0 ? (msvPerDay / maximumRate) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Daily averages don&apos;t include solar storms, which can add large doses quickly.</p>
          <RadiationEntry onAdd={({ name, doseMsv, hours }) => {
            const entry: RadiationEnvironment = {
              id: `${ownId}-${own.length}`, name, own: true, msvPerDay: (doseMsv / hours) * 24,
              source: `Your reading: ${format(doseMsv)} mSv over ${format(hours)} h, shown as a daily rate. Not saved.`,
            };
            setOwn((previous) => [...previous, entry]);
            setSelection(entry.id);
          }} />
        </>
      )}
    </ModuleCard>
  );
}

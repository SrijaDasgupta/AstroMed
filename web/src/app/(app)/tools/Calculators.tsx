"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { TipCard } from "@/components/TipCard";
import { ENVIRONMENTS, type EnvironmentId } from "@/lib/environments";
import { TIPS, type Tip } from "@/lib/tips";

const LIMIT = 600;
const tip = (id: string) => TIPS.find((t) => t.id === id)!;
type Level = "good" | "warning" | "critical";
const LEVEL: Record<Level, { color: string; Icon: typeof CheckCircle2 }> = {
  good: { color: "#0ca30c", Icon: CheckCircle2 },
  warning: { color: "#fab219", Icon: AlertTriangle },
  critical: { color: "#d03b3b", Icon: OctagonAlert },
};

const input = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 tabular-nums outline-none focus:border-sky-400";
const select = "w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 outline-none focus:border-sky-400";

function Num({ label, value, onChange, unit, min = 0, max, step = 1, hint }: { label: string; value: string; onChange: (v: string) => void; unit: string; min?: number; max?: number; step?: number; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <input type="number" inputMode="decimal" className={input} value={value} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value)} />
        <span className="w-14 shrink-0 text-sm text-slate-400">{unit}</span>
      </span>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-slate-300">
      {label}
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-sky-400" />
    </label>
  );
}

function Result({ level, title, children, tips }: { level: Level; title: string; children: React.ReactNode; tips: Tip[] }) {
  const { color, Icon } = LEVEL[level];
  return (
    <div aria-live="polite" className="space-y-4">
      <div className="rounded-2xl border p-5" style={{ borderColor: `${color}66` }}>
        <p className="flex items-center gap-2 font-semibold text-white"><Icon className="h-5 w-5" style={{ color }} aria-hidden />{title}</p>
        <div className="mt-3 space-y-2 text-sm text-slate-300">{children}</div>
      </div>
      {tips.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Tips for this result</p>
          <div className="grid gap-3 md:grid-cols-2">{tips.map((t) => <TipCard key={t.id} tip={t} compact />)}</div>
        </div>
      )}
    </div>
  );
}

const n = (v: string) => (v.trim() === "" ? NaN : Number(v));
const fmt = (v: number, dp = 0) => v.toLocaleString("en-US", { maximumFractionDigits: dp, minimumFractionDigits: dp });

// ---------------------------------------------------------------------------

export function RadiationCalculator({ defaultEnv }: { defaultEnv: EnvironmentId }) {
  const [envId, setEnvId] = useState<EnvironmentId | "custom">(defaultEnv);
  const env = ENVIRONMENTS.find((e) => e.id === envId);
  const [rate, setRate] = useState(String(env?.radiationMsvPerDay ?? 0.5));
  const [days, setDays] = useState("30");
  const [planned, setPlanned] = useState("180");
  const [measured, setMeasured] = useState("");
  const [prior, setPrior] = useState("0");
  const [storm, setStorm] = useState("0");

  const r = n(rate), d = n(days), pl = n(planned), m = n(measured), pr = n(prior), st = n(storm) || 0;
  const valid = r >= 0 && d >= 0 && pl >= 0 && pr >= 0 && st >= 0 && (measured === "" || m >= 0);
  const soFar = measured !== "" ? m : r * d;
  const mission = soFar + r * Math.max(0, pl - d) + st;
  const career = pr + mission;
  const pct = (career / LIMIT) * 100;
  const left = LIMIT - career;
  const level: Level = pct >= 100 ? "critical" : pct >= 50 ? "warning" : "good";
  const beyondLeo = envId === "lunar-surface" || envId === "mars-transit" || envId === "mars-surface";
  const tips = [tip("career-limit"), ...(beyondLeo || st > 0 ? [tip("solar-storm-shelter")] : []), ...(pct >= 100 || envId.startsWith("mars") ? [tip("mars-exceeds-limit")] : [])];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-300">Mission</span>
          <select className={`mt-1 ${select}`} value={envId} onChange={(e) => {
            const id = e.target.value as EnvironmentId | "custom";
            setEnvId(id);
            const preset = ENVIRONMENTS.find((x) => x.id === id);
            if (preset) setRate(String(preset.radiationMsvPerDay));
          }}>
            {ENVIRONMENTS.map((e) => <option key={e.id} value={e.id}>{e.name} (≈ {e.radiationMsvPerDay} mSv/day)</option>)}
            <option value="custom">Custom dose rate</option>
          </select>
        </label>
        <Num label="Dose rate" unit="mSv/day" value={rate} onChange={(v) => { setRate(v); setEnvId("custom"); }} step={0.01} hint="From the mission preset, or your own figure." />
        <div className="grid grid-cols-2 gap-3">
          <Num label="Days so far" unit="days" value={days} onChange={setDays} />
          <Num label="Planned total" unit="days" value={planned} onChange={setPlanned} />
        </div>
        <Num label="Dosimeter reading so far (optional)" unit="mSv" value={measured} onChange={setMeasured} step={0.1} hint="If you have a measured dose, it replaces the estimate for the days so far." />
        <Num label="Dose from earlier missions" unit="mSv" value={prior} onChange={setPrior} step={1} />
        <Num label="Extra dose from solar storms" unit="mSv" value={storm} onChange={setStorm} step={1} hint="Add any dose reported after a solar particle event." />
      </div>
      {valid ? (
        <Result level={level} title={level === "critical" ? "Over the career limit" : pct >= 90 ? "Very close to the career limit" : level === "warning" ? "More than half of the career limit" : "Well within the career limit"} tips={tips}>
          <p>So far this mission: <strong className="text-white">{fmt(soFar, 1)} mSv</strong>{measured !== "" ? " (measured)" : " (estimated)"}</p>
          <p>Whole mission: <strong className="text-white">{fmt(mission, 0)} mSv</strong></p>
          <p>Career total: <strong className="text-white">{fmt(career, 0)} mSv</strong>, which is <strong className="text-white">{fmt(pct, 0)}%</strong> of NASA&apos;s 600 mSv limit.</p>
          {left > 0 && r > 0 && <p>At this rate, the limit would be reached after about {fmt(left / r, 0)} more days in this environment.</p>}
          {level === "critical" && <p>NASA has an informed-consent process for missions expected to exceed the career limit (Radiation report, p. 52).</p>}
          <p className="text-xs text-slate-500">Limit: NASA-STD-3001 Vol. 1, p. 40. Daily averages don&apos;t include solar storms.</p>
        </Result>
      ) : <p className="text-sm text-rose-400">Enter zero or positive numbers.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function BoneCalculator({ defaultEnv }: { defaultEnv: EnvironmentId }) {
  const initial = defaultEnv === "earth-analog" ? "earth" : defaultEnv === "leo" || defaultEnv === "mars-transit" ? "micro" : "partial";
  const [gravity, setGravity] = useState<"micro" | "partial" | "earth">(initial);
  const [days, setDays] = useState("180");
  const [sessions, setSessions] = useState("6");

  const d = n(days), s = n(sessions);
  const valid = d >= 0 && s >= 0 && s <= 14;
  const months = d / 30.4;
  const low = gravity === "micro" ? months : 0;
  const high = gravity === "earth" ? 0 : months * 1.5;
  const level: Level = gravity === "earth" ? "good" : s === 0 || high >= 10 ? "critical" : "warning";
  const tips = gravity === "earth" ? [] : [tip("resistive-exercise-bone"), tip("exercise-heart"), tip("landing-orthostatic")];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-300">Gravity</span>
          <select className={`mt-1 ${select}`} value={gravity} onChange={(e) => setGravity(e.target.value as typeof gravity)}>
            <option value="micro">Weightless (space station, deep space)</option>
            <option value="partial">Partial gravity (Moon, Mars)</option>
            <option value="earth">Earth gravity</option>
          </select>
        </label>
        <Num label="Days in this gravity" unit="days" value={days} onChange={setDays} />
        <Num label="Resistance exercise sessions per week" unit="/ week" value={sessions} onChange={setSessions} max={14} />
      </div>
      {valid ? (
        <Result level={level} title={gravity === "earth" ? "No spaceflight bone loss expected" : `Estimated hip and spine bone loss: ${fmt(low, 1)}–${fmt(high, 1)}%`} tips={tips}>
          {gravity === "earth" ? (
            <p>Bone loss from weightlessness doesn&apos;t happen in Earth gravity.</p>
          ) : (
            <>
              <p>Based on 1–1.5% loss per month in weightlessness (Bone fracture report, p. 42). {gravity === "partial" && "Nobody yet knows whether Moon or Mars gravity slows the loss, so the range starts at zero (p. 11)."}</p>
              {s === 0
                ? <p className="text-amber-200">No resistance exercise planned. Resistive exercise is the main way to reduce this loss.</p>
                : <p>{fmt(s, 0)} resistance sessions a week will reduce the loss, but NASA&apos;s data doesn&apos;t give an amount per session, so the range above doesn&apos;t include the benefit.</p>}
              {d > 180 && <p className="text-xs text-slate-400">Flight data cover about 6 months or less. Past that, this is a straight-line extrapolation, not a prediction (p. 25).</p>}
            </>
          )}
        </Result>
      ) : <p className="text-sm text-rose-400">Enter zero or positive numbers (up to 14 sessions a week).</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function SleepCalculator({ usualHours }: { usualHours: number }) {
  const [nights, setNights] = useState(["6", "5.5", "6.5"]);
  const [shifted, setShifted] = useState(false);
  const [stimulant, setStimulant] = useState(false);
  const [meds, setMeds] = useState(false);
  const [disturbed, setDisturbed] = useState(false);

  const vals = nights.map(n);
  const valid = vals.every((v) => v >= 0 && v <= 16);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const ids = new Set<string>();
  if (avg < 6) { ids.add("protect-sleep-period"); ids.add("sleep-and-bp"); }
  if (shifted) { ids.add("avoid-slam-shifts"); ids.add("lighting-circadian"); }
  if (stimulant) ids.add("stimulant-timing");
  if (meds) ids.add("sleep-medication-oversight");
  if (disturbed) ids.add("sleep-environment");
  if (ids.size === 0) ids.add("protect-sleep-period");
  const issues = [shifted, stimulant, meds, disturbed].filter(Boolean).length;
  const level: Level = avg < 4 ? "critical" : avg < 6 || issues >= 2 ? "warning" : "good";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {nights.map((v, i) => (
            <Num key={i} label={i === 0 ? "Last night" : `${i + 1} nights ago`} unit="h" value={v} step={0.25} max={16} onChange={(x) => setNights(nights.map((y, j) => (j === i ? x : y)))} />
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 p-4">
          <YesNo label="Wake-up time shifted by 2 hours or more" value={shifted} onChange={setShifted} />
          <YesNo label="Caffeine or alertness medicine after midday" value={stimulant} onChange={setStimulant} />
          <YesNo label="Took sleep medicine" value={meds} onChange={setMeds} />
          <YesNo label="Woken by noise, light or temperature" value={disturbed} onChange={setDisturbed} />
        </div>
      </div>
      {valid ? (
        <Result level={level} title={`Average ${fmt(avg, 1)} hours a night`} tips={[...ids].map(tip)}>
          <p>Your usual: {fmt(usualHours, 1)} h (your baseline). Astronauts average about 6 hours a night in space (Sleep report, p. 11).</p>
          {avg < 6 && <p>Under 6 hours a night, over time, is linked to a higher chance of high blood pressure (Cardiovascular report, p. 39).</p>}
          {avg < 4 && <p className="text-rose-300">Under 4 hours on average. Tell your flight surgeon if this continues.</p>}
          {issues > 0 && <p>{issues} thing{issues > 1 ? "s" : ""} got in the way of sleep. See the tips below.</p>}
        </Result>
      ) : <p className="text-sm text-rose-400">Enter hours between 0 and 16.</p>}
    </div>
  );
}

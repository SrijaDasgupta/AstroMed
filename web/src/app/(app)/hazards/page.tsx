import Link from "next/link";
import { Bone, HeartPulse, Info, Orbit, Radiation, ShieldAlert } from "lucide-react";
import { ProjectionChart } from "@/components/ProjectionChart";
import { SpaceRadiationCard } from "@/components/astromed";
import { listRadiation } from "@/lib/radiation-store";
import { ENVIRONMENTS } from "@/lib/environments";
import {
  boneSeries, CAREER_LIMIT_MSV, DEFAULT_LENGTH, gravityOf, IMMUNE_SIGNAL_LABELS, LENGTH_OPTIONS, myHazards, radiationSeries,
} from "@/lib/hazards";
import { getMissionContext } from "@/lib/mission";
import { getMyHealth } from "@/lib/my-health";
import { requireViewer } from "@/lib/session";

function Source({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs text-slate-500">{children}</p>;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

const signed = (v: number, dp = 0) => {
  const r = Number(v.toFixed(dp));
  return `${r > 0 ? "+" : r < 0 ? "−" : "±"}${Math.abs(r).toFixed(dp)}`;
};

export default async function HazardsPage({ searchParams }: { searchParams: Promise<{ length?: string }> }) {
  const viewer = await requireViewer();
  const [{ env, assessment }, ctx, { readings }] = await Promise.all([getMyHealth(viewer), getMissionContext(), listRadiation(viewer)]);
  const today = ctx.day;
  // Projection options: the usual lengths, plus the mission's planned length if it has one.
  const options = ctx.length && !LENGTH_OPTIONS.some((o) => o.days === ctx.length)
    ? [{ days: ctx.length, label: `Planned end (${ctx.length} days)` }, ...LENGTH_OPTIONS]
    : LENGTH_OPTIONS.map((o) => (o.days === ctx.length ? { ...o, label: `${o.label} · planned` } : o));
  const requested = Number((await searchParams).length);
  const chosen = options.some((o) => o.days === requested) ? requested : ctx.length ?? DEFAULT_LENGTH[env.id];
  const length = Math.max(chosen, today, 1);
  const { cardio, immune } = myHazards(assessment);
  const gravity = gravityOf(env);

  const rad = radiationSeries(env, length, today);
  const radToday = ctx.doseSoFar;
  const radEnd = env.radiationMsvPerDay * length;
  const daysToLimit = Math.floor(CAREER_LIMIT_MSV / env.radiationMsvPerDay);

  const bone = boneSeries(env, length, today);
  const boneAt = (day: number) => bone?.find((p) => p.day === day);
  const boneRange = (day: number) => {
    const p = boneAt(day);
    return p ? `${p.low.toFixed(1)}–${p.high.toFixed(1)}%` : "—";
  };


  return (
    <div className="space-y-8">
      {ctx.none && (
        <p className="rounded-2xl border border-sky-400/30 bg-sky-400/5 p-4 text-sm text-slate-300">
          <strong className="text-white">No mission set.</strong> These figures are for staying on Earth. <Link href="/mission" className="text-sky-300 hover:text-sky-200">Add your mission</Link> to see your own radiation and bone-loss projections.
        </p>
      )}
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">My exposure to space hazards</h1>
        <p className="mt-1 text-slate-400">
          {ctx.mission ? `${ctx.mission.name}: ` : ""}What {env.name.toLowerCase()} is doing to you so far ({ctx.startsIn ? `starts in ${ctx.startsIn} days` : `day ${today}${ctx.mission ? "" : ", assumed"}`}), and where it&apos;s heading if the mission continues.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Mission length to project to">
        <span className="text-slate-500">Project to</span>
        {options.map((o) => (
          <Link
            key={o.days}
            href={`/hazards?length=${o.days}`}
            aria-current={o.days === length ? "true" : undefined}
            className={`rounded-full px-3 py-1 ${o.days === length ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5"}`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Radiation so far" value={`${radToday.toFixed(1)} mSv`} sub={`${((radToday / CAREER_LIMIT_MSV) * 100).toFixed(1)}% of career limit`} />
        <Stat label={`Radiation by day ${length}`} value={`${radEnd.toFixed(0)} mSv`} sub={`${((radEnd / CAREER_LIMIT_MSV) * 100).toFixed(0)}% of career limit`} />
        <Stat label="Bone density lost so far" value={bone ? boneRange(today) : "None expected"} sub={bone ? "hip and spine, estimated" : "Earth gravity"} />
        <Stat label="Heart and blood pressure" value={cardio.some((c) => c.metric.status !== "good") ? "Changed" : "Normal"} sub="compared with your own baseline" />
      </div>

      {/* Radiation */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium"><Radiation className="h-5 w-5 text-slate-400" aria-hidden /> Radiation exposure</h2>
        <ProjectionChart label="Mission radiation dose" unit="mSv" decimals={1} points={rad} today={today} threshold={{ value: CAREER_LIMIT_MSV, label: "Career limit" }} />
        <p className="text-sm text-slate-300">
          At about {env.radiationMsvPerDay} mSv a day, you would reach NASA&apos;s 600 mSv career limit after roughly{" "}
          <span className="font-medium text-white">{daysToLimit.toLocaleString("en-US")} days</span>
          {daysToLimit > 3650 ? " (more than 10 years)" : ""} here, assuming no dose from earlier missions.
        </p>
        {gravity !== "earth" && env.id !== "leo" && (
          <p className="text-sm text-slate-300">Beyond low Earth orbit, solar storms can add large doses quickly. Crews shelter in the most shielded area and end spacewalks early.</p>
        )}
        <Source>
          Daily dose: {env.radiationSource} Career limit: NASA-STD-3001 Vol. 1, p. 40. A full Mars mission is estimated at about 1,413 mSv (Radiation report, p. 54).
          Solar storms and shielding: Radiation report, p. 48; sheltering and ending spacewalks early: p. 58. Daily averages don&apos;t include solar storms. Neutrons make up about 30% of the radiation on the ISS, and the Canadian Space Agency is developing CANS to measure them continuously:{" "}
          <a href="https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp" target="_blank" rel="noopener noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-sky-300">CSA, 2026</a>.
        </Source>
      </section>

      <SpaceRadiationCard
        environments={ENVIRONMENTS.map((e) => ({ id: e.id, name: e.name, msvPerDay: e.radiationMsvPerDay, source: e.radiationSource }))}
        saved={readings.map((r) => ({
          id: r.id, name: r.name, own: true, msvPerDay: (r.doseMsv / r.hours) * 24,
          source: `Your reading${r.source === "photo-import" ? ", imported from a photo" : ""}: ${Number(r.doseMsv.toPrecision(3))} mSv over ${Number(r.hours.toPrecision(3))} h, shown as a daily rate.`,
        }))}
        initialId={ctx.none ? undefined : env.id}
      />

      {/* Bone */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium"><Bone className="h-5 w-5 text-slate-400" aria-hidden /> Bone density loss</h2>
        {bone ? (
          <>
            <ProjectionChart label="Estimated hip and spine bone density lost" unit="%" decimals={1} points={bone} today={today} />
            <p className="text-sm text-slate-300">
              Estimated loss by day {length}: <span className="font-medium text-white">{boneRange(length)}</span>, without counting the benefit of exercise.
              {gravity === "partial" && " Nobody yet knows whether Moon or Mars gravity slows bone loss, so the range runs from no loss up to the microgravity rate."}
            </p>
            <p className="text-sm text-slate-300">Resistive exercise can reduce the loss. NASA doesn&apos;t yet know whether the loss levels off on very long missions, so long projections are uncertain.</p>
            {length > 180 && (
              <p className="flex gap-2 rounded-xl bg-amber-300/5 p-3 text-sm text-amber-100">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                The monthly rate comes from flights of up to about 6 months. Past day 180 this chart simply extends the line, so treat it as an extrapolation, not a prediction.
              </p>
            )}
            <Source>
              1–1.5% per month in microgravity, and exercise reduces it: Bone fracture report, p. 42. Unknowns about levelling off and partial gravity: p. 11.
              Flight data cover about 6 months or less, and a model predicts 62% of astronauts would return from a Mars mission with osteoporosis-range hip bone density: p. 25.
            </Source>
          </>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">No spaceflight bone loss is expected in Earth gravity.</p>
        )}
      </section>

      {/* Cardiovascular */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium"><HeartPulse className="h-5 w-5 text-slate-400" aria-hidden /> My cardiovascular changes</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          {cardio.map(({ metric: m, change }) => (
            <div key={m.def.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <dt className="text-xs text-slate-500">{m.def.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{signed(change)} <span className="text-sm font-normal text-slate-400">{m.def.unit}</span></dd>
              <dd className="mt-0.5 text-xs text-slate-400">{m.status === "good" ? "within your normal range" : "outside your normal range"}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-slate-400">Change from your baseline, averaged over the last 3 days. <Link href="/vitals" className="text-sky-300 hover:text-sky-200">See the trends in My vitals</Link>.</p>
        {gravity !== "earth" && (
          <p className="text-sm text-slate-300">
            <span className="font-medium text-white">On landing:</span> expect dizziness or fainting on standing. Exercise alone doesn&apos;t prevent it, so combine it with fluid loading before landing.
          </p>
        )}
        <Source>Blood pressure lower in flight, and drops on standing after landing: Cardiovascular report, p. 23. Exercise and fluid loading: p. 87.</Source>
      </section>

      {/* Immune */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium"><ShieldAlert className="h-5 w-5 text-slate-400" aria-hidden /> Immune system</h2>
        <div className="flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-slate-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden />
          <p>AstroMed doesn&apos;t measure immune function directly yet; it would need blood tests. These are indirect warning signs that can go with infection or stress-related immune changes.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm">
          {immune.length === 0 ? (
            <p className="text-slate-300">No warning signs in your recent data.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-300">Your warning signs:</span>
              {immune.map((s) => <span key={s.key} className="rounded-full bg-amber-300/10 px-2.5 py-0.5 text-xs text-amber-100">{s.label}</span>)}
            </div>
          )}
        </div>
        <p className="text-sm text-slate-300">
          In spaceflight, stress has been linked to immune problems: dormant viruses reactivating, more inflammation, and changes in protective proteins in saliva. Blood markers in flight suggest a low-level, ongoing inflammation.
        </p>
        <Source>
          Warning signs checked: {IMMUNE_SIGNAL_LABELS.map((s) => s.label.toLowerCase()).join(", ")}. Stress and immune changes: Behavioral health report, p. 31. Low-level inflammation: Cardiovascular report, p. 96.
          NASA&apos;s dedicated immune evidence report isn&apos;t among AstroMed&apos;s sources yet.
        </Source>
      </section>

      {/* Microgravity & environment */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium"><Orbit className="h-5 w-5 text-slate-400" aria-hidden /> Gravity and environment</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Gravity" value={env.gravity} sub={gravity === "micro" ? "weightless" : gravity === "partial" ? "partial gravity" : "normal"} />
          <Stat label="Signal delay to Earth" value={env.commDelay} sub={env.id.startsWith("mars") ? "no real-time help from Earth" : "real-time support"} />
          <Stat label="Typical length" value={env.typicalDuration} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-slate-500">Main health risks here</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {env.keyRisks.map((r) => <li key={r} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{r}</li>)}
          </ul>
          <p className="mt-4 text-sm text-slate-400">
            Your sleep, mood and heart changes are tracked in <Link href="/vitals" className="text-sky-300 hover:text-sky-200">My vitals</Link>, with matching guidance in <Link href="/tips" className="text-sky-300 hover:text-sky-200">Health tips</Link>.
          </p>
        </div>
      </section>

      <p className="text-xs text-slate-500">Estimates for demonstration and education, not medical advice.</p>
    </div>
  );
}

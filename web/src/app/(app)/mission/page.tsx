import { Check, Rocket } from "lucide-react";
import { missionItemAction, setEnvironment } from "@/app/actions";
import { MissionLaunch } from "@/components/astromed";
import { CiteLink } from "@/components/CiteLink";
import { EnvironmentStats } from "@/components/EnvironmentStats";
import { contactText, DELAY_CITE, reachOf, supportLine } from "@/lib/contact";
import { ENVIRONMENTS, getEnvironment } from "@/lib/environments";
import { getMissionContext } from "@/lib/mission";
import { listMissions } from "@/lib/missions-store";
import { requireViewer } from "@/lib/session";
import { MissionForm } from "./MissionForm";

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

function Op({ id, op, children, danger = false }: { id: string; op: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <form action={missionItemAction}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} />
      <button type="submit" className={`rounded-lg border border-white/15 px-2.5 py-1 text-xs ${danger ? "text-slate-400 hover:border-rose-400/50 hover:text-rose-300" : "text-slate-300 hover:bg-white/5"}`}>{children}</button>
    </form>
  );
}

export default async function MissionPage() {
  const viewer = await requireViewer();
  const [ctx, missions] = await Promise.all([getMissionContext(), listMissions(viewer)]);
  const active = ctx.mission;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
        <h1 className="mt-1 text-2xl font-semibold">Mission</h1>
        <p className="mt-1 text-slate-400">Your mission sets the radiation estimate, gravity effects, health risks and exercise plan across AstroMed.</p>
      </div>

      {active ? (
        <section className="rounded-2xl border border-sky-400/30 bg-sky-400/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-sky-400">Current mission</p>
              <h2 className="mt-1 text-xl font-semibold">{active.name}</h2>
              <p className="text-sm text-slate-400">
                {getEnvironment(active.envType).name}{active.location ? ` · ${active.location}` : ""}{active.crewSize ? ` · crew of ${active.crewSize}` : ""}
              </p>
            </div>
            <p className="rounded-full bg-white/5 px-3 py-1 text-sm tabular-nums text-slate-200">
              {ctx.startsIn ? `Starts in ${ctx.startsIn} day${ctx.startsIn === 1 ? "" : "s"}` : `Day ${ctx.day}${ctx.length ? ` of ${ctx.length}` : ""}`}
            </p>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-slate-500">Dates</dt><dd>{fmt(active.startDate)}{active.endDate ? ` – ${fmt(active.endDate)}` : " – open-ended"}</dd></div>
            <div><dt className="text-xs text-slate-500">Radiation</dt><dd>{ctx.env.radiation}{active.doseRate !== undefined ? " (your figure)" : ""}</dd></div>
            <div><dt className="text-xs text-slate-500">Estimated dose so far</dt><dd className="tabular-nums">{ctx.doseSoFar.toFixed(1)} mSv</dd></div>
          </dl>
          {active.objectives && <p className="mt-4 whitespace-pre-line text-sm text-slate-300">{active.objectives}</p>}
          <div className="mt-4"><EnvironmentStats env={ctx.env} /></div>
        </section>
      ) : (
        ctx.none ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            <strong className="text-white">No mission set.</strong> AstroMed treats you as on Earth: no space radiation, gravity or mission effects are assumed.
            Add your mission below, or pick a mission type for a quick estimate.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            <p>No mission of your own yet. AstroMed is using the <strong className="text-white">{ctx.env.name}</strong> type and assumes {ctx.day} days so far. Add your mission below for estimates based on your real dates.</p>
            <form action={setEnvironment}>
              <button type="submit" name="environment" value="none" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">Clear mission type</button>
            </form>
          </div>
        )
      )}

      {!ctx.none && <MissionLaunch envId={ctx.env.id} missionName={active?.name} />}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-medium">Medical support at this distance</h2>
        <p className="mt-1 text-sm text-slate-300">{supportLine(ctx.env)}{reachOf(ctx.env) === "far" && <> <CiteLink c={DELAY_CITE} /></>}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          {(["now", "today", "routine"] as const).map((l) => (
            <div key={l} className="rounded-xl bg-white/[0.04] p-3">
              <dt className="text-xs uppercase tracking-widest text-slate-500">{l === "now" ? "Emergency" : l === "today" ? "Same day" : "Not urgent"}</dt>
              <dd className="mt-1 text-slate-100">{contactText(l, ctx.env).title}</dd>
            </div>
          ))}
        </dl>
      </section>

      {missions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">My missions</h2>
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">
            {missions.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.name}{m.active && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-400 px-2 py-0.5 text-xs text-slate-950"><Check className="h-3 w-3" aria-hidden />Current</span>}</p>
                  <p className="text-xs text-slate-500">{getEnvironment(m.envType).name} · {fmt(m.startDate)}{m.endDate ? ` – ${fmt(m.endDate)}` : ""}</p>
                </div>
                <div className="flex gap-2">
                  {m.active ? <Op id={m.id} op="deactivate">Stop using</Op> : <Op id={m.id} op="activate">Make current</Op>}
                  <Op id={m.id} op="delete" danger>Delete</Op>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-medium"><Rocket className="h-5 w-5 text-slate-400" aria-hidden />Add a mission</h2>
        <MissionForm types={ENVIRONMENTS.map((e) => ({ id: e.id, name: e.name, dose: e.radiationMsvPerDay }))} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Mission types</h2>
        <p className="text-sm text-slate-400">{active ? "Reference figures for each type. Your current mission uses its own type and dates." : "No mission added yet? Pick a type to use as a quick preset."}</p>
        <form action={setEnvironment} className="grid gap-4 sm:grid-cols-2">
          {ENVIRONMENTS.map((env) => {
            const selected = !active && !ctx.none && env.id === ctx.env.id;
            return (
              <button key={env.id} type="submit" name="environment" value={env.id} aria-pressed={selected} disabled={Boolean(active)}
                className={`rounded-2xl border p-5 text-left transition disabled:cursor-default ${selected ? "border-sky-400 bg-sky-400/10" : "border-white/10 bg-white/[0.03] enabled:hover:border-white/25"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-semibold">{env.name}</h3><p className="text-sm text-slate-400">{env.tagline}</p></div>
                  {selected && <span className="inline-flex items-center gap-1 rounded-full bg-sky-400 px-2 py-0.5 text-xs font-medium text-slate-950"><Check className="h-3 w-3" aria-hidden />Selected</span>}
                </div>
                <div className="mt-4"><EnvironmentStats env={env} /></div>
                <p className="mt-3 text-xs text-slate-500">Radiation: {env.radiationSource}</p>
              </button>
            );
          })}
        </form>
      </section>
      <p className="text-xs text-slate-500">Daily radiation is an average; real doses vary with the solar cycle, shielding and solar storms. NASA&apos;s career limit is 600 mSv (NASA-STD-3001 Vol. 1, p. 40).</p>
    </div>
  );
}

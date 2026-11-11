import Link from "next/link";
import { AlertTriangle, CheckCircle2, Dumbbell, ExternalLink, OctagonAlert } from "lucide-react";
import { EVIDENCE, lastWeek, PLANS, planFor, todayAdvice, type Cited } from "@/lib/exercise";
import { localDate } from "@/lib/dates";
import { getMyHealth } from "@/lib/my-health";
import { requireViewer } from "@/lib/session";
import { SOURCES } from "@/lib/tips";
import { WeekBars } from "./WeekBars";

function Cite({ c }: { c: Cited }) {
  const s = SOURCES[c.source];
  return (
    <a href={`${s.url}#page=${c.page}`} target="_blank" rel="noopener noreferrer" title={s.title} className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
      {s.short}, p. {c.page} <ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens NASA PDF in a new tab)</span>
    </a>
  );
}

const ADVICE = {
  go: { Icon: CheckCircle2, color: "#0ca30c", label: "Go" },
  easy: { Icon: AlertTriangle, color: "#fab219", label: "Take it easier" },
  stop: { Icon: OctagonAlert, color: "#d03b3b", label: "Check first" },
};
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ExercisePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const viewer = await requireViewer();
  const { env, logs, assessment } = await getMyHealth(viewer);
  const recommended = planFor(env.id);
  const requested = (await searchParams).plan;
  const plan = PLANS.find((p) => p.id === requested) ?? recommended;
  const week = lastWeek(logs);
  const today = localDate();
  const todayLog = week[week.length - 1];
  const activeDays = week.filter((d) => d.resistive + d.aerobic > 0).length;
  const total = week.reduce((s, d) => s + d.resistive + d.aerobic, 0);
  const todayName = WEEKDAY[new Date().getDay()];
  const todaysPlan = plan.week.find((d) => d.day === todayName)?.plan;
  const advice = todayAdvice(assessment);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Exercise plan</h1>
        <p className="mt-1 text-slate-400">Built on how NASA structures in-flight exercise, adjusted to your mission and your recent data.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Plan">
        {PLANS.map((p) => (
          <Link key={p.id} href={`/exercise?plan=${p.id}`} aria-current={p.id === plan.id ? "true" : undefined} className={`rounded-full px-3 py-1 ${p.id === plan.id ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5"}`}>
            {p.name}{p.id === recommended.id ? " · your mission" : ""}
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-medium"><Dumbbell className="h-5 w-5 text-sky-300" aria-hidden />Today{todaysPlan ? `: ${todaysPlan}` : ""}</h2>
            <p className="mt-1 text-sm text-slate-400">{plan.name} plan · {new Date(`${today}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <Link href="/checkups/exercise" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">
            {todayLog.resistive + todayLog.aerobic > 0 ? "Log more exercise" : "Log today's exercise"}
          </Link>
        </div>
        {todayLog.resistive + todayLog.aerobic > 0 && <p className="mt-3 text-sm text-emerald-300">Logged today: {todayLog.resistive} min resistance, {todayLog.aerobic} min aerobic.</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {advice.map((a) => {
            const { Icon, color, label } = ADVICE[a.level];
            return <li key={a.text} className="flex gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} aria-hidden /><span><span className="font-medium text-slate-100">{label}: </span><span className="text-slate-300">{a.text}</span></span></li>;
          })}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <WeekBars days={week.map((d) => ({ label: WEEKDAY[new Date(`${d.date}T12:00:00`).getDay()], resistive: d.resistive, aerobic: d.aerobic }))} />
        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Days with exercise</p><p className="mt-1 text-2xl font-semibold tabular-nums">{activeDays} of 7</p><p className="text-xs text-slate-400">ISS crews exercise daily</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs text-slate-500">Total this week</p><p className="mt-1 text-2xl font-semibold tabular-nums">{total} min</p><p className="text-xs text-slate-400">{week.reduce((s, d) => s + d.resistive, 0)} resistance · {week.reduce((s, d) => s + d.aerobic, 0)} aerobic</p></div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">{plan.name}</h2>
        <p className="text-sm text-slate-300">{plan.focus} <span className="text-slate-500">({plan.when})</span></p>
        <p className="text-xs text-slate-500">{plan.cite.map((c, i) => <span key={i}>{i > 0 && " · "}<Cite c={c} /></span>)}</p>
        <div className="grid gap-3 md:grid-cols-2">
          {plan.blocks.map((b) => (
            <div key={b.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-baseline justify-between gap-2"><h3 className="font-medium">{b.title}</h3><span className="text-xs tabular-nums text-slate-400">{b.minutes}</span></div>
              <p className="mt-1 text-sm text-slate-300">{b.what}</p>
              <p className="mt-2 text-xs text-slate-500">Examples: {b.examples.join(", ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Weekly pattern</h2>
        <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03] text-sm">
          {plan.week.map((d) => (
            <li key={d.day} className={`flex gap-4 px-4 py-2.5 ${d.day === todayName ? "bg-sky-400/10" : ""}`}>
              <span className="w-20 shrink-0 text-slate-400">{d.day}{d.day === todayName && <span className="sr-only"> (today)</span>}</span>
              <span className="text-slate-200">{d.plan}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-medium">What NASA&apos;s documents say</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">{EVIDENCE.map((e) => <li key={e.text}>{e.text} <Cite c={e} /></li>)}</ul>
        <p className="mt-4 text-xs text-slate-500">
          NASA&apos;s documents describe the structure and targets of in-flight exercise but not exact sets, reps or loads, so the durations, weekly pattern and example exercises here are AstroMed suggestions. A flight surgeon or trainer sets the actual prescription. Stop and get help if you feel chest pain, faintness or unusual breathlessness.
        </p>
      </section>
    </div>
  );
}

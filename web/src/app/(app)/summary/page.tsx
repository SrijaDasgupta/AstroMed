import Link from "next/link";
import { AlertTriangle, Brain, CheckCircle2, CircleDashed, ClipboardList, ExternalLink, HeartPulse, MessageSquareText, OctagonAlert, Stethoscope } from "lucide-react";
import { loadLogs } from "@/lib/checkup-store";
import { dueCount } from "@/lib/checkup-schedule";
import { dailyMissions, progress } from "@/lib/gamification";
import { MOODS } from "@/lib/journal";
import { listEntries } from "@/lib/journal-store";
import { getMissionContext } from "@/lib/mission";
import { getMyHealth } from "@/lib/my-health";
import { loadTipActions } from "@/lib/profile-store";
import { routineStats } from "@/lib/reminder-store";
import { requireViewer } from "@/lib/session";
import { listBodyNotes } from "@/lib/body-notes-store";
import { buildSummary, STATUS_TEXT, type AreaStatus, type Cite } from "@/lib/summary";
import { SOURCES } from "@/lib/tips";
import { PrintButton } from "./PrintButton";

const STATUS: Record<AreaStatus, { color: string; Icon: typeof CheckCircle2 }> = {
  good: { color: "#0ca30c", Icon: CheckCircle2 },
  watch: { color: "#fab219", Icon: AlertTriangle },
  concern: { color: "#d03b3b", Icon: OctagonAlert },
  nodata: { color: "#64748b", Icon: CircleDashed },
};
const AREA_LABEL = { physical: "Physical", mental: "Mental", routine: "Routine" } as const;
const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function StatusLine({ s }: { s: AreaStatus }) {
  const { color, Icon } = STATUS[s];
  return <span className="inline-flex items-center gap-1.5 text-sm text-slate-200"><Icon className="h-4 w-4" style={{ color }} aria-hidden />{STATUS_TEXT[s]}</span>;
}

function CiteLink({ c }: { c: Cite }) {
  const s = SOURCES[c.source];
  return (
    <a href={`${s.url}#page=${c.page}`} target="_blank" rel="noopener noreferrer" title={s.title} className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
      {s.short}, p. {c.page}<ExternalLink className="h-3 w-3 print:hidden" aria-hidden /><span className="sr-only">(opens NASA PDF in a new tab)</span>
    </a>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-1.5"><dt className="text-slate-400">{k}</dt><dd className="text-right tabular-nums text-slate-100">{v}</dd></div>;
}

export default async function SummaryPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const viewer = await requireViewer();
  const days = (await searchParams).days === "30" ? 30 : 7;
  const [health, ctx, { entries }, actions, routine, { logs }, { notes: bodyNotes }] = await Promise.all([
    getMyHealth(viewer), getMissionContext(), listEntries(viewer, 400), loadTipActions(viewer), routineStats(viewer, days), loadLogs(viewer), listBodyNotes(viewer),
  ]);
  const missions = dailyMissions(health.assessment, health.env);
  const p = progress(logs, actions, missions.map((m) => m.id), undefined, entries.map((e) => e.date));
  const s = buildSummary({
    assessment: health.assessment, logs, journal: entries, ctx, routine, checkupsDue: dueCount(logs),
    progress: { xp: p.xp, rank: p.rank, streak: p.streak }, days, includeSample: viewer.kind === "demo", bodyNotes,
  });
  const fmt = (v: number | undefined, dp = 0, unit = "") => (v === undefined ? "—" : `${v.toFixed(dp)}${unit}`);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-sky-400 print:text-black">Personalized</p>
          <h1 className="mt-1 text-2xl font-semibold">My summary</h1>
          <p className="mt-1 text-slate-400">
            {health.profile.displayName} · {fmtDate(s.from)} – {fmtDate(s.to)} · {ctx.mission ? `${ctx.mission.name}, day ${ctx.day}` : ctx.none ? "No mission set" : health.env.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 text-sm print:hidden" role="group" aria-label="Period">
            {[7, 30].map((d) => (
              <Link key={d} href={`/summary?days=${d}`} aria-current={d === days ? "true" : undefined} className={`rounded-full px-3 py-1 ${d === days ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5"}`}>Last {d} days</Link>
            ))}
          </div>
          <PrintButton />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Overall">
        {([["physical", HeartPulse, s.physical.status], ["mental", Brain, s.mental.status], ["routine", ClipboardList, s.routine.status]] as const).map(([area, Icon, status]) => (
          <a key={area} href={`#${area}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/25">
            <p className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-slate-400" aria-hidden />{AREA_LABEL[area]} health</p>
            <p className="mt-2"><StatusLine s={status} /></p>
          </a>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Suggestions for you</h2>
        {s.suggestions.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">Nothing stands out. Keep logging, and your suggestions will update as your data does.</p>
        ) : (
          <ol className="space-y-3">
            {s.suggestions.map((g, n) => (
              <li key={g.id} className={`rounded-2xl border p-4 ${g.priority === 1 ? "border-amber-300/30 bg-amber-300/5" : "border-white/10 bg-white/[0.03]"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium"><span className="mr-2 text-slate-500 tabular-nums">{n + 1}.</span>{g.title}</p>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">{AREA_LABEL[g.area]}{g.priority === 1 ? " · priority" : ""}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300"><span className="text-slate-500">Why: </span>{g.reason}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {g.action && <Link href={g.action.href} className="text-sm text-sky-300 hover:text-sky-200 print:hidden">{g.action.text} →</Link>}
                  {g.cite && <CiteLink c={g.cite} />}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section id="physical" className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center justify-between gap-2 font-medium"><span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-slate-400" aria-hidden />Physical</span><StatusLine s={s.physical.status} /></h2>
          <p className="mt-1 text-xs text-slate-500">Averages of your own readings in this period.</p>
          <dl className="mt-3 divide-y divide-white/5 text-sm">
            {s.physical.vitals.map((v) => (
              <Row key={v.key} k={v.label} v={v.days ? <>{fmt(v.avg, v.decimals)} <span className="text-xs text-slate-500">{v.unit} · {v.days}d</span></> : <span className="text-slate-500">no readings</span>} />
            ))}
            <Row k="Sleep" v={s.physical.sleepNights ? <>{fmt(s.physical.sleepAvg, 1, " h")} <span className="text-xs text-slate-500">{s.physical.shortNights} short</span></> : <span className="text-slate-500">no logs</span>} />
            <Row k="Exercise" v={`${s.physical.exerciseDays} of ${days} days · ${Math.round(s.physical.exerciseMin)} min`} />
            <Row k="Water" v={fmt(s.physical.waterAvg, 1, " L/day")} />
            <Row k="Body notes" v={s.physical.bodyNotesOpen ? <Link href="/body" className="text-sky-300 hover:text-sky-200">{s.physical.bodyNotesOpen} open</Link> : <span className="text-slate-500">none open</span>} />
            <Row k={ctx.mission ? "Radiation this mission" : ctx.none ? "Radiation (no mission set)" : `Radiation (assumed ${ctx.day} days)`} v={`${s.physical.dose.toFixed(1)} mSv (${s.physical.dosePct.toFixed(1)}%)`} />
          </dl>
          <Link href="/vitals" className="mt-3 inline-block text-sm text-sky-300 hover:text-sky-200 print:hidden">My vitals →</Link>
        </section>

        <section id="mental" className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center justify-between gap-2 font-medium"><span className="flex items-center gap-2"><Brain className="h-4 w-4 text-slate-400" aria-hidden />Mental</span><StatusLine s={s.mental.status} /></h2>
          <p className="mt-1 text-xs text-slate-500">From your journal, daily logs and mood check-ins.</p>
          <dl className="mt-3 divide-y divide-white/5 text-sm">
            <Row k="Average mood" v={s.mental.moodAvg === undefined ? <span className="text-slate-500">no ratings</span> : <>{MOODS[Math.round(s.mental.moodAvg) - 1]?.face} {s.mental.moodAvg.toFixed(1)} / 5</>} />
            <Row k="Low-mood days" v={`${s.mental.lowDays} of ${s.mental.moodDays}`} />
            <Row k="Average stress" v={s.mental.stressAvg === undefined ? <span className="text-slate-500">no ratings</span> : `${s.mental.stressAvg.toFixed(1)} / 5`} />
            <Row k="Journal entries" v={s.mental.entries} />
            <Row k="Writing most about" v={s.mental.topics.length ? s.mental.topics.slice(0, 2).map((t) => t.label).join(", ") : "—"} />
          </dl>
          <Link href="/journal" className="mt-3 inline-block text-sm text-sky-300 hover:text-sky-200 print:hidden">Journal →</Link>
        </section>

        <section id="routine" className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center justify-between gap-2 font-medium"><span className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-slate-400" aria-hidden />Routine</span><StatusLine s={s.routine.status} /></h2>
          <p className="mt-1 text-xs text-slate-500">{s.routine.statsDays === 1 ? "Medicines and reminders: today (demo)." : "Medicines, reminders and checkups."}</p>
          <dl className="mt-3 divide-y divide-white/5 text-sm">
            <Row k="Medicines taken" v={s.routine.adherence === undefined ? <span className="text-slate-500">none scheduled</span> : `${s.routine.taken} of ${s.routine.expected} (${s.routine.adherence.toFixed(0)}%)`} />
            {s.routine.missed.slice(0, 3).map((m) => <Row key={m.name} k={`  ${m.name}`} v={<span className="text-amber-200">{m.missed} not taken</span>} />)}
            <Row k="Reminders done" v={s.routine.remindersPct === undefined ? <span className="text-slate-500">none scheduled</span> : `${s.routine.remindersDone} of ${s.routine.remindersExpected}`} />
            <Row k="Checkups due" v={s.routine.checkupsDue} />
            <Row k="Streak · rank" v={`${s.routine.streak} days · ${s.routine.rank}`} />
          </dl>
          <Link href="/reminders" className="mt-3 inline-block text-sm text-sky-300 hover:text-sky-200 print:hidden">Medicines & reminders →</Link>
        </section>
      </div>

      <section className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
        <h2 className="flex items-center gap-2 text-lg font-medium"><Stethoscope className="h-5 w-5 text-sky-300" aria-hidden />Discuss with your flight surgeon</h2>
        <p className="mt-1 text-sm text-slate-400">Questions worth raising at your next conference, based on your data. AstroMed doesn&apos;t recommend medicines; these help you have that conversation.</p>
        {s.questions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">Nothing specific right now.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {s.questions.map((q) => (
              <li key={q.text} className="flex gap-2 text-sm">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                <span><span className="text-slate-100">{q.text}</span><span className="block text-xs text-slate-500">{q.reason}{q.cite && <> · <CiteLink c={q.cite} /></>}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Suggestions come from your own data and NASA&apos;s crew health documents. They support, and don&apos;t replace, advice from your flight surgeon. If you feel unwell or unsafe, contact them right away.
      </p>
    </div>
  );
}

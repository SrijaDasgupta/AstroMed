import Link from "next/link";
import {
  ArrowRight, BrainCircuit, ClipboardCheck, ClipboardList, Compass, Flame, Lightbulb, LineChart, MessageCircle, Moon, PersonStanding, Radiation, Radio, Target, Trophy, Wind,
} from "lucide-react";
import { CiteLink } from "@/components/CiteLink";
import { MissionScene } from "@/components/home/MissionScene";
import { StatusBadge } from "@/components/StatusBadge";
import type { Cite } from "@/lib/body";
import { dueCount } from "@/lib/checkup-schedule";
import { DAILY_LOG_ID } from "@/lib/daily-log";
import { currentZone, localDate } from "@/lib/dates";
import { dailyMissions, MISSIONS_PER_DAY, progress } from "@/lib/gamification";
import { listEntries } from "@/lib/journal-store";
import { getMissionContext } from "@/lib/mission";
import { getMyHealth } from "@/lib/my-health";
import { setupSteps } from "@/lib/onboarding";
import { loadTipActions } from "@/lib/profile-store";
import { requireViewer } from "@/lib/session";
import { CONDITIONS } from "@/lib/space-conditions";
import { TIPS } from "@/lib/tips";

/** A NASA-cited fact that changes each day. */
function factOfTheDay(today: string): { text: string; cite: Cite } {
  const pool: { text: string; cite: Cite }[] = [
    ...CONDITIONS.flatMap((c) => (c.fact ? [c.fact] : [])),
    ...TIPS.map((t) => ({ text: t.evidence, cite: { source: t.source, page: t.page } })),
  ];
  const dayNumber = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86_400_000);
  return pool[((dayNumber % pool.length) + pool.length) % pool.length];
}

function greeting(tz: string | undefined) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date()));
  return hour < 5 ? "Working late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

/** Small progress ring for the flight-plan tiles. */
function Ring({ value, done }: { value: number; done: boolean }) {
  const c = 2 * Math.PI * 16;
  return (
    <svg viewBox="0 0 40 40" className="h-11 w-11 shrink-0 -rotate-90" aria-hidden>
      <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
      <circle cx="20" cy="20" r="16" fill="none" stroke={done ? "#34d399" : "#38bdf8"} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={`${Math.max(0.02, Math.min(1, value)) * c} ${c}`} className="transition-[stroke-dasharray] duration-700" />
    </svg>
  );
}

const BREAKS = [
  { href: "/journal", icon: Wind, title: "Breathe and play", blurb: "Paced breathing, constellation and pairs games", tint: "text-sky-300" },
  { href: "/hazards", icon: Radiation, title: "Dose match", blurb: "Beat the radiation clock, try the shielded cabin", tint: "text-violet-300" },
  { href: "/vitals", icon: Moon, title: "Sleep orbit", blurb: "Your week of sleep as rings around a planet", tint: "text-indigo-300" },
  { href: "/indicators", icon: PersonStanding, title: "Body systems", blurb: "Tap a system, see what checks it", tint: "text-rose-300" },
  { href: "/assistant", icon: MessageCircle, title: "Ask AstroMed", blurb: "Questions about your own data", tint: "text-emerald-300" },
];

export default async function StartPage() {
  const viewer = await requireViewer();
  const [{ env, profile, logs, assessment: a }, ctx, actions, { entries }, steps] = await Promise.all([
    getMyHealth(viewer), getMissionContext(), loadTipActions(viewer), listEntries(viewer, 400), setupSteps(viewer),
  ]);
  const today = localDate();
  const missions = dailyMissions(a, env);
  const p = progress(logs, actions, missions.map((m) => m.id), undefined, entries.map((e) => e.date));
  const missionsDone = missions.filter((m) => p.doneToday.has(m.id)).length;
  const loggedToday = logs.some((l) => l.checkupId === DAILY_LOG_ID && localDate(new Date(l.createdAt)) === today);
  const due = dueCount(logs);
  const flagged = a.metrics.filter((m) => m.status !== "good");
  const fact = factOfTheDay(today);
  const setupDone = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);
  const progressFraction = ctx.length ? ctx.day / ctx.length : Math.min(1, ctx.day / 210);
  const firstName = profile.displayName.split(" ")[0];

  const plan = [
    { href: "/log", icon: ClipboardList, title: "Daily log", value: loggedToday ? 1 : 0, done: loggedToday, text: loggedToday ? "Done for today" : "Under a minute: vitals, sleep, food, mood" },
    { href: "/me", icon: Target, title: "Today's missions", value: missionsDone / MISSIONS_PER_DAY, done: missionsDone >= MISSIONS_PER_DAY, text: `${missionsDone} of ${MISSIONS_PER_DAY} habits done${p.allMissionsToday ? " · bonus earned" : ""}` },
    { href: "/checkups", icon: ClipboardCheck, title: "Checkups", value: due === 0 ? 1 : 0.3, done: due === 0, text: due === 0 ? "All up to date" : `${due} due now` },
  ];

  return (
    <div className="space-y-6">
      {/* Mission hero */}
      <section className="am-rise overflow-hidden rounded-3xl border border-sky-400/20 bg-[#070b16]">
        <div className="relative aspect-[3/1] max-h-72 w-full">
          <MissionScene envId={env.id} progress={progressFraction} none={ctx.none} background />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#070b16] to-transparent" />
        </div>
        <div className="relative -mt-6 flex flex-wrap items-end justify-between gap-5 px-5 pb-5 sm:px-7 sm:pb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-sky-300">{greeting(currentZone())}, {firstName}</p>
            {ctx.none ? (
              <>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Ready for launch?</h1>
                <p className="mt-1 max-w-md text-sm text-slate-300">Add your mission to see your spacecraft here, with advice for your distance from Earth.</p>
                <Link href="/mission" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">Add my mission <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              </>
            ) : (
              <>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{ctx.startsIn ? `Launch in ${ctx.startsIn} days` : `Mission day ${ctx.day}`}</h1>
                <p className="mt-1 text-sm text-slate-300">
                  {ctx.mission?.name ?? env.name}{ctx.length && !ctx.startsIn ? ` · ${Math.max(0, ctx.length - ctx.day)} days to go` : ""}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200"><Radio className="h-3.5 w-3.5" aria-hidden />Signal delay to Earth: {env.commDelay}</p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/me" className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-2.5 hover:bg-white/10">
              <Trophy className="h-5 w-5 text-amber-300" aria-hidden />
              <div>
                <p className="text-sm font-medium">{p.rank} · {p.xp.toLocaleString("en-US")} XP</p>
                <div className="mt-1 h-1.5 w-32 rounded-full bg-sky-950"><div className="h-1.5 rounded-full bg-amber-300" style={{ width: `${Math.max(3, p.rankProgress * 100)}%` }} /></div>
              </div>
            </Link>
            <Link href="/me" className="flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-2.5 hover:bg-white/10">
              <Flame className={`h-5 w-5 ${p.streak > 0 ? "text-orange-400" : "text-slate-500"}`} aria-hidden />
              <span className="text-sm"><span className="font-semibold tabular-nums">{p.streak}</span> day streak</span>
            </Link>
          </div>
        </div>
      </section>

      {nextStep && (
        <Link href="/guide" className="group flex flex-wrap items-center gap-4 rounded-2xl border border-sky-400/30 bg-sky-400/5 p-4 transition hover:border-sky-400/60">
          <Compass className="h-6 w-6 shrink-0 text-sky-300" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{setupDone === 0 ? "New here? Start with the getting-started guide" : `Getting started: ${setupDone} of ${steps.length} done`}</p>
            <p className="text-sm text-slate-400">Next: {nextStep.title.toLowerCase()}.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 group-hover:text-sky-200">Open the guide <ArrowRight className="h-4 w-4" aria-hidden /></span>
        </Link>
      )}

      {/* Today's flight plan */}
      <section>
        <h2 className="text-lg font-medium">Today&apos;s flight plan</h2>
        <ul className="mt-3 grid gap-3 lg:grid-cols-3">
          {plan.map(({ href, icon: Icon, title, value, done, text }, i) => (
            <li key={href} className="am-rise" style={{ animationDelay: `${0.08 * (i + 1)}s` }}>
              <Link href={href} className={`flex h-full items-center gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${done ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03] hover:border-sky-400/50"}`}>
                <Ring value={value} done={done} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium"><Icon className="h-4 w-4 text-slate-400" aria-hidden />{title}</p>
                  <p className={`text-sm ${done ? "text-emerald-300" : "text-slate-400"}`}>{text}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Health at a glance */}
        <Link href="/summary" className="am-rise group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-sky-400/50" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="flex items-center gap-2 font-medium"><LineChart className="h-5 w-5 text-sky-300" aria-hidden />Health at a glance</h2>
            <StatusBadge status={a.status} small />
          </div>
          <p className="mt-3 text-sm text-slate-300">
            {flagged.length === 0 ? "Everything is within your normal range." : `Worth a look: ${flagged.slice(0, 3).map((m) => m.def.label.toLowerCase()).join(", ")}${flagged.length > 3 ? ` and ${flagged.length - 3} more` : ""}.`}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm text-sky-300 group-hover:text-sky-200">See my summary <ArrowRight className="h-4 w-4" aria-hidden /></span>
        </Link>

        {/* Fact of the day */}
        <section className="am-rise rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.07] to-transparent p-5" style={{ animationDelay: "0.38s" }}>
          <h2 className="flex items-center gap-2 font-medium"><Lightbulb className="h-5 w-5 text-amber-300" aria-hidden />Did you know?</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{fact.text}</p>
          <p className="mt-2"><CiteLink c={fact.cite} /></p>
          <p className="mt-1 text-xs text-slate-500">A new fact every day.</p>
        </section>
      </div>

      {/* Breaks */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-medium"><BrainCircuit className="h-5 w-5 text-violet-300" aria-hidden />Take a break</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {BREAKS.map(({ href, icon: Icon, title, blurb, tint }, i) => (
            <li key={href} className="am-rise" style={{ animationDelay: `${0.45 + 0.06 * i}s` }}>
              <Link href={href} className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-sky-400/50 hover:bg-sky-400/5">
                <Icon className={`h-6 w-6 ${tint} transition group-hover:scale-110`} aria-hidden />
                <p className="mt-3 font-medium">{title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Two ways to use AstroMed */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/log" className="group rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-sky-400/50">
          <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
          <p className="mt-1 text-sm text-slate-300">Quick, everyday use: daily log, guided checkups, health tools, tips and your mission.</p>
        </Link>
        <Link href="/summary" className="group rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-sky-400/50">
          <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
          <p className="mt-1 text-sm text-slate-300">Your long-term picture: summary, problems and advice, trends, body map, exposure and journal.</p>
        </Link>
      </section>
    </div>
  );
}

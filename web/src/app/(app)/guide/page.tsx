import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, Circle, Menu, Sun, CalendarDays, LifeBuoy } from "lucide-react";
import { setupSteps } from "@/lib/onboarding";
import { requireViewer } from "@/lib/session";

const PAGES: { area: string; items: [string, string, string][] }[] = [
  {
    area: "General: quick, everyday use",
    items: [
      ["/log", "Daily log", "Enter today's vitals, sleep, exercise, water, mood and symptoms by hand."],
      ["/indicators", "Health indicators", "How to measure each indicator in space, why it matters, how spaceflight affects it, and when to get help."],
      ["/checkups", "Checkups", "Guided step-by-step checks. Shows which ones are due."],
      ["/tools", "Health tools", "Calculators for radiation, bone loss, sleep and more."],
      ["/tips", "Health tips", "NASA-based habits by topic. Tick them off to earn XP and keep your streak."],
      ["/mission", "Mission", "Add your missions and their dates, or pick a mission type."],
    ],
  },
  {
    area: "Personalized: your long-term picture",
    items: [
      ["/summary", "My summary", "Everything in one place: physical and mental health, routine, suggestions and questions for your flight surgeon. Printable."],
      ["/problems", "Problems & advice", "Report any problem, physical, mental or environmental, in your own words with photos. Get advice and follow it with updates."],
      ["/me", "My space", "Your rank, streak, badges and today's missions."],
      ["/vitals", "My vitals", "Charts of each vital against your own normal range."],
      ["/history", "Long-term history", "Weeks and months of your readings."],
      ["/reminders", "Medicines & reminders", "Today's schedule with tick-offs and browser notifications."],
      ["/exercise", "Exercise plan", "A weekly plan for your mission, based on NASA in-flight exercise."],
      ["/journal", "Journal", "Private entries with prompts for mental well-being."],
      ["/body", "My body", "Tap a body part to see how your mission affects it."],
      ["/hazards", "My exposure", "Your radiation and bone-loss projections."],
      ["/assistant", "Ask AstroMed", "Ask questions about your own data, like “how did I sleep this week?”"],
      ["/records", "My records", "Upload lab reports and import smartwatch CSV files."],
      ["/profile", "My profile", "Your details and usual values."],
    ],
  },
];

export default async function GuidePage() {
  const viewer = await requireViewer();
  const steps = await setupSteps(viewer);
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Start here</p>
        <h1 className="mt-1 text-2xl font-semibold">Getting started</h1>
        <p className="mt-1 text-slate-400">How to find your way around AstroMed and get the most out of it.</p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-medium">1. Set up in a few minutes</h2>
          <p className="text-sm tabular-nums text-slate-400">{done} of {steps.length} done</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Setup progress">
          <div className="h-full rounded-full bg-sky-400" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
        {next ? (
          <p className="text-sm text-slate-300">Next up: <Link href={next.href} className="font-medium text-sky-300 hover:text-sky-200">{next.title}</Link></p>
        ) : (
          <p className="text-sm text-emerald-300">All set up. Your summary and suggestions now use your own data.</p>
        )}
        <ol className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">
          {steps.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start gap-3 px-4 py-4 sm:flex-nowrap">
              {s.done
                ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-label="Done" />
                : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-label="Not done yet" />}
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${s.done ? "text-slate-400" : ""}`}>{s.title} <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-normal text-slate-400">{s.area}</span></p>
                <p className="mt-0.5 text-sm text-slate-400">{s.why}</p>
              </div>
              <Link href={s.href} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5">
                {s.done ? "Open" : s.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">2. Finding your way around</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            <Menu className="h-5 w-5 text-sky-300" aria-hidden />
            <h3 className="mt-3 font-medium text-white">The menu</h3>
            <p className="mt-1">On a computer the menu is always on the left. On a phone or narrow window, tap <strong className="text-white">Menu</strong> in the top-left corner.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            <p className="text-xs font-medium uppercase tracking-widest text-sky-300">General vs Personalized</p>
            <p className="mt-3"><strong className="text-white">General</strong> is for entering things quickly: today&apos;s log, checkups, tools and tips.</p>
            <p className="mt-2"><strong className="text-white">Personalized</strong> is where AstroMed uses everything you&apos;ve entered over time: trends, summary, reminders and records.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            <p className="text-xs font-medium uppercase tracking-widest text-sky-300">Your mission</p>
            <p className="mt-3">The bar at the top shows your current mission and day. Click it to change missions. With no mission set, AstroMed assumes you&apos;re on Earth.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">3. A routine that works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Sun, title: "Every day", items: [["/log", "Log today's data (about a minute)"], ["/reminders", "Tick off medicines and reminders"], ["/problems", "Report anything new, or update an ongoing problem"], ["/tips", "Do today's missions for XP"]] },
            { icon: CalendarDays, title: "Every week", items: [["/checkups", "Do the checkups that are due"], ["/summary", "Read My summary and its suggestions"], ["/journal", "Write a journal entry or two"]] },
            { icon: CalendarCheck, title: "Before seeing your flight surgeon", items: [["/summary", "Print My summary"], ["/summary", "Bring the “Discuss with your flight surgeon” questions"], ["/history", "Check long-term trends"]] },
          ].map(({ icon: Icon, title, items }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-sky-300" aria-hidden />{title}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {items.map(([href, text]) => <li key={text}><Link href={href} className="text-slate-300 hover:text-sky-200">{text} →</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">4. Every page at a glance</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {PAGES.map((g) => (
            <div key={g.area} className="rounded-2xl border border-white/10 bg-white/[0.03]">
              <h3 className="border-b border-white/10 px-4 py-3 text-sm font-medium text-slate-200">{g.area}</h3>
              <dl className="divide-y divide-white/5">
                {g.items.map(([href, name, text]) => (
                  <div key={href} className="px-4 py-2.5 text-sm">
                    <dt><Link href={href} className="font-medium text-sky-300 hover:text-sky-200">{name}</Link></dt>
                    <dd className="text-slate-400">{text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <p className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
        <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        AstroMed helps you keep track and spot changes. It isn&apos;t medical advice and doesn&apos;t recommend medicines. If something feels wrong, contact your flight surgeon or emergency services.
      </p>
    </div>
  );
}

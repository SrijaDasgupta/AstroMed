import Link from "next/link";
import { ArrowRight, ClipboardList, Compass, LineChart } from "lucide-react";
import { setupSteps } from "@/lib/onboarding";
import { getProfile } from "@/lib/profile-store";
import { requireViewer } from "@/lib/session";

const AREAS = [
  {
    href: "/log",
    icon: ClipboardList,
    title: "General",
    blurb: "Quick, everyday use.",
    items: ["Log today's data by hand: vitals, sleep, exercise, mood, symptoms", "Guided checkups with step-by-step instructions", "Health tools: radiation, bone loss and sleep calculators", "Add your mission and its details", "NASA-based health tips"],
    cta: "Log today's data",
  },
  {
    href: "/summary",
    icon: LineChart,
    title: "Personalized",
    blurb: "Your long-term picture.",
    items: ["Your overall summary of physical and mental health, with suggestions", "Report any problem in your own words, with photos, and get advice", "Your trends and long-term history against your own normal range", "Medicines and reminders, exercise plan and journal", "Your profile, records and smartwatch imports", "Your body map, exposure and progress", "Ask questions about your own data"],
    cta: "See my summary",
  },
];

export default async function StartPage() {
  const viewer = await requireViewer();
  const [{ displayName }, steps] = await Promise.all([getProfile(viewer), setupSteps(viewer)]);
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {displayName}</h1>
        <p className="mt-1 text-slate-400">Where would you like to go? You can switch any time from the menu.</p>
      </div>
      {next && (
        <Link href="/guide" className="group flex flex-wrap items-center gap-4 rounded-2xl border border-sky-400/30 bg-sky-400/5 p-5 transition hover:border-sky-400/60">
          <Compass className="h-7 w-7 shrink-0 text-sky-300" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{done === 0 ? "New here? Start with the getting-started guide" : `Getting started: ${done} of ${steps.length} done`}</p>
            <p className="text-sm text-slate-400">A few quick steps to set up AstroMed, how to find your way around, and a routine to follow. Next: {next.title.toLowerCase()}.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 group-hover:text-sky-200">Open the guide <ArrowRight className="h-4 w-4" aria-hidden /></span>
        </Link>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {AREAS.map(({ href, icon: Icon, title, blurb, items, cta }) => (
          <Link key={title} href={href} className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-sky-400/50 hover:bg-sky-400/5">
            <Icon className="h-7 w-7 text-sky-300" aria-hidden />
            <h2 className="mt-4 text-xl font-semibold">{title}</h2>
            <p className="text-sm text-slate-400">{blurb}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-300">
              {items.map((i) => <li key={i} className="flex gap-2"><span className="text-sky-400" aria-hidden>•</span>{i}</li>)}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 group-hover:text-sky-200">{cta} <ArrowRight className="h-4 w-4" aria-hidden /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

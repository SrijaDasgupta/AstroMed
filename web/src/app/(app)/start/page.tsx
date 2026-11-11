import Link from "next/link";
import { ArrowRight, ClipboardList, LineChart } from "lucide-react";
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
    href: "/me",
    icon: LineChart,
    title: "Personalized",
    blurb: "Your long-term picture.",
    items: ["Your trends and long-term history against your own normal range", "Medicines and reminders, exercise plan and journal", "Your profile, records and smartwatch imports", "Your body map, exposure and progress", "Ask questions about your own data"],
    cta: "Open my space",
  },
];

export default async function StartPage() {
  const viewer = await requireViewer();
  const { displayName } = await getProfile(viewer);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {displayName}</h1>
        <p className="mt-1 text-slate-400">Where would you like to go? You can switch any time from the sidebar.</p>
      </div>
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

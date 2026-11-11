import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VitalsTable } from "@/components/VitalsTable";
import { assess, CREW, MISSION_DAYS } from "@/lib/crew";
import { EnvironmentStats } from "@/components/EnvironmentStats";
import { getCurrentEnvironment } from "@/lib/mission";
import { requireViewer } from "@/lib/session";

export default async function DashboardPage() {
  const viewer = await requireViewer();
  const env = await getCurrentEnvironment();
  const rank = { critical: 0, warning: 1, good: 2 };
  const assessments = CREW.map((m) => assess(m, env)).sort((x, y) => rank[x.status] - rank[y.status]);
  const needsAttention = assessments.filter((a) => a.status !== "good");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-slate-400">
          {viewer.kind === "demo"
            ? "You're exploring AstroMed with sample crew data."
            : "Welcome back. Here's your mission at a glance."}
        </p>
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">Crew vitals</h2>
          <Link href="/crew" className="inline-flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200">
            All crew <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          {needsAttention.length === 0
            ? "Everyone is within their personal normal range."
            : `${needsAttention.length} of ${assessments.length} crew members need a look.`}
        </p>
        <div className="mt-3"><VitalsTable assessments={assessments} /></div>
        <p className="mt-2 text-xs text-slate-500">
          Latest of {MISSION_DAYS} days. Flags use the average of the last 3 days, so a single unusual day isn&apos;t flagged. Heart rate, sleep and mood baselines are measured (MMASH); blood pressure, glucose and temperature baselines are simulated.
          Open a crew member for trend charts.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-sky-400">Current mission</p>
            <h2 className="mt-1 text-xl font-semibold">{env.name}</h2>
            <p className="text-sm text-slate-400">{env.tagline}</p>
          </div>
          <Link href="/mission" className="inline-flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200">
            Change <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-5"><EnvironmentStats env={env} /></div>
        <div className="mt-5">
          <p className="text-xs text-slate-500">Main health risks</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {env.keyRisks.map((risk) => (
              <li key={risk} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{risk}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

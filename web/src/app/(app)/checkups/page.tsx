import Link from "next/link";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { EscalationBadge } from "@/components/EscalationBadge";
import { SetupNotice } from "@/components/SetupNotice";
import { loadLogs } from "@/lib/checkup-store";
import { ago, dueCount, dueStatus, everyLabel, until } from "@/lib/checkup-schedule";
import { CHECKUPS, getCheckup } from "@/lib/checkups";
import { requireViewer } from "@/lib/session";

export default async function CheckupsPage() {
  const viewer = await requireViewer();
  const { logs, storage, problem } = await loadLogs(viewer);
  const due = dueCount(logs);
  const recent = logs.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
        <h1 className="mt-1 text-2xl font-semibold">Guided checkups</h1>
        <p className="mt-1 text-slate-400">Routine checks with step-by-step instructions. Each one tells you whether to contact the flight surgeon. New to these measurements? See the <Link href="/indicators" className="text-sky-300 hover:text-sky-200">Health indicators guide</Link>.</p>
      </div>

      {problem && <SetupNotice problem={problem} />}
      <p className="text-sm text-slate-300">{due === 0 ? "All your checkups are done for now." : `${due} checkup${due > 1 ? "s" : ""} due.`} Vital signs and sleep readings are added to My vitals.</p>

      <section>
        <h2 className="sr-only">Your checkups</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {CHECKUPS.map((c) => {
            const s = dueStatus(c, logs);
            return (
              <li key={c.id}>
                <Link href={`/checkups/${c.id}`} className="group block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/25">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-sm text-slate-400">{c.summary}</p>
                    </div>
                    {s.due ? (
                      <span className="shrink-0 rounded-full bg-sky-400 px-2 py-0.5 text-xs font-medium text-slate-950">Due</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">Done</span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {everyLabel(c.everyDays)}
                    {s.last && ` · last done ${ago(s.last.createdAt)}`}
                    {!s.due && s.nextDue && ` · next ${until(s.nextDue)}`}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm text-sky-300 group-hover:text-sky-200">
                    {s.due ? "Start" : "Do it again"} <ChevronRight className="h-4 w-4" aria-hidden />
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-medium">Your recent checkups</h2>
        {recent.length === 0 ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400"><ClipboardCheck className="h-4 w-4" aria-hidden /> None yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">
            {recent.map((l) => (
              <li key={l.createdAt + l.checkupId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <span>
                  <span className="font-medium">{l.checkupId === "daily" ? "Daily log" : l.checkupId === "import" ? "Imported readings" : getCheckup(l.checkupId)?.title ?? l.checkupId}</span>
                  <span className="ml-2 text-slate-500">{ago(l.createdAt)}</span>
                </span>
                <EscalationBadge level={l.escalation} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          {storage === "demo"
            ? "Demo mode: checkups are kept in this browser for 7 days and cleared when you leave the demo."
            : "Saved to your AstroMed account. Only you can see them."}
        </p>
      </section>

      <p className="text-xs text-slate-500">
        NASA requires periodic monitoring of these areas but doesn&apos;t set how often. The daily and weekly schedules are AstroMed suggestions. Not medical advice.
      </p>
    </div>
  );
}

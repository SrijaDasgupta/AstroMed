import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { Assessment } from "@/lib/crew";
import { SUMMARY_COLUMNS, summaryCell } from "@/lib/vitals";

export function CrewCard({ a }: { a: Assessment }) {
  return (
    <Link
      href={`/crew/${a.member.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{a.member.callSign}</h2>
          <p className="text-sm text-slate-400">{a.member.role}</p>
        </div>
        <StatusBadge status={a.status} small />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
        {SUMMARY_COLUMNS.map((c) => {
          const cell = summaryCell(a, c.keys);
          return (
            <div key={c.label}>
              <dt className="text-xs text-slate-500">{c.label}</dt>
              <dd className="tabular-nums text-slate-200">
                {cell.value} <span className="text-xs text-slate-500">{cell.unit}</span>
                {cell.status !== "good" && <span className="block text-[11px] text-amber-200">outside normal</span>}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-4 flex items-center gap-1 text-xs text-sky-300 group-hover:text-sky-200">
        View details <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </p>
    </Link>
  );
}

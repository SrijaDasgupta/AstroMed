import Link from "next/link";
import { AlertTriangle, OctagonAlert } from "lucide-react";
import { StatusBadge, STATUS_COLOR } from "@/components/StatusBadge";
import type { Assessment } from "@/lib/crew";
import { SUMMARY_COLUMNS, summaryCell } from "@/lib/vitals";

export function VitalsTable({ assessments }: { assessments: Assessment[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="sr-only">Latest daily value for each crew member. Flagged values are outside that person&apos;s normal range.</caption>
        <thead>
          <tr className="text-left text-xs text-slate-500">
            <th scope="col" className="px-4 py-3 font-normal">Crew member</th>
            {SUMMARY_COLUMNS.map((c) => (
              <th key={c.label} scope="col" className="px-3 py-3 font-normal">
                {c.label}
                <span className="block text-[10px] text-slate-600">{summaryCell(assessments[0], c.keys).unit}</span>
              </th>
            ))}
            <th scope="col" className="px-4 py-3 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((a) => (
            <tr key={a.member.id} className="border-t border-white/5 hover:bg-white/[0.02]">
              <th scope="row" className="px-4 py-3 text-left font-medium">
                <Link href={`/crew/${a.member.id}`} className="hover:text-sky-300">{a.member.callSign}</Link>
                <span className="block text-xs font-normal text-slate-500">{a.member.role}</span>
              </th>
              {SUMMARY_COLUMNS.map((c) => {
                const cell = summaryCell(a, c.keys);
                const Icon = cell.status === "critical" ? OctagonAlert : AlertTriangle;
                return (
                  <td key={c.label} className="px-3 py-3 tabular-nums">
                    <span className="inline-flex items-center gap-1 text-slate-100">
                      {cell.status !== "good" && <Icon className="h-3.5 w-3.5" style={{ color: STATUS_COLOR[cell.status] }} aria-hidden />}
                      {cell.value}
                    </span>
                    {cell.status !== "good" && <span className="block text-[11px] text-slate-400">outside normal</span>}
                  </td>
                );
              })}
              <td className="px-4 py-3"><StatusBadge status={a.status} small /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

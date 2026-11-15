import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ago, scheduleLabel } from "@/lib/checkup-schedule";
import { loadLogs } from "@/lib/checkup-store";
import { requireViewer } from "@/lib/session";
import { getCheckup } from "@/lib/checkups";
import { pageHref, pageLabel, SOURCES } from "@/lib/tips";
import { CheckupForm } from "./CheckupForm";

export default async function CheckupPage({ params }: { params: Promise<{ id: string }> }) {
  const checkup = getCheckup((await params).id);
  if (!checkup) notFound();
  const viewer = await requireViewer();
  // Earlier results for checks whose history isn't charted elsewhere.
  const history = checkup.id === "reaction" || checkup.id === "cabin" || checkup.id === "balance" || checkup.id === "speed-drill"
    ? (await loadLogs(viewer)).logs.filter((l) => l.checkupId === checkup.id && l.answers).slice(0, 8)
    : [];
  const numberFields = checkup.fields.filter((f) => f.kind === "number");

  return (
    <div className="space-y-6">
      <Link href="/checkups" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Checkups
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{checkup.title}</h1>
        <p className="mt-1 text-slate-400">{scheduleLabel(checkup)}{checkup.hazard && <> · NASA hazard: {checkup.hazard}</>}</p>
      </div>

      <section>
        <h2 className="font-medium">Steps</h2>
        <ol className="mt-3 space-y-2">
          {checkup.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-slate-100">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 font-medium">Record</h2>
        <CheckupForm checkupId={checkup.id} fields={checkup.fields} widget={checkup.widget} />
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="font-medium">Your recent results</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-normal">When</th>
                  {numberFields.map((f) => <th key={f.id} className="px-4 py-2 font-normal">{f.label}{f.kind === "number" && f.unit ? ` (${f.unit})` : ""}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((l) => (
                  <tr key={l.createdAt}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-400">{ago(l.createdAt)}</td>
                    {numberFields.map((f) => <td key={f.id} className="px-4 py-2 tabular-nums text-slate-100">{typeof l.answers?.[f.id] === "number" ? String(l.answers[f.id]) : "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="text-sm">
        <h2 className="font-medium">Why this check</h2>
        <ul className="mt-2 space-y-1.5 text-slate-400">
          {checkup.why.map((w, i) => (
            <li key={i}>
              {w.text}{" "}
              <a href={pageHref(SOURCES[w.source], w.page)} target="_blank" rel="noopener noreferrer" title={SOURCES[w.source].title} className="inline-flex items-center gap-1 text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
                {pageLabel(SOURCES[w.source], w.page)} <ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens the source in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          {checkup.id === "cabin"
            ? "Cabin readings are compared with the NASA-STD-3001 limits above. Real missions also set their own operating limits. Not medical advice."
            : checkup.id === "reaction"
              ? "Each result is compared with your own earlier tests. Slower than usual is a prompt to look at sleep, workload and cabin air, not a diagnosis. Not medical advice."
              : "Readings are compared with your own normal range and with general clinical limits (for example, fever from 38 °C, high blood pressure from 140/90, oxygen saturation below 94%). These limits are AstroMed demo settings, not NASA values; a real flight surgeon team sets its own. Not medical advice."}
        </p>
      </section>
    </div>
  );
}

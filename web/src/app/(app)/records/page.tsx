import Link from "next/link";
import { Download, FileText, Image as ImageIcon, LineChart, Lock, Upload } from "lucide-react";
import { listRecords, RECORD_KINDS } from "@/lib/records-store";
import { requireViewer } from "@/lib/session";
import { DeleteRecordButton, ImportForm, UploadForm } from "./forms";

const size = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ missing?: string }> }) {
  const viewer = await requireViewer();
  const demo = viewer.kind === "demo";
  const { records, problem } = await listRecords(viewer);
  const missing = (await searchParams).missing === "1";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">My records</h1>
        <p className="mt-1 text-slate-400">Keep lab results, reports and other documents in one place, and import readings from a smartwatch or health app. To read the numbers off a screen or report, use <Link href="/photo-import" className="text-sky-300 hover:text-sky-200">Photo import</Link>.</p>
      </div>

      {demo && <p className="flex items-center gap-2 rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100"><Lock className="h-4 w-4" aria-hidden />Uploading files and CSV imports need an account. Photo imports work in the demo: their text and readings are kept in this browser.</p>}
      {problem && <p className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">Couldn&apos;t load your records: {problem}</p>}
      {missing && <p className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">That record couldn&apos;t be opened. It may have been deleted.</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Documents</h2>
        {records.length === 0 ? (
          <p className="text-sm text-slate-400">No records yet.</p>
        ) : (
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">
            {records.map((r) => {
              const Icon = r.mimeType.startsWith("image/") ? ImageIcon : FileText;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {RECORD_KINDS.find((k) => k.id === r.kind)?.label} · {r.recordedOn ? new Date(`${r.recordedOn}T12:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "no date"}{r.sizeBytes > 0 ? ` · ${size(r.sizeBytes)}` : ""}{r.notes ? ` · ${r.notes}` : ""}
                      </p>
                      {r.measurements && r.measurements.length > 0 && (
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                          {r.measurements.map((m, i) => (
                            <li key={i} className="rounded-full bg-sky-400/10 px-2 py-0.5 text-xs text-sky-100">{m.label}: <span className="tabular-nums">{m.value}</span> {m.unit}</li>
                          ))}
                        </ul>
                      )}
                      {r.findings && (
                        <details className="mt-1 text-xs text-slate-400">
                          <summary className="cursor-pointer text-slate-300">Text read from the photo</summary>
                          <p className="mt-1 whitespace-pre-wrap break-words">{r.findings}</p>
                        </details>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.sizeBytes > 0 && <a href={`/records/${r.id}/open`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/5"><Download className="h-3.5 w-3.5" aria-hidden />Open</a>}
                    <DeleteRecordButton id={r.id} title={r.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium"><Upload className="h-4 w-4 text-slate-400" aria-hidden />Upload a record</h3>
          <UploadForm kinds={[...RECORD_KINDS]} disabled={demo} />
          <p className="mt-3 text-xs text-slate-500">Files are stored privately in your account. Only you can open them, through a link that works for 60 seconds.</p>
        </div>
      </section>

      <section id="import" className="scroll-mt-6 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-medium"><LineChart className="h-5 w-5 text-slate-400" aria-hidden />Import readings from a CSV</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="mb-3 text-sm text-slate-400">
            Export daily data from your smartwatch or health app as a CSV, then import it here. AstroMed needs a <strong className="text-slate-200">date</strong> column and recognises columns such as resting heart rate, systolic, diastolic, temperature, glucose and sleep. °F, mmol/L and sleep in minutes are converted. Days you&apos;ve already imported are skipped.{" "}
            <a href="/astromed-import-template.csv" download className="text-sky-300 hover:text-sky-200">Download a template</a>.
          </p>
          <ImportForm disabled={demo} />
          <p className="mt-3 text-xs text-slate-500">Imported readings appear in <Link href="/history" className="text-sky-300 hover:text-sky-200">Long-term history</Link> and My vitals, and count toward your own baseline after 7 days.</p>
        </div>
      </section>
    </div>
  );
}

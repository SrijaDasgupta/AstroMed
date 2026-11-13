import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { everyLabel } from "@/lib/checkup-schedule";
import { getCheckup } from "@/lib/checkups";
import { pageHref, pageLabel, SOURCES } from "@/lib/tips";
import { CheckupForm } from "./CheckupForm";

export default async function CheckupPage({ params }: { params: Promise<{ id: string }> }) {
  const checkup = getCheckup((await params).id);
  if (!checkup) notFound();

  return (
    <div className="space-y-6">
      <Link href="/checkups" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Checkups
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{checkup.title}</h1>
        <p className="mt-1 text-slate-400">{everyLabel(checkup.everyDays)}</p>
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
        <CheckupForm checkupId={checkup.id} fields={checkup.fields} />
      </section>

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
          Readings are compared with your own normal range and with general clinical limits (for example, fever from 38 °C, high blood pressure from 140/90). These limits are AstroMed demo settings, not NASA values; a real flight surgeon team sets its own. Not medical advice.
        </p>
      </section>
    </div>
  );
}

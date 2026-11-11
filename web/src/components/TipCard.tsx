import { ExternalLink } from "lucide-react";
import { SOURCES, sourceLink, type Tip } from "@/lib/tips";

export function TipCard({ tip, compact = false }: { tip: Tip; compact?: boolean }) {
  const src = SOURCES[tip.source];
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-widest text-sky-400">{tip.topic}</p>
      <h3 className="mt-1 font-medium text-slate-100">{tip.title}</h3>
      <p className="mt-2 text-sm text-slate-300">{tip.action}</p>
      {!compact && <p className="mt-3 text-sm text-slate-400"><span className="text-slate-500">Evidence: </span>{tip.evidence}</p>}
      <a
        href={sourceLink(tip)}
        target="_blank"
        rel="noopener noreferrer"
        title={src.title}
        className="mt-3 inline-flex items-center gap-1 text-xs text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-sky-300"
      >
        {src.short}, p. {tip.page}
        <ExternalLink className="h-3 w-3" aria-hidden />
        <span className="sr-only">(opens NASA PDF in a new tab)</span>
      </a>
    </article>
  );
}

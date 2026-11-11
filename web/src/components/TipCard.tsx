import { ExternalLink } from "lucide-react";
import { SOURCES, sourceLink, type Tip } from "@/lib/tips";

export function TipCard({ tip, compact = false, footer }: { tip: Tip; compact?: boolean; footer?: React.ReactNode }) {
  const src = SOURCES[tip.source];
  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      {compact && <p className="mb-1 text-xs uppercase tracking-widest text-sky-400">{tip.topic}</p>}
            <h3 className="font-medium text-slate-100">{tip.title}</h3>
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
      {footer && <div className="mt-auto pt-4"><div className="border-t border-white/10 pt-4">{footer}</div></div>}
    </article>
  );
}

import { ExternalLink } from "lucide-react";
import { pageHref, pageLabel, SOURCES, sourceLink, type Tip } from "@/lib/tips";

export function TipCard({ tip, compact = false, footer }: { tip: Tip; compact?: boolean; footer?: React.ReactNode }) {
  return (
    <article id={tip.id} className="flex h-full scroll-mt-20 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      {compact && <p className="mb-1 text-xs uppercase tracking-widest text-sky-400">{tip.topic}</p>}
            <h3 className="font-medium text-slate-100">{tip.title}</h3>
      <p className="mt-2 text-sm text-slate-300">{tip.action}</p>
      {!compact && <p className="mt-3 text-sm text-slate-400"><span className="text-slate-500">Evidence: </span>{tip.evidence}</p>}
      <ul className="mt-3 space-y-1">
        {[{ source: tip.source, page: tip.page }, ...(compact ? [] : tip.also ?? [])].map((c, i) => {
          const s = SOURCES[c.source];
          return (
            <li key={`${c.source}-${i}`}>
              <a
                href={i === 0 ? sourceLink(tip) : pageHref(s, c.page)}
                target="_blank"
                rel="noopener noreferrer"
                title={s.title}
                className="inline-flex items-center gap-1 text-xs text-slate-400 underline decoration-white/20 underline-offset-2 hover:text-sky-300"
              >
                {pageLabel(s, c.page)}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                <span className="sr-only">(opens the source in a new tab)</span>
              </a>
            </li>
          );
        })}
      </ul>
      {footer && <div className="mt-auto pt-4"><div className="border-t border-white/10 pt-4">{footer}</div></div>}
    </article>
  );
}

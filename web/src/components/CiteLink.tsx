import { ExternalLink } from "lucide-react";
import type { Cite } from "@/lib/body";
import { SOURCES } from "@/lib/tips";

export function CiteLink({ c }: { c: Cite }) {
  const src = SOURCES[c.source];
  return (
    <a href={`${src.url}#page=${c.page}`} target="_blank" rel="noopener noreferrer" title={src.title} className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
      {src.short}, p. {c.page}
      <ExternalLink className="h-3 w-3" aria-hidden />
      <span className="sr-only">(opens NASA PDF in a new tab)</span>
    </a>
  );
}

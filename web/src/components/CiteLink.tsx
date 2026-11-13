import { ExternalLink } from "lucide-react";
import type { Cite } from "@/lib/body";
import { SOURCES } from "@/lib/tips";

export function CiteLink({ c }: { c: Cite }) {
  const src = SOURCES[c.source];
  // Web pages have no page numbers; PDFs open at the cited page.
  const web = "web" in src;
  return (
    <a href={web ? src.url : `${src.url}#page=${c.page}`} target="_blank" rel="noopener noreferrer" title={src.title} className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
      {web ? src.short : `${src.short}, p. ${c.page}`}
      <ExternalLink className="h-3 w-3" aria-hidden />
      <span className="sr-only">{web ? "(opens the web page in a new tab)" : "(opens NASA PDF in a new tab)"}</span>
    </a>
  );
}

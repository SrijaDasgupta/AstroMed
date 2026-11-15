import Link from "next/link";
import { ExternalLink, EyeOff, Globe2 } from "lucide-react";
import { HIDDEN_RISKS } from "@/lib/hidden-risks";
import { pageHref, pageLabel, SOURCES } from "@/lib/tips";
import { HAZARDS, type Hazard } from "@/lib/space-conditions";
import { HAZARD_PAGES, HRP_HAZARDS_URL, HRP_RESEARCH_URL, HRP_RISKS_URL, PARTNER_RESOURCES, RISK_GROUPS, SPACE_RISKS } from "@/lib/space-risks";
import { requireViewer } from "@/lib/session";

function Ext({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 hover:text-sky-200 ${className}`}>
      {children}<ExternalLink className="h-3 w-3 shrink-0" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export default async function RisksPage() {
  await requireViewer();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
        <h1 className="mt-1 text-2xl font-semibold">NASA&apos;s spaceflight hazards and risks</h1>
        <p className="mt-1 max-w-3xl text-slate-400">
          NASA&apos;s Human Research Program groups what spaceflight does to people into 5 hazards and {SPACE_RISKS.length} risks. Each one links to NASA&apos;s page and to where AstroMed helps you keep track of it.
        </p>
      </div>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">The 5 hazards</h2>
          <Ext href={HRP_HAZARDS_URL} className="text-sm text-sky-300">NASA: 5 Hazards of Human Spaceflight</Ext>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {(Object.keys(HAZARDS) as Hazard[]).map((h) => (
            <li key={h} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <Ext href={HAZARD_PAGES[h]} className="font-medium text-white">{HAZARDS[h].name}</Ext>
              <p className="mt-1 text-sm text-slate-400">{HAZARDS[h].blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">The {SPACE_RISKS.length} risks</h2>
          <Ext href={HRP_RISKS_URL} className="text-sm text-sky-300">NASA: Risks of Human Spaceflight</Ext>
        </div>
        {RISK_GROUPS.map((g) => (
          <div key={g.id}>
            <h3 className="text-sm font-medium text-slate-300">{g.name}</h3>
            <ul className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {SPACE_RISKS.filter((r) => r.group === g.id).map((r) => (
                <li key={r.id} id={r.id} className="scroll-mt-20 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <Ext href={r.url} className="font-medium text-white">{r.name}</Ext>
                  <p className="mt-1 text-sm text-slate-400">{r.summary}</p>
                  <p className="mt-3 text-xs text-slate-500">In AstroMed</p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {r.inApp.map((l) => (
                      <li key={l.href + l.text}><Link href={l.href} className="inline-block rounded-full bg-white/5 px-2.5 py-1 text-xs text-sky-300 hover:bg-white/10 hover:text-sky-200">{l.text}</Link></li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="hidden">
        <h2 className="flex items-center gap-2 text-lg font-medium"><EyeOff className="h-5 w-5 text-slate-400" aria-hidden />Hidden risks: problems that can start without symptoms</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">These can develop silently, so flight surgeons look for them with tests. AstroMed can&apos;t do those tests, but it tracks the early signs you can notice and tells you when to ask.</p>
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {HIDDEN_RISKS.map((r) => (
            <li key={r.id} id={r.id} className="scroll-mt-20 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="font-medium text-white">{r.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{r.what}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">How it&apos;s detected</p>
              <p className="mt-1 text-sm text-slate-300">{r.detect}</p>
              <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">What you can do</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">{r.self.map((x) => <li key={x}>{x}</li>)}</ul>
              <ul className="mt-3 flex flex-wrap gap-2">
                {r.links.map((l) => (
                  <li key={l.href + l.text}><Link href={l.href} className="inline-block rounded-full bg-white/5 px-2.5 py-1 text-xs text-sky-300 hover:bg-white/10 hover:text-sky-200">{l.text}</Link></li>
                ))}
              </ul>
              <ul className="mt-3 space-y-1">
                {r.cites.map((c) => (
                  <li key={c.source}><Ext href={pageHref(SOURCES[c.source], c.page)} className="text-xs text-slate-400 underline decoration-white/20 underline-offset-2">{pageLabel(SOURCES[c.source], c.page)}</Ext></li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-medium"><Globe2 className="h-5 w-5 text-slate-400" aria-hidden />From partner space agencies</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {PARTNER_RESOURCES.map((p) => (
            <li key={p.url} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">{p.agency}</p>
              <Ext href={p.url} className="mt-0.5 font-medium text-white">{p.title}</Ext>
              <p className="mt-1 text-sm text-slate-400">{p.takeaway}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500">
        Summaries are AstroMed&apos;s own short wording; NASA&apos;s pages have the full detail. NASA is also running research on many of these risks: <Ext href={HRP_RESEARCH_URL} className="underline decoration-white/20 underline-offset-2">Ongoing HRP research</Ext>.
        NASA does not endorse AstroMed or non-U.S. Government websites.
      </p>
    </div>
  );
}

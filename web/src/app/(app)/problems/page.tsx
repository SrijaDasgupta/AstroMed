import { ShieldCheck } from "lucide-react";
import { CiteLink } from "@/components/CiteLink";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { ReportForm } from "@/components/problems/ReportForm";
import { loadProblems } from "@/lib/problems";
import { requireViewer } from "@/lib/session";
import { CATEGORIES, CONDITIONS, conditionCite, HAZARD_CITE, HAZARDS, type Category, type Hazard } from "@/lib/space-conditions";

export default async function ProblemsPage() {
  const viewer = await requireViewer();
  const { today, problem, views, photos, areas, kinds, canAttach } = await loadProblems(viewer);
  const open = views.filter((v) => !v.resolvedOn);
  const resolved = views.filter((v) => v.resolvedOn);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Problems &amp; advice</h1>
        <p className="mt-1 max-w-3xl text-slate-400">
          Report anything: an injury, a symptom, how you feel, a problem with the crew, or something in the cabin, suit or environment.
          Write it in your own words and add a photo. AstroMed matches it against NASA&apos;s list of spaceflight medical conditions, tells you how soon to involve your flight surgeon, and follows it as you add updates.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-lg font-medium">Report a problem</h2>
        <div className="mt-4"><ReportForm areas={areas} kinds={kinds} today={today} canAttach={canAttach} /></div>
      </section>

      {problem && <p role="alert" className="text-sm text-rose-300">Couldn&apos;t load your problems: {problem}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Ongoing ({open.length})</h2>
        {open.length === 0
          ? <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">Nothing ongoing. Report a problem above when something comes up, and add updates as it changes.</p>
          : <div className="space-y-4">{open.map((n) => <div key={n.id} id={`p-${n.id}`} className="scroll-mt-20"><ProblemCard n={n} photos={photos} canAttach={canAttach} /></div>)}</div>}
      </section>

      {resolved.length > 0 && (
        <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <summary className="cursor-pointer text-lg font-medium">Resolved ({resolved.length})</summary>
          <div className="mt-4 space-y-4">{resolved.map((n) => <ProblemCard key={n.id} n={n} photos={photos} canAttach={canAttach} />)}</div>
        </details>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-medium"><ShieldCheck className="h-5 w-5 text-sky-300" aria-hidden />What AstroMed covers</h2>
          <p className="mt-1 text-sm text-slate-400">
            Every condition NASA lists as high-likelihood or high-consequence for spaceflight missions, grouped under the five hazards of spaceflight. <CiteLink c={HAZARD_CITE} />
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(HAZARDS) as Hazard[]).map((h) => (
            <div key={h} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="font-medium">{HAZARDS[h].name}</p>
              <p className="mt-1 text-xs text-slate-400">{HAZARDS[h].blurb}</p>
              <p className="mt-2 text-xs text-sky-300">{CONDITIONS.filter((c) => c.hazards.includes(h)).length} conditions</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
            const list = CONDITIONS.filter((c) => c.category === cat);
            if (!list.length) return null;
            return (
              <details key={cat} className="rounded-2xl border border-white/10 bg-white/[0.02]">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium">{CATEGORIES[cat].name} <span className="text-slate-500">({list.length})</span></summary>
                <ul className="divide-y divide-white/5 border-t border-white/10">
                  {list.map((c) => (
                    <li key={c.id} className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-medium text-slate-100">{c.name}</p>
                        <p className="text-xs text-slate-500">
                          {c.perMission !== undefined && <>{c.perMission} expected per mission* · </>}
                          {c.hazards.map((h) => HAZARDS[h].name).join(", ")} · <CiteLink c={conditionCite(c)} />
                        </p>
                      </div>
                      <p className="mt-1 text-slate-300">{c.care[0]}</p>
                      {c.watch.length > 0 && <p className="mt-0.5 text-xs text-slate-400">Get help sooner if: {c.watch.join("; ").toLowerCase()}.</p>}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">* Expected cases per mission in NASA&apos;s sample Integrated Medical Model output (NASA-STD-3001 Vol. 1, pp. 82–83), not a prediction for you. AstroMed reads your words with keyword matching, not an AI model, so it errs on the side of flagging. Photos can be analyzed with your own AI if you connect one. Nothing here diagnoses or recommends medicines.</p>
      </section>
    </div>
  );
}

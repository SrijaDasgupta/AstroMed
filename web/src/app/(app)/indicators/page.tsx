import Link from "next/link";
import { CheckCircle2, CircleDashed, Ruler, ShieldCheck, Stethoscope, TriangleAlert } from "lucide-react";
import { CiteLink } from "@/components/CiteLink";
import { EscalationBadge } from "@/components/EscalationBadge";
import { contactText, DELAY_CITE, reachOf, supportLine } from "@/lib/contact";
import { INDICATORS } from "@/lib/indicators";
import { getMissionContext } from "@/lib/mission";
import { getMyHealth } from "@/lib/my-health";
import { requireViewer } from "@/lib/session";
import { HAZARD_CITE, HAZARDS } from "@/lib/space-conditions";

const STATUS = {
  good: { label: "Within your normal", color: "#0ca30c", Icon: CheckCircle2 },
  warning: { label: "Watch", color: "#fab219", Icon: TriangleAlert },
  critical: { label: "Outside your normal", color: "#d03b3b", Icon: TriangleAlert },
} as const;

export default async function IndicatorsPage() {
  const viewer = await requireViewer();
  const [{ assessment }, ctx] = await Promise.all([getMyHealth(viewer), getMissionContext()]);
  const env = ctx.env;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
        <h1 className="mt-1 text-2xl font-semibold">Health indicators guide</h1>
        <p className="mt-1 max-w-3xl text-slate-400">
          For each health indicator: how to measure it in space, why it matters, how the hazards of spaceflight affect it, when to involve your crew or flight surgeon, and how to prevent a serious problem. Every statement links to the NASA page it comes from.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 font-medium"><Stethoscope className="h-5 w-5 text-sky-300" aria-hidden />Who to contact on your mission ({ctx.mission?.name ?? env.name})</h2>
        <p className="mt-1 text-sm text-slate-300">{supportLine(env)}{reachOf(env) === "far" && <> <CiteLink c={DELAY_CITE} /></>}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {(["now", "today", "routine", "none"] as const).map((l) => (
            <div key={l} className="rounded-xl bg-white/[0.04] p-3">
              <dt><EscalationBadge level={l} /></dt>
              <dd className="mt-1.5 text-slate-200">{contactText(l, env).title}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-slate-500">The limits below are general clinical thresholds set for this demo, plus your own normal range; a real program&apos;s flight surgeons set their own.</p>
      </section>

      <nav aria-label="Indicators" className="flex flex-wrap gap-2">
        {INDICATORS.map((ind) => <a key={ind.id} href={`#${ind.id}`} className="rounded-full border border-white/15 px-3 py-1 text-sm text-slate-300 hover:bg-white/5">{ind.name}</a>)}
      </nav>

      <div className="space-y-5">
        {INDICATORS.map((ind) => {
          const latest = (ind.metrics ?? []).map((k) => assessment.metrics.find((m) => m.def.key === k)).filter(Boolean);
          return (
            <article key={ind.id} id={ind.id} className="scroll-mt-20 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{ind.name}</h2>
                  <p className="text-xs text-slate-500">{ind.unit} · {ind.measure.often}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {latest.length === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-400"><CircleDashed className="h-3.5 w-3.5" aria-hidden />Tracked in your logs</span>
                  ) : latest.map((m) => {
                    const st = STATUS[m!.status];
                    return (
                      <span key={m!.def.key} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-200">
                        <st.Icon className="h-3.5 w-3.5" style={{ color: st.color }} aria-hidden />
                        {m!.def.label}: <strong className="tabular-nums">{m!.latest.toFixed(m!.def.decimals)} {m!.def.unit}</strong>
                        <span className="sr-only">, {st.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <section>
                  <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-slate-500"><Ruler className="h-3.5 w-3.5" aria-hidden />How to measure it in space</h3>
                  <p className="mt-1.5 text-sm text-slate-200">{ind.measure.how}</p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-slate-300">{ind.measure.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                </section>
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500">Why the exam is needed</h3>
                  <ul className="mt-1.5 space-y-1 text-sm text-slate-300">{ind.why.map((f) => <li key={f.text}>{f.text} <CiteLink c={f.cite} /></li>)}</ul>
                </section>
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500">How spaceflight hazards affect it</h3>
                  <ul className="mt-1.5 space-y-1.5 text-sm text-slate-300">
                    {ind.hazards.map((h) => (
                      <li key={h.effect.text}><span className="mr-1.5 rounded-full bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-200">{HAZARDS[h.hazard].name}</span>{h.effect.text} <CiteLink c={h.effect.cite} /></li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-widest text-slate-500">When to get help</h3>
                  <ul className="mt-1.5 space-y-1.5 text-sm">
                    {ind.when.map((w) => (
                      <li key={w.rule} className="flex flex-wrap items-start gap-2">
                        <EscalationBadge level={w.level} />
                        <span className="min-w-0 flex-1 text-slate-300">{w.rule}{w.level !== "none" && <span className="block text-xs text-slate-500">{contactText(w.level, env).title}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="lg:col-span-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-slate-500"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />How to prevent a serious problem</h3>
                  <ul className="mt-1.5 space-y-1 text-sm text-slate-300">{ind.prevent.map((f) => <li key={f.text}>{f.text} <CiteLink c={f.cite} /></li>)}</ul>
                </section>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {ind.links.map((l) => <Link key={l.href} href={l.href} className="text-sm text-sky-300 hover:text-sky-200">{l.text} →</Link>)}
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">The five hazards of spaceflight follow NASA&apos;s Human Research Program <CiteLink c={HAZARD_CITE} />. AstroMed supports self-monitoring; it doesn&apos;t diagnose or recommend medicines.</p>
    </div>
  );
}

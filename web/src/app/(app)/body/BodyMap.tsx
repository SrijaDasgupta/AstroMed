"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, ExternalLink, OctagonAlert } from "lucide-react";
import { TipCard } from "@/components/TipCard";
import type { Cite, Fact } from "@/lib/body";
import { SOURCES, TIPS } from "@/lib/tips";

export type PartStatus = "good" | "warning" | "critical" | "none";
export type PartView = {
  id: string;
  name: string;
  x: number;
  y: number;
  summary: string;
  effects: Fact[];
  conditions: { name: string; perMission?: number; note?: Fact }[];
  actions: { text: string; href?: string }[];
  tipIds: string[];
  readings: { label: string; value: string; detail?: string; status?: PartStatus }[];
  status: PartStatus;
};

const STATUS: Record<PartStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  good: { label: "Normal", color: "#0ca30c", Icon: CheckCircle2 },
  warning: { label: "Watch", color: "#fab219", Icon: AlertTriangle },
  critical: { label: "Check now", color: "#d03b3b", Icon: OctagonAlert },
  none: { label: "Not measured", color: "#64748b", Icon: CircleDashed },
};

function Status({ s }: { s: PartStatus }) {
  const { label, color, Icon } = STATUS[s];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-slate-300">
      <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden />
      {label}
    </span>
  );
}

function CiteLink({ c }: { c: Cite }) {
  const src = SOURCES[c.source];
  return (
    <a href={`${src.url}#page=${c.page}`} target="_blank" rel="noopener noreferrer" title={src.title} className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
      {src.short}, p. {c.page}
      <ExternalLink className="h-3 w-3" aria-hidden />
      <span className="sr-only">(opens NASA PDF in a new tab)</span>
    </a>
  );
}

function Figure({ parts, selected, onSelect }: { parts: PartView[]; selected: string; onSelect: (id: string) => void }) {
  const body = "#1e293b";
  const edge = "#334155";
  return (
    <svg viewBox="0 0 240 520" className="mx-auto h-auto w-full max-w-[260px]" role="group" aria-label="Body map. Choose a body part.">
      <g fill={body} stroke={edge} strokeWidth={1.5}>
        <ellipse cx="120" cy="52" rx="32" ry="38" />
        <rect x="106" y="86" width="28" height="22" rx="8" />
        <path d="M70 112 Q120 98 170 112 L176 238 Q160 250 150 300 L90 300 Q80 250 64 238 Z" />
        <path d="M70 114 Q52 120 48 150 L38 250 Q36 266 48 268 Q58 268 60 252 L74 160 Z" />
        <path d="M170 114 Q188 120 192 150 L202 250 Q204 266 192 268 Q182 268 180 252 L166 160 Z" />
        <path d="M90 296 L118 296 L114 420 L110 490 Q108 504 94 504 Q84 502 86 488 L86 420 Z" />
        <path d="M122 296 L150 296 L154 420 L154 488 Q156 502 146 504 Q132 504 130 490 L126 420 Z" />
      </g>
      {parts.map((p) => {
        const active = p.id === selected;
        return (
          <g
            key={p.id}
            role="button"
            tabIndex={0}
            aria-label={`${p.name}: ${STATUS[p.status].label}`}
            aria-pressed={active}
            onClick={() => onSelect(p.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p.id); } }}
            className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-sky-300"
          >
            <title>{p.name}</title>
            <circle cx={p.x} cy={p.y} r={18} fill="transparent" stroke={active ? "#7dd3fc" : "transparent"} strokeWidth={2} />
            <circle cx={p.x} cy={p.y} r={active ? 9 : 7} fill={STATUS[p.status].color} stroke="#070b16" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
}

export function BodyMap({ parts, systems, initial }: { parts: PartView[]; systems: PartView[]; initial?: string }) {
  const all = [...parts, ...systems];
  const [selected, setSelected] = useState(all.some((p) => p.id === initial) ? initial! : "heart");
  const part = all.find((p) => p.id === selected)!;

  function select(id: string) {
    setSelected(id);
    window.history.replaceState(null, "", `/body?part=${id}`);
    if (window.matchMedia("(max-width: 1023px)").matches) document.getElementById("part-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const tips = part.tipIds.map((id) => TIPS.find((t) => t.id === id)).filter(Boolean);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Figure parts={parts} selected={selected} onSelect={select} />
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {(Object.keys(STATUS) as PartStatus[]).map((s) => <Status key={s} s={s} />)}
        </div>
        <nav aria-label="Body parts" className="space-y-1">
          {[...parts, ...systems].map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p.id)}
              aria-current={p.id === selected ? "true" : undefined}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm ${i === parts.length ? "mt-3" : ""} ${p.id === selected ? "bg-sky-400/15 text-sky-100" : "text-slate-300 hover:bg-white/5"}`}
            >
              {p.name}
              <Status s={p.status} />
            </button>
          ))}
        </nav>
      </div>

      <section id="part-panel" className="scroll-mt-6 space-y-5" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{part.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{part.summary}</p>
          </div>
          <Status s={part.status} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm font-medium">Your data</h3>
          {part.readings.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">AstroMed doesn&apos;t track anything for this part yet.</p>
          ) : (
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {part.readings.map((r) => (
                <div key={r.label} className="rounded-xl bg-white/[0.03] p-3">
                  <dt className="flex items-center justify-between gap-2 text-xs text-slate-500">{r.label}{r.status && <Status s={r.status} />}</dt>
                  <dd className="mt-1 tabular-nums text-slate-100">{r.value}</dd>
                  {r.detail && <dd className="mt-0.5 text-xs text-slate-500">{r.detail}</dd>}
                </div>
              ))}
            </dl>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium">What spaceflight does</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {part.effects.map((f, i) => <li key={i}>{f.text} <CiteLink c={f.cite} /></li>)}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium">Possible conditions</h3>
          <ul className="mt-2 divide-y divide-white/5 rounded-2xl border border-white/10 text-sm">
            {part.conditions.map((c) => (
              <li key={c.name} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-2">
                <span className="text-slate-200">{c.name}</span>
                {c.perMission !== undefined ? (
                  <span className="text-xs tabular-nums text-slate-400">{c.perMission} expected per mission*</span>
                ) : c.note ? (
                  <span className="text-xs text-slate-400">{c.note.text} <CiteLink c={c.note.cite} /></span>
                ) : null}
              </li>
            ))}
          </ul>
          {part.conditions.some((c) => c.perMission !== undefined) && (
            <p className="mt-2 text-xs text-slate-500">* From NASA&apos;s sample medical-risk model output: expected cases per mission, not a prediction for you. <CiteLink c={{ source: "std1", page: 82 }} /></p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium">What you can do</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {part.actions.map((a) => (
              <li key={a.text}>{a.href ? <Link href={a.href} className="text-sky-300 hover:text-sky-200">{a.text} →</Link> : <span className="text-slate-300">{a.text}</span>}</li>
            ))}
          </ul>
        </div>

        {tips.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Related tips</h3>
            <div className="grid gap-3 md:grid-cols-2">{tips.map((t) => <TipCard key={t!.id} tip={t!} compact />)}</div>
          </div>
        )}
      </section>
    </div>
  );
}

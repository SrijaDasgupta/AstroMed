"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDashed, ExternalLink, FileText, OctagonAlert, Plus } from "lucide-react";
import { TipCard } from "@/components/TipCard";
import type { Cite, Fact } from "@/lib/body";
import type { Escalation } from "@/lib/checkups";
import { Level, ProblemCard, type ProblemView } from "@/components/problems/ProblemCard";
import { currentSeverity } from "@/lib/body-notes";
import { ReportForm, type AreaOption } from "@/components/problems/ReportForm";
import { pageHref, pageLabel, SOURCES, TIPS } from "@/lib/tips";
import { AnatomyDefs, AnatomyFigure, Floor } from "./Anatomy";

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
export type NoteView = ProblemView;
export type VitalCard = { key: string; label: string; value: string; unit: string; status: PartStatus; values: number[]; range: [number, number]; mine: boolean };
export type RecordItem = { id: string; title: string; detail: string };
export type Bmi = { value: number; weightKg: number; heightCm: number } | null;
export type Option = { id: string; name: string };

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

function StatusIcon({ s }: { s: PartStatus }) {
  const { label, color, Icon } = STATUS[s];
  return <Icon className="h-4 w-4 shrink-0" style={{ color }} aria-label={label} />;
}

function CiteLink({ c }: { c: Cite }) {
  const src = SOURCES[c.source];
  return (
    <a href={pageHref(src, c.page)} target="_blank" rel="noopener noreferrer" title={src.title} className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
      {pageLabel(src, c.page)}
      <ExternalLink className="h-3 w-3" aria-hidden />
      <span className="sr-only">(opens the source in a new tab)</span>
    </a>
  );
}

function Sparkline({ values, range, color }: { values: number[]; range: [number, number]; color: string }) {
  const w = 120, h = 34;
  const lo = Math.min(range[0], ...values), hi = Math.max(range[1], ...values);
  const sx = (i: number) => (i / Math.max(values.length - 1, 1)) * w;
  const sy = (v: number) => h - 3 - ((v - lo) / (hi - lo || 1)) * (h - 6);
  const d = values.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-9 w-full" aria-hidden preserveAspectRatio="none">
      <rect x={0} y={sy(range[1])} width={w} height={Math.max(sy(range[0]) - sy(range[1]), 1)} fill="#ffffff" fillOpacity={0.05} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={sx(values.length - 1)} cy={sy(values[values.length - 1])} r={2.5} fill={color} />
    </svg>
  );
}

const TINTS = ["bg-amber-300/10 border-amber-300/20", "bg-sky-400/10 border-sky-400/20", "bg-violet-400/10 border-violet-400/20", "bg-emerald-400/10 border-emerald-400/20"];
const LINE = ["#fbbf24", "#38bdf8", "#a78bfa", "#34d399"];

function Figure({ parts, notes, selected, onSelect, focusNote }: { parts: PartView[]; notes: NoteView[]; selected: string; onSelect: (id: string, note?: string) => void; focusNote?: string }) {
  const sel = parts.find((p) => p.id === selected);
  const focus = notes.find((n) => n.id === focusNote && n.pin);
  const anchor = focus?.pin ?? (sel ? { x: sel.x, y: sel.y } : undefined);
  return (
    <svg viewBox="-10 0 320 650" className="mx-auto h-auto w-full max-w-[360px]" role="group" aria-label="Body map. Choose a body part.">
      <AnatomyDefs />
      <Floor />
      <AnatomyFigure />
      {anchor && (
        <g aria-hidden className="hidden lg:inline">
          <path key={`${anchor.x}-${anchor.y}`} className="am-draw" d={`M${anchor.x},${anchor.y} C${anchor.x + 70},${anchor.y} 250,24 310,24`} fill="none" stroke="#f43f5e" strokeWidth={1.4} />
          <circle cx={310} cy={24} r={3.5} fill="#f43f5e" />
        </g>
      )}
      {parts.map((p) => {
        const active = p.id === selected && !focus;
        return (
          <g
            key={p.id}
            role="button"
            tabIndex={0}
            aria-label={`${p.name}: ${STATUS[p.status].label}`}
            aria-pressed={p.id === selected}
            onClick={() => onSelect(p.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(p.id); } }}
            className="cursor-pointer outline-none [&:focus-visible>circle:first-of-type]:stroke-sky-300"
          >
            <title>{p.name}</title>
            <circle cx={p.x} cy={p.y} r={14} fill="#ffffff" fillOpacity={active ? 0.25 : 0.12} stroke={active ? "#e0f2fe" : "transparent"} strokeWidth={1.5} />
            {active && <circle cx={p.x} cy={p.y} r={10} fill="none" stroke="#e0f2fe" strokeWidth={1.5} className="am-pulse" aria-hidden />}
            <circle cx={p.x} cy={p.y} r={active ? 6.5 : 5.5} fill={STATUS[p.status].color === "#64748b" ? "#f8fafc" : STATUS[p.status].color} stroke="#ffffff" strokeWidth={2} />
          </g>
        );
      })}
      {notes.filter((n) => n.pin && !n.resolvedOn).map((n) => (
        <g key={n.id} role="button" tabIndex={0} aria-label={`Your note: ${n.title}`}
          onClick={() => onSelect(n.part, n.id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(n.part, n.id); } }}
          className="cursor-pointer outline-none">
          <title>{n.title}</title>
          <circle cx={n.pin!.x} cy={n.pin!.y} r={10} fill="#f43f5e" fillOpacity={0.25} className="motion-safe:animate-pulse" />
          <circle cx={n.pin!.x} cy={n.pin!.y} r={n.id === focusNote ? 6 : 4.5} fill="#f43f5e" stroke="#fff" strokeWidth={1.5} />
        </g>
      ))}
    </svg>
  );
}

function BmiStrip({ bmi }: { bmi: Bmi }) {
  if (!bmi) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
        <p className="font-medium text-slate-200">Body mass index</p>
        <p className="mt-1">Add your height and weight in <Link href="/profile" className="text-sky-300 hover:text-sky-200">My profile</Link> to see it here.</p>
      </div>
    );
  }
  const w = Math.round(bmi.weightKg);
  const ticks = Array.from({ length: 9 }, (_, i) => w - 4 + i);
  const band = bmi.value < 18.5 ? "below the usual range" : bmi.value < 25 ? "in the usual range" : bmi.value < 30 ? "above the usual range" : "well above the usual range";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-slate-200">Body mass index</p>
        <p className="text-sm tabular-nums text-slate-300"><span className="text-lg font-semibold text-white">{bmi.value.toFixed(1)}</span> · {band}</p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-1 tabular-nums" aria-label={`Weight ${w} kilograms`}>
        {ticks.map((t) => (
          <span key={t} className={`flex flex-col items-center ${t === w ? "text-base font-semibold text-white" : "text-xs text-slate-500"}`}>
            {t === w && <span className="text-[10px] font-normal text-slate-400">kg</span>}
            {t}
            <span className={`mt-1 block w-px ${t === w ? "h-3 bg-sky-300" : "h-1.5 bg-white/20"}`} />
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">{bmi.heightCm} cm · from My profile. BMI is a rough guide and doesn&apos;t tell muscle from fat.</p>
    </div>
  );
}

export function BodyMap({ parts, systems, notes, photos, vitals, records, bmi, areas, kinds, today, initial, canUpload, emergency }: {
  parts: PartView[]; systems: PartView[]; notes: NoteView[]; photos: Record<string, string>; vitals: VitalCard[]; records: RecordItem[]; bmi: Bmi;
  areas: (AreaOption & { part: string })[]; kinds: Option[]; today: string; initial?: string; canUpload: boolean; emergency: { title: string; body: string };
}) {
  const all = [...parts, ...systems];
  const firstNote = notes.find((n) => !n.resolvedOn);
  const [selected, setSelected] = useState(all.some((p) => p.id === initial) ? initial! : firstNote?.part ?? "heart");
  const [focusNote, setFocusNote] = useState<string | undefined>(initial ? undefined : firstNote?.id);
  const part = all.find((p) => p.id === selected)!;
  const active = notes.filter((n) => !n.resolvedOn);
  const partNotes = active.filter((n) => n.part === selected);
  const tips = part.tipIds.map((id) => TIPS.find((t) => t.id === id)).filter(Boolean);
  const worst = active.reduce<Escalation>((w, n) => (["none", "routine", "today", "now"].indexOf(n.advice.level) > ["none", "routine", "today", "now"].indexOf(w) ? n.advice.level : w), "none");

  function select(id: string, note?: string) {
    setSelected(id);
    setFocusNote(note);
    window.history.replaceState(null, "", `/body?part=${id}`);
    if (window.matchMedia("(max-width: 1023px)").matches) document.getElementById("part-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)_340px]">
        {/* Left: vitals, notes, records */}
        <div className="order-2 space-y-4 lg:order-1">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
            {vitals.map((v, i) => (
              <Link key={v.key} href="/vitals" className={`rounded-2xl border p-3 transition hover:brightness-125 ${TINTS[i % TINTS.length]}`}>
                <p className="flex items-start justify-between gap-1 text-xs leading-tight text-slate-300">{v.label}<StatusIcon s={v.status} /></p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{v.value} <span className="text-xs font-normal text-slate-400">{v.unit}</span></p>
                <Sparkline values={v.values} range={v.range} color={LINE[i % LINE.length]} />
                <p className="text-[10px] text-slate-500">{v.mine ? "Your reading" : "Sample data"} · 14 days</p>
              </Link>
            ))}
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">My body notes</h2>
              <a href="#add-note" className="inline-flex items-center gap-1 rounded-full bg-sky-400 px-2 py-0.5 text-xs font-medium text-slate-950 hover:bg-sky-300"><Plus className="h-3 w-3" aria-hidden />Add</a>
            </div>
            {active.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">Nothing recorded. Add pain, an injury or anything else you notice, and AstroMed will suggest what to do.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {active.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => select(n.part, n.id)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${focusNote === n.id ? "bg-white/10" : "hover:bg-white/5"}`}>
                      <span className="min-w-0"><span className="block truncate text-slate-200">{n.title}</span><span className="text-slate-500">{currentSeverity(n)}/10</span></span>
                      <Level l={n.advice.level} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Records</h2>
              <Link href="/records" className="inline-flex items-center gap-0.5 text-xs text-slate-400 hover:text-white">View all <ArrowUpRight className="h-3 w-3" aria-hidden /></Link>
            </div>
            {records.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">{canUpload ? "Upload lab reports, scans and prescriptions in My records." : "Records need an account."}</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {records.map((r) => (
                  <li key={r.id}>
                    <a href={`/records/${r.id}/open`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      <span className="min-w-0"><span className="block truncate text-slate-200">{r.title}</span><span className="text-slate-500">{r.detail}</span></span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Centre: the figure */}
        <div className="order-1 space-y-4 lg:order-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.10),transparent_60%)] px-2 pt-4">
            <Figure parts={parts} notes={notes} selected={selected} onSelect={select} focusNote={focusNote} />
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 pb-3 text-xs text-slate-400">
              {(["good", "warning", "critical"] as PartStatus[]).map((s) => <Status key={s} s={s} />)}
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-50" aria-hidden />Not measured</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden />Your note</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {systems.map((s) => (
              <button key={s.id} type="button" onClick={() => select(s.id)} aria-pressed={selected === s.id}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${selected === s.id ? "border-sky-400 bg-sky-400/15 text-sky-100" : "border-white/15 text-slate-300 hover:bg-white/5"}`}>
                {s.name}<Status s={s.status} />
              </button>
            ))}
          </div>
          <BmiStrip bmi={bmi} />
        </div>

        {/* Right: selected part, advice, overview */}
        <section key={selected} id="part-panel" className="am-fade order-3 scroll-mt-20 space-y-4" aria-live="polite">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{part.name}</h2>
              <Status s={part.status} />
            </div>
            <p className="mt-1 text-sm text-slate-400">{part.summary}</p>
            {part.readings.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-2">
                {part.readings.map((r) => (
                  <div key={r.label} className="rounded-xl bg-white/[0.04] p-2.5">
                    <dt className="text-[11px] text-slate-500">{r.label}</dt>
                    <dd className="mt-0.5 text-sm tabular-nums text-slate-100">{r.value}</dd>
                    {r.status && <dd className="mt-0.5"><Status s={r.status} /></dd>}
                  </div>
                ))}
              </dl>
            )}
            {part.conditions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {part.conditions.slice(0, 4).map((c) => <span key={c.name} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-300">{c.name}</span>)}
              </div>
            )}
            <a href="#learn" className="mt-3 inline-block text-sm text-sky-300 hover:text-sky-200">What spaceflight does to it ↓</a>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Advice for you</h3>
            {partNotes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 p-4 text-sm text-slate-400">
                No notes for {part.name.toLowerCase()}. Something bothering you here? <a href="#add-note" className="text-sky-300 hover:text-sky-200">Add a body note</a> to get advice.
              </p>
            ) : partNotes.map((n) => <ProblemCard key={n.id} n={n} photos={photos} canAttach={canUpload} compact />)}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-widest text-sky-300">Your body at a glance</p>
            <p className="mt-2 text-sm text-slate-200">
              {active.length === 0 ? "No open body notes." : `${active.length} open body note${active.length === 1 ? "" : "s"}.`}
              {active.length > 0 && <> Most urgent: <Level l={worst} /></>}
            </p>
            <Link href="/summary" className="mt-3 inline-flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200">See it in My summary <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </section>
      </div>

      <section id="add-note" className="scroll-mt-20 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-lg font-medium">Report a problem</h2>
        <p className="mt-1 text-sm text-slate-400">Describe anything you notice in your own words, add a photo if it helps, and get advice. Follow it over time in <Link href="/problems" className="text-sky-300 hover:text-sky-200">Problems &amp; advice</Link>.</p>
        <div className="mt-4">
          <ReportForm key={selected} areas={areas} kinds={kinds} today={today} canAttach={canUpload} emergency={emergency} defaultArea={areas.find((a) => a.part === selected)?.id ?? ""} />
        </div>
      </section>


      <section id="learn" className="scroll-mt-20 space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-lg font-medium">{part.name}: what spaceflight does</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          {part.effects.map((f, i) => <li key={i}>{f.text} <CiteLink c={f.cite} /></li>)}
        </ul>
        {part.conditions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium">Possible conditions</h3>
            <ul className="mt-2 divide-y divide-white/5 rounded-2xl border border-white/10 text-sm">
              {part.conditions.map((c) => (
                <li key={c.name} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-2">
                  <span className="text-slate-200">{c.name}</span>
                  {c.perMission !== undefined ? <span className="text-xs tabular-nums text-slate-400">{c.perMission} expected per mission*</span>
                    : c.note ? <span className="text-xs text-slate-400">{c.note.text} <CiteLink c={c.note.cite} /></span> : null}
                </li>
              ))}
            </ul>
            {part.conditions.some((c) => c.perMission !== undefined) && (
              <p className="mt-2 text-xs text-slate-500">* From NASA&apos;s sample medical-risk model output: expected cases per mission, not a prediction for you. <CiteLink c={{ source: "std1", page: 82 }} /></p>
            )}
          </div>
        )}
        <div>
          <h3 className="text-sm font-medium">What you can do</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {part.actions.map((a) => <li key={a.text}>{a.href ? <Link href={a.href} className="text-sky-300 hover:text-sky-200">{a.text} →</Link> : <span className="text-slate-300">{a.text}</span>}</li>)}
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

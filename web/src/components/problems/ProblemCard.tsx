"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Camera, CheckCircle2, Siren, Sparkles, Stethoscope } from "lucide-react";
import { addProblemUpdateAction, bodyNoteItemAction, type UpdateState } from "@/app/actions";
import { CiteLink } from "@/components/CiteLink";
import { AnalysisPanel, AnalyzeButton } from "@/components/problems/PhotoAnalysis";
import { problemText, type Advice, type BodyNote, type Trend } from "@/lib/body-notes";
import type { Escalation } from "@/lib/checkups";

export type ProblemView = BodyNote & { title: string; part: string; pin?: { x: number; y: number }; advice: Advice };

export const LEVEL: Record<Escalation, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  none: { label: "Self-care", color: "#0ca30c", Icon: CheckCircle2 },
  routine: { label: "Next check-in", color: "#fab219", Icon: Stethoscope },
  today: { label: "Today", color: "#ec835a", Icon: AlertTriangle },
  now: { label: "Now", color: "#d03b3b", Icon: Siren },
};

export function Level({ l }: { l: Escalation }) {
  const { label, color, Icon } = LEVEL[l];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-200">
      <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden />
      {label}
    </span>
  );
}

const TREND: Record<Trend, { label: string; Icon: typeof ArrowRight; cls: string }> = {
  new: { label: "New", Icon: ArrowRight, cls: "text-slate-300" },
  better: { label: "Improving", Icon: ArrowDownRight, cls: "text-emerald-300" },
  worse: { label: "Getting worse", Icon: ArrowUpRight, cls: "text-rose-300" },
  same: { label: "No change", Icon: ArrowRight, cls: "text-amber-200" },
};

/** Shows a time in the viewer's own time zone (formatted in the browser, after the date-only server render). */
function When({ iso }: { iso: string }) {
  const [label, setLabel] = useState(iso.slice(0, 10));
  useEffect(() => setLabel(new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })), [iso]);
  return <time dateTime={iso}>{label}</time>;
}

function SeverityChart({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 140, h = 40;
  const sx = (i: number) => 4 + (i / (points.length - 1)) * (w - 8);
  const sy = (v: number) => h - 4 - (v / 10) * (h - 8);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-36" role="img" aria-label={`Severity over time: ${points.join(", ")} out of 10`}>
      <line x1={0} x2={w} y1={sy(5)} y2={sy(5)} stroke="#ffffff" strokeOpacity={0.08} />
      <path d={points.map((v, i) => `${i ? "L" : "M"}${sx(i)},${sy(v)}`).join("")} fill="none" stroke="#38bdf8" strokeWidth={1.8} strokeLinejoin="round" />
      {points.map((v, i) => <circle key={i} cx={sx(i)} cy={sy(v)} r={2.5} fill={i === points.length - 1 ? "#f8fafc" : "#38bdf8"} />)}
    </svg>
  );
}

function Photo({ url, alt }: { url?: string; alt: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 hover:ring-sky-300">
      {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs from private storage */}
      <img src={url} alt={alt} className="h-20 w-20 object-cover" />
    </a>
  );
}

function UpdateForm({ id, last, canAttach, onDone }: { id: string; last: number; canAttach: boolean; onDone: () => void }) {
  const [state, action, pending] = useActionState<UpdateState, FormData>(addProblemUpdateAction, {});
  const [severity, setSeverity] = useState(last);
  const [photoName, setPhotoName] = useState("");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setPhotoName(""); onDone(); } }, [state, onDone]);
  const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";
  return (
    <form ref={ref} action={action} className="mt-3 space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <input type="hidden" name="id" value={id} />
      <label className="block"><span className="text-xs text-slate-400">How bad is it now? <strong className="tabular-nums text-white">{severity}</strong>/10 {severity > last ? "(worse)" : severity < last ? "(better)" : "(same)"}</span>
        <input name="severity" type="range" min={0} max={10} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="mt-2 w-full accent-sky-400" />
      </label>
      <textarea name="body" rows={2} maxLength={3000} placeholder="What's changed? New symptoms, what helped, what made it worse." className={field} />
      <div className="flex flex-wrap items-center gap-3">
        <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-slate-300 ${canAttach ? "hover:bg-white/5" : "cursor-not-allowed opacity-50"}`}>
          <Camera className="h-3.5 w-3.5" aria-hidden />{photoName || (canAttach ? "Add photo" : "Photos need an account")}
          <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" disabled={!canAttach} className="sr-only" onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? "")} />
        </label>
        <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60">{pending ? "Saving…" : "Save update"}</button>
        {state.error && <p role="alert" className="text-xs text-rose-300">{state.error}</p>}
      </div>
    </form>
  );
}

function Op({ id, op, children, danger = false }: { id: string; op: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <form action={bodyNoteItemAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" className={`rounded-lg border border-white/15 px-2.5 py-1 text-xs ${danger ? "text-slate-400 hover:border-rose-400/50 hover:text-rose-300" : "text-slate-300 hover:bg-white/5"}`}>{children}</button>
    </form>
  );
}

export function ProblemCard({ n, photos, canAttach, compact = false }: { n: ProblemView; photos: Record<string, string>; canAttach: boolean; compact?: boolean }) {
  const a = n.advice;
  const [updating, setUpdating] = useState(false);
  const urgent = a.level === "now" || a.level === "today";
  const series = [n.severity, ...(n.updates ?? []).map((u) => u.severity)];
  const T = TREND[a.trend];
  const open = !n.resolvedOn;

  return (
    <article className={`rounded-2xl border p-4 ${a.level === "now" ? "border-rose-500/50 bg-rose-500/10" : urgent ? "border-orange-400/40 bg-orange-400/5" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium">{n.title}</h3>
          <p className="text-xs text-slate-500">Since {n.startedOn} · now {series.at(-1)}/10 · {series.length - 1} update{series.length === 2 ? "" : "s"}{n.resolvedOn ? ` · resolved ${n.resolvedOn}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          {open && <span className={`inline-flex items-center gap-1 text-xs ${T.cls}`}><T.Icon className="h-3.5 w-3.5" aria-hidden />{T.label}</span>}
          <Level l={a.level} />
        </div>
      </div>

      <p className={`mt-3 text-sm font-medium ${a.level === "now" ? "text-rose-200" : urgent ? "text-orange-200" : "text-slate-100"}`}>{a.headline}</p>
      <ul className="mt-1 space-y-0.5 text-sm text-slate-300">{a.why.map((w) => <li key={w}>{w}</li>)}</ul>
      {a.level === "now" && <p className="mt-2 text-sm text-rose-200">Don&apos;t wait for AstroMed. If you&apos;re on Earth, call your local emergency number.{a.redFlags.includes("Thoughts of self-harm") ? " In the US you can call or text 988." : ""}</p>}

      <div className="mt-3 flex flex-wrap items-start gap-4">
        {(n.notes || n.photoPath) && (
          <div className="flex min-w-0 flex-1 gap-3">
            <Photo url={n.photoPath ? photos[n.photoPath] : undefined} alt={`Photo: ${n.title}`} />
            {n.notes && <p className="min-w-0 whitespace-pre-line rounded-lg bg-black/20 p-2 text-sm text-slate-300">{n.notes}</p>}
          </div>
        )}
        {!compact && <SeverityChart points={series} />}
      </div>
      {!compact && n.photoPath && photos[n.photoPath] && (n.photoAnalysis
        ? <AnalysisPanel a={n.photoAnalysis} />
        : open && <AnalyzeButton target="note" id={n.id} url={photos[n.photoPath]} context={`${n.title}, ${n.severity}/10. ${problemText(n)}`} />)}

      {a.related.length > 0 && (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-sky-300"><Sparkles className="h-3.5 w-3.5" aria-hidden />Related spaceflight conditions</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {a.related.map((r) => (
              <li key={r.id} className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-200">
                {r.name}{r.perMission !== undefined && <span className="text-slate-500">· {r.perMission} per mission*</span>}<CiteLink c={r.cite} />
              </li>
            ))}
          </ul>
          {a.hazards.length > 0 && <p className="mt-1.5 text-xs text-slate-500">Space hazard: {a.hazards.map((h) => h.name.toLowerCase()).join(", ")}</p>}
        </div>
      )}

      {!compact && a.selfCare.length > 0 && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Meanwhile</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-300">{a.selfCare.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
          {a.watch.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Get help sooner if</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-300">{a.watch.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      {compact && a.selfCare.length > 0 && <p className="mt-3 text-sm text-slate-300"><span className="text-slate-500">Meanwhile: </span>{a.selfCare[0]}</p>}

      {!compact && a.context && <p className="mt-3 text-xs text-slate-400">In space: {a.context.text} <CiteLink c={a.context.cite} /></p>}
      {a.question && <p className="mt-3 rounded-lg border border-white/10 p-2 text-xs text-slate-300"><Stethoscope className="mr-1 inline h-3.5 w-3.5 text-slate-400" aria-hidden />Ask your flight surgeon: {a.question}</p>}

      {!compact && (n.updates?.length ?? 0) > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Timeline</p>
          <ol className="mt-2 space-y-2 border-l border-white/10 pl-4">
            <li className="text-xs text-slate-400"><span className="text-slate-300"><When iso={n.createdAt} /></span> · reported at {n.severity}/10</li>
            {n.updates!.map((u, i) => {
              const earlier = [n.photoPath, ...n.updates!.slice(0, i).map((x) => x.photoPath)].filter((p): p is string => Boolean(p && photos[p])).at(-1);
              return (
              <li key={u.id} className="text-sm">
                <p className="text-xs text-slate-400"><span className="text-slate-300"><When iso={u.createdAt} /></span> · {u.severity}/10</p>
                <div className="mt-1 flex gap-3">
                  <Photo url={u.photoPath ? photos[u.photoPath] : undefined} alt={`Update photo from ${u.createdAt.slice(0, 10)}`} />
                  {u.body && <p className="whitespace-pre-line text-slate-300">{u.body}</p>}
                </div>
                {u.photoPath && photos[u.photoPath] && (u.photoAnalysis
                  ? <AnalysisPanel a={u.photoAnalysis} />
                  : open && <AnalyzeButton target="update" id={u.id} url={photos[u.photoPath]} earlierUrl={earlier ? photos[earlier] : undefined} context={`${n.title}, now ${u.severity}/10. ${problemText(n)}`} />)}
              </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {a.links.map((l) => <Link key={l.href} href={l.href} className="text-sm text-sky-300 hover:text-sky-200">{l.text} →</Link>)}
        <span className="ml-auto flex flex-wrap gap-2">
          {open && !compact && <button type="button" onClick={() => setUpdating((v) => !v)} aria-expanded={updating} className="rounded-lg bg-sky-500/90 px-2.5 py-1 text-xs font-medium text-slate-950 hover:bg-sky-400">{updating ? "Cancel" : "Add update"}</button>}
          {compact && open && <Link href={`/problems#p-${n.id}`} className="rounded-lg bg-sky-500/90 px-2.5 py-1 text-xs font-medium text-slate-950 hover:bg-sky-400">Update</Link>}
          {open ? <Op id={n.id} op="resolve">Mark resolved</Op> : <Op id={n.id} op="reopen">Reopen</Op>}
          <Op id={n.id} op="delete" danger>Delete</Op>
        </span>
      </div>
      {updating && <UpdateForm id={n.id} last={series.at(-1)!} canAttach={canAttach} onDone={() => setUpdating(false)} />}
    </article>
  );
}

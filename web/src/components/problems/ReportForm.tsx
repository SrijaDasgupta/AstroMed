"use client";

import { useActionState, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Siren, Sparkles } from "lucide-react";
import { PhotoPicker } from "./PhotoPicker";
import { addBodyNoteAction, type BodyNoteState } from "@/app/actions";
import { analyzeText, HAZARDS } from "@/lib/space-conditions";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";
const TONE = { none: "text-emerald-300", routine: "text-amber-200", today: "text-orange-200", now: "text-rose-200" } as const;

export type AreaOption = { id: string; name: string; sided: boolean };

export function ReportForm({ areas, kinds, today, defaultArea = "", canAttach, emergency }: {
  areas: AreaOption[]; kinds: { id: string; name: string }[]; today: string; defaultArea?: string; canAttach: boolean;
  emergency: { title: string; body: string };
}) {
  const [state, action, pending] = useActionState<BodyNoteState, FormData>(addBodyNoteAction, {});
  const ref = useRef<HTMLFormElement>(null);
  const [area, setArea] = useState(defaultArea);
  const [text, setText] = useState("");
  const [severity, setSeverity] = useState(3);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setText(""); setSeverity(3); } }, [state]);
  const deferred = useDeferredValue(text);
  const live = useMemo(() => analyzeText(deferred, area || undefined), [deferred, area]);
  const sided = areas.find((a) => a.id === area)?.sided ?? false;

  return (
    <form ref={ref} action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-200">What&apos;s happening? Describe it in your own words.</span>
        <textarea name="notes" rows={4} maxLength={3000} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="For example: “My fingernails are lifting after yesterday's spacewalk”, “Blurry vision when reading”, “Headache since the CO₂ alarm”, “Can't stop arguing with a crewmate”, “Rash on my arm after cleaning the filters”."
          className={`mt-1 ${field}`} />
      </label>

      {live.redFlags.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/60 bg-rose-500/15 p-3 text-sm text-rose-100">
          <Siren className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden />
          <div>
            <p className="font-medium">This sounds like it could be an emergency: {live.redFlags.map((f) => f.label.toLowerCase()).join(", ")}.</p>
            <p className="mt-0.5">{emergency.title}. {emergency.body} Don&apos;t wait to finish this form.{live.redFlags.some((f) => f.id === "self-harm") ? " If you're thinking about harming yourself, reach out now; on Earth in the US, call or text 988." : ""}</p>
          </div>
        </div>
      )}
      {live.matches.length > 0 && (
        <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-3 text-sm" aria-live="polite">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-sky-300"><Sparkles className="h-3.5 w-3.5" aria-hidden />AstroMed reads this as</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {live.matches.map((m) => <span key={m.condition.id} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-100">{m.condition.name}</span>)}
          </div>
          {live.hazards.length > 0 && <p className="mt-2 text-xs text-slate-400">Space hazard: {live.hazards.map((h) => HAZARDS[h].name.toLowerCase()).join(", ")}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block"><span className="text-sm text-slate-300">Where (optional)</span>
          <select name="area" value={area} onChange={(e) => setArea(e.target.value)} className={`mt-1 ${field} bg-slate-900`}>
            <option value="">Let AstroMed work it out</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Side</span>
          <select name="side" disabled={!sided} defaultValue="" className={`mt-1 ${field} bg-slate-900 disabled:opacity-40`}>
            <option value="">{sided ? "Choose" : "Not needed"}</option>
            <option value="right">Right</option>
            <option value="left">Left</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label className="block sm:col-span-2"><span className="text-sm text-slate-300">Type (optional)</span>
          <select name="kind" defaultValue="" className={`mt-1 ${field} bg-slate-900`}>
            <option value="">Let AstroMed work it out</option>
            {kinds.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2"><span className="text-sm text-slate-300">How bad, 0 to 10: <strong className="tabular-nums text-white">{severity}</strong></span>
          <input name="severity" type="range" min={0} max={10} step={1} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="mt-3 w-full accent-sky-400" />
          <span className="flex justify-between text-[11px] text-slate-500"><span>0 none</span><span>5 moderate</span><span>10 worst</span></span>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Started</span>
          <input name="startedOn" type="date" max={today} defaultValue={today} required className={`mt-1 ${field} [color-scheme:dark]`} />
        </label>
        <div className="block sm:col-span-2 lg:col-span-1"><span className="text-sm text-slate-300">Photo (optional)</span>
          <div className="mt-1"><PhotoPicker disabled={!canAttach} /></div>
        </div>
      </div>
      <p className="text-xs text-slate-500">Photos are stored privately so you can compare changes and show your flight surgeon. To have a photo analyzed, connect your own AI on the <a href="/ai" className="text-sky-300 hover:text-sky-200">AI connection</a> page, then press Analyze on the saved problem.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60">{pending ? "Saving…" : "Save and get advice"}</button>
        {state.error && <p role="alert" className="text-sm text-rose-300">{state.error}</p>}
        {state.ok && state.level && (
          <p role="status" className={`text-sm ${TONE[state.level]}`}>Saved “{state.title?.toLowerCase()}”. {state.headline}. Your advice is in the list.</p>
        )}
      </div>
    </form>
  );
}

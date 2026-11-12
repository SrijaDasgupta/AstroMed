"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addBodyNoteAction, type BodyNoteState } from "@/app/actions";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";
const TONE = { none: "text-emerald-300", routine: "text-amber-200", today: "text-orange-200", now: "text-rose-200" } as const;

export function NoteForm({ areas, kinds, sideAreas, today, defaultArea }: {
  areas: { id: string; name: string }[]; kinds: { id: string; name: string }[]; sideAreas: string[]; today: string; defaultArea: string;
}) {
  const [state, action, pending] = useActionState<BodyNoteState, FormData>(addBodyNoteAction, {});
  const ref = useRef<HTMLFormElement>(null);
  const [area, setArea] = useState(defaultArea);
  const [severity, setSeverity] = useState(3);
  useEffect(() => { if (state.ok) { ref.current?.reset(); setSeverity(3); } }, [state]);
  const sided = sideAreas.includes(area);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block"><span className="text-sm text-slate-300">Where</span>
          <select name="area" required value={area} onChange={(e) => setArea(e.target.value)} className={`mt-1 ${field} bg-slate-900`}>
            <option value="" disabled>Choose a body area</option>
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
        <label className="block sm:col-span-2"><span className="text-sm text-slate-300">What you noticed</span>
          <select name="kind" required defaultValue="" className={`mt-1 ${field} bg-slate-900`}>
            <option value="" disabled>Choose</option>
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
        <label className="block sm:col-span-2 lg:col-span-4"><span className="text-sm text-slate-300">Details (optional)</span>
          <textarea name="notes" rows={2} maxLength={1000} placeholder="What it feels like, what makes it better or worse, how it happened" className={`mt-1 ${field}`} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60">{pending ? "Saving…" : "Save and get advice"}</button>
        {state.error && <p role="alert" className="text-sm text-rose-300">{state.error}</p>}
        {state.ok && state.level && (
          <p role="status" className={`text-sm ${TONE[state.level]}`}>Saved {state.title?.toLowerCase()}. {state.headline}. See the advice above.</p>
        )}
      </div>
    </form>
  );
}

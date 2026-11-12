"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addMissionAction, type FormState } from "@/app/actions";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";

export function MissionForm({ types }: { types: { id: string; name: string; dose: number }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addMissionAction, {});
  const ref = useRef<HTMLFormElement>(null);
  const [type, setType] = useState("");
  useEffect(() => { if (state.ok) { ref.current?.reset(); setType(""); } }, [state]);
  const preset = types.find((t) => t.id === type);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className="text-sm text-slate-300">Mission name</span><input name="name" required maxLength={80} placeholder="e.g. Expedition 74" className={`mt-1 ${field}`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Mission type</span>
          <select name="envType" required value={type} onChange={(e) => setType(e.target.value)} className={`mt-1 ${field} bg-slate-900`}>
            <option value="" disabled>Choose a mission type</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Location or vehicle (optional)</span><input name="location" maxLength={120} placeholder="e.g. ISS, Gateway, surface base, pressurized rover" className={`mt-1 ${field}`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Start date</span><input name="startDate" type="date" required className={`mt-1 ${field} [color-scheme:dark]`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Planned end date (optional)</span><input name="endDate" type="date" className={`mt-1 ${field} [color-scheme:dark]`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Radiation dose rate, mSv/day (optional)</span>
          <input name="doseRate" type="number" step={0.01} min={0} max={50} placeholder={preset ? `Default ${preset.dose}` : "Choose a type first"} className={`mt-1 ${field}`} />
          <span className="mt-1 block text-xs text-slate-500">Leave blank to use the NASA-based figure for this mission type.</span>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Crew size (optional)</span><input name="crewSize" type="number" min={1} max={50} className={`mt-1 ${field}`} /></label>
        <label className="block sm:col-span-2"><span className="text-sm text-slate-300">Objectives and notes (optional)</span><textarea name="objectives" maxLength={1000} rows={3} className={`mt-1 ${field}`} /></label>
      </div>
      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-400">Mission added and set as your current mission.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">{pending ? "Adding…" : "Add mission"}</button>
    </form>
  );
}

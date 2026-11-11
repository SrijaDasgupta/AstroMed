"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";

export type ProfileFormProps = {
  displayName: string;
  crewId: string;
  crew: { id: string; label: string }[];
  details: { birthYear?: number; sex?: string; heightCm?: number; weightKg?: number; bloodType?: string; allergies?: string; conditions?: string };
  baselineFields: { key: string; label: string; unit: string; min: number; max: number; step: number; entered?: number; inUse: string }[];
};

export function ProfileForm({ displayName, crewId, crew, details: d, baselineFields }: ProfileFormProps) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="space-y-6">
      <fieldset className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <legend className="px-1 text-sm font-medium">About you</legend>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="text-sm text-slate-300">Name</span><input name="displayName" defaultValue={displayName} required maxLength={40} className={`mt-1 ${field}`} /></label>
          <label className="block"><span className="text-sm text-slate-300">Birth year</span><input name="birthYear" type="number" min={1900} max={new Date().getFullYear()} defaultValue={d.birthYear ?? ""} className={`mt-1 ${field}`} /></label>
          <label className="block"><span className="text-sm text-slate-300">Sex</span>
            <select name="sex" defaultValue={d.sex ?? ""} className={`mt-1 ${field} bg-slate-900`}><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select>
          </label>
          <label className="block"><span className="text-sm text-slate-300">Height (cm)</span><input name="heightCm" type="number" step={0.5} min={50} max={250} defaultValue={d.heightCm ?? ""} className={`mt-1 ${field}`} /></label>
          <label className="block"><span className="text-sm text-slate-300">Weight (kg)</span><input name="weightKg" type="number" step={0.1} min={20} max={300} defaultValue={d.weightKg ?? ""} className={`mt-1 ${field}`} /></label>
          <label className="block"><span className="text-sm text-slate-300">Blood type</span>
            <select name="bloodType" defaultValue={d.bloodType ?? ""} className={`mt-1 ${field} bg-slate-900`}><option value="">Not set</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b}>{b}</option>)}</select>
          </label>
          <label className="block sm:col-span-2"><span className="text-sm text-slate-300">Allergies</span><input name="allergies" maxLength={300} defaultValue={d.allergies ?? ""} placeholder="e.g. penicillin" className={`mt-1 ${field}`} /></label>
          <label className="block sm:col-span-2"><span className="text-sm text-slate-300">Medical conditions</span><input name="conditions" maxLength={300} defaultValue={d.conditions ?? ""} className={`mt-1 ${field}`} /></label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <legend className="px-1 text-sm font-medium">My usual values</legend>
        <p className="mt-1 text-sm text-slate-400">Your normal ranges are built around these. Leave a value blank to use your own readings once you have 7 days of them, or the sample recording until then.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {baselineFields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm text-slate-300">{f.label} ({f.unit})</span>
              <input name={`baseline_${f.key}`} type="number" min={f.min} max={f.max} step={f.step} defaultValue={f.entered ?? ""} placeholder="Not set" className={`mt-1 ${field}`} />
              <span className="mt-1 block text-xs text-slate-500">In use: {f.inUse}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <legend className="px-1 text-sm font-medium">Sample recording for the gaps</legend>
        <p className="mt-1 text-sm text-slate-400">Measures you haven&apos;t set or recorded enough of (such as heart rate variability and mood) come from one real 24-hour recording in the MMASH dataset. Pick the closest to you.</p>
        <select name="crewId" defaultValue={crewId} className={`mt-3 ${field} bg-slate-900`}>
          {crew.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </fieldset>

      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state.saved && <p role="status" className="text-sm text-emerald-400">Saved. Your vitals now use these values.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

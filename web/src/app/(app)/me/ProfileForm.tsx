"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions";

export function ProfileForm({ displayName, crewId, crew }: { displayName: string; crewId: string; crew: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm text-slate-300">Your name</span>
        <input name="displayName" defaultValue={displayName} maxLength={40} required className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-sky-400" />
      </label>
      <label className="block">
        <span className="text-sm text-slate-300">My baseline</span>
        <select name="crewId" defaultValue={crewId} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 outline-none focus:border-sky-400">
          {crew.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <span className="mt-1 block text-xs text-slate-500">Your normal ranges come from one of these real 24-hour recordings (MMASH dataset). Pick the one closest to you. Your own readings from checkups are added on top.</span>
      </label>
      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state.saved && <p role="status" className="text-sm text-emerald-400">Saved.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}

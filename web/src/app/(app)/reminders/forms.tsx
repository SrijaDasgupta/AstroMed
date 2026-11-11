"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { addMedicationAction, addReminderAction, type FormState } from "@/app/actions";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Times({ initial }: { initial: string[] }) {
  const [times, setTimes] = useState(initial);
  return (
    <div>
      <span className="text-sm text-slate-300">Times</span>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {times.map((t, i) => (
          <input key={i} type="time" name="time" defaultValue={t} required={i === 0} aria-label={`Time ${i + 1}`} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-sky-400 [color-scheme:dark]" />
        ))}
        {times.length < 6 && (
          <button type="button" onClick={() => setTimes([...times, ""])} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5">
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add time
          </button>
        )}
      </div>
    </div>
  );
}

function useReset(state: FormState) {
  const ref = useRef<HTMLFormElement>(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (state.ok) { ref.current?.reset(); setKey((k) => k + 1); }
  }, [state]);
  return { ref, key };
}

export function MedicationForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addMedicationAction, {});
  const { ref, key } = useReset(state);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="text-sm text-slate-300">Medicine</span><input name="name" required maxLength={80} placeholder="e.g. Vitamin D" className={`mt-1 ${field}`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Dose, as prescribed</span><input name="dose" maxLength={60} placeholder="e.g. 1 tablet" className={`mt-1 ${field}`} /></label>
      </div>
      <Times key={key} initial={["08:00"]} />
      <label className="block"><span className="text-sm text-slate-300">Instructions (optional)</span><input name="instructions" maxLength={200} placeholder="e.g. with food" className={`mt-1 ${field}`} /></label>
      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-400">Added to your schedule.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">{pending ? "Adding…" : "Add medicine"}</button>
    </form>
  );
}

const PRESETS = [
  { title: "Drink water", category: "water", times: ["10:00", "14:00", "18:00"] },
  { title: "Exercise session", category: "exercise", times: ["09:00"] },
  { title: "Vital signs check", category: "checkup", times: ["07:30"] },
  { title: "Dim the lights and wind down", category: "sleep", times: ["21:30"] },
];

export function ReminderForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addReminderAction, {});
  const { ref, key } = useReset(state);
  const [preset, setPreset] = useState<(typeof PRESETS)[number] | null>(null);
  const k = `${key}-${preset?.title ?? "custom"}`;
  return (
    <form ref={ref} action={action} className="space-y-3" key={k}>
      <div className="flex flex-wrap gap-2" aria-label="Suggested reminders">
        {PRESETS.map((p) => (
          <button key={p.title} type="button" onClick={() => setPreset(p)} className={`rounded-full border px-3 py-1 text-xs ${preset?.title === p.title ? "border-sky-400 bg-sky-400/15 text-sky-100" : "border-white/15 text-slate-300 hover:bg-white/5"}`}>{p.title}</button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block"><span className="text-sm text-slate-300">Remind me to</span><input name="title" required maxLength={80} defaultValue={preset?.title ?? ""} className={`mt-1 ${field}`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Type</span>
          <select name="category" defaultValue={preset?.category ?? "other"} className={`mt-1 ${field} bg-slate-900`}>
            <option value="water">Water</option><option value="exercise">Exercise</option><option value="checkup">Checkup</option><option value="sleep">Sleep</option><option value="other">Other</option>
          </select>
        </label>
      </div>
      <Times initial={preset?.times ?? ["09:00"]} />
      <fieldset>
        <legend className="text-sm text-slate-300">Days</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <label key={d} className="cursor-pointer">
              <input type="checkbox" name="day" value={i} defaultChecked className="peer sr-only" />
              <span className="inline-block rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-400 peer-checked:border-sky-400 peer-checked:bg-sky-400/15 peer-checked:text-sky-100 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400">{d}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-400">Reminder added.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">{pending ? "Adding…" : "Add reminder"}</button>
    </form>
  );
}

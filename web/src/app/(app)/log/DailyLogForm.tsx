"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitDailyLog, type CheckupState } from "@/app/actions";
import { EscalationBadge, ESCALATION_COLOR } from "@/components/EscalationBadge";
import { DAILY_SECTIONS, SYMPTOMS } from "@/lib/daily-log";

const input = "w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 tabular-nums outline-none focus:border-sky-400";

export function DailyLogForm() {
  const [state, action, pending] = useActionState<CheckupState, FormData>(submitDailyLog, {});

  if (state.result) {
    const t = state.result.contact;
    return (
      <section aria-live="polite" className="rounded-2xl border p-5" style={{ borderColor: `${ESCALATION_COLOR[state.result.level]}66` }}>
        <EscalationBadge level={state.result.level} />
        <h2 className="mt-2 text-xl font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-300">{state.result.level === "none" && state.result.findings.length > 0 ? "Nothing needs action now. See the notes below." : t.body}</p>
        {state.result.findings.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-slate-200">
            {state.result.findings.map((f, i) => <li key={i} className="flex gap-2"><EscalationBadge level={f.level} /><span>{f.text}</span></li>)}
          </ul>
        )}
        <p className="mt-4 text-sm text-slate-400">{state.result.problem ? `Not saved: ${state.result.problem}` : "Saved. Your readings now appear in My vitals, and matching checkups count as done."}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/vitals" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">View my vitals</Link>
          <a href="/log" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">Log something else</a>
        </div>
      </section>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {DAILY_SECTIONS.map((s) => (
        <fieldset key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <legend className="px-1 text-sm font-medium text-slate-200">{s.title}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {s.numbers?.map((f) => (
              <label key={f.id} className="block">
                <span className="text-sm text-slate-300">{f.label}</span>
                <span className="mt-1 flex items-center gap-2">
                  <input name={f.id} type="number" inputMode="decimal" min={f.min} max={f.max} step={f.step} className={input} />
                  <span className="text-sm text-slate-400">{f.unit}</span>
                </span>
              </label>
            ))}
          </div>
          {s.scales?.map((f) => (
            <div key={f.id} className="mt-4" role="radiogroup" aria-label={f.label}>
              <p className="text-sm text-slate-300">{f.label}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">{f.low}</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer">
                    <input type="radio" name={f.id} value={n} className="peer sr-only" />
                    <span className="inline-block min-w-10 rounded-lg border border-white/15 px-3 py-1.5 text-center text-sm text-slate-300 peer-checked:border-sky-400 peer-checked:bg-sky-400/15 peer-checked:text-sky-100 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400">{n}</span>
                  </label>
                ))}
                <span className="text-xs text-slate-500">{f.high}</span>
              </div>
            </div>
          ))}
        </fieldset>
      ))}

      <fieldset className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <legend className="px-1 text-sm font-medium text-slate-200">Symptoms today</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SYMPTOMS.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name={s.id} className="h-4 w-4 accent-sky-400" /> {s.label}
            </label>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-sm text-slate-300">Notes (optional)</span>
          <textarea name="notes" maxLength={300} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400" />
        </label>
      </fieldset>

      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">
        {pending ? "Saving…" : "Save today's log"}
      </button>
    </form>
  );
}

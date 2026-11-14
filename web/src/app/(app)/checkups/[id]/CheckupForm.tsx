"use client";

import Link from "next/link";
import { useActionState, useCallback, useState } from "react";
import { AmslerGrid } from "@/components/checks/AmslerGrid";
import { ReactionTest } from "@/components/checks/ReactionTest";
import { StandTimer } from "@/components/checks/StandTimer";
import type { ReactionResult } from "@/lib/reaction";
import { submitCheckup, type CheckupState } from "@/app/actions";
import { EscalationBadge, ESCALATION_COLOR } from "@/components/EscalationBadge";
import type { Checkup, Field } from "@/lib/checkups";

export function CheckupForm({ checkupId, fields, widget }: { checkupId: string; fields: Field[]; widget?: Checkup["widget"] }) {
  const [state, action, pending] = useActionState<CheckupState, FormData>(submitCheckup, {});
  const [test, setTest] = useState<ReactionResult>();
  const onDone = useCallback((r: ReactionResult) => setTest(r), []);
  const onReset = useCallback(() => setTest(undefined), []);
  const needsTest = fields.some((f) => f.kind === "number" && f.filledByTest);

  if (state.result) {
    const t = state.result.contact;
    return (
      <section aria-live="polite" className="rounded-2xl border p-5" style={{ borderColor: `${ESCALATION_COLOR[state.result.level]}66` }}>
        <EscalationBadge level={state.result.level} />
        <h2 className="mt-2 text-xl font-semibold">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-300">
          {state.result.level === "none" && state.result.findings.length > 0 ? "Nothing needs action now. See the notes below." : t.body}
        </p>
        {state.result.findings.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm text-slate-200">
            {state.result.findings.map((f, i) => (
              <li key={i} className="flex gap-2"><EscalationBadge level={f.level} /><span>{f.text}</span></li>
            ))}
          </ul>
        )}
        {state.result.problem ? (
          <p className="mt-4 text-sm text-amber-200">Not saved: {state.result.problem}</p>
        ) : (
          <p className="mt-4 text-sm text-slate-400">{fields.some((f) => f.kind === "number" && f.metric) ? "Saved. Your readings now appear in My vitals." : "Saved. Your results appear on this checkup and in My vitals."}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/checkups" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">Back to checkups</Link>
          <Link href="/vitals" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">View my vitals</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
    {widget === "reaction" && <ReactionTest onDone={onDone} onReset={onReset} />}
    {widget === "amsler" && <AmslerGrid />}
    {widget === "timer" && <StandTimer />}
    <form action={action} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <input type="hidden" name="checkupId" value={checkupId} />
      {fields.map((f) => (
        <fieldset key={f.id}>
          {f.kind === "number" && f.filledByTest ? (
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-300">{f.label}</span>
              <input name={f.id} readOnly required tabIndex={-1} value={test ? String(test[f.id as keyof ReactionResult]) : ""} placeholder="—"
                className="w-24 rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-right tabular-nums text-slate-100 outline-none" />
              <span className="w-6 text-slate-400">{f.unit}</span>
            </label>
          ) : f.kind === "number" ? (
            <label className="block">
              <span className="text-sm text-slate-200">{f.label}</span>
              <span className="mt-1 flex items-center gap-2">
                <input
                  name={f.id}
                  type="number"
                  inputMode="decimal"
                  required={!f.optional}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 tabular-nums outline-none focus:border-sky-400"
                />
                <span className="text-sm text-slate-400">{f.unit}</span>
              </span>
              {f.hint && <span className="mt-1 block text-xs text-slate-500">{f.hint}</span>}
            </label>
          ) : (
            <>
              <legend className="text-sm text-slate-200">{f.label}</legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {f.kind === "scale" && <span className="text-xs text-slate-500">{f.low}</span>}
                {(f.kind === "yesno" ? [["yes", "Yes"], ["no", "No"]] : [1, 2, 3, 4, 5].map((n) => [String(n), String(n)])).map(([value, label]) => (
                  <label key={value} className="cursor-pointer">
                    <input type="radio" name={f.id} value={value} required className="peer sr-only" />
                    <span className="inline-block min-w-10 rounded-lg border border-white/15 px-3 py-1.5 text-center text-sm text-slate-300 peer-checked:border-sky-400 peer-checked:bg-sky-400/15 peer-checked:text-sky-100 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400">
                      {label}
                    </span>
                  </label>
                ))}
                {f.kind === "scale" && <span className="text-xs text-slate-500">{f.high}</span>}
              </div>
            </>
          )}
        </fieldset>
      ))}
      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {needsTest && !test && <p className="text-sm text-slate-400">Do the test above first. It fills in these results.</p>}
      <button type="submit" disabled={pending || (needsTest && !test)} className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">
        {pending ? "Checking…" : "Save and check"}
      </button>
    </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { LifeBuoy } from "lucide-react";
import { addJournalAction, type JournalState } from "@/app/actions";
import { JOURNAL_TOPICS, MOODS, PROMPTS } from "@/lib/journal";

export function JournalForm({ today, suggested }: { today: string; suggested: string }) {
  const [state, action, pending] = useActionState<JournalState, FormData>(addJournalAction, {});
  const [prompt, setPrompt] = useState(suggested);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);

  return (
    <div className="space-y-4">
      {state.ok && state.support && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-4 text-sm text-rose-50">
          <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden />
          <div className="space-y-1">
            <p className="font-medium">You don&apos;t have to handle this alone.</p>
            <p>If you&apos;re thinking about harming yourself, please reach out now: contact your flight surgeon or behavioral health team right away, or someone you trust.</p>
            <p>If you&apos;re in immediate danger, call your local emergency number. In the US, you can call or text <strong>988</strong> (Suicide &amp; Crisis Lifeline) any time.</p>
          </div>
        </div>
      )}
      {state.ok && !state.support && state.lowMood && (
        <p role="status" className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">
          Saved. Sorry today is hard. If low mood keeps coming back, a private conference with your flight surgeon or psychologist can help. <Link href="/checkups/mood" className="underline">Do the mood check-in</Link>.
        </p>
      )}
      {state.ok && !state.support && !state.lowMood && <p role="status" className="text-sm text-emerald-400">Saved to your journal.</p>}

      <form ref={ref} action={action} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <fieldset>
            <legend className="text-sm text-slate-300">How are you feeling?</legend>
            <div className="mt-2 flex gap-2">
              {MOODS.map((m) => (
                <label key={m.value} className="cursor-pointer" title={m.label}>
                  <input type="radio" name="mood" value={m.value} className="peer sr-only" />
                  <span className="flex flex-col items-center rounded-xl border border-white/15 px-2.5 py-1.5 text-xl peer-checked:border-sky-400 peer-checked:bg-sky-400/15 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400">
                    <span aria-hidden>{m.face}</span>
                    <span className="text-[10px] text-slate-400">{m.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block"><span className="text-sm text-slate-300">Date</span>
            <input name="date" type="date" defaultValue={today} max={today} required className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400 [color-scheme:dark]" />
          </label>
        </div>

        <div>
          <p className="text-sm text-slate-300">Prompt (optional)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...PROMPTS, ""].map((p) => (
              <button key={p || "none"} type="button" onClick={() => setPrompt(p)} className={`rounded-full border px-3 py-1 text-xs ${prompt === p ? "border-sky-400 bg-sky-400/15 text-sky-100" : "border-white/15 text-slate-300 hover:bg-white/5"}`}>
                {p || "No prompt"}
              </button>
            ))}
          </div>
          <input type="hidden" name="prompt" value={prompt} />
        </div>

        <label className="block">
          <span className="text-sm text-slate-100">{prompt || "Write freely"}</span>
          <textarea name="body" required maxLength={5000} rows={6} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm leading-relaxed outline-none focus:border-sky-400" />
        </label>

        <fieldset>
          <legend className="text-sm text-slate-300">Topics (optional)</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {JOURNAL_TOPICS.map((t) => (
              <label key={t.id} className="cursor-pointer">
                <input type="checkbox" name="tag" value={t.id} className="peer sr-only" />
                <span className="inline-block rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300 peer-checked:border-sky-400 peer-checked:bg-sky-400/15 peer-checked:text-sky-100 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400">{t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
        <button type="submit" disabled={pending} className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">{pending ? "Saving…" : "Save entry"}</button>
      </form>
    </div>
  );
}

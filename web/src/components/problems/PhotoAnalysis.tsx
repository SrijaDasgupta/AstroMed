"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { savePhotoAnalysisAction } from "@/app/actions";
import { analyzePhoto, readAiSettings, type StoredAnalysis } from "@/lib/ai-analysis";

const CHANGE: Record<StoredAnalysis["change"], string> = {
  "first-photo": "", better: "Looks better than the earlier photo", worse: "Looks worse than the earlier photo", same: "Looks about the same as the earlier photo", unclear: "Change from the earlier photo is unclear",
};
const URGENCY: Record<StoredAnalysis["urgency"], { text: string; cls: string }> = {
  none: { text: "Self-care", cls: "text-emerald-300" },
  routine: { text: "Next check-in", cls: "text-amber-200" },
  today: { text: "Contact your flight surgeon today", cls: "text-orange-200" },
  now: { text: "Contact your flight surgeon or emergency services now", cls: "text-rose-200" },
};

export function AnalysisPanel({ a }: { a: StoredAnalysis }) {
  if (!a.isHealthPhoto) {
    return <p className="mt-2 rounded-lg border border-white/10 p-2 text-xs text-slate-400"><Bot className="mr-1 inline h-3.5 w-3.5" aria-hidden />Your AI couldn&apos;t see a health problem in this photo. {a.description}</p>;
  }
  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-violet-400/25 bg-violet-400/5 p-3 text-sm">
      <p className="flex flex-wrap items-center gap-x-2 text-xs font-medium uppercase tracking-widest text-violet-200"><Bot className="h-3.5 w-3.5" aria-hidden />Photo analysis <span className="font-normal normal-case tracking-normal text-slate-500">by your AI ({a.model}) · {a.analyzedAt.slice(0, 10)}</span></p>
      <p className="text-slate-200">{a.description}</p>
      {a.change !== "first-photo" && <p className="text-slate-300">{CHANGE[a.change]}.</p>}
      {a.observations.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-slate-300">{a.observations.map((o) => <li key={o}>{o}</li>)}</ul>}
      {a.possibleConditions.length > 0 && <p className="text-slate-300"><span className="text-slate-500">Possibly: </span>{a.possibleConditions.join("; ")}</p>}
      {a.warningSigns.length > 0 && <p className="text-orange-200"><span className="text-slate-500">Warning signs seen: </span>{a.warningSigns.join("; ")}</p>}
      <p className={URGENCY[a.urgency].cls}>{URGENCY[a.urgency].text}: <span className="text-slate-300">{a.urgencyReason}</span></p>
      {a.quality === "poor" && <p className="text-xs text-slate-400">The photo was hard to judge. A sharper, well-lit photo with something for scale helps.</p>}
      <p className="text-[11px] text-slate-500">AI can be wrong. It isn&apos;t a diagnosis; your flight surgeon decides.</p>
    </div>
  );
}

/** Button that sends one photo to the user's own AI from their device, then saves the result. */
export function AnalyzeButton({ target, id, url, earlierUrl, context }: { target: "note" | "update"; id: string; url: string; earlierUrl?: string; context: string }) {
  const router = useRouter();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setConnected(Boolean(readAiSettings())), []);
  if (connected === null) return null;
  if (!connected) return <Link href="/ai" className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-sky-300"><Bot className="h-3.5 w-3.5" aria-hidden />Connect your own AI to analyze this photo</Link>;

  async function run() {
    const settings = readAiSettings();
    if (!settings) return setConnected(false);
    setBusy(true);
    setError("");
    try {
      const get = async (u: string) => { const r = await fetch(u); if (!r.ok) throw new Error("Couldn't load the photo. Refresh the page and try again."); return r.blob(); };
      const [photo, earlier] = await Promise.all([get(url), earlierUrl ? get(earlierUrl) : Promise.resolve(undefined)]);
      const analysis = await analyzePhoto(settings, { photo, earlier, context });
      const saved = await savePhotoAnalysisAction(target, id, analysis);
      if (saved.error) throw new Error(saved.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/40 px-2.5 py-1 text-xs text-violet-200 hover:bg-violet-400/10 disabled:opacity-60">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Bot className="h-3.5 w-3.5" aria-hidden />}
        {busy ? "Analyzing with your AI…" : "Analyze photo with my AI"}
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

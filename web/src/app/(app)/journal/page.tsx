import { ExternalLink, Lock } from "lucide-react";
import { deleteJournalAction } from "@/app/actions";
import { Wellness } from "@/components/astromed";
import { addDays, localDate } from "@/lib/dates";
import { JOURNAL_TOPICS, MOODS, promptOfDay } from "@/lib/journal";
import { listEntries } from "@/lib/journal-store";
import { requireViewer } from "@/lib/session";
import { SOURCES } from "@/lib/tips";
import { JournalForm } from "./JournalForm";

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default async function JournalPage() {
  const viewer = await requireViewer();
  const { entries, problem } = await listEntries(viewer);
  const today = localDate();
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const moodOn = (d: string) => {
    const ms = entries.filter((e) => e.date === d && e.mood).map((e) => e.mood!);
    return ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : undefined;
  };
  const topicCounts = JOURNAL_TOPICS.map((t) => ({ ...t, n: entries.filter((e) => e.tags.includes(t.id)).length })).filter((t) => t.n > 0).sort((a, b) => b.n - a.n);
  const src = SOURCES.behavioral;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Journal</h1>
        <p className="mt-1 flex items-center gap-1.5 text-slate-400"><Lock className="h-4 w-4" aria-hidden />{viewer.kind === "demo" ? "Private to this browser in demo mode (the last 5 short entries)." : "Private: only you can read your journal."}</p>
      </div>

      {problem && <p className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">Couldn&apos;t load your journal: {problem}</p>}

      <JournalForm today={today} suggested={promptOfDay(today)} />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-medium">Mood, last 14 days</h2>
          <ol className="mt-3 grid grid-cols-7 gap-2 text-center">
            {last14.map((d) => {
              const m = moodOn(d);
              const meta = MOODS.find((x) => x.value === m);
              return (
                <li key={d} className="rounded-lg bg-white/[0.03] py-1.5" title={`${fmt(d)}: ${meta ? meta.label : "no entry"}`}>
                  <span className="block text-lg" aria-hidden>{meta ? meta.face : "·"}</span>
                  <span className="block text-[10px] text-slate-500">{new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}</span>
                  <span className="sr-only">{fmt(d)}: {meta ? meta.label : "no entry"}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-medium">What you write about</h2>
          {topicCounts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Tag entries with topics to see patterns here.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {topicCounts.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-slate-300">{t.label}</span>
                  <span className="h-2 rounded-full bg-sky-400" style={{ width: `${(t.n / topicCounts[0].n) * 60}%` }} aria-hidden />
                  <span className="tabular-nums text-xs text-slate-400">{t.n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Wellness />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Entries</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No entries yet.</p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => {
              const mood = MOODS.find((m) => m.value === e.mood);
              return (
                <li key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{fmt(e.date)}{mood && <span className="ml-2 font-normal text-slate-400"><span aria-hidden>{mood.face}</span> {mood.label}</span>}</p>
                    <form action={deleteJournalAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-400 hover:border-rose-400/50 hover:text-rose-300">Delete</button>
                    </form>
                  </div>
                  {e.prompt && <p className="mt-2 text-xs italic text-slate-500">{e.prompt}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-200">{e.body}</p>
                  {e.tags.length > 0 && <p className="mt-2 flex flex-wrap gap-1.5">{e.tags.map((t) => <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-slate-400">{JOURNAL_TOPICS.find((x) => x.id === t)?.label ?? t}</span>)}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500">
        NASA studied journals kept by ISS astronauts to understand how crews adjust; ten topics (work, contact with home, adjusting, crew relations, leisure, equipment, events, scheduling, sleep and food) made up 88% of entries. AstroMed uses them as tags.{" "}
        <a href={`${src.url}#page=21`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline decoration-white/20 underline-offset-2 hover:text-sky-300">{src.short}, p. 21 <ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens the source in a new tab)</span></a>.
        Journaling supports, and doesn&apos;t replace, care from your flight surgeon or psychologist.
      </p>
    </div>
  );
}

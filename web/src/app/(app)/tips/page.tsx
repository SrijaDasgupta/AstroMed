import Link from "next/link";
import { HabitButton } from "@/components/HabitButton";
import { TipCard } from "@/components/TipCard";
import { localDate } from "@/lib/dates";
import { getCurrentEnvironment } from "@/lib/mission";
import { loadTipActions } from "@/lib/profile-store";
import { requireViewer } from "@/lib/session";
import { SOURCES, TIPS, TOPICS, tipsForEnvironment, topicBySlug } from "@/lib/tips";

function chip(active: boolean) {
  return `rounded-full px-3 py-1 ${active ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5"}`;
}

export default async function TipsPage({ searchParams }: { searchParams: Promise<{ all?: string; topic?: string }> }) {
  const viewer = await requireViewer();
  const env = await getCurrentEnvironment();
  const sp = await searchParams;
  const showAll = sp.all === "1";
  const topic = topicBySlug(sp.topic);
  const base = showAll ? TIPS : tipsForEnvironment(env.id);
  const today = localDate();
  const doneToday = new Set((await loadTipActions(viewer)).filter((a) => a.doneOn === today).map((a) => a.tipId));

  const href = (opts: { all?: boolean; topic?: string }) => {
    const q = new URLSearchParams();
    if (opts.all) q.set("all", "1");
    if (opts.topic) q.set("topic", opts.topic);
    const s = q.toString();
    return s ? `/tips?${s}` : "/tips";
  };
  const groups = TOPICS.map((t) => ({ ...t, tips: base.filter((tip) => tip.topic === t.id) })).filter((g) => g.tips.length > 0 && (!topic || g.id === topic.id));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
        <h1 className="mt-1 text-2xl font-semibold">Health tips</h1>
        <p className="mt-1 text-slate-400">
          Guidance from NASA&apos;s crew health standards and evidence reports, plus peer-reviewed brain health research, grouped by topic. Tips with a daily habit can be marked done for XP.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Which mission">
          <Link href={href({ topic: topic?.slug })} aria-current={!showAll ? "true" : undefined} className={chip(!showAll)}>For {env.name.toLowerCase()}</Link>
          <Link href={href({ all: true, topic: topic?.slug })} aria-current={showAll ? "true" : undefined} className={chip(showAll)}>All missions</Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Topic">
          <Link href={href({ all: showAll })} aria-current={!topic ? "true" : undefined} className={chip(!topic)}>All topics ({base.length})</Link>
          {TOPICS.map((t) => {
            const n = base.filter((tip) => tip.topic === t.id).length;
            if (n === 0) return null;
            return (
              <Link key={t.slug} href={href({ all: showAll, topic: t.slug })} aria-current={topic?.id === t.id ? "true" : undefined} className={chip(topic?.id === t.id)}>
                {t.id} ({n})
              </Link>
            );
          })}
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.slug}>
          <h2 className="font-medium">{g.id}</h2>
          <p className="mb-3 text-sm text-slate-500">{g.blurb}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {g.tips.map((tip) => (
              <TipCard
                key={tip.id}
                tip={tip}
                footer={tip.habit && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-300"><span className="text-slate-500">Today: </span>{tip.habit}</p>
                    <HabitButton tipId={tip.id} done={doneToday.has(tip.id)} />
                  </div>
                )}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="border-t border-white/10 pt-4 text-xs text-slate-500">
        <h2 className="font-medium text-slate-400">Sources</h2>
        <ul className="mt-2 space-y-1">
          {Object.values(SOURCES).map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-300">{s.title}</a></li>
          ))}
        </ul>
        <p className="mt-3">Page numbers refer to pages of the PDF file.</p>
      </section>
    </div>
  );
}

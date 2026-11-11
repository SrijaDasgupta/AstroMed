import Link from "next/link";
import { TipCard } from "@/components/TipCard";
import { getCurrentEnvironment } from "@/lib/mission";
import { SOURCES, TIPS, TOPICS, tipsForEnvironment } from "@/lib/tips";

export default async function TipsPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const env = await getCurrentEnvironment();
  const showAll = (await searchParams).all === "1";
  const tips = showAll ? TIPS : tipsForEnvironment(env.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Health tips</h1>
        <p className="mt-1 text-slate-400">
          Guidance drawn from NASA&apos;s crew health standards and Human Research Program evidence reports. Each tip links to the page it comes from.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Which tips to show">
        <Link
          href="/tips"
          aria-current={!showAll ? "page" : undefined}
          className={`rounded-full px-3 py-1 ${!showAll ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5"}`}
        >
          For {env.name.toLowerCase()} ({tipsForEnvironment(env.id).length})
        </Link>
        <Link
          href="/tips?all=1"
          aria-current={showAll ? "page" : undefined}
          className={`rounded-full px-3 py-1 ${showAll ? "bg-sky-400/15 text-sky-200" : "text-slate-400 hover:bg-white/5"}`}
        >
          All missions ({TIPS.length})
        </Link>
      </div>

      {TOPICS.map((topic) => {
        const group = tips.filter((t) => t.topic === topic);
        if (group.length === 0) return null;
        return (
          <section key={topic}>
            <h2 className="mb-3 font-medium">{topic}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {group.map((tip) => <TipCard key={tip.id} tip={tip} />)}
            </div>
          </section>
        );
      })}

      <section className="border-t border-white/10 pt-4 text-xs text-slate-500">
        <h2 className="font-medium text-slate-400">Sources</h2>
        <ul className="mt-2 space-y-1">
          {Object.values(SOURCES).map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-sky-300">{s.title}</a>
            </li>
          ))}
        </ul>
        <p className="mt-3">Tips are summaries for education and demonstration, not medical advice. Page numbers refer to pages of the PDF file.</p>
      </section>
    </div>
  );
}

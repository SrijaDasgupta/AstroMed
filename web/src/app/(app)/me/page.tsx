import Link from "next/link";
import { Award, ChevronRight, ClipboardCheck, Lock, Target } from "lucide-react";
import { HabitButton } from "@/components/HabitButton";
import { RankBar } from "@/components/RankBar";
import { StatusBadge } from "@/components/StatusBadge";
import { dueCount } from "@/lib/checkup-schedule";
import { CREW } from "@/lib/crew";
import { getMyHealth } from "@/lib/my-health";
import { SUMMARY_COLUMNS, summaryCell } from "@/lib/vitals";
import { dailyMissions, progress, XP } from "@/lib/gamification";
import { loadTipActions } from "@/lib/profile-store";
import { requireViewer } from "@/lib/session";
import { ProfileForm } from "./ProfileForm";

export default async function MePage() {
  const viewer = await requireViewer();
  const [{ env, profile, member, logs, assessment: a, recordedDays }, actions] = await Promise.all([getMyHealth(viewer), loadTipActions(viewer)]);
  const missions = dailyMissions(a, env);
  const p = progress(logs, actions, missions.map((m) => m.id));
  const flagged = a.metrics.filter((m) => m.status !== "good");
  const due = dueCount(logs);
  const doneCount = missions.filter((m) => p.doneToday.has(m.id)).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Hi, {profile.displayName}</h1>
        <p className="mt-1 text-slate-400">Your health, your daily missions and your progress. Everything here is about you.</p>
      </div>

      <RankBar xp={p.xp} rank={p.rank} nextRank={p.nextRank} toNext={p.toNext} rankProgress={p.rankProgress} streak={p.streak} />

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-medium"><Target className="h-5 w-5 text-sky-300" aria-hidden /> Today&apos;s missions</h2>
          <p className="text-sm tabular-nums text-slate-400">{doneCount} of {missions.length} done</p>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Small habits from NASA-based tips, picked for your alerts and your mission. +{XP.habit} XP each, +{XP.allMissionsBonus} XP bonus for finishing all three.
        </p>
        <ul className="mt-3 space-y-3">
          {missions.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="min-w-0">
                <p className={`font-medium ${p.doneToday.has(t.id) ? "text-slate-400 line-through decoration-slate-500" : "text-slate-100"}`}>{t.habit}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t.topic} · from &ldquo;{t.title}&rdquo;</p>
              </div>
              <HabitButton tipId={t.id} done={p.doneToday.has(t.id)} />
            </li>
          ))}
        </ul>
        {p.allMissionsToday && <p className="mt-3 text-sm text-emerald-300">All missions done today. Bonus earned!</p>}
        <Link href="/tips" className="mt-3 inline-flex items-center gap-1 text-sm text-sky-300 hover:text-sky-200">More habits in Health tips <ChevronRight className="h-4 w-4" aria-hidden /></Link>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">My health</h2>
              <p className="text-sm text-slate-400">{env.name} · {recordedDays > 0 ? `your readings on ${recordedDays} of the last 30 days` : "sample data until you record readings"}</p>
            </div>
            <StatusBadge status={a.status} small />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 text-sm">
            {SUMMARY_COLUMNS.map((c) => {
              const cell = summaryCell(a, c.keys);
              return (
                <div key={c.label}>
                  <dt className="text-xs text-slate-500">{c.label}</dt>
                  <dd className="tabular-nums text-slate-100">{cell.value} <span className="text-xs text-slate-500">{cell.unit}</span></dd>
                </div>
              );
            })}
          </dl>
          {flagged.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">Everything is within your normal range.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm text-amber-100">
              {flagged.map((m) => <li key={m.def.key}>{m.def.label} is outside your normal range</li>)}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/vitals" className="text-sky-300 hover:text-sky-200">My vitals</Link>
            <Link href="/checkups" className="inline-flex items-center gap-1 text-sky-300 hover:text-sky-200">
              <ClipboardCheck className="h-4 w-4" aria-hidden /> {due > 0 ? `${due} checkups due · +${XP.checkup} XP each` : "Checkups done"}
            </Link>
            <Link href="/tools" className="text-sky-300 hover:text-sky-200">Health tools</Link>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-medium">Settings</h2>
          <div className="mt-3">
            <ProfileForm displayName={profile.displayName} crewId={member.id} crew={CREW.map((c) => ({ id: c.id, label: `${c.callSign} · ${c.baseline.age ?? "?"}-year-old ${c.baseline.sex === "F" ? "woman" : "man"}, resting HR ${c.baseline.restingHr} bpm` }))} />
          </div>
        </section>
      </div>

      <section>
        <h2 className="flex items-center gap-2 text-lg font-medium"><Award className="h-5 w-5 text-amber-300" aria-hidden /> Badges</h2>
        <p className="mt-1 text-sm text-slate-400">{p.badges.filter((b) => b.earned).length} of {p.badges.length} earned · best streak {p.bestStreak} days</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {p.badges.map((b) => (
            <li key={b.id} className={`rounded-2xl border p-4 ${b.earned ? "border-amber-300/30 bg-amber-300/5" : "border-white/10 bg-white/[0.02]"}`}>
              <p className={`flex items-center gap-2 text-sm font-medium ${b.earned ? "text-amber-100" : "text-slate-400"}`}>
                {b.earned ? <Award className="h-4 w-4 text-amber-300" aria-hidden /> : <Lock className="h-4 w-4 text-slate-600" aria-hidden />}
                {b.name}
                <span className="sr-only">{b.earned ? "(earned)" : "(not yet earned)"}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">{b.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500">
        {viewer.kind === "demo" ? "Demo mode: progress is kept in this browser for 7 days and cleared when you leave the demo." : "Your progress is saved to your account. Only you can see it."}
      </p>
    </div>
  );
}

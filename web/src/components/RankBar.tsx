import { Flame, Trophy } from "lucide-react";

export function RankBar({ xp, rank, nextRank, toNext, rankProgress, streak }: { xp: number; rank: string; nextRank?: string; toNext: number; rankProgress: number; streak: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="flex items-center gap-2 font-medium"><Trophy className="h-4 w-4 text-amber-300" aria-hidden /> {rank}</p>
          <p className="text-sm tabular-nums text-slate-300">{xp.toLocaleString("en-US")} XP</p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-sky-950" role="progressbar" aria-label={nextRank ? `Progress to ${nextRank}` : "Top rank reached"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rankProgress * 100)}>
          <div className="h-2 rounded-full bg-sky-400" style={{ width: `${Math.max(2, rankProgress * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">{nextRank ? `${toNext} XP to ${nextRank}` : "Top rank reached"}</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <Flame className={`h-7 w-7 ${streak > 0 ? "text-orange-400" : "text-slate-600"}`} aria-hidden />
        <div>
          <p className="text-2xl font-semibold tabular-nums">{streak}</p>
          <p className="text-xs text-slate-400">day streak</p>
        </div>
      </div>
    </div>
  );
}

import { Check, Plus } from "lucide-react";
import { toggleHabit } from "@/app/actions";
import { XP } from "@/lib/gamification";

export function HabitButton({ tipId, done }: { tipId: string; done: boolean }) {
  return (
    <form action={toggleHabit}>
      <input type="hidden" name="tipId" value={tipId} />
      <input type="hidden" name="done" value={done ? "0" : "1"} />
      {done ? (
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-500/25" title="Undo">
          <Check className="h-4 w-4" aria-hidden /> Done today
        </button>
      ) : (
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 px-3 py-1.5 text-sm text-sky-200 hover:bg-sky-400/10">
          <Plus className="h-4 w-4" aria-hidden /> Mark done · +{XP.habit} XP
        </button>
      )}
    </form>
  );
}

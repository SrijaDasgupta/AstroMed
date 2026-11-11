import { requireViewer } from "@/lib/session";
import { DailyLogForm } from "./DailyLogForm";

export default async function DailyLogPage() {
  await requireViewer();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
        <h1 className="mt-1 text-2xl font-semibold">Daily log</h1>
        <p className="mt-1 text-slate-400">{today}. Fill in whatever you have; everything is optional. For step-by-step help measuring, use Checkups.</p>
      </div>
      <DailyLogForm />
      <p className="text-xs text-slate-500">Readings are checked against your own normal range and general clinical limits set for this demo. Not medical advice; contact your flight surgeon with concerns.</p>
    </div>
  );
}

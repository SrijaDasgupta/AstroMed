import Link from "next/link";
import { Utensils } from "lucide-react";
import { CiteLink } from "@/components/CiteLink";
import { localDate, middayOf } from "@/lib/dates";
import { ENERGY_CITE, EVA_KCAL_PER_HOUR, energyTarget } from "@/lib/nutrition";
import { getProfile } from "@/lib/profile-store";
import { requireViewer } from "@/lib/session";
import { DailyLogForm } from "./DailyLogForm";

export default async function DailyLogPage() {
  const viewer = await requireViewer();
  const day = localDate();
  const today = middayOf(day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const target = energyTarget((await getProfile(viewer)).details, Number(day.slice(0, 4)));
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
        <h1 className="mt-1 text-2xl font-semibold">Daily log</h1>
        <p className="mt-1 text-slate-400">{today}. Fill in whatever you have; everything is optional. For step-by-step help measuring, use Checkups.</p>
      </div>
      <p className="flex gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        <Utensils className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
        <span>
          Your food energy target is about <strong className="text-white">{target.kcal.toLocaleString("en-US")} kcal a day</strong>, plus {EVA_KCAL_PER_HOUR} kcal for each hour of spacewalk.{" "}
          {target.basis === "default"
            ? <>That&apos;s NASA&apos;s default; add your {target.missing.join(", ")} in <Link href="/profile" className="text-sky-300 hover:text-sky-200">My profile</Link> for a personal figure.</>
            : <>Calculated with NASA&apos;s formula from your profile.</>}{" "}
          <CiteLink c={ENERGY_CITE} />
        </span>
      </p>
      <DailyLogForm />
      <p className="text-xs text-slate-500">Readings are checked against your own normal range and general clinical limits set for this demo. Not medical advice; contact your flight surgeon with concerns.</p>
    </div>
  );
}

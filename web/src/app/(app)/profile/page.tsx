import { Download } from "lucide-react";
import { CREW, getMetric } from "@/lib/crew";
import { getMyHealth } from "@/lib/my-health";
import { BASELINE_FIELDS, MIN_DAYS_FOR_BASELINE } from "@/lib/personal-baseline";
import { requireViewer } from "@/lib/session";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const viewer = await requireViewer();
  const { profile, member, baselineSources, readingDays } = await getMyHealth(viewer);

  const baselineFields = BASELINE_FIELDS.map((f) => {
    const def = getMetric(f.key);
    const value = def.baseline(member).toFixed(def.decimals);
    const src = baselineSources[f.key];
    const days = readingDays[f.key] ?? 0;
    const inUse = src === "entered" ? `${value} ${f.unit} (you entered)`
      : src === "readings" ? `${value} ${f.unit} (median of your ${days} days of readings)`
      : `${value} ${f.unit} (sample; ${days} of ${MIN_DAYS_FOR_BASELINE} days of your own readings so far)`;
    return { ...f, entered: profile.baseline[f.key], inUse };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">My profile</h1>
        <p className="mt-1 text-slate-400">Details about you and your usual values. {viewer.kind === "demo" ? "In demo mode these stay in this browser." : "Only you can see them."}</p>
      </div>
      <ProfileForm
        displayName={profile.displayName}
        crewId={profile.crewId}
        crew={CREW.map((c) => ({ id: c.id, label: `${c.baseline.age ?? "?"}-year-old ${c.baseline.sex === "F" ? "woman" : "man"}, resting heart rate ${c.baseline.restingHr} bpm` }))}
        details={profile.details}
        baselineFields={baselineFields}
      />
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 text-lg font-medium"><Download className="h-5 w-5 text-slate-400" aria-hidden />Your data</h2>
        <p className="mt-1 text-sm text-slate-300">AstroMed keeps everything you enter for as long as you have an account; nothing is deleted automatically. You can also download a complete copy at any time and keep it yourself.</p>
        {viewer.kind === "user"
          ? <a href="/api/export" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"><Download className="h-4 w-4" aria-hidden />Download my data</a>
          : <p className="mt-2 text-sm text-slate-500">Downloading needs an account; demo data stays in this browser for a week.</p>}
      </section>
    </div>
  );
}

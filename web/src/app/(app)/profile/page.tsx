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
    </div>
  );
}

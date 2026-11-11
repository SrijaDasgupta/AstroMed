import { Check } from "lucide-react";
import { setEnvironment } from "@/app/actions";
import { EnvironmentStats } from "@/components/EnvironmentStats";
import { ENVIRONMENTS } from "@/lib/environments";
import { getCurrentEnvironment } from "@/lib/mission";

export default async function MissionPage() {
  const current = await getCurrentEnvironment();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mission environment</h1>
        <p className="mt-1 text-slate-400">
          Where is the crew? This changes which health risks AstroMed watches for and how alerts are judged.
        </p>
      </div>

      <form action={setEnvironment} className="grid gap-4 sm:grid-cols-2">
        {ENVIRONMENTS.map((env) => {
          const selected = env.id === current.id;
          return (
            <button
              key={env.id}
              type="submit"
              name="environment"
              value={env.id}
              aria-pressed={selected}
              className={`rounded-2xl border p-5 text-left transition ${
                selected ? "border-sky-400 bg-sky-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{env.name}</h2>
                  <p className="text-sm text-slate-400">{env.tagline}</p>
                </div>
                {selected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-400 px-2 py-0.5 text-xs font-medium text-slate-950">
                    <Check className="h-3 w-3" aria-hidden /> Selected
                  </span>
                )}
              </div>
              <div className="mt-4"><EnvironmentStats env={env} /></div>
              <p className="mt-3 text-xs text-slate-500">Radiation: {env.radiationSource}</p>
            </button>
          );
        })}
      </form>

      <p className="text-xs text-slate-500">
        Daily radiation is an average. Real doses vary with the solar cycle, shielding and solar storms. NASA&apos;s career limit is 600 mSv (NASA-STD-3001 Volume 1, p. 40).
      </p>
    </div>
  );
}

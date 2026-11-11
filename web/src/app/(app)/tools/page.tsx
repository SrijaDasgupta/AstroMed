import { Bone, Moon, Radiation } from "lucide-react";
import { getCrewMember } from "@/lib/crew";
import { getCurrentEnvironment } from "@/lib/mission";
import { getProfile } from "@/lib/profile-store";
import { requireViewer } from "@/lib/session";
import { BoneCalculator, RadiationCalculator, SleepCalculator } from "./Calculators";

export default async function ToolsPage() {
  const viewer = await requireViewer();
  const env = await getCurrentEnvironment();
  const profile = await getProfile(viewer);
  const me = getCrewMember(profile.crewId)!;

  const sections = [
    { id: "radiation", title: "Radiation dose", icon: Radiation, blurb: "Enter a dose rate or your dosimeter reading to see your career total against NASA's limit." },
    { id: "bone", title: "Bone loss", icon: Bone, blurb: "Estimate bone density loss from time in low gravity." },
    { id: "sleep", title: "Sleep", icon: Moon, blurb: "Check your last three nights and what got in the way." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">General</p>
        <h1 className="mt-1 text-2xl font-semibold">Health tools</h1>
        <p className="mt-1 text-slate-400">Enter your own numbers to get a result and matching NASA-based tips. Results update as you type.</p>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Tools">
          {sections.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full px-3 py-1 text-slate-400 hover:bg-white/5">{s.title}</a>)}
        </nav>
      </div>

      {sections.map(({ id, title, icon: Icon, blurb }) => (
        <section key={id} id={id} className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <h2 className="flex items-center gap-2 text-lg font-medium"><Icon className="h-5 w-5 text-slate-400" aria-hidden /> {title}</h2>
          <p className="mb-5 mt-1 text-sm text-slate-400">{blurb}</p>
          {id === "radiation" && <RadiationCalculator defaultEnv={env.id} />}
          {id === "bone" && <BoneCalculator defaultEnv={env.id} />}
          {id === "sleep" && <SleepCalculator usualHours={me.baseline.sleepHours ?? 6} />}
        </section>
      ))}

      <p className="text-xs text-slate-500">Estimates for education and demonstration, not medical advice.</p>
    </div>
  );
}

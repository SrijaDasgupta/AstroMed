import { CrewCard } from "@/components/CrewCard";
import { SimulatedNote } from "@/components/SimulatedNote";
import { assess, CREW, MISSION_DAYS } from "@/lib/crew";
import { getCurrentEnvironment } from "@/lib/mission";

export default async function CrewPage() {
  const env = await getCurrentEnvironment();
  const assessments = CREW.map((m) => assess(m, env));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Crew</h1>
        <p className="mt-1 text-slate-400">
          Each person is compared with their own normal, not a population average. Status uses the last 3 of {MISSION_DAYS} days.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assessments.map((a) => <CrewCard key={a.member.id} a={a} />)}
      </div>
      <SimulatedNote envName={env.name} />
    </div>
  );
}

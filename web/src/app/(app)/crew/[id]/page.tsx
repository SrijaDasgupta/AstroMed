import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Radiation } from "lucide-react";
import { MetricChart } from "@/components/MetricChart";
import { SimulatedNote } from "@/components/SimulatedNote";
import { StatusBadge } from "@/components/StatusBadge";
import { TipCard } from "@/components/TipCard";
import { tipsForAlerts } from "@/lib/tips";
import { assess, formatValue, getCrewMember, METRIC_GROUPS, MISSION_DAYS } from "@/lib/crew";
import { getCurrentEnvironment } from "@/lib/mission";

function explain(deviation: number, worseWhen: "higher" | "lower") {
  const dir = worseWhen === "higher" ? "above" : "below";
  return `${Math.abs(deviation).toFixed(1)}× a normal day-to-day change ${dir} this person's usual level`;
}

export default async function CrewMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = getCrewMember(id);
  if (!member) notFound();
  const env = await getCurrentEnvironment();
  const a = assess(member, env);
  const flagged = a.metrics.filter((m) => m.status !== "good");
  const b = member.baseline;
  const tips = tipsForAlerts(flagged.map((m) => ({ key: m.def.key, deviation: m.deviation })), env.id);

  const measured: [string, string][] = [
    ["Sex, age", `${b.sex === "M" ? "Male" : b.sex === "F" ? "Female" : "—"}, ${b.age ?? "—"}`],
    ["Height, weight", `${b.heightCm ?? "—"} cm, ${b.weightKg ?? "—"} kg`],
    ["Resting heart rate", `${b.restingHr ?? "—"} bpm`],
    ["Heart rate variability (RMSSD)", `${b.hrvRmssdMs ?? "—"} ms`],
    ["Sleep (one night)", `${b.sleepHours ?? "—"} h at ${b.sleepEfficiencyPct ?? "—"}% efficiency`],
    ["Steps in 24 h", b.steps24h.toLocaleString("en-US")],
    ["Cortisol wake / bedtime ratio", `${b.cortisolAwakeningRatio ?? "—"}`],
    ["Trait anxiety (STAI, 20–80)", `${b.traitAnxietySTAI ?? "—"}`],
    ["Sleep quality (PSQI, 0–21, lower is better)", `${b.sleepQualityPSQI ?? "—"}`],
    ["Positive mood (PANAS, 10–50, 5 ratings)", `${b.moodPositive ?? "—"} ± ${b.moodPositiveSd ?? "—"}`],
    ["Negative mood (PANAS, 10–50, 5 ratings)", `${b.moodNegative ?? "—"} ± ${b.moodNegativeSd ?? "—"}`],
  ];
  const sim = member.simulated;
  const simulatedRows: [string, string][] = [
    ["Blood pressure", `${sim.systolic}/${sim.diastolic} mmHg`],
    ["Fasting blood glucose", `${sim.glucose} mg/dL`],
    ["Body temperature", `${sim.temperature.toFixed(1)} °C`],
  ];

  return (
    <div className="space-y-6">
      <Link href="/crew" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Crew
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{member.callSign}</h1>
          <p className="text-slate-400">{member.role} · {env.name} · day {MISSION_DAYS}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      {flagged.length > 0 ? (
        <section className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5">
          <h2 className="font-medium">What changed</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {flagged.map((m) => (
              <li key={m.def.key}>
                <span className="text-slate-100">{m.def.label}</span>: last 3 days averaged {formatValue(m.recentMean, m.def)} vs. usual {formatValue(m.baseline, m.def)}, which is {explain(m.deviation, m.def.worseWhen)}.
              </li>
            ))}
          </ul>
          {a.eventNote && <p className="mt-3 text-xs text-slate-400">{a.eventNote}</p>}
        </section>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          All tracked measures are within {member.callSign}&apos;s personal normal range over the last 3 days.
        </p>
      )}

      {tips.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-medium">What the evidence suggests</h2>
            <Link href="/tips" className="text-sm text-sky-300 hover:text-sky-200">All tips</Link>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {tips.map((tip) => <TipCard key={tip.id} tip={tip} compact />)}
          </div>
        </section>
      )}

      {METRIC_GROUPS.map((group) => (
        <section key={group}>
          <h2 className="mb-3 font-medium">{group}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {a.metrics.filter((m) => m.def.group === group).map((m) => (
              <MetricChart key={m.def.key} label={m.def.label} unit={m.def.unit} decimals={m.def.decimals} values={m.values} range={m.range} baseline={m.baseline} baselineKind={m.def.baselineKind} />
            ))}
          </div>
        </section>
      ))}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-medium">Personal baseline</h2>
          <p className="text-xs text-slate-500">Real 24-hour recording, MMASH participant {b.participant.replace("user_", "#")}</p>
          <dl className="mt-3 divide-y divide-white/5 text-sm">
            {measured.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-1.5">
                <dt className="text-slate-400">{k}</dt>
                <dd className="text-right text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-slate-500">Simulated baseline (not recorded in MMASH; set within normal adult ranges)</p>
          <dl className="mt-1 divide-y divide-white/5 text-sm">
            {simulatedRows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-1.5">
                <dt className="text-slate-400">{k}</dt>
                <dd className="text-right text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 self-start">
          <h2 className="flex items-center gap-2 font-medium"><Radiation className="h-4 w-4 text-slate-400" aria-hidden /> Radiation so far</h2>
          <p className="mt-3 text-3xl font-semibold">{a.cumulativeDoseMsv.toFixed(1)} <span className="text-base font-normal text-slate-400">mSv</span></p>
          <p className="mt-1 text-sm text-slate-400">
            Estimated from {MISSION_DAYS} days at about {env.radiationMsvPerDay} mSv/day in {env.name.toLowerCase()}. That is {(a.cumulativeDoseMsv / 6).toFixed(1)}% of NASA&apos;s 600 mSv career limit (NASA-STD-3001 Vol. 1, p. 40).
          </p>
        </section>
      </div>

      <SimulatedNote envName={env.name} />
    </div>
  );
}

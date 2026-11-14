import Link from "next/link";
import { ClipboardCheck, Eye, Radiation, Timer, Wind } from "lucide-react";
import { EscalationBadge } from "@/components/EscalationBadge";
import { ago } from "@/lib/checkup-schedule";
import { MetricChart } from "@/components/MetricChart";
import { StatusBadge } from "@/components/StatusBadge";
import { SleepOrbitCard, VitalSigns, type VitalReading } from "@/components/astromed";
import { listSleep } from "@/lib/sleep-store";
import { TipCard } from "@/components/TipCard";
import { tipsForAlerts } from "@/lib/tips";
import { formatValue, METRIC_GROUPS, MISSION_DAYS } from "@/lib/crew";
import { getMissionContext } from "@/lib/mission";
import { getMyHealth } from "@/lib/my-health";
import { requireViewer } from "@/lib/session";

function explain(deviation: number, worseWhen: "higher" | "lower") {
  const dir = worseWhen === "higher" ? "above" : "below";
  return `${Math.abs(deviation).toFixed(1)}× a normal day-to-day change ${dir} your usual level`;
}

export default async function MyVitalsPage() {
  const viewer = await requireViewer();
  const [{ env, member, sample, assessment: a, recordedDays, baselineSources, logs }, ctx, sleep] = await Promise.all([getMyHealth(viewer), getMissionContext(), listSleep(viewer)]);
  const flagged = a.metrics.filter((m) => m.status !== "good");
  const b = sample.baseline;
  void member;
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
  // Latest reading the person actually recorded, for the animated heartbeat card.
  const latestOwn = (key: string) => {
    const m = a.metrics.find((x) => x.def.key === key);
    if (!m) return null;
    const i = m.recorded.lastIndexOf(true);
    if (i < 0) return null;
    const ago = m.values.length - 1 - i;
    return { value: m.values[i], def: m.def, when: ago === 0 ? "Today" : ago === 1 ? "Yesterday" : `${ago} days ago` };
  };
  const hr = latestOwn("restingHr");
  const sys = latestOwn("systolic");
  const dia = latestOwn("diastolic");
  const temp = latestOwn("temperature");
  const spo2 = latestOwn("spo2");
  const readings: VitalReading[] = [
    { label: "Resting heart rate", value: hr ? String(Math.round(hr.value)) : null, unit: "bpm", when: hr?.when },
    { label: "Blood pressure", value: sys && dia ? `${Math.round(sys.value)}/${Math.round(dia.value)}` : null, unit: "mmHg", when: sys?.when },
    { label: "Body temperature", value: temp ? temp.value.toFixed(1) : null, unit: "°C", when: temp?.when },
    { label: "Oxygen saturation", value: spo2 ? String(Math.round(spo2.value)) : null, unit: "%", when: spo2?.when },
  ];

  // Latest space-specific checks: alertness, cabin air and vision.
  const lastOf = (id: string) => logs.find((l) => l.checkupId === id);
  const reaction = lastOf("reaction"), cabin = lastOf("cabin"), vision = lastOf("vision");
  const n = (l: typeof cabin, k: string) => (typeof l?.answers?.[k] === "number" ? (l.answers[k] as number) : undefined);
  const cabinParts = cabin ? [
    n(cabin, "co2Mmhg") !== undefined && `CO₂ ${n(cabin, "co2Mmhg")} mmHg`,
    n(cabin, "cabinTempC") !== undefined && `${n(cabin, "cabinTempC")} °C`,
    n(cabin, "humidityPct") !== undefined && `${n(cabin, "humidityPct")}% humidity`,
    n(cabin, "noiseDba") !== undefined && `${n(cabin, "noiseDba")} dBA`,
  ].filter(Boolean).join(" · ") : "";
  const spaceChecks = [
    { id: "reaction", icon: Timer, title: "Alertness", log: reaction, text: reaction ? `Median ${n(reaction, "rtMedianMs") ?? "—"} ms, ${n(reaction, "rtLapses") ?? 0} lapses` : "3-minute reaction-time test" },
    { id: "cabin", icon: Wind, title: "Cabin air and noise", log: cabin, text: cabin ? cabinParts || "Saved" : "CO₂, temperature, humidity, noise" },
    { id: "vision", icon: Eye, title: "Vision (SANS)", log: vision, text: vision ? (vision.escalation === "none" ? "No changes reported" : "Changes reported") : "Amsler grid and near-vision card" },
  ];

  const sim = member.simulated;
  const simulatedRows: [string, string][] = [
    ["Blood pressure", `${sim.systolic}/${sim.diastolic} mmHg`],
    ["Fasting blood glucose", `${sim.glucose} mg/dL`],
    ["Body temperature", `${sim.temperature.toFixed(1)} °C`],
    ["Oxygen saturation", `${sim.spo2}%`],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
          <h1 className="mt-1 text-2xl font-semibold">My vitals</h1>
          <p className="text-slate-400">Last {MISSION_DAYS} days · {env.name}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm">
        <p className="text-slate-200">
          {recordedDays === 0
            ? "You haven't recorded any readings yet, so these charts show sample data based on your baseline."
            : `Your own readings cover ${recordedDays} of the last ${MISSION_DAYS} days. Other days show sample data based on your baseline.`}
        </p>
        <Link href="/checkups/vitals" className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200">
          <ClipboardCheck className="h-4 w-4" aria-hidden /> Record vital signs
        </Link>
      </section>

      <VitalSigns readings={readings} heartRateBpm={hr?.value} />

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
          All tracked measures are within your personal normal range over the last 3 days.
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

      <section>
        <h2 className="mb-3 font-medium">Space checks</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {spaceChecks.map((c) => (
            <li key={c.id}>
              <Link href={`/checkups/${c.id}`} className="block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/25">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-medium"><c.icon className="h-4 w-4 text-sky-300" aria-hidden /> {c.title}</h3>
                  {c.log && <EscalationBadge level={c.log.escalation} />}
                </div>
                <p className="mt-2 text-sm text-slate-200">{c.text}</p>
                <p className="mt-1 text-xs text-slate-500">{c.log ? `Last done ${ago(c.log.createdAt)}` : "Not done yet · Start"}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SleepOrbitCard records={sleep.records} />
      {sleep.problem && <p className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">Couldn&apos;t load your sleep sessions: {sleep.problem}</p>}

      {METRIC_GROUPS.map((group) => (
        <section key={group}>
          <h2 className="mb-3 font-medium">{group}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {a.metrics.filter((m) => m.def.group === group).map((m) => (
              <MetricChart key={m.def.key} label={m.def.label} unit={m.def.unit} decimals={m.def.decimals} values={m.values} range={m.range} baseline={m.baseline} baselineKind={baselineSources[m.def.key] ? "yours" : m.def.baselineKind} recorded={m.recorded} />
            ))}
          </div>
        </section>
      ))}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-medium">Sample recording</h2>
          <p className="text-xs text-slate-500">Fills in any measure where you haven&apos;t entered a usual value or recorded {7} days of readings (MMASH participant {b.participant.replace("user_", "#")}). Charts marked &ldquo;Your baseline&rdquo; use your own values instead. <Link href="/profile" className="text-sky-300 hover:text-sky-200">Edit in My profile</Link>.</p>
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
          <p className="mt-3 text-3xl font-semibold">{ctx.doseSoFar.toFixed(1)} <span className="text-base font-normal text-slate-400">mSv</span></p>
          {ctx.none ? (
            <p className="mt-1 text-sm text-slate-400">No mission set, so no space radiation is counted. <Link href="/mission" className="text-sky-300 hover:text-sky-200">Add your mission</Link> to estimate your dose.</p>
          ) : (
            <p className="mt-1 text-sm text-slate-400">
              Estimated from {ctx.day} mission day{ctx.day === 1 ? "" : "s"}{ctx.mission ? "" : " (assumed)"} at about {env.radiationMsvPerDay} mSv/day in {env.name.toLowerCase()}. That is {(ctx.doseSoFar / 6).toFixed(1)}% of NASA&apos;s 600 mSv career limit (NASA-STD-3001 Vol. 1, p. 40).
            </p>
          )}
        </section>
      </div>

      <p className="text-xs text-slate-500">
        Baselines come from the MMASH dataset (Rossi et al., 2020). Days without your own reading are simulated from that baseline for {env.name.toLowerCase()}. Not medical advice.
      </p>
    </div>
  );
}

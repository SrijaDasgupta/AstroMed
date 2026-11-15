import { ago } from "@/lib/checkup-schedule";
import { BODY_PARTS, SYSTEMS, type BodyPart } from "@/lib/body";
import type { Escalation } from "@/lib/checkups";
import { CAREER_LIMIT_MSV, boneSeries } from "@/lib/hazards";
import { getMissionContext } from "@/lib/mission";
import { getMyHealth } from "@/lib/my-health";
import { requireViewer } from "@/lib/session";
import { loadProblems } from "@/lib/problems";
import { getProfile } from "@/lib/profile-store";
import { listRecords } from "@/lib/records-store";
import { BodyMap, type Bmi, type PartStatus, type PartView, type VitalCard } from "./BodyMap";

const RANK: Record<PartStatus, number> = { none: -1, good: 0, warning: 1, critical: 2 };
const fromEscalation = (e: Escalation): PartStatus => (e === "none" ? "good" : e === "routine" ? "warning" : "critical");

export default async function BodyPage({ searchParams }: { searchParams: Promise<{ part?: string }> }) {
  const viewer = await requireViewer();
  const [{ env, assessment, logs }, ctx] = await Promise.all([getMyHealth(viewer), getMissionContext()]);
  const day = Math.max(ctx.day, 0);
  const [{ views: noteViews, photos, areas, kinds, today, emergency }, profile, { records }] = await Promise.all([
    loadProblems(viewer),
    getProfile(viewer),
    viewer.kind === "user" ? listRecords(viewer) : Promise.resolve({ records: [] }),
  ]);
  const metric = (k: string) => assessment.metrics.find((m) => m.def.key === k)!;
  const card = (key: string, label: string, value: string, unit: string, k: string): VitalCard => {
    const m = metric(k);
    return { key, label, value, unit, status: m.status, values: m.values.slice(-14), range: m.range, mine: m.recorded[m.recorded.length - 1] };
  };
  const sys = metric("systolic"), dia = metric("diastolic"), hr = metric("restingHr"), sleep = metric("sleepHours");
  const vitals: VitalCard[] = [
    { ...card("bp", "Blood pressure", `${Math.round(sys.latest)}/${Math.round(dia.latest)}`, "mmHg", "systolic"), status: [sys.status, dia.status].includes("critical") ? "critical" : [sys.status, dia.status].includes("warning") ? "warning" : "good" },
    card("hr", "Resting heart rate", String(Math.round(hr.latest)), "bpm", "restingHr"),
    card("sleep", "Sleep", sleep.latest.toFixed(1), "h", "sleepHours"),
    card("temp", "Temperature", metric("temperature").latest.toFixed(1), "°C", "temperature"),
  ];
  const { heightCm, weightKg } = profile.details;
  const bmi: Bmi = heightCm && weightKg ? { value: weightKg / (heightCm / 100) ** 2, weightKg, heightCm } : null;
  const initial = (await searchParams).part;

  function view(p: BodyPart): PartView {
    const readings: PartView["readings"] = [];
    for (const key of p.metrics) {
      const m = assessment.metrics.find((x) => x.def.key === key)!;
      const mine = m.recorded[m.recorded.length - 1];
      readings.push({
        label: m.def.label,
        value: `${m.latest.toFixed(m.def.decimals)} ${m.def.unit}`,
        detail: `Your normal ${m.range[0].toFixed(m.def.decimals)}–${m.range[1].toFixed(m.def.decimals)} · ${mine ? "your reading today" : "sample data"}`,
        status: m.status,
      });
    }
    if (p.extra === "vision" || p.extra === "exercise") {
      const id = p.extra;
      const last = logs.find((l) => l.checkupId === id);
      const label = id === "vision" ? "Last vision check" : "Last exercise session";
      if (!last) readings.push({ label, value: "Not done yet", status: "none" });
      else {
        const a = last.answers ?? {};
        const value = id === "exercise" && typeof a.resistiveMin === "number"
          ? `${a.resistiveMin} min resistance, ${a.aerobicMin} min aerobic`
          : last.escalation === "none" ? "No problems reported" : "Follow-up suggested";
        readings.push({ label, value, detail: ago(last.createdAt), status: fromEscalation(last.escalation) });
      }
    }
    if (p.extra === "bone") {
      const pt = boneSeries(env, Math.max(day, 1), day)?.find((x) => x.day === day);
      readings.push(pt
        ? { label: "Estimated bone density loss so far", value: `${pt.low.toFixed(1)}–${pt.high.toFixed(1)}%`, detail: `${day} mission days in ${env.name.toLowerCase()}, before exercise benefit` }
        : { label: "Estimated bone density loss", value: "None expected", detail: "Earth gravity" });
    }
    if (p.extra === "radiation") {
      const dose = ctx.doseSoFar;
      readings.push({ label: "Estimated dose so far", value: `${dose.toFixed(1)} mSv`, detail: `${((dose / CAREER_LIMIT_MSV) * 100).toFixed(1)}% of the 600 mSv career limit` });
    }
    if (p.id === "immune") {
      // Indirect immune signs in the person's own logs over the last 14 days.
      const since = Date.now() - 14 * 86400000;
      const recent = logs.filter((l) => new Date(l.createdAt).getTime() >= since && l.answers);
      const fever = recent.filter((l) => typeof l.answers!.temperature === "number" && (l.answers!.temperature as number) >= 37.8).length;
      const sores = recent.filter((l) => l.answers!.coldSore === true).length;
      const colds = recent.filter((l) => l.answers!.congestion === true).length;
      const total = fever + sores + colds;
      readings.push({ label: "Immune-related signs, last 14 days", value: total === 0 ? "None logged" : [fever && `${fever} raised temperature`, sores && `${sores} cold sore or blisters`, colds && `${colds} cold symptoms`].filter(Boolean).join(", "), detail: "From your daily logs", status: total === 0 ? "good" : total >= 3 ? "warning" : "good" });
    }
    const statuses = readings.map((r) => r.status).filter(Boolean) as PartStatus[];
    const status = statuses.length === 0 ? "none" : statuses.reduce<PartStatus>((s, x) => (RANK[x] > RANK[s] ? x : s), "none");
    return { id: p.id, name: p.name, x: p.x, y: p.y, summary: p.summary, effects: p.effects, conditions: p.conditions, actions: p.actions, tipIds: p.tipIds, readings, status };
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">My body</h1>
        <p className="mt-1 text-slate-400">Tap a dot to see what spaceflight does to that part and your own data. Add anything you notice, such as pain or an injury, to get advice. Red pins are your own notes.</p>
      </div>
      <BodyMap
        parts={BODY_PARTS.map(view)}
        systems={SYSTEMS.map(view)}
        notes={noteViews}
        vitals={vitals}
        records={records.slice(0, 4).map((r) => ({ id: r.id, title: r.title, detail: r.recordedOn ?? r.createdAt.slice(0, 10) }))}
        bmi={bmi}
        areas={areas}
        kinds={kinds}
        photos={photos}
        emergency={emergency}
        today={today}
        initial={initial}
        canUpload={viewer.kind === "user"}
      />
    </div>
  );
}

import { ago } from "@/lib/checkup-schedule";
import { BODY_PARTS, SYSTEMS, type BodyPart } from "@/lib/body";
import type { Escalation } from "@/lib/checkups";
import { CAREER_LIMIT_MSV, boneSeries } from "@/lib/hazards";
import { MISSION_DAYS } from "@/lib/crew";
import { getMyHealth } from "@/lib/my-health";
import { requireViewer } from "@/lib/session";
import { BodyMap, type PartStatus, type PartView } from "./BodyMap";

const RANK: Record<PartStatus, number> = { none: -1, good: 0, warning: 1, critical: 2 };
const fromEscalation = (e: Escalation): PartStatus => (e === "none" ? "good" : e === "routine" ? "warning" : "critical");

export default async function BodyPage({ searchParams }: { searchParams: Promise<{ part?: string }> }) {
  const viewer = await requireViewer();
  const { env, assessment, logs } = await getMyHealth(viewer);
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
      const pt = boneSeries(env, MISSION_DAYS, MISSION_DAYS)?.find((x) => x.day === MISSION_DAYS);
      readings.push(pt
        ? { label: "Estimated bone density loss so far", value: `${pt.low.toFixed(1)}–${pt.high.toFixed(1)}%`, detail: `${MISSION_DAYS} days in ${env.name.toLowerCase()}, before exercise benefit` }
        : { label: "Estimated bone density loss", value: "None expected", detail: "Earth gravity" });
    }
    if (p.extra === "radiation") {
      const dose = env.radiationMsvPerDay * MISSION_DAYS;
      readings.push({ label: "Estimated dose so far", value: `${dose.toFixed(1)} mSv`, detail: `${((dose / CAREER_LIMIT_MSV) * 100).toFixed(1)}% of the 600 mSv career limit` });
    }
    const statuses = readings.map((r) => r.status).filter(Boolean) as PartStatus[];
    const status = statuses.length === 0 ? "none" : statuses.reduce<PartStatus>((s, x) => (RANK[x] > RANK[s] ? x : s), "none");
    return { id: p.id, name: p.name, x: p.x, y: p.y, summary: p.summary, effects: p.effects, conditions: p.conditions, actions: p.actions, tipIds: p.tipIds, readings, status };
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personal</p>
        <h1 className="mt-1 text-2xl font-semibold">My body</h1>
        <p className="mt-1 text-slate-400">Choose a body part to see what spaceflight does to it, what to watch for, and your own data. Dot colors show your status from your own data; grey means AstroMed doesn&apos;t measure that part (some show estimates instead).</p>
      </div>
      <BodyMap parts={BODY_PARTS.map(view)} systems={SYSTEMS.map(view)} initial={initial} />
      <p className="text-xs text-slate-500">For education and demonstration, not medical advice. For symptoms or concerns, contact your flight surgeon.</p>
    </div>
  );
}

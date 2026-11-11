import { loadLogs, type CheckupLog } from "@/lib/checkup-store";
import { assess, getCrewMember, METRICS, MISSION_DAYS, type MetricKey, type Readings } from "@/lib/crew";
import { daysBetween, localDate } from "@/lib/dates";
import { getCurrentEnvironment } from "@/lib/mission";
import { personalize } from "@/lib/personal-baseline";
import { getProfile } from "@/lib/profile-store";
import type { Viewer } from "@/lib/session";

const KEYS = new Set<string>(METRICS.map((m) => m.key));

/** Average the person's own readings per day over the last MISSION_DAYS days (last index = today). */
export function readingsFromLogs(logs: CheckupLog[], today = localDate()): { readings: Readings; recordedDays: number } {
  const sums: Partial<Record<MetricKey, { s: number; n: number }[]>> = {};
  const days = new Set<number>();
  for (const log of logs) {
    if (!log.answers) continue;
    const ago = daysBetween(localDate(new Date(log.createdAt)), today);
    if (ago < 0 || ago >= MISSION_DAYS) continue;
    const i = MISSION_DAYS - 1 - ago;
    for (const [k, v] of Object.entries(log.answers)) {
      if (!KEYS.has(k) || typeof v !== "number") continue;
      const arr = (sums[k as MetricKey] ??= Array.from({ length: MISSION_DAYS }, () => ({ s: 0, n: 0 })));
      arr[i].s += v;
      arr[i].n += 1;
      days.add(i);
    }
  }
  const readings: Readings = {};
  for (const [k, arr] of Object.entries(sums)) readings[k as MetricKey] = arr!.map((x) => (x.n ? x.s / x.n : undefined));
  return { readings, recordedDays: days.size };
}

/** Everything about the signed-in person: profile, mission, their checkups and their health assessment. */
export async function getMyHealth(viewer: Viewer) {
  const [env, profile, logResult] = await Promise.all([getCurrentEnvironment(), getProfile(viewer), loadLogs(viewer)]);
  const sample = getCrewMember(profile.crewId)!;
  // Your own usual values replace the sample recording's wherever you have them.
  const { me: member, sources: baselineSources, readingDays } = personalize(sample, profile.baseline, logResult.logs);
  const { readings, recordedDays } = readingsFromLogs(logResult.logs);
  // Demo mode shows scripted sample events so alerts can be explored; a real user's alerts come only from their own readings.
  const assessment = assess(member, env, { readings, events: viewer.kind === "demo" });
  return { env, profile, member, sample, ...logResult, assessment, recordedDays, baselineSources, readingDays };
}

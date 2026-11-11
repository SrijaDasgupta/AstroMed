import { cache } from "react";
import { cookies } from "next/headers";
import { daysBetween, localDate } from "@/lib/dates";
import { ENV_COOKIE, getEnvironment, type MissionEnvironment } from "@/lib/environments";
import { listMissions, type Mission } from "@/lib/missions-store";
import { getViewer } from "@/lib/session";

export type MissionContext = {
  env: MissionEnvironment;
  /** The user's own active mission, if they've added one. */
  mission?: Mission;
  /** Days of mission exposure so far (1 on the start day; 0 before it; capped at the planned end). */
  day: number;
  /** Planned length in days, if an end date is set. */
  length?: number;
  /** Days until the mission starts, if it hasn't yet. */
  startsIn?: number;
  /** Estimated radiation so far, mSv. */
  doseSoFar: number;
};

/** Default exposure period when the user hasn't added a mission with dates. */
export const DEFAULT_MISSION_DAY = 30;

/** The current mission: the user's active mission if they have one, otherwise the preset they picked. Cached per request. */
export const getMissionContext = cache(async (): Promise<MissionContext> => {
  const viewer = await getViewer();
  const missions = viewer ? await listMissions(viewer) : [];
  const mission = missions.find((m) => m.active);
  if (!mission) {
    const env = getEnvironment((await cookies()).get(ENV_COOKIE)?.value);
    return { env, day: DEFAULT_MISSION_DAY, doseSoFar: env.radiationMsvPerDay * DEFAULT_MISSION_DAY };
  }
  const preset = getEnvironment(mission.envType);
  const env: MissionEnvironment = mission.doseRate === undefined ? preset : {
    ...preset,
    radiation: `≈ ${mission.doseRate} mSv/day`,
    radiationMsvPerDay: mission.doseRate,
    radiationSource: "The dose rate you entered for this mission.",
  };
  const today = localDate();
  const length = mission.endDate ? daysBetween(mission.startDate, mission.endDate) + 1 : undefined;
  const since = daysBetween(mission.startDate, today);
  const day = since < 0 ? 0 : Math.min(since + 1, length ?? Infinity);
  return { env, mission, day, length, startsIn: since < 0 ? -since : undefined, doseSoFar: env.radiationMsvPerDay * day };
});

export async function getCurrentEnvironment() {
  return (await getMissionContext()).env;
}

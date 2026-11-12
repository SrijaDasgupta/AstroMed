/**
 * Daily food energy needs, from NASA-STD-3001 Vol. 2 Rev F, Table 7.1-1 (p. 116):
 *   men:   EER = 662 − 9.53 × age + AF × (15.9 × mass[kg] + 539.6 × height[m])
 *   women: EER = 354 − 6.91 × age + AF × (9.36 × mass[kg] + 726 × height[m])
 * NASA's minimum provisioning uses an activity factor of 1.25 ("active"); spacewalks add 200 kcal per
 * EVA hour (p. 116). Without the person's details, NASA's default is 3,035 kcal a day (p. 116).
 * Programs must provide 100% of each crewmember's calculated needs (Vol. 1 Rev C, p. 37).
 */
import type { Cite } from "@/lib/body";
import type { ProfileDetails } from "@/lib/profile-store";

export const ENERGY_CITE: Cite = { source: "std2", page: 116 };
export const INTAKE_CITE: Cite = { source: "std1", page: 37 };
export const VITAMIN_D_CITE: Cite = { source: "std2", page: 117 };
export const DEFAULT_KCAL = 3035;
export const ACTIVITY_FACTOR = 1.25;
export const EVA_KCAL_PER_HOUR = 200;

export type EnergyTarget = { kcal: number; basis: "profile" | "default"; missing: string[] };

export function energyTarget(d: ProfileDetails, year: number): EnergyTarget {
  const missing = [!d.birthYear && "birth year", !d.heightCm && "height", !d.weightKg && "weight", !d.sex && "sex"].filter(Boolean) as string[];
  if (!d.birthYear || !d.heightCm || !d.weightKg) return { kcal: DEFAULT_KCAL, basis: "default", missing };
  const age = year - d.birthYear, m = d.weightKg, h = d.heightCm / 100, af = ACTIVITY_FACTOR;
  const men = 662 - 9.53 * age + af * (15.9 * m + 539.6 * h);
  const women = 354 - 6.91 * age + af * (9.36 * m + 726 * h);
  const kcal = d.sex === "male" ? men : d.sex === "female" ? women : (men + women) / 2;
  return { kcal: Math.round(kcal / 10) * 10, basis: "profile", missing };
}

/** Today's target including spacewalk time. */
export const withEva = (t: EnergyTarget, evaHours = 0) => t.kcal + Math.round(EVA_KCAL_PER_HOUR * Math.max(0, evaHours));

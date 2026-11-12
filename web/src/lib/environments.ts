export type EnvironmentId = "earth-analog" | "leo" | "lunar-surface" | "mars-transit" | "mars-surface";

export type MissionEnvironment = {
  id: EnvironmentId;
  name: string;
  tagline: string;
  gravity: string;
  /** Approximate crew radiation dose, mSv per day. */
  radiation: string;
  /** Representative daily dose used by the simulation, mSv/day. */
  radiationMsvPerDay: number;
  /** Where the radiation figure comes from. */
  radiationSource: string;
  /** One-way signal delay to Earth. */
  commDelay: string;
  typicalDuration: string;
  keyRisks: string[];
};

// Radiation figures are cited from the NASA documents in data/raw/nasa (see radiationSource).
// Gravity and signal delay are physical constants; durations follow the radiation report's mission categories.
export const ENVIRONMENTS: MissionEnvironment[] = [
  {
    id: "earth-analog",
    name: "Earth analog",
    tagline: "Antarctic station or isolation habitat",
    gravity: "1 g",
    radiation: "≈ 0.01 mSv/day",
    radiationMsvPerDay: 0.01,
    radiationSource: "Typical natural background on Earth (about 3 mSv a year). General figure, not from the NASA documents.",
    commDelay: "None (can be simulated)",
    typicalDuration: "Weeks to 1 year",
    keyRisks: ["Isolation and confinement", "Sleep and circadian disruption", "Team dynamics"],
  },
  {
    id: "leo",
    name: "Low Earth orbit",
    tagline: "Space station, such as the ISS",
    gravity: "Microgravity",
    radiation: "≈ 0.7 mSv/day",
    radiationMsvPerDay: 0.7,
    radiationSource: "NASA estimates up to 250 mSv for a 30-day to 1-year mission in low Earth orbit (Radiation evidence report, Table 3, p. 54).",
    commDelay: "< 1 second",
    typicalDuration: "About 6 months",
    keyRisks: ["Bone and muscle loss", "Fluid shift and vision changes", "Sleep disruption", "Radiation"],
  },
  {
    id: "lunar-surface",
    name: "Lunar surface",
    tagline: "Artemis surface base or pressurized rover",
    gravity: "0.17 g",
    radiation: "≈ 0.9 mSv/day",
    radiationMsvPerDay: 0.9,
    radiationSource: "NASA estimates about 323 mSv for a 30-day to 1-year lunar orbit and surface mission (Radiation evidence report, Table 3, p. 54).",
    commDelay: "≈ 1.3 seconds",
    typicalDuration: "Under 30 days to 1 year",
    keyRisks: ["Radiation and solar storms", "Lunar dust exposure", "Spacewalk fatigue", "Partial gravity"],
  },
  {
    id: "mars-transit",
    name: "Mars transit",
    tagline: "Spacecraft cruising between planets",
    gravity: "Microgravity",
    radiation: "≈ 1.5 mSv/day",
    radiationMsvPerDay: 1.5,
    radiationSource: "NASA-STD-3001 Volume 1 uses 1.5 mSv/day for a transit to Mars (p. 44).",
    commDelay: "4–24 minutes",
    typicalDuration: "6–9 months each way",
    keyRisks: ["Deep-space radiation", "Bone and muscle loss", "No real-time help from Earth", "Behavioral health"],
  },
  {
    id: "mars-surface",
    name: "Mars surface",
    tagline: "Surface base or pressurized rover, long stay",
    gravity: "0.38 g",
    radiation: "≈ 0.5 mSv/day",
    radiationMsvPerDay: 0.5,
    radiationSource: "NASA-STD-3001 Volume 1 puts the Mars surface environment at about 0.5 mSv/day (p. 44).",
    commDelay: "4–24 minutes",
    typicalDuration: "Whole mission 730–1,224 days",
    keyRisks: ["Radiation", "Readapting to gravity after landing", "Dust", "Limited medical resupply"],
  },
];

export const DEFAULT_ENVIRONMENT: EnvironmentId = "leo";
export const ENV_COOKIE = "astromed_env";

export function getEnvironment(id: string | undefined): MissionEnvironment {
  return ENVIRONMENTS.find((e) => e.id === id) ?? ENVIRONMENTS.find((e) => e.id === DEFAULT_ENVIRONMENT)!;
}

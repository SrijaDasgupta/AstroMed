/**
 * Turns readings found in an imported photo ("Blood pressure: 128/82 mmHg", "Glucose: 5.2 mmol/L")
 * into AstroMed's own measures, so they feed My vitals, trends and alerts like a daily log does.
 * Units are converted where they can be recognised; values outside a plausible range are left out.
 * Pure functions, safe in the browser and on the server.
 */
import type { Measurement } from "@/lib/records-store";

/** The measures a photo can fill, in AstroMed's units. */
export type PhotoAnswers = Partial<Record<"systolic" | "diastolic" | "restingHr" | "temperature" | "spo2" | "glucose" | "weightKg", number>>;

export type MappedReading = { label: string; shown: string; key: keyof PhotoAnswers | "bloodPressure"; value: string; converted?: string };

export const PHOTO_LOG_ID = "photo";

const RANGES: Record<keyof PhotoAnswers, [number, number]> = {
  systolic: [60, 260], diastolic: [30, 160], restingHr: [25, 220], temperature: [33, 43], spo2: [50, 100], glucose: [20, 600], weightKg: [25, 250],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const num = (s: string) => Number(s.replace(",", ".").replace("−", "-"));
const inRange = (k: keyof PhotoAnswers, v: number) => Number.isFinite(v) && v >= RANGES[k][0] && v <= RANGES[k][1];
const round = (k: keyof PhotoAnswers, v: number) => Number(v.toFixed(k === "temperature" || k === "weightKg" ? 1 : 0));

function kind(label: string): keyof PhotoAnswers | "bloodPressure" | undefined {
  const l = norm(label);
  if (/^(bloodpressure|bp|nibp|pressure)$/.test(l)) return "bloodPressure";
  if (/^(sys|systolic|bpsystolic|systolicbloodpressure)$/.test(l)) return "systolic";
  if (/^(dia|diastolic|bpdiastolic|diastolicbloodpressure)$/.test(l)) return "diastolic";
  if (/^(pulse|pulserate|hr|heartrate|restingheartrate|restinghr|rhr|pr)$/.test(l)) return "restingHr";
  if (/^(temp|temperature|bodytemp|bodytemperature)$/.test(l)) return "temperature";
  if (/^(spo2|sp02|o2sat|o2saturation|oxygensaturation|oxygen|bloodoxygen|sao2|spo2percent)$/.test(l)) return "spo2";
  if (/^(glucose|bloodglucose|bloodsugar|glu|fastingglucose)$/.test(l)) return "glucose";
  if (/^(weight|bodyweight|mass|wt)$/.test(l)) return "weightKg";
  return undefined;
}

/**
 * Maps photo readings to AstroMed measures. Returns the answers to log and what was used, in the
 * person's own words, so the review screen can show exactly what will be added.
 */
export function mapPhotoReadings(measurements: readonly Measurement[]): { answers: PhotoAnswers; used: MappedReading[] } {
  const answers: PhotoAnswers = {};
  const used: MappedReading[] = [];
  for (const m of measurements) {
    const k = kind(m.label);
    if (!k || /^[<>≤≥]/.test(m.value.trim())) continue;
    const unit = m.unit.toLowerCase();
    const shown = `${m.value} ${m.unit}`.trim();

    if (k === "bloodPressure") {
      const parts = m.value.split("/").map((p) => num(p.trim()));
      if (parts.length !== 2 || unit.includes("kpa")) continue;
      const [sys, dia] = parts;
      if (!inRange("systolic", sys) || !inRange("diastolic", dia) || dia >= sys || answers.systolic !== undefined) continue;
      answers.systolic = Math.round(sys);
      answers.diastolic = Math.round(dia);
      used.push({ label: m.label, shown, key: k, value: `${answers.systolic}/${answers.diastolic} mmHg` });
      continue;
    }
    if (m.value.includes("/") || answers[k] !== undefined) continue;
    let v = num(m.value);
    let converted: string | undefined;
    if (k === "temperature" && (unit.includes("f") || v > 45)) { v = ((v - 32) * 5) / 9; converted = "°F to °C"; }
    if (k === "glucose" && (unit.includes("mmol") || v < 35)) { v = v * 18; converted = "mmol/L to mg/dL"; }
    if (k === "weightKg" && /^(lb|lbs|pound)/.test(unit)) { v = v * 0.45359237; converted = "lb to kg"; }
    if (!inRange(k, v)) continue;
    answers[k] = round(k, v);
    const unitOut = { systolic: "mmHg", diastolic: "mmHg", restingHr: "bpm", temperature: "°C", spo2: "%", glucose: "mg/dL", weightKg: "kg" }[k];
    used.push({ label: m.label, shown, key: k, value: `${answers[k]} ${unitOut}`, converted });
  }
  return { answers, used };
}

/** Plain names for the measures, for messages. */
export const PHOTO_MEASURE_NAMES: Record<MappedReading["key"], string> = {
  bloodPressure: "blood pressure", systolic: "systolic pressure", diastolic: "diastolic pressure", restingHr: "heart rate",
  temperature: "temperature", spo2: "oxygen saturation", glucose: "blood sugar", weightKg: "weight",
};

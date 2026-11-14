import { isValidReading, type RadiationEnvironment } from './radiation-readings';
import { type SleepRecord } from './sleep-records';

export type ImportCategory = 'health' | 'radiation' | 'sleep';

export type HealthPhotoRecord = {
  id: string;
  source: 'photo-import';
  title: string;
  findings: string;
  observedOn?: string;
};
export type PhotoRecord =
  | { category: 'health'; record: HealthPhotoRecord }
  | { category: 'radiation'; record: RadiationEnvironment }
  | { category: 'sleep'; record: SleepRecord };
export type PhotoDraft = {
  title: string;
  findings: string;
  observedOn: string;
  name: string;
  dose: string;
  unit: 'mSv' | 'µSv' | 'Sv';
  hours: string;
  start: string;
  end: string;
  offset: string;
  kind: SleepRecord['kind'];
};

const datePattern = '(\\d{4}-\\d{2}-\\d{2})[ T](\\d{2}:\\d{2})(?::00)?';
const offsetPattern = '(?:Z|[+-]\\d{2}:\\d{2})';
const stamp = (label: string) => new RegExp(`^(?:${label})(?:[ \\t]*:[ \\t]*|[ \\t]+)${datePattern}(${offsetPattern})?[ \\t]*$`, 'gim');

export function extractPhotoDetails(text: string): { category: ImportCategory | ''; draft: PhotoDraft } {
  const normalized = text.replace(/[μ]/g, 'µ').replace(/\r/g, '');
  const doseText = normalized.replace(/^.*\b(?:dose rate|average rate)\b.*$/gim, '');
  const doses = [...doseText.matchAll(/(?<![\w.,+−-])(\d+(?:\.\d+)?)\s*(msv|[µu]sv|sv)\b(?![ \t]*(?:\/|per\b))/gi)];
  const durations = [...normalized.matchAll(/^(?:exposure duration|exposure time|duration)\s*:[ \t]*(\d+(?:\.\d+)?)\s*(h|hr|hours?|min|minutes?)\s*$/gim)];
  const starts = [...normalized.matchAll(stamp('sleep start|bedtime|asleep at'))];
  const ends = [...normalized.matchAll(stamp('wake time|woke at|sleep end'))];
  const environment = [...normalized.matchAll(/^(?:mission environment|environment)[ \t]*:[ \t]*(.{1,80})$/gim)];
  const dose = doses.length === 1 ? doses[0] : undefined;
  const duration = durations.length === 1 ? durations[0] : undefined;
  const start = starts.length === 1 ? starts[0] : undefined;
  const end = ends.length === 1 ? ends[0] : undefined;
  const hasRadiation = doses.length > 0 || /\b(?:dosimeter|radiation|dose rate)\b/i.test(normalized);
  const hasSleep = starts.length > 0 || ends.length > 0 || /\b(?:sleep|bedtime|wake time)\b/i.test(normalized);
  const unit = dose?.[2]?.toLowerCase();
  const offset = start?.[3] && start[3] === end?.[3] ? start[3] : '';
  const draft: PhotoDraft = {
    title: '',
    findings: normalized.trim().slice(0, 12_000),
    observedOn: '',
    name: environment.length === 1 ? environment[0]?.[1]?.trim() ?? '' : '',
    dose: dose?.[1] ?? '',
    unit: unit === 'sv' ? 'Sv' : unit === 'µsv' || unit === 'usv' ? 'µSv' : 'mSv',
    hours: duration ? String(Number(duration[1]) / (/^min/i.test(duration[2] ?? '') ? 60 : 1)) : '',
    start: start ? `${start[1]}T${start[2]}` : '',
    end: end ? `${end[1]}T${end[2]}` : '',
    offset: offset === 'Z' ? '+00:00' : offset,
    kind: /^\s*nap\s*$/im.test(normalized) ? 'nap' : 'sleep',
  };
  const hasOtherHealthDetails = /\b(?:blood pressure|pulse|heart rate|spo2|oxygen saturation|temperature|glucose|weight|cholesterol|hemoglobin)\b/i.test(normalized);
  const category = hasOtherHealthDetails || hasRadiation === hasSleep ? 'health' : hasRadiation ? 'radiation' : 'sleep';
  return { category, draft };
}

function parseTimestamp(value: string, offset: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return NaN;
  const wallTime = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(wallTime) || new Date(wallTime).toISOString().slice(0, 16) !== value) return NaN;
  return Date.parse(`${value}:00${offset}`);
}

export function buildPhotoRecord(
  category: ImportCategory, draft: PhotoDraft, id: string,
): { entry: PhotoRecord } | { error: string } {
  if (category === 'health') {
    const title = draft.title.trim();
    const findings = draft.findings.trim();
    const observedOn = draft.observedOn || undefined;
    if (!title || title.length > 120 || !findings || findings.length > 12_000) {
      return { error: 'Add a title and at least one observation from the image.' };
    }
    if (observedOn && !Number.isFinite(parseTimestamp(`${observedOn}T00:00`, '+00:00'))) {
      return { error: 'Enter a valid observation date.' };
    }
    return { entry: { category, record: { id, title, findings, observedOn, source: 'photo-import' } } };
  }

  if (category === 'radiation') {
    const scale = { mSv: 1, 'µSv': 0.001, Sv: 1000 }[draft.unit];
    const record: RadiationEnvironment = {
      id, source: 'photo-import', name: draft.name.trim(),
      cumulativeDoseMsv: Number(draft.dose) * scale, durationHours: Number(draft.hours),
    };
    if (!record.name || record.name.length > 80 || !draft.dose.trim() || !draft.hours.trim() || !isValidReading(record)) {
      return { error: 'Enter an environment, a nonnegative cumulative dose, and a positive duration.' };
    }
    return { entry: { category, record } };
  }

  const offset = draft.offset.trim();
  if (!/^[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00)$/.test(offset) || offset === '-00:00') {
    return { error: 'Confirm the UTC offset for both times, such as +00:00 or -05:00.' };
  }
  const start = parseTimestamp(draft.start, offset);
  const end = parseTimestamp(draft.end, offset);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { error: 'Enter a valid sleep start and a later wake time, including both dates.' };
  }
  return { entry: { category, record: {
    id, source: 'photo-import', kind: draft.kind,
    startedAt: new Date(start).toISOString(), endedAt: new Date(end).toISOString(),
  } } };
}

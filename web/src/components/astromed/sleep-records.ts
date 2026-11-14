export type SleepStage = 'awake' | 'light' | 'deep' | 'rem';

export type SleepStageInterval = {
  stage: SleepStage;
  startedAt: string;
  endedAt: string;
};

export type SleepRecord = {
  id: string;
  kind: 'sleep' | 'nap';
  source: 'manual' | 'device' | 'simulated' | 'photo-import';
  startedAt: string;
  endedAt: string;
  stages?: readonly SleepStageInterval[];
};

export const dayMs = 86_400_000;
export const utcDay = (time: number) => Math.floor(time / dayMs) * dayMs;
export const dateKey = (time: number) => new Date(time).toISOString().slice(0, 10);
export const interval = ({ startedAt, endedAt }: Pick<SleepRecord, 'startedAt' | 'endedAt'>) =>
  ({ start: Date.parse(startedAt), end: Date.parse(endedAt) });

export const stageLabels: Record<SleepStage, string> = { awake: 'Awake', light: 'Light', deep: 'Deep', rem: 'REM' };
export const stageColors: Record<SleepStage, string> = { awake: '#fbbf24', light: '#38bdf8', deep: '#818cf8', rem: '#e879f9' };
export const sourceLabels: Record<SleepRecord['source'], string> = { manual: 'Crew-entered', device: 'Device recording', simulated: 'Simulated', 'photo-import': 'Photo import' };

export function formatSleepDuration(ms: number) {
  const minutes = Math.round(ms / 60_000);
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function getSleepStages(record: SleepRecord) {
  const { start, end } = interval(record);
  const stages = (record.stages ?? []).map((stage) => ({ ...stage, ...interval(stage) }))
    .filter((stage) => Object.prototype.hasOwnProperty.call(stageLabels, stage.stage) && stage.start >= start && stage.end <= end && stage.end > stage.start)
    .sort((a, b) => a.start - b.start);
  return stages.some((stage, index) => stage.start < (stages[index - 1]?.end ?? start)) ? [] : stages;
}

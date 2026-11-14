export type RadiationEnvironment = {
  id: string;
  name: string;
  source: 'measured' | 'simulated' | 'crew-entered' | 'photo-import';
  cumulativeDoseMsv: number;
  durationHours: number;
};

export const formatRadiation = (value: number) =>
  value.toLocaleString('en-US', { maximumSignificantDigits: 4 });

export function isValidReading({ cumulativeDoseMsv, durationHours }: Pick<RadiationEnvironment, 'cumulativeDoseMsv' | 'durationHours'>) {
  return Number.isFinite(cumulativeDoseMsv) && cumulativeDoseMsv >= 0 &&
    Number.isFinite(durationHours) && durationHours > 0 &&
    Number.isFinite(cumulativeDoseMsv / durationHours);
}

'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { button, field, inset, ModuleCard } from './ui';
import {
  dateKey, dayMs, formatSleepDuration, getSleepStages, interval, sourceLabels, stageColors, stageLabels, utcDay,
  type SleepRecord,
} from './sleep-records';
import styles from './motion.module.css';

export type SleepOrbitProps = {
  records?: readonly SleepRecord[];
  saveRecord?: (record: SleepRecord) => Promise<void>;
};

const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const timeLabel = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' });
const emptyRecords: readonly SleepRecord[] = [];

function planetPosition(fraction: number, radius: number) {
  const angle = fraction * 2 * Math.PI - Math.PI / 2;
  return { x: 150 + radius * Math.cos(angle), y: 150 + radius * Math.sin(angle) };
}

function OrbitChart({ days, selectedDay }: {
  days: readonly { start: number; periods: readonly { start: number; end: number; record: SleepRecord }[] }[];
  selectedDay: number;
}) {
  return (
    <svg viewBox="0 0 300 300" aria-hidden="true" className="mx-auto block w-full max-w-80">
      <path d="M150 28V272M28 150H272" stroke="#223854" strokeDasharray="2 5" />
      <g fill="#94a3b8" fontSize="9" textAnchor="middle">
        <text x="150" y="17">00:00</text>
        <text x="282" y="153">06:00</text>
        <text x="150" y="290">12:00</text>
        <text x="18" y="153">18:00</text>
      </g>
      <circle cx="150" cy="150" r="16" fill="#1b4460" stroke="#7dd3fc" />
      <ellipse cx="150" cy="150" rx="25" ry="6" transform="rotate(-25 150 150)" fill="none" stroke="#7dd3fc" />
      {days.map(({ start, periods }, index) => {
        const radius = 39 + index * 13;
        const circumference = 2 * Math.PI * radius;
        const selected = start === selectedDay;
        return (
          <g key={start} className={styles.sleepRing} opacity={selected ? 1 : 0.45}>
            <circle cx="150" cy="150" r={radius} fill="none" stroke={selected ? '#416382' : '#263952'} strokeWidth="2" />
            {periods.map((period) => {
              const fraction = (period.start - start) / dayMs;
              const length = (period.end - period.start) / dayMs * circumference;
              const point = planetPosition(fraction, radius);
              const color = period.record.kind === 'nap' ? '#c4b5fd' : '#38bdf8';
              return (
                <g key={period.record.id}>
                  <circle cx="150" cy="150" r={radius} fill="none" stroke={color} strokeWidth={selected ? 6 : 4}
                    strokeDasharray={`${length} ${circumference}`} strokeDashoffset={-fraction * circumference} transform="rotate(-90 150 150)" />
                  {selected && <circle cx={point.x} cy={point.y} r="3.25" fill="#ecfeff" className={styles.reveal} />}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function SleepStages({ record }: { record: SleepRecord }) {
  const stages = getSleepStages(record);
  // Stages only come from a device recording; don't flag their absence on entries typed in by hand.
  if (!stages.length) return record.source === 'device' ? <p className="mt-2 text-sm text-slate-400">No sleep-stage data for this session.</p> : null;
  const { start, end } = interval(record);
  const duration = end - start;
  return (
    <div className="mt-3">
      <p className="text-sm font-medium">Reported sleep stages</p>
      <div aria-hidden="true" className="relative mt-2 h-3 overflow-hidden rounded-full bg-slate-700">
        {stages.map((stage) => (
          <div key={stage.start} className={`absolute inset-y-0 ${styles.sleepStage}`}
            style={{ left: `${(stage.start - start) / duration * 100}%`, width: `${(stage.end - stage.start) / duration * 100}%`, background: stageColors[stage.stage] }} />
        ))}
      </div>
      <details className="mt-2 text-sm text-slate-300">
        <summary className="cursor-pointer">View stage intervals (UTC)</summary>
        <ul className="mt-2 space-y-1">
          {stages.map((stage) => <li key={stage.start}>{stageLabels[stage.stage]} · {timeLabel.format(stage.start)} – {timeLabel.format(stage.end)}</li>)}
        </ul>
      </details>
    </div>
  );
}

export function SleepOrbit({ records = emptyRecords, saveRecord }: SleepOrbitProps) {
  const [added, setAdded] = useState<SleepRecord[]>([]);
  const [weekEnd, setWeekEnd] = useState<number>();
  const [dayIndex, setDayIndex] = useState(6);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef<SleepRecord | null>(null);
  const submitting = useRef(false);
  const id = useId();

  const ids = new Set(records.map((record) => record.id));
  const sessions = [...records, ...added.filter((record) => !ids.has(record.id))]
    .map((record) => ({ record, ...interval(record) }))
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((a, b) => a.start - b.start);
  const latest = sessions.reduce((last, { end }) => Math.max(last, end - 1), -Infinity);
  const endOfWeek = weekEnd ?? (Number.isFinite(latest) ? utcDay(latest) : undefined);
  const days = endOfWeek === undefined ? [] : Array.from({ length: 7 }, (_, index) => {
    const start = endOfWeek - (6 - index) * dayMs;
    const periods = sessions.filter((session) => session.start < start + dayMs && session.end > start)
      .map((session) => ({ record: session.record, start: Math.max(session.start, start), end: Math.min(session.end, start + dayMs) }));
    return { start, periods };
  });
  const selected = days[dayIndex];

  async function logSleep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const start = Date.parse(`${data.get('start')}Z`);
    const end = Date.parse(`${data.get('end')}Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setMessage('Enter a wake time after the sleep start.');
      return;
    }
    if (sessions.some((record) => record.record.source !== 'simulated' && record.start < end && record.end > start)) {
      setMessage('That session overlaps an existing sleep entry.');
      return;
    }

    const kind = data.get('kind') === 'nap' ? 'nap' : 'sleep';
    const startedAt = new Date(start).toISOString();
    const endedAt = new Date(end).toISOString();
    const previous = pending.current;
    const record: SleepRecord = {
      id: previous?.startedAt === startedAt && previous.endedAt === endedAt && previous.kind === kind ? previous.id : crypto.randomUUID(),
      source: 'manual', kind, startedAt, endedAt,
    };
    pending.current = record;
    submitting.current = true;
    setSaving(true);
    setMessage('');
    try {
      await saveRecord?.(record);
      setAdded((previousRecords) => [...previousRecords, record]);
      setWeekEnd(utcDay(end - 1));
      setDayIndex(6);
      form.reset();
      pending.current = null;
      setMessage(saveRecord ? 'Sleep session saved.' : 'Sleep session added for this visit.');
    } catch {
      setMessage('Sleep session could not be saved. You can retry.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <ModuleCard title="Sleep orbit" intro="When you slept, not just how long. A steady sleep time helps keep your body clock on schedule.">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`min-w-0 ${inset}`}>
          <p className="text-sm text-slate-300">Each ring is one UTC day, with midnight at the top. Older days sit closer to the center. Cyan marks sleep and lavender marks naps.</p>
          {selected && endOfWeek !== undefined ? (
            <>
              <OrbitChart days={days} selectedDay={selected.start} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" className={button} onClick={() => setWeekEnd(endOfWeek - 7 * dayMs)}>Previous week</button>
                <span className="text-sm text-slate-300">{dateLabel.format(endOfWeek - 6 * dayMs)} – {dateLabel.format(endOfWeek)}</span>
                <button type="button" className={button} onClick={() => setWeekEnd(endOfWeek + 7 * dayMs)}>Next week</button>
              </div>
              <label className="mt-4 block text-sm" htmlFor={`${id}-day`}>Review day · {dateLabel.format(selected.start)} (UTC)</label>
              <input className="mt-2 block w-full accent-sky-400" id={`${id}-day`} type="range" min={0} max={6} step={1} value={dayIndex}
                aria-valuetext={`${dateLabel.format(selected.start)} UTC`} onChange={(event) => setDayIndex(Number(event.target.value))} />
              <div aria-live="polite" className="mt-4">
                <h3 className="text-sm font-semibold">{dateKey(selected.start)} · Sessions</h3>
                {selected.periods.length ? (
                  <ul className="mt-2 space-y-3">
                    {selected.periods.map(({ record, start, end }) => (
                      <li key={record.id} className={`rounded-lg border border-slate-700 p-3 ${styles.reveal}`}>
                        <p className="text-sm font-medium">{record.kind === 'nap' ? 'Nap' : 'Sleep'} · {sourceLabels[record.source]}</p>
                        <p className="mt-1 text-sm text-slate-300">{timeLabel.format(Date.parse(record.startedAt))} – {timeLabel.format(Date.parse(record.endedAt))} UTC</p>
                        <p className="mt-1 text-xs text-slate-400">{formatSleepDuration(end - start)} logged on this UTC day</p>
                        <SleepStages record={record} />
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-slate-400">No sleep logged on this day.</p>}
              </div>
            </>
          ) : <p className="mt-4 text-sm text-slate-400">Log your first sleep session to start the orbit.</p>}
        </div>
        <form className={`self-start ${inset}`} onSubmit={logSleep}>
          <h3 className="font-semibold">Log sleep or a nap</h3>
          <p className="mt-1 text-xs text-slate-300">
            Enter mission time (UTC, as used on the ISS). {saveRecord ? 'Sessions are saved.' : 'Entries are kept until you leave or reload.'} Hours slept in the Daily log still drive your sleep trend and alerts.
          </p>
          <fieldset disabled={saving} className="mt-3 min-w-0 space-y-3">
            <label className="block text-sm">
              Session type
              <select name="kind" className={`mt-1 ${field}`}><option value="sleep">Sleep</option><option value="nap">Nap</option></select>
            </label>
            <label className="block text-sm">
              Sleep start (UTC)
              <input name="start" required type="datetime-local" className={`mt-1 min-w-0 ${field}`} />
            </label>
            <label className="block text-sm">
              Wake time (UTC)
              <input name="end" required type="datetime-local" className={`mt-1 min-w-0 ${field}`} />
            </label>
            <button type="submit" className={button}>{saving ? 'Saving…' : 'Log session'}</button>
          </fieldset>
          <p role="status" className="mt-2 text-sm text-sky-200">{message}</p>
        </form>
      </div>
    </ModuleCard>
  );
}

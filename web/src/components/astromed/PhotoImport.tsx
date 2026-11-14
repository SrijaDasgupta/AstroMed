'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { buildPhotoRecord, extractPhotoDetails, type ImportCategory, type PhotoDraft, type PhotoRecord } from './photo-import-data';
import { formatRadiation } from './radiation-readings';
import { formatSleepDuration } from './sleep-records';
import { button, field, inset, ModuleCard } from './ui';

export type PhotoImportProps = {
  analyzeImage?: (image: File, signal: AbortSignal) => Promise<string>;
  /** Receives the confirmed record and the original photo. */
  saveRecord: (entry: PhotoRecord, image: File) => Promise<{ href?: string } | void>;
  /** False when health records can't be saved (demo mode): that option is then disabled. */
  canSaveHealth?: boolean;
};

const acceptedImages = ['image/jpeg', 'image/png', 'image/webp'];
const maxBytes = 15 * 1024 * 1024;
const labels = { health: 'My records', radiation: 'My exposure', sleep: 'Sleep orbit' };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 text-sm">{label}{children}</label>;
}

export function PhotoImport({ saveRecord, analyzeImage, canSaveHealth = true }: PhotoImportProps) {
  const imageFile = useRef<File | null>(null);
  const [preview, setPreview] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState<ImportCategory | ''>('');
  const [draft, setDraft] = useState(() => extractPhotoDetails('').draft);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ href?: string }>();
  const [message, setMessage] = useState('');
  const activeRead = useRef<AbortController | null>(null);
  const previewUrl = useRef('');
  const pending = useRef<{ fingerprint: string; id: string } | null>(null);
  const submitting = useRef(false);
  const candidate = category ? buildPhotoRecord(category, draft, '') : null;
  const inputClass = `mt-1 min-w-0 ${field}`;

  useEffect(() => () => {
    activeRead.current?.abort();
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);

  function edit<K extends keyof PhotoDraft>(key: K, value: PhotoDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setMessage('');
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    event.target.value = '';
    if (!image || submitting.current) return;
    if (!acceptedImages.includes(image.type) || image.size === 0 || image.size > maxBytes) {
      setMessage('Choose a JPEG, PNG, or WebP image up to 15 MB.');
      return;
    }

    activeRead.current?.abort();
    const controller = new AbortController();
    activeRead.current = controller;
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    imageFile.current = image;
    previewUrl.current = URL.createObjectURL(image);
    setPreview(previewUrl.current);
    setText('');
    setCategory(canSaveHealth ? 'health' : '');
    setDraft(extractPhotoDetails('').draft);
    setSaved(undefined);
    pending.current = null;
    setReading(true);
    setMessage('Reading the image…');
    const timeout = setTimeout(() => controller.abort(new Error('OCR timed out')), 45_000);
    try {
      const extract = analyzeImage ?? (await import('./photo-ocr')).readPhotoText;
      const recognized = (await extract(image, controller.signal)).trim();
      if (activeRead.current !== controller || controller.signal.aborted) return;
      const inferred = extractPhotoDetails(recognized);
      setText(recognized);
      setDraft(inferred.draft);
      setCategory(inferred.category === 'health' && !canSaveHealth ? '' : inferred.category);
      setMessage(recognized ? 'Check the extracted details against the photo before saving.' : 'No readable text found. Choose a record type and enter the details from the image.');
    } catch {
      if (activeRead.current === controller) setMessage('Could not read the image. Try another photo or enter the details below.');
    } finally {
      clearTimeout(timeout);
      if (activeRead.current === controller) {
        activeRead.current = null;
        setReading(false);
      }
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category || reading || submitting.current || saved) return;
    const fingerprint = JSON.stringify([category, draft]);
    const id = pending.current?.fingerprint === fingerprint ? pending.current.id : crypto.randomUUID();
    const result = buildPhotoRecord(category, draft, id);
    if ('error' in result) {
      setMessage(result.error);
      return;
    }
    pending.current = { fingerprint, id };
    submitting.current = true;
    setSaving(true);
    setMessage('');
    try {
      if (!imageFile.current) throw new Error('No photo');
      const response = await saveRecord(result.entry, imageFile.current);
      const href = response?.href;
      const internalHref = href?.startsWith('/') && !href.startsWith('//') && !/[\\\s]/.test(href) ? href : undefined;
      setSaved({ href: internalHref });
      setMessage(`Added to ${labels[category]}.`);
    } catch (error) {
      const reason = (error as { userMessage?: unknown })?.userMessage;
      setMessage(typeof reason === 'string' ? `Not saved: ${reason}` : 'The save could not be confirmed. Retry with the same details.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <ModuleCard title="Read a photo" intro="Take or choose a photo of a device screen, dosimeter, sleep tracker or lab report. AstroMed reads the text on this device, with no AI and no key, then you check it before saving.">
      <Field label="Photo (JPEG, PNG or WebP, up to 15 MB)">
        <input type="file" accept={acceptedImages.join(',')} disabled={saving} className={inputClass} onChange={upload} />
      </Field>
      {preview && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={`min-w-0 ${inset}`}>
            {/* A local preview of the chosen file (blob URL), so next/image doesn't apply. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected image for review" className="mx-auto max-h-96 max-w-full rounded-lg object-contain" />
            {text && <details className="mt-3 text-sm text-slate-300">
              <summary className="cursor-pointer">Extracted text</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words">{text}</pre>
            </details>}
          </div>
          <form className={`min-w-0 ${inset}`} onSubmit={save}>
            <h3 className="mb-3 font-semibold">Review reading</h3>
            <fieldset disabled={reading || saving || !!saved} className="min-w-0 space-y-3">
              <Field label="Record type">
                <select className={inputClass} required value={category} onChange={(event) => {
                  setCategory(event.target.value as ImportCategory | '');
                  setMessage('');
                }}>
                  <option value="">Choose record type</option>
                  <option value="health" disabled={!canSaveHealth}>Health record, kept with the photo in My records{canSaveHealth ? '' : ' (needs an account)'}</option>
                  <option value="radiation">Radiation reading for My exposure</option>
                  <option value="sleep">Sleep or nap for the Sleep orbit</option>
                </select>
              </Field>
              {category === 'health' && <>
                <Field label="Record title"><input className={inputClass} required maxLength={120} value={draft.title} onChange={(event) => edit('title', event.target.value)} /></Field>
                <Field label="Observation date (optional)"><input className={inputClass} type="date" value={draft.observedOn} onChange={(event) => edit('observedOn', event.target.value)} /></Field>
                <Field label="Findings to save"><textarea className={inputClass} required rows={8} maxLength={12000} value={draft.findings} onChange={(event) => edit('findings', event.target.value)} /></Field>
              </>}
              {category === 'radiation' && <>
                <Field label="Mission environment"><input className={inputClass} required maxLength={80} value={draft.name} onChange={(event) => edit('name', event.target.value)} /></Field>
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2">
                  <Field label="Cumulative dose"><input className={inputClass} required type="number" min="0" step="any" value={draft.dose} onChange={(event) => edit('dose', event.target.value)} /></Field>
                  <Field label="Dose unit"><select className={inputClass} value={draft.unit} onChange={(event) => edit('unit', event.target.value as PhotoDraft['unit'])}>
                    <option>mSv</option><option>µSv</option><option>Sv</option>
                  </select></Field>
                </div>
                <Field label="Exposure duration (hours)"><input className={inputClass} required type="number" min="0" step="any" value={draft.hours} onChange={(event) => edit('hours', event.target.value)} /></Field>
              </>}
              {category === 'sleep' && <>
                <Field label="Session type"><select className={inputClass} value={draft.kind} onChange={(event) => edit('kind', event.target.value as PhotoDraft['kind'])}>
                  <option value="sleep">Sleep</option><option value="nap">Nap</option>
                </select></Field>
                <Field label="Sleep start"><input className={inputClass} required type="datetime-local" value={draft.start} onChange={(event) => edit('start', event.target.value)} /></Field>
                <Field label="Wake time"><input className={inputClass} required type="datetime-local" value={draft.end} onChange={(event) => edit('end', event.target.value)} /></Field>
                <Field label="UTC offset for both times"><input className={inputClass} required placeholder="+00:00" value={draft.offset} onChange={(event) => edit('offset', event.target.value)} /></Field>
              </>}
              {candidate && 'entry' in candidate && candidate.entry.category !== 'health' && <p className="rounded-lg bg-sky-400/10 p-3 text-sm text-sky-200">
                {candidate.entry.category === 'radiation'
                  ? `${formatRadiation(candidate.entry.record.cumulativeDoseMsv)} mSv cumulative · ${formatRadiation(candidate.entry.record.cumulativeDoseMsv / candidate.entry.record.durationHours)} mSv/h average`
                  : `${formatSleepDuration(Date.parse(candidate.entry.record.endedAt) - Date.parse(candidate.entry.record.startedAt))} between start and wake time`}
              </p>}
              {category && <button className={button} type="submit">{saving ? 'Saving…' : `Add to ${labels[category]}`}</button>}
            </fieldset>
            {saved?.href && <a className="mt-3 inline-block text-sm text-sky-200 underline" href={saved.href}>Open {category ? labels[category] : 'the saved entry'}</a>}
          </form>
        </div>
      )}
      <p role="status" className="mt-3 text-sm text-sky-200">{message}</p>
    </ModuleCard>
  );
}

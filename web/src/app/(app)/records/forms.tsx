"use client";

import { useActionState, useEffect, useRef } from "react";
import { deleteRecordAction, importCsvAction, uploadRecordAction, type FormState } from "@/app/actions";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";

export function UploadForm({ kinds, disabled }: { kinds: { id: string; label: string }[]; disabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(uploadRecordAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <label className="block"><span className="text-sm text-slate-300">File (PDF, image, CSV or text, up to 10 MB)</span>
        <input name="file" type="file" required disabled={disabled} accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.csv,.txt,application/pdf,image/*,text/csv,text/plain" className="mt-1 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-slate-100 hover:file:bg-white/15" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="text-sm text-slate-300">Title</span><input name="title" maxLength={120} placeholder="e.g. Blood test, March" disabled={disabled} className={`mt-1 ${field}`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Type</span>
          <select name="kind" defaultValue="lab" disabled={disabled} className={`mt-1 ${field} bg-slate-900`}>{kinds.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Date of the record</span><input name="recordedOn" type="date" disabled={disabled} className={`mt-1 ${field} [color-scheme:dark]`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Notes (optional)</span><input name="notes" maxLength={500} disabled={disabled} className={`mt-1 ${field}`} /></label>
      </div>
      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-400">Uploaded.</p>}
      <button type="submit" disabled={pending || disabled} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">{pending ? "Uploading…" : "Upload record"}</button>
    </form>
  );
}

export function ImportForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(importCsvAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <label className="block"><span className="text-sm text-slate-300">CSV file (up to 2 MB)</span>
        <input name="file" type="file" required disabled={disabled} accept=".csv,.txt,text/csv,text/plain" className="mt-1 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-slate-100 hover:file:bg-white/15" />
      </label>
      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state.ok && <p role="status" className="text-sm text-emerald-300">{state.message}</p>}
      <button type="submit" disabled={pending || disabled} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50">{pending ? "Importing…" : "Import readings"}</button>
    </form>
  );
}

export function DeleteRecordButton({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteRecordAction} onSubmit={(e) => { if (!confirm(`Delete "${title}"? The file will be permanently removed.`)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-400 hover:border-rose-400/50 hover:text-rose-300">Delete</button>
    </form>
  );
}

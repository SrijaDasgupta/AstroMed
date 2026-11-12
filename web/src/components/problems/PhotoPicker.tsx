"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

/** One photo input with two ways in: the camera (opens it directly on phones) or the photo library. */
export function PhotoPicker({ disabled, compact = false }: { disabled: boolean; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  // Clear the file name when the form resets after saving.
  useEffect(() => {
    const form = input.current?.form;
    const onReset = () => setName("");
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, []);
  const open = (camera: boolean) => {
    const el = input.current;
    if (!el) return;
    if (camera) el.setAttribute("capture", "environment");
    else el.removeAttribute("capture");
    el.click();
  };
  const clear = () => { if (input.current) input.current.value = ""; setName(""); };
  const btn = `inline-flex items-center gap-1.5 rounded-lg border border-white/15 ${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={input} name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" disabled={disabled} className="sr-only" tabIndex={-1} aria-hidden
        onChange={(e) => setName(e.target.files?.[0]?.name ?? "")} />
      <button type="button" disabled={disabled} onClick={() => open(true)} className={btn}><Camera className="h-4 w-4" aria-hidden />Take photo</button>
      <button type="button" disabled={disabled} onClick={() => open(false)} className={btn}><ImagePlus className="h-4 w-4" aria-hidden />Choose photo</button>
      {disabled && <span className="text-xs text-slate-500">Photos need an account</span>}
      {name && (
        <span className="inline-flex items-center gap-1 text-xs text-slate-300">
          {name}
          <button type="button" onClick={clear} aria-label="Remove photo" className="rounded p-0.5 hover:bg-white/10"><X className="h-3.5 w-3.5" aria-hidden /></button>
        </span>
      )}
    </div>
  );
}

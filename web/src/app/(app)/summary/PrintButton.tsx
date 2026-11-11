"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 print:hidden">
      <Printer className="h-4 w-4" aria-hidden /> Print or save as PDF
    </button>
  );
}

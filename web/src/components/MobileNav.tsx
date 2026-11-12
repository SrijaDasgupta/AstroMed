"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/** On small screens the menu lives behind a corner button and slides in from the left. */
export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-menu"
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-sm text-slate-200 hover:bg-white/5">
        <Menu className="h-4 w-4" aria-hidden />Menu
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden />
          <div id="mobile-menu" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-white/10 bg-background p-4 shadow-2xl">
            <button type="button" onClick={() => setOpen(false)} className="mb-2 ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" aria-hidden />Close
            </button>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

import { useId, type ReactNode } from "react";

export const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#38bdf8]";
export const button = `rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm text-sky-100 hover:bg-sky-400/20 disabled:opacity-50 ${focus}`;
export const field = `w-full rounded-lg border border-slate-600 bg-[#070b16] px-3 py-2 text-slate-100 ${focus}`;
export const inset = "rounded-xl border border-sky-400/15 bg-[#0c1425] p-4";

/** Card styled to match the rest of AstroMed. */
export function ModuleCard({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-slate-100 sm:p-5">
      <h2 id={heading} className="text-lg font-medium">{title}</h2>
      {intro && <p className="mt-1 text-sm text-slate-400">{intro}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

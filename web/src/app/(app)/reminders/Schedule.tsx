"use client";

import { useEffect, useState } from "react";
import { AlarmClock, Check, Clock, Pill, X } from "lucide-react";
import { reminderItemAction } from "@/app/actions";
import type { ScheduleItem } from "@/lib/reminder-store";

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Btn({ item, op, children, tone = "plain" }: { item: ScheduleItem; op: string; children: React.ReactNode; tone?: "primary" | "plain" }) {
  return (
    <form action={reminderItemAction}>
      <input type="hidden" name="kind" value={item.kind} />
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="time" value={item.time} />
      <input type="hidden" name="op" value={op} />
      <button type="submit" className={tone === "primary" ? "inline-flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-sky-400" : "inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"}>
        {children}
      </button>
    </form>
  );
}

export function Schedule({ items }: { items: ScheduleItem[] }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    setNow(nowHHMM());
    const t = setInterval(() => setNow(nowHHMM()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (items.length === 0) return <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">Nothing scheduled today. Add a medicine or reminder below.</p>;

  const open = items.filter((i) => i.state === "open");
  const dueCount = now ? open.filter((i) => i.time <= now).length : 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">{items.length - open.length} of {items.length} done{dueCount > 0 ? ` · ${dueCount} due now` : ""}</p>
      <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">
        {items.map((i) => {
          const due = i.state === "open" && now !== null && i.time <= now;
          const Icon = i.kind === "med" ? Pill : AlarmClock;
          return (
            <li key={i.key} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${due ? "bg-amber-300/5" : ""}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-12 shrink-0 tabular-nums text-sm text-slate-300">{i.time}</span>
                <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <div className="min-w-0">
                  <p className={`truncate text-sm ${i.state === "open" ? "text-slate-100" : "text-slate-400 line-through decoration-slate-500"}`}>{i.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {i.kind === "med" ? "Medicine" : "Reminder"}{i.detail ? ` · ${i.detail}` : ""}
                    {due && <span className="ml-2 inline-flex items-center gap-1 text-amber-200"><Clock className="h-3 w-3" aria-hidden />Due</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {i.state === "open" ? (
                  i.kind === "med" ? (
                    <>
                      <Btn item={i} op="taken" tone="primary"><Check className="h-4 w-4" aria-hidden />Taken</Btn>
                      <Btn item={i} op="skipped"><X className="h-4 w-4" aria-hidden />Skip</Btn>
                    </>
                  ) : (
                    <Btn item={i} op="done" tone="primary"><Check className="h-4 w-4" aria-hidden />Done</Btn>
                  )
                ) : (
                  <>
                    <span className="text-xs text-slate-400">{i.state === "taken" ? "Taken" : i.state === "skipped" ? "Skipped" : "Done"}</span>
                    <Btn item={i} op="undo">Undo</Btn>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

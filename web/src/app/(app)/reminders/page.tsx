import { AlarmClock, BadgeCheck, ExternalLink, Info, Minus, Pill, TrendingDown, TrendingUp } from "lucide-react";
import { loadLogs, type CheckupLog } from "@/lib/checkup-store";
import { adherence, assessEffect, getPurpose, type EffectStatus } from "@/lib/med-effect";
import { reminderItemAction } from "@/app/actions";
import { NotificationToggle } from "@/components/ReminderNotifier";
import { loadSchedule, todaySchedule, type Medication, type MedLog, type Reminder, type SideEffect } from "@/lib/reminder-store";
import { requireViewer } from "@/lib/session";
import { pageHref, pageLabel, SOURCES, type SourceId } from "@/lib/tips";
import { LogDoseButton, MedicationForm, ReminderForm, SideEffectForm } from "./forms";
import { describeSchedule } from "@/lib/med-schedule";
import { Schedule } from "./Schedule";

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const days = (d: number[]) => (d.length === 7 ? "Every day" : d.map((x) => DAY[x]).join(", "));

const FACTS: { text: string; source: SourceId; page: number }[] = [
  { text: "On the ISS, medicines are most often used for sleep, headache, congestion and space motion sickness. 44.7% of crew used sleep aids during the mission; 47% took motion sickness medicine, mostly on day one.", source: "pharma", page: 9 },
  { text: "Spaceflight changes how medicines behave in the body: stomach emptying changes, and food moves through the gut faster and less predictably.", source: "pharma", page: 4 },
  { text: "Medicines can interact. For example, a drug used for dizziness on landing can cause restlessness when taken with a common motion sickness medicine.", source: "cardio", page: 36 },
  { text: "Sleep medication is the most common sleep countermeasure on the ISS, but how well it works in flight is still unknown.", source: "sleep", page: 5 },
  { text: "Missions of 1–5 years will outlast typical medicine expiry dates of 1–2 years.", source: "pharma", page: 3 },
];

function ItemControls({ kind, id, active }: { kind: "med" | "rem"; id: string; active: boolean }) {
  return (
    <div className="flex gap-2">
      <form action={reminderItemAction}>
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={active ? "stop" : "resume"} />
        <button type="submit" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/5">{active ? "Pause" : "Resume"}</button>
      </form>
      <form action={reminderItemAction}>
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="remove" />
        <button type="submit" className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-400 hover:border-rose-400/50 hover:text-rose-300">Remove</button>
      </form>
    </div>
  );
}

const EFFECT_STYLE: Record<EffectStatus, { icon: typeof TrendingUp; cls: string; label: string }> = {
  better: { icon: TrendingUp, cls: "text-emerald-300", label: "Looks like it's helping" },
  same: { icon: Minus, cls: "text-slate-300", label: "No clear change yet" },
  worse: { icon: TrendingDown, cls: "text-amber-300", label: "Going the wrong way" },
  early: { icon: Minus, cls: "text-slate-400", label: "Too early to tell" },
  "no-before": { icon: Minus, cls: "text-slate-400", label: "Tracking from now" },
  untracked: { icon: Minus, cls: "text-slate-500", label: "Not compared" },
};

const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function MedCard({ m, history, effects, logs, today }: { m: Medication; history: MedLog[]; effects: SideEffect[]; logs: CheckupLog[]; today: string }) {
  const purpose = getPurpose(m.purpose);
  const mineLogs = history.filter((h) => h.medicationId === m.id);
  const taken = adherence(m, mineLogs, today);
  const asNeeded = m.schedule === "as-needed";
  const asNeededDoses = asNeeded ? mineLogs.filter((h) => h.status === "taken") : [];
  const effect = m.active ? assessEffect(m.purpose, m.startedOn, logs, today) : undefined;
  const style = effect && EFFECT_STYLE[effect.status];
  const mine = effects.filter((e) => e.medicationId === m.id).slice(0, 3);
  return (
    <li className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${m.active ? "" : "text-slate-500"}`}>{m.name}{m.dose && <span className="font-normal text-slate-400"> · {m.dose}</span>}{!m.active && <span className="ml-2 text-xs font-normal">(paused)</span>}</p>
          <p className="text-xs text-slate-300">{describeSchedule(m, today)}</p>
          <p className="text-xs text-slate-500">{[m.instructions, purpose && `for ${purpose.label.toLowerCase()}`, m.startedOn && `since ${fmtDay(m.startedOn)}`].filter(Boolean).join(" · ")}</p>
          {m.confirmed && <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300"><BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Dose confirmed with your doctor</p>}
        </div>
        <ItemControls kind="med" id={m.id} active={m.active} />
      </div>
      {m.active && asNeeded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">{asNeededDoses.length === 0 ? "No doses logged in the last 4 weeks." : `${asNeededDoses.length} dose${asNeededDoses.length === 1 ? "" : "s"} in the last 4 weeks · last ${fmtDay(asNeededDoses.map((d) => d.date).sort().at(-1)!)}`}</p>
          <LogDoseButton medicationId={m.id} />
        </div>
      )}
      {m.active && taken && (
        <div>
          <div className="flex justify-between text-xs text-slate-400"><span>Doses taken, last {taken.days} day{taken.days === 1 ? "" : "s"}</span><span className="tabular-nums">{taken.taken} of {taken.expected} ({taken.pct}%)</span></div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${taken.pct >= 80 ? "bg-emerald-400" : "bg-amber-300"}`} style={{ width: `${taken.pct}%` }} /></div>
        </div>
      )}
      {effect && style && effect.status !== "untracked" && (
        <div className="rounded-xl bg-white/[0.04] p-3 text-sm">
          <p className={`flex items-center gap-1.5 font-medium ${style.cls}`}><style.icon className="h-4 w-4" aria-hidden /> {style.label}</p>
          <p className="mt-1 text-slate-300">{effect.text}{taken && taken.pct < 70 && (effect.status === "same" || effect.status === "worse") ? ` You took ${taken.pct}% of doses, which can make it look less effective.` : ""}</p>
        </div>
      )}
      {mine.length > 0 && (
        <ul className="space-y-1 text-xs text-slate-400">
          {mine.map((e) => <li key={e.id}>Side effect, {fmtDay(e.date)}: <span className={e.severity === "severe" ? "text-rose-300" : "text-slate-300"}>{e.severity === "moderate" ? "bothering me" : e.severity}</span>{e.note ? ` · ${e.note}` : ""}</li>)}
        </ul>
      )}
      {m.active && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-sky-300 hover:text-sky-200">Note a side effect</summary>
          <SideEffectForm medicationId={m.id} />
        </details>
      )}
    </li>
  );
}

function RemRow({ r }: { r: Reminder }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className={`text-sm font-medium ${r.active ? "" : "text-slate-500"}`}>{r.title}{!r.active && <span className="ml-2 text-xs font-normal">(paused)</span>}</p>
        <p className="text-xs text-slate-500">{r.times.join(", ")} · {days(r.days)}</p>
      </div>
      <ItemControls kind="rem" id={r.id} active={r.active} />
    </li>
  );
}

export default async function RemindersPage() {
  const viewer = await requireViewer();
  const [data, { logs }] = await Promise.all([loadSchedule(viewer), loadLogs(viewer)]);
  const items = todaySchedule(data);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Medicines and reminders</h1>
        <p className="mt-1 text-slate-400">Your medicines as prescribed, your own reminders, and today&apos;s schedule.</p>
      </div>

      {data.problem && <p className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">Couldn&apos;t load everything: {data.problem}</p>}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Today</h2>
          <NotificationToggle />
        </div>
        <Schedule items={items} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-medium"><Pill className="h-5 w-5 text-slate-400" aria-hidden /> My medicines</h2>
          {data.meds.length > 0 && <p className="text-xs text-slate-400">Trouble breathing, swelling of the face or throat, chest pain or fainting after a dose: contact your flight surgeon now.</p>}
          {data.meds.length > 0 && <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">{data.meds.map((m) => <MedCard key={m.id} m={m} history={data.medHistory} effects={data.effects} logs={logs} today={data.today} />)}</ul>}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="mb-3 text-sm font-medium">Add a medicine</h3>
            <MedicationForm />
            <p className="mt-3 text-xs text-slate-500">Enter the medicine and dose your flight surgeon or doctor prescribed. Pick what it&apos;s for and AstroMed compares your readings before and after you started.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-medium"><AlarmClock className="h-5 w-5 text-slate-400" aria-hidden /> My reminders</h2>
          {data.reminders.length > 0 && <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">{data.reminders.map((r) => <RemRow key={r.id} r={r} />)}</ul>}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="mb-3 text-sm font-medium">Add a reminder</h3>
            <ReminderForm />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 font-medium"><Info className="h-4 w-4 text-sky-300" aria-hidden /> Medicines in spaceflight: what NASA reports</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {FACTS.map((f) => (
            <li key={f.text}>
              {f.text}{" "}
              <a href={pageHref(SOURCES[f.source], f.page)} target="_blank" rel="noopener noreferrer" title={SOURCES[f.source].title} className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
                {pageLabel(SOURCES[f.source], f.page)} <ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens the source in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500">
        {viewer.kind === "demo" ? "Demo mode: medicines and reminders are kept in this browser for 7 days." : "Saved to your account. Only you can see them."}
      </p>
    </div>
  );
}

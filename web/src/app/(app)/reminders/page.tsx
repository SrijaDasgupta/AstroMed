import { AlarmClock, ExternalLink, Info, Pill } from "lucide-react";
import { reminderItemAction } from "@/app/actions";
import { NotificationToggle } from "@/components/ReminderNotifier";
import { loadSchedule, todaySchedule, type Medication, type Reminder } from "@/lib/reminder-store";
import { requireViewer } from "@/lib/session";
import { SOURCES, type SourceId } from "@/lib/tips";
import { MedicationForm, ReminderForm } from "./forms";
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

function MedRow({ m }: { m: Medication }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className={`text-sm font-medium ${m.active ? "" : "text-slate-500"}`}>{m.name}{m.dose && <span className="font-normal text-slate-400"> · {m.dose}</span>}{!m.active && <span className="ml-2 text-xs font-normal">(paused)</span>}</p>
        <p className="text-xs text-slate-500">{m.times.join(", ")}{m.instructions ? ` · ${m.instructions}` : ""}</p>
      </div>
      <ItemControls kind="med" id={m.id} active={m.active} />
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
  const data = await loadSchedule(viewer);
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
          {data.meds.length > 0 && <ul className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.03]">{data.meds.map((m) => <MedRow key={m.id} m={m} />)}</ul>}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="mb-3 text-sm font-medium">Add a medicine</h3>
            <MedicationForm />
            <p className="mt-3 text-xs text-slate-500">Enter medicines exactly as your flight surgeon or doctor prescribed. AstroMed reminds you; it doesn&apos;t recommend medicines or doses.</p>
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
              <a href={`${SOURCES[f.source].url}#page=${f.page}`} target="_blank" rel="noopener noreferrer" title={SOURCES[f.source].title} className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-slate-500 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
                {SOURCES[f.source].short}, p. {f.page} <ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens NASA PDF in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">Information only. Always check with your flight surgeon before starting, stopping or combining medicines.</p>
      </section>

      <p className="text-xs text-slate-500">
        {viewer.kind === "demo" ? "Demo mode: medicines and reminders are kept in this browser for 7 days." : "Saved to your account. Only you can see them."}
      </p>
    </div>
  );
}

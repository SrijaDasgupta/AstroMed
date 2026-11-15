/**
 * Sample data for the demo, so a first-time visitor (or a judge) sees every feature working:
 * a Mars-transit mission on day 59, two weeks of daily logs built around the sample astronaut's own
 * baseline, a couple of ongoing problems, journal entries, medicines and reminders, and a habit streak.
 * Everything lives in short-lived demo cookies; nothing touches the database.
 */
import { cookies } from "next/headers";
import type { BodyNote } from "@/lib/body-notes";
import { DEMO_BODY_COOKIE } from "@/lib/body-notes-store";
import { DEMO_LOGS_COOKIE_NAME, fitDemoLogs } from "@/lib/checkup-store";
import { CREW, METRICS, type MetricKey } from "@/lib/crew";
import { DAILY_LOG_ID, evaluateDailyLog } from "@/lib/daily-log";
import type { SleepRecord } from "@/components/astromed/sleep-records";
import { addDays, localDate, middayOf, weekdayOf } from "@/lib/dates";
import { ENV_COOKIE } from "@/lib/environments";
import { DEMO_JOURNAL_COOKIE, type JournalEntry } from "@/lib/journal-store";
import { DEMO_MISSIONS_COOKIE, type Mission } from "@/lib/missions-store";
import { energyTarget } from "@/lib/nutrition";
import { DEMO_COOKIES } from "@/lib/profile-store";
import { DEMO_MEDS_COOKIE } from "@/lib/reminder-store";
import { TIPS } from "@/lib/tips";

const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" };

function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;
/** An instant on a given day, `hour` hours after local midnight (approximately, via local noon). */
const at = (date: string, hour: number) => new Date(middayOf(date).getTime() + (hour - 12) * 3600000);

export async function seedDemo() {
  const store = await cookies();
  const today = localDate();
  const year = Number(today.slice(0, 4));
  const member = CREW[0];
  const rand = random(20261112);
  const noise = () => (rand() + rand() + rand() - 1.5) * 0.8; // roughly ±1 SD
  const base = (k: MetricKey) => { const d = METRICS.find((m) => m.key === k)!; const b = d.baseline(member); return { b, sd: d.dailySd(b, member) }; };

  // Profile: details for NASA's energy formula; weight falls over two weeks to show the nutrition alert.
  const startWeight = 77.4;
  const details = { birthYear: year - 34, sex: "male" as const, heightCm: 178, weightKg: 75.1 };
  store.set(DEMO_COOKIES[0], JSON.stringify({ n: "Demo astronaut", c: member.id, d: details, b: {} }), options);
  const target = energyTarget(details, year).kcal;

  // Mission: Mars transit, day 59 of 210.
  const mission: Mission = {
    id: "demo-mission", name: "Ares Transit 1", envType: "mars-transit", startDate: addDays(today, -58), endDate: addDays(today, 151),
    location: "Deep-space transit vehicle", crewSize: 4, objectives: "Cruise to Mars: daily health checks, exercise and science on the way.", active: true,
  };
  store.set(DEMO_MISSIONS_COOKIE, JSON.stringify([mission]), options);
  store.delete(ENV_COOKIE);

  // Two weeks of daily logs. Systolic pressure climbs over the last three days so the demo shows an alert;
  // food intake runs below the energy need and weight drifts down.
  const hr = base("restingHr"), sys = base("systolic"), dia = base("diastolic"), temp = base("temperature"), glu = base("glucose");
  const logs: unknown[] = [];
  for (let n = 13; n >= 0; n--) {
    const date = addDays(today, -n);
    const rising = n <= 2 ? 2.4 + rand() * 0.4 : noise();
    const eva = n === 1 ? 6.5 : 0;
    const answers: Record<string, number> = {
      restingHr: Math.round(hr.b + hr.sd * noise()),
      systolic: Math.round(sys.b + sys.sd * rising),
      diastolic: Math.round(dia.b + dia.sd * (n <= 2 ? 1.6 : noise())),
      temperature: r1(temp.b + temp.sd * noise() * 0.6),
      glucose: Math.round(glu.b + glu.sd * noise()),
      // Shorter sleep until a prescribed sleep medicine was started 4 days ago, so My medicines can show the before-and-after.
      sleepHours: r1(n >= 5 ? ([7, 11].includes(n) ? 5.1 + rand() * 0.4 : 5.6 + rand() * 0.5) : 6.6 + rand() * 0.6),
      resistiveMin: [4, 9, 12].includes(n) ? 0 : 40 + Math.round(rand() * 4) * 5,
      aerobicMin: 25 + Math.round(rand() * 3) * 5,
      mood: n === 1 ? 2 : n === 0 ? 3 : 4,
      stress: n <= 1 ? 4 : 2,
      waterL: r1(2.2 + rand() * 0.7),
      kcal: Math.round((target * (0.76 + rand() * 0.12) + (eva ? 600 : 0)) / 10) * 10,
      weightKg: r1(startWeight - ((13 - n) / 13) * (startWeight - details.weightKg) + (rand() - 0.5) * 0.2),
      ...(eva ? { evaHours: eva } : {}),
    };
    const { level } = evaluateDailyLog(member, answers, target);
    logs.push([member.id, DAILY_LOG_ID, level, Math.floor(at(date, 8).getTime() / 1000), answers]);
  }
  logs.push([member.id, "vision", "none", Math.floor(at(addDays(today, -5), 9).getTime() / 1000)]);
  store.set(DEMO_LOGS_COOKIE_NAME, JSON.stringify(fitDemoLogs(logs)), options);

  // Sleep orbit: the last week's nights with start and wake times (UTC), matching the logged hours, plus a nap after the spacewalk.
  const sleepHours = new Map<number, number>();
  for (const l of logs) {
    const row = l as [string, string, string, number, Record<string, number>?];
    if (row[4]?.sleepHours) sleepHours.set(Math.round((Date.now() / 1000 - row[3]) / 86400), row[4].sleepHours);
  }
  const wakeUtc = (n: number) => { const d = new Date(); d.setUTCHours(6, 30, 0, 0); return d.getTime() - n * 86_400_000; };
  const session = (kind: SleepRecord["kind"], start: number, end: number): SleepRecord =>
    ({ id: crypto.randomUUID(), kind, source: "manual", startedAt: new Date(start).toISOString(), endedAt: new Date(end).toISOString() });
  const sleep: SleepRecord[] = [6, 5, 4, 3, 2, 1, 0].filter((n) => sleepHours.has(n)).map((n) => {
    const end = wakeUtc(n) - Math.round(rand() * 4) * 5 * 60_000;
    return session("sleep", end - sleepHours.get(n)! * 3_600_000, end);
  });
  const napStart = wakeUtc(1) + 7.5 * 3_600_000;
  sleep.push(session("nap", napStart, napStart + 40 * 60_000));
  await (await import("@/lib/sleep-store")).writeDemoSleep(sleep.filter((r) => Date.parse(r.endedAt) <= Date.now()));

  // Ongoing problems: an adaptation backache that's improving, and a fresh spacewalk glove injury.
  const notes: BodyNote[] = [
    {
      id: "demo-glove", area: "hand", side: "right", kind: "numbness", severity: 4, startedOn: addDays(today, -1), createdAt: at(addDays(today, -1), 19).toISOString(),
      notes: "After the 6.5 h spacewalk my fingertips are numb and two nails are lifting.", topics: ["eva-hand", "paresthesia"], updates: [],
    },
    {
      id: "demo-back", area: "lower-back", kind: "pain", severity: 4, startedOn: addDays(today, -55), createdAt: at(addDays(today, -55), 20).toISOString(),
      notes: "Ache low in my back since the first days of the flight. Worse after sleeping in the bag.", topics: ["back-pain-sas"],
      updates: [{ id: "demo-back-1", severity: 2, body: "Knees-to-chest stretch before sleep helps.", createdAt: at(addDays(today, -30), 21).toISOString() }],
    },
  ];
  store.set(DEMO_BODY_COOKIE, JSON.stringify(notes), options);

  // Journal: a hard day after a cut-short call home, and a good one.
  const journal: JournalEntry[] = [
    { id: "demo-j1", date: addDays(today, -1), mood: 2, tags: ["contact", "work"], createdAt: at(addDays(today, -1), 22).toISOString(),
      body: "Call home got cut short again. With the delay it's hard to have a real conversation. Long spacewalk too; tired and flat tonight." },
    { id: "demo-j2", date: addDays(today, -4), mood: 4, tags: ["crew", "leisure"], createdAt: at(addDays(today, -4), 21).toISOString(),
      body: "Movie night with the crew. Good to laugh. Sleep has been better since we fixed the light leak in my sleep station." },
  ];
  store.set(DEMO_JOURNAL_COOKIE, JSON.stringify(journal), options);

  // Medicines and reminders, with this morning's dose ticked off.
  const meds = {
    m: [
      // A weekly dose (Sundays), as prescribed, to show non-daily schedules.
      { id: "demo-med-1", name: "Vitamin D", dose: "1 capsule (weekly dose)", instructions: "With breakfast", times: ["08:00"], active: true, startedOn: addDays(today, -35), confirmed: true, schedule: "weekdays", days: [0] },
      { id: "demo-med-2", name: "Sleep medicine", dose: "As prescribed by flight surgeon", instructions: "30 minutes before sleep", times: ["21:30"], active: true, purpose: "sleep", startedOn: addDays(today, -4), confirmed: true },
    ],
    r: [
      { id: "demo-rem-water", title: "Drink water", category: "water", times: ["10:00", "14:00", "18:00"], days: [0, 1, 2, 3, 4, 5, 6], active: true },
      { id: "demo-rem-ex", title: "Resistance exercise", category: "exercise", times: ["16:00"], days: [1, 2, 3, 4, 5], active: true },
    ],
    d: today,
    ml: [
      ...[4, 3, 2, 1].map((n) => ({ medicationId: "demo-med-2", time: "21:30", status: "taken", date: addDays(today, -n) })),
      // Vitamin D on each Sunday of the last 4 weeks, with one week missed.
      ...Array.from({ length: 28 }, (_, n) => addDays(today, -n)).filter((d) => weekdayOf(d) === 0)
        .map((d, i) => ({ medicationId: "demo-med-1", time: "08:00", status: i === 2 ? "skipped" : "taken", date: d })),
    ],
    fx: [{ id: "demo-fx-1", medicationId: "demo-med-2", date: addDays(today, -2), severity: "mild", note: "A bit groggy the first morning" }],
    rl: [{ reminderId: "demo-rem-water", time: "10:00" }],
  };
  store.set(DEMO_MEDS_COOKIE, JSON.stringify(meds), options);

  // A five-day habit streak.
  const habits = TIPS.filter((t) => t.habit).slice(0, 3).map((t) => t.id);
  const done = [4, 3, 2, 1, 0].flatMap((n) => habits.slice(0, n === 0 ? 1 : 2).map((id) => [id, addDays(today, -n)]));
  store.set(DEMO_COOKIES[1], JSON.stringify(done), options);
}

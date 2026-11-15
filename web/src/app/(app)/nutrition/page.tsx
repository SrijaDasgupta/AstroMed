import Link from "next/link";
import { Apple, CheckCircle2, Dumbbell, ExternalLink, Lightbulb, Package, UtensilsCrossed } from "lucide-react";
import { dietRemoveAction } from "@/app/actions";
import { loadLogs } from "@/lib/checkup-store";
import { getCrewMember } from "@/lib/crew";
import { addDays, localDate } from "@/lib/dates";
import { dayTotals, dietSuggestions, getActivity, MEALS, MEAL_LABEL, planTotals, proteinTarget } from "@/lib/diet";
import { loadDiet } from "@/lib/diet-store";
import { getMissionContext } from "@/lib/mission";
import { energyTarget, withEva } from "@/lib/nutrition";
import { getProfile } from "@/lib/profile-store";
import { requireViewer } from "@/lib/session";
import { pageHref, pageLabel, SOURCES, type SourceId } from "@/lib/tips";
import { AddFoodForm, ExerciseForm, LogFoodForm, LogMealButton, PlanItemForm } from "./forms";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function Remove({ kind, id, label }: { kind: string; id: string; label: string }) {
  return (
    <form action={dietRemoveAction}>
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
      <button type="submit" aria-label={label} className="text-xs text-slate-500 hover:text-rose-300">Remove</button>
    </form>
  );
}

function Bar({ value, target, label, unit }: { value: number; target: number; label: string; unit: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-slate-300">{label}</span><span className="tabular-nums text-slate-100">{fmt(value)} / {fmt(target)} {unit}</span></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${pct >= 90 ? "bg-emerald-400" : "bg-sky-400"}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Cite({ source, page }: { source: SourceId; page: number }) {
  return (
    <a href={pageHref(SOURCES[source], page)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline decoration-white/20 underline-offset-2 hover:text-sky-300">
      {pageLabel(SOURCES[source], page)} <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}

export default async function NutritionPage() {
  const viewer = await requireViewer();
  const [diet, profile, { logs }, ctx] = await Promise.all([loadDiet(viewer), getProfile(viewer), loadLogs(viewer), getMissionContext()]);
  const today = localDate();
  const weightKg = profile.details.weightKg ?? getCrewMember(profile.crewId)?.baseline.weightKg ?? 70;
  const target = energyTarget(profile.details, Number(today.slice(0, 4)));
  const todayLogs = logs.filter((l) => localDate(new Date(l.createdAt)) === today && l.answers);
  const evaHours = todayLogs.reduce((s, l) => s + (typeof l.answers?.evaHours === "number" ? (l.answers.evaHours as number) : 0), 0);
  const need = withEva(target, evaHours);
  const protein = proteinTarget(weightKg);
  const eaten = dayTotals(diet.logs, today);
  // Without a food log today, use the calorie estimate from the daily log, if any.
  const dailyKcal = todayLogs.map((l) => l.answers?.kcal).find((k): k is number => typeof k === "number");
  const eatenKcal = eaten.count ? eaten.kcal : dailyKcal ?? 0;
  const sessionsToday = diet.sessions.filter((s) => s.date === today);
  const burned = sessionsToday.reduce((s, e) => s + e.kcal, 0);
  const daysLeft = ctx.length && ctx.day ? Math.max(0, ctx.length - ctx.day) : undefined;
  const suggestions = dietSuggestions({ foods: diet.foods, plan: diet.plan, needKcal: need, proteinG: protein, eatenToday: eaten.count ? eaten : undefined, burnedToday: burned, daysLeft });
  const totals = planTotals(diet.plan, diet.foods);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, -i)).map((d) => ({
    date: d, eaten: dayTotals(diet.logs, d).kcal, burned: diet.sessions.filter((s) => s.date === d).reduce((a, s) => a + s.kcal, 0),
  })).filter((d) => d.eaten || d.burned);
  const toneIcon = { good: "text-emerald-300", tip: "text-sky-300", attention: "text-amber-300" } as const;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Food and exercise</h1>
        <p className="mt-1 text-slate-400">Track what you eat and the calories you burn, plan meals from the food you have, and get suggestions.</p>
      </div>
      {diet.problem && <p className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">Couldn&apos;t load everything: {diet.problem}</p>}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-medium">Today</h2>
          <Bar label="Food energy" value={eatenKcal} target={need} unit="kcal" />
          <Bar label="Protein" value={eaten.proteinG} target={protein} unit="g" />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-400">Need</p><p className="text-lg font-semibold tabular-nums">{fmt(need)}</p><p className="text-xs text-slate-500">kcal{evaHours ? `, incl. ${fmt(need - target.kcal)} for EVA` : ""}</p></div>
            <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-400">Eaten</p><p className="text-lg font-semibold tabular-nums">{fmt(eatenKcal)}</p><p className="text-xs text-slate-500">{eaten.count ? "from your food log" : dailyKcal !== undefined ? "from your daily log" : "kcal"}</p></div>
            <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-400">Exercise</p><p className="text-lg font-semibold tabular-nums">{fmt(burned)}</p><p className="text-xs text-slate-500">kcal burned</p></div>
          </div>
          <p className="text-xs text-slate-500">
            Need: NASA&apos;s energy equation for your {target.basis === "profile" ? "profile" : <>default (<Link href="/profile" className="text-sky-300">add height, weight, birth year and sex</Link> for yours)</>}, which already allows for a normal day&apos;s exercise, plus 200 kcal per spacewalk hour (<Cite source="std2" page={116} />). Protein: 0.8 g per kg body weight, the Dietary Reference Intake NASA follows.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center gap-2 font-medium"><Lightbulb className="h-4 w-4 text-sky-300" aria-hidden /> Suggestions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-2"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${toneIcon[s.tone]}`} aria-hidden /><span className="text-slate-200">{s.text}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center gap-2 font-medium"><UtensilsCrossed className="h-4 w-4 text-slate-400" aria-hidden /> Log food</h2>
          <LogFoodForm foods={diet.foods} />
          {eaten.count > 0 && (
            <ul className="divide-y divide-white/5 text-sm">
              {diet.logs.filter((l) => l.date === today).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2">
                  <span><span className="text-slate-500">{MEAL_LABEL[l.meal]} · </span>{l.name}{l.servings !== 1 ? ` × ${l.servings}` : ""}</span>
                  <span className="flex items-center gap-3"><span className="tabular-nums text-slate-300">{fmt(l.kcal)} kcal</span><Remove kind="log" id={l.id} label={`Remove ${l.name}`} /></span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center gap-2 font-medium"><Dumbbell className="h-4 w-4 text-slate-400" aria-hidden /> Log exercise</h2>
          <ExerciseForm weightKg={weightKg} />
          {sessionsToday.length > 0 && (
            <ul className="divide-y divide-white/5 text-sm">
              {sessionsToday.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <span>{getActivity(s.activity)?.label ?? s.activity} · {s.minutes} min, {s.intensity}</span>
                  <span className="flex items-center gap-3"><span className="tabular-nums text-slate-300">{fmt(s.kcal)} kcal</span><Remove kind="exercise" id={s.id} label="Remove session" /></span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500">Estimates use activity energy costs from the <Cite source="compendium" page={0} /> and your body weight. In weightlessness, treadmill figures are rough because the harness carries less than your full weight.</p>
        </section>
      </div>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 font-medium"><Apple className="h-4 w-4 text-slate-400" aria-hidden /> My diet plan</h2>
          {diet.plan.length > 0 && <p className="text-sm tabular-nums text-slate-300">{fmt(totals.kcal)} kcal · {totals.proteinG} g protein a day</p>}
        </div>
        {diet.plan.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {MEALS.map((m) => {
              const items = diet.plan.filter((p) => p.meal === m);
              return (
                <div key={m} className="rounded-xl bg-white/[0.04] p-3">
                  <div className="flex items-baseline justify-between"><h3 className="text-sm font-medium">{MEAL_LABEL[m]}</h3><span className="text-xs tabular-nums text-slate-400">{fmt(totals.byMeal[m].kcal)} kcal</span></div>
                  {items.length === 0 ? <p className="mt-2 text-xs text-slate-500">Nothing planned.</p> : (
                    <ul className="mt-2 space-y-1 text-sm">
                      {items.map((p) => {
                        const f = diet.foods.find((x) => x.id === p.foodId);
                        return f ? <li key={p.id} className="flex justify-between gap-2"><span>{f.name}{p.servings !== 1 ? ` × ${p.servings}` : ""}</span><Remove kind="plan" id={p.id} label={`Remove ${f.name} from ${m}`} /></li> : null;
                      })}
                    </ul>
                  )}
                  {items.length > 0 && <div className="mt-3"><LogMealButton meal={m} /></div>}
                </div>
              );
            })}
          </div>
        )}
        <PlanItemForm foods={diet.foods} />
      </section>

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 font-medium"><Package className="h-4 w-4 text-slate-400" aria-hidden /> Foods I have</h2>
        {diet.foods.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-400"><tr><th className="py-1 font-normal">Food</th><th className="font-normal">kcal / serving</th><th className="font-normal">Protein</th><th className="font-normal">On hand</th><th /></tr></thead>
              <tbody className="divide-y divide-white/5">
                {diet.foods.map((f) => (
                  <tr key={f.id}>
                    <td className="py-2">{f.name}</td><td className="tabular-nums">{fmt(f.kcal)}</td><td className="tabular-nums">{f.proteinG} g</td>
                    <td className={`tabular-nums ${f.servings === 0 ? "text-amber-300" : ""}`}>{f.servings === undefined ? "—" : `${f.servings} serving${f.servings === 1 ? "" : "s"}`}</td>
                    <td className="text-right"><Remove kind="food" id={f.id} label={`Remove ${f.name}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AddFoodForm />
        <p className="text-xs text-slate-500">Logging a food you have takes those servings off what&apos;s on hand.</p>
      </section>

      {week.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-medium">Last 7 days</h2>
          <ul className="mt-2 divide-y divide-white/5 text-sm">
            {week.map((d) => (
              <li key={d.date} className="flex justify-between py-1.5">
                <span className="text-slate-400">{new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="tabular-nums">{fmt(d.eaten)} kcal eaten · {fmt(d.burned)} kcal exercise</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

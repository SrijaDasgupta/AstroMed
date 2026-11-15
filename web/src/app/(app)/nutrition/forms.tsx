"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { dietAction, type FormState } from "@/app/actions";
import { ACTIVITIES, exerciseKcal, MEALS, MEAL_LABEL, type Food, type Intensity } from "@/lib/diet";

const field = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-sky-400";
const select = `${field} bg-slate-900`;
const button = "rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50";

function useDiet() {
  const [state, action, pending] = useActionState<FormState, FormData>(dietAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  const status = state.error ? <p role="alert" className="text-sm text-rose-400">{state.error}</p> : state.ok ? <p role="status" className="text-sm text-emerald-400">{state.message}</p> : null;
  return { action, pending, ref, status };
}

const defaultMeal = (): (typeof MEALS)[number] => {
  const h = new Date().getHours();
  return h < 10 ? "breakfast" : h < 15 ? "lunch" : h < 21 ? "dinner" : "snack";
};

export function AddFoodForm() {
  const { action, pending, ref, status } = useDiet();
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="op" value="addFood" />
      <label className="block"><span className="text-sm text-slate-300">Food</span><input name="name" required maxLength={80} placeholder="Name on the package" className={`mt-1 ${field}`} /></label>
      <div className="grid grid-cols-3 gap-3">
        <label className="block"><span className="text-sm text-slate-300">kcal / serving</span><input name="kcal" type="number" min={0} max={3000} step={1} required className={`mt-1 ${field}`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Protein g</span><input name="proteinG" type="number" min={0} max={300} step={0.5} placeholder="0" className={`mt-1 ${field}`} /></label>
        <label className="block"><span className="text-sm text-slate-300">Servings on hand</span><input name="onHand" type="number" min={0} max={10000} step={1} placeholder="optional" className={`mt-1 ${field}`} /></label>
      </div>
      {status}
      <button type="submit" disabled={pending} className={button}>{pending ? "Adding…" : "Add food"}</button>
    </form>
  );
}

export function PlanItemForm({ foods }: { foods: Food[] }) {
  const { action, pending, ref, status } = useDiet();
  if (!foods.length) return <p className="text-sm text-slate-400">Add the foods you have first, then build your plan from them.</p>;
  return (
    <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
      <input type="hidden" name="op" value="addPlan" />
      <label className="block"><span className="text-sm text-slate-300">Food</span>
        <select name="foodId" required className={`mt-1 ${select}`}>{foods.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.kcal} kcal)</option>)}</select>
      </label>
      <label className="block"><span className="text-sm text-slate-300">Meal</span>
        <select name="meal" defaultValue="breakfast" className={`mt-1 ${select}`}>{MEALS.map((m) => <option key={m} value={m}>{MEAL_LABEL[m]}</option>)}</select>
      </label>
      <label className="block"><span className="text-sm text-slate-300">Servings</span><input name="servings" type="number" min={0.25} max={20} step={0.25} defaultValue={1} className={`mt-1 w-24 ${field}`} /></label>
      <button type="submit" disabled={pending} className={button}>{pending ? "Adding…" : "Add to plan"}</button>
      <div className="sm:col-span-4">{status}</div>
    </form>
  );
}

export function LogMealButton({ meal }: { meal: (typeof MEALS)[number] }) {
  const { action, pending, status } = useDiet();
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="op" value="logMeal" /><input type="hidden" name="meal" value={meal} />
      <button type="submit" disabled={pending} className="rounded-lg border border-sky-400/40 px-2.5 py-1 text-xs text-sky-200 hover:bg-sky-400/10 disabled:opacity-50">{pending ? "Logging…" : "I ate this"}</button>
      {status}
    </form>
  );
}

export function LogFoodForm({ foods }: { foods: Food[] }) {
  const { action, pending, ref, status } = useDiet();
  const [foodId, setFoodId] = useState(foods[0]?.id ?? "custom");
  const [meal, setMeal] = useState<(typeof MEALS)[number]>("breakfast");
  useEffect(() => setMeal(defaultMeal()), []);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="op" value="logFood" />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="block"><span className="text-sm text-slate-300">What you ate</span>
          <select name="foodId" value={foodId} onChange={(e) => setFoodId(e.target.value)} className={`mt-1 ${select}`}>
            {foods.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.kcal} kcal){f.servings !== undefined ? ` · ${f.servings} left` : ""}</option>)}
            <option value="custom">Something else…</option>
          </select>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Meal</span>
          <select name="meal" value={meal} onChange={(e) => setMeal(e.target.value as typeof meal)} className={`mt-1 ${select}`}>{MEALS.map((m) => <option key={m} value={m}>{MEAL_LABEL[m]}</option>)}</select>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Servings</span><input name="servings" type="number" min={0.25} max={20} step={0.25} defaultValue={1} className={`mt-1 w-24 ${field}`} /></label>
      </div>
      {foodId === "custom" && (
        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-3 block sm:col-span-1"><span className="text-sm text-slate-300">Name</span><input name="name" required maxLength={80} className={`mt-1 ${field}`} /></label>
          <label className="block"><span className="text-sm text-slate-300">kcal / serving</span><input name="kcal" type="number" min={0} max={3000} required className={`mt-1 ${field}`} /></label>
          <label className="block"><span className="text-sm text-slate-300">Protein g</span><input name="proteinG" type="number" min={0} max={300} step={0.5} className={`mt-1 ${field}`} /></label>
        </div>
      )}
      {status}
      <button type="submit" disabled={pending} className={button}>{pending ? "Logging…" : "Log food"}</button>
    </form>
  );
}

export function ExerciseForm({ weightKg }: { weightKg: number }) {
  const { action, pending, ref, status } = useDiet();
  const [activity, setActivity] = useState(ACTIVITIES[0].id);
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [minutes, setMinutes] = useState(30);
  const kcal = minutes > 0 ? exerciseKcal(activity, intensity, minutes, weightKg) : 0;
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="op" value="logExercise" />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block"><span className="text-sm text-slate-300">Exercise</span>
          <select name="activity" value={activity} onChange={(e) => setActivity(e.target.value)} className={`mt-1 ${select}`}>{ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
        </label>
        <label className="block"><span className="text-sm text-slate-300">Minutes</span><input name="minutes" type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={`mt-1 w-24 ${field}`} /></label>
      </div>
      <fieldset>
        <legend className="text-sm text-slate-300">How hard</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {([["light", "Light: easy chat"], ["moderate", "Moderate: short sentences"], ["vigorous", "Vigorous: a few words"]] as const).map(([v, l]) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="intensity" value={v} checked={intensity === v} onChange={() => setIntensity(v)} className="peer sr-only" />
              <span className="inline-block rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 peer-checked:border-sky-400 peer-checked:bg-sky-400/15 peer-checked:text-sky-100 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400">{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-sm text-slate-300">About <span className="font-semibold tabular-nums text-white">{kcal}</span> kcal for your {Math.round(weightKg)} kg.</p>
      {status}
      <button type="submit" disabled={pending} className={button}>{pending ? "Logging…" : "Log exercise"}</button>
    </form>
  );
}

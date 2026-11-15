import { cookies } from "next/headers";
import { addDays, localDate } from "@/lib/dates";
import type { ExerciseSession, Food, FoodLog, Meal, PlanItem } from "@/lib/diet";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export type DietData = { foods: Food[]; plan: PlanItem[]; logs: FoodLog[]; sessions: ExerciseSession[]; problem?: string };
type Result = { problem?: string };

/** History kept on the page: the last 7 days of food and exercise. */
const DAYS = 7;

// Demo mode keeps everything in one small cookie (browsers drop cookies over 4 KB).
const DEMO = "astromed_demo_food";
export const DEMO_FOOD_COOKIE = DEMO;
type DemoState = { f: Food[]; p: PlanItem[]; l: FoodLog[]; e: ExerciseSession[] };

async function readDemo(): Promise<DemoState> {
  try {
    const s = JSON.parse((await cookies()).get(DEMO)?.value ?? "") as DemoState;
    const oldest = addDays(localDate(), -(DAYS - 1));
    return { f: s.f ?? [], p: s.p ?? [], l: (s.l ?? []).filter((x) => x.date >= oldest), e: (s.e ?? []).filter((x) => x.date >= oldest) };
  } catch {
    return { f: [], p: [], l: [], e: [] };
  }
}
async function writeDemo(s: DemoState) {
  const fit = { f: s.f.slice(0, 12), p: s.p.slice(0, 16), l: s.l.slice(-20), e: s.e.slice(-8) };
  while (encodeURIComponent(JSON.stringify(fit)).length > 3800 && (fit.l.length || fit.e.length)) {
    if (fit.l.length) fit.l.shift(); else fit.e.shift();
  }
  (await cookies()).set(DEMO, JSON.stringify(fit), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
}
const shortId = () => crypto.randomUUID().slice(0, 8);

export async function loadDiet(viewer: Viewer): Promise<DietData> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    return { foods: s.f, plan: s.p, logs: s.l, sessions: s.e };
  }
  const supabase = await createClient();
  const from = addDays(localDate(), -(DAYS - 1));
  const [f, p, l, e] = await Promise.all([
    supabase.from("foods").select("id, name, kcal, protein_g, servings").order("name"),
    supabase.from("diet_plan_items").select("id, food_id, meal, servings").order("created_at"),
    supabase.from("food_logs").select("id, eaten_on, meal, food_id, name, servings, kcal, protein_g").gte("eaten_on", from).order("created_at"),
    supabase.from("exercise_sessions").select("id, done_on, activity, intensity, minutes, kcal").gte("done_on", from).order("created_at"),
  ]);
  const err = f.error ?? p.error ?? l.error ?? e.error;
  return {
    problem: err?.message,
    foods: (f.data ?? []).map((x) => ({ id: x.id, name: x.name, kcal: Number(x.kcal), proteinG: Number(x.protein_g), servings: x.servings === null ? undefined : Number(x.servings) })),
    plan: (p.data ?? []).map((x) => ({ id: x.id, foodId: x.food_id, meal: x.meal, servings: Number(x.servings) })),
    logs: (l.data ?? []).map((x) => ({ id: x.id, date: x.eaten_on, meal: x.meal, foodId: x.food_id ?? undefined, name: x.name, servings: Number(x.servings), kcal: Number(x.kcal), proteinG: Number(x.protein_g) })),
    sessions: (e.data ?? []).map((x) => ({ id: x.id, date: x.done_on, activity: x.activity, intensity: x.intensity, minutes: x.minutes, kcal: x.kcal })),
  };
}

export async function addFood(viewer: Viewer, food: Omit<Food, "id">): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    if (s.f.length >= 12) return { problem: "The demo holds up to 12 foods." };
    s.f.push({ ...food, id: shortId() });
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("foods").insert({ user_id: viewer.id, name: food.name, kcal: food.kcal, protein_g: food.proteinG, servings: food.servings ?? null });
  return { problem: error?.message };
}

export async function removeFood(viewer: Viewer, id: string): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    s.f = s.f.filter((x) => x.id !== id);
    s.p = s.p.filter((x) => x.foodId !== id);
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("foods").delete().eq("id", id);
  return { problem: error?.message };
}

export async function addPlanItem(viewer: Viewer, item: Omit<PlanItem, "id">): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    if (!s.f.some((f) => f.id === item.foodId)) return { problem: "Choose one of your foods." };
    if (s.p.length >= 16) return { problem: "The demo plan holds up to 16 items." };
    s.p.push({ ...item, id: shortId() });
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("diet_plan_items").insert({ user_id: viewer.id, food_id: item.foodId, meal: item.meal, servings: item.servings });
  return { problem: error?.message };
}

export async function removePlanItem(viewer: Viewer, id: string): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    s.p = s.p.filter((x) => x.id !== id);
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("diet_plan_items").delete().eq("id", id);
  return { problem: error?.message };
}

/** Logs food eaten. Eating one of your foods takes the servings off what you have on hand. */
export async function logFood(viewer: Viewer, entries: Omit<FoodLog, "id">[]): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    for (const e of entries) {
      s.l.push({ ...e, id: shortId() });
      const f = e.foodId ? s.f.find((x) => x.id === e.foodId) : undefined;
      if (f && f.servings !== undefined) f.servings = Math.max(0, f.servings - e.servings);
    }
    await writeDemo(s);
    return {};
  }
  const supabase = await createClient();
  const { error } = await supabase.from("food_logs").insert(entries.map((e) => ({ user_id: viewer.id, eaten_on: e.date, meal: e.meal, food_id: e.foodId ?? null, name: e.name, servings: e.servings, kcal: e.kcal, protein_g: e.proteinG })));
  if (error) return { problem: error.message };
  for (const e of entries) {
    if (!e.foodId) continue;
    const { data } = await supabase.from("foods").select("servings").eq("id", e.foodId).single();
    if (data && data.servings !== null) await supabase.from("foods").update({ servings: Math.max(0, Number(data.servings) - e.servings) }).eq("id", e.foodId);
  }
  return {};
}

export async function removeFoodLog(viewer: Viewer, id: string): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    s.l = s.l.filter((x) => x.id !== id);
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("food_logs").delete().eq("id", id);
  return { problem: error?.message };
}

export async function logExercise(viewer: Viewer, e: Omit<ExerciseSession, "id">): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    s.e.push({ ...e, id: shortId() });
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("exercise_sessions").insert({ user_id: viewer.id, done_on: e.date, activity: e.activity, intensity: e.intensity, minutes: e.minutes, kcal: e.kcal });
  return { problem: error?.message };
}

export async function removeExercise(viewer: Viewer, id: string): Promise<Result> {
  if (viewer.kind === "demo") {
    const s = await readDemo();
    s.e = s.e.filter((x) => x.id !== id);
    await writeDemo(s);
    return {};
  }
  const { error } = await (await createClient()).from("exercise_sessions").delete().eq("id", id);
  return { problem: error?.message };
}

export type { Meal };

/**
 * Food and exercise: exercise calories from MET values, diet plan totals, and suggestions drawn
 * from the foods the astronaut actually has. Rule-based, no AI. Pure functions, no I/O.
 *
 * Exercise energy: kcal ≈ MET × body mass (kg) × hours, since 1 MET is about 1 kcal per kg per hour
 * (2024 Adult Compendium of Physical Activities). MET values are approximate Compendium values for
 * each intensity; in weightlessness a treadmill harness carries less than full body weight, so
 * treadmill figures there are rough.
 * Targets: energy from NASA's EER equation (NASA-STD-3001 Vol. 2, p. 116), plus 200 kcal per
 * spacewalk hour; NASA follows the Dietary Reference Intakes, where protein is 0.8 g per kg a day.
 */

export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Meal = (typeof MEALS)[number];
export const MEAL_LABEL: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" };

export type Intensity = "light" | "moderate" | "vigorous";
export const ACTIVITIES: { id: string; label: string; met: Record<Intensity, number> }[] = [
  { id: "treadmill", label: "Treadmill (walk or run)", met: { light: 3.5, moderate: 7.0, vigorous: 9.8 } },
  { id: "cycle", label: "Cycle ergometer", met: { light: 3.5, moderate: 6.8, vigorous: 8.8 } },
  { id: "resistance", label: "Resistance training", met: { light: 3.5, moderate: 5.0, vigorous: 6.0 } },
  { id: "rowing", label: "Rowing", met: { light: 4.8, moderate: 7.0, vigorous: 8.5 } },
  { id: "walking", label: "Walking (in gravity)", met: { light: 2.8, moderate: 3.5, vigorous: 5.0 } },
  { id: "sports", label: "Games or sports", met: { light: 4.0, moderate: 6.0, vigorous: 8.0 } },
  { id: "stretching", label: "Stretching, yoga or balance", met: { light: 2.3, moderate: 2.5, vigorous: 3.0 } },
  { id: "other", label: "Other exercise", met: { light: 3.0, moderate: 5.0, vigorous: 7.0 } },
];
export const getActivity = (id: string) => ACTIVITIES.find((a) => a.id === id);

export function exerciseKcal(activityId: string, intensity: Intensity, minutes: number, weightKg: number) {
  const a = getActivity(activityId) ?? ACTIVITIES[ACTIVITIES.length - 1];
  return Math.round(a.met[intensity] * weightKg * (minutes / 60));
}

export const PROTEIN_G_PER_KG = 0.8;
export const proteinTarget = (weightKg: number) => Math.round(PROTEIN_G_PER_KG * weightKg);

export type Food = { id: string; name: string; kcal: number; proteinG: number; servings?: number };
export type PlanItem = { id: string; foodId: string; meal: Meal; servings: number };
export type FoodLog = { id: string; date: string; meal: Meal; foodId?: string; name: string; servings: number; kcal: number; proteinG: number };
export type ExerciseSession = { id: string; date: string; activity: string; intensity: Intensity; minutes: number; kcal: number };

export function planTotals(plan: PlanItem[], foods: Food[]) {
  const byMeal = Object.fromEntries(MEALS.map((m) => [m, { kcal: 0, proteinG: 0, items: 0 }])) as Record<Meal, { kcal: number; proteinG: number; items: number }>;
  for (const p of plan) {
    const f = foods.find((x) => x.id === p.foodId);
    if (!f) continue;
    byMeal[p.meal].kcal += f.kcal * p.servings;
    byMeal[p.meal].proteinG += f.proteinG * p.servings;
    byMeal[p.meal].items += 1;
  }
  const kcal = MEALS.reduce((s, m) => s + byMeal[m].kcal, 0);
  const proteinG = MEALS.reduce((s, m) => s + byMeal[m].proteinG, 0);
  return { kcal: Math.round(kcal), proteinG: Math.round(proteinG), byMeal };
}

export const dayTotals = (logs: FoodLog[], date: string) => {
  const today = logs.filter((l) => l.date === date);
  return { kcal: Math.round(today.reduce((s, l) => s + l.kcal, 0)), proteinG: Math.round(today.reduce((s, l) => s + l.proteinG, 0)), count: today.length };
};

export type Suggestion = { tone: "good" | "tip" | "attention"; text: string };

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** Foods that are on hand (servings unknown or above zero), best first by `score`. */
function pick(foods: Food[], score: (f: Food) => number, exclude: Set<string>) {
  return foods.filter((f) => !exclude.has(f.id) && (f.servings === undefined || f.servings > 0) && score(f) > 0).sort((a, b) => score(b) - score(a));
}

/**
 * Up to 3 foods (2 servings each at most) to close an energy gap, highest-calorie first, skipping
 * foods with too few servings left.
 */
export function fillGap(foods: Food[], gap: number) {
  const adds: { food: Food; servings: number }[] = [];
  let left = gap;
  for (const f of pick(foods, (x) => x.kcal, new Set())) {
    if (left <= 50 || adds.length === 3) break;
    const n = Math.min(2, Math.ceil(left / f.kcal), f.servings === undefined ? 2 : Math.floor(f.servings / 7));
    if (n <= 0) continue;
    adds.push({ food: f, servings: n });
    left -= f.kcal * n;
  }
  return adds;
}

export type DietInput = {
  foods: Food[];
  plan: PlanItem[];
  needKcal: number;
  proteinG: number;
  eatenToday?: { kcal: number; proteinG: number; count: number };
  burnedToday?: number;
  /** Days left in the mission, if known, to check whether supplies last. */
  daysLeft?: number;
};

/** Practical suggestions for the plan and today, using only the foods the person has. */
export function dietSuggestions(i: DietInput): Suggestion[] {
  const out: Suggestion[] = [];
  if (i.foods.length === 0) return [{ tone: "tip", text: "Add the foods you have on board (calories and protein are on the label). AstroMed will then check your plan and suggest what to add." }];
  const t = planTotals(i.plan, i.foods);
  if (i.plan.length === 0) {
    out.push({ tone: "tip", text: `Build a day's plan from your foods. Aim for about ${fmt(i.needKcal)} kcal and ${i.proteinG} g of protein.` });
  } else {
    const kcalPct = t.kcal / i.needKcal;
    const inPlan = new Set(i.plan.map((p) => p.foodId));
    if (kcalPct < 0.9) {
      const gap = i.needKcal - t.kcal;
      const adds = fillGap(i.foods, gap);
      const added = adds.reduce((n, a) => n + a.food.kcal * a.servings, 0);
      out.push({ tone: "attention", text: `Your plan gives ${fmt(t.kcal)} kcal, ${fmt(gap)} short of your ${fmt(i.needKcal)} kcal need.${adds.length ? ` From your foods, adding ${adds.map((a) => `${a.servings} × ${a.food.name}`).join(", ")} gives ${fmt(added)} kcal more${added < gap * 0.9 ? ", and you'll need more foods for the rest" : ""}.` : ""} Regular shortfalls lead to weight and muscle loss.` });
    } else if (kcalPct > 1.15) {
      out.push({ tone: "tip", text: `Your plan gives ${fmt(t.kcal)} kcal, ${fmt(t.kcal - i.needKcal)} more than your usual need. That's fine on spacewalk or heavy exercise days; otherwise trim a snack.` });
    } else {
      out.push({ tone: "good", text: `Your plan gives ${fmt(t.kcal)} kcal, in line with your ${fmt(i.needKcal)} kcal need.` });
    }
    if (t.proteinG < i.proteinG * 0.9) {
      const best = pick(i.foods, (f) => f.proteinG, new Set())[0];
      out.push({ tone: "attention", text: `Protein is ${t.proteinG} g against a target of ${i.proteinG} g.${best ? ` ${best.name} has the most protein of your foods (${best.proteinG} g a serving).` : " Add foods with protein listed on the label."} Protein helps limit muscle loss in weightlessness.` });
    } else {
      out.push({ tone: "good", text: `Protein ${t.proteinG} g meets your ${i.proteinG} g target.` });
    }
    const empty = MEALS.filter((m) => m !== "snack" && t.byMeal[m].items === 0);
    if (empty.length) out.push({ tone: "tip", text: `No ${empty.map((m) => MEAL_LABEL[m].toLowerCase()).join(" or ")} in your plan. Spreading food across the day helps when appetite is low.` });
    const unused = pick(i.foods, (f) => f.kcal, inPlan);
    if (i.plan.length >= 3 && new Set(i.plan.map((p) => p.foodId)).size <= 2 && unused.length) out.push({ tone: "tip", text: `Your plan repeats the same foods. Rotating in ${unused.slice(0, 2).map((f) => f.name).join(" or ")} helps with menu fatigue, which makes people eat less on long missions.` });
    // Supplies: servings per day in the plan vs servings on hand.
    for (const f of i.foods) {
      const perDay = i.plan.filter((p) => p.foodId === f.id).reduce((s, p) => s + p.servings, 0);
      if (!perDay || f.servings === undefined) continue;
      const days = Math.floor(f.servings / perDay);
      if (days < 7 || (i.daysLeft !== undefined && days < i.daysLeft)) out.push({ tone: "attention", text: `${f.name}: ${f.servings} serving${f.servings === 1 ? "" : "s"} left lasts about ${days} day${days === 1 ? "" : "s"} at your plan's rate${i.daysLeft !== undefined && days < i.daysLeft ? `, less than the ${i.daysLeft} days left in your mission` : ""}. Swap in other foods or check resupply.` });
    }
  }
  if (i.eatenToday && i.eatenToday.count > 0) {
    const left = i.needKcal - i.eatenToday.kcal;
    if (left > 300) out.push({ tone: "tip", text: `Today: ${fmt(i.eatenToday.kcal)} kcal eaten so far, ${fmt(left)} to go${i.burnedToday ? ` (you've burned about ${fmt(i.burnedToday)} kcal exercising)` : ""}.` });
    else if (left >= -300) out.push({ tone: "good", text: `Today: ${fmt(i.eatenToday.kcal)} kcal eaten, close to your need.` });
    else out.push({ tone: "tip", text: `Today: ${fmt(i.eatenToday.kcal)} kcal eaten, ${fmt(-left)} above your need.` });
  }
  return out;
}

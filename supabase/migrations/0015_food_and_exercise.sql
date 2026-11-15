-- Food and exercise tracking: foods the astronaut has on hand, their own diet plan,
-- what they ate, and exercise sessions with estimated calories.

create table if not exists public.foods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  kcal       numeric not null check (kcal between 0 and 3000),
  protein_g  numeric not null default 0 check (protein_g between 0 and 300),
  servings   numeric check (servings is null or servings between 0 and 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.diet_plan_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  food_id    uuid not null references public.foods (id) on delete cascade,
  meal       text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  servings   numeric not null check (servings > 0 and servings <= 20),
  created_at timestamptz not null default now()
);

create table if not exists public.food_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_on   date not null,
  meal       text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id    uuid references public.foods (id) on delete set null,
  name       text not null check (char_length(name) between 1 and 80),
  servings   numeric not null check (servings > 0 and servings <= 20),
  kcal       numeric not null check (kcal between 0 and 20000),
  protein_g  numeric not null default 0 check (protein_g between 0 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  done_on    date not null,
  activity   text not null check (char_length(activity) between 1 and 30),
  intensity  text not null check (intensity in ('light', 'moderate', 'vigorous')),
  minutes    integer not null check (minutes between 1 and 600),
  kcal       integer not null check (kcal between 0 and 10000),
  created_at timestamptz not null default now()
);

create index if not exists foods_user on public.foods (user_id);
create index if not exists diet_plan_items_user on public.diet_plan_items (user_id);
create index if not exists diet_plan_items_food on public.diet_plan_items (food_id);
create index if not exists food_logs_user_day on public.food_logs (user_id, eaten_on);
create index if not exists food_logs_food on public.food_logs (food_id);
create index if not exists exercise_sessions_user_day on public.exercise_sessions (user_id, done_on);

alter table public.foods enable row level security;
alter table public.diet_plan_items enable row level security;
alter table public.food_logs enable row level security;
alter table public.exercise_sessions enable row level security;

create policy "own foods" on public.foods for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own diet plan" on public.diet_plan_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (select 1 from public.foods f where f.id = food_id and f.user_id = (select auth.uid())));
create policy "own food logs" on public.food_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (food_id is null or exists (select 1 from public.foods f where f.id = food_id and f.user_id = (select auth.uid()))));
create policy "own exercise sessions" on public.exercise_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

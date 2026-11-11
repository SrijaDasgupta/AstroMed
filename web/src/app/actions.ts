"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { ENV_COOKIE, ENVIRONMENTS } from "@/lib/environments";
import { DEMO_COOKIE, getViewer } from "@/lib/session";
import { evaluate, getCheckup, parseAnswers, type Escalation, type Finding } from "@/lib/checkups";
import { getCrewMember } from "@/lib/crew";
import { clearDemoLogsCookieName, saveLog } from "@/lib/checkup-store";
import { DEMO_COOKIES, getProfile, saveProfile as storeProfile, setTipDone } from "@/lib/profile-store";
import { CREW } from "@/lib/crew";
import { TIPS } from "@/lib/tips";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const NOT_CONFIGURED = "Sign-in isn't set up yet. Add your Supabase keys to web/.env.local, or try the demo.";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  (await cookies()).delete(DEMO_COOKIE);
  redirect("/me");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const { email, password } = readCredentials(formData);
  if (!email || password.length < 8) return { error: "Enter an email and a password of at least 8 characters." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/me");
  return { message: "Check your email for a confirmation link, then sign in." };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(DEMO_COOKIE);
  store.delete(clearDemoLogsCookieName());
  DEMO_COOKIES.forEach((c) => store.delete(c));
  redirect("/");
}

export async function startDemo() {
  (await cookies()).set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  redirect("/me");
}

export async function setEnvironment(formData: FormData) {
  const id = String(formData.get("environment") ?? "");
  if (!ENVIRONMENTS.some((e) => e.id === id)) return;
  (await cookies()).set(ENV_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  revalidatePath("/", "layout");
}

export type CheckupState = {
  error?: string;
  result?: { level: Escalation; findings: Finding[]; saved: boolean; problem?: string };
};

export async function submitCheckup(_prev: CheckupState, formData: FormData): Promise<CheckupState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const checkup = getCheckup(String(formData.get("checkupId") ?? ""));
  if (!checkup) return { error: "Unknown checkup." };
  const member = getCrewMember((await getProfile(viewer)).crewId)!;

  const parsed = parseAnswers(checkup, formData);
  if ("error" in parsed) return { error: parsed.error };

  const { level, findings } = evaluate(checkup, member, parsed.answers);
  const { problem } = await saveLog(viewer, { crewId: member.id, checkupId: checkup.id, escalation: level, answers: parsed.answers });
  revalidatePath("/", "layout");
  return { result: { level, findings, saved: !problem, problem } };
}

export async function toggleHabit(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const tipId = String(formData.get("tipId") ?? "");
  if (!TIPS.some((t) => t.id === tipId && t.habit)) return;
  await setTipDone(viewer, tipId, formData.get("done") === "1");
  revalidatePath("/", "layout");
}

export type ProfileState = { error?: string; saved?: boolean };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session has ended. Sign in again." };
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 40);
  const crewId = String(formData.get("crewId") ?? "");
  if (!displayName) return { error: "Enter a name." };
  if (!CREW.some((c) => c.id === crewId)) return { error: "Choose a crew member." };
  const { problem } = await storeProfile(viewer, { displayName, crewId });
  if (problem) return { error: problem };
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function askAssistant(question: string): Promise<import("@/lib/assistant").Answer> {
  const viewer = await getViewer();
  if (!viewer) return { blocks: [{ type: "text", text: "Your session has ended. Sign in again." }], suggestions: [] };
  const { answer } = await import("@/lib/assistant");
  const { getMyHealth } = await import("@/lib/my-health");
  const { dailyMissions, progress } = await import("@/lib/gamification");
  const { loadTipActions } = await import("@/lib/profile-store");
  const q = String(question ?? "").slice(0, 300);
  const [health, actions] = await Promise.all([getMyHealth(viewer), loadTipActions(viewer)]);
  const missions = dailyMissions(health.assessment, health.env);
  const p = progress(health.logs, actions, missions.map((m) => m.id));
  return answer(q, {
    assessment: health.assessment,
    env: health.env,
    logs: health.logs,
    recordedDays: health.recordedDays,
    progress: p,
    missions,
    doneToday: p.doneToday,
  });
}

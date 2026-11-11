"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { ENV_COOKIE, ENVIRONMENTS } from "@/lib/environments";
import { DEMO_COOKIE } from "@/lib/session";
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
  redirect("/dashboard");
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
  if (data.session) redirect("/dashboard");
  return { message: "Check your email for a confirmation link, then sign in." };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  (await cookies()).delete(DEMO_COOKIE);
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
  redirect("/dashboard");
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

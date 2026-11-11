"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState<AuthState, FormData>(signIn, {});
  const [upState, upAction, upPending] = useActionState<AuthState, FormData>(signUp, {});
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;

  return (
    <form action={mode === "in" ? inAction : upAction} className="space-y-4">
      <label className="block">
        <span className="text-sm text-slate-300">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={!configured}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-sky-400 disabled:opacity-50"
        />
      </label>
      <label className="block">
        <span className="text-sm text-slate-300">Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          required
          minLength={mode === "up" ? 8 : undefined}
          disabled={!configured}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none focus:border-sky-400 disabled:opacity-50"
        />
      </label>

      {state.error && <p role="alert" className="text-sm text-rose-400">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-emerald-400">{state.message}</p>}

      <button
        type="submit"
        disabled={!configured || pending}
        className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        disabled={!configured}
        className="w-full text-sm text-slate-400 hover:text-white disabled:opacity-50"
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoButton } from "@/components/DemoButton";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/env";
import { getViewer } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getViewer()) redirect("/me");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/"><Logo className="text-lg" /></Link>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-xl font-semibold">Sign in to AstroMed</h1>
          {!isSupabaseConfigured && (
            <p className="mt-3 rounded-lg bg-amber-400/10 p-3 text-sm text-amber-200">
              Sign-in isn&apos;t set up yet. Add the Supabase keys to <code>web/.env.local</code>, or use the demo below.
            </p>
          )}
          {error === "confirm" && (
            <p className="mt-3 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-300">
              That confirmation link didn&apos;t work. It may have expired, so try signing in again.
            </p>
          )}
          <div className="mt-6"><LoginForm configured={isSupabaseConfigured} /></div>
        </div>
        <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" />
        </div>
        <DemoButton className="mt-6 w-full" />
        <p className="mt-2 text-center text-xs text-slate-500">The demo uses sample health data and needs no account.</p>
      </div>
    </main>
  );
}

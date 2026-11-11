import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { getCurrentEnvironment } from "@/lib/mission";
import { requireViewer } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const env = await getCurrentEnvironment();
  const who = viewer.kind === "demo" ? viewer.name : viewer.email;

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-white/10 p-4 md:flex md:w-60 md:flex-col md:border-r md:border-b-0">
        <Link href="/dashboard" className="block px-3 py-2"><Logo /></Link>
        <div className="mt-2 md:mt-6"><NavLinks /></div>
        <div className="mt-4 hidden border-t border-white/10 pt-4 md:mt-auto md:block">
          <p className="truncate px-3 text-xs text-slate-500" title={who}>{who}</p>
          <form action={signOut}>
            <button type="submit" className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
              <LogOut className="h-4 w-4" aria-hidden />
              {viewer.kind === "demo" ? "Leave demo" : "Sign out"}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-3">
          <Link href="/mission" className="text-sm text-slate-400 hover:text-white">
            Mission: <span className="font-medium text-slate-100">{env.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            {viewer.kind === "demo" && (
              <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-200">Demo mode</span>
            )}
            <form action={signOut} className="md:hidden">
              <button type="submit" className="text-sm text-slate-400 hover:text-white">
                {viewer.kind === "demo" ? "Leave demo" : "Sign out"}
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </div>
    </div>
  );
}

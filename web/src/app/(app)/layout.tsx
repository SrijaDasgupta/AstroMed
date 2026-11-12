import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { Main } from "@/components/Main";
import { TabBar } from "@/components/TabBar";
import { OfflineSync } from "@/components/OfflineSync";
import { MobileNav } from "@/components/MobileNav";
import { NavLinks } from "@/components/NavLinks";
import { ReminderNotifier } from "@/components/ReminderNotifier";
import { loadSchedule, todaySchedule } from "@/lib/reminder-store";
import { getMissionContext } from "@/lib/mission";
import { requireViewer } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  const ctx = await getMissionContext();
  const env = ctx.env;
  const pending = todaySchedule(await loadSchedule(viewer)).filter((i) => i.state === "open").map(({ key, time, title, kind }) => ({ key, time, title, kind }));
  const who = viewer.kind === "demo" ? viewer.name : viewer.email;

  const signOutForm = (
    <div className="mt-4 border-t border-white/10 pt-4 md:mt-auto">
      <p className="truncate px-3 text-xs text-slate-500" title={who}>{who}</p>
      <form action={signOut}>
        <button type="submit" className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden />
          {viewer.kind === "demo" ? "Leave demo" : "Sign out"}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden border-r border-white/10 p-4 print:hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:overflow-y-auto">
        <Link href="/start" className="block px-3 py-2"><Logo /></Link>
        <div className="mt-6"><NavLinks /></div>
        {signOutForm}
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-background/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur print:hidden md:static md:bg-transparent md:px-6 md:backdrop-blur-none">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav>
              <Link href="/start" className="block px-3 py-2"><Logo /></Link>
              <div className="mt-4"><NavLinks /></div>
              {signOutForm}
            </MobileNav>
            <Link href="/mission" className="truncate text-sm text-slate-400 hover:text-white">
              <span className="hidden sm:inline">Mission: </span><span className="font-medium text-slate-100">{ctx.none ? <><span className="sm:hidden">No mission</span><span className="hidden sm:inline">none set</span></> : ctx.mission?.name ?? env.name}</span>
              {ctx.none && <span className="ml-2 text-sky-300">Add one</span>}
              {ctx.mission && <span className="ml-2 text-slate-500">{ctx.startsIn ? `starts in ${ctx.startsIn} d` : `day ${ctx.day}`}</span>}
            </Link>
          </div>
          {viewer.kind === "demo" && (
            <span className="shrink-0 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-200">Demo mode</span>
          )}
        </header>
        <OfflineSync owner={viewer.kind === "user" ? viewer.id : "demo"} />
        <Main>{children}</Main>
        <ReminderNotifier items={pending} />
        <TabBar />
      </div>
    </div>
  );
}

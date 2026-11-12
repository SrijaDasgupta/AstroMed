import Link from "next/link";
import { CloudOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Offline · AstroMed" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-10">
      <Logo className="text-lg" />
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <CloudOff className="h-7 w-7 text-amber-300" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold">You&apos;re offline</h1>
        <p className="mt-2 text-sm text-slate-300">This page hasn&apos;t been opened on this device yet, so there&apos;s no saved copy. Pages you&apos;ve opened before still work, and the daily log keeps entries on this device until you reconnect.</p>
        <p className="mt-3 text-sm text-amber-100">In an emergency, don&apos;t wait for a connection: follow your crew&apos;s medical procedures and your crew medical officer.</p>
        <Link href="/log" className="mt-5 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">Open the daily log</Link>
      </div>
    </main>
  );
}

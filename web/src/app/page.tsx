import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, HeartPulse, Moon } from "lucide-react";
import { DemoButton } from "@/components/DemoButton";
import { Logo } from "@/components/Logo";
import { getViewer } from "@/lib/session";

const FEATURES = [
  { icon: HeartPulse, title: "Personal baselines", body: "Each crew member's own normal heart rate, variability and sleep, not a population average." },
  { icon: Activity, title: "Mission-aware alerts", body: "Gravity, radiation and signal delay change what counts as a warning sign." },
  { icon: Moon, title: "Evidence-based tips", body: "Guidance drawn from NASA health standards and Human Research Program evidence reports." },
];

export default async function Home() {
  if (await getViewer()) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <Logo className="text-lg" />
        <Link href="/login" className="text-sm text-slate-300 hover:text-white">Sign in</Link>
      </header>

      <section className="flex flex-1 flex-col justify-center py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-sky-400">Crew health beyond Earth</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Know when an astronaut drifts from their own normal.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          AstroMed tracks each crew member against their personal baseline and the mission they&apos;re on,
          from the ISS to the surface of Mars.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400">
            Sign in
          </Link>
          <DemoButton />
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <Icon className="h-5 w-5 text-sky-400" aria-hidden />
              <h2 className="mt-3 font-medium">{title}</h2>
              <p className="mt-1 text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

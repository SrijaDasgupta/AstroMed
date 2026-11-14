import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/Logo";
import { HAZARD_PAGES, HRP_RISKS_URL } from "@/lib/space-risks";
import { AI_USE, TEAM } from "@/lib/submission";
import { SOURCES } from "@/lib/tips";

export const metadata: Metadata = {
  title: "About AstroMed: data, sources and AI use",
  description: "The NASA and partner agency data AstroMed is built on, the tools used, and how AI was used to build it.",
};

const OTHER_DATA = [
  { name: "MMASH: Multilevel Monitoring of Activity and Sleep in Healthy people (Rossi et al., 2020)", note: "Real heart rate, heart rate variability, sleep and mood recordings used as starting baselines. PhysioNet, ODC-BY 1.0.", url: "https://physionet.org/content/mmash/1.0.0/" },
  { name: "Tesseract OCR (tesseract.js) and its English language data", note: "Reads text from health photos on the device. Apache 2.0.", url: "https://github.com/naptha/tesseract.js" },
];

const TOOLS = [
  ["Next.js 15 and React 19", "https://nextjs.org"],
  ["TypeScript", "https://www.typescriptlang.org"],
  ["Tailwind CSS", "https://tailwindcss.com"],
  ["Supabase (database, sign-in, file storage)", "https://supabase.com"],
  ["Vercel (hosting)", "https://vercel.com"],
  ["Lucide icons", "https://lucide.dev"],
  ["Zod (data validation)", "https://zod.dev"],
  ["Vitest (automated safety tests)", "https://vitest.dev"],
  ["Anthropic SDK (optional bring-your-own-key photo analysis)", "https://github.com/anthropics/anthropic-sdk-typescript"],
] as const;

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-300 underline decoration-white/20 underline-offset-2 hover:text-sky-200">
      {children} <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}

export default function AboutPage() {
  const nasa = Object.values(SOURCES).filter((s) => !s.url.includes("asc-csa"));
  const csa = Object.values(SOURCES).filter((s) => s.url.includes("asc-csa"));
  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-8">
      <header className="flex items-center justify-between">
        <Link href="/"><Logo className="text-lg" /></Link>
        <Link href="/slides" className="text-sm text-slate-300 hover:text-white">Slides</Link>
      </header>

      <section>
        <p className="text-xs uppercase tracking-widest text-sky-400">NASA Space Apps Challenge 2026</p>
        <h1 className="mt-2 text-3xl font-semibold">About AstroMed</h1>
        <p className="mt-3 text-slate-300">
          A visual health self-assessment tool for astronauts. It shows each reading against the astronaut&apos;s own normal range and mission,
          checks for the problems NASA links to spaceflight, and says what to do, how soon, and with whom, adjusted for the distance from Earth.
        </p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-slate-400">Team</dt><dd>{TEAM.name}</dd>
          <dt className="text-slate-400">Team member{TEAM.members.length > 1 ? "s" : ""}</dt><dd>{TEAM.members.join(", ")}</dd>
          <dt className="text-slate-400">Challenge</dt><dd>&ldquo;{TEAM.challenge}.&rdquo;</dd>
          <dt className="text-slate-400">Try it</dt><dd><Link href="/" className="text-sky-300 hover:text-sky-200">Open AstroMed and press Try the demo</Link> (no account needed)</dd>
        </dl>
      </section>

      <section>
        <h2 className="text-xl font-semibold">NASA data and resources</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {nasa.map((s) => <li key={s.url}><A href={s.url}>{s.title}</A></li>)}
          <li><A href={HRP_RISKS_URL}>NASA Human Research Program: the 5 hazards and 17 risks of human spaceflight</A>, with each hazard page ({Object.keys(HAZARD_PAGES).length} pages)</li>
        </ul>
        <p className="mt-3 text-sm text-slate-400">
          Used for: about 80 conditions from NASA-STD-3001 Vol. 1 Table E.2-2 grouped by hazard; cabin CO₂, temperature, humidity and noise limits; NASA&apos;s energy equation and 2.5 L water minimum; the 600 mSv career radiation limit; bone-loss rates; the 3-minute reaction-time test; decompression sickness signs; and the page-level citation on every tip and check.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Space Agency Partner data</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {csa.map((s) => <li key={s.url}><A href={s.url}>{s.title}</A></li>)}
        </ul>
        <p className="mt-3 text-sm text-slate-400">Used for the radiation pages: neutrons make up about 30% of the radiation dose on the ISS.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Other data and open-source software</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {OTHER_DATA.map((d) => <li key={d.url}><A href={d.url}>{d.name}</A><span className="block text-slate-400">{d.note}</span></li>)}
          {TOOLS.map(([name, url]) => <li key={url}><A href={url}>{name}</A></li>)}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-xl font-semibold">Use of AI</h2>
        <p className="mt-2 text-sm text-slate-300">{AI_USE}</p>
      </section>

      <p className="text-xs text-slate-500">
        AstroMed is a hackathon project, not a medical device. It doesn&apos;t diagnose or recommend medicines. No NASA logos or branding are used; NASA and CSA are cited as sources only and don&apos;t endorse this project.
      </p>
    </main>
  );
}

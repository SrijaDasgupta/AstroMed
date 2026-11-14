import type { Metadata } from "next";
import { AlertTriangle, ArrowRight, Brain, Eye, Gauge, Globe2, HeartPulse, Moon, Radiation, Rocket, ShieldCheck, Timer, Wind, WifiOff } from "lucide-react";
import { VitalSigns } from "@/components/astromed";
import { MissionScene } from "@/components/home/MissionScene";
import { Logo } from "@/components/Logo";
import { AI_USE, TEAM } from "@/lib/submission";

export const metadata: Metadata = {
  title: "AstroMed: project demo slides",
  description: "Seven-slide demo of AstroMed for the NASA Space Apps Challenge 2026.",
};

const TOTAL = 7;

function Slide({ n, title, kicker, children }: { n: number; title?: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section aria-label={`Slide ${n} of ${TOTAL}`} className="slide flex min-h-screen snap-start items-center justify-center px-4 py-8 print:min-h-0 print:p-0">
      <div className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl pb-12 xl:aspect-video border border-white/10 bg-[#0a1020] p-8 sm:p-12 print:rounded-none print:border-0">
        {kicker && <p className="text-xs font-medium uppercase tracking-widest text-sky-400">{kicker}</p>}
        {title && <h2 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>}
        <div className="mt-6 flex-1">{children}</div>
        <p className="absolute bottom-4 right-6 text-xs tabular-nums text-slate-500">{n} / {TOTAL}</p>
        <p className="absolute bottom-4 left-6 text-xs text-slate-500">AstroMed · NASA Space Apps 2026</p>
      </div>
    </section>
  );
}

const HAZARDS = [
  { icon: Radiation, name: "Space radiation" },
  { icon: Brain, name: "Isolation and confinement" },
  { icon: Globe2, name: "Distance from Earth" },
  { icon: Gauge, name: "Altered gravity" },
  { icon: Wind, name: "Hostile closed environments" },
];

const CHECKS = [
  { icon: HeartPulse, name: "Vitals and SpO₂", note: "vs. your own normal" },
  { icon: Moon, name: "Sleep orbit", note: "sleep and naps" },
  { icon: Timer, name: "Reaction-time test", note: "NASA's 3-min PVT-B" },
  { icon: Wind, name: "Cabin air and noise", note: "CO₂ ≤ 3 mmHg, 85 dBA" },
  { icon: Eye, name: "Amsler grid", note: "eye changes (SANS)" },
  { icon: Gauge, name: "Balance and stand-up", note: "after gravity changes" },
  { icon: Rocket, name: "After-spacewalk", note: "signs of the bends" },
  { icon: Radiation, name: "Radiation dose", note: "vs. 600 mSv limit" },
];

export default function SlidesPage() {
  return (
    <main className="h-screen snap-y snap-mandatory overflow-y-auto bg-[#050811] text-slate-100 print:h-auto print:overflow-visible">
      <style>{`@media print { @page { size: landscape; margin: 0 } .slide { break-after: page; height: 100vh } }`}</style>

      {/* 1. Title */}
      <Slide n={1}>
        <div className="grid h-full items-center gap-8 md:grid-cols-2">
          <div>
            <Logo className="text-2xl" />
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">Health self-assessment for the hazards of deep space</h1>
            <dl className="mt-8 space-y-2 text-sm">
              <div><dt className="inline text-slate-400">Team: </dt><dd className="inline">{TEAM.name}</dd></div>
              <div><dt className="inline text-slate-400">Team member: </dt><dd className="inline">{TEAM.members.join(", ")}</dd></div>
              <div><dt className="inline text-slate-400">Challenge: </dt><dd className="inline">&ldquo;{TEAM.challenge}&rdquo;</dd></div>
            </dl>
          </div>
          <div className="aspect-[3/1] overflow-hidden rounded-2xl border border-white/10"><MissionScene envId="mars-transit" progress={0.35} /></div>
        </div>
      </Slide>

      {/* 2. Intro: the problem */}
      <Slide n={2} kicker="Why it matters" title="On the way to Mars, help is up to 24 minutes away">
        <div className="grid h-full gap-8 md:grid-cols-2">
          <div className="space-y-4 text-lg text-slate-300">
            <p>Missions are getting longer and farther: Artemis to the Moon, then Mars. A message to Earth takes 4–24 minutes each way.</p>
            <p>Astronauts will have to <span className="text-white">assess their own health and act first</span>, across the five hazards NASA has identified.</p>
          </div>
          <ul className="grid content-start gap-3">
            {HAZARDS.map(({ icon: Icon, name }) => (
              <li key={name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"><Icon className="h-5 w-5 text-sky-300" aria-hidden /> {name}</li>
            ))}
          </ul>
        </div>
      </Slide>

      {/* 3. User experience */}
      <Slide n={3} kicker="How it works" title="Log in a minute. See what changed. Know what to do.">
        <div className="grid h-full gap-6 md:grid-cols-[1fr_1.1fr]">
          <ol className="space-y-4 text-slate-300">
            {[
              ["Log", "Vitals, sleep, food, exercise and mood in under a minute, or a guided checkup. Photos of device screens are read on the device."],
              ["See", "Every reading against your own normal range, colour-coded with an icon and a label, never colour alone."],
              ["Act", "One of four urgency levels, worded for your distance from Earth: self-care, next conference, flight surgeon today, or act now with your crew."],
            ].map(([t, b], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 font-semibold text-slate-950">{i + 1}</span>
                <span><span className="font-medium text-white">{t}. </span>{b}</span>
              </li>
            ))}
          </ol>
          <div className="self-start rounded-2xl border border-amber-300/40 bg-amber-300/5 p-5">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/15 px-2.5 py-0.5 text-xs font-medium text-amber-200"><AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Contact today</p>
            <p className="mt-3 text-lg font-semibold">Tell your crew medical officer, and report to the flight surgeon today</p>
            <p className="mt-1 text-sm text-slate-400">Mars transit, day 59 · a reply can take twice the 4–24 minute signal delay</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>• High blood pressure (150/92 mmHg), above your usual range.</li>
              <li>• You ate 59% of your NASA-calculated energy need.</li>
              <li>• CO₂ of 3.6 mmHg is above NASA&apos;s 3 mmHg limit: check the ventilation near you.</li>
            </ul>
          </div>
        </div>
      </Slide>

      {/* 4. What it tracks */}
      <Slide n={4} kicker="What it checks" title="Everyday vitals, plus checks made for space">
        <div className="grid h-full gap-6 md:grid-cols-2">
          <div className="origin-top-left md:-mb-16 md:scale-[0.9]">
            <VitalSigns heartRateBpm={64} readings={[
              { label: "Resting heart rate", value: "64", unit: "bpm", when: "Today" },
              { label: "Blood pressure", value: "118/76", unit: "mmHg", when: "Today" },
              { label: "Body temperature", value: "36.7", unit: "°C", when: "Today" },
              { label: "Oxygen saturation", value: "97", unit: "%", when: "Today" },
            ]} />
          </div>
          <ul className="grid content-start gap-3 sm:grid-cols-2">
            {CHECKS.map(({ icon: Icon, name, note }) => (
              <li key={name} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-sky-300" aria-hidden /> {name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{note}</p>
              </li>
            ))}
          </ul>
        </div>
      </Slide>

      {/* 5. NASA and partner data */}
      <Slide n={5} kicker="Built on open space agency data" title="Every threshold and tip cites a NASA page">
        <div className="grid h-full gap-6 md:grid-cols-3">
          {[
            ["~80", "spaceflight conditions from NASA-STD-3001 Vol. 1 (Table E.2-2), grouped under the 5 hazards"],
            ["17", "NASA Human Research Program risks, each linked to where AstroMed tracks it"],
            ["5", "HRP evidence reports (sleep, heart, behavioral health, bone, radiation) cited by page"],
          ].map(([big, text]) => (
            <div key={big} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-5xl font-semibold text-sky-300">{big}</p>
              <p className="mt-2 text-sm text-slate-300">{text}</p>
            </div>
          ))}
          <ul className="space-y-2 text-sm text-slate-300 md:col-span-3">
            <li>• <span className="text-white">NASA-STD-3001 Vol. 2 limits:</span> cabin CO₂, temperature, humidity and noise; NASA&apos;s energy equation and 2.5 L water minimum.</li>
            <li>• <span className="text-white">NASA limits and rates:</span> 600 mSv career radiation limit, 1–1.5% bone loss a month, the 3-minute reaction-time test, signs of the bends.</li>
            <li>• <span className="text-white">Canadian Space Agency:</span> radiation monitoring (neutrons are about 30% of ISS dose).</li>
            <li>• <span className="text-white">MMASH (PhysioNet):</span> real heart, sleep and mood recordings as starting baselines until you have your own.</li>
          </ul>
        </div>
      </Slide>

      {/* 6. Safe and designed for astronauts */}
      <Slide n={6} kicker="Designed for astronauts" title="Safe, private, and it works without a signal">
        <div className="grid h-full gap-4 md:grid-cols-2">
          {[
            [ShieldCheck, "Safety first", "No diagnosis and no medicine recommendations. Emergency phrases always escalate. 85 automated safety tests."],
            [Globe2, "Distance-aware", "On Mars the crew medical officer acts first; in orbit, the flight surgeon is a call away."],
            [WifiOff, "Phone and offline", "Installs to the home screen and keeps logging without a connection."],
            [HeartPulse, "Engaging", "Animated mission home, body map, habit missions, XP, ranks and streaks."],
          ].map(([Icon, t, b]) => {
            const I = Icon as typeof ShieldCheck;
            return (
              <div key={t as string} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="flex items-center gap-2 font-medium"><I className="h-5 w-5 text-sky-300" aria-hidden /> {t as string}</p>
                <p className="mt-1 text-sm text-slate-300">{b as string}</p>
              </div>
            );
          })}
          <p className="text-xs text-slate-500 md:col-span-2">AI use: {AI_USE}</p>
        </div>
      </Slide>

      {/* 7. Future and try it */}
      <Slide n={7} kicker="What's next" title="From the ISS to the surface of Mars">
        <div className="grid h-full gap-8 md:grid-cols-2">
          <ul className="space-y-3 text-lg text-slate-300">
            <li>• Direct sync with wearables and medical devices.</li>
            <li>• A crew medical officer view for the whole crew.</li>
            <li>• Validation with flight surgeons and analog missions: Antarctic stations, HERA, CHAPEA.</li>
            <li>• On Earth: the same self-checks for remote workers, polar teams and anyone far from care.</li>
          </ul>
          <div className="flex flex-col justify-center rounded-2xl border border-sky-400/30 bg-sky-400/5 p-6">
            <p className="text-sm text-slate-400">Try it now, no account needed</p>
            <a href={TEAM.liveUrl} className="mt-2 break-all text-2xl font-semibold text-sky-300 hover:text-sky-200">{TEAM.liveUrl.replace("https://", "")}</a>
            <p className="mt-3 inline-flex items-center gap-1 text-sm text-slate-300">Press <span className="text-white">Try the demo</span> <ArrowRight className="h-4 w-4" aria-hidden /> Mars transit, day 59</p>
          </div>
        </div>
      </Slide>
    </main>
  );
}

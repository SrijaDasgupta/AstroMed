"use client";

import { useEffect, useId, useState } from "react";
import { button, field, inset, ModuleCard } from "./ui";
import styles from "./motion.module.css";

const phases = [
  { label: "Breathe in", seconds: 4, scale: 1.45 },
  { label: "Breathe out", seconds: 6, scale: 1 },
] as const;

function Breathing() {
  const [phase, setPhase] = useState<0 | 1 | null>(null);
  const current = phase === null ? null : phases[phase];

  useEffect(() => {
    if (phase === null) return;
    const timer = window.setTimeout(() => setPhase(phase === 0 ? 1 : 0), phases[phase].seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <section className={inset}>
      <h3 className="font-semibold">Guided breathing</h3>
      <div aria-hidden="true" className="flex h-28 items-center justify-center">
        <div className={`h-16 w-16 rounded-full border border-sky-300/75 bg-sky-400/15 shadow-[0_0_32px_#38bdf850] ${styles.breath}`}
          style={{ transform: `scale(${current?.scale ?? 1})`, transitionDuration: current ? `${current.seconds}s` : undefined }} />
      </div>
      <p aria-live="polite" className="mb-3 text-sm text-slate-300">{current ? `${current.label} · ${current.seconds}s` : "Ready when you are"}</p>
      <button type="button" className={button} onClick={() => setPhase(current ? null : 0)}>{current ? "Stop breathing exercise" : "Start breathing exercise"}</button>
    </section>
  );
}

const starOrder = [2, 4, 1, 3, 5];
const symbols = ["✦", "☾", "☉", "☾", "✦", "☉"];
const symbolNames = ["star", "moon", "sun", "moon", "star", "sun"];

function StarGames() {
  const [game, setGame] = useState<"constellation" | "pairs">("constellation");
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [hint, setHint] = useState("");
  const select = useId();

  function reset() {
    setStep(0);
    setOpen([]);
    setMatched([]);
    setHint("");
  }

  function turnCard(index: number) {
    const [first, second] = open;
    if (first === undefined || second !== undefined) {
      setOpen([index]);
      return;
    }
    if (symbols[first] === symbols[index]) {
      setMatched([...matched, first, index]);
      setOpen([]);
    } else {
      setOpen([first, index]);
    }
  }

  return (
    <section className={inset}>
      <h3 className="font-semibold">Space mini-games</h3>
      <label htmlFor={select} className="mt-2 block text-sm text-slate-300">
        Game
        <select id={select} value={game} className={`mt-1 ${field}`} onChange={(event) => {
          setGame(event.target.value === "pairs" ? "pairs" : "constellation");
          reset();
        }}>
          <option value="constellation">Connect the constellation</option>
          <option value="pairs">Match celestial pairs</option>
        </select>
      </label>
      <p className="my-3 text-sm text-slate-300" aria-live="polite">
        {game === "constellation"
          ? step === 5 ? "Constellation complete." : hint || `Select star ${step + 1}.`
          : matched.length === 6 ? "All pairs matched." : open.length === 2 ? "Try another pair." : `${matched.length / 2} of 3 pairs matched.`}
      </p>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {game === "constellation" ? starOrder.map((number) => (
          <button type="button" key={number} aria-label={`Star ${number}`} disabled={step >= number} className={button}
            onClick={() => {
              if (number === step + 1) {
                setStep(step + 1);
                setHint("");
              } else setHint(`Look for star ${step + 1} next.`);
            }}>✦ {number}</button>
        )) : symbols.map((symbol, index) => {
          const found = matched.includes(index);
          const visible = open.includes(index) || found;
          return <button type="button" key={index} className={button} disabled={visible} onClick={() => turnCard(index)}
            aria-label={`Card ${index + 1}${visible ? `, ${symbolNames[index]}` : ""}${found ? ", matched" : ""}`}>
            {visible ? symbol : "◇"}
          </button>;
        })}
      </div>
      <button type="button" className={button} onClick={reset}>Reset game</button>
    </section>
  );
}

/**
 * Breathing exercise and two short games for a calm break.
 * Mood check-ins stay in the Journal form, which runs AstroMed's safety check on what people write.
 */
export function Wellness() {
  return (
    <ModuleCard title="Take a short break" intro="A paced breathing exercise and two quick games. Nothing here is saved.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Breathing />
        <StarGames />
      </div>
    </ModuleCard>
  );
}

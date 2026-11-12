"use client";

import { useId, useState, type FormEvent } from "react";
import { button, field, inset } from "./ui";

export type ReadingInput = { name: string; doseMsv: number; hours: number };

/** Lets a crew member compare a dosimeter reading with the mission environments. Not saved. */
export function RadiationEntry({ onAdd }: { onAdd: (reading: ReadingInput) => void }) {
  const id = useId();
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("environment") ?? "").trim();
    const dose = Number(data.get("dose"));
    const hours = Number(data.get("hours"));
    if (!name || !Number.isFinite(dose) || dose < 0 || !Number.isFinite(hours) || hours <= 0 || !Number.isFinite(dose / hours)) {
      setMessage("Enter a name, a dose of 0 or more, and a time longer than 0 hours.");
      return;
    }
    onAdd({ name, doseMsv: dose, hours });
    form.reset();
    setMessage("Reading added and selected.");
  }

  return (
    <form className={`mt-4 ${inset}`} onSubmit={submit}>
      <h3 className="font-medium">Compare your own dosimeter reading</h3>
      <p className="mt-1 text-xs text-slate-400">Shows where your reading sits against NASA&apos;s estimates. It isn&apos;t saved and is cleared when you leave the page.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm" htmlFor={`${id}-environment`}>
          Name
          <input id={`${id}-environment`} name="environment" required maxLength={80} placeholder="For example EVA 2" className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm" htmlFor={`${id}-dose`}>
          Dose (mSv)
          <input id={`${id}-dose`} name="dose" type="number" min="0" step="any" inputMode="decimal" required className={`mt-1 ${field}`} />
        </label>
        <label className="block text-sm" htmlFor={`${id}-hours`}>
          Over how many hours
          <input id={`${id}-hours`} name="hours" type="number" min="0" step="any" inputMode="decimal" required className={`mt-1 ${field}`} />
        </label>
      </div>
      <button className={`mt-3 ${button}`} type="submit">Add reading</button>
      <p className="mt-2 text-sm text-slate-300" role="status">{message}</p>
    </form>
  );
}

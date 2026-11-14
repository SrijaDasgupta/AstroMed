"use client";

import { saveSleepSessionAction } from "@/app/actions";
import { SleepOrbit } from "./SleepOrbit";
import type { SleepRecord } from "./sleep-records";

/** Sleep orbit wired to AstroMed's storage: saves through a server action, which rejects on failure so the card can retry. */
export function SleepOrbitCard({ records }: { records: readonly SleepRecord[] }) {
  return (
    <SleepOrbit
      records={records}
      saveRecord={async (r) => { await saveSleepSessionAction({ id: r.id, kind: r.kind, startedAt: r.startedAt, endedAt: r.endedAt }); }}
    />
  );
}

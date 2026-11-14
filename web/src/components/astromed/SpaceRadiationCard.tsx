"use client";

import { saveRadiationReadingAction } from "@/app/actions";
import { SpaceRadiation, type RadiationEnvironment } from "./SpaceRadiation";

/** Radiation card wired to AstroMed's storage, so typed-in readings are saved. */
export function SpaceRadiationCard(props: { environments: readonly RadiationEnvironment[]; initialId?: string; saved: readonly RadiationEnvironment[] }) {
  return <SpaceRadiation {...props} saveReading={async (r) => { await saveRadiationReadingAction(r); }} />;
}

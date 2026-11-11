import { redirect } from "next/navigation";

// Crew pages were replaced by My vitals: AstroMed is for an astronaut checking their own health.
export default function CrewRedirect() {
  redirect("/vitals");
}

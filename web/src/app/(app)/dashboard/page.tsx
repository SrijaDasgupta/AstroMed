import { redirect } from "next/navigation";

// The crew overview was removed: AstroMed is for an astronaut checking their own health.
export default function DashboardPage() {
  redirect("/me");
}

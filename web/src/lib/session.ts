import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { setRequestZone, ZONE_COOKIE } from "@/lib/dates";

export const DEMO_COOKIE = "astromed_demo";

export type Viewer =
  | { kind: "user"; id: string; email: string }
  | { kind: "demo"; name: string };

export async function getViewer(): Promise<Viewer | null> {
  const store = await cookies();
  const zone = store.get(ZONE_COOKIE)?.value;
  setRequestZone(zone ? decodeURIComponent(zone) : undefined);
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) return { kind: "user", id: data.user.id, email: data.user.email ?? "" };
  }
  if (store.get(DEMO_COOKIE)?.value === "1") return { kind: "demo", name: "Demo flight surgeon" };
  return null;
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

import { cookies } from "next/headers";
import type { BodyNote } from "@/lib/body-notes";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const DEMO = "astromed_demo_body";
export const DEMO_BODY_COOKIE = DEMO;
const DEMO_MAX = 12;
const demoOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" };

async function readDemo(): Promise<BodyNote[]> {
  try {
    const v = JSON.parse((await cookies()).get(DEMO)?.value ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
async function writeDemo(list: BodyNote[]) {
  (await cookies()).set(DEMO, JSON.stringify(list.slice(0, DEMO_MAX)), demoOptions);
}

export async function listBodyNotes(viewer: Viewer): Promise<{ notes: BodyNote[]; problem?: string }> {
  if (viewer.kind === "demo") return { notes: await readDemo() };
  const { data, error } = await (await createClient())
    .from("body_notes")
    .select("id, area, side, kind, severity, started_on, notes, resolved_on, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  return {
    problem: error?.message,
    notes: (data ?? []).map((n) => ({
      id: n.id, area: n.area, side: n.side ?? undefined, kind: n.kind, severity: n.severity, startedOn: n.started_on,
      notes: n.notes ?? undefined, resolvedOn: n.resolved_on ?? undefined, createdAt: n.created_at,
    })),
  };
}

export async function addBodyNote(viewer: Viewer, n: Omit<BodyNote, "id" | "createdAt" | "resolvedOn">): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    const list = await readDemo();
    list.unshift({ ...n, notes: n.notes?.slice(0, 200), id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    await writeDemo(list);
    return {};
  }
  const { error } = await (await createClient()).from("body_notes").insert({
    user_id: viewer.id, area: n.area, side: n.side ?? null, kind: n.kind, severity: n.severity, started_on: n.startedOn, notes: n.notes ?? null,
  });
  return { problem: error?.message };
}

export async function resolveBodyNote(viewer: Viewer, id: string, on: string | null): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    await writeDemo((await readDemo()).map((n) => (n.id === id ? { ...n, resolvedOn: on ?? undefined } : n)));
    return {};
  }
  const { error } = await (await createClient()).from("body_notes").update({ resolved_on: on }).eq("id", id);
  return { problem: error?.message };
}

export async function deleteBodyNote(viewer: Viewer, id: string): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    await writeDemo((await readDemo()).filter((n) => n.id !== id));
    return {};
  }
  const { error } = await (await createClient()).from("body_notes").delete().eq("id", id);
  return { problem: error?.message };
}

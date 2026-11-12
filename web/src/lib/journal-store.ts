import { cookies } from "next/headers";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";

export type JournalEntry = { id: string; date: string; mood?: number; prompt?: string; body: string; tags: string[]; createdAt: string };

const DEMO = "astromed_demo_journal";
export const DEMO_JOURNAL_COOKIE = DEMO;
const DEMO_MAX_ENTRIES = 5;
const DEMO_MAX_BODY = 400;

async function readDemo(): Promise<JournalEntry[]> {
  try {
    const v = JSON.parse((await cookies()).get(DEMO)?.value ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function listEntries(viewer: Viewer, limit = 90): Promise<{ entries: JournalEntry[]; problem?: string }> {
  if (viewer.kind === "demo") return { entries: await readDemo() };
  const supabase = await createClient();
  const { data, error } = await fetchAll<{ id: string; entry_date: string; mood: number | null; prompt: string | null; body: string; tags: string[] | null; created_at: string }>(
    (from, to) => supabase.from("journal_entries").select("id, entry_date, mood, prompt, body, tags, created_at").order("entry_date", { ascending: false }).order("created_at", { ascending: false }).range(from, to),
    limit,
  );
  return {
    problem: error,
    entries: (data ?? []).map((e) => ({ id: e.id, date: e.entry_date, mood: e.mood ?? undefined, prompt: e.prompt ?? undefined, body: e.body, tags: e.tags ?? [], createdAt: e.created_at })),
  };
}

export async function addEntry(viewer: Viewer, e: Omit<JournalEntry, "id" | "createdAt">): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    const list = await readDemo();
    list.unshift({ ...e, body: e.body.slice(0, DEMO_MAX_BODY), id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    (await cookies()).set(DEMO, JSON.stringify(list.slice(0, DEMO_MAX_ENTRIES)), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return {};
  }
  const { error } = await (await createClient()).from("journal_entries").insert({
    user_id: viewer.id, entry_date: e.date, mood: e.mood ?? null, prompt: e.prompt ?? null, body: e.body, tags: e.tags,
  });
  return { problem: error?.message };
}

export async function deleteEntry(viewer: Viewer, id: string): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    const list = (await readDemo()).filter((x) => x.id !== id);
    (await cookies()).set(DEMO, JSON.stringify(list), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return {};
  }
  const { error } = await (await createClient()).from("journal_entries").delete().eq("id", id);
  return { problem: error?.message };
}

import { cookies } from "next/headers";
import type { BodyNote, NoteUpdate } from "@/lib/body-notes";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";

const DEMO = "astromed_demo_body";
export const DEMO_BODY_COOKIE = DEMO;
const DEMO_MAX = 10;
const DEMO_MAX_UPDATES = 4;
const DEMO_MAX_TEXT = 240;
const demoOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" };

type NoteRow = { id: string; area: string; side: BodyNote["side"] | null; kind: BodyNote["kind"]; severity: number; started_on: string; notes: string | null; photo_path: string | null; photo_analysis: BodyNote["photoAnalysis"] | null; topics: string[] | null; resolved_on: string | null; created_at: string };
type UpdateRow = { id: string; note_id: string; severity: number; body: string | null; photo_path: string | null; photo_analysis: NoteUpdate["photoAnalysis"] | null; created_at: string };

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };
const PHOTO_MAX = 8 * 1024 * 1024;
const BUCKET = "records";

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

/** Checks a photo before upload. Returns an error message, or undefined if it's fine (or there's no photo). */
export function checkPhoto(file: File | null): string | undefined {
  if (!file || file.size === 0) return undefined;
  if (!PHOTO_TYPES[file.type]) return "Photos must be JPEG, PNG, WebP or HEIC.";
  if (file.size > PHOTO_MAX) return "Photos must be under 8 MB.";
  return undefined;
}

async function uploadPhoto(viewer: Extract<Viewer, { kind: "user" }>, file: File | null): Promise<{ path?: string; problem?: string }> {
  if (!file || file.size === 0) return {};
  const bad = checkPhoto(file);
  if (bad) return { problem: bad };
  const path = `${viewer.id}/problems/${crypto.randomUUID()}.${PHOTO_TYPES[file.type]}`;
  const { error } = await (await createClient()).storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  return error ? { problem: error.message } : { path };
}

export async function listBodyNotes(viewer: Viewer): Promise<{ notes: BodyNote[]; problem?: string }> {
  if (viewer.kind === "demo") return { notes: await readDemo() };
  const supabase = await createClient();
  const [n, u] = await Promise.all([
    fetchAll<NoteRow>((from, to) => supabase.from("body_notes").select("id, area, side, kind, severity, started_on, notes, photo_path, photo_analysis, topics, resolved_on, created_at").order("created_at", { ascending: false }).order("id").range(from, to)),
    fetchAll<UpdateRow>((from, to) => supabase.from("body_note_updates").select("id, note_id, severity, body, photo_path, photo_analysis, created_at").order("created_at").order("id").range(from, to)),
  ]);
  const updates = new Map<string, NoteUpdate[]>();
  for (const x of u.data ?? []) {
    const list = updates.get(x.note_id) ?? [];
    list.push({ id: x.id, severity: x.severity, body: x.body ?? undefined, photoPath: x.photo_path ?? undefined, photoAnalysis: x.photo_analysis ?? undefined, createdAt: x.created_at });
    updates.set(x.note_id, list);
  }
  return {
    problem: n.error ?? u.error,
    notes: (n.data ?? []).map((x) => ({
      id: x.id, area: x.area, side: x.side ?? undefined, kind: x.kind, severity: x.severity, startedOn: x.started_on,
      notes: x.notes ?? undefined, photoPath: x.photo_path ?? undefined, photoAnalysis: x.photo_analysis ?? undefined, topics: x.topics ?? [], resolvedOn: x.resolved_on ?? undefined,
      createdAt: x.created_at, updates: updates.get(x.id) ?? [],
    })),
  };
}

export async function addBodyNote(viewer: Viewer, n: Omit<BodyNote, "id" | "createdAt" | "resolvedOn" | "updates" | "photoPath">, photo: File | null): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    if (photo && photo.size > 0) return { problem: "Photos need an account. Remove the photo, or sign in." };
    const list = await readDemo();
    list.unshift({ ...n, notes: n.notes?.slice(0, DEMO_MAX_TEXT), id: crypto.randomUUID(), createdAt: new Date().toISOString(), updates: [] });
    await writeDemo(list);
    return {};
  }
  const up = await uploadPhoto(viewer, photo);
  if (up.problem) return { problem: up.problem };
  const { error } = await (await createClient()).from("body_notes").insert({
    user_id: viewer.id, area: n.area, side: n.side ?? null, kind: n.kind, severity: n.severity, started_on: n.startedOn,
    notes: n.notes ?? null, topics: n.topics ?? [], photo_path: up.path ?? null,
  });
  if (error && up.path) await (await createClient()).storage.from(BUCKET).remove([up.path]);
  return { problem: error?.message };
}

export async function addNoteUpdate(viewer: Viewer, noteId: string, u: { severity: number; body?: string }, photo: File | null): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    if (photo && photo.size > 0) return { problem: "Photos need an account. Remove the photo, or sign in." };
    const list = await readDemo();
    const note = list.find((x) => x.id === noteId);
    if (!note) return { problem: "Problem not found." };
    note.updates = [...(note.updates ?? []), { id: crypto.randomUUID(), severity: u.severity, body: u.body?.slice(0, DEMO_MAX_TEXT), createdAt: new Date().toISOString() }].slice(-DEMO_MAX_UPDATES);
    await writeDemo(list);
    return {};
  }
  const up = await uploadPhoto(viewer, photo);
  if (up.problem) return { problem: up.problem };
  const { error } = await (await createClient()).from("body_note_updates").insert({
    note_id: noteId, user_id: viewer.id, severity: u.severity, body: u.body ?? null, photo_path: up.path ?? null,
  });
  if (error && up.path) await (await createClient()).storage.from(BUCKET).remove([up.path]);
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

/** Deletes a problem, its updates and its photos. */
export async function deleteBodyNote(viewer: Viewer, id: string): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    await writeDemo((await readDemo()).filter((n) => n.id !== id));
    return {};
  }
  const supabase = await createClient();
  const [n, u] = await Promise.all([
    supabase.from("body_notes").select("photo_path").eq("id", id).maybeSingle(),
    supabase.from("body_note_updates").select("photo_path").eq("note_id", id),
  ]);
  const paths = [n.data?.photo_path, ...(u.data ?? []).map((x) => x.photo_path)].filter(Boolean) as string[];
  if (paths.length) {
    const rm = await supabase.storage.from(BUCKET).remove(paths);
    if (rm.error) return { problem: rm.error.message };
  }
  const { error } = await supabase.from("body_notes").delete().eq("id", id);
  return { problem: error?.message };
}

/** Short-lived links to the user's own problem photos, keyed by storage path. */
export async function photoLinks(viewer: Viewer, notes: BodyNote[]): Promise<Record<string, string>> {
  if (viewer.kind === "demo") return {};
  const paths = notes.flatMap((n) => [n.photoPath, ...(n.updates ?? []).map((u) => u.photoPath)]).filter((p): p is string => Boolean(p) && p!.startsWith(`${viewer.id}/problems/`));
  if (!paths.length) return {};
  const { data } = await (await createClient()).storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
  return Object.fromEntries((data ?? []).flatMap((d) => (d.signedUrl && d.path ? [[d.path, d.signedUrl] as const] : [])));
}

/** Stores a finished AI photo analysis on the problem or update that owns the photo (row-level security limits it to the user's own rows). */
export async function savePhotoAnalysis(viewer: Viewer, target: "note" | "update", id: string, analysis: unknown): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") return { problem: "Photo analysis needs an account." };
  const { error, count } = await (await createClient())
    .from(target === "note" ? "body_notes" : "body_note_updates")
    .update({ photo_analysis: analysis }, { count: "exact" })
    .eq("id", id)
    .not("photo_path", "is", null);
  if (error) return { problem: error.message };
  return count ? {} : { problem: "Photo not found." };
}

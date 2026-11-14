import { cookies } from "next/headers";
import type { Viewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const RECORD_KINDS = [
  { id: "lab", label: "Lab results" },
  { id: "imaging", label: "Imaging" },
  { id: "prescription", label: "Prescription" },
  { id: "report", label: "Medical report" },
  { id: "wearable", label: "Wearable export" },
  { id: "other", label: "Other" },
] as const;
export type RecordKind = (typeof RECORD_KINDS)[number]["id"];

export const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG image",
  "image/jpeg": "JPEG image",
  "image/webp": "WebP image",
  "image/heic": "HEIC image",
  "text/csv": "CSV",
  "text/plain": "Text",
};
export const MAX_BYTES = 10 * 1024 * 1024;

export type HealthRecord = { id: string; title: string; kind: RecordKind; recordedOn?: string; fileName: string; mimeType: string; sizeBytes: number; notes?: string; findings?: string; measurements?: Measurement[]; createdAt: string };
export type Measurement = { label: string; value: string; unit: string };

/* Demo mode has no file storage, so photo imports keep their text and readings (not the photo) in a cookie. */
const DEMO_IMPORTS = "astromed_demo_imports";
export const DEMO_IMPORTS_COOKIE = DEMO_IMPORTS;
const DEMO_MAX_IMPORTS = 4;
const DEMO_MAX_FINDINGS = 500;

async function readDemoImports(): Promise<HealthRecord[]> {
  try {
    const v = JSON.parse((await cookies()).get(DEMO_IMPORTS)?.value ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function writeDemoImports(list: HealthRecord[]) {
  (await cookies()).set(DEMO_IMPORTS, JSON.stringify(list.slice(0, DEMO_MAX_IMPORTS)), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
}

/** Saves a photo import's text and readings in demo mode (the photo itself isn't kept). Safe to retry with the same id. */
export async function addDemoImport(meta: { id: string; title: string; recordedOn?: string; findings: string; measurements: Measurement[] }) {
  const list = (await readDemoImports()).filter((r) => r.id !== meta.id);
  list.unshift({
    id: meta.id, title: meta.title, kind: "report", recordedOn: meta.recordedOn, fileName: "", mimeType: "text/plain", sizeBytes: 0,
    notes: "Imported from a photo (the photo is kept only with an account)", createdAt: new Date().toISOString(),
    findings: meta.findings.slice(0, DEMO_MAX_FINDINGS), measurements: meta.measurements.slice(0, 12),
  });
  await writeDemoImports(list);
}

export async function listRecords(viewer: Viewer): Promise<{ records: HealthRecord[]; problem?: string }> {
  if (viewer.kind === "demo") return { records: await readDemoImports() };
  const { data, error } = await (await createClient())
    .from("records")
    .select("id, title, kind, recorded_on, file_name, mime_type, size_bytes, notes, findings, measurements, created_at")
    .order("recorded_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return {
    problem: error?.message,
    records: (data ?? []).map((r) => ({ id: r.id, title: r.title, kind: r.kind, recordedOn: r.recorded_on ?? undefined, fileName: r.file_name, mimeType: r.mime_type, sizeBytes: r.size_bytes, notes: r.notes ?? undefined, findings: r.findings ?? undefined, measurements: Array.isArray(r.measurements) ? r.measurements : undefined, createdAt: r.created_at })),
  };
}

function safeName(name: string) {
  return name.normalize("NFKD").replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").slice(-80) || "file";
}

export async function uploadRecord(viewer: Viewer, file: File, meta: { title: string; kind: RecordKind; recordedOn?: string; notes?: string; findings?: string; measurements?: Measurement[]; id?: string }): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") return { problem: "Uploading records needs an account. Sign in to upload." };
  if (!ALLOWED_TYPES[file.type]) return { problem: "Upload a PDF, image (PNG, JPEG, WebP, HEIC), CSV or text file." };
  if (file.size === 0 || file.size > MAX_BYTES) return { problem: "Files must be under 10 MB." };
  const supabase = await createClient();
  // A retried save with the same id is already done.
  if (meta.id) {
    const { data: existing } = await supabase.from("records").select("id").eq("id", meta.id).maybeSingle();
    if (existing) return {};
  }
  const path = `${viewer.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const up = await supabase.storage.from("records").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return { problem: up.error.message };
  const { error } = await supabase.from("records").insert({
    ...(meta.id ? { id: meta.id } : {}),
    user_id: viewer.id, title: meta.title, kind: meta.kind, recorded_on: meta.recordedOn ?? null, notes: meta.notes ?? null, findings: meta.findings ?? null, measurements: meta.measurements?.length ? meta.measurements : null,
    file_path: path, file_name: file.name.slice(0, 200), mime_type: file.type, size_bytes: file.size,
  });
  if (error) {
    await supabase.storage.from("records").remove([path]);
    return { problem: error.message };
  }
  return {};
}

async function pathOf(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("records").select("file_path").eq("id", id).maybeSingle();
  return { supabase, path: data?.file_path as string | undefined };
}

/** A link to the file that works for 60 seconds. */
export async function recordLink(viewer: Viewer, id: string): Promise<string | undefined> {
  if (viewer.kind === "demo") return undefined;
  const { supabase, path } = await pathOf(id);
  if (!path) return undefined;
  const { data } = await supabase.storage.from("records").createSignedUrl(path, 60);
  return data?.signedUrl;
}

export async function deleteRecord(viewer: Viewer, id: string): Promise<{ problem?: string }> {
  if (viewer.kind === "demo") {
    await writeDemoImports((await readDemoImports()).filter((r) => r.id !== id));
    return {};
  }
  const { supabase, path } = await pathOf(id);
  if (!path) return { problem: "Record not found." };
  const rm = await supabase.storage.from("records").remove([path]);
  if (rm.error) return { problem: rm.error.message };
  const { error } = await supabase.from("records").delete().eq("id", id);
  return { problem: error?.message };
}

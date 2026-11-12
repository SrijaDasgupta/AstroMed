/**
 * Daily log entries made without a connection are kept in this browser and sent when it reconnects,
 * with the time they were really logged. Each entry is tagged with its owner so it is only ever sent
 * for the person who wrote it.
 */
export const OFFLINE_KEY = "astromed_offline_logs";
export const OFFLINE_EVENT = "astromed-offline-queue";

export type QueuedLog = { owner: string; at: string; fields: [string, string][] };

function read(): QueuedLog[] {
  try {
    const v = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function write(list: QueuedLog[]) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(list.slice(-50)));
  window.dispatchEvent(new Event(OFFLINE_EVENT));
}

export function queueLog(owner: string, form: FormData) {
  const fields = [...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$ACTION")).map(([k, v]) => [k, v as string] as [string, string]);
  write([...read(), { owner, at: new Date().toISOString(), fields }]);
}

export const queuedFor = (owner: string) => read().filter((q) => q.owner === owner);

export function removeQueued(item: QueuedLog) {
  write(read().filter((q) => !(q.owner === item.owner && q.at === item.at)));
}

export function toFormData(item: QueuedLog) {
  const fd = new FormData();
  for (const [k, v] of item.fields) fd.append(k, v);
  fd.set("loggedAt", item.at);
  return fd;
}

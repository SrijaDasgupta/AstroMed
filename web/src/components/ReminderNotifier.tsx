"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

type Item = { key: string; time: string; title: string; kind: "med" | "rem" };

const supported = () => typeof window !== "undefined" && "Notification" in window;

/** Shows a browser notification at each open item's time while AstroMed is open in a tab. */
export function ReminderNotifier({ items }: { items: Item[] }) {
  useEffect(() => {
    if (!supported() || Notification.permission !== "granted") return;
    const today = new Date().toDateString();
    const timers = items.map((i) => {
      const [h, m] = i.time.split(":").map(Number);
      const at = new Date();
      at.setHours(h, m, 0, 0);
      const wait = at.getTime() - Date.now();
      if (wait < 0 || wait > 24 * 3600 * 1000) return undefined;
      return window.setTimeout(() => {
        const seen = `astromed-notified-${today}-${i.key}`;
        if (localStorage.getItem(seen)) return; // only once, even with several tabs open
        localStorage.setItem(seen, "1");
        new Notification(i.kind === "med" ? `Time to take ${i.title}` : i.title, { body: `AstroMed reminder · ${i.time}`, tag: i.key });
      }, wait);
    });
    return () => timers.forEach((t) => t && window.clearTimeout(t));
  }, [items]);
  return null;
}

export function NotificationToggle() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported" | null>(null);
  useEffect(() => setPerm(supported() ? Notification.permission : "unsupported"), []);
  if (perm === null) return null;
  if (perm === "unsupported") return <p className="text-xs text-slate-500">This browser can&apos;t show notifications.</p>;
  if (perm === "granted") return <p className="inline-flex items-center gap-1.5 text-xs text-emerald-300"><Bell className="h-3.5 w-3.5" aria-hidden />Notifications on while AstroMed is open</p>;
  if (perm === "denied") return <p className="inline-flex items-center gap-1.5 text-xs text-slate-400"><BellOff className="h-3.5 w-3.5" aria-hidden />Notifications are blocked in your browser settings</p>;
  return (
    <button type="button" onClick={async () => { setPerm(await Notification.requestPermission()); window.location.reload(); }} className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 px-3 py-1.5 text-sm text-sky-200 hover:bg-sky-400/10">
      <Bell className="h-4 w-4" aria-hidden /> Turn on notifications
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, RefreshCw } from "lucide-react";
import { submitDailyLog } from "@/app/actions";
import { OFFLINE_EVENT, queuedFor, removeQueued, toFormData } from "@/lib/offline-queue";

/** Shows when the device is offline, and sends daily log entries saved offline once it's back. */
export function OfflineSync({ owner }: { owner: string }) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [sent, setSent] = useState(0);

  useEffect(() => {
    let busy = false;
    const count = () => setPending(queuedFor(owner).length);
    const flush = async () => {
      if (busy || !navigator.onLine) return;
      busy = true;
      let n = 0;
      for (const item of queuedFor(owner)) {
        try {
          const res = await submitDailyLog({}, toFormData(item));
          removeQueued(item); // saved, or rejected as invalid: either way don't retry forever
          if (res.result) n++;
        } catch {
          break; // still can't reach the server; try again later
        }
      }
      busy = false;
      count();
      if (n) { setSent(n); router.refresh(); }
    };
    const update = () => { setOnline(navigator.onLine); if (navigator.onLine) flush(); };
    update();
    count();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener(OFFLINE_EVENT, count);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener(OFFLINE_EVENT, count);
    };
  }, [owner, router]);

  if (online && !pending && !sent) return null;
  return (
    <div role="status" className={`flex items-center gap-2 border-b px-4 py-2 text-sm print:hidden ${online ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`}>
      {online ? <RefreshCw className="h-4 w-4 shrink-0" aria-hidden /> : <CloudOff className="h-4 w-4 shrink-0" aria-hidden />}
      <span className="min-w-0 flex-1">
        {!online
          ? <>You&apos;re offline. Pages you&apos;ve opened still work, and daily logs are kept on this device until you reconnect.{pending ? ` ${pending} waiting to send.` : ""} In an emergency, follow your crew&apos;s medical procedures.</>
          : pending ? <>Sending {pending} entr{pending === 1 ? "y" : "ies"} saved while offline…</>
          : <>Sent {sent} entr{sent === 1 ? "y" : "ies"} saved while offline.</>}
      </span>
      {online && sent > 0 && !pending && <button type="button" onClick={() => setSent(0)} className="text-xs underline">Dismiss</button>}
    </div>
  );
}

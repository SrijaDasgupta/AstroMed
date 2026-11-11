"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Tells the server this browser's time zone so "today" matches the user's own calendar. */
export function ZoneCookie() {
  const router = useRouter();
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const value = encodeURIComponent(tz);
    if (document.cookie.split("; ").includes(`astromed_tz=${value}`)) return;
    document.cookie = `astromed_tz=${value}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    router.refresh();
  }, [router]);
  return null;
}

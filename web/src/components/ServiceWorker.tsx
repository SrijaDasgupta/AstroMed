"use client";

import { useEffect } from "react";

/** Registers the offline service worker (production only, so it never interferes with development). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/** On signed-out pages: forget saved copies of the previous person's pages. */
export function ClearOfflineCache() {
  useEffect(() => {
    if ("caches" in window) caches.delete("astromed-pages-v1").catch(() => {});
    navigator.serviceWorker?.controller?.postMessage("clear-pages");
  }, []);
  return null;
}

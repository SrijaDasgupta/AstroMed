/* AstroMed service worker: lets pages you've opened work without a connection.
   - App code and icons: cached on first use (they're versioned, so they never go stale).
   - Pages: always fetched fresh when online; the last copy is shown when offline.
   - Anything else (saving, sign-in, AI, photos) always goes to the network.
   Saved pages are wiped when you sign out (see ClearOfflineCache). */
const STATIC = "astromed-static-v1";
const PAGES = "astromed-pages-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll([OFFLINE_URL, "/icon/192"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("astromed-") && k !== STATIC && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "clear-pages") event.waitUntil(caches.delete(PAGES));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon") || url.pathname === "/apple-icon") {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !res.redirected && !url.pathname.startsWith("/auth") && !url.pathname.startsWith("/records/")) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { cacheName: PAGES }).then((hit) => hit || caches.match(OFFLINE_URL))),
    );
  }
});

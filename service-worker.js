/* POWER-PLAY PERFECT SERVICE WORKER • 100% Auto-Update */

const CACHE_NAME = "pp-cache-" + Date.now();   // ← Forces new cache every update
const STATIC_ASSETS = [
  "/Power-Play/",
  "/Power-Play/index.html",
  "/Power-Play/manifest.json",
  "/Power-Play/style.css",
  "/Power-Play/icon.png"
];

/* Install — Cache fresh files instantly */
self.addEventListener("install", (event) => {
  console.log("[SW] Installing new version:", CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );

  self.skipWaiting(); // ← Activate immediately
});

/* Activate — Delete old caches */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating & removing old caches");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim(); // ← Take control immediately
});

/* Fetch — Always try online first for HTML (ensures latest content) */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Don't cache external heavy sources
  if (
    url.hostname.includes("youtube.com") ||
    url.hostname.includes("ytimg.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com")
  ) {
    return event.respondWith(fetch(req));
  }

  // Network-first for HTML pages
  if (req.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Cache-first for static files
  event.respondWith(
    caches.match(req).then(cached => {
      return (
        cached ||
        fetch(req).then(res => {
          // Cache GET requests only
          if (req.method === "GET" && res.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(req, res.clone()));
          }
          return res;
        })
      );
    })
  );
});

/* Network-first function */
async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    return caches.match(req);
  }
}

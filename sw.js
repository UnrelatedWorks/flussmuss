/* Fluss Muss service worker
   - Precaches the same-origin app shell (HTML/JS/CSS/fonts/icons/Leaflet) so the
     planner opens fully offline.
   - Same-origin assets (incl. glossary images) are cached on first view.
   - Cross-origin CARTO/OSM map tiles use stale-while-revalidate, so a route's
     map keeps working offline once it has been viewed online.
*/
const VERSION = "flussmuss-v1";
const SHELL = VERSION + "-shell";
const RUNTIME = VERSION + "-runtime";

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./riverdata.js",
  "./glossary.js",
  "./fonts.css",
  "./manifest.webmanifest",
  "./vendor/leaflet.js",
  "./vendor/leaflet.css",
  "./vendor/images/marker-icon.png",
  "./vendor/images/marker-icon-2x.png",
  "./vendor/images/marker-shadow.png",
  "./vendor/images/layers.png",
  "./vendor/images/layers-2x.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) =>
      Promise.all(SHELL_ASSETS.map((u) => cache.add(u).catch((e) => console.warn("precache miss", u, e))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Same-origin: cache-first, fall back to network and cache it; nav fallback to index.
  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
          return res;
        }).catch(() => caches.match("./index.html"))
      )
    );
    return;
  }

  // Cross-origin (map tiles): stale-while-revalidate.
  event.respondWith(
    caches.open(RUNTIME).then((cache) =>
      cache.match(req).then((hit) => {
        const network = fetch(req).then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || network;
      })
    )
  );
});

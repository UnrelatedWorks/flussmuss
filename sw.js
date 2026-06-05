/* RiversOfMuc service worker
   - Precaches the same-origin app shell so the planner opens offline.
   - Runtime-caches cross-origin deps (React, Babel, Leaflet), Google Fonts and
     CARTO/OSM map tiles with stale-while-revalidate, so after one online visit the
     whole experience (incl. real maps already viewed) works without a network.
*/
const VERSION = "riversofmuc-v2";
const SHELL = VERSION + "-shell";
const RUNTIME = VERSION + "-runtime";

/* App shell — same-origin files required to boot. */
const SHELL_ASSETS = [
  "./index.html",
  "./prototype.jsx",
  "./riverdata.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) =>
      // add each asset individually so one miss can't abort the whole precache
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

  // Same-origin: cache-first (app shell + data), fall back to network and cache it.
  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
          return res;
        }).catch(() => caches.match("./index.html"))
      )
    );
    return;
  }

  // Cross-origin (CDN libs, fonts, map tiles): stale-while-revalidate.
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

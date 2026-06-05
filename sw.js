/* RiversOfMuc service worker
   Fully self-contained, single-origin PWA — no CDNs, fonts or map tiles to fetch.
   Precaches the app shell so the planner opens offline; network-first when online
   so code updates always propagate, with cache fallback when there's no network. */
const VERSION = "riversofmuc-v4";
const SHELL = VERSION + "-shell";

/* App shell — fully self-contained, no external origins. */
const SHELL_ASSETS = [
  "./index.html",
  "./app.js",
  "./fonts.css",
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
      Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Same-origin (app shell + code + data): network-first so code updates always
  // propagate, falling back to cache when offline. The app has no cross-origin
  // dependencies, so this is the only strategy needed.
  event.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(SHELL).then((c) => c.put(req, copy));
      return res;
    }).catch(() =>
      caches.match(req).then((hit) => hit || caches.match("./index.html"))
    )
  );
});

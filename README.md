# Fluss Muss

Mobile-first **PWA** tour planner for paddlers on Isar, Loisach, Ammer, Amper & Würm —
plus the French canoe classics **Ardèche, Dordogne & Tarn**.
A redesign of [kanu-info-isar.de](http://kanu-info-isar.de) (Christian Löhnert) in the
flussmuss style. **No build step, no backend** — serve the deploy folder as static
files over HTTPS.

```
python3 -m http.server 8137      # local test → http://localhost:8137
# production: any static host (must be HTTPS for the service worker / install prompt)
```

## Deploy

Everything that belongs on the server lives in **`2 server/`** — upload the
*contents* of that folder to the web root. Before uploading, refresh the gauge
snapshot (see below) and copy the regenerated `pegeldata.js` in.

## What's inside
- `index.html` · `app.js` — vanilla-JS single-page planner (Start → Touren → Tour),
  plus the **Pegel** tab (gauges & flood warning levels).
- `riverdata.js` — 173 downstream route nodes (towns, weirs/portages, cautions, gauges)
  across 5 rivers, mined from the original canoe-map PDFs. Regenerate with
  `node ../sources/kanu/build-riverdata.js > riverdata.js`.
- `pegeldata.js` — snapshot of all ~800 Bavarian gauges from the
  [HND Meldestufen table](https://www.hnd.bayern.de/pegel/meldestufen/tabellen)
  (water level, discharge, current Meldestufe) plus the Meldestufen thresholds
  for the gauges on our 5 rivers, matched to the route waypoints in `riverdata.js`.
  **Regenerate before each deploy:** `node tools/build-pegeldata.js`
  (hnd.bayern.de sends no CORS headers, so the PWA cannot fetch live values itself —
  every gauge links out to its live HND page instead).
- `riverdata-fr.js` — hand-curated route nodes for Ardèche (Vogüé→Saint-Martin),
  Dordogne (Argentat→Beynac) and Tarn (Ispagnac→Le Rozier), compiled from official
  sources (Préfecture de l'Ardèche arrêté 2025, tarn-amont.fr, OT Vallée de la
  Dordogne roadbook, eauxvives.org, OSM). Extends `RIVERS`/`RIVER_ORDER`/`RIVER_META`
  (with `country: "Frankreich"`); must load after `riverdata.js`, before `app.js`.
- `pegeldata-fr.js` — snapshot of the 9 Hub'Eau gauges on those routes, plus curated
  navigation thresholds (arrêté limits) and waypoint matching.
  **Regenerate before each deploy:** `node tools/build-pegeldata-fr.js`
  Unlike HND, Hub'Eau **does send CORS headers**, so the app additionally fetches
  live values client-side (5-min TTL); the snapshot is the offline fallback.
- `glossary.js` + `begriffe/` — the 49-term illustrated "Begriffe" glossary.
- `vendor/leaflet.*` — Leaflet 1.9.4 (local). Map tiles come from CARTO/OSM online and
  are cached by the service worker after first view (offline-after-view).
- `sw.js` + `manifest.webmanifest` + `icons/` — PWA shell (installable, offline).
  Bump `VERSION` in `sw.js` whenever shipped assets change.
- `fonts.css` — self-contained Patrick Hand + Nunito Sans (base64, no external fetch).

## Notes
- Route data © Christian Löhnert · kanu-info-isar.de, reused with permission + attribution.
- Pegel/Meldestufen data: Hochwassernachrichtendienst Bayern · www.hnd.bayern.de
  (Bayerisches Landesamt für Umwelt). Values shown are a snapshot, not live.

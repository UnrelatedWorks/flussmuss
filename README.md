# Fluss Muss — deployment folder

Mobile-first **PWA** tour planner for paddlers on Isar, Loisach, Ammer, Amper & Würm.
A redesign of [kanu-info-isar.de](http://kanu-info-isar.de) (Christian Löhnert) in the
flussmuss style. **No build step, no backend** — serve this folder as static files over HTTPS.

```
python3 -m http.server 8137      # local test → http://localhost:8137
# production: any static host (must be HTTPS for the service worker / install prompt)
```

## What's inside
- `index.html` · `app.js` — vanilla-JS single-page planner (Start → Touren → Tour).
- `riverdata.js` — 173 downstream route nodes (towns, weirs/portages, cautions, gauges)
  across 5 rivers, mined from the original canoe-map PDFs. Regenerate with
  `node ../sources/kanu/build-riverdata.js > riverdata.js`.
- `glossary.js` + `begriffe/` — the 49-term illustrated "Begriffe" glossary.
- `vendor/leaflet.*` — Leaflet 1.9.4 (local). Map tiles come from CARTO/OSM online and
  are cached by the service worker after first view (offline-after-view).
- `sw.js` + `manifest.webmanifest` + `icons/` — PWA shell (installable, offline).
- `fonts.css` — self-contained Patrick Hand + Nunito Sans (base64, no external fetch).

## Notes
- Gauges (Pegel) are shown as route waypoints but **not live** yet (planned: HND Bayern).
- All data © Christian Löhnert · kanu-info-isar.de, reused with permission + attribution.

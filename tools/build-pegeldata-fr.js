#!/usr/bin/env node
/* ============================================================
   Fluss Muss · Pegel-Snapshot-Generator FRANKREICH
   Zieht die letzten Beobachtungen (Wasserstand H, Abfluss Q) der
   kuratierten Hub'Eau-Stationen an Ardèche, Dordogne & Tarn und
   schreibt pegeldata-fr.js. Die App holt zusätzlich LIVE-Werte
   direkt von Hub'Eau (API erlaubt CORS) — dieser Snapshot ist der
   Offline-/Fallback-Stand.

   Aufruf (im Projektordner):  node tools/build-pegeldata-fr.js
   → überschreibt ./pegeldata-fr.js  (danach auch nach "2 server" kopieren!)

   Einheiten Hub'Eau: H in mm (→ cm /10), Q in l/s (→ m³/s /1000).
   observations_tr akzeptiert mehrere code_entite kommagetrennt und
   grandeur_hydro=H,Q in EINEM Request (sort=desc → neueste zuerst).
   Quelle: Hub'Eau/SCHAPI · hubeau.eaufrance.fr (Open Data, Lizenz Etalab)
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT = path.join(__dirname, "..", "pegeldata-fr.js");

/* Kuratierte Stationen (Hub'Eau code_station) an den App-Strecken.
   match = Pegel-Wegpunktname in riverdata-fr.js ("<Fluss>|<Knotenname>"). */
const STATIONS = [
  { id: "V501401001", n: "Vogüé", r: "Ardèche", match: "Ardèche|Pegel Vogüé" },
  { id: "V505401001", n: "Vallon-Pont-d'Arc", r: "Ardèche", match: "Ardèche|Pegel Vallon-Pont-d'Arc" },
  { id: "V506401001", n: "Saint-Martin (Sauze)", r: "Ardèche", match: "Ardèche|Pegel Saint-Martin (Sauze)" },
  { id: "P135001001", n: "Argentat", r: "Dordogne", match: "Dordogne|Pegel Argentat" },
  { id: "P207002001", n: "Carennac", r: "Dordogne", match: "Dordogne|Pegel Carennac" },
  { id: "P230001001", n: "Lanzac–Souillac", r: "Dordogne", match: "Dordogne|Pegel Souillac" },
  { id: "P238001001", n: "Cénac", r: "Dordogne", match: "Dordogne|Pegel Cénac" },
  { id: "O312102002", n: "Montbrun (Pont)", r: "Tarn", match: "Tarn|Pegel Montbrun" },
  { id: "O314101001", n: "Mostuéjouls [La Muse]", r: "Tarn", match: "Tarn|Pegel Mostuéjouls" }
];

/* Handkuratierte Befahrungs-Schwellwerte (cm an der Stations-Skala).
   warn = erhöhte Vorsicht (orange), sperre = Befahrungsverbot/nicht fahren (rot). */
const THRESHOLDS = {
  "V501401001": { warn: -15, sperre: 20, label: "Arrêté inter-préfectoral 19.08.2025, Abschnitt Vogüé–Chauzon: orange ab −0,15 m, rot (Verbot) ab +0,20 m", src: "https://www.ardeche.gouv.fr/contenu/telechargement/28994/238009/file/202508_synoptique_annexe_AP_troncons_navig_ardeche.pdf" },
  "V505401001": { warn: 50, sperre: 130, label: "Arrêté inter-préfectoral 19.08.2025, Gorges de l'Ardèche: orange ab +0,50 m, rot (Verbot) ab +1,30 m; Abschnitt Ruoms–Salavas rot bereits ab +0,10 m", src: "https://www.ardeche.gouv.fr/contenu/telechargement/28994/238009/file/202508_synoptique_annexe_AP_troncons_navig_ardeche.pdf" },
  "O312102002": { warn: null, sperre: 110, label: "Offizielle Empfehlung tarn-amont.fr: ab 1,10 m am Pegel Montbrun nicht mehr fahren", src: "https://www.tarn-amont.fr/navigation/" }
};

const LEGEND =
  "Frankreich kennt keine Meldestufen wie Bayern — Hochwasser-Vigilance gilt " +
  "abschnittsweise (vigicrues.gouv.fr). Für Paddler gelten stattdessen " +
  "Befahrungsregeln per Arrêté préfectoral: die hinterlegten Grenzwerte " +
  "(orange = erhöhte Vorsicht, rot = nicht fahren/Verbot) beziehen sich auf " +
  "die jeweilige Stations-Skala. Werte ohne Gewähr — vor der Fahrt amtliche " +
  "Quellen und Beschilderung vor Ort prüfen.";

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "flussmuss-pwa-build" } }, (res) => {
      if (res.statusCode >= 300 && res.headers.location) return resolve(get(res.headers.location));
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve(body));
    }).on("error", reject);
  });
}

function fmtQ(ls) { // l/s → m³/s, deutsch formatiert wie pegeldata.js
  const q = ls / 1000;
  const s = q < 1 ? q.toFixed(2) : q < 10 ? q.toFixed(1) : String(Math.round(q));
  return s.replace(".", ",");
}
function fmtT(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  // Europe/Paris ≙ Europe/Berlin (gleiche Zeitzone)
  const loc = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  return p(loc.getDate()) + "." + p(loc.getMonth() + 1) + ". " + p(loc.getHours()) + ":" + p(loc.getMinutes());
}

async function main() {
  const codes = STATIONS.map((s) => s.id).join(",");
  // size=3000 ≈ >24 h Tiefe bei 9 Stationen — fängt auch selten meldende Stationen
  const url = "https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr?code_entite=" +
    codes + "&grandeur_hydro=H,Q&sort=desc&size=3000" +
    "&fields=code_station,grandeur_hydro,resultat_obs,date_obs";
  console.error("Lade " + url.slice(0, 100) + "… ");
  const j = JSON.parse(await get(url));

  // Neueste Beobachtung je (Station, Grandeur) — Daten kommen absteigend sortiert.
  const latest = {};
  for (const o of j.data || []) {
    const k = o.code_station + "|" + o.grandeur_hydro;
    if (!(k in latest)) latest[k] = o;
  }

  const gauges = STATIONS.map((s) => {
    const h = latest[s.id + "|H"], q = latest[s.id + "|Q"];
    const g = {
      n: s.n, r: s.r, id: s.id,
      u: "https://www.hydro.eaufrance.fr/stationhydro/" + s.id + "/fiche",
      t: h ? fmtT(h.date_obs) : (q ? fmtT(q.date_obs) : null),
      cm: h ? String(Math.round(h.resultat_obs / 10)) : null,
      d: null,
      q: q ? fmtQ(q.resultat_obs) : null,
      ms: null, fr: true
    };
    console.error("  " + s.r + "/" + s.n + ": " + (g.cm || "–") + " cm · " + (g.q || "–") + " m³/s · " + (g.t || "?"));
    return g;
  });

  const MATCH = {};
  STATIONS.forEach((s) => { MATCH[s.match] = s.id; });

  const stand = new Date().toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin"
  }).replace(",", " ·") + " Uhr";

  const js = [
    "/* ============================================================",
    "   Fluss Muss · Pegel-Datenlayer FRANKREICH  (generiert — nicht von Hand ändern)",
    "   Quelle: Hub'Eau Hydrométrie (SCHAPI/eaufrance, Open Data Etalab)",
    "   Snapshot als Offline-Fallback — die App lädt zusätzlich live.",
    "   Neu erzeugen:  node tools/build-pegeldata-fr.js",
    "   ============================================================ */",
    'window.PEGEL_FR_STAND = "' + stand + '";',
    "window.PEGEL_FR_LEGEND = " + JSON.stringify(LEGEND) + ";",
    "window.PEGEL_FR_MATCH = " + JSON.stringify(MATCH, null, 1) + ";",
    "window.PEGEL_FR_THRESHOLDS = " + JSON.stringify(THRESHOLDS, null, 1) + ";",
    "window.PEGEL_FR = [",
    gauges.map((g) => " " + JSON.stringify(g)).join(",\n"),
    "];",
    ""
  ].join("\n");

  fs.writeFileSync(OUT, js);
  console.error("OK → " + OUT + "  (Stand " + stand + ")");
}

main().catch((e) => { console.error("FEHLER:", e.message); process.exit(1); });

#!/usr/bin/env node
/* ============================================================
   Fluss Muss · Pegel-Snapshot-Generator
   Zieht die Meldestufen-Tabelle des Hochwassernachrichtendiensts
   Bayern (hnd.bayern.de/pegel/meldestufen/tabellen) plus die
   Meldestufen-Grenzwerte (Stammdaten) der Pegel an Isar, Loisach,
   Ammer, Amper & Würm und schreibt daraus pegeldata.js.

   Aufruf (im Projektordner):  node tools/build-pegeldata.js
   → überschreibt ./pegeldata.js  (danach auch nach "2 server" kopieren!)

   Quelle: Bayerisches Landesamt für Umwelt, www.hnd.bayern.de
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

const TABELLEN_URL = "https://www.hnd.bayern.de/pegel/meldestufen/tabellen";
const APP_RIVERS = ["Isar", "Loisach", "Ammer", "Amper", "Würm"];
const OUT = path.join(__dirname, "..", "pegeldata.js");

/* Zuordnung: Pegel-Wegpunkt in riverdata.js  →  HND-Messstellennummer.
   "Pegel Baierbrunn" (Isar) existiert beim HND nicht (Kraftwerkspegel). */
const MATCH = {
  "Isar|Pegel Rißbachdüker": "16001303",
  "Isar|Pegel/Abfluss Sylvensteinsee": "16002500",
  "Isar|Pegel Lenggries": "16003003",
  "Isar|Pegel Bad Tölz (Brücke)": "16003502",
  "Isar|Pegel/Abfluss Bad Tölz Kraftwerk": "16004006",
  "Isar|Pegel Puppling": "16004403",
  "Isar|Pegel Freising": "16006500",
  "Isar|Pegel Moosburg": "16006613",
  "Loisach|Pegel Farchant": "16403001",
  "Loisach|Pegel Eschenlohe": "16404106",
  "Loisach|Pegel Kochel": "16407002",
  "Loisach|Pegel Beuerberg": "16408504",
  "Ammer|Pegel Peißenberg": "16612001",
  "Ammer|Pegel Weilheim": "16613004",
  "Amper|Pegel Stegen": "16602303",
  "Amper|Pegel Grafrath": "16603000",
  "Amper|Pegel Fürstenfeldbruck": "16605006",
  "Amper|Pegel Ampermoching": "16606009",
  "Amper|Pegel Inkofen": "16607001",
  "Amper|Pegel Neumühlschwaig": "16609007",
  "Würm|Pegel Leutstetten": "16665008"
};

/* Offizielle Beschreibung der vier Meldestufen (hnd.bayern.de/hilfe/meldestufen) */
const LEGEND = [
  { s: 1, t: "Stellenweise kleinere Ausuferungen." },
  { s: 2, t: "Land- und forstwirtschaftliche Flächen überflutet oder leichte Verkehrsbehinderungen auf Hauptverkehrs- und Gemeindestraßen." },
  { s: 3, t: "Einzelne bebaute Grundstücke oder Keller überflutet oder Sperrung überörtlicher Verkehrsverbindungen oder vereinzelter Einsatz der Wasser- oder Dammwehr erforderlich." },
  { s: 4, t: "Bebaute Gebiete in größerem Umfang überflutet oder Einsatz der Wasser- oder Dammwehr in großem Umfang erforderlich." }
];

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

function dec(s) {
  return s
    .replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö").replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä").replace(/&Ouml;/g, "Ö").replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß").replace(/&nbsp;/g, " ").replace(/&shy;/g, "")
    .replace(/&amp;/g, "&").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
const nul = (v) => (v === "---" || v === "" ? null : v);

async function main() {
  console.error("Lade " + TABELLEN_URL + " …");
  const html = await get(TABELLEN_URL);
  const table = html.match(/<table[^>]*class="tblsort"[\s\S]*?<\/table>/);
  if (!table) throw new Error("Meldestufen-Tabelle nicht gefunden — Seitenlayout geändert?");
  const rows = table[0].match(/<tr[\s\S]*?<\/tr>/g).slice(1);

  const gauges = [];
  for (const r of rows) {
    const tds = r.match(/<td[\s\S]*?<\/td>/g) || [];
    if (tds.length < 8) continue;
    const url = (tds[0].match(/href="([^"]+)"/) || [])[1] || "";
    const id = (url.match(/-(\d{8,})/) || [])[1] || "";
    gauges.push({
      n: dec(tds[0]),                                   // Messstelle
      r: dec(tds[1].replace(/data-text="[^"]*"/, "")),  // Gewässer
      id: id,
      u: url.replace(/\/(wasserstand|abfluss)$/, ""),
      t: nul(dec(tds[2])),                              // Datum/Zeit
      cm: nul(dec(tds[3])),                             // Wasserstand [cm]
      d: nul(dec(tds[4])),                              // Änderung 2 h [cm]
      q: nul(dec(tds[5])),                              // Abfluss [m³/s]
      ms: nul(dec(tds[6]))                              // aktuelle Meldestufe
    });
  }
  console.error(gauges.length + " Pegel aus der Tabelle gelesen.");

  // Meldestufen-Grenzwerte für die Pegel an den App-Flüssen
  const thresholds = {};
  const rel = gauges.filter((g) => APP_RIVERS.includes(g.r) && g.u);
  for (const g of rel) {
    const sd = await get(g.u + "/stammdaten").catch(() => "");
    const grab = (label) => {
      const m = sd.match(new RegExp(label + ':?<\\/a>\\s*<\\/td>\\s*<td[^>]*>([^<]+)<')) ||
                sd.match(new RegExp(label + ':?<\\/td>\\s*<td[^>]*>([^<]+)<'));
      if (!m) return null;
      const v = m[1].replace(/&nbsp;/g, " ").trim();
      if (v.indexOf("--") >= 0) return null;
      const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
      return isNaN(n) ? null : n;
    };
    const th = {
      ms1: grab("Meldestufe 1"), ms2: grab("Meldestufe 2"),
      ms3: grab("Meldestufe 3"), ms4: grab("Meldestufe 4")
    };
    if (th.ms1 || th.ms2 || th.ms3 || th.ms4) thresholds[g.id] = th;
    console.error("  Grenzwerte " + g.r + "/" + g.n + ": " +
      (thresholds[g.id] ? JSON.stringify(th) : "keine (reiner Messpegel)"));
  }

  const stand = new Date().toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin"
  }).replace(",", " ·") + " Uhr";

  const js = [
    "/* ============================================================",
    "   Fluss Muss · Pegel-Datenlayer  (generiert — nicht von Hand ändern)",
    "   Quelle: Hochwassernachrichtendienst Bayern · www.hnd.bayern.de",
    "   (Bayerisches Landesamt für Umwelt) · Snapshot, keine Live-Daten.",
    "   Neu erzeugen:  node tools/build-pegeldata.js",
    "   ============================================================ */",
    'window.PEGEL_STAND = "' + stand + '";',
    "window.PEGEL_LEGEND = " + JSON.stringify(LEGEND, null, 1) + ";",
    "window.PEGEL_MATCH = " + JSON.stringify(MATCH, null, 1) + ";",
    "window.PEGEL_THRESHOLDS = " + JSON.stringify(thresholds, null, 1) + ";",
    "window.PEGEL = [",
    gauges.map((g) => " " + JSON.stringify(g)).join(",\n"),
    "];",
    ""
  ].join("\n");

  fs.writeFileSync(OUT, js);
  console.error("OK → " + OUT + "  (" + (js.length / 1024).toFixed(0) + " KB, Stand " + stand + ")");
}

main().catch((e) => { console.error("FEHLER:", e.message); process.exit(1); });

/* ============================================================
   RiversOfMuc · inline data layer  (NO backend / NO SQL engine)
   ------------------------------------------------------------
   Topology (RIVERS): the real put-in towns and weirs distilled
   from the kanu-info-isar.de canoe maps into clean, downstream-
   ordered nodes — the noisy raw DB (mostly-NULL names, OCR text)
   is not safe to drive a route directly.
   RIVER_META: provenance + obstacle tallies computed straight
   from the source database (map_sheets + obstacles).
   Data & maps: Christian Löhnert · kanu-info-isar.de
   ============================================================ */
window.RIVERS = {
  Amper: [
    ["Stegen", 0, "town", "Ausfluss Ammersee", null, [47.9778, 11.1583]],
    ["Grafrath", 6, "town", "Steg links · P am Pegel", null, [48.1208, 11.17]],
    ["Sohlrampe Zellhof", 11, "caution", "vorher ansehen", null, [48.15, 11.205]],
    ["Schöngeising", 14, "town", "Brücke, Einsetzen rechts", null, [48.1369, 11.214]],
    ["E-Werk Fürstenfeldbruck", 17, "port", "rechts 80 m tragen", "unterhalb am Steg wieder einsetzen", [48.17, 11.255]],
    ["Fürstenfeldbruck", 19, "town", "Stadt · Einkehr möglich", null, [48.1781, 11.2589]],
    ["E-Werk Olching", 25, "port", "links 100 m tragen", "unter der Brücke einsetzen", [48.2, 11.325]],
    ["Olching", 27, "town", "naturnahe Flußlandschaft", null, [48.2069, 11.3281]],
    ["Wehr Himmelreich", 29, "port", "links 100 m tragen", "nach dem Wehr links einsetzen", [48.24, 11.39]],
    ["Günding", 30, "town", "\n", null, [48.247, 11.394]],
    ["Dachau", 33, "town", "\n", null, [48.26, 11.434]],
    ["Wehr Hebertshausen", 36, "port", "rechts 100 m tragen", "unterhalb rechts einsetzen", [48.28, 11.47]],
    ["Hebertshausen", 37, "town", "\n", null, [48.2874, 11.4814]],
    ["Sohlrampen Ampermoching", 42, "caution", "\n", null, [48.31, 11.53]],
    ["Wehr Fahrenzhausen", 44, "port", "nicht befahrbar, links umtragen", "unterhalb wieder einsetzen", [48.3451, 11.5683]],
    ["Fahrenzhausen", 45, "town", "m", null, [48.319, 11.557]],
    ["Allershausen", 51, "town", "Brücke rechts", null, [48.43, 11.604]]],
  Isar: [
    ["Lenggries", 0, "town", "Floßlände · Einsetzen", null, [47.6831, 11.5719]],
    ["Bad Tölz", 13, "town", "unter der Isarbrücke", null, [47.76, 11.557]],
    ["Wehr Bad Tölz", 14, "port", "links umtragen (Floßrutsche)", "unterhalb wieder einsetzen", [47.7781, 11.54]],
    ["Gartenberg", 21, "town", "P am Ufer", null, [47.86, 11.46]],
    ["Wolfratshausen", 27, "town", "Loisach-Mündung", null, [47.9131, 11.4231]],
    ["Ickinger Wehr", 31, "port", "links 150 m umtragen", "unterhalb der Floßrutsche einsetzen", [47.95, 11.43]],
    ["Schäftlarn", 37, "town", "Kloster Schäftlarn", null, [47.96, 11.46]],
    ["Großhesseloher Wehr", 45, "port", "rechts umtragen", "unterhalb einsetzen", [48.07, 11.55]],
    ["Großhesselohe", 46, "town", "Brücke", null, [48.0731, 11.553]],
    ["Thalkirchen", 51, "town", "München · Floßlände", null, [48.101, 11.548]],
    ["München", 53, "town", "Innenstadt", null, [48.1371, 11.5754]]],
  Loisach: [
    ["Farchant", 0, "town", "Einsetzen unter der Brücke", null, [47.526, 11.114]],
    ["Eschenlohe", 9, "town", "Brücke", null, [47.5992, 11.1898]],
    ["Großweil", 19, "town", "Brücke", null, [47.6788, 11.304]],
    ["Kochel", 27, "town", "beim Kochelsee", null, [47.6618, 11.3588]],
    ["Schönmühl", 33, "town", "P am Wehr", null, [47.74, 11.38]],
    ["Beuerberg", 40, "town", "Kloster Beuerberg", null, [47.7837, 11.3998]],
    ["Wolfratshausen", 48, "town", "Mündung in die Isar", null, [47.9131, 11.4231]]],
  Ammer: [
    ["Böbinger Brücke", 0, "town", "Einsetzen", null, [47.7797, 11.0706]],
    ["Schnalz", 5, "caution", "Schwall — vorher ansehen", null, [47.8, 11.09]],
    ["Weilheim", 11, "town", "Stadt · Aussetzen", null, [47.84, 11.14]]],
  Würm: [
    ["Percha", 0, "town", "am Starnberger See", null, [47.998, 11.355]],
    ["Leutstetten", 6, "town", "Brücke", null, [48.04, 11.355]],
    ["Gauting", 13, "town", "Brücke · Aussetzen", null, [48.069, 11.378]]]
};;

window.RIVER_ORDER = ["Amper", "Isar", "Loisach", "Ammer", "Würm"];

window.RIVER_META = {
  "Isar": {
    "slug": "isar",
    "surveyFrom": 2019,
    "surveyTo": 2020,
    "sheets": 12,
    "obstacles": 62,
    "portages": 45,
    "cautions": 15
  },
  "Loisach": {
    "slug": "loisach",
    "surveyFrom": 2019,
    "surveyTo": 2019,
    "sheets": 6,
    "obstacles": 23,
    "portages": 19,
    "cautions": 9
  },
  "Ammer": {
    "slug": "ammer",
    "surveyFrom": 2019,
    "surveyTo": 2019,
    "sheets": 1,
    "obstacles": 8,
    "portages": 6,
    "cautions": 3
  },
  "Amper": {
    "slug": "amper",
    "surveyFrom": 2021,
    "surveyTo": 2021,
    "sheets": 9,
    "obstacles": 59,
    "portages": 47,
    "cautions": 26
  },
  "Würm": {
    "slug": "wuerm",
    "surveyFrom": 2021,
    "surveyTo": 2021,
    "sheets": 2,
    "obstacles": 8,
    "portages": 8,
    "cautions": 0
  }
};

window.RIVER_ATTRIBUTION = "Vermessung & Karten: Christian Löhnert · kanu-info-isar.de";


/* Static route images (filled by the Claude Code map-prep script). */
window.ROUTE_MAPS = window.ROUTE_MAPS || {};

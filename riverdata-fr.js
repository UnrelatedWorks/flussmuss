/* ============================================================
   Fluss Muss · Frankreich-Routen  (handkuratiert, Juni 2026)
   Ardèche · Dordogne · Tarn — die drei Kanu-Klassiker Frankreichs.
   Quellen: Préfecture de l'Ardèche (Arrêté inter-préfectoral 19.08.2025),
   SGGA gorgesdelardeche.fr, OT Vallée de la Dordogne (Roadbook Canoë),
   tarn-amont.fr (Navigationsregeln), eauxvives.org, Kanuverleiher-Topos,
   OpenStreetMap. km kumulativ flussabwärts ab Einstieg; est:true = geschätzt.
   Muss NACH riverdata.js und VOR app.js geladen werden.
   ============================================================ */
(function () {
  "use strict";
  var R = window.RIVERS = window.RIVERS || {};
  var META = window.RIVER_META = window.RIVER_META || {};
  var ORDER = window.RIVER_ORDER = window.RIVER_ORDER || [];

  R["Ardèche"] = [
    { "name": "Vogüé", "km": 0, "type": "town", "note": "Einstieg Kiesstrand linkes Ufer unterhalb des alten Dorfs; Farbskala am Vieux Pont.", "reentry": null, "latlng": [44.5497, 4.4157], "est": false, "section": "Vogüé – Vallon" },
    { "name": "Pegel Vogüé", "km": 0.3, "type": "gauge", "note": "Referenzpegel für den Abschnitt Vogüé–Chauzon (Arrêté: orange ab −0,15 m, rot/Verbot ab +0,20 m).", "reentry": null, "latlng": [44.5426, 4.4098], "est": false, "section": "Vogüé – Vallon" },
    { "name": "Wehr Lanas (Seuil de Lanas)", "km": 2.5, "type": "port", "note": "Glissière seit 2018 beschädigt und gesperrt — nicht befahren, umtragen.", "reentry": "Direkt unterhalb des Wehrs wieder einsetzen", "latlng": [44.535, 4.4], "est": true, "section": "Vogüé – Vallon" },
    { "name": "Balazuc", "km": 6, "type": "town", "note": "Ein-/Ausstieg am Strand unterhalb der Brücke; danach Cirque de Gens.", "reentry": null, "latlng": [44.5091, 4.373], "est": false, "section": "Vogüé – Vallon" },
    { "name": "Pradons", "km": 14, "type": "town", "note": "Ein-/Ausstieg; danach Défilés de Ruoms.", "reentry": null, "latlng": [44.4746, 4.3573], "est": false, "section": "Vogüé – Vallon" },
    { "name": "Wehr Ruoms (Seuil des Brasseries)", "km": 19.5, "type": "port", "note": "Wehr mit Kanurutsche (1989), 2021 wegen Schäden gesperrt — Zustand vor Ort prüfen, im Zweifel umtragen.", "reentry": "Plage de Ruoms, linkes Ufer, ca. 100 m unterhalb des Wehrs", "latlng": [44.461, 4.336], "est": true, "section": "Vogüé – Vallon" },
    { "name": "Ruoms", "km": 20, "type": "town", "note": "Ein-/Ausstieg Plage de Ruoms, linkes Ufer.", "reentry": null, "latlng": [44.4537, 4.3406], "est": false, "section": "Vogüé – Vallon" },
    { "name": "Sampzon", "km": 26, "type": "town", "note": "Ein-/Ausstieg unterhalb der Brücke von Sampzon.", "reentry": null, "latlng": [44.4178, 4.3356], "est": false, "section": "Vogüé – Vallon" },
    { "name": "Wehrkette Sampzon–Salavas (5 Wehre)", "km": 28.5, "type": "caution", "note": "5 Wehre mit Kanurutschen (Glissières) bis Pont de Salavas; bei erhöhtem Wasserstand gefährlich (rot ab +0,10 m Pegel Vallon).", "reentry": null, "latlng": [44.404, 4.357], "est": true, "section": "Vogüé – Vallon" },
    { "name": "Vallon-Pont-d'Arc", "km": 32, "type": "town", "note": "Hauptstartpunkt der Gorges-Abfahrt (30 km bis Sauze); unterhalb der Salavas-Brücke Wildwasser-Slalombecken (WW II–III).", "reentry": null, "latlng": [44.4048, 4.3929], "est": false, "section": "Gorges de l'Ardèche" },
    { "name": "Pegel Vallon-Pont-d'Arc", "km": 32.3, "type": "gauge", "note": "Maßgeblicher Pegel für die Gorges: grün unter +0,50 m, orange 0,50–1,30 m, rot/Befahrungsverbot ab +1,30 m (Arrêté 2025).", "reentry": null, "latlng": [44.3986, 4.385], "est": false, "section": "Gorges de l'Ardèche" },
    { "name": "Rapide du Charlemagne", "km": 36.7, "type": "caution", "note": "WW II, Doppelschwall kurz vor dem Strand am Pont d'Arc; bekanntester Rapid der Strecke.", "reentry": null, "latlng": [44.391, 4.405], "est": true, "section": "Gorges de l'Ardèche" },
    { "name": "Pont d'Arc", "km": 37.5, "type": "caution", "note": "Natürlicher Felsbogen, Durchfahrt unproblematisch, aber stark frequentiert (Badebetrieb).", "reentry": null, "latlng": [44.3819, 4.4167], "est": false, "section": "Gorges de l'Ardèche" },
    { "name": "Châmes", "km": 39, "type": "town", "note": "Letzter Ein-/Ausstieg vor dem Naturreservat (Start der 24-km-Descente).", "reentry": null, "latlng": [44.3781, 4.4275], "est": false, "section": "Gorges de l'Ardèche" },
    { "name": "Rapide de la Dent Noire", "km": 42.5, "type": "caution", "note": "WW II, schwarzer Felsblock im Flussbett am Eingang zum Gaud-Mäander.", "reentry": null, "latlng": [44.367, 4.444], "est": true, "section": "Gorges de l'Ardèche" },
    { "name": "Bivouac de Gaud", "km": 44, "type": "town", "note": "Nur Biwak (kein Tagesausstieg): Übernachtung im Reservat ausschließlich hier, Reservierungspflicht über gorgesdelardeche.fr.", "reentry": null, "latlng": [44.3581, 4.452], "est": false, "section": "Gorges de l'Ardèche" },
    { "name": "Toupine de Gournier", "km": 47.5, "type": "caution", "note": "WW II+, kraftvolle Walze/Strudel kurz vor dem Biwak Gournier — einer der stärksten Rapids der Gorges.", "reentry": null, "latlng": [44.345, 4.465], "est": true, "section": "Gorges de l'Ardèche" },
    { "name": "Bivouac de Gournier", "km": 48, "type": "town", "note": "Nur Biwak, Reservierungspflicht über gorgesdelardeche.fr (ca. April–Sept.).", "reentry": null, "latlng": [44.342, 4.4698], "est": false, "section": "Gorges de l'Ardèche" },
    { "name": "Rapide de la Pastière", "km": 55, "type": "caution", "note": "WW II, Felsblock in Flussmitte mit Verschneidungen.", "reentry": null, "latlng": [44.328, 4.514], "est": true, "section": "Gorges de l'Ardèche" },
    { "name": "Pegel Saint-Martin (Sauze)", "km": 61.5, "type": "gauge", "note": "Station am Gorges-Ausgang; für die Befahrung der Gorges gilt der Pegel Vallon-Pont-d'Arc.", "reentry": null, "latlng": [44.314, 4.5511], "est": false, "section": "Gorges de l'Ardèche" },
    { "name": "Sauze / Saint-Martin-d'Ardèche", "km": 62, "type": "town", "note": "Ausstieg Plage de Sauze am Gorges-Ausgang; Ortskern Saint-Martin ca. 1 km flussab.", "reentry": null, "latlng": [44.3119, 4.5554], "est": false, "section": "Gorges de l'Ardèche" }
  ];

  R["Dordogne"] = [
    { "name": "Argentat-sur-Dordogne", "km": 0, "type": "town", "note": "Start der klassischen Kanuwanderung; Einsetzstelle und Camping municipal am Ort. Befahrung 9:30–18:30 Uhr (Corrèze).", "reentry": null, "latlng": [45.092, 1.94], "est": false, "section": "Argentat – Beaulieu" },
    { "name": "Pegel Argentat", "km": 0.5, "type": "gauge", "note": "Referenzpegel Oberlauf; im Dépt. Corrèze Befahrungsverbot über 100 m³/s.", "reentry": null, "latlng": [45.0924, 1.9424], "est": true, "section": "Argentat – Beaulieu" },
    { "name": "Rapide du Malpas", "km": 4, "type": "caution", "note": "Schwall WW II bei Monceaux, Hauptschwierigkeit der Etappe. Links halten, Wellen mittig ausfahren.", "reentry": null, "latlng": [45.08, 1.906], "est": true, "section": "Argentat – Beaulieu" },
    { "name": "Brivezac", "km": 14, "type": "town", "note": "Campings Le Vieux Moulin und La Champagne direkt am Fluss.", "reentry": null, "latlng": [45.0197, 1.8313], "est": true, "section": "Argentat – Beaulieu" },
    { "name": "Rapide du Battut", "km": 19, "type": "caution", "note": "Flussteilung: rechter Arm wirkt ruhig, ist aber durch Bäume versperrt — zwingend linken Arm mittig fahren.", "reentry": null, "latlng": [44.992, 1.842], "est": true, "section": "Argentat – Beaulieu" },
    { "name": "Wehr Beaulieu", "km": 23.5, "type": "caution", "note": "Niedrige Wehrschwelle vor Beaulieu, grüne Hinweisschilder beachten; Bootsgasse (Glissière) links befahrbar.", "reentry": null, "latlng": [44.982, 1.84], "est": true, "section": "Argentat – Beaulieu" },
    { "name": "Beaulieu-sur-Dordogne", "km": 24, "type": "town", "note": "Mittelalterstädtchen (Plus Beaux Villages). Campings Huttopia und La Berge Ombragée, Einkauf.", "reentry": null, "latlng": [44.978, 1.838], "est": false, "section": "Argentat – Beaulieu" },
    { "name": "Bretenoux", "km": 33, "type": "town", "note": "Bastide nahe der Cère-Mündung, Einsetzstelle an der Brücke (Port de Bretenoux). Bahnhof, Einkauf.", "reentry": null, "latlng": [44.92, 1.838], "est": true, "section": "Beaulieu – Carennac" },
    { "name": "Wehr Carennac", "km": 46.5, "type": "caution", "note": "Wehrschwelle (Digue) vor Carennac, früh hörbar. Glissière rechts befahrbar; alternativ links in den schmalen Dorfarm.", "reentry": null, "latlng": [44.919, 1.746], "est": true, "section": "Beaulieu – Carennac" },
    { "name": "Pegel Carennac", "km": 46.7, "type": "gauge", "note": "Station an der Ile de la Prade bei Carennac.", "reentry": null, "latlng": [44.9154, 1.7443], "est": true, "section": "Beaulieu – Carennac" },
    { "name": "Carennac", "km": 47, "type": "town", "note": "Plus Beaux Villages, Prioratskirche. Camping L'Eau Vive, Anleger am Dorfarm.", "reentry": null, "latlng": [44.9173, 1.7321], "est": false, "section": "Beaulieu – Carennac" },
    { "name": "Inselpassage Floirac", "km": 52, "type": "caution", "note": "Flussteilung ca. 40 min nach Carennac: linker Arm obligatorisch (grüner Pfeil), am Inselende links bleiben.", "reentry": null, "latlng": [44.916, 1.69], "est": true, "section": "Carennac – Saint-Sozy" },
    { "name": "Gluges", "km": 56, "type": "town", "note": "Dorf unter hoher Quercy-Felswand. Camping Les Falaises, Anleger.", "reentry": null, "latlng": [44.9109, 1.6289], "est": true, "section": "Carennac – Saint-Sozy" },
    { "name": "Saint-Sozy", "km": 67, "type": "town", "note": "Etappenort mit Campings Village du Port und Les Borgnes, Einkauf im Dorf.", "reentry": null, "latlng": [44.8801, 1.5648], "est": false, "section": "Carennac – Saint-Sozy" },
    { "name": "Lacave", "km": 71, "type": "town", "note": "Tropfsteinhöhlen von Lacave, Camping La Rivière; flussab folgen die Schlösser Belcastel und La Treyne.", "reentry": null, "latlng": [44.8448, 1.556], "est": true, "section": "Saint-Sozy – Souillac" },
    { "name": "Pegel Souillac", "km": 83.5, "type": "gauge", "note": "Station Lanzac–Souillac; im Dépt. Lot Befahrungsverbot über 150 m³/s.", "reentry": null, "latlng": [44.8825, 1.4843], "est": true, "section": "Saint-Sozy – Souillac" },
    { "name": "Souillac", "km": 85, "type": "town", "note": "Vorher A20-Brücke: mittig passieren. Öffentlicher Stopp 2 km nach der Stadtbrücke rechts (Quercyland). Camping Les Ondines, Bahnhof.", "reentry": null, "latlng": [44.886, 1.472], "est": false, "section": "Saint-Sozy – Souillac" },
    { "name": "Saint-Julien-de-Lampon", "km": 99, "type": "town", "note": "Etappenort an der Brücke, Camping Le Bourniou, Einkauf.", "reentry": null, "latlng": [44.8607, 1.3633], "est": true, "section": "Souillac – Vitrac" },
    { "name": "Carsac-Aillac", "km": 109, "type": "town", "note": "Campings Rocher de la Cave und Plein Air des Bories; danach Cingle de Montfort mit Schloss über dem Fluss.", "reentry": null, "latlng": [44.8408, 1.2753], "est": true, "section": "Souillac – Vitrac" },
    { "name": "Vitrac", "km": 114, "type": "town", "note": "Öffentlicher Stopp links direkt vor der Brücke (Port de Vitrac). Mehrere Campings, Nähe Sarlat.", "reentry": null, "latlng": [44.825, 1.225], "est": false, "section": "Souillac – Vitrac" },
    { "name": "Pegel Cénac", "km": 116.5, "type": "gauge", "note": "Station Cénac-et-Saint-Julien, Referenz für den Périgord-Abschnitt.", "reentry": null, "latlng": [44.8054, 1.2044], "est": true, "section": "Vitrac – Beynac" },
    { "name": "Cénac-et-Saint-Julien", "km": 117, "type": "town", "note": "Brücke unterhalb der Bastide Domme (Aufstieg lohnt). Camping municipal, Einkauf in Cénac.", "reentry": null, "latlng": [44.804, 1.201], "est": true, "section": "Vitrac – Beynac" },
    { "name": "La Roque-Gageac", "km": 121, "type": "town", "note": "Plus Beaux Villages, Dorf unter der Felswand. Achtung nach dem Ort: Felsen am linken Ufer.", "reentry": null, "latlng": [44.8255, 1.1835], "est": true, "section": "Vitrac – Beynac" },
    { "name": "Castelnaud-la-Chapelle", "km": 125, "type": "town", "note": "Burg Castelnaud über der Céou-Mündung, Anleger am Ort; kurz danach Stopp am Pont de Fayrac rechts.", "reentry": null, "latlng": [44.816, 1.146], "est": true, "section": "Vitrac – Beynac" },
    { "name": "Beynac-et-Cazenac", "km": 130, "type": "town", "note": "Ziel der klassischen Strecke. Ausstieg am Camping Le Capeyrou unterhalb des Château de Beynac.", "reentry": null, "latlng": [44.84, 1.147], "est": false, "section": "Vitrac – Beynac" }
  ];

  R["Tarn"] = [
    { "name": "Ispagnac", "km": 0, "type": "town", "note": "Start der Gorges-Befahrung. Ein-/Ausstieg nur an markierten Stellen, Nachtfahrt verboten.", "reentry": null, "latlng": [44.3704, 3.5352], "est": false, "section": "Ispagnac – Sainte-Énimie" },
    { "name": "Quézac", "km": 2.5, "type": "town", "note": "Dorf mit gotischer Brücke. Kiesbänke — bei sommerlichem Niedrigwasser stellenweise treideln.", "reentry": null, "latlng": [44.3564, 3.5219], "est": true, "section": "Ispagnac – Sainte-Énimie" },
    { "name": "Montbrun", "km": 8, "type": "town", "note": "Einstieg am Pont de Montbrun unterhalb des Hangdorfs.", "reentry": null, "latlng": [44.333, 3.4968], "est": true, "section": "Ispagnac – Sainte-Énimie" },
    { "name": "Pegel Montbrun", "km": 8.1, "type": "gauge", "note": "Referenzpegel der Gorges (Pont de Montbrun). Offizielle Empfehlung: ab 1,10 m nicht mehr fahren (tarn-amont.fr).", "reentry": null, "latlng": [44.333, 3.4968], "est": true, "section": "Ispagnac – Sainte-Énimie" },
    { "name": "Blajoux", "km": 10, "type": "town", "note": "Weiler mit Kanu-Einstieg.", "reentry": null, "latlng": [44.3373, 3.4832], "est": true, "section": "Ispagnac – Sainte-Énimie" },
    { "name": "Castelbouc", "km": 11.5, "type": "town", "note": "Burgruine direkt über dem Fluss, beliebte Badestelle.", "reentry": null, "latlng": [44.3404, 3.464], "est": true, "section": "Ispagnac – Sainte-Énimie" },
    { "name": "Prades", "km": 14, "type": "town", "note": "Weiler mit Schloss, letzter Einstieg vor Sainte-Énimie.", "reentry": null, "latlng": [44.3511, 3.4584], "est": true, "section": "Ispagnac – Sainte-Énimie" },
    { "name": "Sainte-Énimie", "km": 20, "type": "town", "note": "Hauptort der Gorges (Plus Beaux Villages), Einstieg an der Brücke. Im Hochsommer sehr wenig Wasser — treideln einplanen.", "reentry": null, "latlng": [44.3661, 3.4105], "est": true, "section": "Ispagnac – Sainte-Énimie" },
    { "name": "Wehr Sainte-Énimie", "km": 20.3, "type": "port", "note": "Wehr mit Bresche (seit 2017): Überfahren verboten! Rechts am alten Mühlengebäude aussteigen, kurz umtragen.", "reentry": "Direkt unterhalb des Wehrs am rechten Ufer", "latlng": [44.365, 3.408], "est": true, "section": "Sainte-Énimie – La Malène" },
    { "name": "Saint-Chély-du-Tarn", "km": 26, "type": "town", "note": "Durchfahrt unter der Steinbrücke; Quell-Wasserfall mündet direkt in den Tarn.", "reentry": null, "latlng": [44.336, 3.3843], "est": true, "section": "Sainte-Énimie – La Malène" },
    { "name": "Hauterives", "km": 32, "type": "town", "note": "Weiler ohne Straßenanschluss — nur per Boot oder Fußweg erreichbar.", "reentry": null, "latlng": [44.3212, 3.3459], "est": true, "section": "Sainte-Énimie – La Malène" },
    { "name": "La Malène", "km": 34, "type": "town", "note": "Dorf der Bateliers (traditionelle Kahnfahrten), Einstieg an der Rampe. Beliebter Etappenort.", "reentry": null, "latlng": [44.3022, 3.3202], "est": true, "section": "Sainte-Énimie – La Malène" },
    { "name": "Wehr La Malène", "km": 34.3, "type": "caution", "note": "Niedrige Wehrschwelle: Durchfahrt links Richtung Ufer möglich (wasserstandsabhängig), sonst kurz umtragen.", "reentry": null, "latlng": [44.3015, 3.318], "est": true, "section": "La Malène – Les Vignes" },
    { "name": "Les Détroits", "km": 37, "type": "caution", "note": "Engste und schönste Stelle der Schlucht (Felswände bis ~400 m). Auf die Ausflugskähne der Bateliers achten.", "reentry": null, "latlng": [44.305, 3.295], "est": true, "section": "La Malène – Les Vignes" },
    { "name": "Cirque des Baumes", "km": 41.5, "type": "caution", "note": "Felsamphitheater. ACHTUNG: Gleich danach Pflicht-Ausstieg vor dem Pas de Soucy — über den Fluss gespanntes Seil markiert den Ausstieg. Keinesfalls weiterfahren!", "reentry": null, "latlng": [44.308, 3.2463], "est": true, "section": "La Malène – Les Vignes" },
    { "name": "Pas de Soucy", "km": 43, "type": "port", "note": "LEBENSGEFAHR — absolut unbefahrbar! Der Tarn verschwindet unter einem Felssturz (Siphone). Befahren behördlich verboten; zwingend am markierten Seil oberhalb aussteigen. Umtragen ca. 1 km entlang der D907bis, Verleiher fahren Navette.", "reentry": "Ca. 1 km flussab beim Weiler Beldoire; bequemer an der Plage von Les Vignes (km 45)", "latlng": [44.2904, 3.2381], "est": true, "section": "La Malène – Les Vignes" },
    { "name": "Les Vignes", "km": 45, "type": "town", "note": "Dorf mit Brücke und Plage (öffentlicher Einstieg), Stützpunkt vieler Kanuverleiher.", "reentry": null, "latlng": [44.2783, 3.2277], "est": true, "section": "La Malène – Les Vignes" },
    { "name": "Wehr Les Vignes", "km": 45.2, "type": "caution", "note": "Wehr mit Kanugasse in der Mitte — mittig anfahren. Ab Les Vignes bis Le Rozier gilt Helmpflicht!", "reentry": null, "latlng": [44.277, 3.2265], "est": true, "section": "Les Vignes – Le Rozier" },
    { "name": "Rapide de la Sablière", "km": 50, "type": "caution", "note": "Sportlichster Abschnitt (WW II–III): Schnellen am Rocher du Champignon und La Sablière. Im Zweifel besichtigen oder umtragen. Helmpflicht.", "reentry": null, "latlng": [44.246, 3.23], "est": true, "section": "Les Vignes – Le Rozier" },
    { "name": "Pegel Mostuéjouls", "km": 54, "type": "gauge", "note": "Station für die unteren Gorges, ca. 3 km oberhalb von Le Rozier.", "reentry": null, "latlng": [44.2095, 3.2223], "est": true, "section": "Les Vignes – Le Rozier" },
    { "name": "Le Rozier", "km": 57, "type": "town", "note": "Ende der Gorges du Tarn an der Jonte-Mündung. Ausstieg im Ort an der Brücke.", "reentry": null, "latlng": [44.191, 3.2078], "est": true, "section": "Les Vignes – Le Rozier" }
  ];

  /* Meta + Reihenfolge (Frankreich ans Ende — Default-Einstieg bleibt Krün/Isar) */
  function count(nodes, t) { return nodes.filter(function (n) { return n.type === t; }).length; }
  [["Ardèche", "ardeche", "Préfecture de l'Ardèche (Arrêté 2025), SGGA, eauxvives.org, OSM"],
   ["Dordogne", "dordogne", "OT Vallée de la Dordogne (Roadbook Canoë), eauxvives.org, OSM"],
   ["Tarn", "tarn", "tarn-amont.fr, eauxvives.org, Kanuverleiher-Topos, OSM"]].forEach(function (e) {
    var name = e[0], nodes = R[name];
    META[name] = {
      slug: e[1], country: "Frankreich", source: e[2],
      towns: count(nodes, "town"), portages: count(nodes, "port"),
      cautions: count(nodes, "caution"), gauges: count(nodes, "gauge"),
      nodes: nodes.length
    };
    if (ORDER.indexOf(name) < 0) ORDER.push(name);
  });
})();

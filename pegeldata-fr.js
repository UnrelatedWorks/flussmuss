/* ============================================================
   Fluss Muss · Pegel-Datenlayer FRANKREICH  (generiert — nicht von Hand ändern)
   Quelle: Hub'Eau Hydrométrie (SCHAPI/eaufrance, Open Data Etalab)
   Snapshot als Offline-Fallback — die App lädt zusätzlich live.
   Neu erzeugen:  node tools/build-pegeldata-fr.js
   ============================================================ */
window.PEGEL_FR_STAND = "11.06.2026 · 18:57 Uhr";
window.PEGEL_FR_LEGEND = "Frankreich kennt keine Meldestufen wie Bayern — Hochwasser-Vigilance gilt abschnittsweise (vigicrues.gouv.fr). Für Paddler gelten stattdessen Befahrungsregeln per Arrêté préfectoral: die hinterlegten Grenzwerte (orange = erhöhte Vorsicht, rot = nicht fahren/Verbot) beziehen sich auf die jeweilige Stations-Skala. Werte ohne Gewähr — vor der Fahrt amtliche Quellen und Beschilderung vor Ort prüfen.";
window.PEGEL_FR_MATCH = {
 "Ardèche|Pegel Vogüé": "V501401001",
 "Ardèche|Pegel Vallon-Pont-d'Arc": "V505401001",
 "Ardèche|Pegel Saint-Martin (Sauze)": "V506401001",
 "Dordogne|Pegel Argentat": "P135001001",
 "Dordogne|Pegel Carennac": "P207002001",
 "Dordogne|Pegel Souillac": "P230001001",
 "Dordogne|Pegel Cénac": "P238001001",
 "Tarn|Pegel Montbrun": "O312102002",
 "Tarn|Pegel Mostuéjouls": "O314101001"
};
window.PEGEL_FR_THRESHOLDS = {
 "V501401001": {
  "warn": -15,
  "sperre": 20,
  "label": "Arrêté inter-préfectoral 19.08.2025, Abschnitt Vogüé–Chauzon: orange ab −0,15 m, rot (Verbot) ab +0,20 m",
  "src": "https://www.ardeche.gouv.fr/contenu/telechargement/28994/238009/file/202508_synoptique_annexe_AP_troncons_navig_ardeche.pdf"
 },
 "V505401001": {
  "warn": 50,
  "sperre": 130,
  "label": "Arrêté inter-préfectoral 19.08.2025, Gorges de l'Ardèche: orange ab +0,50 m, rot (Verbot) ab +1,30 m; Abschnitt Ruoms–Salavas rot bereits ab +0,10 m",
  "src": "https://www.ardeche.gouv.fr/contenu/telechargement/28994/238009/file/202508_synoptique_annexe_AP_troncons_navig_ardeche.pdf"
 },
 "O312102002": {
  "warn": null,
  "sperre": 110,
  "label": "Offizielle Empfehlung tarn-amont.fr: ab 1,10 m am Pegel Montbrun nicht mehr fahren",
  "src": "https://www.tarn-amont.fr/navigation/"
 }
};
window.PEGEL_FR = [
 {"n":"Vogüé","r":"Ardèche","id":"V501401001","u":"https://www.hydro.eaufrance.fr/stationhydro/V501401001/fiche","t":"11.06. 18:50","cm":"-54","d":null,"q":"3,3","ms":null,"fr":true},
 {"n":"Vallon-Pont-d'Arc","r":"Ardèche","id":"V505401001","u":"https://www.hydro.eaufrance.fr/stationhydro/V505401001/fiche","t":"11.06. 18:45","cm":"-84","d":null,"q":"6,7","ms":null,"fr":true},
 {"n":"Saint-Martin (Sauze)","r":"Ardèche","id":"V506401001","u":"https://www.hydro.eaufrance.fr/stationhydro/V506401001/fiche","t":"11.06. 18:50","cm":"-36","d":null,"q":"8,0","ms":null,"fr":true},
 {"n":"Argentat","r":"Dordogne","id":"P135001001","u":"https://www.hydro.eaufrance.fr/stationhydro/P135001001/fiche","t":"11.06. 18:50","cm":"44","d":null,"q":"21","ms":null,"fr":true},
 {"n":"Carennac","r":"Dordogne","id":"P207002001","u":"https://www.hydro.eaufrance.fr/stationhydro/P207002001/fiche","t":"11.06. 18:50","cm":"161","d":null,"q":"30","ms":null,"fr":true},
 {"n":"Lanzac–Souillac","r":"Dordogne","id":"P230001001","u":"https://www.hydro.eaufrance.fr/stationhydro/P230001001/fiche","t":"11.06. 18:50","cm":"-19","d":null,"q":null,"ms":null,"fr":true},
 {"n":"Cénac","r":"Dordogne","id":"P238001001","u":"https://www.hydro.eaufrance.fr/stationhydro/P238001001/fiche","t":"11.06. 18:45","cm":"28","d":null,"q":"37","ms":null,"fr":true},
 {"n":"Montbrun (Pont)","r":"Tarn","id":"O312102002","u":"https://www.hydro.eaufrance.fr/stationhydro/O312102002/fiche","t":"11.06. 18:45","cm":"61","d":null,"q":null,"ms":null,"fr":true},
 {"n":"Mostuéjouls [La Muse]","r":"Tarn","id":"O314101001","u":"https://www.hydro.eaufrance.fr/stationhydro/O314101001/fiche","t":"11.06. 16:00","cm":"7","d":null,"q":"9,2","ms":null,"fr":true}
];

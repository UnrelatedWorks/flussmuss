/* Fluss Muss · self-contained paddling planner (vanilla JS, Leaflet for maps).
   A mobile-first PWA redesign of kanu-info-isar.de (Christian Löhnert).
   Screens: Start → Touren-Liste → Tour-Überblick · plus Begriffe + Info.
   Data: riverdata.js (window.RIVERS / RIVER_ORDER / RIVER_SECTIONS / RIVER_META),
         glossary.js (window.GLOSSARY). Route map = real CARTO/OSM tiles. */
(function () {
  "use strict";

  var RIVERS = window.RIVERS || {};
  var RIVER_ORDER = window.RIVER_ORDER || Object.keys(RIVERS);
  var RIVER_META = window.RIVER_META || {};
  var RIVER_SECTIONS = window.RIVER_SECTIONS || {};
  var GLOSSARY = window.GLOSSARY || [];
  var ATTRIB = window.RIVER_ATTRIBUTION || "Christian Löhnert · kanu-info-isar.de";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  var fmt1 = function (n) { return (Math.round(n * 10) / 10).toString().replace(".", ","); };
  var PADDLE_KMH = 5;
  var kmToHours = function (km) { return km / PADDLE_KMH; };
  function hms(hours) {
    var total = Math.round(hours * 60);
    var h = Math.floor(total / 60), m = total % 60;
    if (!h) return m + " min";
    return h + " h" + (m ? " " + m + " min" : "");
  }
  function durLabel(hours) {
    if (hours <= 2) return "kurze Tour";
    if (hours <= 4) return "halber Tag";
    if (hours <= 8) return "Tagestour";
    if (hours <= 14) return "langer Tag";
    return "Mehrtagestour";
  }
  function towns(river) {
    return (RIVERS[river] || []).map(function (n, i) { return { n: n, i: i }; })
      .filter(function (o) { return o.n.type === "town"; });
  }
  function countPorts(nodes, a, b) {
    return nodes.slice(a, b + 1).filter(function (x) { return x.type === "port"; }).length;
  }

  function buildExits(river, fromCity) {
    var nodes = RIVERS[river] || [];
    var fi = nodes.findIndex(function (n) { return n.name === fromCity; });
    if (fi < 0) return [];
    return towns(river).filter(function (o) { return o.i > fi; }).map(function (o) {
      var km = nodes[o.i].km - nodes[fi].km;
      return { name: o.n.name, note: o.n.note, km: km, carries: countPorts(nodes, fi, o.i), hours: kmToHours(km), down: true };
    }).filter(function (e) { return e.km > 0; }).sort(function (x, y) { return x.km - y.km; });
  }

  function buildTours(river, cityName, timeHours, destCity) {
    var nodes = RIVERS[river] || [];
    var ci = nodes.findIndex(function (n) { return n.name === cityName; });
    if (ci < 0) return [];
    if (destCity) {
      var di = nodes.findIndex(function (n) { return n.name === destCity; });
      if (di >= 0 && di !== ci) {
        var a0 = Math.min(ci, di), b0 = Math.max(ci, di);
        var km0 = Math.abs(nodes[b0].km - nodes[a0].km);
        if (!(km0 > 0)) return [];
        return [{
          from: di > ci ? cityName : destCity, to: di > ci ? destCity : cityName,
          a: a0, b: b0, km: km0, carries: countPorts(nodes, a0, b0), hours: kmToHours(km0),
          water: hms(kmToHours(km0)), level: durLabel(kmToHours(km0)), best: true
        }];
      }
    }
    var down = towns(river).filter(function (o) { return o.i > ci; });
    if (!down.length) return [];
    var cand = down.map(function (o) {
      var km = nodes[o.i].km - nodes[ci].km;
      return {
        from: cityName, to: o.n.name, a: ci, b: o.i, km: km, carries: countPorts(nodes, ci, o.i),
        water: hms(kmToHours(km)), hours: kmToHours(km), level: durLabel(kmToHours(km))
      };
    }).filter(function (t) { return t.km > 0; });
    var fit = cand.filter(function (t) { return t.hours <= timeHours; });
    if (!fit.length) fit = [cand.reduce(function (m, t) { return t.km < m.km ? t : m; }, cand[0])];
    fit.sort(function (x, y) { return y.km - x.km; });
    var idx = fit.length <= 3 ? fit.map(function (_, i) { return i; })
      : [0, Math.floor((fit.length - 1) / 2), fit.length - 1];
    var seen = {}, out = [];
    idx.forEach(function (i) { if (!seen[i]) { seen[i] = 1; out.push(fit[i]); } });
    if (out.length) out[0].best = true;
    return out;
  }

  /* ---------- state ---------- */
  var firstTown = (function () {
    for (var r = 0; r < RIVER_ORDER.length; r++) {
      var t = towns(RIVER_ORDER[r]); if (t.length) return { city: t[0].n.name, river: RIVER_ORDER[r] };
    }
    return { city: "", river: RIVER_ORDER[0] };
  })();
  var S = {
    screen: "start", dir: "fwd",
    time: "8 h", customH: 12,
    city: firstTown.city, river: firstTown.river,
    dest: null, sel: 0, tourIdx: 0,
    picker: false, destPicker: false, showEnd: false,
    glossQ: ""
  };
  function timeHours() { return S.time === "eigene" ? S.customH : parseInt(S.time, 10); }
  function tours() { return buildTours(S.river, S.city, timeHours(), S.dest); }
  function destInfo() {
    return S.dest ? buildExits(S.river, S.city).find(function (e) { return e.name === S.dest; }) : null;
  }
  function set(patch) { Object.assign(S, patch); render(); }
  function nav(next, dir) { S.dir = dir; S.screen = next; render(); }

  /* ---------- start ---------- */
  var TIME_CHIPS = ["2 h", "4 h", "8 h", "eigene"];
  function customCap(h) {
    return (h <= 12 ? "langer Tag" : h <= 24 ? "über Nacht · Biwak" : "Mehrtagestour") + " · 10–48 h";
  }
  function topNav(active) {
    return '<div class="sk-status">' +
      '<button class="topnav' + (active === "plan" ? " on" : "") + '" id="navPlan">Planen</button>' +
      '<button class="topnav' + (active === "gloss" ? " on" : "") + '" id="navGloss">Begriffe</button>' +
      '<button class="topnav' + (active === "info" ? " on" : "") + '" id="navInfo">Info</button>' +
      "</div>";
  }
  function startHTML() {
    var di = destInfo(), custom = S.time === "eigene";
    var chips = TIME_CHIPS.map(function (c) {
      return '<button class="dist-chip' + (S.time === c ? " sel" : "") + '" data-time="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");
    var customBlock = (custom && !S.dest) ?
      '<div class="custom-time">' +
        '<div class="slider-readout"><b id="customReadout">' + S.customH + "</b> h</div>" +
        '<input type="range" min="10" max="48" step="1" value="' + S.customH + '" id="customRange" class="sk-range" />' +
        '<div class="slider-ticks"><span>10 h</span><span>24 h</span><span>48 h</span></div>' +
        '<p class="sk-cap left" id="customCap" style="margin:2px 0 0">' + customCap(S.customH) + "</p>" +
      "</div>" : "";
    return '<div class="phone">' + topNav("plan") +
        '<div class="phone-body" style="overflow-y:auto">' +
          '<h1 class="sk-h1">Auf den Fluss ist ein Muss.</h1>' +
          '<label class="sk-mini">Von</label>' +
          '<button class="sk-field set" id="openPicker" style="width:100%;cursor:pointer;text-align:left">' +
            '<span class="sk-field-ic">◎</span><span class="sk-field-val">' + esc(S.city) + "</span>" +
            '<span style="margin-left:auto;color:var(--muted);font-family:var(--font-hand);font-size:14px">ändern ▾</span></button>' +
          '<label class="sk-mini">Nach</label>' +
          '<button class="sk-field' + (S.dest ? " set" : "") + '" id="openDest" style="width:100%;cursor:pointer;text-align:left">' +
            '<span class="sk-field-ic flag">⚑</span>' +
            (S.dest ? '<span class="sk-field-val">' + esc(S.dest) + "</span>"
                    : '<span class="sk-field-val muted">Ziel (optional)</span>') +
            (S.dest && di
              ? '<span style="margin-left:auto;color:var(--accent);font-family:var(--font-hand);font-size:15px;white-space:nowrap">' + fmt1(di.km) + " km · " + hms(di.hours) + "</span>"
              : '<span style="margin-left:auto;color:var(--muted);font-family:var(--font-hand);font-size:14px">wählen ▾</span>') +
          "</button>" +
          '<div class="or-div"><span>oder</span></div>' +
          '<label class="sk-mini"' + (S.dest ? ' style="opacity:.4"' : "") + ">Wie viel Zeit hast du?</label>" +
          '<div class="dist-chips"' + (S.dest ? ' style="opacity:.4;pointer-events:none"' : "") + ">" + chips + "</div>" +
          customBlock +
        "</div>" +
        '<div class="phone-foot"><button class="sk-go" id="go" style="border-style:double;border-width:3px;letter-spacing:2px;font-size:25px;white-space:nowrap">los geht\'s!</button></div>' +
      "</div>";
  }

  /* ---------- list ---------- */
  function listHTML() {
    var T = tours();
    var ctx = S.dest
      ? '<span class="ctx-chip">◎ <b>' + esc(S.city) + '</b> <span class="dot">→</span> ⚑ <b>' + esc(S.dest) + "</b></span>"
      : '<span class="ctx-chip">◎ <b>' + esc(S.city) + '</b> <span class="dot">·</span> ◷ ' + esc(timeHours() + " h") + "</span>";
    var inner;
    if (T.length === 0) {
      inner = '<div class="empty-tours"><div class="empty-mark">◎</div>' +
        '<p class="empty-msg">' + esc(S.city) + " liegt am unteren Ende der " + esc(S.river) +
        ". Flussabwärts geht es von hier nicht weiter — wähle einen Einstieg weiter flussaufwärts.</p></div>";
    } else {
      var cards = T.map(function (t, i) {
        return '<button class="tour-card' + (S.sel === i ? " sel" : "") + '" data-tour="' + i + '">' +
          (t.best ? '<span class="best-flag">' + (S.dest ? "★ Deine Route" : "★ Beste für " + esc(S.time)) + "</span>" : "") +
          '<div class="tour-route">' + esc(t.from) + ' <span class="arr">→</span> ' + esc(t.to) + "</div>" +
          '<div class="tags"><span class="tag river">~ ' + esc(S.river) + "</span>" +
            '<span class="tag">' + esc(t.level) + "</span>" +
            (t.carries ? '<span class="tag warn">⚑ ' + t.carries + "× tragen</span>" : '<span class="tag">ohne Umtragen</span>') +
          "</div>" +
          '<div class="tour-stats">' +
            '<span class="tstat"><b>' + fmt1(t.km) + ' <small>km</small></b><span>Strecke</span></span>' +
            '<span class="tstat"><b>' + esc(t.water) + "</b><span>im Boot</span></span></div>" +
          "</button>";
      }).join("");
      inner = '<p class="res-count">' + T.length + " " + (T.length === 1 ? "Tour" : "Tagestouren") +
        ' <small>· auf der ' + esc(S.river) + "</small></p>" +
        '<div class="tour-list">' + cards + "</div>";
    }
    return '<div class="phone"><div class="sk-status"><span class="sk-status-title">Touren</span></div>' +
        '<div class="phone-body" style="display:flex;flex-direction:column">' +
          '<div class="ctx-bar"><button class="ctx-edit" id="edit" style="margin-left:0;margin-right:auto">ändern</button>' + ctx + "</div>" +
          inner +
        "</div>" +
        (T.length > 0 ? '<div class="phone-foot"><button class="sk-go" id="viewSel" style="border-style:double;border-width:3px;letter-spacing:2px;font-size:25px;white-space:nowrap">Tour ansehen</button></div>' : "") +
      "</div>";
  }

  /* ---------- tour ---------- */
  function ribDot(type, first, last) {
    if (type === "port") return " port";
    if (type === "caution") return " caution";
    if (type === "gauge") return " gauge";
    return (first || last) ? " end" : "";
  }
  function nodeLabel(n, first, last) {
    if (first) return "Einstieg " + n.name;
    if (last) return "Ausstieg " + n.name;
    return n.name;
  }
  function tourHTML() {
    var T = tours();
    var tour = T[S.tourIdx] || T[0];
    if (!tour) return startHTML();
    var nodes = RIVERS[S.river];
    var meta = RIVER_META[S.river] || {};
    var slice = nodes.slice(tour.a, tour.b + 1);
    var base = slice[0].km;
    var ribbon = slice.map(function (n, i) {
      var first = i === 0, last = i === slice.length - 1;
      var warn = (n.type === "port" || n.type === "caution");
      return '<div class="rib"><span class="rib-dot' + ribDot(n.type, first, last) + '"></span>' +
        '<span class="rib-km">km ' + fmt1(n.km - base) + "</span>" +
        '<div class="rib-t">' + esc(nodeLabel(n, first, last)) +
          (n.type === "gauge" ? ' <span class="rib-badge">Pegel</span>' : "") + "</div>" +
        (n.note ? '<div class="rib-s' + (warn ? " warn" : "") + '">' + esc(n.note) + "</div>" : "") +
        (n.reentry ? '<div class="rib-reenter">↪ ' + esc(n.reentry) + "</div>" : "") +
      "</div>";
    }).join("");
    var backLabel = (S.dest || T.length === 1) ? "Ändern" : "Touren";
    var note = meta.surveyYear
      ? '<p class="sk-cap left" style="margin:8px 2px 0;font-size:12.5px;line-height:1.35">Datenbasis ' + esc(S.river) +
        ": " + meta.portages + " Umtragestellen, " + meta.cautions + " Vorsicht-Stellen erfasst (Vermessung " +
        esc(meta.surveyYear) + ") · kanu-info-isar.de</p>"
      : "";
    return '<div class="phone"><div class="sk-status"><span class="sk-status-title">Deine Tour</span></div>' +
        '<div class="phone-body" style="display:flex;flex-direction:column">' +
          '<div class="nav-row"><button class="nav-back" id="back"><span class="chev">‹</span> ' + esc(backLabel) + "</button>" +
            '<span class="tour-head">' + esc(tour.from) + " → " + esc(tour.to) + " · " + fmt1(tour.km) + " km</span></div>" +
          '<div class="route-map-wrap"><div class="route-map" id="routeMap"></div></div>' +
          '<div class="ribbon">' + ribbon + "</div>" +
          note +
        "</div>" +
        '<div class="phone-foot"><button class="sk-go" id="startNav" style="border-style:double;border-width:3px;letter-spacing:2px;font-size:25px;white-space:nowrap">Navigation starten</button></div>' +
      "</div>";
  }

  /* ---------- Leaflet route map ---------- */
  var _map = null;
  function destroyMap() { if (_map) { try { _map.remove(); } catch (e) {} _map = null; } }
  function initRouteMap(slice) {
    destroyMap();
    var el = document.getElementById("routeMap");
    if (!el || typeof L === "undefined") return;
    var pts = slice.filter(function (n) { return n.latlng; });
    if (pts.length < 2) { el.innerHTML = '<div class="route-empty">Kartenskizze nicht verfügbar</div>'; return; }
    var map = L.map(el, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
    _map = map;
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 18, subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    var latlngs = pts.map(function (n) { return n.latlng; });
    var line = L.polyline(latlngs, { color: "#5b4b8a", weight: 4, opacity: 0.9, lineJoin: "round" }).addTo(map);
    var COLORS = { town: "#444042", port: "#7a2e22", caution: "#b06a1f", gauge: "#3a6ea5" };
    pts.forEach(function (n, i) {
      var first = i === 0, last = i === pts.length - 1;
      var color = (first || last) ? "#2c2a26" : (COLORS[n.type] || "#5b4b8a");
      var r = (first || last) ? 8 : (n.type === "town" ? 5 : 6);
      L.circleMarker(n.latlng, {
        radius: r, color: "#faf8f1", weight: 2, fillColor: color, fillOpacity: 1
      }).addTo(map).bindPopup(
        "<b>" + esc(nodeLabel(n, first, last)) + "</b>" + (n.note ? "<br>" + esc(n.note) : "") +
        (n.est ? '<br><i style="opacity:.6">Position geschätzt</i>' : "")
      );
    });
    map.fitBounds(line.getBounds(), { padding: [26, 26] });
    setTimeout(function () { if (_map === map) map.invalidateSize(); }, 60);
  }

  /* ---------- Begriffe (glossary) ---------- */
  function glossaryHTML() {
    var q = S.glossQ.trim().toLowerCase();
    var list = GLOSSARY.filter(function (g) {
      return !q || g.term.toLowerCase().indexOf(q) >= 0 || (g.def || "").toLowerCase().indexOf(q) >= 0;
    });
    var rows = list.map(function (g) {
      return '<div class="gl-row">' +
        (g.img ? '<img class="gl-img" src="' + esc(g.img) + '" alt="" loading="lazy">' : '<div class="gl-img gl-noimg">~</div>') +
        '<div class="gl-text"><div class="gl-term">' + esc(g.term) + "</div>" +
        (g.def ? '<div class="gl-def">' + esc(g.def) + "</div>" : "") + "</div></div>";
    }).join("") || '<p class="sk-cap left">Kein Begriff gefunden.</p>';
    return '<div class="phone">' + topNav("gloss") +
        '<div class="phone-body" style="display:flex;flex-direction:column">' +
          '<h1 class="sk-h1" style="margin:6px 0 6px">Begriffe</h1>' +
          '<input class="gl-search" id="glSearch" type="search" placeholder="Begriff suchen …" value="' + esc(S.glossQ) + '" />' +
          '<div class="gl-list">' + rows + "</div>" +
        "</div>" +
        '<div class="phone-foot col"><p class="sk-cap" style="margin:0">Abbildungen & Texte: Christian Löhnert · kanu-info-isar.de</p></div>' +
      "</div>";
  }

  /* ---------- Info / reference ---------- */
  var INFO_SECTIONS = [
    { h: "Die Isar ist ein Wildfluss", p: "Isar, Loisach, Ammer & Co. sind keine zahmen Kanäle. Wasserstände schwanken, Kiesbänke, Bäume und Wehre verändern sich laufend. Plane defensiv, steige bei Unsicherheit aus und trage im Zweifel um. Bei Hochwasser (Meldestufen) gehört niemand aufs Wasser." },
    { h: "Wasserstand & Pegel", p: "Ob ein Abschnitt geht, hängt am Pegel. Viele Strecken brauchen eine Mindest-Wassermenge (z. B. Restwasserstrecken der Amper). Aktuelle Pegel liefert der Hochwassernachrichtendienst Bayern (hnd.bayern.de) — diese App zeigt sie (noch) nicht live." },
    { h: "Umtragen & Hindernisse", p: "Wehre, Sohlrampen und E-Werke sind in den Touren als ⚑ Umtragestellen und ⚠ Vorsicht-Stellen markiert — mit Seite, Trageweg und Wiedereinsetzpunkt aus den Originalkarten. Erkundige dich vor Ort, ob noch alles stimmt." },
    { h: "Mehrtägige Fahrten & Übernachten", p: "Für längere Touren (eigene Zeit ab 10 h) plane Übernachtung und Logistik im Voraus. Wildcampen ist in Bayern stark eingeschränkt — nutze offizielle Plätze." }
  ];
  function infoHTML() {
    var secs = INFO_SECTIONS.map(function (s) {
      return '<div class="info-sec"><div class="info-h">' + esc(s.h) + '</div><div class="info-p">' + esc(s.p) + "</div></div>";
    }).join("");
    var stats = RIVER_ORDER.map(function (r) {
      var m = RIVER_META[r] || {};
      return '<div class="info-stat"><b>' + esc(r) + "</b><span>" + (m.nodes || 0) + " Punkte · " +
        (m.portages || 0) + "× tragen</span></div>";
    }).join("");
    return '<div class="phone">' + topNav("info") +
        '<div class="phone-body" style="overflow-y:auto">' +
          '<h1 class="sk-h1" style="margin:6px 0 4px">Gut zu wissen</h1>' +
          '<p class="sk-cap left" style="margin:0 0 10px">Fluss Muss ist ein Offline-Tourenplaner für Isar, Loisach, Ammer, Amper und Würm.</p>' +
          secs +
          '<div class="info-h" style="margin-top:16px">Datenbasis</div>' +
          '<div class="info-stats">' + stats + "</div>" +
          '<p class="sk-cap left" style="margin:14px 0 4px;line-height:1.4">Alle Routen, Karten und Begriffe stammen aus dem Lebenswerk von <b>Christian Löhnert</b> auf <a href="http://kanu-info-isar.de" target="_blank" rel="noopener">kanu-info-isar.de</a> — mit freundlicher Genehmigung zur Weiterverwendung mit Urheberangabe.</p>' +
          '<p class="sk-cap left" style="margin:0 0 20px;opacity:.7">' + esc(ATTRIB) + "</p>" +
        "</div>" +
      "</div>";
  }

  /* ---------- modals ---------- */
  function cityPickerHTML() {
    var groups = RIVER_ORDER.map(function (river) {
      var rows = towns(river).map(function (o) {
        return '<button class="picker-row' + (S.city === o.n.name ? " sel" : "") + '" data-city="' + esc(o.n.name) + '" data-river="' + esc(river) + '">' +
          '<span class="picker-pin">◎</span><span class="picker-city">' + esc(o.n.name) + "</span>" +
          '<span class="picker-note">' + esc((o.n.note || "").slice(0, 48)) + "</span></button>";
      }).join("");
      return '<div class="picker-group">~ ' + esc(river) + "</div>" + rows;
    }).join("");
    return modalWrap("cityPicker",
      '<div class="modal-card picker-card" data-stop>' +
        '<div class="picker-title">Wo setzt du ein?</div>' +
        '<div class="picker-hint">Alle Orte mit Einsetzstelle aus den Karten</div>' +
        '<div class="picker-scroll">' + groups + "</div></div>");
  }
  function destPickerHTML() {
    var exits = buildExits(S.river, S.city);
    var rows = exits.map(function (e) {
      return '<button class="picker-row dest-row' + (S.dest === e.name ? " sel" : "") + '" data-dest="' + esc(e.name) + '">' +
        '<span class="picker-pin">⚑</span><span class="picker-city">' + esc(e.name) + "</span>" +
        '<span class="dest-meta"><b>' + fmt1(e.km) + " km</b><span>" + hms(e.hours) +
        (e.carries ? " · " + e.carries + "× tragen" : "") + "</span></span></button>";
    }).join("");
    return modalWrap("destPicker",
      '<div class="modal-card picker-card" data-stop>' +
        '<div class="picker-title">Wohin willst du?</div>' +
        '<div class="picker-hint">Erreichbare Ausstiegsorte ab ' + esc(S.city) + ' · gerechnet mit 5 km/h</div>' +
        '<div class="picker-scroll">' +
          '<button class="picker-row dest-row' + (S.dest ? "" : " sel") + '" data-dest="__none">' +
            '<span class="picker-pin">✕</span><span class="picker-city">Kein Ziel</span>' +
            '<span class="picker-note">nach Zeit planen</span></button>' +
          (exits.length === 0 ? '<div class="picker-hint" style="margin:10px 2px">Keine weiteren Orte flussab.</div>' : "") +
          rows + "</div></div>");
  }
  function endModalHTML() {
    return modalWrap("endModal",
      '<div class="modal-card" data-stop>' +
        '<div class="modal-mark">✧</div>' +
        '<div class="modal-title">Jetzt bist du dran</div>' +
        '<p class="modal-msg">Das musst du schon selber machen. Mehr gibt\'s von mir nicht. Zeichne dir die Karte ab, schreibe dir die Hürden auf oder merke sie dir. Von jetzt an ist es nur noch du und die Natur. Viel Spaß.</p>' +
        '<button class="sk-go modal-btn" id="endOk" style="border-style:double;border-width:3px">Alles klar!</button></div>');
  }
  function modalWrap(id, inner) { return '<div class="modal-back" data-modal="' + id + '">' + inner + "</div>"; }

  /* ---------- render + bind ---------- */
  var root = document.getElementById("root");
  function bodyFor() {
    switch (S.screen) {
      case "list": return listHTML();
      case "tour": return tourHTML();
      case "gloss": return glossaryHTML();
      case "info": return infoHTML();
      default: return startHTML();
    }
  }
  function render() {
    if (S.screen !== "tour") destroyMap();
    var modal = "";
    if (S.screen === "start" && S.picker) modal = cityPickerHTML();
    else if (S.screen === "start" && S.destPicker) modal = destPickerHTML();
    else if (S.screen === "tour" && S.showEnd) modal = endModalHTML();
    root.innerHTML =
      '<div class="app-stage">' +
        '<div class="' + (S.dir === "fwd" ? "scr-fwd" : "scr-back") + '" style="position:absolute;inset:0">' + bodyFor() + "</div>" +
        modal + "</div>";
    bind();
    if (S.screen === "tour") {
      var T = tours(), tour = T[S.tourIdx] || T[0];
      if (tour) initRouteMap(RIVERS[S.river].slice(tour.a, tour.b + 1));
    }
  }
  function on(sel, ev, fn) { var el = root.querySelector(sel); if (el) el.addEventListener(ev, fn); }
  function onAll(sel, ev, fn) { root.querySelectorAll(sel).forEach(function (el) { el.addEventListener(ev, fn); }); }

  function bindNav() {
    on("#navPlan", "click", function () { if (S.screen !== "start") nav("start", "back"); });
    on("#navGloss", "click", function () { if (S.screen !== "gloss") nav("gloss", "fwd"); });
    on("#navInfo", "click", function () { if (S.screen !== "info") nav("info", "fwd"); });
  }

  function bind() {
    bindNav();
    if (S.screen === "start") {
      on("#openPicker", "click", function () { set({ picker: true }); });
      on("#openDest", "click", function () { set({ destPicker: true }); });
      onAll(".dist-chip", "click", function (e) { set({ time: e.currentTarget.getAttribute("data-time") }); });
      on("#go", "click", function () {
        if (S.dest || tours().length === 1) { S.tourIdx = 0; nav("tour", "fwd"); }
        else nav("list", "fwd");
      });
      var range = root.querySelector("#customRange");
      if (range) range.addEventListener("input", function (e) {
        S.customH = +e.target.value;
        var ro = root.querySelector("#customReadout"); if (ro) ro.textContent = S.customH;
        var cap = root.querySelector("#customCap"); if (cap) cap.textContent = customCap(S.customH);
      });
    } else if (S.screen === "list") {
      on("#edit", "click", function () { nav("start", "back"); });
      on("#viewSel", "click", function () { S.tourIdx = S.sel; nav("tour", "fwd"); });
      onAll(".tour-card", "click", function (e) {
        var i = +e.currentTarget.getAttribute("data-tour");
        S.sel = i; S.tourIdx = i; nav("tour", "fwd");
      });
    } else if (S.screen === "tour") {
      var T = tours();
      on("#back", "click", function () { nav((S.dest || T.length === 1) ? "start" : "list", "back"); });
      on("#startNav", "click", function () { set({ showEnd: true }); });
      on("#endOk", "click", function () { set({ showEnd: false }); });
    } else if (S.screen === "gloss") {
      var srch = root.querySelector("#glSearch");
      if (srch) srch.addEventListener("input", function (e) {
        S.glossQ = e.target.value;
        // re-render list only, keep focus
        var pos = e.target.selectionStart;
        render();
        var s2 = root.querySelector("#glSearch");
        if (s2) { s2.focus(); try { s2.setSelectionRange(pos, pos); } catch (x) {} }
      });
    }

    var back = root.querySelector(".modal-back");
    if (back) {
      back.addEventListener("click", function (e) {
        if (e.target.closest("[data-stop]")) return;
        closeModal(back.getAttribute("data-modal"));
      });
      onAll(".picker-row[data-city]", "click", function (e) {
        var el = e.currentTarget;
        set({ city: el.getAttribute("data-city"), river: el.getAttribute("data-river"), sel: 0, tourIdx: 0, dest: null, picker: false });
      });
      onAll(".picker-row[data-dest]", "click", function (e) {
        var v = e.currentTarget.getAttribute("data-dest");
        set({ dest: v === "__none" ? null : v, sel: 0, tourIdx: 0, destPicker: false });
      });
    }
  }
  function closeModal(id) {
    if (id === "cityPicker") set({ picker: false });
    else if (id === "destPicker") set({ destPicker: false });
    else if (id === "endModal") set({ showEnd: false });
  }

  /* test hook — inert unless window.__FM_TEST__ is set before this script loads */
  if (window.__FM_TEST__) {
    window.__fm = {
      S: S, set: set, nav: nav, buildTours: buildTours, buildExits: buildExits, towns: towns,
      startHTML: startHTML, listHTML: listHTML, tourHTML: tourHTML,
      glossaryHTML: glossaryHTML, infoHTML: infoHTML,
      cityPickerHTML: cityPickerHTML, destPickerHTML: destPickerHTML
    };
  }

  render();
})();

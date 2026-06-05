/* RiversOfMuc · self-contained planner (vanilla JS, no framework, no CDNs).
   Flow: Start (chips + city/dest picker) → A · Touren-Liste → B · Tour-Überblick
   All data comes from riverdata.js (window.RIVERS / RIVER_ORDER / RIVER_META).
   The route map is drawn locally as an SVG from each node's [lat,lng]. */
(function () {
  "use strict";

  var RIVERS = window.RIVERS;
  var RIVER_ORDER = window.RIVER_ORDER;
  var RIVER_META = window.RIVER_META || {};

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
    return "lange Tour";
  }

  function buildExits(river, fromCity) {
    var nodes = RIVERS[river];
    var fi = nodes.findIndex(function (n) { return n[0] === fromCity; });
    if (fi < 0) return [];
    var down = nodes.map(function (n, i) { return { n: n, i: i }; })
      .filter(function (o) { return o.n[2] === "town" && o.i > fi; });
    return down.map(function (o) {
      var a = fi, b = o.i;
      var km = nodes[b][1] - nodes[a][1];
      var carries = nodes.slice(a, b + 1).filter(function (x) { return x[2] === "port"; }).length;
      return { name: o.n[0], note: o.n[3], km: km, carries: carries, hours: kmToHours(km), down: true };
    }).sort(function (x, y) { return x.km - y.km; });
  }

  function buildTours(river, cityName, timeHours, destCity) {
    var nodes = RIVERS[river];
    var ci = nodes.findIndex(function (n) { return n[0] === cityName; });
    if (ci < 0) return [];
    if (destCity) {
      var di = nodes.findIndex(function (n) { return n[0] === destCity; });
      if (di >= 0 && di !== ci) {
        var a0 = Math.min(ci, di), b0 = Math.max(ci, di);
        var km0 = Math.abs(nodes[b0][1] - nodes[a0][1]);
        var carries0 = nodes.slice(a0, b0 + 1).filter(function (x) { return x[2] === "port"; }).length;
        return [{
          from: di > ci ? cityName : destCity,
          to: di > ci ? destCity : cityName,
          a: a0, b: b0, km: km0, carries: carries0, hours: kmToHours(km0),
          water: hms(kmToHours(km0)), level: durLabel(kmToHours(km0)), best: true
        }];
      }
    }
    var towns = nodes.map(function (n, i) { return { n: n, i: i }; })
      .filter(function (o) { return o.n[2] === "town"; });
    var down = towns.filter(function (o) { return o.i > ci; });
    if (!down.length) return [];
    var cand = down.map(function (o) {
      var a = ci, b = o.i;
      var km = nodes[b][1] - nodes[a][1];
      var carries = nodes.slice(a, b + 1).filter(function (x) { return x[2] === "port"; }).length;
      return {
        from: cityName, to: o.n[0], a: a, b: b, km: km, carries: carries,
        water: hms(kmToHours(km)), hours: kmToHours(km), level: durLabel(kmToHours(km))
      };
    });
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

  /* ---------- local SVG route map (replaces Leaflet + tiles) ---------- */
  function routeSVG(slice) {
    var pts = [];
    slice.forEach(function (n, i) {
      var c = n[5];
      if (c) pts.push({ lat: c[0], lng: c[1], node: n, first: i === 0, last: i === slice.length - 1 });
    });
    if (pts.length < 2) return '<div class="route-empty">Kartenskizze nicht verfügbar</div>';
    var meanLat = pts.reduce(function (s, p) { return s + p.lat; }, 0) / pts.length;
    var k = Math.cos(meanLat * Math.PI / 180);
    // project to equirectangular space, then rotate so the overall course runs
    // left→right (this is a schematic, not a north-up map) to use the width well.
    var raw = pts.map(function (p) { return { x: p.lng * k, y: p.lat, p: p }; });
    var fx = raw[0].x, fy = raw[0].y;
    var lst = raw[raw.length - 1];
    var ang = -Math.atan2(lst.y - fy, lst.x - fx);
    var ca = Math.cos(ang), sa = Math.sin(ang);
    var rot = raw.map(function (r) {
      var ox = r.x - fx, oy = r.y - fy;
      return { x: ox * ca - oy * sa, y: ox * sa + oy * ca, p: r.p };
    });
    var xs = rot.map(function (r) { return r.x; });
    var ys = rot.map(function (r) { return r.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var dx = (maxX - minX) || 1e-4, dy = (maxY - minY) || 1e-4;
    var pad = 18, maxW = 600, maxH = 150, innerW = maxW - pad * 2, innerH = maxH - pad * 2;
    var scale = (dx / dy > innerW / innerH) ? innerW / dx : innerH / dy;
    var boxW = dx * scale + pad * 2, boxH = dy * scale + pad * 2;
    var P = rot.map(function (r) {
      return { x: pad + (r.x - minX) * scale, y: pad + (maxY - r.y) * scale, p: r.p };
    });
    var d = P.map(function (q, i) { return (i ? "L" : "M") + q.x.toFixed(1) + " " + q.y.toFixed(1); }).join(" ");
    var marks = P.map(function (q) {
      var n = q.p.node, isPort = n[2] === "port", end = q.p.first || q.p.last;
      if (isPort) {
        return '<rect x="' + (q.x - 4).toFixed(1) + '" y="' + (q.y - 4).toFixed(1) + '" width="8" height="8" ' +
          'transform="rotate(45 ' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ')" ' +
          'fill="rgba(122,46,34,.85)" stroke="var(--paper)" stroke-width="1.5" />';
      }
      return '<circle cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="' + (end ? 6 : 4) + '" ' +
        'fill="' + (end ? "var(--accent2)" : "var(--paper)") + '" ' +
        'stroke="' + (end ? "var(--accent2)" : "var(--accent)") + '" stroke-width="3" />';
    }).join("");
    return '<svg class="route-svg" viewBox="0 0 ' + boxW.toFixed(1) + ' ' + boxH.toFixed(1) + '" ' +
      'preserveAspectRatio="xMidYMid meet" role="img" aria-label="Streckenskizze ' +
      esc(slice[0][0]) + " bis " + esc(slice[slice.length - 1][0]) + '">' +
      '<path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="4" ' +
      'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".9" />' +
      marks + '</svg>';
  }

  /* ---------- state ---------- */
  var S = {
    screen: "start", dir: "fwd",
    time: "8 h", customH: 12,
    city: "Dachau", river: "Amper",
    dest: null, sel: 0, tourIdx: 0,
    picker: false, destPicker: false, showEnd: false
  };
  function timeHours() { return S.time === "eigene" ? S.customH : parseInt(S.time, 10); }
  function tours() { return buildTours(S.river, S.city, timeHours(), S.dest); }
  function destInfo() {
    return S.dest ? buildExits(S.river, S.city).find(function (e) { return e.name === S.dest; }) : null;
  }
  function set(patch) { Object.assign(S, patch); render(); }
  function nav(next, dir) { S.dir = dir; S.screen = next; render(); }

  /* ---------- screen markup ---------- */
  var TIME_CHIPS = ["2 h", "4 h", "8 h", "eigene"];

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
    return '' +
      '<div class="phone">' +
        '<div class="sk-status"><span class="sk-status-title">Planen</span></div>' +
        '<div class="phone-body" style="overflow-y:auto">' +
          '<h1 class="sk-h1">Auf den Fluss ist ein Muss.</h1>' +
          '<label class="sk-mini">Von</label>' +
          '<button class="sk-field set" id="openPicker" style="width:100%;cursor:pointer;text-align:left">' +
            '<span class="sk-field-ic">◎</span>' +
            '<span class="sk-field-val">' + esc(S.city) + "</span>" +
            '<span style="margin-left:auto;color:var(--muted);font-family:var(--font-hand);font-size:14px">ändern ▾</span>' +
          "</button>" +
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
  function customCap(h) {
    return (h <= 12 ? "langer Tag" : h <= 24 ? "über Nacht · Biwak" : "Mehrtagestour") + " · 10–48 h";
  }

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
            '<span class="tag warn">⚑ ' + t.carries + "× tragen</span></div>" +
          '<div class="tour-stats">' +
            '<span class="tstat"><b>' + t.km + ' <small>km</small></b><span>Strecke</span></span>' +
            '<span class="tstat"><b>' + esc(t.water) + "</b><span>im Boot</span></span></div>" +
          "</button>";
      }).join("");
      inner = '<p class="res-count">' + T.length + " " + (T.length === 1 ? "Tour" : "Tagestouren") +
        ' <small>· auf der ' + esc(S.river) + "</small></p>" +
        '<div class="tour-list">' + cards + "</div>";
    }
    return '' +
      '<div class="phone">' +
        '<div class="sk-status"><span class="sk-status-title">Touren</span></div>' +
        '<div class="phone-body" style="display:flex;flex-direction:column">' +
          '<div class="ctx-bar"><button class="ctx-edit" id="edit" style="margin-left:0;margin-right:auto">ändern</button>' + ctx + "</div>" +
          inner +
        "</div>" +
        (T.length > 0 ? '<div class="phone-foot"><button class="sk-go" id="viewSel" style="border-style:double;border-width:3px;letter-spacing:2px;font-size:25px;white-space:nowrap">Tour ansehen</button></div>' : "") +
      "</div>";
  }

  function tourHTML() {
    var T = tours();
    var tour = T[S.tourIdx] || T[0];
    var nodes = RIVERS[S.river];
    var meta = RIVER_META[S.river] || {};
    var slice = nodes.slice(tour.a, tour.b + 1);
    var base = slice[0][1];
    var ribbon = slice.map(function (n, i) {
      var first = i === 0, last = i === slice.length - 1;
      var isPort = n[2] === "port", isCaution = n[2] === "caution";
      var label = first ? "Einstieg " + n[0] : last ? "Ausstieg " + n[0] : n[0];
      var dotCls = isPort ? " port" : (first || last ? " end" : "");
      return '<div class="rib"><span class="rib-dot' + dotCls + '"></span>' +
        '<span class="rib-km">km ' + fmt1(n[1] - base) + "</span>" +
        '<div class="rib-t">' + esc(label) + "</div>" +
        '<div class="rib-s' + (isPort || isCaution ? " warn" : "") + '">' + esc(n[3]) + "</div>" +
        (n[4] ? '<div class="rib-reenter">↪ ' + esc(n[4]) + "</div>" : "") +
        "</div>";
    }).join("");
    var backLabel = (S.dest || T.length === 1) ? "Ändern" : "Touren";
    var note = meta.surveyFrom
      ? '<p class="sk-cap left" style="margin:8px 2px 0;font-size:12.5px;line-height:1.35">Datenbasis ' + esc(S.river) +
        ": " + meta.portages + " Umtragestellen erfasst (Vermessung " + meta.surveyFrom +
        (meta.surveyTo > meta.surveyFrom ? "–" + meta.surveyTo : "") + ") · kanu-info-isar.de</p>"
      : "";
    return '' +
      '<div class="phone">' +
        '<div class="sk-status"><span class="sk-status-title">Deine Tour</span></div>' +
        '<div class="phone-body" style="display:flex;flex-direction:column">' +
          '<div class="nav-row"><button class="nav-back" id="back"><span class="chev">‹</span> ' + esc(backLabel) + "</button></div>" +
          '<div class="route-map-wrap"><div class="route-map">' + routeSVG(slice) +
            '<span class="map-credit">Verlauf schematisch · kanu-info-isar.de</span></div></div>' +
          '<div class="ribbon">' + ribbon + "</div>" +
          note +
        "</div>" +
        '<div class="phone-foot"><button class="sk-go" id="startNav" style="border-style:double;border-width:3px;letter-spacing:2px;font-size:25px;white-space:nowrap">Navigation starten</button></div>' +
      "</div>";
  }

  /* ---------- modals ---------- */
  function cityPickerHTML() {
    var groups = RIVER_ORDER.map(function (river) {
      var rows = RIVERS[river].filter(function (n) { return n[2] === "town"; }).map(function (n) {
        return '<button class="picker-row' + (S.city === n[0] ? " sel" : "") + '" data-city="' + esc(n[0]) + '" data-river="' + esc(river) + '">' +
          '<span class="picker-pin">◎</span><span class="picker-city">' + esc(n[0]) + "</span>" +
          '<span class="picker-note">' + esc(n[3]) + "</span></button>";
      }).join("");
      return '<div class="picker-group">~ ' + esc(river) + "</div>" + rows;
    }).join("");
    return modalWrap("cityPicker",
      '<div class="modal-card picker-card" data-stop>' +
        '<div class="picker-title">Wo setzt du ein?</div>' +
        '<div class="picker-hint">Alle Orte mit Einsetzstelle aus der Karte</div>' +
        '<div class="picker-scroll">' + groups + "</div>" +
      "</div>");
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
          rows +
        "</div>" +
      "</div>");
  }
  function endModalHTML() {
    return modalWrap("endModal",
      '<div class="modal-card" data-stop>' +
        '<div class="modal-mark">✧</div>' +
        '<div class="modal-title">Jetzt bist du dran</div>' +
        '<p class="modal-msg">Das musst du schon selber machen. Mehr gibt\'s von mir nicht. Zeichne dir die Karte ab, schreibe dir die Hürden auf oder merke sie dir. Von jetzt an ist es nur noch du und die Natur. Viel Spaß.</p>' +
        '<button class="sk-go modal-btn" id="endOk" style="border-style:double;border-width:3px">Alles klar!</button>' +
      "</div>");
  }
  function modalWrap(id, inner) {
    return '<div class="modal-back" data-modal="' + id + '">' + inner + "</div>";
  }

  /* ---------- render + bind ---------- */
  var root = document.getElementById("root");
  function render() {
    var body = S.screen === "start" ? startHTML() : S.screen === "list" ? listHTML() : tourHTML();
    var modal = "";
    if (S.screen === "start" && S.picker) modal = cityPickerHTML();
    else if (S.screen === "start" && S.destPicker) modal = destPickerHTML();
    else if (S.screen === "tour" && S.showEnd) modal = endModalHTML();
    root.innerHTML =
      '<div class="app-stage">' +
        '<div class="' + (S.dir === "fwd" ? "scr-fwd" : "scr-back") + '" style="position:absolute;inset:0">' + body + "</div>" +
        modal +
      "</div>";
    bind();
  }

  function on(sel, ev, fn) {
    var el = root.querySelector(sel);
    if (el) el.addEventListener(ev, fn);
  }
  function onAll(sel, ev, fn) {
    root.querySelectorAll(sel).forEach(function (el) { el.addEventListener(ev, fn); });
  }

  function bind() {
    if (S.screen === "start") {
      on("#openPicker", "click", function () { set({ picker: true }); });
      on("#openDest", "click", function () { set({ destPicker: true }); });
      onAll(".dist-chip", "click", function (e) { set({ time: e.currentTarget.getAttribute("data-time") }); });
      on("#go", "click", function () {
        if (S.dest || tours().length === 1) { S.tourIdx = 0; nav("tour", "fwd"); }
        else nav("list", "fwd");
      });
      var range = root.querySelector("#customRange");
      if (range) {
        range.addEventListener("input", function (e) {
          S.customH = +e.target.value;
          var ro = root.querySelector("#customReadout"); if (ro) ro.textContent = S.customH;
          var cap = root.querySelector("#customCap"); if (cap) cap.textContent = customCap(S.customH);
        });
      }
    } else if (S.screen === "list") {
      on("#edit", "click", function () { nav("start", "back"); });
      on("#viewSel", "click", function () { S.tourIdx = S.sel; nav("tour", "fwd"); });
      onAll(".tour-card", "click", function (e) {
        S.tourIdx = +e.currentTarget.getAttribute("data-tour");
        nav("tour", "fwd");
      });
    } else if (S.screen === "tour") {
      var T = tours();
      on("#back", "click", function () { nav((S.dest || T.length === 1) ? "start" : "list", "back"); });
      on("#startNav", "click", function () { set({ showEnd: true }); });
      on("#endOk", "click", function () { set({ showEnd: false }); });
    }

    // modal dismiss / picks
    var back = root.querySelector(".modal-back");
    if (back) {
      back.addEventListener("click", function (e) {
        if (e.target.closest("[data-stop]")) return; // ignore inner clicks
        closeModal(back.getAttribute("data-modal"));
      });
      onAll(".picker-row[data-city]", "click", function (e) {
        var el = e.currentTarget;
        set({ city: el.getAttribute("data-city"), river: el.getAttribute("data-river"), sel: 0, dest: null, picker: false });
      });
      onAll(".picker-row[data-dest]", "click", function (e) {
        var v = e.currentTarget.getAttribute("data-dest");
        set({ dest: v === "__none" ? null : v, sel: 0, destPicker: false });
      });
    }
  }
  function closeModal(id) {
    if (id === "cityPicker") set({ picker: false });
    else if (id === "destPicker") set({ destPicker: false });
    else if (id === "endModal") set({ showEnd: false });
  }

  render();
})();

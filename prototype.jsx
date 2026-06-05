/* global React, ReactDOM */
/* Clickable flow prototype for the RiversOfMuc planner.
   Start (chips + city picker)  →  A · Touren-Liste  →  B · Tour-Überblick

   Everything is driven by one river model (RIVERS): real put-in towns and
   weirs taken from the kanu-info-isar database (map-sheet sequences for the
   Isar, Loisach, Ammer, Amper, Würm). The "Von" city is the take-out you
   paddle home to; tours are the real put-in towns upstream of it on the same
   river, so the list and the overview always agree with the chosen city. */
const { useState, useMemo } = React;

/* ---------- river model — loaded from riverdata.js (inline, no backend) ----------
   node = [name, km (downstream), type, note, reentry?]
   type: "town" = put-in / take-out · "port" = weir/power plant (carry around) · "caution" = scout it */
const RIVERS = window.RIVERS;
const RIVER_ORDER = window.RIVER_ORDER;
const RIVER_META = window.RIVER_META || {};

/* ---------- tour generation ---------- */
const fmt1 = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");
const PADDLE_KMH = 5; // assumed cruising speed on the water
const kmToHours = (km) => km / PADDLE_KMH;
/* hours -> "2 h 15 min" / "45 min" */
function hms(hours) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60),m = total % 60;
  if (!h) return m + " min";
  return h + " h" + (m ? " " + m + " min" : "");
}
/* length descriptor from water time */
function durLabel(hours) {
  if (hours <= 2) return "kurze Tour";
  if (hours <= 4) return "halber Tag";
  if (hours <= 8) return "Tagestour";
  return "lange Tour";
}

/* All possible take-out (exit) towns reachable from a put-in, with distance
   and water time @ 5 km/h. Downstream by default; if the put-in sits at the
   mouth, fall back to upstream reaches. */
function buildExits(river, fromCity) {
  const nodes = RIVERS[river];
  const fi = nodes.findIndex((n) => n[0] === fromCity);
  if (fi < 0) return [];
  // Only towns DOWNSTREAM of the put-in are reachable (you paddle with the current).
  const down = nodes.map((n, i) => ({ n, i })).
  filter((o) => o.n[2] === "town" && o.i > fi);
  return down.map((o) => {
    const a = fi,b = o.i;
    const km = nodes[b][1] - nodes[a][1];
    const carries = nodes.slice(a, b + 1).filter((x) => x[2] === "port").length;
    return { name: o.n[0], note: o.n[3], km, carries, hours: kmToHours(km), down: true };
  }).sort((x, y) => x.km - y.km);
}

function buildTours(river, cityName, timeHours, destCity) {
  const nodes = RIVERS[river];
  const ci = nodes.findIndex((n) => n[0] === cityName);
  if (ci < 0) return [];
  // If a destination is set, the tour is simply put-in -> take-out.
  if (destCity) {
    const di = nodes.findIndex((n) => n[0] === destCity);
    if (di >= 0 && di !== ci) {
      const a = Math.min(ci, di),b = Math.max(ci, di);
      const km = Math.abs(nodes[b][1] - nodes[a][1]);
      const carries = nodes.slice(a, b + 1).filter((x) => x[2] === "port").length;
      return [{
        from: di > ci ? cityName : destCity,
        to: di > ci ? destCity : cityName,
        a, b, km, carries, hours: kmToHours(km),
        water: hms(kmToHours(km)),
        level: durLabel(kmToHours(km)), best: true
      }];
    }
  }
  // The selected city is the PUT-IN ("Von"). You paddle DOWNSTREAM to a take-out,
  // so every tour starts at the chosen city and ends at a town further downstream.
  const towns = nodes.map((n, i) => ({ n, i })).filter((o) => o.n[2] === "town");
  const down = towns.filter((o) => o.i > ci);
  if (!down.length) return []; // city sits at the downstream end — nothing below it
  const cand = down.map((o) => {
    const a = ci,b = o.i;
    const km = nodes[b][1] - nodes[a][1];
    const carries = nodes.slice(a, b + 1).filter((x) => x[2] === "port").length;
    return {
      from: cityName,
      to: o.n[0],
      a, b, km, carries,
      water: hms(kmToHours(km)),
      hours: kmToHours(km),
      level: durLabel(kmToHours(km))
    };
  });
  let fit = cand.filter((t) => t.hours <= timeHours);
  if (!fit.length) fit = [cand.reduce((m, t) => t.km < m.km ? t : m, cand[0])];
  fit.sort((x, y) => y.km - x.km); // longest first
  const idx = fit.length <= 3 ? fit.map((_, i) => i) :
  [0, Math.floor((fit.length - 1) / 2), fit.length - 1];
  const out = [...new Set(idx)].map((i) => fit[i]);
  if (out.length) out[0].best = true;
  return out;
}


/* ---------- shared chrome ---------- */
function Status({ title }) {
  return (
    <div className="sk-status">
      <span>9:41</span>
      <span className="sk-status-title">{title}</span>
      <span>▮▮▮ ▮</span>
    </div>);
}
function PButton({ children, onClick }) {
  return <button className="sk-go" style={{ borderStyle: "double", borderWidth: "3px", letterSpacing: "2px", fontSize: "25px", whiteSpace: "nowrap" }} onClick={onClick}>{children}</button>;
}

/* ============ city picker modal ============ */
function CityPicker({ city, onPick, onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal-card picker-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-title">Wo setzt du ein?</div>
        <div className="picker-hint">Alle Orte mit Einsetzstelle aus der Karte</div>
        <div className="picker-scroll">
          {RIVER_ORDER.map((river) =>
          <React.Fragment key={river}>
              <div className="picker-group">~ {river}</div>
              {RIVERS[river].filter((n) => n[2] === "town").map((n) =>
            <button key={river + n[0]} className={"picker-row" + (city === n[0] ? " sel" : "")}
            onClick={() => onPick(n[0], river)}>
                  <span className="picker-pin">◎</span>
                  <span className="picker-city">{n[0]}</span>
                  <span className="picker-note">{n[3]}</span>
                </button>
            )}
            </React.Fragment>
          )}
        </div>
      </div>
    </div>);
}

/* ============ destination (exit-city) picker modal ============ */
function DestPicker({ fromCity, river, dest, onPick, onClear, onClose }) {
  const exits = buildExits(river, fromCity);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal-card picker-card" onClick={(e) => e.stopPropagation()}>
        <div className="picker-title">Wohin willst du?</div>
        <div className="picker-hint">Erreichbare Ausstiegsorte ab {fromCity} · gerechnet mit 5 km/h</div>
        <div className="picker-scroll">
          <button className={"picker-row dest-row" + (dest ? "" : " sel")} onClick={onClear}>
            <span className="picker-pin">✕</span>
            <span className="picker-city">Kein Ziel</span>
            <span className="picker-note">nach Zeit planen</span>
          </button>
          {exits.length === 0 &&
          <div className="picker-hint" style={{ margin: "10px 2px" }}>Keine weiteren Orte flussab.</div>}
          {exits.map((e) =>
          <button key={e.name} className={"picker-row dest-row" + (dest === e.name ? " sel" : "")}
          onClick={() => onPick(e.name)}>
            <span className="picker-pin">⚑</span>
            <span className="picker-city">{e.name}</span>
            <span className="dest-meta">
              <b>{fmt1(e.km)} km</b>
              <span>{hms(e.hours)}{e.carries ? " · " + e.carries + "× tragen" : ""}</span>
            </span>
          </button>
          )}
        </div>
      </div>
    </div>);
}

/* ============ Screen 1 · Start ============ */
const TIME_CHIPS = ["2 h", "4 h", "8 h", "eigene"];
function StartScreen({ city, openPicker, dest, destInfo, openDest, time, setTime, customH, setCustomH, go }) {
  const custom = time === "eigene";
  return (
    <div className="phone">
      <Status title="Planen" />
      <div className="phone-body" style={{ overflowY: "auto" }}>
        <h1 className="sk-h1">Auf den Fluss ist ein Muss.
Ein Werkzeug vom Flo
        </h1>
        <label className="sk-mini">Von</label>
        <button className="sk-field set" style={{ width: "100%", cursor: "pointer", textAlign: "left" }} onClick={openPicker}>
          <span className="sk-field-ic">◎</span>
          <span className="sk-field-val">{city}</span>
          <span style={{ marginLeft: "auto", color: "var(--muted)", fontFamily: "var(--font-hand)", fontSize: 14 }}>ändern ▾</span>
        </button>
        <label className="sk-mini">Nach</label>
        <button className={"sk-field" + (dest ? " set" : "")} style={{ width: "100%", cursor: "pointer", textAlign: "left" }} onClick={openDest}>
          <span className="sk-field-ic flag">⚑</span>
          {dest ? <span className="sk-field-val">{dest}</span> : <span className="sk-field-val muted">Ziel (optional)</span>}
          {dest && destInfo ?
          <span style={{ marginLeft: "auto", color: "var(--accent)", fontFamily: "var(--font-hand)", fontSize: 15, whiteSpace: "nowrap" }}>{fmt1(destInfo.km)} km · {hms(destInfo.hours)}</span> :
          <span style={{ marginLeft: "auto", color: "var(--muted)", fontFamily: "var(--font-hand)", fontSize: 14 }}>wählen ▾</span>}
        </button>
        <div className="or-div"><span>oder</span></div>
        <label className="sk-mini" style={dest ? { opacity: .4 } : null}>Wie viel Zeit hast du?</label>
        <div className="dist-chips" style={dest ? { opacity: .4, pointerEvents: "none" } : null}>
          {TIME_CHIPS.map((c) =>
          <button key={c} className={"dist-chip" + (time === c ? " sel" : "")} onClick={() => setTime(c)}>{c}</button>
          )}
        </div>
        {custom && !dest &&
        <div className="custom-time">
          <div className="slider-readout"><b>{customH}</b> h</div>
          <input type="range" min="10" max="48" step="1" value={customH}
          onChange={(e) => setCustomH(+e.target.value)} className="sk-range" />
          <div className="slider-ticks"><span>10 h</span><span>24 h</span><span>48 h</span></div>
          <p className="sk-cap left" style={{ margin: "2px 0 0" }}>
            {customH <= 12 ? "langer Tag" : customH <= 24 ? "über Nacht · Biwak" : "Mehrtagestour"} · 10–48 h
          </p>
        </div>
        }
      </div>
      <div className="phone-foot"><PButton onClick={go}>los geht's!</PButton></div>
    </div>);
}

/* ============ Screen 2 · A · Touren-Liste ============ */
function ListScreen({ city, river, time, dest, tours, sel, setSel, onEdit, openTour }) {
  return (
    <div className="phone">
      <Status title="Touren" />
      <div className="phone-body" style={{ display: "flex", flexDirection: "column" }}>
        <div className="ctx-bar">
          <button className="ctx-edit" style={{ marginLeft: 0, marginRight: "auto" }} onClick={onEdit}>ändern</button>
          {dest ?
          <span className="ctx-chip">◎ <b>{city}</b> <span className="dot">→</span> ⚑ <b>{dest}</b></span> :
          <span className="ctx-chip">◎ <b>{city}</b> <span className="dot">·</span> ◷ {time}</span>}
        </div>
        {tours.length === 0 ?
        <div className="empty-tours">
          <div className="empty-mark">◎</div>
          <p className="empty-msg">{city} liegt am unteren Ende der {river}. Flussabwärts geht es von hier nicht weiter — wähle einen Einstieg weiter flussaufwärts.</p>
        </div> :

        <React.Fragment>
        <p className="res-count">{tours.length} {tours.length === 1 ? "Tour" : "Tagestouren"} <small>· auf der {river}</small></p>
        <div className="tour-list">
          {tours.map((t, i) =>
            <button key={i} className={"tour-card" + (sel === i ? " sel" : "")} onClick={() => openTour(i)}>
              {t.best && <span className="best-flag">{dest ? "★ Deine Route" : "★ Beste für " + time}</span>}
              <div className="tour-route">{t.from} <span className="arr">→</span> {t.to}</div>
              <div className="tags">
                <span className="tag river">~ {river}</span>
                <span className="tag">{t.level}</span>
                <span className="tag warn">⚑ {t.carries}× tragen</span>
              </div>
              <div className="tour-stats">
                <span className="tstat"><b>{t.km} <small>km</small></b><span>Strecke</span></span>
                <span className="tstat"><b>{t.water}</b><span>im Boot</span></span>
              </div>
            </button>
            )}
        </div>
        </React.Fragment>
        }
      </div>
      {tours.length > 0 &&
      <div className="phone-foot"><PButton onClick={() => openTour(sel)}>Tour ansehen</PButton></div>}
    </div>);
}

/* ============ real route map (Leaflet + CARTO/OSM tiles; static PNG when available) ============ */
function routeKey(river, a, b) {
  const slug = (RIVER_META[river] || {}).slug || river.toLowerCase();
  return slug + "_" + a + "_" + b;
}
function RouteMap({ river, slice, a, b }) {
  const ref = React.useRef(null);
  const img = (window.ROUTE_MAPS || {})[routeKey(river, a, b)];
  React.useEffect(() => {
    if (img || !ref.current || !window.L) return;
    const pts = slice.map((n) => n[5]).filter(Boolean);
    if (!pts.length) return;
    const map = L.map(ref.current, {
      zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, tap: false
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 18, crossOrigin: true }).addTo(map);
    const poly = L.polyline(pts, { color: "#5b4b8a", weight: 4, opacity: .9, lineJoin: "round", lineCap: "round" }).addTo(map);
    slice.forEach((n, i) => {
      const c = n[5]; if (!c) return;
      const isEnd = i === 0 || i === slice.length - 1;
      if (n[2] === "port") {
        L.marker(c, { icon: L.divIcon({ className: "", html: '<span class="lf-port"></span>', iconSize: [12, 12], iconAnchor: [6, 6] }) }).addTo(map);
      } else {
        L.circleMarker(c, { radius: isEnd ? 7 : 4, color: isEnd ? "#444042" : "#5b4b8a", weight: 3,
          fillColor: isEnd ? "#444042" : "#faf8f1", fillOpacity: 1 }).addTo(map);
      }
    });
    map.fitBounds(poly.getBounds(), { padding: [22, 22], maxZoom: 13 });
    setTimeout(() => { map.invalidateSize(); map.fitBounds(poly.getBounds(), { padding: [22, 22], maxZoom: 13 }); }, 80);
    return () => map.remove();
  }, [river, a, b]);
  if (img) {
    return <div className="route-map"><img src={img} className="route-img" alt={"Karte " + slice[0][0] + " → " + slice[slice.length - 1][0]} /></div>;
  }
  return (
    <div className="route-map-wrap">
      <div ref={ref} className="route-map" />
      <span className="map-credit">© OpenStreetMap · CARTO</span>
    </div>);
}

/* ============ Screen 3 · B · Tour-Überblick ============ */
function TourScreen({ river, tour, back, backLabel }) {
  const [showEnd, setShowEnd] = useState(false);
  const nodes = RIVERS[river];
  const meta = RIVER_META[river] || {};
  const slice = nodes.slice(tour.a, tour.b + 1);
  const base = slice[0][1];
  return (
    <div className="phone">
      <Status title="Deine Tour" />
      <div className="phone-body" style={{ display: "flex", flexDirection: "column" }}>
        <div className="nav-row">
          <button className="nav-back" onClick={back}><span className="chev">‹</span> {backLabel || "Touren"}</button>
        </div>
        <RouteMap river={river} slice={slice} a={tour.a} b={tour.b} />
        <div className="ribbon">
          {slice.map((n, i) => {
            const first = i === 0,last = i === slice.length - 1;
            const isPort = n[2] === "port",isCaution = n[2] === "caution";
            const label = first ? "Einstieg " + n[0] : last ? "Ausstieg " + n[0] : n[0];
            return (
              <div key={i} className="rib">
                <span className={"rib-dot" + (isPort ? " port" : first || last ? " end" : "")} />
                <span className="rib-km">km {fmt1(n[1] - base)}</span>
                <div className="rib-t">{label}</div>
                <div className={"rib-s" + (isPort || isCaution ? " warn" : "")}>{n[3]}</div>
                {n[4] && <div className="rib-reenter">↪ {n[4]}</div>}
              </div>);
          })}
        </div>
        {meta.surveyFrom &&
        <p className="sk-cap left" style={{ margin: "8px 2px 0", fontSize: 12.5, lineHeight: 1.35 }}>
          Datenbasis {river}: {meta.portages} Umtragestellen erfasst (Vermessung {meta.surveyFrom}{meta.surveyTo > meta.surveyFrom ? "–" + meta.surveyTo : ""}) · kanu-info-isar.de
        </p>}
      </div>
      <div className="phone-foot"><PButton onClick={() => setShowEnd(true)}>Navigation starten</PButton></div>
      {showEnd &&
      <div className="modal-back" onClick={() => setShowEnd(false)}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-mark">✧</div>
          <div className="modal-title">Jetzt bist du dran</div>
          <p className="modal-msg">Das musst du schon selber machen. Mehr gibt's von mir nicht. Zeichne dir die Karte ab, schreibe dir die Hürden auf oder merke sie dir. Von jetzt an ist es nur noch du und die Natur. Viel Spaß.</p>
          <button className="sk-go modal-btn" style={{ borderStyle: "double", borderWidth: "3px" }} onClick={() => setShowEnd(false)}>Alles klar!</button>
        </div>
      </div>
      }
    </div>);
}

/* ============ flow router ============ */
function PrototypeApp() {
  const [screen, setScreen] = useState("start"); // start | list | tour
  const [dir, setDir] = useState("fwd");
  const [time, setTime] = useState("8 h");
  const [customH, setCustomH] = useState(12);
  const [city, setCity] = useState("Dachau");
  const [river, setRiver] = useState("Amper");
  const [picker, setPicker] = useState(false);
  const [dest, setDest] = useState(null); // chosen exit/take-out town
  const [destPicker, setDestPicker] = useState(false);
  const [sel, setSel] = useState(0);
  const [tourIdx, setTourIdx] = useState(0);
  const [scale, setScale] = useState(1);

  const timeHours = time === "eigene" ? customH : parseInt(time, 10);
  const tours = useMemo(() => buildTours(river, city, timeHours, dest), [river, city, timeHours, dest]);
  const destInfo = useMemo(() => dest ? buildExits(river, city).find((e) => e.name === dest) : null, [river, city, dest]);

  React.useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 40) / 812, (window.innerWidth - 32) / 384));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const nav = (next, direction) => {setDir(direction);setScreen(next);};
  const pick = (c, r) => {setCity(c);setRiver(r);setSel(0);setDest(null);setPicker(false);};
  const pickDest = (name) => {setDest(name);setSel(0);setDestPicker(false);};

  let body = null;
  if (screen === "start") {
    body = <StartScreen city={city} openPicker={() => setPicker(true)}
    dest={dest} destInfo={destInfo} openDest={() => setDestPicker(true)}
    time={time} setTime={setTime} customH={customH} setCustomH={setCustomH}
    go={() => {if (dest || tours.length === 1) {setTourIdx(0);nav("tour", "fwd");} else nav("list", "fwd");}} />;
  } else if (screen === "list") {
    body = <ListScreen city={city} river={river} time={timeHours + " h"} dest={dest} tours={tours} sel={sel} setSel={setSel}
    onEdit={() => nav("start", "back")}
    openTour={(i) => {setTourIdx(i);nav("tour", "fwd");}} />;
  } else {
    body = <TourScreen river={river} tour={tours[tourIdx] || tours[0]}
    backLabel={(dest || tours.length === 1) ? "Ändern" : "Touren"}
    back={() => nav((dest || tours.length === 1) ? "start" : "list", "back")} />;
  }

  return (
    <div className="proto-stage">
      <div className="proto-phone" style={{ transform: `scale(${scale})` }}>
        <div key={screen} className={dir === "fwd" ? "scr-fwd" : "scr-back"} style={{ position: "absolute", inset: 0 }}>
          {body}
        </div>
        {picker && screen === "start" && <CityPicker city={city} onPick={pick} onClose={() => setPicker(false)} />}
        {destPicker && screen === "start" && <DestPicker fromCity={city} river={river} dest={dest}
        onPick={pickDest} onClear={() => pickDest(null)} onClose={() => setDestPicker(false)} />}
      </div>
    </div>);
}

window.PrototypeApp = PrototypeApp;
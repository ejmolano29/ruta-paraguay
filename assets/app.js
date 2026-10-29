/* Ruta Paraguay en motorhome — app de una sola página (sin build).
   Datos estáticos: assets/data.js (window.DATA). Datos compartidos: Supabase (config.js). */
(() => {
'use strict';

/* ================================================================ utilidades */
const DATA = window.DATA, CFG = window.TRIP_CONFIG || {};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D = s => { const [y,m,d] = s.split('-').map(Number); return new Date(Date.UTC(y, m-1, d)); };
const iso = d => d.toISOString().slice(0, 10);
const addD = (s, n) => { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const diff = (a, b) => Math.round((D(a) - D(b)) / 864e5);   // a - b en días
const maxD = (a, b) => a > b ? a : b;
const fmt = s => D(s).toLocaleDateString('es-PY', {weekday:'short', day:'numeric', month:'short', timeZone:'UTC'}).replace(/\./g, '');
const fmtS = s => D(s).toLocaleDateString('es-PY', {day:'numeric', month:'short', timeZone:'UTC'}).replace(/\./g, '');
const hm = m => m >= 60 ? `${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}` : `${m} min`;
const noches = n => `${n} noche${n === 1 ? '' : 's'}`;
const TODAY = new URLSearchParams(location.search).get('hoy') || new Date(Date.now() - new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'l' + Date.now() + Math.random().toString(16).slice(2));
const ls = {
  get(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
let toastT;
function toast(t){ const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 2600); }

/* iconos (trazo 2px, 24×24) */
const IC = {
  home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  tree:'<path d="M12 2 6.5 9.5h3L5 16h5l-1 0h6-1 5l-4.5-6.5h3z"/><path d="M12 16v6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
  back:'<path d="M15 5l-7 7 7 7"/>', chev:'<path d="M9 5l7 7-7 7"/>', down:'<path d="M6 9l6 6 6-6"/>',
  van:'<path d="M2 16V7a1 1 0 0 1 1-1h11l4 4h3a1 1 0 0 1 1 1v5h-2"/><path d="M14 6v4h4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', star:'<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z"/>',
  trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>', cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  shower:'<path d="M4 20V8a4 4 0 0 1 8 0"/><path d="M9 8h6"/><path d="M11 12v1M14 12v1M17 12v1M11 16v1M14 16v1M17 16v1"/>',
  wash:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4.5"/><path d="M8 6.5h.01M11 6.5h.01"/>',
  park:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M10 17V8h3.5a2.5 2.5 0 0 1 0 5H10"/>',
  car:'<path d="M5 17h14M5 17v2M19 17v2M4 13l2-5h12l2 5v4H4z"/><circle cx="8" cy="14.5" r=".5"/><circle cx="16" cy="14.5" r=".5"/>',
  gps:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>', trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>', key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  paw:'<circle cx="5.5" cy="10" r="1.8"/><circle cx="9.5" cy="5.5" r="1.8"/><circle cx="14.5" cy="5.5" r="1.8"/><circle cx="18.5" cy="10" r="1.8"/><path d="M12 11c-3 0-5.5 4-5.5 6.5 0 1.5 1.2 2.5 2.7 2.5 1 0 1.8-.5 2.8-.5s1.8.5 2.8.5c1.5 0 2.7-1 2.7-2.5C17.5 15 15 11 12 11z"/>',
  camp:'<path d="M3 20 12 4l9 16z"/><path d="M12 20l-3.5-6h7z"/>', photo:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', sync:'<path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 13a8 8 0 0 0 14 4.5L20 15"/><path d="M4 4v5h5M20 20v-5h-5"/>',
};
const icon = (n, cls='') => `<span data-icon class="${cls}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg></span>`;
function hydrateIcons(root = document){ root.querySelectorAll('[data-icon]:empty').forEach(e => e.outerHTML = icon(e.dataset.icon, e.className)); }

/* ================================================================ datos estáticos */
const DEF = {}; [...DATA.stops, ...DATA.optional].forEach(s => DEF[s.key] = s);
const PL = DATA.places;
const EXIT = {'19':'2026-12-19', '12':'2026-12-12'};
const XMAS_END = '2026-12-25';
const SEGC = {A:'var(--A)', B:'var(--B)', C:'var(--C)', D:'var(--D)'};
const SEGHEX = {A:'#2f6fe0', B:'#d9783a', C:'#1f9a63', D:'#d6246e'};
const SEGN = {A:'Este → Asunción', B:'Chaco y norte', C:'Misiones → Posadas', D:'Argentina', X:'No planificada'};
const PLACEHOLDER = 'assets/img/placeholder.svg';
const photos = k => (DATA.photos[k] && DATA.photos[k].length) ? DATA.photos[k] : [PLACEHOLDER];
const photo = k => photos(k)[0];
const thumb = k => photo(k).replace('assets/photos/', 'assets/photos/th/');
const attrPhoto = (id, stopKey) => DATA.attrPhoto[id] || thumb(stopKey);

/* ================================================================ estado */
const S = {
  plan: ls.get('pm-plan', null) || preset('19'),
  checkins: ls.get('pm-checkins', []),
  me: ls.get('pm-me', {name:'', pass:''}),
  remote: !!(CFG.supabaseUrl && CFG.supabaseAnonKey),
  online: false, editing: false, lastSync: null,
};
function preset(sc){
  return {scenario: sc, start: '2026-11-01', updatedAt: 0,
    stops: DATA.stops.filter(s => s['n'+sc] > 0).map(s => ({key: s.key, nights: s['n'+sc], lodging: s.lodging}))};
}
const saveLocal = () => { ls.set('pm-plan', S.plan); ls.set('pm-checkins', S.checkins); ls.set('pm-me', S.me); };

/* ================================================================ Supabase (REST, sin librería) */
const sb = {
  h(){ return {'apikey': CFG.supabaseAnonKey, 'Authorization': 'Bearer ' + CFG.supabaseAnonKey, 'Content-Type': 'application/json'}; },
  async get(path){
    const r = await fetch(`${CFG.supabaseUrl}/rest/v1/${path}`, {headers: this.h(), cache: 'no-store'});
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.statusText);
    return r.json();
  },
  async rpc(fn, body){
    const r = await fetch(`${CFG.supabaseUrl}/rest/v1/rpc/${fn}`, {method: 'POST', headers: this.h(), body: JSON.stringify(body)});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || r.statusText);
    return j;
  }
};
async function pull(){
  if (!S.remote) return;
  try {
    const [cks, plan] = await Promise.all([
      sb.get('checkins?select=*&deleted=eq.false&order=arrived.asc,created_at.asc'),
      sb.get('trip_plan?select=*&id=eq.1')
    ]);
    S.checkins = cks;
    const rp = plan[0];
    if (rp && rp.data && (new Date(rp.updated_at).getTime() > (S.plan.updatedAt || 0) || !S.dirty)) {
      S.plan = Object.assign(rp.data, {updatedAt: new Date(rp.updated_at).getTime()});
      S.planBy = rp.updated_by;
    }
    S.online = true; S.lastSync = new Date();
    saveLocal(); render();
  } catch (e) { S.online = false; renderWho(); console.warn('Supabase', e); }
}
let planT;
function planChanged(msg){
  S.plan.updatedAt = Date.now(); S.dirty = true; saveLocal(); render();
  if (msg) toast(msg);
  if (!S.remote) return;
  if (!S.me.pass) { toast('Cambio guardado solo en este teléfono. Ingresa la clave del viaje para compartirlo.'); return; }
  clearTimeout(planT);
  planT = setTimeout(async () => {
    try {
      const {updatedAt, ...data} = S.plan;
      await sb.rpc('save_plan', {p_pass: S.me.pass, p_data: data, p_by: S.me.name || 'anónimo'});
      S.dirty = false;
    } catch (e) { toast('No se pudo compartir el plan: ' + e.message); }
  }, 900);
}
async function saveCheckin(row){
  if (S.remote) {
    if (!S.me.pass) throw new Error('Falta la clave del viaje');
    const saved = await sb.rpc('save_checkin', {p_pass: S.me.pass, p: row});
    const i = S.checkins.findIndex(c => c.id === saved.id);
    if (saved.deleted) S.checkins = S.checkins.filter(c => c.id !== saved.id);
    else if (i >= 0) S.checkins[i] = saved; else S.checkins.push(saved);
  } else {
    if (!row.id) row.id = uid();
    row.updated_at = new Date().toISOString();
    const i = S.checkins.findIndex(c => c.id === row.id);
    if (row.deleted) S.checkins = S.checkins.filter(c => c.id !== row.id);
    else if (i >= 0) S.checkins[i] = Object.assign(S.checkins[i], row); else S.checkins.push(row);
  }
  saveLocal();
}

/* ================================================================ línea de tiempo + reajuste automático */
function customDef(c, seg){
  return {key: c.stop_key, name: c.stop_name || c.place_name || 'Parada no planificada', region: 'Parada no planificada', seg: seg || 'X',
    lodging: null, alts: [], attr: [], park: [], laundry: [], onsite: [], uber: '', why: 'Parada agregada durante el viaje con un check-in.', custom: true,
    lat: c.lat, lon: c.lon};
}
function minNights(r){ return r.def.optional ? 0 : 1; }

function timeline(){
  const sc = S.plan.scenario;
  const cks = S.checkins.filter(c => !c.deleted);
  const latest = {};
  cks.forEach(c => { if (!latest[c.stop_key] || c.arrived > latest[c.stop_key].arrived) latest[c.stop_key] = c; });
  let rows = S.plan.stops.map(s => ({key: s.key, def: DEF[s.key], plan: s.nights, n: s.nights, lodging: s.lodging, ck: latest[s.key], inPlan: true}))
    .filter(r => r.def);
  // check-ins en paradas fuera del plan (opcionales o no planificadas): se insertan por fecha
  Object.values(latest).filter(c => !rows.some(r => r.key === c.stop_key)).sort((a,b) => a.arrived < b.arrived ? -1 : 1).forEach(c => {
    let pos = 0;
    rows.forEach((r, i) => { if (r.ck && r.ck.arrived <= c.arrived) pos = i + 1; });
    const prevSeg = rows[pos-1]?.def.seg;
    rows.splice(pos, 0, {key: c.stop_key, def: DEF[c.stop_key] || customDef(c, prevSeg), plan: 0, n: 0, lodging: c.place_id, ck: c, inPlan: false});
  });
  const L = rows.reduce((m, r, i) => r.ck ? i : m, -1);

  const dates = () => {
    let d = S.plan.start;
    rows.forEach((r, i) => {
      if (r.ck) {
        r.arr = r.ck.arrived;
        const nextCk = rows.slice(i+1).find(x => x.ck);
        r.dep = r.ck.departed || (nextCk ? nextCk.ck.arrived : maxD(addD(r.arr, r.plan || 1), TODAY));
        if (r.dep < r.arr) r.dep = r.arr;
        r.n = diff(r.dep, r.arr); r.state = r.ck.departed || nextCk ? 'done' : 'here';
      } else if (i < L) {
        r.arr = r.dep = d; r.n = 0; r.state = 'skip';
      } else {
        r.arr = d; r.dep = addD(d, r.n); r.state = 'next';
      }
      d = r.dep;
    });
  };
  dates();

  // anclas: Asunción 21-nov y 8-dic (estar ese día), salida exacta a Argentina, Navidad cubierta
  const anchors = [];
  rows.forEach((r, i) => { if (r.def.anchor) anchors.push({i, date: r.def.anchor, type: 'cover', label: `Asunción ${fmtS(r.def.anchor)}`}); });
  const ax = rows.findIndex(r => r.def.argentina);
  if (ax >= 0) anchors.push({i: ax, date: EXIT[sc], type: 'arrive', label: `salida ${fmtS(EXIT[sc])}`});
  const lastAr = rows.map((r, i) => r.def.argentina ? i : -1).filter(i => i >= 0).pop();
  if (lastAr != null && lastAr >= 0) anchors.push({i: lastAr, date: XMAS_END, type: 'cover', label: 'Navidad', selfOnly: true});
  anchors.sort((a, b) => a.i - b.i);

  const issues = [];
  let segStart = L + 1;
  const reduce = (flex, k) => {
    while (k > 0) {
      const c = flex.filter(j => rows[j].n > minNights(rows[j]));
      if (!c.length) break;
      // recorta primero la estadía más larga; a igualdad, la que aún no fue recortada (n/plan mayor) y luego la más temprana
      const score = j => [rows[j].n, rows[j].n / Math.max(1, rows[j].plan), -j];
      const j = c.reduce((b, j) => { const x = score(j), y = score(b); return (x[0] - y[0] || x[1] - y[1] || x[2] - y[2]) > 0 ? j : b; }, c[0]);
      rows[j].n--; k--;
    }
    return k;
  };
  const extend = (flex, k) => {
    // primero devuelve noches recortadas; luego suma a las últimas paradas antes del ancla
    for (const j of [...flex].reverse()) while (k > 0 && rows[j].n < rows[j].plan) { rows[j].n++; k--; }
    const pool = [...flex].reverse().filter(j => !['pozo','srosa'].includes(rows[j].key));
    let t = 0;
    while (k > 0 && pool.length) { rows[pool[t % pool.length]].n++; k--; t++; }
    return k;
  };
  for (const a of anchors) {
    dates();
    const A = rows[a.i];
    if (a.i <= L) {   // ancla ya vivida: solo se verifica
      if (a.type === 'cover' ? !(A.arr <= a.date && A.dep >= a.date) : A.arr !== a.date) issues.push({lvl: 'bad', t: `No se cumplió ${a.label}.`});
      segStart = Math.max(segStart, a.i + 1); continue;
    }
    const flex = [];
    for (let j = Math.max(segStart, L + 1); j < a.i; j++) if (!rows[j].def.argentina || a.selfOnly) flex.push(j);
    const late = diff(A.arr, a.date);
    if (a.type === 'cover') {
      if (late > 0 && !a.selfOnly) { const rest = reduce(flex, late); if (rest > 0) issues.push({lvl: 'bad', t: `Aun recortando noches se llega ${rest} día(s) tarde a ${a.label}.`}); }
      dates();
      const short = diff(a.date, A.dep);
      if (A.arr <= a.date && short > 0) A.n += short;
    } else {
      if (late > 0) { const rest = reduce(flex, late); if (rest > 0) issues.push({lvl: 'bad', t: `No alcanza para salir el ${fmtS(a.date)}: faltan ${rest} día(s). Prueba el escenario de salida 19-dic.`}); }
      else if (late < 0) { const rest = extend(flex, -late); if (rest > 0) issues.push({lvl: 'warn', t: `Sobran ${rest} día(s) antes de la ${a.label}.`}); }
    }
    dates();
    segStart = a.i + 1;
  }
  dates();

  // resultado de anclas
  const isAsu = r => r.def.name.startsWith('Asunción');
  const covers = (date, f) => rows.find(r => f(r) && r.arr <= date && r.dep >= date && r.state !== 'skip');
  const res = {
    rows, L, issues,
    c21: covers('2026-11-21', isAsu), c8: covers('2026-12-08', isAsu),
    exit: ax >= 0 ? rows[ax].arr : null, want: EXIT[sc], xmas: covers('2026-12-24', () => true),
    adjusted: rows.filter(r => r.state === 'next' && r.inPlan && r.n !== r.plan),
  };
  res.here = L >= 0 && rows[L].state === 'here' ? rows[L] : null;
  res.next = rows.find((r, i) => i > L && r.n >= 0 && r.state === 'next' && r.n + 1 > 0);
  res.nights = rows.reduce((a, r) => a + r.n, 0);
  res.doneNights = rows.filter(r => r.state === 'done' || r.state === 'here').reduce((a, r) => a + Math.min(r.n, Math.max(0, diff(TODAY, r.arr))), 0);
  return res;
}

/* ================================================================ posiciones y tramos */
function rowPos(r){
  if (r.ck && r.ck.lat != null && r.ck.lon != null) return {lat: +r.ck.lat, lon: +r.ck.lon};
  const id = r.ck && r.ck.place_id != null ? r.ck.place_id : r.lodging;
  if (id != null && PL[id]) return {lat: PL[id].lat, lon: PL[id].lon};
  if (r.def.lat != null) return {lat: r.def.lat, lon: r.def.lon};
  const a = r.def.attr && PL[r.def.attr[0]];
  return a ? {lat: a.lat, lon: a.lon} : {lat: -25.3, lon: -57.6};
}
const ck4 = p => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
const LEGS = Object.assign({}, DATA.vlegs || {}, ls.get('pm-legs', {}));
(() => { // tramos precalculados (OSRM) indexados por coordenadas de los hospedajes sugeridos
  Object.entries(DATA.legs).forEach(([k, v]) => {
    const [a, b] = k.split('|'); if (!DEF[a] || !DEF[b]) return;
    const pa = rowPos({def: DEF[a], lodging: DEF[a].lodging}), pb = rowPos({def: DEF[b], lodging: DEF[b].lodging});
    LEGS[ck4(pa) + '>' + ck4(pb)] = v;
  });
})();
const pend = new Set();
function hav(a, b){ const R = 6371, r = Math.PI/180, dl = (b.lat-a.lat)*r, dn = (b.lon-a.lon)*r;
  const x = Math.sin(dl/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
function leg(a, b){ return legP(rowPos(a), rowPos(b)); }
// quiet: solo actualiza los elementos [data-leg] (fichas y tarjetas) sin redibujar la página
function legP(pa, pb, quiet){
  const k = ck4(pa) + '>' + ck4(pb);
  if (k.split('>')[0] === k.split('>')[1]) return {km: 0, min: 0, geo: null};
  if (LEGS[k]) return LEGS[k];
  if (!pend.has(k)) {
    pend.add(k);
    fetch(`https://router.project-osrm.org/route/v1/driving/${pa.lon},${pa.lat};${pb.lon},${pb.lat}?overview=${quiet ? 'false' : 'simplified&geometries=geojson'}`)
      .then(r => r.json()).then(j => {
        const rt = j.routes[0];
        LEGS[k] = quiet ? {km: Math.round(rt.distance/100)/10, min: Math.round(rt.duration/60)}
          : {km: Math.round(rt.distance/1000), min: Math.round(rt.duration/60), geo: rt.geometry.coordinates.map(c => [+c[1].toFixed(4), +c[0].toFixed(4)])};
        const extra = ls.get('pm-legs', {}); extra[k] = LEGS[k]; ls.set('pm-legs', extra);
        if (quiet) document.querySelectorAll(`[data-leg="${k}"]`).forEach(e => e.innerHTML = legTxt(LEGS[k])); else render();
      }).catch(() => {});
  }
  const km = Math.round(hav(pa, pb) * 1.3 * 10) / 10;
  return {km: quiet ? km : Math.round(km), min: Math.round(km / (km < 15 ? 35 : 65) * 60), approx: true};
}
const legTxt = lg => `${lg.approx ? '≈ ' : ''}${lg.km < 10 ? String(lg.km).replace('.', ',') : Math.round(lg.km)} km · ${hm(lg.min)}`;
// punto de partida para visitar: hospedaje elegido (o el del check-in) de la parada
function basePos(stopKey){
  const r = T.rows.find(x => x.key === stopKey), def = DEF[stopKey] || r?.def;
  if (!def) return null;
  const pos = r ? rowPos(r) : rowPos({def, lodging: def.lodging});
  const id = r ? (r.ck ? r.ck.place_id : r.lodging) : def.lodging;
  return {pos, name: r?.ck?.place_name || PL[id]?.name || def.name};
}

/* ================================================================ horarios (pet shops) */
// hours: 7 elementos lunes..domingo, cada uno con tramos "HH:MM-HH:MM" ([] cerrado, null sin dato)
const brandTxt = q => q.brands?.length ? q.brands.join(', ') : 'Marca premium sin confirmar';
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const hhmm = t => t.replace(/^0(\d)/, '$1');
const dayTxt = d => d == null ? 'sin dato' : !d.length ? 'cerrado' : d[0] === '00:00-24:00' ? '24 h' : d.map(t => t.split('-').map(hhmm).join('–')).join(' y ');
function hoursTxt(h){
  if (!h) return '';
  const g = [];
  h.forEach((d, i) => { const t = dayTxt(d); if (g.length && g[g.length-1].t === t) g[g.length-1].b = i; else g.push({a: i, b: i, t}); });
  return g.map(x => `${DIAS[x.a]}${x.b > x.a ? (x.b > x.a + 1 ? '–' : ', ') + DIAS[x.b] : ''} ${x.t}`).join(' · ');
}
// hora local de Paraguay (UTC−3 todo el año); Posadas usa la misma hora
function openNow(h){
  if (!h) return null;
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone: 'America/Asuncion', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(new Date()).map(x => [x.type, x.value]));
  const i = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday), now = p.hour + ':' + p.minute, d = h[i];
  if (d == null) return null;
  const on = d.find(t => { const [a, b] = t.split('-'); return now >= a && now < b; });
  if (on) return {open: true, txt: on === '00:00-24:00' ? 'Abierto 24 h' : 'Abierto · cierra ' + hhmm(on.split('-')[1])};
  const nx = d.find(t => t.split('-')[0] > now);
  if (nx) return {open: false, txt: 'Cerrado · abre a las ' + hhmm(nx.split('-')[0])};
  for (let j = 1; j < 7; j++) {   // próximo día con horario
    const dj = h[(i + j) % 7];
    if (dj?.length) return {open: false, txt: `Cerrado · abre ${j === 1 ? 'mañana' : 'el ' + DIAS[(i + j) % 7].toLowerCase()} a las ${hhmm(dj[0].split('-')[0])}`};
  }
  return {open: false, txt: 'Cerrado'};
}

/* ================================================================ etiquetas de sitios */
const CAT = {campsite:'Camping', informal_campsite:'Pernocte informal', wild_campsite:'Camping libre', hostel:'Hostal', hotel:'Hotel',
  shorterm_parking:'Estacionamiento', tourist_attraction:'Atracción', vehicle_storage:'Guardería de vehículos', laundry:'Lavandería'};
const AM = {
  showers:{showers_hot:['Ducha caliente','ok'],showers_warm:['Ducha tibia','ok'],showers_cold:['Ducha fría','warn'],showers_yes:['Duchas','ok'],showers_no:['Sin duchas','bad'],showers_bucket:['Ducha de balde','warn']},
  restroom:{restroom_running_water:['Baño con agua','ok'],restroom_yes:['Baño','ok'],restroom_pit_toilets:['Letrina','warn'],restroom_no:['Sin baño','bad']},
  big_rig_friendly:{big_rig_yes:['Apto 6–8 m','ok'],big_rig_no:['No apto grandes','bad']},
  electricity:{electricity_yes:['Electricidad',''],electricity_at_sites:['Electricidad',''],electricity_not_at_sites:['Electricidad lejos','']},
  laundry:{laundry_paid:['Lavarropas (pago)',''],laundry_free:['Lavarropas gratis','ok']},
  water:{water_potable:['Agua potable',''],water_nonpotable:['Agua no potable','']},
  wifi:{wifi_fast:['Wi-Fi rápido',''],wifi_average:['Wi-Fi',''],wifi_slow:['Wi-Fi lento','']},
  sanitation_dump:{sanitation_yes:['Vaciado sanitario','']}, pet_friendly:{pets_yes:['Mascotas OK',''],pets_no:['Sin mascotas','']},
};
function tags(p, keys){
  return (keys || Object.keys(AM)).map(k => { const v = AM[k][p.amen?.[k]]; return v ? `<span class="tag ${v[1]}">${v[0]}</span>` : ''; }).join('');
}
function access(p){
  if (p.cur) return {ok:['ok','Acceso fácil'], warn:['warn','Precaución'], bad:['bad','Evitar sin 4x4']}[p.cur.access];
  if (p.ext) return ['ok','Asfalto urbano'];
  return (p.road || []).some(r => /4x4|barro|embarr|arena|atasc|inund|mud|sand/i.test(r.text)) ? ['warn','Revisar acceso'] : ['ok','Sin reportes 4x4'];
}
const costTxt = p => p.cur?.cost || (p.cost ? p.cost.text + (p.cost.date ? ` (${p.cost.date})` : '') : 'Sin dato');
// precio en un texto: 75.000 Gs · 90,000 guaraníes · 80’000 PYG · 10000 Gs · 140 mil · R$70 · $13 USD (descarta teléfonos y horas)
const CUR = String.raw`₲|G\$|Gs\.?|G(?=\b|\/)|PYG|guaran[ií]\w*|R\$|reais|reales|US\$|U\$S|USD|d[oó]lares|\$`;
const NUM = String.raw`\d{1,3}(?:[.,\s’']\d{3})+(?![.,’']?\d)|\d{1,6}`;
const PRE = new RegExp(String.raw`(?<![\d+]|\d[.\s-])(${CUR})\s?(${NUM})\s*(k|mil)?\b\s*(${CUR})?`, 'gi');
const SUF = new RegExp(String.raw`(?<![\d+]|\d[.,\s’'-]|[\d.,]\d)(${NUM})\s*(k|mil)?\s*(${CUR})?`, 'gi');
const PER = [['por hora', /\b(?:por|per|la|\/)\s?(?:hora|hour|h)\b/i], ['por persona', /\b(?:por|per|\/)\s?(?:persona|person|pax|cabeza)|\bpp\b|cada uno|each/i],
  ['para dos', /\b(?:para|por|for)\s(?:dos|2|two)\b|\b(?:2|dos)\s(?:personas|people|pers)/i], ['por vehículo', /\b(?:por|per|\/)\s?(?:veh[ií]culo|vehicle|auto|carro|camper|motorhome|van|furgo\w*|casa rodante)/i],
  ['por noche', /\b(?:por|per|\/|a)\s?(?:noche|night|nuit)/i], ['por día', /\b(?:por|per|\/)\s?(?:d[ií]a|day)\b|diari[ao]/i]];
function priceIn(t){
  const hits = [];
  for (const re of [PRE, SUF]) { re.lastIndex = 0; let m;
    while ((m = re.exec(t))) {
      const pre = re === PRE, cur0 = pre ? m[1] : m[3], num = pre ? m[2] : m[1], k = pre ? m[3] : m[2], cur1 = pre ? m[4] : '';
      const cur = cur0 || cur1 || '';
      let v = +num.replace(/[^\d]/g, ''); if (k) v *= 1000;
      const after = t.slice(m.index + m[0].length, m.index + m[0].length + 40);
      if (/^\s*(?:m\b|km|kg|metros|habitantes|a[ñn]os|h\b|hs\b|min|%|:)/i.test(after) || /^\d{1,2}:\d{2}/.test(num)) continue;
      let c = /R\$|reais|reales/i.test(cur) ? 'R$' : /US|USD|d[oó]lar/i.test(cur) ? 'USD' : cur === '$' ? (v >= 1000 ? 'Gs' : 'USD') : cur ? 'Gs' : (v >= 1000 && (k || /[.,\s’']/.test(num)) ? 'Gs' : '');
      if (!c || (c === 'Gs' && v < 1000) || v > 2e6 || (c !== 'Gs' && v > 2000)) continue;
      const near = PER.map(([l, r]) => { const x = after.search(r); return [x < 0 ? 99 : x, l]; }).sort((a, b) => a[0] - b[0])[0];
      hits.push({i: m.index, amt: `${v.toLocaleString('es-PY')} ${c}`, per: near[0] < 30 ? near[1] : 'por noche'});
    }
  }
  return hits.sort((a, b) => a.i - b.i)[0] || null;
}
// precio para el listado: costo curado o del último comentario con monto; si no hay monto, fragmentos de comentarios
function priceOf(p){
  const t = costTxt(p);
  if (/^gratis/i.test(t)) return {amt: 'Gratis', per: '', text: t};
  let h = priceIn(t);
  if (h) return Object.assign(h, {text: t});
  for (const c of [...(p.pc || []), ...(p.comments || [])]) { h = priceIn(c.text); if (h) return Object.assign(h, {text: c.text, date: c.date, fromComment: true}); }
  if (p.desc && (h = priceIn(p.desc))) return Object.assign(h, {text: p.desc, fromComment: true, date: 'descripción'});
  if (/\b(?:gratis|gratuit\w*|free|no tuvimos que pagar|sin cargo|sin costo)\b/i.test(t)) return {amt: 'Gratis', per: '', text: t};
  if (/^pago/i.test(t)) return {amt: 'Pago', per: 'sin monto', text: t};
  if (/econ[oó]mico/i.test(t)) return {amt: 'Económico', per: 'sin monto', text: t};
  return {amt: '—', per: 'sin dato', text: t};
}
const shortCost = p => { const x = priceOf(p); return [x.amt, x.per]; };
const iov = p => p && p.guid ? `https://ioverlander.com/places/${p.guid}` : null;
const SLEEP = new Set(['campsite', 'informal_campsite', 'wild_campsite', 'hostel', 'hotel', 'vehicle_storage']);
// opciones para dormir: recomendada, alternativas y, después, los pernoctes que figuran como estacionamiento
function sleepOpts(def){
  const main = [...new Set([def.lodging, ...def.alts])].filter(x => x != null && PL[x]);
  const more = [...new Set(def.park)].filter(x => PL[x] && SLEEP.has(PL[x].cat) && !main.includes(x));
  return {main, more, all: main.concat(more)};
}
const stars = n => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));
const money = (a, c) => a == null || a === '' ? '' : `${Number(a).toLocaleString('es-PY')} ${c || 'PYG'}`;

/* ================================================================ router */
const ROUTES = {'': 'home', 'mapa': 'map', 'plan': 'plan', 'navidad': 'xmas', 'creditos': 'credits'};
let route = {page: 'home'};
function parseHash(){
  const h = location.hash.replace(/^#\/?/, '');
  if (h.startsWith('p/')) return {page: 'stop', key: decodeURIComponent(h.slice(2))};
  return {page: ROUTES[h] || 'home'};
}
function go(){
  const prev = route.page;
  route = parseHash();
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.id === 'pg-' + route.page));
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === route.page));
  document.body.classList.toggle('stop-open', route.page === 'stop');
  closeSheet();
  render();
  if (route.page === 'map') { initMap(); setTimeout(() => { map.invalidateSize(); if (prev !== 'map' && !mapFitted) fitAll(); }, 60); }
  if (route.page === 'stop') $('#pg-stop').scrollTop = 0;
}

/* ================================================================ render */
let T;
function render(){
  T = timeline();
  if (route.page === 'home') renderHome();
  if (route.page === 'plan') renderPlan();
  if (route.page === 'xmas') renderXmas();
  if (route.page === 'credits') renderCredits();
  if (route.page === 'stop') renderStop(route.key);
  if (map) renderMap();
  renderWho();
  hydrateIcons();
  enhanceScrollers();
}
function renderWho(){
  document.querySelectorAll('[data-who]').forEach(e => {
    const n = S.me.name || 'Invitado';
    e.innerHTML = `<span class="dot">${esc(n.slice(0,1).toUpperCase())}</span>${esc(n)}<span class="live ${S.online || !S.remote ? 'on' : ''}" title="${S.remote ? (S.online ? 'Sincronizado' : 'Sin conexión') : 'Modo local'}"></span>`;
  });
}
const topbar = () => `<div class="topbar"><a class="logo" href="#/"><img src="assets/img/logo.svg" alt="">Ruta Paraguay</a><button class="who" data-who data-act="me"></button></div>`;

function pillsHTML(){
  const P = [];
  P.push(T.c21 ? ['ok', '✓ Asunción 21 nov'] : ['bad', '✗ Asunción 21 nov']);
  P.push(T.c8 ? ['ok', '✓ Asunción 8 dic'] : ['bad', '✗ Asunción 8 dic']);
  if (!T.exit) P.push(['bad', '✗ Sin paso a Argentina']);
  else P.push(T.exit === T.want ? ['ok', `✓ Salida ${fmtS(T.exit)}`] : ['warn', `⚠ Salida ${fmtS(T.exit)} (plan ${fmtS(T.want)})`]);
  P.push(T.xmas ? ['', `🎄 ${esc(T.xmas.def.name.split(' ·')[0].split(' (')[0])}`] : ['warn', '🎄 Sin parada el 24']);
  return `<div class="pills">${P.map(([k, t]) => `<a class="pill ${k}" href="#/plan">${t}</a>`).join('')}</div>`;
}
function alertsHTML(){
  const A = [];
  if (!S.remote) A.push(['info', 'info', 'Modo local: los check-ins quedan solo en este teléfono. Configura Supabase (README) para compartirlos.']);
  else if (!S.online) A.push(['warn', 'sync', 'Sin conexión con la base compartida. Se muestran los últimos datos guardados.']);
  if (T.adjusted.length) A.push(['warn', 'sync', `Reajuste automático: ${T.adjusted.map(r => `${esc(r.def.name.split(' ·')[0].split(' (')[0])} ${r.plan}→${r.n}`).join(' · ')} noches.`]);
  T.issues.forEach(i => A.push([i.lvl, 'alert', esc(i.t)]));
  return A.length ? `<div class="alerts">${A.map(([k, ic, t]) => `<div class="alert ${k}">${icon(ic)}<div>${t}</div></div>`).join('')}</div>` : '';
}
function nowCard(){
  const r0 = T.rows[0];
  if (T.here) {
    const r = T.here, nx = T.rows[T.rows.indexOf(r) + 1];
    const lg = nx ? leg(r, nx) : null;
    return `<div class="now"><a class="now-top" href="#/p/${encodeURIComponent(r.key)}"><img src="${thumb(r.key)}" alt="">
      <div><div class="now-k">Aquí estamos</div><div class="now-t">${esc(r.def.name)}</div>
      <div class="now-m">Desde ${fmt(r.arr)} · salida prevista ${fmt(r.dep)}${r.ck.place_name ? ' · ' + esc(r.ck.place_name) : ''}</div></div></a>
      <div class="now-act"><button class="btn-pink" data-act="checkout" data-id="${r.ck.id}">${icon('check')}Registrar salida</button><a class="btn-line" href="#/p/${encodeURIComponent(r.key)}">Ver parada</a></div>
      ${nx ? `<a class="now-next" href="#/p/${encodeURIComponent(nx.key)}">${icon('van')}<span>Siguiente: <b>${esc(nx.def.name)}</b> · ${lg.approx ? '≈' : ''}${lg.km} km · ${hm(lg.min)}</span></a>` : ''}</div>`;
  }
  const nx = T.rows.find((r, i) => i > T.L && r.state === 'next' && r.n >= 0) || r0;
  const started = T.L >= 0;
  return `<div class="now"><a class="now-top" href="#/p/${encodeURIComponent(nx.key)}"><img src="${thumb(nx.key)}" alt="">
    <div><div class="now-k">${started ? 'En camino a' : 'Primera parada'}</div><div class="now-t">${esc(nx.def.name)}</div>
    <div class="now-m">Llegada ${started ? 'prevista' : ''} ${fmt(nx.arr)} · ${noches(nx.n)}</div></div></a>
    <div class="now-act"><button class="btn-pink" data-act="checkin" data-key="${esc(nx.key)}">${icon('pin')}Check-in en ${esc(nx.def.name.split(' ·')[0].split(' (')[0])}</button></div></div>`;
}
function statsHTML(){
  const km = T.rows.reduce((a, r, i) => i ? a + leg(T.rows[i-1], r).km : a, 0);
  const kmDone = T.rows.reduce((a, r, i) => i && i <= T.L ? a + leg(T.rows[i-1], r).km : a, 0);
  const nStops = T.rows.filter(r => r.n > 0 || r.ck).length;
  const nCk = S.checkins.filter(c => !c.deleted).length;
  const camps = new Set(T.rows.filter(r => r.lodging != null).map(r => r.lodging)).size;
  const st = (c, ic, num, lbl) => `<div class="stat"><div class="ring" style="background:var(--${c}-l)"><span style="background:var(--${c})">${icon(ic)}</span></div><b style="color:var(--${c})">${num}</b><small>${lbl}</small></div>`;
  return `<div class="stats">
    ${st('s1', 'moon', T.nights, `Noches de viaje<br><i style="color:var(--s1)">${T.doneNights}</i> ya vividas`)}
    ${st('s2', 'van', km.toLocaleString('es-PY'), `Kilómetros por carretera<br><i style="color:var(--s2)">${kmDone.toLocaleString('es-PY')}</i> recorridos`)}
    ${st('s3', 'pin', nStops, `Paradas<br><i style="color:var(--s3)">${camps}</i> campings elegidos`)}
    ${st('s4', 'check', nCk, `Check-ins<br>registrados por el grupo`)}
  </div>`;
}
const FEATURED = ['trini', 'hern', 'asu1', 'fila', 'cora', 'enc', 'posadas', 'cord'];
function renderHome(){
  const first = T.rows[0], last = T.rows[T.rows.length - 1];
  const feat = FEATURED.map(k => T.rows.find(r => r.key === k)).filter(Boolean);
  const stack = (T.here ? [T.here.key] : []).concat(['hern', 'trini', 'asu1']).slice(0, 3);
  const others = Object.values(DEF).filter(d => !S.plan.stops.some(s => s.key === d.key));
  $('#pg-home').innerHTML = `${topbar()}
  <div class="wrap">
    <div class="hero"><div style="display:grid;gap:20px">
      <h1>Recorre <em>Paraguay</em> en motorhome</h1>
      <p class="sub">${fmt(first.arr)} en ${esc(first.def.name)} → Navidad en ${esc(last.def.name.split(' ·')[0].split(' (')[0])}. Campings con ducha, caminos sin 4x4.</p>
      <div class="routebar"><span class="pt">${esc(first.def.name.split(' ·')[0])}</span><span class="ar">⇆</span><span class="pt">${esc(last.def.name.split(' ·')[0].split(' (')[0])}</span><span class="ar">→</span><a class="add" href="#/plan">Añadir parada</a>
        <a class="btn-pink go" href="#/mapa">${icon('map')}Ver ruta</a></div>
      <div class="check">${icon('check')}Plan sincronizado con los check-ins del grupo${S.lastSync ? ' · ' + S.lastSync.toLocaleTimeString('es-PY', {hour:'2-digit', minute:'2-digit'}) : ''}</div>
    </div>
    <div class="stack">${stack.map(k => `<a href="#/p/${k}"><img src="${photo(k)}" alt="" loading="lazy"><span class="cap">${esc(DEF[k].name.split(' ·')[0].split(' (')[0])}</span></a>`).join('')}</div></div>

    <div class="sec">${nowCard()}${alertsHTML()}<div style="margin-top:12px">${pillsHTML()}</div></div>

    <div class="sec"><h2 class="center-h">Cómo va el viaje</h2>
      <p class="lead">Cada check-in mueve las fechas que siguen. Si un atraso pone en riesgo Asunción o la salida, el plan recorta o suma noches solo.</p>
      ${statsHTML()}</div>

    <div class="sec"><h2 class="sec-h">${icon('star')}Paradas destacadas</h2>
      <div class="mosaic">${feat.map((r, i) => `<a href="#/p/${r.key}" class="${i === 0 ? 'big' : ''}"><img src="${i === 0 ? photo(r.key) : thumb(r.key)}" alt="" loading="lazy"><span class="lbl">${esc(r.def.name)}<small>${fmtS(r.arr)} – ${fmtS(r.dep)}</small></span></a>`).join('')}</div></div>

    <div class="sec"><h2 class="sec-h">Itinerario</h2>${itineraryHTML(false)}</div>

    <div class="sec"><h2 class="sec-h">Otras paradas posibles</h2>
      <div class="chips">${others.map(d => `<a class="chip" href="#/p/${d.key}">${esc(d.name)}</a>`).join('') || '<span class="muted">Todas las paradas están en el plan.</span>'}</div></div>
  </div>
  ${footerHTML()}`;
}
function itineraryHTML(editing){
  let h = '<div class="opts">', seg = '';
  T.rows.forEach((r, i) => {
    if (r.def.seg !== seg) { seg = r.def.seg; h += `</div><div class="seg-h"><i style="background:${SEGC[seg] || '#999'}"></i>${SEGN[seg] || ''}</div><div class="opts">`; }
    if (i) { const lg = leg(T.rows[i-1], r); if (lg.km) h += `<div class="leg ${lg.min > 300 ? 'long' : ''}">${icon('van')} ${lg.approx ? '≈ ' : ''}${lg.km} km · ${hm(lg.min)}${lg.min > 300 ? ' · día largo' : ''}</div>`; }
    const p = r.ck?.place_id != null ? PL[r.ck.place_id] : (r.lodging != null ? PL[r.lodging] : null);
    const pc = r.ck?.cost_amount != null ? [money(r.ck.cost_amount, r.ck.cost_currency), 'pagado'] : (p ? shortCost(p) : ['', '']);
    const badge = r.state === 'here' ? '<span class="badge pink">Aquí estamos</span>' : r.state === 'done' ? '<span class="badge">Hecho</span>' :
      r.state === 'skip' ? '<span class="badge grey">Omitida</span>' : (r.inPlan && r.n !== r.plan ? `<span class="badge warn">Ajustado ${r.plan}→${r.n}</span>` : '') + (r.def.anchor ? `<span class="badge grey">Fija ${fmtS(r.def.anchor)}</span>` : '');
    h += `<a class="opt ${r.state === 'here' ? 'sel' : ''} ${r.state === 'done' ? 'done' : ''} ${r.state === 'skip' ? 'skip' : ''}" href="#/p/${encodeURIComponent(r.key)}">
      <img class="th" src="${thumb(r.def.custom ? '' : r.key)}" alt="" loading="lazy">
      <div class="opt-b"><div class="opt-t">${i + 1}. ${esc(r.def.name)} ${badge}</div>
        <div class="opt-m">${icon('moon')}${noches(r.n)}<span class="sep">|</span>${icon('camp')}${esc(r.ck?.place_name || p?.name || 'Sin hospedaje')}</div>
        <div class="opt-d">${fmt(r.arr)} → ${fmt(r.dep)}${r.ck?.rating ? ' · ' + stars(r.ck.rating) : ''}</div></div>
      <div class="opt-r"><span class="price">${esc(pc[0])}<small>${esc(pc[1])}</small></span>${icon('chev', 'chev')}</div></a>`;
    if (editing && r.inPlan && r.state === 'next') {
      const pi = S.plan.stops.findIndex(s => s.key === r.key);
      h += `<div class="edit-row"><span class="stepper"><button data-act="nights" data-i="${pi}" data-d="-1">−</button><span>${noches(S.plan.stops[pi].nights)}</span><button data-act="nights" data-i="${pi}" data-d="1">+</button></span>
        <button class="btn-line sm" data-act="move" data-i="${pi}" data-d="-1" ${pi === 0 ? 'disabled' : ''}>↑</button><button class="btn-line sm" data-act="move" data-i="${pi}" data-d="1" ${pi === S.plan.stops.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="btn-line sm danger" data-act="remove" data-i="${pi}">Quitar</button></div>`;
    }
  });
  return h + '</div>';
}
function renderPlan(){
  $('#pg-plan').innerHTML = `${topbar()}<div class="wrap">
    <h1 class="ps-t" style="font-size:34px;margin:10px 0 6px">Plan de viaje</h1>
    <p class="muted" style="margin:0 0 14px">${T.rows.length} paradas · ${T.nights} noches · ${fmt(T.rows[0].arr)} → ${fmt(T.rows[T.rows.length-1].dep)}</p>
    <div class="card" style="display:grid;gap:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>Salida de Paraguay</b>
        <div class="segc">${['19','12'].map(s => `<button class="${S.plan.scenario === s ? 'on' : ''}" data-act="scenario" data-s="${s}">${s} dic</button>`).join('')}</div></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>Inicio en CDE</b><input type="date" class="btn-line sm" id="start" value="${S.plan.start}"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn-line sm" data-act="edit">${icon('edit')}${S.editing ? 'Terminar edición' : 'Editar noches y orden'}</button>
        <button class="btn-line sm" data-act="reset">Restaurar sugerido</button>
        <button class="btn-line sm" data-act="export">Exportar</button></div>
      ${S.planBy ? `<div class="small muted">Última edición compartida: ${esc(S.planBy)}</div>` : ''}
    </div>
    ${alertsHTML()}<div style="margin:12px 0 4px">${pillsHTML()}</div>
    ${itineraryHTML(S.editing)}
    <div class="sec"><h2 class="sec-h">Agregar parada</h2><div class="chips">${Object.values(DEF).filter(d => !S.plan.stops.some(s => s.key === d.key)).map(d => `<a class="chip" href="#/p/${d.key}">${esc(d.name)}</a>`).join('') || '<span class="muted">Todas están en el plan.</span>'}</div></div>
  </div>${footerHTML()}`;
}

/* ---------------------------------------------------------------- página de parada */
let mini;
function renderStop(key){
  const def = DEF[key] || (S.checkins.find(c => c.stop_key === key) && customDef(S.checkins.find(c => c.stop_key === key)));
  if (!def) { location.hash = '#/'; return; }
  const idx = T.rows.findIndex(r => r.key === key), r = T.rows[idx], prev = idx > 0 ? T.rows[idx-1] : null;
  const inPlan = S.plan.stops.findIndex(s => s.key === key);
  const lg = r && prev ? leg(prev, r) : null;
  const ph = def.custom ? [PLACEHOLDER] : photos(key);
  const so = sleepOpts(def), lods = so.all;
  const chosen = r ? (r.ck?.place_id ?? r.lodging) : def.lodging;
  const visits = S.checkins.filter(c => c.stop_key === key && !c.deleted).sort((a, b) => a.arrived < b.arrived ? 1 : -1);
  const label = def.name.split(' ·')[0].split(' (')[0];

  let h = `<div class="ps-hero"><div class="ps-gal" id="gal">${ph.map(p => `<img src="${p}" alt="" loading="lazy">`).join('')}</div>
    <button class="round l" data-act="back" aria-label="Volver">${icon('back')}</button>
    <button class="round r" data-act="checkin" data-key="${esc(key)}" aria-label="Check-in">${icon('pin')}</button>
    ${ph.length > 1 ? `<div class="ps-dots">${ph.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
    <div class="ps-mini"><div class="mm" id="mini"></div><span>${esc(label)}</span></div></div>
  <div class="ps-sheet"><div class="grab"></div>
    <h1 class="ps-t">${esc(def.name)}</h1><div class="ps-r">${esc(def.region)}${def.argentina ? ' · Argentina' : ' · Paraguay'}</div>
    ${lg ? `<div class="ps-leg">${icon('trend')}${lg.approx ? '≈ ' : ''}${lg.km} km desde ${esc(prev.def.name.split(' ·')[0].split(' (')[0])} · ${hm(lg.min)} de manejo</div>` : ''}
    ${r ? `<div class="ps-dates">${icon('cal')}${fmt(r.arr)} → ${fmt(r.dep)} · ${noches(r.n)}
      ${r.state === 'here' ? '<span class="badge pink">Aquí estamos</span>' : r.state === 'done' ? '<span class="badge">Hecho</span>' : r.state === 'skip' ? '<span class="badge grey">Omitida</span>' : r.inPlan && r.n !== r.plan ? `<span class="badge warn">Ajustado ${r.plan}→${r.n}</span>` : ''}</div>`
      : `<div class="ps-dates"><span class="badge grey">Fuera del plan</span></div>`}
    <p class="ps-why">${esc(def.why)}</p>`;

  visits.forEach(c => {
    h += `<div class="ck"><div class="ck-h"><b>${icon('check')} Check-in de ${esc(c.author || 'alguien')}</b><span class="stars">${c.rating ? stars(c.rating) : ''}</span></div>
      <p>${fmt(c.arrived)} → ${c.departed ? fmt(c.departed) : '<b>sin salida registrada</b>'} · ${esc(c.place_name || PL[c.place_id]?.name || '')}</p>
      ${c.cost_amount != null ? `<p>💲 Pagamos <b>${money(c.cost_amount, c.cost_currency)}</b> por noche</p>` : ''}
      ${c.comment ? `<p>“${esc(c.comment)}”</p>` : ''}
      <div class="act">${!c.departed ? `<button class="btn-pink" style="min-height:38px;padding:8px 16px;font-size:14px" data-act="checkout" data-id="${c.id}">Registrar salida</button>` : ''}
        <button class="btn-line sm" data-act="editck" data-id="${c.id}">${icon('edit')}Editar</button>
        <button class="btn-line sm danger" data-act="delck" data-id="${c.id}">${icon('trash')}Eliminar</button></div></div>`;
  });

  if (lods.length) {
    h += `<div class="ps-h">${lods.length} opciones para dormir en <em>${esc(label)}</em> ${icon('down')}</div><div class="opts">`;
    lods.forEach(id => {
      if (id === so.more[0]) h += `<div class="opts-sep">También para pasar la noche</div>`;
      const p = PL[id], ac = access(p), pc = shortCost(p);
      h += `<div class="opt ${id == chosen ? 'sel' : ''}" data-act="place" data-id="${id}" data-key="${esc(key)}">
        <div class="opt-b"><div class="opt-t">${esc(p.name)} ${id == def.lodging ? '<span class="badge">Recomendado</span>' : ''}${id == chosen ? '<span class="badge pink">Elegido</span>' : ''}</div>
          <div class="opt-m">${icon('shower')}${esc((AM.showers[p.amen?.showers] || ['Duchas ?'])[0])}<span class="sep">|</span><span class="tag ${ac[0]}" style="padding:2px 7px">${ac[1]}</span></div>
          <div class="opt-d">${so.more.includes(id) ? `<span class="badge grey">${esc(CAT[p.cat] || '')}</span> ` : esc(CAT[p.cat] || '')}${p.n ? ` · ${p.n} check-ins iOverlander` : ''}${p.last ? ' · último ' + p.last : ''}</div></div>
        <div class="opt-r"><span class="price">${esc(pc[0])}<small>${esc(pc[1])}</small></span>${icon('chev', 'chev')}</div></div>`;
    });
    h += '</div>';
  }
  if (def.attr.length) {
    const base = basePos(key);
    h += `<div class="ps-h">Qué visitar</div><div class="small muted" style="margin:-6px 0 10px">Distancia en auto desde ${esc(base.name)}</div><div class="hs">${def.attr.filter(id => PL[id]).map(id => {
      const q = PL[id], k = ck4(base.pos) + '>' + ck4(q);
      return `<div class="hcard" data-act="place" data-id="${id}" data-key="${esc(key)}"><img src="${attrPhoto(id, key)}" alt="" loading="lazy"><div>${esc(q.name)}<small data-leg="${k}">${legTxt(legP(base.pos, q, true))}</small></div></div>`; }).join('')}</div>`;
  }
  const rowsH = [];
  if (def.uber) rowsH.push(`<div class="row">${icon('car')}<div class="rb">Uber / Bolt<small>${esc(def.uber)}</small></div></div>`);
  def.park.filter(id => PL[id] && !so.more.includes(id)).forEach(id => rowsH.push(`<div class="row" data-act="place" data-id="${id}">${icon('park')}<div class="rb">${esc(PL[id].name)}<small>Estacionar para visitar · ${esc(CAT[PL[id].cat] || '')}</small></div>${icon('chev', 'chev')}</div>`));
  def.onsite.forEach(o => rowsH.push(`<div class="row">${icon('wash')}<div class="rb">${esc(o[0])}<small>${esc(PL[o[1]]?.name || '')}</small></div></div>`));
  const bp = basePos(key);
  def.laundry.forEach(l => rowsH.push(`<a class="row" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1${bp ? `&origin=${bp.pos.lat},${bp.pos.lon}` : ''}&destination=${l.lat},${l.lon}">${icon('wash')}<div class="rb">${esc(l.name)}<small>Lavandería · ${esc(l.src)}${l.note ? ' · ' + esc(l.note.slice(0, 90)) : ''}</small></div>${bp ? `<span class="k" data-leg="${ck4(bp.pos)}>${ck4(l)}">${legTxt(legP(bp.pos, l, true))}</span>` : ''}</a>`));
  if (!def.custom) { const p = r ? rowPos(r) : rowPos({def, lodging: def.lodging});
    rowsH.push(`<a class="row" target="_blank" rel="noopener" href="https://www.google.com/maps/search/lavanderia/@${p.lat},${p.lon},14z">${icon('wash')}<div class="rb">Buscar más lavanderías<small>Google Maps alrededor del hospedaje</small></div>${icon('chev', 'chev')}</a>`); }
  if (rowsH.length) h += `<div class="ps-h">Servicios cerca</div><div class="rows">${rowsH.join('')}</div>`;
  if (def.pets?.length && bp) {
    h += `<div class="ps-h">Pet shops · comida premium para gatos</div><div class="small muted" style="margin:-6px 0 10px">Distancia en auto desde ${esc(bp.name)}</div><div class="rows">${def.pets.map((q, i) => [q, i, legP(bp.pos, q, true)]).sort((x, y) => x[2].km - y[2].km).map(([q, i, lg]) => {   // más cercano primero desde el sitio elegido
      const on = openNow(q.hours);
      return `<div class="row" data-act="pet" data-key="${esc(key)}" data-i="${i}">${icon('paw')}<div class="rb">${esc(q.name)}<small>${on ? `<b class="${on.open ? 'ok' : 'bad'}">${on.txt}</b> · ` : ''}${esc(brandTxt(q))}</small><small>🕘 ${esc(hoursTxt(q.hours))}</small><small data-leg="${ck4(bp.pos)}>${ck4(q)}">${legTxt(lg)}</small></div>${icon('chev', 'chev')}</div>`; }).join('')}</div>`;
  }

  if (inPlan >= 0 && r && r.state === 'next') {
    h += `<div class="ps-h">Ajustar el plan</div><div class="planbox">
      <span class="stepper"><button data-act="nights" data-i="${inPlan}" data-d="-1">−</button><span>${noches(S.plan.stops[inPlan].nights)}</span><button data-act="nights" data-i="${inPlan}" data-d="1">+</button></span>
      <button class="btn-line sm" data-act="move" data-i="${inPlan}" data-d="-1">Antes ↑</button><button class="btn-line sm" data-act="move" data-i="${inPlan}" data-d="1">Después ↓</button>
      <button class="btn-line sm danger" data-act="remove" data-i="${inPlan}">Quitar del plan</button>
      <div class="small muted" style="width:100%">Noches planificadas por el grupo. El reajuste automático puede mostrar otro número si hace falta para cumplir las fechas fijas.</div></div>`;
  } else if (inPlan < 0 && !def.custom) {
    h += `<div class="ps-h">Agregar al plan</div><div class="planbox"><select class="btn-line sm" id="addpos">${S.plan.stops.map((s, i) => `<option value="${i+1}">después de ${esc(DEF[s.key].name.split(' ·')[0])}</option>`).join('')}</select>
      <button class="btn-pink" style="min-height:40px;padding:8px 18px" data-act="add" data-key="${esc(key)}">${icon('plus')}Agregar</button></div>`;
  }
  h += `<div class="small muted" style="margin:26px 0 10px">Fotos: Wikimedia Commons (ver <a href="#/creditos" style="text-decoration:underline">créditos</a>). Datos de sitios: iOverlander.</div></div>
    <div class="ps-cta on"><button class="btn-pink block" data-act="checkin" data-key="${esc(key)}">${icon('pin')}Hacer check-in aquí</button></div>`;
  $('#pg-stop').innerHTML = h;
  hydrateIcons($('#pg-stop'));

  const gal = $('#gal');
  bindDots(gal, $('#pg-stop .ps-dots'));
  if (window.L) {
    if (mini) { mini.remove(); mini = null; }
    const p = r ? rowPos(r) : rowPos({def, lodging: def.lodging});
    mini = L.map('mini', {zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false}).setView([p.lat, p.lon], 6);
    L.tileLayer(TILE, {maxZoom: 18}).addTo(mini);
    L.circleMarker([p.lat, p.lon], {radius: 6, color: '#fff', weight: 2, fillColor: '#d6246e', fillOpacity: 1}).addTo(mini);
  }
}

/* ---------------------------------------------------------------- Navidad y créditos */
function renderXmas(){
  const pos = T.rows.find(r => r.key === 'posadas');
  $('#pg-xmas').innerHTML = `${topbar()}<div class="wrap">
  <a class="xhero" href="#/p/posadas"><img src="${photo('posadas')}" alt=""><div><span class="badge pink" style="background:#fff">Recomendado</span><b>Navidad en Posadas</b>Costanera, Parque de las Fiestas y fuegos en las dos orillas del Paraná</div></a>
  <div class="card"><p style="margin:0" class="small">${T.xmas ? `En el plan actual el 24-dic están en <b>${esc(T.xmas.def.name)}</b> (${fmt(T.xmas.arr)} → ${fmt(T.xmas.dep)}).` : 'Ninguna parada cubre el 24-dic.'}${pos ? ` Llegada a Posadas: <b>${fmt(pos.arr)}</b>.` : ''}</p></div>
  <div class="opts">
    <div class="opt"><div class="opt-b"><div class="opt-t">Luces y calle <span class="badge">Confirmado 2024–2025</span></div><div class="opt-d" style="color:var(--ink2);font-size:14.5px">Desde el 8‑dic funciona el Parque de las Fiestas (Av. Mitre y Costanera), con un árbol de 20 m, la casa de Papá Noel, un trineo y una calesita, abierto todas las noches. En 2025 el árbol se encendió el 7 y el 8‑dic.</div></div></div>
    <div class="opt"><div class="opt-b"><div class="opt-t">Restaurantes abiertos el 24 <span class="badge warn">Reservar</span></div><div class="opt-d" style="color:var(--ink2);font-size:14.5px">En 2024 la costanera ofreció cenas de Nochebuena de 5 pasos (ARS 75.000 por persona) y una pizzería atendió sin reserva. Reserven a principios de diciembre.</div></div></div>
    <div class="opt"><div class="opt-b"><div class="opt-t">Medianoche</div><div class="opt-d" style="color:var(--ink2);font-size:14.5px">Encarnación recibe la Navidad en su costanera y en la Playa San José, con mesas y fuegos artificiales. Desde Posadas se ven los fuegos de las dos orillas.</div></div></div>
    <div class="opt"><div class="opt-b"><div class="opt-t">Ojo <span class="badge bad">Importante</span></div><div class="opt-d" style="color:var(--ink2);font-size:14.5px">En Argentina la Nochebuena es familiar y el 25 cierra casi todo: hagan las compras el 23. El camping municipal recibe muchos motorhomes, así que lleguen antes del 20‑dic.</div></div></div>
  </div>
  <div class="sec"><h2 class="sec-h">Comparación</h2><div class="card" style="overflow-x:auto"><table class="tbl"><tr><th></th><th>Posadas</th><th>Encarnación</th><th>Pto. Iguazú</th></tr>
  <tr><td>Fiesta en la calle</td><td>Parque de las Fiestas</td><td><b>La mejor</b></td><td>Poca</td></tr>
  <tr><td>Restaurantes el 24</td><td>Sí, con reserva</td><td>Sin datos</td><td>Hoteles (2021)</td></tr>
  <tr><td>Encaja con la salida</td><td><b>Sí</b></td><td>Solo si salen el 26</td><td>300 km atrás</td></tr></table></div>
  <div class="card small">Fuentes: <a href="https://www.canal12misiones.com/?p=441732" target="_blank" rel="noopener">Canal 12 Misiones</a> · <a href="https://misionesonline.net/2024/12/24/misiones-el-parque-de-las-fiestas/" target="_blank" rel="noopener">Misiones Online 2024</a> · <a href="https://misionesonline.net/2025/12/05/encendido-del-arbol-navideno/" target="_blank" rel="noopener">árbol 2025</a> · <a href="https://www.ultimahora.com/encarnacion-multitudinaria-concurrencia-en-la-playa-san-jose-para-celebrar-la-navidad" target="_blank" rel="noopener">Última Hora</a> · <a href="https://misionesonline.net/2025/07/21/motorhomes-camping-municipal-de-posadas/" target="_blank" rel="noopener">camping municipal</a></div></div>
  </div>${footerHTML()}`;
}
function renderCredits(){
  const C = DATA.credits || {};
  $('#pg-credits').innerHTML = `${topbar()}<div class="wrap"><h1 class="ps-t" style="font-size:32px;margin:10px 0 14px">Créditos y fuentes</h1>
  <div class="card small"><b>Datos de sitios:</b> base offline de iOverlander (1.795 lugares de Paraguay, comentarios hasta oct‑2026). Los costos salen del comentario más reciente con precio; en los hospedajes sugeridos se revisaron a mano. Rutas: OSRM / OpenStreetMap. Lavanderías y campings de Posadas: OpenStreetMap. Mapa: Esri. Las fotos de usuarios de iOverlander no se republican; cada ficha tiene el enlace para verlas en iOverlander.</div>
  <h2 class="sec-h">Fotografías (Wikimedia Commons)</h2>
  ${Object.entries(C).map(([f, c]) => `<a class="cred" href="${esc(c.source)}" target="_blank" rel="noopener"><img src="${esc(c.th || 'assets/photos/th/' + f)}" alt="" loading="lazy"><div><b>${esc(c.file)}</b><br>${esc(c.author)} · ${esc(c.license)}</div></a>`).join('')}
  </div>${footerHTML()}`;
}
function footerHTML(){
  return `<footer class="footer"><div class="wrap">
    <div><h4>Viaje</h4>
      <select class="dsel" data-act="scenario-sel">${['19','12'].map(s => `<option value="${s}" ${S.plan.scenario === s ? 'selected' : ''}>Salida de Paraguay: ${s} de diciembre</option>`).join('')}</select>
      <button class="dsel" style="text-align:left" data-act="me">${icon('key')} ${S.me.pass ? 'Clave del viaje ingresada' : 'Ingresar clave del viaje'} · ${esc(S.me.name || 'sin nombre')}</button>
      <p>${S.remote ? (S.online ? 'Conectado a la base compartida (Supabase).' : 'Sin conexión con Supabase.') : 'Modo local: falta configurar Supabase.'}</p></div>
    <div><h4>Descubre</h4><a href="#/mapa">Mapa de la ruta</a><a href="#/plan">Plan completo</a><a href="#/navidad">Navidad</a></div>
    <div><h4>Ruta Paraguay</h4><a href="#/creditos">Créditos fotográficos</a><a href="#/creditos">Fuentes de datos</a><button class="lnk" data-act="export">Exportar plan y check-ins</button></div>
  </div></footer>`;
}

/* ================================================================ mapa */
const TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let map, layers = {}, mapFitted = false, cardMarkers = [];
const LAY = [['alts', 'Alternativas', '#8a8a90'], ['attr', 'Qué visitar', '#7b3fe4'], ['laundry', 'Lavanderías', '#0a7ea4'], ['park', 'Estacionar', '#4a5560']];
const vis = ls.get('pm-layers', {alts: false, attr: true, laundry: false, park: false});
function initMap(){
  if (map || !window.L) return;
  map = L.map('map', {zoomControl: false}).setView([-25.3, -57], 6);
  L.tileLayer(TILE, {maxZoom: 19, attribution: 'Tiles © Esri · © OpenStreetMap'}).addTo(map);
  layers.route = L.layerGroup().addTo(map);
  LAY.forEach(([k]) => layers[k] = L.layerGroup());
  $('#map-chips').innerHTML = LAY.map(([k, t, c]) => `<button class="mchip ${vis[k] ? 'on' : ''}" data-act="layer" data-k="${k}"><i style="background:${c}"></i>${t}</button>`).join('');
  $('#map-fit').innerHTML = icon('fit');
  const cards = $('#map-cards');
  let st;
  cards.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(() => {
    const w = cards.firstElementChild?.getBoundingClientRect().width + 12; const i = Math.round(cards.scrollLeft / w);
    focusCard(i, false); }, 120); }, {passive: true});
  renderMap();
}
const mkIcon = (cls, txt, size, bg) => L.divIcon({className: '', html: `<div class="mk ${cls}" style="width:${size}px;height:${size}px;${bg ? 'background:' + bg : ''}">${txt}</div>`, iconSize: [size, size], iconAnchor: [size/2, size/2]});
function renderMap(){
  if (!map) return;
  Object.values(layers).forEach(l => l.clearLayers());
  cardMarkers = [];
  const seen = new Set();
  T.rows.forEach((r, i) => {
    if (r.state === 'skip') return;
    const p = rowPos(r), col = r.state === 'done' ? '#9a9aa1' : SEGHEX[r.def.seg] || '#888';
    const m = L.marker([p.lat, p.lon], {icon: mkIcon(`${r.state === 'done' ? 'done' : ''} ${r.state === 'here' ? 'here' : ''}`, r.state === 'done' ? '✓' : i + 1, 30, col), zIndexOffset: 1000})
      .addTo(layers.route).on('click', () => { const k = cardMarkers.findIndex(c => c.key === r.key); focusCard(k, true); });
    cardMarkers.push({key: r.key, p, m});
    if (i) {
      const pr = T.rows.slice(0, i).reverse().find(x => x.state !== 'skip'); if (pr) {
        const lg = leg(pr, r), pp = rowPos(pr);
        L.polyline(lg.geo || [[pp.lat, pp.lon], [p.lat, p.lon]], {color: i <= T.L ? '#8d8d94' : col, weight: i <= T.L ? 4 : 5, opacity: .9, dashArray: lg.geo ? null : '6 8'}).addTo(layers.route);
      }
    }
    const d = r.def;
    [d.lodging, ...d.alts].filter(x => x != null && x != r.lodging && PL[x] && !seen.has('l' + x)).forEach(x => { seen.add('l' + x);
      L.marker([PL[x].lat, PL[x].lon], {icon: mkIcon('alt', '⛺', 22)}).addTo(layers.alts).on('click', () => placeSheet(x, r.key)); });
    d.attr.filter(x => PL[x] && !seen.has('a' + x)).forEach(x => { seen.add('a' + x);
      L.marker([PL[x].lat, PL[x].lon], {icon: mkIcon('at', '★', 22)}).addTo(layers.attr).on('click', () => placeSheet(x, r.key)); });
    d.park.filter(x => PL[x] && !seen.has('p' + x)).forEach(x => { seen.add('p' + x);
      L.marker([PL[x].lat, PL[x].lon], {icon: mkIcon(SLEEP.has(PL[x].cat) ? 'alt' : 'pk', SLEEP.has(PL[x].cat) ? '⛺' : 'P', SLEEP.has(PL[x].cat) ? 22 : 20)}).addTo(SLEEP.has(PL[x].cat) ? layers.alts : layers.park).on('click', () => placeSheet(x, r.key)); });
    d.laundry.forEach(l => { const k = 'w' + l.lat + l.lon; if (seen.has(k)) return; seen.add(k);
      L.marker([l.lat, l.lon], {icon: mkIcon('la', '🧺', 22)}).addTo(layers.laundry)
        .bindPopup(`<b>${esc(l.name)}</b><br><small>${esc(l.src)}</small><br><a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lon}">Cómo llegar</a>`); });
  });
  LAY.forEach(([k]) => vis[k] ? layers[k].addTo(map) : layers[k].remove());
  $('#map-cards').innerHTML = cardMarkers.map(c => { const r = T.rows.find(x => x.key === c.key);
    return `<div class="mcard" data-act="open" data-key="${esc(c.key)}"><img src="${thumb(r.def.custom ? '' : c.key)}" alt="" loading="lazy"><div><b>${T.rows.indexOf(r) + 1}. ${esc(r.def.name)}</b><small>${fmt(r.arr)} → ${fmt(r.dep)} · ${noches(r.n)}</small><small>${esc(r.ck?.place_name || PL[r.lodging]?.name || '')}</small></div></div>`; }).join('');
}
function fitAll(){ if (!map || !cardMarkers.length) return; map.fitBounds(cardMarkers.map(c => [c.p.lat, c.p.lon]), {padding: [40, 40], paddingBottomRight: [0, 120]}); mapFitted = true; }
function focusCard(i, scroll){
  const c = cardMarkers[i]; if (!c) return;
  document.querySelectorAll('.mcard').forEach((e, j) => e.classList.toggle('on', i === j));
  map.flyTo([c.p.lat, c.p.lon], Math.max(map.getZoom(), 8), {duration: .6});
  if (scroll) { const el = document.querySelectorAll('.mcard')[i]; el && el.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'}); }
}

/* ================================================================ carruseles */
function bindDots(gal, dots){
  if (!gal || !dots) return;
  gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); dots.querySelectorAll('i').forEach((d, j) => d.classList.toggle('on', i === j)); }, {passive: true});
}
// en computador (mouse): flechas y arrastre; en el teléfono se desliza con el dedo como siempre
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
let drag = null;
window.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x0;
  if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; drag.el.classList.add('dragging'); }
  if (drag.moved) drag.el.scrollLeft = drag.s0 - dx; });
window.addEventListener('pointerup', () => { if (!drag) return;
  const el = drag.el, fwd = el.scrollLeft > drag.s0;
  if (drag.moved) {
    // al soltar, pasa al elemento siguiente o anterior según la dirección del arrastre
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0, x0 = el.getBoundingClientRect().left + pad;
    const ds = [...el.children].map(c => c.getBoundingClientRect().left - x0);
    const d = fwd ? ds.find(v => v > 1) : ds.filter(v => v < -1).pop();
    el.classList.remove('dragging'); el.dataset.moved = 1; setTimeout(() => delete el.dataset.moved, 0);
    if (d != null) el.scrollTo({left: el.scrollLeft + d, behavior: 'smooth'});
  }
  drag = null; });
function enhanceScrollers(root = document){
  if (!FINE.matches) return;
  root.querySelectorAll('.stack, .ps-gal, .hs, .pills, .map-chips, .map-cards').forEach(el => {
    if (el.dataset.sc) return; el.dataset.sc = 1;
    const wrap = el.parentElement.classList.contains('sc-wrap') ? el.parentElement : null;
    const host = wrap || (() => { const w = document.createElement('div'); w.className = 'sc-wrap' + (el.classList.contains('ps-gal') ? ' fill' : '') + (el.classList.contains('map-cards') ? ' over' : ''); el.before(w); w.append(el); return w; })();
    const prev = Object.assign(document.createElement('button'), {className: 'sc-btn l', type: 'button', ariaLabel: 'Anterior', innerHTML: '‹'});
    const next = Object.assign(document.createElement('button'), {className: 'sc-btn r', type: 'button', ariaLabel: 'Siguiente', innerHTML: '›'});
    host.append(prev, next);
    const step = () => el.classList.contains('ps-gal') ? el.clientWidth : Math.max(160, el.clientWidth * .8);
    prev.onclick = e => { e.stopPropagation(); el.scrollBy({left: -step(), behavior: 'smooth'}); };
    next.onclick = e => { e.stopPropagation(); el.scrollBy({left: step(), behavior: 'smooth'}); };
    const upd = () => { const max = el.scrollWidth - el.clientWidth - 2; prev.hidden = el.scrollLeft <= 2; next.hidden = el.scrollLeft >= max; host.classList.toggle('noscroll', max <= 0); };
    el.addEventListener('scroll', upd, {passive: true}); new ResizeObserver(upd).observe(el); upd();
    // arrastrar con el mouse (los listeners de ventana son únicos, abajo)
    el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button) return; drag = {el, x0: e.clientX, s0: el.scrollLeft, moved: false}; });
    el.addEventListener('click', e => { if (el.dataset.moved) { e.stopPropagation(); e.preventDefault(); delete el.dataset.moved; } }, true);
    el.addEventListener('dragstart', e => e.preventDefault());
  });
}

/* ================================================================ hojas (bottom sheets) */
function openSheet(title, html){ $('#sheet-t').textContent = title; $('#sheet-b').innerHTML = html; hydrateIcons($('#sheet-b')); enhanceScrollers($('#sheet-b')); $('#sheet-b').scrollTop = 0; $('#sheet').classList.add('on'); $('#scrim').classList.add('on'); }
function closeSheet(){ $('#sheet').classList.remove('on'); $('#scrim').classList.remove('on'); }

function placeSheet(id, stopKey){
  const p = PL[id]; if (!p) return;
  const def = stopKey ? (DEF[stopKey] || T.rows.find(x => x.key === stopKey)?.def) : null;
  const sleep = SLEEP.has(p.cat) && (!def || !def.attr.includes(id));
  // atracciones y estacionamientos: ruta desde el hospedaje elegido de la parada
  const base = def && !sleep ? basePos(stopKey) : null;
  const dst = `${p.lat},${p.lon}`, org = base ? `${base.pos.lat},${base.pos.lon}` : '';
  const gm = `https://www.google.com/maps/dir/?api=1${org ? '&origin=' + org : ''}&destination=${dst}&travelmode=driving`;
  const wz = org ? `https://www.waze.com/live-map/directions?from=ll.${encodeURIComponent(org)}&to=ll.${encodeURIComponent(dst)}` : `https://waze.com/ul?ll=${dst}&navigate=yes`;
  const phn = p.phone ? p.phone.replace(/[^\d]/g, '') : '';
  const gal = DATA.attrPhotos?.[id] || [];
  let h = '';
  if (gal.length) h += `<div class="sg"><div class="ps-gal">${gal.map(f => `<img src="${f}" alt="" loading="lazy">`).join('')}</div>
    ${gal.length > 1 ? `<div class="ps-dots">${gal.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}</div>`;
  h += `<div class="muted small">${esc(CAT[p.cat] || p.cat)}${p.city ? ' · ' + esc(p.city) : ''}${p.ext ? ' · Fuente: ' + esc(p.src) : ` · ${p.n} check-ins · último ${p.last || '—'}`}</div>
    <div class="tags">${p.cat !== 'tourist_attraction' ? `<span class="tag ${access(p)[0]}">${access(p)[1]}</span>` : ''}${tags(p)}</div>`;
  if (base) {
    const k = ck4(base.pos) + '>' + ck4(p);
    h += `<div class="route-box">${icon('car')}<div><b data-leg="${k}">${legTxt(legP(base.pos, p, true))}</b><small>en auto desde ${esc(base.name)}</small></div></div>`;
  }
  h += `<div class="links"><a class="btn-pink" style="min-height:40px;padding:8px 16px;font-size:14.5px" href="${gm}" target="_blank" rel="noopener">Google Maps</a><a class="btn-line sm" href="${wz}" target="_blank" rel="noopener">Waze</a>
      ${iov(p) ? `<a class="btn-line sm" href="${iov(p)}">${icon('photo')}${p.cat === 'tourist_attraction' || !sleep ? 'Fotos en iOverlander' : 'Abrir en iOverlander'}</a>` : ''}
      ${phn ? `<a class="btn-line sm" href="https://wa.me/${phn}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</div>`;
  if (gal.length) h += `<div class="small muted" style="margin-top:-4px">Fotos: Wikimedia Commons (<a href="#/creditos" style="text-decoration:underline">créditos</a>). Las de los viajeros, en la app iOverlander.</div>`;
  if (stopKey) {
    const i = S.plan.stops.findIndex(s => s.key === stopKey);
    const row = T.rows.find(r => r.key === stopKey);
    if (sleep && i >= 0 && row?.state === 'next' && S.plan.stops[i].lodging != id) h += `<button class="btn-pink block" data-act="uselod" data-i="${i}" data-id="${id}">Elegir para «${esc(DEF[stopKey].name.split(' ·')[0])}»</button>`;
  }
  if (p.cat !== 'tourist_attraction') {
    const pr = priceOf(p);
    h += `<h4>💲 Costo más reciente</h4><div class="q p"><b>${esc(pr.fromComment ? `${pr.amt} ${pr.per}` : costTxt(p))}</b></div>`;
    if (pr.fromComment) h += `<div class="q"><span class="d">Precio mencionado en un comentario · ${esc(pr.date || '')}</span><br>${esc(pr.text.length > 260 ? pr.text.slice(0, 260) + '…' : pr.text)}</div>`;
    else if (p.cur && p.cost?.date) h += `<div class="q"><span class="d">Comentario con precio · ${p.cost.date}</span><br>${esc(p.cost.text)}</div>`;
    const ours = S.checkins.filter(c => c.place_id == id && c.cost_amount != null);
    ours.forEach(c => h += `<div class="q p"><span class="d">Pagado por ${esc(c.author || 'el grupo')} · ${c.arrived}</span><br>${money(c.cost_amount, c.cost_currency)} por noche</div>`);
    h += `<h4>🛣 Acceso sin 4x4</h4>`;
    if (p.cur) h += `<div class="q r">${esc(p.cur.note)}</div>`;
    if (p.access) h += `<div class="q">${esc(p.access)}</div>`;
    (p.road || []).forEach(r => h += `<div class="q r"><span class="d">${esc(r.date)}</span><br>${esc(r.text)}</div>`);
    if (!p.ext && !(p.road || []).length) h += `<div class="q">Ningún comentario menciona 4x4, barro, arena ni caminos de tierra.</div>`;
  }
  if (p.desc) h += `<h4>Descripción</h4><p style="margin:0;font-size:14.5px;line-height:1.55">${esc(p.desc)}</p>`;
  if (p.comments?.length) h += `<h4>Últimos comentarios en iOverlander</h4>` + p.comments.map(c => `<div class="q"><span class="d">${c.date}${c.veh ? ' · ' + esc(c.veh) : ''}</span><br>${esc(c.text)}</div>`).join('');
  openSheet(p.name, h);
  bindDots($('#sheet-b .ps-gal'), $('#sheet-b .ps-dots'));
}

function petSheet(stopKey, i){
  const def = DEF[stopKey], q = def?.pets?.[i]; if (!q) return;
  const base = basePos(stopKey), dst = `${q.lat},${q.lon}`, org = `${base.pos.lat},${base.pos.lon}`, k = ck4(base.pos) + '>' + ck4(q);
  const on = openNow(q.hours), phn = q.phone ? q.phone.replace(/[^\d]/g, '') : '';
  const wa = /^09\d{8}$/.test(phn) ? '595' + phn.slice(1) : /^5959\d{8}$/.test(phn) ? phn : '';   // solo celulares de Paraguay
  let h = `<div class="muted small">Pet shop${q.addr ? ' · ' + esc(q.addr) : ''}${q.rating ? ` · ${String(q.rating).replace('.', ',')} ★ (${q.reviews}) en Google Maps` : ''}</div>
    <div class="route-box">${icon('car')}<div><b data-leg="${k}">${legTxt(legP(base.pos, q, true))}</b><small>en auto desde ${esc(base.name)}</small></div></div>
    <div class="links"><a class="btn-pink" style="min-height:40px;padding:8px 16px;font-size:14.5px" href="https://www.google.com/maps/dir/?api=1&origin=${org}&destination=${dst}&travelmode=driving" target="_blank" rel="noopener">Google Maps</a><a class="btn-line sm" href="https://www.waze.com/live-map/directions?from=ll.${encodeURIComponent(org)}&to=ll.${encodeURIComponent(dst)}" target="_blank" rel="noopener">Waze</a>
      ${wa ? `<a class="btn-line sm" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>` : phn ? `<a class="btn-line sm" href="tel:${esc(q.phone.replace(/[^\d+]/g, ''))}">Llamar</a>` : ''}${q.web ? `<a class="btn-line sm" href="${esc(q.web)}" target="_blank" rel="noopener">Sitio web</a>` : ''}</div>
    <h4>🕘 Horario de atención</h4>${on ? `<div class="q ${on.open ? 'p' : 'r'}"><b>${on.txt}</b></div>` : ''}
    <div class="q">${(q.hours || []).map((d, j) => `${DIAS[j]}: ${dayTxt(d)}`).join('<br>')}</div>
    <h4>🐱 Comida premium para gatos</h4><div class="q p"><b>${esc(brandTxt(q))}</b></div><div class="q"><span class="d">${q.ver === 'web' ? 'Comprobado' : q.ver === 'maps' ? 'Comprobado en Google Maps' : 'Según Google Maps (sin comprobar la marca)'}</span><br>${esc(q.evid)}</div>
    ${q.phone ? `<div class="small muted">Teléfono: ${esc(q.phone)}</div>` : ''}<div class="small muted" style="margin-top:6px">Horarios de Google Maps: conviene confirmar por teléfono o WhatsApp antes de ir.</div>`;
  openSheet(q.name, h);
}

function needKey(){
  if (S.me.name && (!S.remote || S.me.pass)) return false;
  meSheet(S.remote ? 'Para hacer check-in compartido ingresa tu nombre y la clave del viaje.' : 'Antes del primer check-in, dinos quién eres.');
  return true;
}
function meSheet(msg){
  openSheet('Quién eres', `<form class="f" data-form="me">${msg ? `<div class="alert info">${icon('info')}<div>${esc(msg)}</div></div>` : ''}
    <label>Tu nombre<input name="name" required value="${esc(S.me.name)}" placeholder="Ej.: Edison" autocomplete="given-name"></label>
    ${S.remote ? `<label>Clave del viaje<input name="pass" type="password" value="${esc(S.me.pass)}" placeholder="La comparte quien organiza" autocomplete="current-password"><span class="hint">Se guarda solo en este teléfono. Sin clave puedes ver todo, pero no registrar.</span></label>` : '<div class="hint">Modo local: no hace falta clave.</div>'}
    <button class="btn-pink block">Guardar</button>${S.me.pass ? '<button type="button" class="btn-line" data-act="logout">Olvidar la clave en este teléfono</button>' : ''}</form>`);
}

function checkinSheet(stopKey, editId){
  if (needKey()) return;
  const c = editId ? S.checkins.find(x => x.id === editId) : null;
  const key = c ? c.stop_key : stopKey || (T.rows.find((r, i) => i > T.L && r.state === 'next') || T.rows[0]).key;
  const opts = T.rows.filter(r => r.state !== 'done' || r.key === key);
  const def = DEF[key];
  const lods = def ? sleepOpts(def).all : [];
  const row = T.rows.find(r => r.key === key);
  const selPlace = c ? (c.place_id ?? 'other') : (row?.lodging ?? lods[0] ?? 'other');
  const other = selPlace === 'other';
  openSheet(c ? 'Editar check-in' : 'Check-in', `<form class="f" data-form="checkin" data-id="${c ? c.id : ''}">
    <label>Parada<select name="stop" data-act="ck-stop">${opts.map(r => `<option value="${esc(r.key)}" ${r.key === key ? 'selected' : ''}>${T.rows.indexOf(r) + 1}. ${esc(r.def.name)}</option>`).join('')}
      ${Object.values(DEF).filter(d => !T.rows.some(r => r.key === d.key)).map(d => `<option value="${d.key}" ${d.key === key ? 'selected' : ''}>+ ${esc(d.name)}</option>`).join('')}
      <option value="__new" ${def ? '' : 'selected'}>+ Parada no planificada…</option></select></label>
    <label data-show="new" ${def ? 'hidden' : ''}>Nombre de la parada<input name="stop_name" value="${esc(c?.stop_name || '')}" placeholder="Ej.: Pernocte en Caapucú"></label>
    <div><div style="font-size:13.5px;font-weight:700;color:var(--ink2);margin-bottom:6px">Dónde dormimos</div><div class="radio">
      ${lods.map(id => `<label><input type="radio" name="place" value="${id}" ${selPlace == id ? 'checked' : ''}><span>${esc(PL[id].name)}<small>${esc(shortCost(PL[id]).join(' '))}${id == def.lodging ? ' · recomendado' : ''}</small></span></label>`).join('')}
      <label><input type="radio" name="place" value="other" ${other ? 'checked' : ''}><span>Otro lugar no listado<small>Usa el GPS del teléfono</small></span></label></div></div>
    <div data-show="other" ${other ? '' : 'hidden'} style="display:grid;gap:10px">
      <label>Nombre del lugar<input name="place_name" value="${esc(other ? c?.place_name || '' : '')}" placeholder="Ej.: Estación Petrobras km 132"></label>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="btn-line sm" data-act="gps">${icon('gps')}Usar mi ubicación</button><span class="hint" id="gps-out">${c?.lat != null && other ? `${(+c.lat).toFixed(5)}, ${(+c.lon).toFixed(5)}` : 'Sin ubicación'}</span></div>
      <input type="hidden" name="lat" value="${other && c?.lat != null ? c.lat : ''}"><input type="hidden" name="lon" value="${other && c?.lon != null ? c.lon : ''}"></div>
    <div class="two"><label>Llegada<input type="date" name="arrived" required value="${c?.arrived || TODAY}"></label>
      <label>Salida <span class="hint">(opcional)</span><input type="date" name="departed" value="${c?.departed || ''}"></label></div>
    <div class="two"><label>Costo por noche<input name="cost_amount" inputmode="numeric" value="${c?.cost_amount ?? ''}" placeholder="80000"></label>
      <label>Moneda<select name="cost_currency">${['PYG','ARS','USD','BRL'].map(m => `<option ${(c?.cost_currency || (def?.argentina ? 'ARS' : 'PYG')) === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label></div>
    <div><div style="font-size:13.5px;font-weight:700;color:var(--ink2);margin-bottom:4px">Calificación</div><div class="starsel" data-v="${c?.rating || 0}">${[1,2,3,4,5].map(n => `<button type="button" data-act="star" data-n="${n}" class="${n <= (c?.rating || 0) ? 'on' : ''}">★</button>`).join('')}</div></div>
    <label>Comentario<textarea name="comment" placeholder="Acceso, duchas, ruido, qué recomendarían…">${esc(c?.comment || '')}</textarea></label>
    <button class="btn-pink block">${icon('check')}${c ? 'Guardar cambios' : 'Guardar check-in'}</button>
    <div class="hint" style="text-align:center">Al guardar se recalculan las fechas y la ruta de lo que sigue.</div></form>`);
}
function checkoutSheet(id){
  if (needKey()) return;
  const c = S.checkins.find(x => x.id === id); if (!c) return;
  openSheet('Registrar salida', `<form class="f" data-form="checkout" data-id="${id}">
    <p style="margin:0">${esc(DEF[c.stop_key]?.name || c.stop_name || '')} · llegaron el ${fmt(c.arrived)}</p>
    <label>Fecha de salida<input type="date" name="departed" required min="${c.arrived}" value="${maxD(TODAY, c.arrived)}"></label>
    <div class="two"><label>Costo por noche<input name="cost_amount" inputmode="numeric" value="${c.cost_amount ?? ''}"></label>
      <label>Moneda<select name="cost_currency">${['PYG','ARS','USD','BRL'].map(m => `<option ${(c.cost_currency || 'PYG') === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label></div>
    <div><div style="font-size:13.5px;font-weight:700;color:var(--ink2);margin-bottom:4px">Calificación</div><div class="starsel" data-v="${c.rating || 0}">${[1,2,3,4,5].map(n => `<button type="button" data-act="star" data-n="${n}" class="${n <= (c.rating || 0) ? 'on' : ''}">★</button>`).join('')}</div></div>
    <label>Comentario<textarea name="comment">${esc(c.comment || '')}</textarea></label>
    <button class="btn-pink block">${icon('check')}Guardar salida</button></form>`);
}

/* ================================================================ eventos */
document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const a = t.dataset.act, ds = t.dataset;
  if (t.tagName === 'SELECT') return;
  switch (a) {
    case 'back': history.length > 1 ? history.back() : (location.hash = '#/'); break;
    case 'open': location.hash = '#/p/' + encodeURIComponent(ds.key); break;
    case 'place': e.preventDefault(); placeSheet(+ds.id, ds.key); break;
    case 'pet': petSheet(ds.key, +ds.i); break;
    case 'checkin': checkinSheet(ds.key); break;
    case 'checkout': checkoutSheet(ds.id); break;
    case 'editck': checkinSheet(null, ds.id); break;
    case 'delck': {
      if (needKey()) break;
      const c = S.checkins.find(x => x.id === ds.id); if (!c) break;
      if (!confirm('¿Eliminar este check-in? El plan se recalcula.')) break;
      try { await saveCheckin(Object.assign({}, c, {deleted: true})); render(); toast('Check-in eliminado'); } catch (err) { toast(err.message); }
      break; }
    case 'me': meSheet(); break;
    case 'logout': S.me.pass = ''; saveLocal(); closeSheet(); render(); toast('Clave olvidada en este teléfono'); break;
    case 'nights': { const s = S.plan.stops[+ds.i]; s.nights = Math.max(0, s.nights + +ds.d); planChanged(); break; }
    case 'move': { const i = +ds.i, j = i + +ds.d; if (j < 0 || j >= S.plan.stops.length) break; [S.plan.stops[i], S.plan.stops[j]] = [S.plan.stops[j], S.plan.stops[i]]; planChanged(); break; }
    case 'remove': S.plan.stops.splice(+ds.i, 1); planChanged('Parada quitada del plan'); break;
    case 'add': { const pos = +$('#addpos').value, k = ds.key; S.plan.stops.splice(pos, 0, {key: k, nights: DEF[k]['n' + S.plan.scenario] || 1, lodging: DEF[k].lodging}); planChanged('Parada agregada'); break; }
    case 'uselod': S.plan.stops[+ds.i].lodging = +ds.id; closeSheet(); planChanged('Hospedaje elegido'); break;
    case 'scenario': setScenario(ds.s); break;
    case 'edit': S.editing = !S.editing; render(); break;
    case 'reset': if (confirm('¿Restaurar el plan sugerido? Se pierden las ediciones de noches y orden (los check-ins se mantienen).')) { const sc = S.plan.scenario; S.plan = preset(sc); planChanged('Plan sugerido restaurado'); } break;
    case 'export': { const b = new Blob([JSON.stringify({plan: S.plan, checkins: S.checkins}, null, 1)], {type: 'application/json'}); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'ruta-paraguay.json'; l.click(); break; }
    case 'layer': vis[ds.k] = !vis[ds.k]; ls.set('pm-layers', vis); t.classList.toggle('on', vis[ds.k]); vis[ds.k] ? layers[ds.k].addTo(map) : layers[ds.k].remove(); break;
    case 'star': { const box = t.parentElement; box.dataset.v = ds.n; box.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.n <= +ds.n)); break; }
    case 'gps': {
      const out = $('#gps-out'); out.textContent = 'Buscando…';
      navigator.geolocation.getCurrentPosition(p => {
        const f = t.closest('form'); f.lat.value = p.coords.latitude.toFixed(6); f.lon.value = p.coords.longitude.toFixed(6);
        out.textContent = `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} (±${Math.round(p.coords.accuracy)} m)`;
      }, err => { out.textContent = 'No se pudo obtener la ubicación: ' + err.message; }, {enableHighAccuracy: true, timeout: 15000});
      break; }
  }
});
function setScenario(sc){
  if (sc === S.plan.scenario) return;
  // conserva noches editadas de las paradas comunes y aplica las del escenario al tramo final
  const old = Object.fromEntries(S.plan.stops.map(s => [s.key, s]));
  const fresh = preset(sc);
  fresh.start = S.plan.start;
  fresh.stops.forEach(s => { const o = old[s.key]; if (o && DEF[s.key].seg !== 'C' && DEF[s.key].seg !== 'D') { s.nights = o.nights; s.lodging = o.lodging; } else if (o) s.lodging = o.lodging; });
  S.plan = fresh; planChanged(`Escenario: salida ${sc}-dic`);
}
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'start' && t.value) { S.plan.start = t.value; planChanged(); }
  if (t.dataset.act === 'scenario-sel') setScenario(t.value);
  if (t.dataset.act === 'ck-stop') { const f = t.closest('form'); const v = t.value;
    if (v === '__new') { f.querySelector('[data-show=new]').hidden = false; f.querySelectorAll('.radio label').forEach(l => { if (!l.querySelector('[value=other]')) l.remove(); }); f.querySelector('[value=other]').checked = true; f.querySelector('[data-show=other]').hidden = false; }
    else checkinSheet(v); }
  if (t.name === 'place') { const f = t.closest('form'); f.querySelector('[data-show=other]').hidden = t.value !== 'other'; }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const v = Object.fromEntries(new FormData(f).entries());
  const btn = f.querySelector('.btn-pink'); btn.disabled = true;
  try {
    if (f.dataset.form === 'me') {
      S.me.name = v.name.trim();
      if (S.remote && v.pass) { await sb.rpc('trip_login', {p_pass: v.pass}); }
      S.me.pass = v.pass || ''; saveLocal(); closeSheet(); render(); toast(S.me.pass ? 'Listo, ya puedes hacer check-in' : 'Nombre guardado');
      if (S.dirty && S.me.pass) planChanged();
    }
    if (f.dataset.form === 'checkin') {
      const isNew = v.stop === '__new';
      const key = isNew ? 'x-' + uid().slice(0, 8) : v.stop;
      const prev = f.dataset.id ? S.checkins.find(x => x.id === f.dataset.id) : null;
      const other = v.place === 'other';
      if (other && !v.place_name.trim()) throw new Error('Escribe el nombre del lugar');
      if (isNew && !v.stop_name.trim()) throw new Error('Escribe el nombre de la parada');
      if (v.departed && v.departed < v.arrived) throw new Error('La salida no puede ser antes de la llegada');
      const rating = +f.querySelector('.starsel').dataset.v || null;
      const row = {
        id: prev?.id, stop_key: prev && !isNew ? (v.stop || prev.stop_key) : key, stop_name: isNew ? v.stop_name.trim() : (prev?.stop_name || null),
        place_id: other ? null : +v.place, place_name: other ? v.place_name.trim() : PL[+v.place]?.name,
        lat: other && v.lat ? +v.lat : null, lon: other && v.lon ? +v.lon : null,
        arrived: v.arrived, departed: v.departed || null,
        cost_amount: v.cost_amount ? +String(v.cost_amount).replace(/[^\d.]/g, '') : null, cost_currency: v.cost_currency,
        rating, comment: v.comment.trim() || null, author: S.me.name || null,
      };
      // al llegar a una parada nueva se cierra automáticamente la estadía anterior sin salida
      if (!prev) {
        const open = S.checkins.filter(c => !c.deleted && !c.departed && c.stop_key !== row.stop_key && c.arrived <= row.arrived);
        for (const o of open) await saveCheckin(Object.assign({}, o, {departed: row.arrived}));
        // si la parada estaba fuera del plan, se agrega al plan en su posición
        if (DEF[row.stop_key] && !S.plan.stops.some(s => s.key === row.stop_key)) {
          let pos = 0; T.rows.forEach(r => { if (r.ck && r.ck.arrived <= row.arrived && r.inPlan) pos = S.plan.stops.findIndex(s => s.key === r.key) + 1; });
          S.plan.stops.splice(pos, 0, {key: row.stop_key, nights: 1, lodging: row.place_id});
          planChanged();
        }
      }
      await saveCheckin(row);
      closeSheet(); render(); toast('Check-in guardado · plan recalculado');
      if (!prev) location.hash = '#/p/' + encodeURIComponent(row.stop_key);
    }
    if (f.dataset.form === 'checkout') {
      const c = S.checkins.find(x => x.id === f.dataset.id);
      await saveCheckin(Object.assign({}, c, {departed: v.departed, cost_amount: v.cost_amount ? +String(v.cost_amount).replace(/[^\d.]/g, '') : c.cost_amount,
        cost_currency: v.cost_currency, rating: +f.querySelector('.starsel').dataset.v || c.rating, comment: v.comment.trim() || null}));
      closeSheet(); render(); toast('Salida registrada · plan recalculado');
    }
  } catch (err) { toast(err.message); }
  btn.disabled = false;
});
$('#tab-checkin').addEventListener('click', () => T.here ? checkoutSheet(T.here.ck.id) : checkinSheet());
$('#scrim').addEventListener('click', closeSheet);
$('#sheet-x').addEventListener('click', closeSheet);
$('#map-fit').addEventListener('click', fitAll);
(() => { // deslizar la hoja hacia abajo para cerrar
  const sh = $('#sheet'), hd = sh.querySelector('.sheet-h'); let y0 = null;
  hd.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; sh.style.transition = 'none'; }, {passive: true});
  hd.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, {passive: true});
  hd.addEventListener('touchend', e => { const dy = e.changedTouches[0].clientY - y0; sh.style.transition = ''; sh.style.transform = ''; if (dy > 90) closeSheet(); y0 = null; });
})();
window.addEventListener('hashchange', go);
document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
setInterval(() => { if (!document.hidden) pull(); }, 60000);

hydrateIcons();
go();
pull();
})();

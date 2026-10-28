"""Distancia y tiempo en auto (OSRM) desde cada opción para dormir hasta cada atracción de su parada.
Guarda en tools/data.json → "vlegs": {"lat,lon>lat,lon": {"km", "min"}} (coordenadas con 3 decimales, como en app.js).
Uso: python tools/visit_legs.py   (desde la raíz del repo)"""
import json, time, urllib.request

SLEEP = {'campsite', 'informal_campsite', 'wild_campsite', 'hostel', 'hotel', 'vehicle_storage'}
d = json.load(open('tools/data.json'))
P = d['places']
ck4 = lambda p: f"{p['lat']:.3f},{p['lon']:.3f}"
out = d.get('vlegs', {})
for s in d['stops'] + d['optional']:
    src = list(dict.fromkeys(i for i in [s['lodging'], *s['alts'], *s['park']] if i is not None and str(i) in P
                             and (i == s['lodging'] or i in s['alts'] or P[str(i)]['cat'] in SLEEP)))
    dst = [i for i in s['attr'] if str(i) in P]
    if not src or not dst: continue
    pts = [P[str(i)] for i in src + dst]
    coords = ';'.join(f"{p['lon']},{p['lat']}" for p in pts)
    url = (f'https://router.project-osrm.org/table/v1/driving/{coords}?annotations=duration,distance'
           f"&sources={';'.join(map(str, range(len(src))))}&destinations={';'.join(map(str, range(len(src), len(pts))))}")
    j = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'paraguay-motorhome-trip/1.0'}), timeout=60).read())
    for a, row_d, row_m in zip(src, j['distances'], j['durations']):
        for b, dist, dur in zip(dst, row_d, row_m):
            if dist is None: continue
            out[ck4(P[str(a)]) + '>' + ck4(P[str(b)])] = dict(km=round(dist / 1000, 1), min=round(dur / 60))
    print(s['key'], len(src), 'x', len(dst))
    time.sleep(1.2)
d['vlegs'] = out
json.dump(d, open('tools/data.json', 'w'), ensure_ascii=False)
print(len(out), 'tramos')

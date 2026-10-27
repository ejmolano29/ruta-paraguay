"""Empaqueta tools/data.json (sitios, rutas) + tools/photos.json (fotos) en assets/data.js.
Uso: python tools/package.py   (desde la raíz del repo)"""
import json, os

d = json.load(open('tools/data.json'))
ph = json.load(open('tools/photos.json'))

# foto de portada de cada parada (elegida tras la revisión visual)
HERO = {'cde': 'cde-1', 'monday': 'monday-2', 'hern': 'hern-5', 'indep': 'indep-1', 'cord': 'cord-3', 'yag': 'yag-5', 'areg': 'areg-2',
        'asu1': 'asu1-1', 'asu2': 'asu2-1', 'pozo': 'pozo-3', 'fila': 'fila-2', 'srosa': 'srosa-3', 'signa': 'signa-5', 'ayolas': 'ayolas-3',
        'trini': 'trini-3', 'yby': 'yby-2', 'nacunday': 'nacunday-3', 'sanigmini': 'sanigmini-5', 'conc': 'conc-3', 'cora': 'cora-1',
        'sanber': 'sanber-3', 'enc': 'enc-4', 'posadas': 'posadas-1'}
# atracción (id) -> archivo de foto
ATTR = {56736: 'monday-2', 279089: 'monday-3', 20542: 'hern-1', 110305: 'hern-4', 328876: 'hern-2', 281900: 'cde-2', -101: 'cde-5',
        61517: 'indep-2', 225364: 'indep-3', 225365: 'indep-1', 164264: 'cord-5', 286035: 'cord-4', 87992: 'yag-5', 412243: 'yag-1',
        183428: 'yag-2', 83966: 'areg-5', 34279: 'areg-4', 346116: 'areg-3', 98698: 'asu2-1', -106: 'asu1-1', -107: 'asu1-5',
        -108: 'asu1-4', 74660: 'asu1-3', 124420: 'fila-1', 74466: 'fila-5', 47397: 'conc-4', -109: 'conc-5', 17454: 'cora-1',
        218900: 'cora-3', 27445: 'srosa-3', 412068: 'sanber-3', 40294: 'sanber-1', 365185: 'sanber-5', 25391: 'signa-5',
        30799: 'signa-3', 327040: 'signa-1', 57591: 'ayolas-3', 70846: 'ayolas-5', 20250: 'trini-3', 99170: 'trini-5',
        172549: 'trini-2', 172718: 'enc-2', 172719: 'enc-6', -110: 'enc-2', -120: 'posadas-1', -121: 'posadas-2', -122: 'posadas-3',
        -123: 'enc-1', -124: 'sanigmini-5', 173553: 'yby-4', 319219: 'yby-3', 84728: 'nacunday-3'}

full = lambda n: f'assets/photos/{n}'
photos = {}
for k, files in ph['photos'].items():
    files = [f for f in files if os.path.exists(full(f))]
    h = HERO.get(k)
    if h and h + '.jpg' in files:
        files.remove(h + '.jpg'); files.insert(0, h + '.jpg')
    if files: photos[k] = [full(f) for f in files]
# claves del plan que comparten fotos
photos['cde'] = photos.get('monday', [])[:2] + photos.get('cde', [])
photos['asu2'] = photos.get('asu2', []) + [p for p in photos.get('asu1', []) if p not in photos.get('asu2', [])][:2]
attr = {str(i): f'assets/photos/th/{n}.jpg' for i, n in ATTR.items() if os.path.exists(f'assets/photos/{n}.jpg')}

# los comentarios de iOverlander se recortan: el sitio es público y enlaza a iOverlander para leer el resto
for p in d['places'].values():
    p['comments'] = [dict(c, text=c['text'][:300] + ('…' if len(c['text']) > 300 else '')) for c in p.get('comments', [])[:3]]
    p['desc'] = (p.get('desc') or '')[:500]
d.pop('laundryAll', None)

credits = {f: c for f, c in ph['credits'].items() if os.path.exists(full(f))}
out = dict(d, photos=photos, attrPhoto=attr, credits=credits)
js = 'window.DATA = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';\n'
open('assets/data.js', 'w').write(js)
print('data.js', len(js) // 1024, 'KB ·', len(photos), 'paradas con foto ·', len(attr), 'atracciones con foto ·', len(credits), 'créditos')

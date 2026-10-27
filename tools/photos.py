"""Descarga fotos con licencia libre desde categorías de Wikimedia Commons.

Uso:  python tools/photos.py assets/photos tools/photos.json
Respeta los límites de Wikimedia: pausas entre llamadas y miniaturas de 1280 px (tamaño estándar).
Las fotos ya descargadas no se vuelven a pedir; el archivo JSON guarda autor y licencia de cada una.
"""
import io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image

UA = {'User-Agent': 'paraguay-motorhome-trip/1.0 (personal travel planner; https://github.com/ejmolano29)'}
OUT, CRED = sys.argv[1], sys.argv[2]
N = 5  # fotos por parada

# clave -> categorías de Commons, en orden de preferencia
CATS = {
 'cde': ['Friendship Bridge (Brazil–Paraguay)', 'Ciudad del Este', 'Lago de la República'],
 'monday': ['Monday Falls', 'Saltos del Monday'],
 'hern': ['Itaipu Dam', 'Itaipu'],
 'indep': ['Colonia Independencia', 'Salto Suizo', 'Villarrica (Paraguay)'],
 'cord': ['Basilica of Our Lady of Miracles (Caacupé)', 'Caacupé', 'Tobatí'],
 'yag': ['Church of San Buenaventura (Yaguarón)', 'Yaguarón', 'Sapucai'],
 'areg': ['Areguá', 'Lake Ypacaraí'],
 'asu1': ['Palacio de los López', 'Panteón Nacional de los Héroes', 'Asunción'],
 'asu2': ['Costanera de Asunción', 'Catedral Metropolitana de Asunción', 'Asunción'],
 'pozo': ['Pozo Colorado', 'Trans-Chaco Highway', 'Ruta PY09'],
 'fila': ['Filadelfia (Paraguay)', 'Loma Plata', 'Mennonites in Paraguay'],
 'conc': ['Concepción, Paraguay', 'Nanawa Bridge'],
 'cora': ['Cerro Cora National Park'],
 'srosa': ['Santa Rosa del Aguaray', 'Laguna Blanca (Paraguay)'],
 'sanber': ['San Bernardino, Paraguay', 'Lake Ypacaraí'],
 'signa': ['San Ignacio Guazú', 'Santa María de Fe', 'Tañarandy'],
 'ayolas': ['Yacyretá Dam', 'Ayolas'],
 'trini': ['La Santísima Trinidad de Paraná', 'Jesuit Missions of La Santísima Trinidad de Paraná and Jesús de Tavarangue', 'Jesús de Tavarangue'],
 'jesus': ['Jesus de Tavarangue'],
 'enc': ['Encarnación'],
 'posadas': ['Posadas Cathedral'],
 'yby': ['Ybycuí National Park', 'Parque Nacional Ybycuí'],
 'lblanca': ['Laguna Blanca (Paraguay)'],
 'yguazu': ['Yguazú'],
 'nacunday': ['Ñacunday National Park', 'Saltos del Ñacunday'],
 'sanigmini': ['San Ignacio Miní'],
}
BAD = re.compile(r'map|mapa|flag|bandera|escudo|coat|logo|locat|ubicaci|icon|seal|diagram|plano|colectivo|bus\b|banco|bank|contenedor|aeropuerto|airport|hospital|escuela|school|cartel|sign\b|panoramio \(\d+\)|retrato|portrait|stamp|sello|billete', re.I)

last = [0.0]
def get(url, raw=False):
    for i in range(6):
        wait = 2.5 - (time.time() - last[0])
        if wait > 0: time.sleep(wait)
        last[0] = time.time()
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
            return r if raw else json.loads(r)
        except Exception as e:
            print('   reintento', i + 1, str(e)[:60]); time.sleep(10 * (i + 1))
    return None

def api(**p):
    p.update(format='json', formatversion=2)
    return get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p)) or {}

def members(cat, depth=1):
    r = api(action='query', list='categorymembers', cmtitle='Category:' + cat, cmlimit=60, cmtype='file|subcat')
    items = r.get('query', {}).get('categorymembers', [])
    files = [m['title'] for m in items if m['ns'] == 6]
    if depth and len(files) < 15:
        for sc in [m['title'] for m in items if m['ns'] == 14][:3]:
            files += members(sc.replace('Category:', ''), depth - 1)
    return files

def info(files):
    out = {}
    for i in range(0, len(files), 30):
        r = api(action='query', titles='|'.join(files[i:i + 30]), prop='imageinfo', iiprop='url|size|extmetadata', iiurlwidth=1280)
        for pg in r.get('query', {}).get('pages', []):
            ii = (pg.get('imageinfo') or [None])[0]
            if not ii: continue
            em = ii.get('extmetadata', {})
            g = lambda k: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', (em.get(k) or {}).get('value', ''))).strip()
            out[pg['title']] = dict(w=ii['width'], h=ii['height'], thumb=ii.get('thumburl') or ii['url'], page=ii['descriptionurl'],
                                    author=g('Artist')[:100] or 'Autor desconocido', license=g('LicenseShortName'))
    return out

def ok(f, m):
    r = m['w'] / max(1, m['h'])
    return (re.search(r'\.jpe?g$', f, re.I) and not BAD.search(f) and m['w'] >= 900 and 1.15 <= r <= 2.4
            and m['license'] and not re.search(r'fair use|all rights', m['license'], re.I))

# archivos elegidos a mano tras la revisión visual (tienen prioridad sobre las categorías)
EXPLICIT = {
 'hern': ['Barragem de Itaipu (8155763889).jpg', 'Barragem de itaipu.jpg', 'Barragem Itaipu.JPG', 'BARRAGEM.jpg', 'BR Itaipu 0610 001 (17211533935).jpg', 'BR Itaipu 0610 005 (16589081884).jpg'],
 'asu1': ['Palacio de los López.jpg', 'Palacio de Lopez light 111037.jpg', 'Palacio de Lopez from above.jpg', 'Mercado cuatro - 1 (8041854944).jpg', 'Casa de la Independencia-Bicentenario.JPG'],
 'asu2': ['Catedral Metropolitana de Asunción, Paraguay.jpg', 'Asuncion Palacio Lopez.JPG', 'Catedral de Asunción Paraguay.jpg'],
 'enc': ['Encarnación skyline from Posadas.jpg', 'Paseo San José, Encarnación 01.jpg', 'J38 025 Encarnación, Avenida Costanera Republica del Paraguay.jpg', 'Encarnación with Paraná river in the background 092.jpg', 'Panorama of Encarnación 056.jpg'],
 'posadas': ['Andresguacurari.jpg', 'Catedral San José, Posadas.JPG', 'Encarnación with Posadas in the background 067.jpg', 'Antigua Estación de trenes de Posadas, entrada al edificio.jpg'],
}

store = json.load(open(CRED)) if os.path.exists(CRED) else {'photos': {}, 'credits': {}}
taken = {c['file'] for c in store['credits'].values()} | set(store.get('rejected', []))
def nextname(key):
    i = 1
    while os.path.exists(f'{OUT}/{key}-{i}.jpg'): i += 1
    return f'{key}-{i}.jpg'

def fetch(key, f, m, cat):
    data = get(m['thumb'], raw=True)
    if not data: return None
    im = Image.open(io.BytesIO(data)).convert('RGB')
    if im.width > 1280: im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
    name = nextname(key)
    im.save(f'{OUT}/{name}', 'JPEG', quality=72, optimize=True, progressive=True)
    store['credits'][name] = dict(file=f.replace('File:', ''), source=m['page'], author=m['author'], license=m['license'], category=cat)
    taken.add(f.replace('File:', ''))
    print('  +', name, f[:70])
    return name

for key, files in EXPLICIT.items():
    have = store['photos'].setdefault(key, [])
    fs = ['File:' + f for f in files if f not in taken]
    if not fs: continue
    print('== explícitas', key)
    meta = info(fs)
    for f in fs:
        m = meta.get(f)
        if m and m['license'] and not re.search(r'fair use|all rights', m['license'], re.I):
            n = fetch(key, f, m, 'selección manual')
            if n: have.insert(len([h for h in have if h in store['credits'] and store['credits'][h].get('category') == 'selección manual']), n)
    json.dump(store, open(CRED, 'w'), ensure_ascii=False, indent=1)

for key, cats in CATS.items():
    have = store['photos'].get(key, [])
    if len(have) >= N or key in store.get('locked', []): continue  # 'locked': revisadas a mano
    print('==', key)
    for cat in cats:
        if len(have) >= N: break
        fs = [f for f in members(cat) if f.replace('File:', '') not in taken]
        if not fs:
            print('   sin archivos:', cat); continue
        meta = info(fs[:60])
        cand = sorted([f for f in fs if f in meta and ok(f, meta[f])], key=lambda f: -meta[f]['w'] * meta[f]['h'])
        for f in cand[: N - len(have)]:
            n = fetch(key, f, meta[f], cat)
            if n: have.append(n)
        store['photos'][key] = have
        json.dump(store, open(CRED, 'w'), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in store['photos'].items()})

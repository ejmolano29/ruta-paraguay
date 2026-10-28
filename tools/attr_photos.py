"""Fotos de cada atracción ("Qué visitar") desde Wikimedia Commons.

Paso 1 (candidatas):  python tools/attr_photos.py cand <carpeta-temporal>
    Busca fotos geolocalizadas cerca de cada atracción y por nombre, y baja miniaturas de 330 px para revisarlas.
Paso 2 (final):       python tools/attr_photos.py final
    Baja a 960 px las elegidas en tools/attr_photos.json ("pick": {id: [archivo Commons, ...]})
    y las deja en assets/photos/a/ con miniaturas en assets/photos/a/th/.
Respeta los límites de Wikimedia (pausas entre llamadas, tamaños estándar de miniatura).
"""
import io, json, math, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image

UA = {'User-Agent': 'paraguay-motorhome-trip/1.0 (personal travel planner; https://github.com/ejmolano29)'}
STORE = 'tools/attr_photos.json'
BAD = re.compile(r'map|mapa|flag|bandera|escudo|coat|logo|locat|ubicaci|icon|seal|diagram|plano|cartel|retrato|portrait|stamp|sello|billete|selfie|wikimedia|wikipedia|meeting|reuni|ceremon|acto\b|presidente|ministr|embajad|visita oficial|firma', re.I)
# nombre para buscar en Commons (None = solo búsqueda por ubicación)
Q = {56736: 'Saltos del Monday', 112697: 'Hito Tres Fronteras Presidente Franco', 281900: 'Lago de la República', 279089: None,
     -101: 'Ciudad del Este shopping', 20542: 'Itaipu Dam', 110305: 'Itaipu Centro Ambiental', 328876: 'Itaipu museo', 81031: 'Tati Yupi',
     343792: 'Costanera Hernandarias', 61517: 'Salto Suizo', 225364: 'Castillo Echauri', 225365: 'Mainumby Independencia',
     -102: 'Catedral de Villarrica Paraguay', 164264: 'Basílica de Caacupé', 286035: None, 421040: None, -103: 'Piribebuy',
     -104: 'Tobatí', 87992: 'Iglesia Yaguarón', 183428: 'Cerro Hu Paraguarí', 412243: None,
     412250: 'Estación de Paraguarí', 60144: 'Sapucai talleres ferroviarios', -105: 'Itá Paraguay cerámica', 83966: 'Cerro Koi',
     34279: 'Areguá', 346116: None, 412068: None, 204190: None, 98698: 'Loma San Jerónimo', 74660: None,
     376301: 'Estación Central del Ferrocarril Asunción', 419950: None, -106: 'Palacio de los López', -107: 'Panteón Nacional de los Héroes',
     -108: 'Mercado 4 Asunción', 124420: 'Filadelfia Paraguay museo', 176978: None, 74466: 'Loma Plata museo', 60704: 'Fortín Boquerón',
     373029: None, 110200: None, 47397: 'Puente Nanawa', -109: 'Concepción Paraguay puerto', 17454: 'Cerro Corá',
     218900: 'Cerro Corá', 27445: 'Laguna Blanca Paraguay', 40294: None, 365185: 'San Bernardino Paraguay', 25391: 'Museo San Ignacio Guazú',
     30799: 'Santa María de Fe', 327040: 'Santa María de Fe', 70847: 'Santa Rosa de Lima Misiones Paraguay', 57591: 'Yacyretá',
     70846: 'Atinguy', 173658: 'San Cosme y Damián', 163706: None, 20250: 'Trinidad del Paraná', 99170: None,
     172549: 'Jesús de Tavarangüé', 28742: 'Pajarito yerba', 59795: None, 228755: None, 172718: 'Encarnación', 172719: 'Encarnación',
     -110: 'Costanera Encarnación', -120: 'Parque de las Fiestas Posadas', -121: 'Plaza 9 de Julio Posadas', -122: 'Costanera Posadas',
     -123: 'Puente San Roque González de Santa Cruz', 173553: 'Ybycuí', 319219: 'Ybycuí', 222205: 'Laguna Blanca Paraguay',
     217290: 'Yguazú', 217318: 'Yguazú', 195400: None, 84728: 'Saltos del Ñacunday', -124: 'San Ignacio Miní'}
# radio de búsqueda por ubicación (m)
BIG = {17454: 4000, 218900: 4000, 183428: 2500, 173553: 4000, 319219: 3000, 84728: 2500, 20250: 1500, 172549: 1500, -124: 1500, 20542: 3000}

last = [0.0]
def get(url, raw=False):
    for i in range(6):
        wait = 2.0 - (time.time() - last[0])
        if wait > 0: time.sleep(wait)
        last[0] = time.time()
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
            return r if raw else json.loads(r)
        except Exception as e:
            print('   reintento', i + 1, str(e)[:60], flush=True); time.sleep(10 * (i + 1))
    return None

def api(**p):
    p.update(format='json', formatversion=2)
    for i in range(5):  # la búsqueda de Commons a veces responde "too busy": reintentar
        r = get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(p)) or {}
        if 'busy' not in str(r.get('error', {}).get('code', '')): return r
        print('   búsqueda ocupada, espero', flush=True); time.sleep(20 * (i + 1))
    return {}

def info(files, width):
    out = {}
    for i in range(0, len(files), 30):
        r = api(action='query', titles='|'.join(files[i:i + 30]), prop='imageinfo|coordinates', iiprop='url|size|extmetadata', iiurlwidth=width)
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
    return (re.search(r'\.jpe?g$', f, re.I) and not BAD.search(f) and m['w'] >= 800 and 1.1 <= r <= 2.4
            and m['license'] and not re.search(r'fair use|all rights', m['license'], re.I))

def attractions():
    d = json.load(open('tools/data.json'))
    seen = {}
    for s in d['stops'] + d['optional']:
        for i in s['attr']:
            p = d['places'].get(str(i))
            if p and i not in seen: seen[i] = dict(p, stop=s['key'])
    return seen

def save(st): json.dump(st, open(STORE, 'w'), ensure_ascii=False, indent=1)

st = json.load(open(STORE)) if os.path.exists(STORE) else {'cand': {}, 'pick': {}, 'credits': {}}
mode = sys.argv[1]

if mode == 'cand':
    tmp = sys.argv[2]; os.makedirs(tmp, exist_ok=True)
    for i, p in attractions().items():
        k = str(i)
        if st['cand'].get(k): continue
        rad = BIG.get(i, 1500 if p.get('ext') else 800)
        gs = api(action='query', list='geosearch', gscoord=f"{p['lat']}|{p['lon']}", gsradius=rad, gsnamespace=6, gslimit=40)
        files = [g['title'] for g in gs.get('query', {}).get('geosearch', [])]
        q = Q.get(i, p['name'])
        if q:
            sr = api(action='query', list='search', srsearch=q, srnamespace=6, srlimit=12)
            files += [s['title'] for s in sr.get('query', {}).get('search', []) if s['title'] not in files]
        meta = info(files[:50], 330) if files else {}
        cand = [f for f in files if f in meta and ok(f, meta[f])][:8]
        st['cand'][k] = []
        for n, f in enumerate(cand, 1):
            data = get(meta[f]['thumb'], raw=True)
            if not data: continue
            Image.open(io.BytesIO(data)).convert('RGB').save(f'{tmp}/{k}_{n}.jpg', 'JPEG', quality=80)
            st['cand'][k].append(f.replace('File:', ''))
        print(k, p['name'][:40], len(files), '→', len(st['cand'][k]), flush=True)
        save(st)

elif mode == 'final':
    os.makedirs('assets/photos/a/th', exist_ok=True)
    for k, files in st['pick'].items():
        for n, f in enumerate(files, 1):
            name = f'{k}-{n}.jpg'
            if os.path.exists(f'assets/photos/a/{name}') and st['credits'].get(name, {}).get('file') == f: continue
            m = info(['File:' + f], 960).get('File:' + f)
            if not m: print('  sin info', f); continue
            data = get(m['thumb'], raw=True)
            if not data: continue
            im = Image.open(io.BytesIO(data)).convert('RGB')
            if im.width > 960: im = im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS)
            im.save(f'assets/photos/a/{name}', 'JPEG', quality=72, optimize=True, progressive=True)
            im.resize((480, round(im.height * 480 / im.width)), Image.LANCZOS).save(f'assets/photos/a/th/{name}', 'JPEG', quality=70, optimize=True, progressive=True)
            st['credits'][name] = dict(file=f, source=m['page'], author=m['author'], license=m['license'], category='atracción')
            print('  +', name, f[:60], flush=True)
            save(st)

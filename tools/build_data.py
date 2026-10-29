import json, math, re, sys, time, urllib.request

S = sys.argv[1]
d = json.load(open(f'{S}/all.json'))
P = {p['id']: p for p in d['places']}
ES = d['es']

def km(a, b, c, e):
    R = 6371; r = math.radians
    x = math.sin(r(c - a) / 2) ** 2 + math.cos(r(a)) * math.cos(r(c)) * math.sin(r(e - b) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))

# ---------------------------------------------------------------- paradas
# n19 / n12 = noches en cada escenario de salida (0 = no se usa)
# lodging: id iOverlander principal; alts: alternativas; attr: atracciones
# ids negativos = sitios fuera de iOverlander (web / OSM)
STOPS = [
 dict(key='cde', name='Ciudad del Este', region='Alto Paraná', seg='A', n19=2, n12=2,
      lodging=82457, alts=[293590, 405127, 17816],
      uber='Sí — Uber y Bolt operan en CDE (también Uber Moto).',
      why='Base urbana con Uber para compras, Lago de la República y los Saltos del Monday (8 km).',
      attr=[56736, 112697, 281900, 279089, -101], park=[163306, 351254, 405127]),
 dict(key='hern', name='Hernandarias · Itaipú', region='Alto Paraná', seg='A', n19=2, n12=2,
      lodging=176929, alts=[16921, 10006, 87552],
      uber='Sí — área metropolitana de CDE (Uber/Bolt).',
      why='Camping gratuito de Itaipú junto al lago. Permiso en portería lun–vie 07:00–15:00 (llegar antes de las 15 h).',
      attr=[20542, 110305, 328876, 81031, 343792], park=[16921, 27447]),
 dict(key='indep', name='Colonia Independencia', region='Guairá', seg='A', n19=2, n12=2,
      lodging=183078, alts=[62555, 387301, 108881],
      uber='No. Bolt opera en Villarrica (25 km).',
      why='Colonia alemana, vino y cerveza artesanal, Salto Suizo y la Cordillera del Ybytyruzú. Pasada por Villarrica (catedral) en el camino.',
      attr=[61517, 225364, 225365, -102], park=[198664, 190923]),
 dict(key='cord', name='Cordillera · Caacupé', region='Cordillera', seg='A', n19=3, n12=3,
      lodging=209851, alts=[62723, 361541, 86796],
      uber='Limitado. Caacupé no tiene cobertura estable; taxi local.',
      why='Basílica de Caacupé, Tobatí, Piribebuy, miradores. Pequeña Baviera tiene taller mecánico, lavarropas y vaciado sanitario.',
      attr=[164264, 286035, 421040, -103, -104], park=[164277, 195007, 342349]),
 dict(key='yag', name='Yaguarón · Paraguarí', region='Paraguarí', seg='A', n19=4, n12=4,
      lodging=212696, alts=[88540, 418319, 181527],
      uber='No (rural). Asunción a 50 km.',
      why='Iglesia franciscana de Yaguarón (s. XVIII), cerros Yaguarón, Hû y Perô, talleres ferroviarios de Sapucai, cerámica de Itá.',
      attr=[87992, 183428, 412243, 412250, 60144, -105], park=[286738, 276715]),
 dict(key='areg', name='Areguá · Lago Ypacaraí', region='Central', seg='A', n19=4, n12=4,
      lodging=405494, alts=[358460, 404406, 8693],
      uber='Sí — Gran Asunción (Uber/Bolt). Confirmar en la app.',
      why='Pueblo de artesanos y frutillas, Cerro Kõi, centro cultural del lago. San Bernardino a 15 km.',
      attr=[83966, 34279, 346116, 412068, 204190], park=[37860, 180588]),
 dict(key='asu1', name='Asunción', region='Capital', seg='A', n19=4, n12=4, anchor='2026-11-21',
      lodging=52092, alts=[8693, 348512, 89492],
      uber='Sí — Uber, Bolt y MUV. Westfalenhaus → centro 15–20 min.',
      why='Debe cubrir el 21-nov. Centro histórico, Palacio de López, Panteón, costanera, Loma San Jerónimo, Mercado 4.',
      attr=[98698, 74660, 376301, 419950, -106, -107, -108], park=[251535, 340477, 411263]),
 dict(key='pozo', name='Pozo Colorado (paso al Chaco)', region='Pdte. Hayes', seg='B', n19=1, n12=1,
      lodging=401402, alts=[70267],
      uber='No.',
      why='Pernocte de tránsito sobre la Transchaco (asfaltada). Estacionamiento de asfalto: útil si llueve.',
      attr=[], park=[]),
 dict(key='fila', name='Chaco menonita · Filadelfia', region='Boquerón', seg='B', n19=4, n12=4,
      lodging=203686, alts=[50769, 353828, 72844],
      uber='No. Tours con guía local salen frente al Hotel Florida.',
      why='Colonias menonitas (Filadelfia, Loma Plata, Neuland), museos, fauna del Chaco. Fortín Boquerón por ripio “muy bueno”; Laguna Capitán solo con guía (se inunda).',
      attr=[124420, 176978, 74466, 60704, 373029, 110200], park=[]),
 dict(key='conc', name='Concepción', region='Concepción', seg='B', n19=3, n12=3,
      lodging=49901, alts=[263084, 179315],
      uber='No (mototaxi y taxi).',
      why='Ciudad portuaria sobre el río Paraguay, arquitectura de época, Puente Nanawa. Ruta Pozo Colorado–Concepción asfaltada.',
      attr=[47397, -109], park=[179315]),
 dict(key='cora', name='PN Cerro Corá', region='Amambay', seg='B', n19=2, n12=2,
      lodging=61116, alts=[46285, 21068],
      uber='No. Pedro Juan Caballero / Ponta Porã a 35 km.',
      why='Parque histórico (fin de la Guerra de la Triple Alianza), cerros y selva. Acceso apto 2WD y vehículos pesados (sep-2026).',
      attr=[17454, 218900], park=[17454]),
 dict(key='srosa', name='Santa Rosa del Aguaray', region='San Pedro', seg='B', n19=1, n12=1,
      lodging=39589, alts=[86681, 299179],
      uber='No.',
      why='Pernocte de tránsito con ducha caliente gratis. (Laguna Blanca queda a 30 km por camino de arena/barro: no recomendada sin 4x4).',
      attr=[27445], park=[]),
 dict(key='sanber', name='San Bernardino', region='Cordillera', seg='B', n19=2, n12=2,
      lodging=347668, alts=[358460, 404406, 405494],
      uber='Limitado (Gran Asunción). Confirmar en la app.',
      why='La “Punta del Este” paraguaya: en diciembre arranca la temporada de verano. Costanera, cartel, playa del lago.',
      attr=[412068, 40294, 365185], park=[365185, 211843]),
 dict(key='asu2', name='Asunción', region='Capital', seg='B', n19=4, n12=4, anchor='2026-12-08',
      lodging=52092, alts=[8693, 348512],
      uber='Sí — Uber, Bolt y MUV.',
      why='Debe cubrir el 8-dic (Virgen de Caacupé: feriado; evitar la Ruta 2 Asunción–Caacupé del 6 al 8-dic por la peregrinación).',
      attr=[98698, 74660, -106, -107, -108], park=[251535, 340477]),
 dict(key='signa', name='San Ignacio · Misiones', region='Misiones', seg='C', n19=2, n12=1,
      lodging=287149, alts=[482, 324687],
      uber='No.',
      why='Museo jesuítico de San Ignacio, Santa María de Fe (monos en la plaza), Tañarandy. Lo de Frank: lavado de ropa gratis.',
      attr=[25391, 30799, 327040, 70847], park=[25390]),
 dict(key='ayolas', name='Ayolas · Yacyretá', region='Misiones', seg='C', n19=2, n12=0,
      lodging=332734, alts=[112129],
      uber='No.',
      why='Represa de Yacyretá (visitas guiadas), playas del Paraná, Refugio Atinguy. San Cosme y Damián (misión + observatorio) de pasada hacia Hohenau.',
      attr=[57591, 70846, 173658, 163706], park=[57591]),
 dict(key='trini', name='Trinidad · Jesús · Hohenau', region='Itapúa', seg='C', n19=3, n12=1,
      lodging=3361, alts=[240308, 15496, 61474],
      uber='No (taxi en Hohenau). Encarnación a 35 km.',
      why='Misiones de Trinidad y Jesús (Patrimonio UNESCO), mirador, ruta de la yerba mate (Pajarito, Selecta) en Bella Vista.',
      attr=[20250, 99170, 172549, 28742, 59795, 228755], park=[240308, 9062]),
 dict(key='enc', name='Encarnación', region='Itapúa', seg='C', n19=3, n12=1,
      lodging=276576, alts=[21512, 180475, 261065],
      uber='Sí — Uber, Bolt y Uber Moto.',
      why='Costanera y Playa San José (la “capital del verano”). Último pernocte en Paraguay; puente San Roque González a Posadas.',
      attr=[172718, 172719, -110], park=[21512]),
 dict(key='posadas', name='Posadas (Argentina) · Navidad', region='Misiones AR', seg='D', n19=7, n12=14, argentina=True,
      lodging=-1, alts=[-2, -3],
      uber='Sí — Uber y Didi habilitados en Posadas.',
      why='Mejor opción de Navidad accesible con salida 12 o 19-dic: Parque de las Fiestas en la costanera (árbol de 20 m, luces), restaurantes de costanera con cena de Nochebuena (con reserva) y fuegos artificiales a ambos lados del río.',
      attr=[-120, -121, -122, -123], park=[]),
]

EXTRA_OPTIONAL = [  # paradas que el usuario puede agregar desde la UI
 dict(key='yby', name='PN Ybycuí (opcional, solo con clima seco)', region='Paraguarí', seg='A', n19=2, n12=2,
      lodging=178362, alts=[173554, 57620],
      uber='No.',
      why='Saltos y selva atlántica. Los últimos km son de tierra: después de lluvia se vuelve barro (un 4x4 no pudo pasar en mayo 2026). Si llueve, no ir. Para agregarla, quitar 1 noche a Yaguarón y 1 a Areguá.',
      attr=[173553, 319219], park=[173553], optional=True),
 dict(key='lblanca', name='Laguna Blanca (requiere clima seco)', region='San Pedro', seg='B', n19=2, n12=2,
      lodging=13646, alts=[], uber='No.',
      why='Laguna de arena blanca. Ojo: 3 km de arena/barro desde la ruta; un viajero tardó 1h30 en 2WD. Estacionamiento fuera del predio, reglas de horario.',
      attr=[27445, 222205], park=[], optional=True),
 dict(key='yguazu', name='Yguazú · colonia japonesa', region='Alto Paraná', seg='A', n19=1, n12=1,
      lodging=None, alts=[], uber='No.',
      why='Templo zen, museo de la inmigración japonesa, Mundo Guaraní. Visita de paso sobre la Ruta 2 (sin camping con duchas registrado).',
      attr=[217290, 217318, 195400], park=[], optional=True),
 dict(key='nacunday', name='Saltos del Ñacunday', region='Alto Paraná', seg='A', n19=1, n12=1,
      lodging=None, alts=[], uber='No.',
      why='Parque nacional con saltos de 40 m. Verificar estado del acceso (no hay comentarios recientes sobre el camino).',
      attr=[84728], park=[], optional=True),
 dict(key='sanigmini', name='San Ignacio Miní (Argentina)', region='Misiones AR', seg='D', n19=1, n12=2, argentina=True,
      lodging=None, alts=[], uber='No.',
      why='Ruinas jesuíticas argentinas (UNESCO) a 60 km de Posadas por la RN12 asfaltada. Datos de iOverlander de Argentina no descargados: revisar camping en la app.',
      attr=[-124], park=[], optional=True),
]

# ---------------------------------------------------------------- sitios externos
EXT = {
 -1: dict(name='Camping Municipal Costa Sur (Posadas)', category='campsite', lat=-27.41557, lon=-55.8818,
          src='OpenStreetMap + prensa local (Misiones Online, jul-2025)',
          desc='Camping municipal sobre la costanera sur del Paraná (Miguel Lanús). 22 parcelas para motorhome con agua, electricidad y desagote; duchas, baños, bar con cocina. Abierto 365 días, ingreso de motorhomes 24 h. En jul-2025 entraban ~9 motorhomes por día: conviene llegar temprano o reservar para Navidad.',
          amen=dict(showers='showers_yes', restroom='restroom_running_water', electricity='electricity_at_sites', water='water_potable', big_rig_friendly='big_rig_yes', sanitation_dump='sanitation_yes'),
          cost=dict(text='Sin precio publicado en iOverlander (Argentina no está descargada en la app). Tarifa municipal “accesible”: confirmar con el complejo.', date=''),
          access='Asfalto urbano (Av. Costanera). Sin reportes de 4x4.'),
 -2: dict(name='Camping San Isidro (Posadas)', category='campsite', lat=-27.43408, lon=-55.93478, src='OpenStreetMap',
          desc='Camping registrado en OpenStreetMap sobre Av. Juan Manuel Fangio. Sin reseñas en las fuentes del proyecto: verificar en iOverlander/Google Maps.',
          amen={}, cost=dict(text='Sin dato', date=''), access='Sin reportes.'),
 -3: dict(name='Camping Nuevo Acapulco (Posadas)', category='campsite', lat=-27.41053, lon=-55.97711, src='OpenStreetMap',
          desc='Camping sobre la Ruta Nacional 12. Tel. +54 376 4767343. Sin reseñas en las fuentes del proyecto.',
          amen={}, cost=dict(text='Sin dato', date=''), access='Sobre ruta asfaltada RN12.'),
 -101: dict(name='Centro de compras de CDE (Shopping China / Paraná)', category='tourist_attraction', lat=-25.5100, lon=-54.6090, src='aprox.', desc='Zona de compras libre de impuestos junto al Puente de la Amistad. Ir en Uber: estacionar un motorhome en el microcentro es difícil.'),
 -102: dict(name='Catedral de Villarrica', category='tourist_attraction', lat=-25.7811, lon=-56.4470, src='aprox.', desc='Centro histórico de Villarrica del Espíritu Santo, de paso hacia Independencia. Estacionamiento: estadio / entrada al lago.'),
 -103: dict(name='Piribebuy (museo histórico)', category='tourist_attraction', lat=-25.4647, lon=-57.0423, src='aprox.', desc='Pueblo histórico (batalla de 1869), iglesia colonial y museo. Cerca del Salto Chololó.'),
 -104: dict(name='Tobatí · formaciones rocosas', category='tourist_attraction', lat=-25.2585, lon=-57.0810, src='aprox.', desc='Pueblo de artesanos (máscaras, cerámica) y cerros de arenisca.'),
 -105: dict(name='Itá · pueblo de la cerámica', category='tourist_attraction', lat=-25.5089, lon=-57.3631, src='aprox.', desc='Cerámica tradicional (las gallinitas de Itá). De paso hacia Asunción.'),
 -106: dict(name='Palacio de López', category='tourist_attraction', lat=-25.2800, lon=-57.6408, src='aprox.', desc='Sede del gobierno; iluminado de noche. Costanera al lado.'),
 -107: dict(name='Panteón Nacional de los Héroes', category='tourist_attraction', lat=-25.2826, lon=-57.6363, src='aprox.', desc='Ícono del centro histórico; peatonal Palma.'),
 -108: dict(name='Mercado 4', category='tourist_attraction', lat=-25.2930, lon=-57.6230, src='aprox.', desc='El mercado popular más grande: chipa, yuyos, artesanías. Ir en Uber.'),
 -109: dict(name='Costanera y puerto de Concepción', category='tourist_attraction', lat=-23.4060, lon=-57.4380, src='aprox.', desc='Atardecer sobre el río Paraguay; barcos hacia el Alto Paraguay.'),
 -110: dict(name='Costanera de Encarnación', category='tourist_attraction', lat=-27.3330, lon=-55.8700, src='aprox.', desc='Paseo de 27 km sobre el Paraná; en Navidad la gente lo llena con mesas y sillas a medianoche (Última Hora, dic-2024).'),
 -120: dict(name='Parque de las Fiestas (Posadas)', category='tourist_attraction', lat=-27.3776, lon=-55.8866, src='OSM / Misiones Online', desc='Av. Mitre y Costanera. Desde el 8-dic: árbol de 20 m, casa de Papá Noel, trineo, calesita y luces (edición 2024). Principal punto navideño de Posadas.'),
 -121: dict(name='Plaza 9 de Julio (Posadas)', category='tourist_attraction', lat=-27.3671, lon=-55.8962, src='aprox.', desc='Plaza central con árbol navideño (encendido 7–8 dic en 2025) y catedral.'),
 -122: dict(name='Costanera de Posadas · vista a Encarnación', category='tourist_attraction', lat=-27.3700, lon=-55.8800, src='aprox.', desc='A medianoche del 24 se ven los fuegos artificiales de ambas orillas. Restaurantes con cena de Nochebuena (reservar).'),
 -123: dict(name='Puente San Roque González', category='tourist_attraction', lat=-27.3570, lon=-55.8750, src='aprox.', desc='Paso fronterizo Encarnación–Posadas (aduana integrada).'),
 -124: dict(name='Ruinas de San Ignacio Miní (AR)', category='tourist_attraction', lat=-27.2556, lon=-55.5322, src='aprox.', desc='Reducción jesuítica mejor conservada de Argentina, espectáculo de luz y sonido.'),
}

# ---------------------------------------------------------------- texto
PRICE = re.compile(r'(\d{1,3}(?:[.,’\' ]\d{3})+|\b\d{2,3}\s?(?:k|K|mil)\b|\b\d+\s?(?:gs|Gs|GS|G\$|PYG|pyg|guaran\w*|reais|R\$|USD|usd|US\$|€|euros?)\b|(?:R\$|US\$|\$|€)\s?\d+)')
ROAD = re.compile(r'4x4|4wd|awd|clearance|despeje|barro|mud|muddy|arena|sand|stuck|atasc|atol|tierra|dirt|ripio|gravel|unpaved|sin pavimentar|empinad|steep|inund|flood|lluvia|rain', re.I)
FREE = re.compile(r'\b(free|gratis|gratuito|kostenlos|gratuit)\b', re.I)

def es_c(c):
    return ES.get(f"c.{c['id']}.c") or (c['comment'] or '')

def clean(t):
    return re.sub(r'\s+', ' ', t or '').strip()

def snippet(t, m, w=110):
    a = max(0, m.start() - w); b = min(len(t), m.end() + w)
    return ('…' if a else '') + t[a:b].strip() + ('…' if b < len(t) else '')

def latest_cost(p):
    cis = sorted(p['check_ins'], key=lambda c: c['when'], reverse=True)
    for c in cis:
        for txt in (clean(es_c(c)), clean(c['comment'])):
            m = PRICE.search(txt)
            if m and not re.match(r'^\d{4}$', m.group(0)):
                return dict(text=snippet(txt, m), date=c['when'][:10])
    desc = clean(ES.get(f"p.{p['id']}.d") or p['description'])
    m = PRICE.search(desc)
    if m:
        return dict(text=snippet(desc, m), date=(p['date_verified'] or '')[:10], fromDesc=True)
    for c in cis:
        t = clean(es_c(c))
        m = FREE.search(t)
        if m:
            return dict(text=snippet(t, m), date=c['when'][:10])
    cost = (p['amenities'] or {}).get('cost', 'unknown')
    lab = {'cost_free': 'Gratis (según ficha iOverlander)', 'cost_paid': 'Pago, sin monto reportado', 'cost_permit_required': 'Gratis con permiso'}.get(cost, 'Sin precio reportado')
    return dict(text=lab, date='')

def road_notes(p):
    out = []
    cis = sorted(p['check_ins'], key=lambda c: c['when'], reverse=True)
    texts = [(c['when'][:10], clean(es_c(c))) for c in cis] + [((p['date_verified'] or '')[:10] + ' (descripción)', clean(ES.get(f"p.{p['id']}.d") or p['description']))]
    for dt, t in texts:
        m = ROAD.search(t)
        if m:
            out.append(dict(date=dt, text=snippet(t, m, 140)))
        if len(out) >= 4: break
    return out

def pinfo(i):
    if i in EXT:
        e = EXT[i]
        return dict(id=i, name=e['name'], cat=e['category'], lat=e['lat'], lon=e['lon'], src=e.get('src', ''),
                    desc=e.get('desc', ''), amen=e.get('amen', {}), cost=e.get('cost'), road=[], access=e.get('access', ''),
                    comments=[], n=0, verified='', ext=True)
    p = P[i]
    cis = sorted(p['check_ins'], key=lambda c: c['when'], reverse=True)
    com = []
    for c in cis[:6]:
        t = clean(es_c(c))
        if t: com.append(dict(date=c['when'][:10], text=t[:600], veh=((c.get('vehicle') or {}).get('vehicle_type') or '')))
    am = {k: v for k, v in (p['amenities'] or {}).items() if v != 'unknown'}
    return dict(id=i, guid=p.get('guid'), name=p['name'], cat=p['category'], lat=p['latitude'], lon=p['longitude'], city=p['city'] or '',
                desc=clean(ES.get(f"p.{i}.d") or p['description'])[:900], amen=am, phone=p.get('phone'), web=p.get('website'),
                cost=latest_cost(p), road=road_notes(p), comments=com, n=len(cis), verified=(p['date_verified'] or '')[:10],
                open=p['open'], last=cis[0]['when'][:10] if cis else '')

# ---------------------------------------------------------------- curaduría (acceso y costo verificados a mano)
CUR = {
 82457: dict(access='ok', note='Dentro de la ciudad, entrada asfaltada; estacionamiento en césped o asfalto, nivelado. Admite >8 m.',
             cost='75.000 Gs por vehículo/noche (no por persona) — 19-oct-2026'),
 293590: dict(access='warn', note='“La entrada y salida pueden complicarse con lluvia o barro: mejor con tiempo seco” (jun-2026). Portón algo estrecho para camiones.',
              cost='100.000 Gs por persona/noche (jun-2026); 100 R$ por persona (oct-2026)'),
 176929: dict(access='ok', note='Asfalto (costanera de Itaipú). Ingresar por el estacionamiento de visitantes y pedir permiso en portería.',
              cost='Gratis con permiso de Itaipú (oct-2026)'),
 10006: dict(access='warn', note='8 km de acceso de tierra: “una pequeña aventura con lluvia” (may-2026). Permiso previo en el Centro Ambiental.', cost='Gratis con permiso (sep-2026)'),
 183078: dict(access='ok', note='En el pueblo, sin menciones de 4x4 ni barro. Apto big rig.', cost='Gratis — se espera que comas en su restaurante alemán (sep-2026). Cerrado sábados y lunes.'),
 62555: dict(access='ok', note='El motorhome queda en el estacionamiento de afuera (ago-2026).', cost='75.000 Gs por persona con desayuno (ago-2026)'),
 209851: dict(access='ok', note='Sin menciones de 4x4. En la pradera “hay que cuidar el suelo blando” si llovió: usar la zona firme.',
              cost='40.000 Gs por vehículo + 30.000 Gs por persona (ficha 2026); WhatsApp +595 991 361241'),
 62723: dict(access='ok', note='Explanada de grava “perfecta también cuando está mojado”. Ruido de ruta.', cost='100.000 Gs vehículo + 2 personas (ago-2025)'),
 212696: dict(access='ok', note='Sin menciones de caminos difíciles; ubicación corregida en iOverlander.', cost='50.000 Gs por persona (jul-2026)'),
 88540: dict(access='ok', note='Sin menciones de 4x4.', cost='30.000 Gs por persona (jul-2025); otro viajero pagó 110.000/noche (dic-2024)'),
 178362: dict(access='bad', note='Camino de tierra: “demasiado embarrado por las lluvias, no pudimos pasar con nuestro 4x4” (may-2026). Con seco sí (jun-2026). Ir solo tras varios días sin lluvia.',
              cost='95.000 Gs entrada + camper 2 personas (jul-2026)'),
 405494: dict(access='ok', note='Barrio suburbano de Areguá, calles urbanas.', cost='80.000 Gs por dos en camper/día (24-oct-2026)'),
 358460: dict(access='ok', note='Avisar por WhatsApp: una vez el portón estaba con candado (may-2026).', cost='70.000 Gs por persona (may-2026)'),
 8693: dict(access='warn', note='Último tramo sin pavimentar desde la estación de servicio (reporte 2016). Solo efectivo.', cost='120.000 Gs por 2 personas (abr-2026); lavado 25.000'),
 52092: dict(access='ok', note='Estacionamiento frente al hotel, apto para todo tamaño. Uber al centro 15–20 min.', cost='110.000 Gs por noche, 2 personas en camper (ago-2026)'),
 401402: dict(access='ok', note='Estacionamiento de asfalto, “bueno si llueve” (las otras estaciones se embarran).', cost='Gratis (sep-2026)'),
 70267: dict(access='warn', note='Las estaciones vecinas estuvieron en obra con acceso muy embarrado (jun-2026).', cost='Gratis (sep-2026)'),
 203686: dict(access='ok', note='Ciudad, calles asfaltadas. Cuidar objetos afuera (robo de calzado, oct-2026).', cost='50.000 Gs por noche (5-oct-2026); otro reporte 100.000 por campervan (ago-2026)'),
 72844: dict(access='bad', note='“16 km de camino malo”, arenoso y muy embarrado con lluvia. No recomendado sin 4x4.', cost='30.000 Gs por persona (mar-2025)'),
 49901: dict(access='warn', note='Calle tranquila céntrica. Estacionamiento interno solo hasta 5 m: un motorhome de 6–8 m queda en la vereda de enfrente con agua y luz.', cost='30.000 Gs por persona acampando (2022, último precio publicado)'),
 263084: dict(access='warn', note='Patio de casa: “solo espacio para un vehículo pequeño” (may-2026). Confirmar por WhatsApp +595 986 367012.', cost='50.000 Gs por persona/noche (ene-2024)'),
 179315: dict(access='ok', note='Gran playa de estacionamiento detrás de la estación. Duchas muy deterioradas (abr-2025).', cost='20.000 Gs estacionamiento + 5.000 ducha (jul-2024)'),
 61116: dict(access='ok', note='“Acceso posible incluso con vehículo pesado o 2WD” (sep-2026). Baños rústicos.', cost='55.000 Gs para dos (sep-2026): entrada 20.000 pp + vehículo 15.000 + camping 20.000'),
 39589: dict(access='ok', note='Estación sobre ruta asfaltada.', cost='Gratis, duchas calientes gratis (sep-2026)'),
 13646: dict(access='bad', note='3 km de arena/barro desde la ruta; con lluvia, complicado sin 4x4.', cost='30.000 Gs por persona/noche + 10.000 pp/día (jun-2026)'),
 347668: dict(access='ok', note='Calle que termina en el lago, a 100 m del cartel. Baños y duchas diurnos pagos.', cost='Muy económico, sin monto (ago-2025)'),
 287149: dict(access='ok', note='Sin menciones de 4x4. Refugio seguro en tormenta (sep-2025).', cost='Gratis (se paga solo la electricidad; donación bienvenida) — sep-2025'),
 482: dict(access='ok', note='Pradera para campers, apto big rig.', cost='Sin monto reportado'),
 332734: dict(access='ok', note='Sin menciones de 4x4. Perros sueltos (sep-2026).', cost='50.000 Gs por motorhome/noche (may-2026)'),
 112129: dict(access='ok', note='Área plana de césped.', cost='50.000 Gs por noche (ago-2025); parrilla aparte'),
 3361: dict(access='ok', note='Big rigs junto al salón de eventos (más nivelado). Cerrado los lunes: avisar por WhatsApp.', cost='60.000 Gs por persona; 30.000 desde la 3.ª noche (ficha 2026)'),
 240308: dict(access='ok', note='Junto a la misión de Trinidad.', cost='30.000 Gs para dos (may-2026)'),
 276576: dict(access='ok', note='Parcelas asfaltadas con luz y agua (jul-2026). Agua caliente a veces no funciona.', cost='100.000 Gs por 2 personas + motorhome (jul-2025), negociable'),
 21512: dict(access='warn', note='Desde jun-2026 a veces piden a los motorhomes salir de la costanera (eventos). Útil para visitar la playa de día.', cost='Gratis estacionar; baño 2.000, ducha 5.000'),
}

# ---------------------------------------------------------------- lavanderías
LAUNDRY = []
for p in d['places']:
    if p['category'] == 'laundry':
        cis = sorted(p['check_ins'], key=lambda c: c['when'], reverse=True)
        note = clean(es_c(cis[0]))[:200] if cis else clean(ES.get(f"p.{p['id']}.d") or p['description'])[:200]
        LAUNDRY.append(dict(name=p['name'], lat=p['latitude'], lon=p['longitude'], src='iOverlander', id=p['id'], note=note))
for e in json.load(open(f'{S}/osm.json'))['elements']:
    t = e['tags']
    if 'shop' not in t: continue
    la = e.get('lat') or e['center']['lat']; lo = e.get('lon') or e['center']['lon']
    LAUNDRY.append(dict(name=t.get('name') or 'Lavandería (sin nombre en OSM)', lat=la, lon=lo, src='OpenStreetMap', ar=(t.get('addr:city') == 'Posadas' or la < -27.355),
                        note=' · '.join(x for x in [t.get('addr:street', ''), t.get('opening_hours', ''), t.get('phone', '')] if x)))

def onsite_laundry(i):
    if i in P:
        v = (P[i]['amenities'] or {}).get('laundry', '')
        return {'laundry_paid': 'Lavarropas en el camping (pago)', 'laundry_free': 'Lavarropas en el camping (gratis)'}.get(v)
    return None

# ---------------------------------------------------------------- armar
used = set()
def add(i):
    if i is not None: used.add(i)

for st in STOPS + EXTRA_OPTIONAL:
    for i in [st['lodging']] + st['alts'] + st['attr'] + st['park']: add(i)
    ref = st['lodging'] if st['lodging'] is not None else st['attr'][0]
    rp = pinfo(ref)
    st['lat'], st['lon'] = rp['lat'], rp['lon']
    near = sorted(((km(st['lat'], st['lon'], l['lat'], l['lon']), l) for l in LAUNDRY if bool(l.get('ar')) == bool(st.get('argentina'))), key=lambda x: x[0])
    st['laundry'] = [dict(l, km=round(k, 1)) for k, l in near if k <= 25][:4]
    st['onsite'] = [x for x in [(onsite_laundry(j), j) for j in [st['lodging']] + st['alts']] if x[0]]

places = {i: pinfo(i) for i in used}
for i, c in CUR.items():
    if i in places:
        places[i]['cur'] = c

# ---------------------------------------------------------------- rutas OSRM
def osrm(a, b):
    url = f"https://router.project-osrm.org/route/v1/driving/{a[1]},{a[0]};{b[1]},{b[0]}?overview=simplified&geometries=geojson"
    for _ in range(3):
        try:
            r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'trip-planner/1.0'}), timeout=40))
            rt = r['routes'][0]
            return dict(km=round(rt['distance'] / 1000), min=round(rt['duration'] / 60),
                        geo=[[round(y, 4), round(x, 4)] for x, y in rt['geometry']['coordinates']])
        except Exception as ex:
            time.sleep(2)
    return None

START = dict(lat=-25.5090, lon=-54.6020)  # Puente de la Amistad (llegada desde Foz)
legs = {}
seq = [s for s in STOPS]
pairs = set()
for sc in ('n19', 'n12'):
    act = [s for s in seq if s[sc] > 0]
    for a, b in zip(act, act[1:]): pairs.add((a['key'], b['key']))
byk = {s['key']: s for s in STOPS + EXTRA_OPTIONAL}
for a, b in sorted(pairs):
    r = osrm((byk[a]['lat'], byk[a]['lon']), (byk[b]['lat'], byk[b]['lon']))
    if r: legs[f'{a}|{b}'] = r
    print(a, b, r and r['km'], file=sys.stderr)
    time.sleep(0.5)

out = dict(stops=STOPS, optional=EXTRA_OPTIONAL, places=places, legs=legs, generated='2026-10-27',
           laundryAll=LAUNDRY)
json.dump(out, open(f'{S}/data.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('places', len(places), 'legs', len(legs), 'bytes', len(json.dumps(out, ensure_ascii=False)))

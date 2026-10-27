# Ruta Paraguay en motorhome

Plan de viaje interactivo (iPhone primero) por los sitios más representativos de Paraguay en motorhome de 6–8 m sin 4x4.
Ruta: Ciudad del Este (1‑nov) → Asunción (21‑nov) → Chaco y norte → Asunción (8‑dic) → Misiones → Posadas, Argentina (salida 12 o 19‑dic) para Navidad.

- **Campings con baño y ducha**, accesos verificados en los comentarios de iOverlander, costo más reciente reportado, lavanderías y estacionamientos.
- **Check-in compartido**: cualquiera con la clave del viaje registra llegada, salida, hospedaje (incluido uno no listado, con GPS), costo pagado, calificación y comentario.
- **Recálculo automático**: cada check-in mueve las fechas de lo que sigue. Si un atraso pone en riesgo *Asunción 21‑nov*, *Asunción 8‑dic* o la *fecha de salida*, el plan recorta o suma noches a las paradas siguientes solo.
- **Plan compartido**: noches, orden y hospedaje elegido se sincronizan entre teléfonos.

Sitio estático (HTML + JS sin compilación). Datos compartidos en Supabase.

## Estructura

```
index.html            página única
config.js             URL y clave pública de Supabase
assets/app.js|css     interfaz y lógica (línea de tiempo, reajuste, check-ins, mapa)
assets/data.js        datos generados: paradas, sitios iOverlander, rutas OSRM, fotos y créditos
assets/photos/        fotos de Wikimedia Commons (1280 px) y th/ (miniaturas)
supabase/schema.sql   tablas, seguridad y funciones
tools/                scripts para regenerar datos y fotos
```

## Configurar Supabase (una vez, ~5 min)

1. Crear un proyecto gratis en <https://supabase.com>.
2. **SQL Editor → New query**: pegar `supabase/schema.sql`, cambiar `CAMBIA-ESTA-CLAVE` por la clave del viaje y ejecutar (**Run**).
3. **Project Settings → API**: copiar *Project URL* y la clave *anon public* en `config.js`.
4. Compartir la clave del viaje solo con quienes harán check-in.

Seguridad: la clave *anon* es pública por diseño. Cualquiera con el link puede **ver** el plan y los check-ins (el repo es público). Para **escribir** hace falta la clave del viaje: se valida dentro de la base (funciones `save_checkin`, `save_plan`) y nunca viaja en el código. Las tablas no aceptan escrituras directas.

Sin `config.js` configurado el sitio funciona en **modo local** (los check-ins quedan en ese teléfono).

## Publicar con GitHub Pages

Settings → Pages → *Deploy from a branch* → `main` / `(root)`. El sitio queda en `https://<usuario>.github.io/<repo>/`.
En el iPhone: abrir en Safari → Compartir → *Agregar a pantalla de inicio*.

## Uso

- **+ (botón rosa)**: check-in en la próxima parada, o registrar salida si ya están en una.
- **Plan → Editar noches y orden**: cambia la propuesta del grupo; el reajuste automático muestra `Ajustado 4→3` cuando tuvo que corregir.
- Una parada planificada sin check-in, anterior al último check-in, se marca como *Omitida*.
- Para probar fechas: agregar `?hoy=2026-11-14` a la URL.

## Regenerar datos

```
python tools/build_data.py <scratch>   # sitios, costos, accesos, lavanderías y rutas (requiere la base offline de iOverlander)
python tools/photos.py assets/photos tools/photos.json   # fotos de Wikimedia Commons (respeta límites)
python tools/package.py                # genera assets/data.js
```

## Fuentes y créditos

- Sitios: base offline de iOverlander (comentarios hasta oct‑2026). Las fotos de usuarios de iOverlander **no** se republican; cada ficha enlaza a iOverlander. Los comentarios se muestran recortados.
- Fotos: Wikimedia Commons, con autor y licencia en la sección *Créditos* del sitio.
- Rutas: OSRM / OpenStreetMap. Lavanderías y campings de Posadas: OpenStreetMap. Mapa: Esri.
- Navidad: Canal 12 Misiones, Misiones Online, Última Hora (enlaces en la sección Navidad).

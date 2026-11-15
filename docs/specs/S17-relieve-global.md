---
id: S17
titulo: Relieve en toda la Luna
title: Relief across the whole Moon
estado: hecha
dia: 7
prioridad: recortable
depende: S06, S11, S13
resumen: Los sitios fuera del polo sur, como los del programa Apollo, tienen horizonte con relieve real y vista 3D, igual que los del polo.
summary: Sites away from the south pole, such as those of the Apollo programme, have a horizon with real relief and a 3D view, like the polar ones.
---

<a id="en"></a>
**English** | [Español](#es)

# S17: Relief across the whole Moon

## Problem

Since [S13](S13-catalogo-y-polo-norte.md), the catalogue has 25 sites away from the south pole: Apollo, Luna, Surveyor, Chang'e, SLIM, Chandrayaan-3 and Blue Ghost. The server only has topography from 75°S to the pole. So, north of 80°S:

- The horizon is that of a smooth sphere and the panorama comes out flat.
- The 3D view of [S11](S11-vista-3d.md) is disabled.
- The status says "using a smooth Moon".

When `main` was tried on 15 November, the first thing missed was the relief of Apollo 11.

Without relief, the comparison between sites is unfair: a site surrounded by mountains, such as Apollo 15 or Apollo 17, looks as open as a plain.

## Result

Done on 15 November. All 12 criteria are met.

| Criterion | Result |
| --- | --- |
| 1. Apollo 15 | Mons Hadley is seen at 11.0° (azimuth 44°, 19.7 km away) and Hadley Delta at 13.3° (azimuth 178°, 10.9 km away) |
| 2. Apollo 17 | The North Massif is seen at 13.7° (6.2 km away) and the South Massif at 7.0° (11.6 km away) |
| 3. Apollo 11 | The highest point of the horizon is at 0.97° |
| 4. Polar grid against global | The medians are 0.06°, 0.35°, 0.03°, 0.48° and 0.05° at the five points. The 0.48° one is tight: near the site the 474 m north-south cells weigh in |
| 5. Custom point with the grid | "474 m LOLA" and 3D view at 10°N 10°E |
| 6. Catalogue without the grid | Apollo 11 and Apollo 15 show "474 m LOLA (precomputed)", and the 3D view loads "Terrain 474 m (precomputed)" |
| 7. Custom point without the grid | Smooth Moon and 3D button disabled, with its explanation |
| 8. Cost | A horizon takes 89 ms with the cache empty and 25 ms with it full; a 64 km patch, 11 ms |
| 9. Polar sites | The 12 sites do not change (0.0000°) and their patches are identical. Measured with the 240 m grid; the files precomputed with the fine grids were not touched |
| 10. Memory | The cache fills up at 32 MB, and the process grows 44 MB after the 75 catalogue horizons |
| 11. Repository | 7.4 MB new: 872 KB of horizons and 6.5 MB of patches |
| 12. Looking up | The camera reaches 85° and Earth can be seen at Apollo 11 |

Checked with:

- Tests without data: [globalDem.test.js](../../tests/globalDem.test.js) (16 tests, on synthetic grids).
- Tests with the real grid: [globalTerrain.test.js](../../tests/globalTerrain.test.js) (7 tests, which skip themselves if it is missing).
- Browser test: [s17-relieve-global.mjs](../../e2e/s17-relieve-global.mjs) (11 checks; the one for criterion 5 needs `E2E_GLOBAL=1`).

**Download.** With 16 connections in parallel, the 531 MB came down at between 320 and 400 KB/s, in about 25 minutes. With a single connection it ran at 37 KB/s.

**What you see.** At Apollo 15 and Apollo 17, the mountains close the horizon, in the 3D view too. Apollo 11 is a plain with almost no shadows when the Sun is high, as befits the Sea of Tranquility at midday.

**Not done:** the comparison by hand with the missions' panoramic photos.

## What the user will see

- **Catalogue sites away from the pole.** The panorama draws their real horizon and the status says "LOLA terrain 474 m (precomputed)". It works on any copy of the project, with nothing more to download.
- **"View in 3D" is enabled at those sites.**
  - Apollo 15 and Apollo 17 show the mountains around them.
  - Apollo 11 looks almost flat, as the Sea of Tranquility is.
  - You can look up nearly to the zenith, because far from the pole the Sun and Earth climb high in the sky.
- **Custom points.** With the global topography installed (`npm run fetch-data -- --global`, 531 MB), any point on the Moon has relief and a 3D view. Without it, a custom point away from the pole stays with the smooth Moon, and the status says so.
- **What does not change.** The shadow map is still that of the south pole. The point search ([S04](S04-buscador-de-puntos.md)) and permanent shadow ([S16](S16-sombra-permanente.md)) stay limited to 80°S–90°S. For the rest of the Moon there is the Globe view.

**The limit is stated plainly:** the cells are 474 m. You see the mountains, the craters more than a couple of kilometres across and the general shape of the terrain. You do not see rocks or craters a few hundred metres across, such as West, the one Eagle steered around on landing.

## Design

**Data.** Checked on 15 November 2026 on NASA's PDS, in `lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/`:

| Product | Cell | Coverage | Size | Format |
| --- | --- | --- | --- | --- |
| `LDEM_64` (v3.1, 2019) | 1/64° (473.8 m at the equator) | Whole Moon | 531 MB (530 841 600 bytes) | 23 040 × 11 520 little-endian 16-bit integers, in simple cylindrical projection. Row 0 is at 90°N and column 0 at 0°E |

- The height is DN × 0.5 m above the 1737.4 km sphere, the same reference as the polar grids. The two can be mixed with no conversion.
- The server accepts range requests, so the download resumes like the others.
- `LDEM_128` (237 m, 2.1 GB) was ruled out: it quadruples the download. The distant horizon, which is what draws the mountains of the panorama, barely changes, and near the site the procedural detail of the 3D view already gives texture.

**Reading without loading the whole file.** New `server/globalDem.js`:

- If `server/data/ldem_64.img` exists, it reads blocks of 256 × 256 cells (4° × 4°, 128 KB) only when they are needed. It caches the last 256 blocks (32 MB), so the server does not reserve 531 MB.
- `globalHeightAt(latDeg, lonDeg)` gives the height in km, with bilinear interpolation:
  - It wraps around at longitude 0°/360°.
  - Next to the poles, it stays on the last row.
  - It gives NaN if the file is not there.
- It also exports `globalDemAvailable()`, and the path and size of the grid as parameters, so it can be tested with a small synthetic file.

**A single height function.** New `heightAtUnit(x, y, z)` in [dem.js](../../server/dem.js): it takes a point on the unit sphere and returns its height in km.

- It uses the finest polar grid that contains the point.
- Outside the polar grids, it uses the global one.
- If there is none, it returns NaN.

Alongside it, `terrainResolutionAt(lat, lon)` gives the cell that will be used at the site: 20 to 240 m at the pole, 474 m elsewhere, or `null`.

**Horizon** ([horizon.js](../../server/horizon.js)):

- `computeHorizon` stops looking at the latitude. If there is terrain at the site, it casts the rays with `heightAtUnit`; if not, it uses the smooth sphere, as now.
- The ray is no longer cut on leaving the polar grid at 75°S: if the global one is installed, it carries on over it. At the polar catalogue sites nothing measurable changes, because at that distance the curvature sinks the terrain further than the mountains are tall (criterion 9).
- The ray starts and advances half a cell, as now: 237 m away from the pole.

**3D patches** ([patch.js](../../server/patch.js)). `heightFn` takes the point on the unit sphere instead of polar map coordinates, and defaults to `heightAtUnit`. The rest of the computation already holds at any latitude.

**Server** ([app.js](../../server/app.js)):

- `/api/patch` stops answering 400 north of 80°S. It answers 503 only if at that point there is neither installed terrain nor a precomputed patch.
- `/api/horizon` and `/api/patch` look for the precomputed one at any latitude. They use it if its cell is finer than the one installed at that point, or if there is no terrain installed there.
- `/api/health` adds `globalDem: true | false`. `coverageMaxLat` stays: it is still the limit of the point search and the polar map.
- `LUMINA_GLOBAL=0` leaves the global grid off even if it is installed, like `LUMINA_HIRES=0` with the fine grids.
- The point search turns it off in its worker threads. That way its results do not change and each thread saves the block cache.

**Download** ([fetch-data.mjs](../../scripts/fetch-data.mjs)):

- New `--global` option, which downloads `ldem_64.img` and its label to `server/data/`. Git already ignores the `.img` files in that folder.
- Files of 16 MB or more are downloaded in 1 MB pieces over 16 connections at once, and a `.pieces` file records the finished pieces so it can resume.
- The reason: on 15 November NASA's server gave 30 to 40 KB/s per connection, and 512 KB/s with 16 connections. With a single one, the 531 MB would take about 4 hours. With 4 MB pieces, the 16 connections ran into the timeout.

**Precomputing the 25 sites** ([precompute-horizons.mjs](../../scripts/precompute-horizons.mjs)):

- Today it requires the fine polar grids and deletes all the files before starting. It becomes two independent parts:
  - The polar sites, if the fine grids are there.
  - The others, if the global grid is there.
- Each part redoes only the files of its sites and reports the part it skips. The `index.json` of the patches is merged instead of rewritten.
- Each site away from the pole carries 3 horizons and 2 patches. In total that is about 0.9 MB of horizons and 6.6 MB of patches; the polar ones take 0.4 MB and 3.2 MB today.
- One person alone runs `npm run fetch-data -- --global` and `npm run precompute`, and pushes the files. The rest of the team downloads nothing.

**Interface:**

- [App.tsx](../../src/App.tsx): the 3D view is blocked only when the horizon is not from real terrain (`horizon.model !== 'lola'`), not by latitude. Text: "This point has no topography on the server, and the 3D view needs real terrain."
- [Panels.tsx](../../src/components/Panels.tsx): "Outside terrain coverage (80°S to 90°S): using a smooth Moon" becomes "No topography for this point: using a smooth Moon". The permanent shadow line does not change.
- [Export.tsx](../../src/components/Export.tsx): the report's limits say "real terrain with cells of 20 to 240 m at the south pole and of 474 m elsewhere".
- [terrain3d.ts](../../src/lib/terrain3d.ts): `PITCH_MAX` goes from 60° to 85°. Far from the pole, the Sun passes near the zenith and Earth is fixed and high in the sky (about 66° at Apollo 11). With the 60° limit they could not be seen.
- The view still opens towards the Sun, but tilted 15° at most (`START_PITCH_MAX`). With the Sun near the zenith, opening while looking at it left the ground off the screen, because the camera sees 30° above and below its tilt. 25° was tried first, but on the plain of Apollo 11 the ground ended up behind the controls bar. At the polar sites nothing changes, because there the Sun does not go above about 7°.
- [Terrain3D.tsx](../../src/components/Terrain3D.tsx) publishes the camera tilt in `data-pitch`, for the browser test.
- The shareable link gains no parameters.

**Existing documentation and tests:**

- In [S11](S11-vista-3d.md), the criterion "disabled north of 80°S" becomes "disabled where there is no topography".
- The browser flows of S06 and S11 check the smooth Moon with a custom point at 10°N, instead of with Apollo 11.
- `npm run e2e` starts its server with `LUMINA_GLOBAL=0`, to give the same results on any machine. With `E2E_GLOBAL=1` it also starts another server with the global grid, for criterion 5.

## Acceptance criteria

With the global grid installed:

1. Apollo 15 (Hadley-Apennine): the horizon exceeds 5° towards Mons Hadley (north-east) and towards Hadley Delta (south).
2. Apollo 17 (Taurus-Littrow): it exceeds 5° towards the North Massif and towards the South Massif.
3. Apollo 11: it does not go above 3° in any direction.
4. At five points between 77°S and 79°S, where there is a polar and a global grid, the horizons computed with each differ by under 0.5° in the median over the directions.
5. A custom point at 10°N 10°E has a terrain horizon ("474 m LOLA") and a 3D view.

Without the global grid (clean clone and `npm run fetch-data`):

6. The 25 catalogue sites away from the pole show "474 m LOLA (precomputed)" and open the 3D view.
7. A custom point at 10°N 10°E stays with the smooth Moon, and the 3D view button is disabled and explains why.

Always:

8. On the development laptop, a global horizon of 720 directions takes under 1.5 s with the cache empty and under 0.5 s with the cache full, and a 64 km patch under 1 s.
9. The polar sites do not change: their 36 precomputed horizons differ by under 0.01° from the current ones, and their patches are identical.
10. The global grid adds under 64 MB of memory to the server.
11. The new precomputed files take under 8 MB.
12. In the 3D view of Apollo 11 you can look up to 85° of elevation and find Earth.

## Tests

- **Automated, with no downloads:**
  - `globalDem.js` with a small synthetic file: orientation of rows and columns, scale, wrap at 0°/360° and poles.
  - The horizon over a flat global grid equals that of the smooth sphere.
  - A synthetic cone at a known distance gives the expected elevation.
  - The patch works with the new `heightFn`.
  - The routes, with precomputed files and without terrain (criteria 6 and 7 on the server).
  - Precomputing one part does not delete the files of the other.
- **With the global grid:** criteria 1 to 5 and 8 to 10, in a test file that skips itself if the grid is missing, like [hiresTerrain.test.js](../../tests/hiresTerrain.test.js).
- **In the browser:** a new flow, `e2e/s17-relieve-global.mjs`, for criteria 6, 7 and 12. [s11-vista-3d.mjs](../../e2e/s11-vista-3d.mjs) is updated as well.
- **By hand:** compare the panorama of Apollo 15 and Apollo 17 with the missions' panoramic photos, in the Apollo Lunar Surface Journal.

## Out of scope

- **More detail than 474 m:** `LDEM_128` (237 m, 2.1 GB), SLDEM2015 (about 60 m, between 60°N and 60°S) or the LROC NAC models, a few metres per cell, which exist for the Apollo sites. They could be added later with the same `heightAtUnit`.
- **The shadow map** of other regions or of the north pole.
- **The point search and permanent shadow** away from the south pole.
- **Rocks and small craters.**

## Risks

- **The download is slow.** With a single connection, NASA's server gives 37 to 60 KB/s, and 531 MB would take up to 4 hours. That is why `fetch-data` downloads large files over 16 connections, and that way it took about 25 minutes. It is optional, it resumes if it is cut off and only whoever precomputes needs it; the rest of the team uses the files in the repository.
- **Up close, 474 m disappoints.** The nearby ground looks smooth, and Apollo 11 will look almost flat. The indicator states the resolution ("Terrain 474 m") and the procedural detail of S11 gives texture. The sites that shine are those surrounded by mountains, such as Apollo 15 and Apollo 17.
- **The repository grows by about 7.5 MB** with the precomputed files. If that is a nuisance, the patches can be stored compressed with `zlib`, which comes with Node and is not a new dependency.
- **Two grids are mixed.** Both are from LOLA and use the same sphere, but they have different dates and cells: at the edge there can be a step of a few metres. Criterion 4 checks that the horizon does not change.
- **Near the poles, the cylindrical grid narrows its cells from east to west:** at 85° of latitude they are 41 m wide and still 474 m from north to south. It has no effect: in the south the polar grid rules, and in the north there are no catalogue sites.

---

<a id="es"></a>
**Español** | [English](#en)

# S17: Relieve en toda la Luna

## Problema

Desde [S13](S13-catalogo-y-polo-norte.md), el catálogo tiene 25 sitios fuera del polo sur: Apollo, Luna, Surveyor, Chang'e, SLIM, Chandrayaan-3 y Blue Ghost. El servidor solo tiene topografía de 75°S al polo. Por eso, al norte de 80°S:

- El horizonte es el de una esfera lisa y el panorama sale plano.
- La vista 3D de [S11](S11-vista-3d.md) está desactivada.
- El estado dice "se usa una Luna lisa".

Al probar `main` el 15 de noviembre, lo primero que se echó en falta fue el relieve de Apollo 11.

Sin relieve, la comparación entre sitios es injusta: un sitio rodeado de montañas, como Apollo 15 o Apollo 17, parece tan despejado como una llanura.

## Resultado

Hecha el 15 de noviembre. Se cumplen los 12 criterios.

| Criterio | Resultado |
| --- | --- |
| 1. Apollo 15 | Mons Hadley se ve a 11.0° (azimut 44°, a 19.7 km) y Hadley Delta a 13.3° (azimut 178°, a 10.9 km) |
| 2. Apollo 17 | El North Massif se ve a 13.7° (a 6.2 km) y el South Massif a 7.0° (a 11.6 km) |
| 3. Apollo 11 | El punto más alto del horizonte está a 0.97° |
| 4. Malla polar contra global | Las medianas son 0.06°, 0.35°, 0.03°, 0.48° y 0.05° en los cinco puntos. La de 0.48° va justa: cerca del sitio pesan las celdas de 474 m de norte a sur |
| 5. Punto propio con la malla | "LOLA de 474 m" y vista 3D a 10°N 10°E |
| 6. Catálogo sin la malla | Apollo 11 y Apollo 15 muestran "LOLA de 474 m (precalculado)", y la vista 3D carga "Terreno 474 m (precalculado)" |
| 7. Punto propio sin la malla | Luna lisa y botón 3D desactivado, con su explicación |
| 8. Coste | Un horizonte tarda 89 ms con la caché vacía y 25 ms con ella llena; un parche de 64 km, 11 ms |
| 9. Sitios polares | Los 12 sitios no cambian (0.0000°) y sus parches son idénticos. Medido con la malla de 240 m; los archivos precalculados con las mallas finas no se tocaron |
| 10. Memoria | La caché se llena en 32 MB, y el proceso crece 44 MB después de los 75 horizontes del catálogo |
| 11. Repositorio | 7.4 MB nuevos: 872 KB de horizontes y 6.5 MB de parches |
| 12. Mirar arriba | La cámara llega a 85° y la Tierra se ve en Apollo 11 |

Comprobado con:

- Pruebas sin datos: [globalDem.test.js](../../tests/globalDem.test.js) (16 pruebas, sobre mallas sintéticas).
- Pruebas con la malla real: [globalTerrain.test.js](../../tests/globalTerrain.test.js) (7 pruebas, que se saltan si falta).
- Prueba de navegador: [s17-relieve-global.mjs](../../e2e/s17-relieve-global.mjs) (11 comprobaciones; la del criterio 5 necesita `E2E_GLOBAL=1`).

**Descarga.** Con 16 conexiones en paralelo, los 531 MB bajaron a entre 320 y 400 KB/s, en unos 25 minutos. Con una sola conexión iba a 37 KB/s.

**Lo que se ve.** En Apollo 15 y Apollo 17, las montañas cierran el horizonte, también en la vista 3D. Apollo 11 es una llanura casi sin sombras con el Sol alto, como corresponde al Mar de la Tranquilidad a mediodía.

**Sin hacer:** la comparación a mano con las fotos panorámicas de las misiones.

## Qué verá el usuario

- **Sitios del catálogo fuera del polo.** El panorama dibuja su horizonte real y el estado dice "Terreno LOLA 474 m (precalculado)". Funciona en cualquier copia del proyecto, sin descargar nada más.
- **"Ver en 3D" se activa en esos sitios.**
  - Apollo 15 y Apollo 17 muestran las montañas que los rodean.
  - Apollo 11 se ve casi llano, como es el Mar de la Tranquilidad.
  - Se puede mirar hasta casi el cenit, porque lejos del polo el Sol y la Tierra suben alto en el cielo.
- **Puntos propios.** Con la topografía global instalada (`npm run fetch-data -- --global`, 531 MB), cualquier punto de la Luna tiene relieve y vista 3D. Sin ella, un punto propio fuera del polo sigue con la Luna lisa, y el estado lo dice.
- **Lo que no cambia.** El mapa de sombras sigue siendo el del polo sur. El buscador de puntos ([S04](S04-buscador-de-puntos.md)) y la sombra permanente ([S16](S16-sombra-permanente.md)) siguen limitados a 80°S–90°S. Para el resto de la Luna está la vista Globo.

**El límite se dice claro:** las celdas son de 474 m. Se ven las montañas, los cráteres de más de un par de kilómetros y la forma general del terreno. No se ven rocas ni cráteres de unos cientos de metros, como West, el que el Eagle esquivó al alunizar.

## Diseño

**Datos.** Comprobado el 15 de noviembre de 2026 en el PDS de NASA, en `lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/`:

| Producto | Celda | Cobertura | Tamaño | Formato |
| --- | --- | --- | --- | --- |
| `LDEM_64` (v3.1, 2019) | 1/64° (473.8 m en el ecuador) | Luna entera | 531 MB (530 841 600 bytes) | 23 040 × 11 520 enteros de 16 bits little-endian, en proyección cilíndrica simple. La fila 0 está en 90°N y la columna 0 en 0°E |

- La altura es DN × 0.5 m sobre la esfera de 1737.4 km, la misma referencia que las mallas polares. Las dos se pueden mezclar sin conversión.
- El servidor admite descargas por partes, así que la descarga se reanuda como las demás.
- Se descartó `LDEM_128` (237 m, 2.1 GB): cuadruplica la descarga. El horizonte lejano, que es lo que dibuja las montañas del panorama, apenas cambia, y cerca del sitio ya da textura el detalle procedural de la vista 3D.

**Lectura sin cargar el archivo entero.** Nuevo `server/globalDem.js`:

- Si existe `server/data/ldem_64.img`, lee bloques de 256 × 256 celdas (4° × 4°, 128 KB) solo cuando se necesitan. Guarda en caché los últimos 256 bloques (32 MB), así que el servidor no reserva 531 MB.
- `globalHeightAt(latDeg, lonDeg)` da la altura en km, con interpolación bilineal:
  - Da la vuelta en la longitud 0°/360°.
  - Junto a los polos, se queda en la última fila.
  - Da NaN si el archivo no está.
- También exporta `globalDemAvailable()`, y la ruta y el tamaño de la malla como parámetros, para poder probarlo con un archivo sintético pequeño.

**Una sola función de altura.** Nueva `heightAtUnit(x, y, z)` en [dem.js](../../server/dem.js): recibe un punto de la esfera unidad y devuelve su altura en km.

- Usa la malla polar más fina que contiene el punto.
- Fuera de las mallas polares, usa la global.
- Si no hay ninguna, devuelve NaN.

Junto a ella, `terrainResolutionAt(lat, lon)` da la celda que se usará en el sitio: de 20 a 240 m en el polo, 474 m fuera, o `null`.

**Horizonte** ([horizon.js](../../server/horizon.js)):

- `computeHorizon` deja de mirar la latitud. Si hay terreno en el sitio, traza los rayos con `heightAtUnit`; si no, usa la esfera lisa, como ahora.
- El rayo ya no se corta al salir de la malla polar en 75°S: si la global está instalada, sigue por ella. En los sitios polares del catálogo no cambia nada medible, porque a esa distancia la curvatura hunde el terreno más de lo que miden las montañas (criterio 9).
- El rayo arranca y avanza media celda, como ahora: 237 m fuera del polo.

**Parches 3D** ([patch.js](../../server/patch.js)). `heightFn` recibe el punto de la esfera unidad en lugar de coordenadas del mapa polar, y por defecto es `heightAtUnit`. El resto del cálculo ya vale en cualquier latitud.

**Servidor** ([app.js](../../server/app.js)):

- `/api/patch` deja de responder 400 al norte de 80°S. Responde 503 solo si en ese punto no hay ni terreno instalado ni parche precalculado.
- `/api/horizon` y `/api/patch` buscan el precalculado en cualquier latitud. Lo usan si su celda es más fina que la instalada en ese punto, o si ahí no hay terreno instalado.
- `/api/health` añade `globalDem: true | false`. `coverageMaxLat` se queda: sigue siendo el límite del buscador y del mapa polar.
- `LUMINA_GLOBAL=0` deja la malla global apagada aunque esté instalada, como `LUMINA_HIRES=0` con las mallas finas.
- El buscador de puntos la apaga en sus hilos de trabajo. Así sus resultados no cambian y cada hilo se ahorra la caché de bloques.

**Descarga** ([fetch-data.mjs](../../scripts/fetch-data.mjs)):

- Nueva opción `--global`, que baja `ldem_64.img` y su etiqueta a `server/data/`. Los `.img` de esa carpeta ya los ignora git.
- Los archivos de 16 MB o más se bajan en trozos de 1 MB por 16 conexiones a la vez, y un archivo `.pieces` apunta los trozos terminados para poder reanudar.
- El motivo: el 15 de noviembre el servidor de NASA daba de 30 a 40 KB/s por conexión, y 512 KB/s con 16 conexiones. Con una sola, los 531 MB tardarían unas 4 horas. Con trozos de 4 MB, las 16 conexiones agotaban el tiempo de espera.

**Precálculo de los 25 sitios** ([precompute-horizons.mjs](../../scripts/precompute-horizons.mjs)):

- Hoy exige las mallas finas del polo y borra todos los archivos antes de empezar. Pasa a tener dos partes independientes:
  - Los sitios polares, si están las mallas finas.
  - Los demás, si está la malla global.
- Cada parte rehace solo los archivos de sus sitios y avisa de la parte que se salta. El `index.json` de los parches se combina en vez de reescribirse.
- Cada sitio fuera del polo lleva 3 horizontes y 2 parches. En total son unos 0.9 MB de horizontes y 6.6 MB de parches; los polares ocupan hoy 0.4 MB y 3.2 MB.
- Una sola persona ejecuta `npm run fetch-data -- --global` y `npm run precompute`, y sube los archivos. El resto del equipo no descarga nada.

**Interfaz:**

- [App.tsx](../../src/App.tsx): la vista 3D se bloquea solo cuando el horizonte no es de terreno real (`horizon.model !== 'lola'`), no por la latitud. Texto: "Este punto no tiene topografía en el servidor, y la vista 3D necesita terreno real."
- [Panels.tsx](../../src/components/Panels.tsx): "Fuera de la cobertura de terreno (80°S a 90°S): se usa una Luna lisa" pasa a "Sin topografía para este punto: se usa una Luna lisa". La línea de la sombra permanente no cambia.
- [Export.tsx](../../src/components/Export.tsx): los límites del informe dicen "terreno real con celdas de 20 a 240 m en el polo sur y de 474 m en el resto".
- [terrain3d.ts](../../src/lib/terrain3d.ts): `PITCH_MAX` pasa de 60° a 85°. Lejos del polo, el Sol pasa cerca del cenit y la Tierra está fija y alta en el cielo (unos 66° en Apollo 11). Con el límite de 60° no se podían ver.
- La vista sigue abriéndose hacia el Sol, pero inclinada como mucho 15° (`START_PITCH_MAX`). Con el Sol cerca del cenit, abrir mirándolo dejaba el suelo fuera de la pantalla, porque la cámara ve 30° por encima y por debajo de su inclinación. Primero se probó con 25°, pero en la llanura de Apollo 11 el suelo quedaba detrás de la barra de controles. En los sitios polares no cambia nada, porque allí el Sol no pasa de unos 7°.
- [Terrain3D.tsx](../../src/components/Terrain3D.tsx) publica la inclinación de la cámara en `data-pitch`, para la prueba de navegador.
- El enlace compartible no gana parámetros.

**Documentación y pruebas existentes:**

- En [S11](S11-vista-3d.md), el criterio "desactivado al norte de 80°S" pasa a "desactivado donde no hay topografía".
- Los flujos de navegador de S06 y S11 comprueban la Luna lisa con un punto propio a 10°N, en lugar de con Apollo 11.
- `npm run e2e` arranca su servidor con `LUMINA_GLOBAL=0`, para dar los mismos resultados en cualquier equipo. Con `E2E_GLOBAL=1` arranca además otro servidor con la malla global, para el criterio 5.

## Criterios de aceptación

Con la malla global instalada:

1. Apollo 15 (Hadley-Apennine): el horizonte supera 5° hacia Mons Hadley (noreste) y hacia Hadley Delta (sur).
2. Apollo 17 (Taurus-Littrow): supera 5° hacia el North Massif y hacia el South Massif.
3. Apollo 11: no pasa de 3° en ninguna dirección.
4. En cinco puntos entre 77°S y 79°S, donde hay malla polar y global, los horizontes calculados con cada una difieren menos de 0.5° en la mediana de las direcciones.
5. Un punto propio a 10°N 10°E tiene horizonte de terreno ("LOLA 474 m") y vista 3D.

Sin la malla global (clon limpio y `npm run fetch-data`):

6. Los 25 sitios del catálogo fuera del polo muestran "LOLA 474 m (precalculado)" y abren la vista 3D.
7. Un punto propio a 10°N 10°E sigue con la Luna lisa, y el botón de la vista 3D está desactivado y explica por qué.

Siempre:

8. En el portátil de desarrollo, un horizonte global de 720 direcciones tarda menos de 1.5 s con la caché vacía y menos de 0.5 s con la caché llena, y un parche de 64 km menos de 1 s.
9. Los sitios polares no cambian: sus 36 horizontes precalculados difieren menos de 0.01° de los actuales, y sus parches son idénticos.
10. La malla global añade menos de 64 MB de memoria al servidor.
11. Los archivos precalculados nuevos ocupan menos de 8 MB.
12. En la vista 3D de Apollo 11 se puede mirar hasta 85° de altura y encontrar la Tierra.

## Pruebas

- **Automáticas, sin descargas:**
  - `globalDem.js` con un archivo sintético pequeño: orientación de filas y columnas, escala, vuelta en 0°/360° y polos.
  - El horizonte sobre una malla global plana es igual al de la esfera lisa.
  - Un cono sintético a una distancia conocida da la elevación esperada.
  - El parche funciona con la nueva `heightFn`.
  - Las rutas, con precalculados y sin terreno (criterios 6 y 7 en el servidor).
  - El precálculo de una parte no borra los archivos de la otra.
- **Con la malla global:** criterios 1 a 5 y 8 a 10, en un archivo de pruebas que se salta si falta la malla, como [hiresTerrain.test.js](../../tests/hiresTerrain.test.js).
- **En el navegador:** un flujo nuevo, `e2e/s17-relieve-global.mjs`, para los criterios 6, 7 y 12. Además se actualiza [s11-vista-3d.mjs](../../e2e/s11-vista-3d.mjs).
- **A mano:** comparar el panorama de Apollo 15 y Apollo 17 con las fotos panorámicas de las misiones, en el Apollo Lunar Surface Journal.

## Fuera de alcance

- **Más detalle que 474 m:** `LDEM_128` (237 m, 2.1 GB), SLDEM2015 (unos 60 m, entre 60°N y 60°S) o los modelos de LROC NAC, de pocos metros, que existen para los sitios Apollo. Se podrían añadir después con la misma `heightAtUnit`.
- **El mapa de sombras** de otras regiones o del polo norte.
- **El buscador de puntos y la sombra permanente** fuera del polo sur.
- **Rocas y cráteres pequeños.**

## Riesgos

- **La descarga es lenta.** Con una sola conexión, el servidor de NASA da de 37 a 60 KB/s, y 531 MB tardarían hasta 4 horas. Por eso `fetch-data` baja los archivos grandes por 16 conexiones, y así tardó unos 25 minutos. Es opcional, se reanuda si se corta y solo la necesita quien precalcule; el resto del equipo usa los archivos del repositorio.
- **De cerca, 474 m decepciona.** El suelo cercano se ve liso, y Apollo 11 parecerá casi plano. El indicador dice la resolución ("Terreno 474 m") y el detalle procedural de S11 da textura. Los sitios que lucen son los rodeados de montañas, como Apollo 15 y Apollo 17.
- **El repositorio crece unos 7.5 MB** con los archivos precalculados. Si molesta, los parches se pueden guardar comprimidos con `zlib`, que viene con Node y no es una dependencia nueva.
- **Se mezclan dos mallas.** Las dos son de LOLA y usan la misma esfera, pero tienen fechas y celdas distintas: en el borde puede haber un escalón de unos metros. El criterio 4 comprueba que no cambie el horizonte.
- **Cerca de los polos, la malla cilíndrica estrecha sus celdas de este a oeste:** a 85° de latitud miden 41 m de ancho y siguen midiendo 474 m de norte a sur. No afecta: en el sur manda la malla polar, y en el norte no hay sitios del catálogo.

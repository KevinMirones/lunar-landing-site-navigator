<a id="en"></a>
**English** | [Español](#es)

# LUMINA

**Lunar Mission Illumination & Network Analyzer.** Compares lunar landing sites and dates in seconds: where the Sun and Earth are relative to the real terrain horizon, how much solar power there will be, and when there is a direct link to Earth.

**Live app: <https://cornflowerblue-meerkat-181187.hostingersite.com>**

A project for the NASA Space Apps challenge on mission planning at the lunar south pole.

## What it does

| Challenge need | How LUMINA meets it |
| --- | --- |
| Position of the Sun and Earth relative to the horizon | 360° panorama with the real terrain silhouette, and to-scale close-ups of the solar and Earth discs |
| Time until the Sun or Earth sets | Live countdown: "sets in 3 d 4 h", "link returns in 13 h" |
| Power and communications | Share of sunlight, longest night, share of link, outages, irradiance and a viability index |
| Compare sites | Side-by-side scenario table, with the windows aligned by mission day, and a link to share it |
| Why a small change matters | A search that evaluates the area around a point and proposes the five best places nearby |
| Compare dates | Scenarios with the same site on different dates, a 12-month calendar and the five best landing dates |
| Notable sites and your own coordinates | 37 sites (Artemis, CLPS, Apollo, Luna, Surveyor, ISRO, JAXA, CNSA), each with the source of its coordinates, plus manual coordinates or a click on the map |
| 2D and 3D maps | Polar map with shadows computed live on the GPU, a 3D globe lit by the real Sun, and a first-person 3D view from the site with the real relief |
| Change over time | Animated playback of the whole mission |
| General public | Plain-language explanations generated from the data, in Spanish and English |

## How it works

1. **Ephemeris.** The browser computes the position of the Sun and Earth and the orientation of the Moon (IAU rotation model, which includes libration) with `astronomy-engine`, and expresses them in the Moon-fixed frame. It costs about 14 µs per instant.
2. **Terrain.** The Node server loads the LOLA elevation models of the south pole: four nested grids of 20 m (87.5°S to 90°S), 40 m (from 85°S), 80 m (from 80°S) and 240 m (from 75°S), and always reads the finest one that contains each point. For each site it casts 720 rays, one every 0.5° of azimuth, out to 400 km, taking the Moon's curvature into account, and returns the horizon angle in each direction. It takes about 55 ms on 20 m terrain. Without the fine grids it works with the 240 m one, and the catalogue sites use horizons precomputed on fine terrain. Away from the pole it uses LOLA's global grid, at 474 m. That grid is optional: the 25 catalogue sites away from the pole ship with their horizon and 3D relief precomputed.
3. **Visibility.** The Moon has no atmosphere, so there is no refraction and no twilight: each disc (Sun 0.53°, Earth 1.9°) is compared with the terrain line to get the visible fraction.
4. **Shadow map.** A WebGL2 shader does the same calculation for every pixel of the polar map, 150 steps per ray, in real time.

## Validation

- **Ephemeris against NASA/JPL Horizons (DE441):** 300 comparisons (5 sites, 30 instants between Nov 2026 and Dec 2027, Sun and Earth). Maximum error on the sky: **0.0037°**, about 140 times smaller than the solar disc. `npm test` repeats it, and the "Check with JPL Horizons" button does it live for any site and date.
- **Sunlight and link against published results:** [docs/VALIDACION.md](docs/VALIDACION.md). At 2 m above ground, LUMINA reproduces the 20-year solar visibility of Gläser et al. (2018) with differences of 0.0 to 2.5 points at three of their four points. Against NASA's 18.6-year maps, the value falls within the published range at ±60 m at 10 of 11 sites. At ground level the differences reach 20 points, and they are explained. `npm run validate` repeats it.
- **Terrain:** the tests check the orientation of the model against known geography (the floors of Shackleton, Shoemaker and Cabeus; the Malapert massif), the physical behaviour of the horizon, and that neighbouring grids agree where they overlap.

## Known limits

- The terrain has cells of 20 to 240 m at the south pole and of 474 m over the rest of the Moon. Catalogue sites always have relief. A point of your own away from the pole has it only if the server holds the global grid; otherwise a smooth sphere is used, and the screen says so.
- The shadow map, the point search and permanent shadow cover 80°S to 90°S.
- Cells of 20 to 80 m do not resolve rocks or relief a few metres high. Near a ridge crest, moving 40 m can change the result by tens of points.
- The shadow map always uses 480 m cells. On a server without the fine grids, the point search and custom points use 240 m terrain.
- "Link" means that at least half of Earth's disc clears the terrain. Ground stations and antennas are not modelled.
- The viability index is indicative (40% sunlight, 25% short nights, 35% link).
- "Artemis III region" points are representative positions, not official targets. Each site says on screen whether its coordinates are published or representative.

## Getting started

Requires Node 22.18 or newer: the server loads the TypeScript analysis modules directly.

```bash
npm install
npm run fetch-data   # downloads the 240 m LOLA DEM (29 MB) and the Moon texture from NASA
npm run dev          # API on :8787 and web app on http://localhost:5173
```

Fine terrain, optional:

```bash
npm run fetch-data -- --hires   # 20, 40 and 80 m grids (345 MB)
npm run precompute              # recomputes the catalogue horizons in server/data/horizons/
```

With the fine grids the server uses about 400 MB of memory. `LUMINA_HIRES=0` leaves them unloaded.

Relief across the whole Moon, optional ([S17](docs/specs/S17-relieve-global.md)):

```bash
npm run fetch-data -- --global  # 474 m global grid (531 MB, about 25 minutes)
npm run precompute              # also recomputes the catalogue sites away from the pole
```

The server does not load the whole global grid: it reads blocks of it and keeps at most 32 MB in memory. `LUMINA_GLOBAL=0` leaves it unused.

Production:

```bash
npm run build
npm start            # serves the API and the web app on http://localhost:8787
```

Tests: `npm test`. The computation time limits are checked separately, on the development laptop, with `npm run test:perf`. Tests in a real browser, against the built app: `npm run build && npm run e2e` (see [S15](docs/specs/S15-pruebas-de-navegador.md)). Scientific validation: `npm run validate` (see [docs/VALIDACION.md](docs/VALIDACION.md)).

### Public deployment

A single Node service serves the API and the web app. Any host that runs Node will do; static file hosting is not enough.

| Setting | Value |
| --- | --- |
| Node | 22.18 or newer; preferably 24 |
| Build | `npm ci && npm run build:deploy`: downloads the NASA data and builds |
| Start | `npm start`, or `server/index.js` as the entry file |
| Port | the `PORT` variable (8787 if unset) |
| Health check | `/api/health` must answer `"dem": true` and `"precomputed": 111`; `"globalDem": true` once the global grid is complete |
| Memory | 256 MB are enough: the 240 m grid takes 29 MB and at most 32 MB of the global one are kept |
| Disk | About 600 MB with the global grid |
| Behind a proxy | `TRUST_PROXY=1`, so the rate limit sees the client's real address |
| Small server | `SEARCH_WORKERS=1` and `SEARCH_MAX_GRID=21` reduce the cost of the point search |

`build:deploy` downloads in parallel and stops after 11 minutes even if the global grid has not finished. That way it fits hosts that limit the build to 15 minutes. What was downloaded is kept, and the next deployment continues from there. Meanwhile the app works: the catalogue sites have their relief precomputed.

In public, `/api/jpl` accepts 30 requests per minute per address and caches the answers. The server sends security headers, including a content policy that only allows its own resources.

#### On Hostinger (hPanel Node.js app)

Works with the plans that support Node.js apps (Business and Cloud).

1. In hPanel: **Websites → Add Website → Node.js web app → Import from GitHub**. Authorise GitHub and choose this repository and the `main` branch. Every push to `main` deploys again.
2. Build settings:

   | Field | Value |
   | --- | --- |
   | Framework preset | Express. Not Vite: Vite would treat it as a static site |
   | Branch | `main` |
   | Node version | 24.x |
   | Root directory | `./` |
   | Package manager | npm |
   | Entry file | `server/index.js` |

3. Environment variables: `LUMINA_DEPLOY=1`, `TRUST_PROXY=1`, `SEARCH_WORKERS=1` and `SEARCH_MAX_GRID=21`. Do not set `PORT`: Hostinger provides it.

   The Express preset installs the dependencies and starts the server, but it has no build step. With `LUMINA_DEPLOY=1`, the install runs [postinstall.mjs](scripts/postinstall.mjs): it downloads the data and builds the web app. Because the install also has a 15-minute limit, the global grid stops after 9. Without that variable, `npm install` does nothing extra, on Hostinger or on a development machine.

   If the preset you chose does have a build script field, you can use `build:deploy` instead of the variable.
4. Deploy. The first install takes about 12 minutes, nearly all of it downloading.
5. Open `https://<your domain>/api/health`:
   - `"dem": true` and `"precomputed": 111`: everything is running.
   - `"globalDem": false`: the global grid did not finish in time. Deploy again from **Deployments** so it continues.
   - If it is still `false` after three deployments, the host does not keep files between deployments. The app works all the same: only your own points away from the pole are left without relief.

The app stops when it gets no visits and starts with the next one: the first load takes a few seconds longer. Before a demo, open the address a few minutes ahead.

Public address: <https://cornflowerblue-meerkat-181187.hostingersite.com>

### Sharing on the local network

So that someone else on the same network can open the tool from their browser:

```bash
npm run share      # builds and serves everything on port 8787
npm run dev:lan    # or, with live reload, on port 5173
```

On start, the server prints the address to share, such as `http://10.0.0.5:8787`. On Windows, the firewall must allow incoming connections to Node.js on the active network profile.

## Documentation

The [documentation index](docs/README.md) gathers the implementation plan, the spec of each feature with its status, and the history of the project's decisions and findings.

## Structure

```
server/          Express API
  dem.js         nested LOLA grids and polar stereographic projection
  horizon.js     terrain horizon by ray casting
  precomputed.js catalogue horizons computed beforehand on fine terrain
  app.js         /api/horizon, /api/heightmap, /api/jpl, /api/search
  search.js      search on a grid around a point, in worker threads
  index.js       entry point
src/lib/
  ephemeris.ts   Sun and Earth in the Moon-fixed frame
  series.ts      time series, windows, metrics
  sites.ts       site catalogue
  scenario.ts    comparable scenarios
  urlState.ts    state in the address (shareable links)
  search.ts      choice of the best points nearby
src/components/  Panorama, PolarMap (WebGL2), Globe (three.js), Timeline, Panels
tests/           validation against JPL Horizons and terrain tests
docs/            index, plan, specs, history and the pitch for the jury
```

## Data and credits

- Topography: Lunar Orbiter Laser Altimeter (LOLA), Lunar Reconnaissance Orbiter, NASA GSFC, via the PDS Geosciences Node.
- Moon image: LROC WAC mosaic, NASA Scientific Visualization Studio (CGI Moon Kit).
- Ephemeris reference: NASA/JPL Horizons System.
- Ephemeris computation: [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT licence).

NASA does not endorse this project. It is a planning aid and does not replace a mission analysis.

---

<a id="es"></a>
**Español** | [English](#en)

# LUMINA

**Lunar Mission Illumination & Network Analyzer.** Compara sitios y fechas de alunizaje en segundos: dónde están el Sol y la Tierra respecto al horizonte real del terreno, cuánta energía solar habrá y cuándo hay enlace directo con la Tierra.

**App en línea: <https://cornflowerblue-meerkat-181187.hostingersite.com>**

Proyecto para el reto de NASA Space Apps sobre planificación de misiones al polo sur lunar.

## Qué hace

| Necesidad del reto | Cómo la resuelve LUMINA |
| --- | --- |
| Posición del Sol y la Tierra respecto al horizonte | Panorama de 360° con la silueta real del terreno y primeros planos a escala del disco solar y terrestre |
| Tiempo hasta la puesta de Sol o de la Tierra | Cuenta regresiva en vivo: "se oculta en 3 d 4 h", "enlace vuelve en 13 h" |
| Energía y comunicaciones | Porcentaje de luz, noche más larga, porcentaje de enlace, cortes, irradiancia e índice de viabilidad |
| Comparar sitios | Tabla de escenarios lado a lado, con las ventanas alineadas por día de misión, y enlace para compartirla |
| Por qué un cambio pequeño importa | Buscador que evalúa la zona alrededor de un punto y propone los cinco mejores lugares cercanos |
| Comparar fechas | Escenarios con el mismo sitio en fechas distintas, calendario de 12 meses y las cinco mejores fechas de alunizaje |
| Sitios notables y coordenadas propias | 37 sitios (Artemis, CLPS, Apollo, Luna, Surveyor, ISRO, JAXA, CNSA), cada uno con la fuente de sus coordenadas, más coordenadas manuales o clic en el mapa |
| Mapas 2D y 3D | Mapa polar con sombras calculadas en vivo en la GPU, globo 3D iluminado por el Sol real y vista 3D en primera persona desde el sitio, con el relieve real |
| Dinámica temporal | Reproducción animada de toda la misión |
| Público general | Explicaciones en lenguaje llano generadas a partir de los datos, en español e inglés |

## Cómo funciona

1. **Efemérides.** El navegador calcula la posición del Sol y la Tierra y la orientación de la Luna (modelo de rotación IAU, que incluye la libración) con `astronomy-engine`, y las expresa en el sistema fijo a la Luna. Cuesta unos 14 µs por instante.
2. **Terreno.** El servidor Node carga los modelos de elevación LOLA del polo sur: cuatro mallas anidadas de 20 m (87.5°S a 90°S), 40 m (desde 85°S), 80 m (desde 80°S) y 240 m (desde 75°S), y lee siempre la más fina que contiene cada punto. Para cada sitio lanza 720 rayos, uno cada 0.5° de azimut, hasta 400 km, teniendo en cuenta la curvatura lunar, y devuelve el ángulo del horizonte en cada dirección. Tarda unos 55 ms con terreno de 20 m. Sin las mallas finas funciona con la de 240 m, y los sitios del catálogo usan horizontes precalculados con terreno fino. Fuera del polo usa la malla global de LOLA, de 474 m. Es opcional: los 25 sitios del catálogo fuera del polo llevan su horizonte y su relieve 3D precalculados.
3. **Visibilidad.** En la Luna no hay atmósfera, así que no hay refracción ni crepúsculo: se compara cada disco (Sol 0.53°, Tierra 1.9°) con la línea del terreno y se obtiene la fracción visible.
4. **Mapa de sombras.** Un shader WebGL2 hace el mismo cálculo para cada píxel del mapa polar, 150 pasos por rayo, en tiempo real.

## Validación

- **Efemérides contra NASA/JPL Horizons (DE441):** 300 comparaciones (5 sitios, 30 instantes entre nov 2026 y dic 2027, Sol y Tierra). Error máximo en el cielo: **0.0037°**, unas 140 veces menor que el disco solar. Se repite con `npm test`, y el botón "Comprobar con JPL Horizons" lo hace en vivo para cualquier sitio y fecha.
- **Luz y enlace contra resultados publicados:** [docs/VALIDACION.md](docs/VALIDACION.md). A 2 m del suelo, LUMINA reproduce la visibilidad solar de 20 años de Gläser et al. (2018) con diferencias de 0.0 a 2.5 puntos en tres de sus cuatro puntos. Frente a los mapas de NASA de 18.6 años, el valor cae dentro del rango publicado a ±60 m en 10 de 11 sitios. A ras de suelo las diferencias llegan a 20 puntos y están explicadas. Se repite con `npm run validate`.
- **Terreno:** las pruebas comprueban la orientación del modelo con geografía conocida (fondos de Shackleton, Shoemaker y Cabeus; macizo Malapert), el comportamiento físico del horizonte y que las mallas contiguas coinciden donde se solapan.

## Límites conocidos

- El terreno tiene celdas de 20 a 240 m en el polo sur y de 474 m en el resto de la Luna. Los sitios del catálogo siempre tienen relieve. Un punto propio fuera del polo lo tiene solo si el servidor tiene la malla global; si no, se usa una esfera lisa, y se indica en pantalla.
- El mapa de sombras, el buscador de puntos y la sombra permanente cubren de 80°S a 90°S.
- Con celdas de 20 a 80 m no se resuelven rocas ni relieve de pocos metros. Cerca de una cresta, moverse 40 m puede cambiar el resultado en decenas de puntos.
- El mapa de sombras usa siempre celdas de 480 m. En un servidor sin mallas finas, el buscador de puntos y los puntos personalizados usan terreno de 240 m.
- "Enlace" significa que al menos medio disco terrestre supera el terreno. No se modelan estaciones de tierra ni antenas.
- El índice de viabilidad es orientativo (40% luz, 25% noches cortas, 35% enlace).
- Los puntos "Región Artemis III" son posiciones representativas, no objetivos oficiales. Cada sitio indica en pantalla si sus coordenadas son publicadas o representativas.

## Puesta en marcha

Requiere Node 22.18 o superior: el servidor carga directamente los módulos TypeScript de análisis.

```bash
npm install
npm run fetch-data   # descarga el DEM LOLA de 240 m (29 MB) y la textura lunar desde NASA
npm run dev          # API en :8787 y web en http://localhost:5173
```

Terreno fino, opcional:

```bash
npm run fetch-data -- --hires   # mallas de 20, 40 y 80 m (345 MB)
npm run precompute              # recalcula los horizontes del catálogo en server/data/horizons/
```

Con las mallas finas el servidor usa unos 400 MB de memoria. `LUMINA_HIRES=0` las deja sin cargar.

Relieve en toda la Luna, opcional ([S17](docs/specs/S17-relieve-global.md)):

```bash
npm run fetch-data -- --global  # malla global de 474 m (531 MB, unos 25 minutos)
npm run precompute              # recalcula también los sitios del catálogo fuera del polo
```

El servidor no carga la malla global entera: lee bloques de ella y guarda en memoria 32 MB como máximo. `LUMINA_GLOBAL=0` la deja sin usar.

Producción:

```bash
npm run build
npm start            # sirve API y web en http://localhost:8787
```

Pruebas: `npm test`. Los límites de tiempo de cálculo se comprueban aparte, en el portátil de desarrollo, con `npm run test:perf`. Pruebas en un navegador real, sobre la versión compilada: `npm run build && npm run e2e` (ver [S15](docs/specs/S15-pruebas-de-navegador.md)). Validación científica: `npm run validate` (ver [docs/VALIDACION.md](docs/VALIDACION.md)).

### Despliegue público

Un único servicio Node sirve la API y la web. Vale cualquier alojamiento que ejecute Node, no solo archivos estáticos.

| Ajuste | Valor |
| --- | --- |
| Node | 22.18 o superior; mejor 24 |
| Compilación | `npm ci && npm run build:deploy`: descarga los datos de NASA y compila |
| Arranque | `npm start`, o `server/index.js` como archivo de entrada |
| Puerto | variable `PORT` (8787 si no está) |
| Comprobación de salud | `/api/health` debe responder `"dem": true` y `"precomputed": 111`; `"globalDem": true` cuando la malla global esté completa |
| Memoria | 256 MB bastan: la malla de 240 m ocupa 29 MB y de la global se guardan 32 MB como máximo |
| Disco | Unos 600 MB con la malla global |
| Detrás de un proxy | `TRUST_PROXY=1`, para que el límite de peticiones vea la dirección real del cliente |
| Servidor pequeño | `SEARCH_WORKERS=1` y `SEARCH_MAX_GRID=21` reducen el coste del buscador de puntos |

`build:deploy` descarga en paralelo y se detiene a los 11 minutos aunque la malla global no haya terminado. Así cabe en alojamientos que limitan la compilación a 15 minutos. Lo descargado se conserva, y el siguiente despliegue continúa desde ahí. Mientras tanto, la app funciona: los sitios del catálogo tienen su relieve precalculado.

En público, `/api/jpl` admite 30 consultas por minuto y por dirección, y guarda las respuestas en caché. El servidor envía cabeceras de seguridad, incluida una política de contenido que solo permite recursos propios.

#### En Hostinger (aplicación Node.js de hPanel)

Sirve con los planes que admiten aplicaciones Node.js (Business y Cloud).

1. En hPanel: **Websites → Add Website → Node.js web app → Import from GitHub**. Autoriza GitHub y elige este repositorio y la rama `main`. Cada push a `main` vuelve a desplegar.
2. Ajustes de compilación:

   | Campo | Valor |
   | --- | --- |
   | Preajuste del framework | Express. No Vite: Vite lo trataría como una web estática |
   | Rama | `main` |
   | Versión del nodo | 24.x |
   | Directorio raíz | `./` |
   | Gestor de paquetes | npm |
   | Archivo de entrada | `server/index.js` |

3. Variables de entorno: `LUMINA_DEPLOY=1`, `TRUST_PROXY=1`, `SEARCH_WORKERS=1` y `SEARCH_MAX_GRID=21`. `PORT` no se define: la pone Hostinger.

   El preajuste Express instala las dependencias y arranca el servidor, pero no tiene un paso de compilación. Con `LUMINA_DEPLOY=1`, la instalación ejecuta [postinstall.mjs](scripts/postinstall.mjs): descarga los datos y compila la web. Como la instalación también tiene un límite de 15 minutos, la malla global se detiene a los 9. Sin esa variable, `npm install` no hace nada más, ni en Hostinger ni en un equipo de desarrollo.

   Si el preajuste elegido sí tiene un campo de script de compilación, se puede usar `build:deploy` en lugar de la variable.
4. Despliega. La primera instalación tarda unos 12 minutos, casi todo en la descarga.
5. Abre `https://<tu dominio>/api/health`:
   - `"dem": true` y `"precomputed": 111`: todo en marcha.
   - `"globalDem": false`: la malla global no terminó en el plazo. Vuelve a desplegar desde **Deployments** para que continúe.
   - Si sigue en `false` después de tres despliegues, el alojamiento no conserva los archivos entre despliegues. La app funciona igual: solo los puntos propios fuera del polo se quedan sin relieve.

La aplicación se detiene cuando no recibe visitas y arranca con la siguiente: la primera carga tarda unos segundos más. Antes de una demostración, abre la dirección unos minutos antes.

Dirección pública: <https://cornflowerblue-meerkat-181187.hostingersite.com>

### Compartir en la red local

Para que otra persona en la misma red abra la herramienta desde su navegador:

```bash
npm run share      # compila y sirve todo en el puerto 8787
npm run dev:lan    # o, con recarga en vivo, en el puerto 5173
```

El servidor muestra al arrancar la dirección que hay que compartir, del tipo `http://10.0.0.5:8787`. En Windows, el firewall debe permitir conexiones entrantes a Node.js en el perfil de red activo.

## Documentación

El [índice de documentación](docs/README.md) reúne el plan de implementación, las specs de cada función con su estado, y el historial de decisiones y hallazgos del proyecto.

## Estructura

```
server/          API Express
  dem.js         mallas LOLA anidadas y proyección estereográfica polar
  horizon.js     horizonte del terreno por trazado de rayos
  precomputed.js horizontes del catálogo calculados de antemano con terreno fino
  app.js         /api/horizon, /api/heightmap, /api/jpl, /api/search
  search.js      búsqueda en una malla alrededor de un punto, en hilos de trabajo
  index.js       arranque
src/lib/
  ephemeris.ts   Sol y Tierra en el sistema fijo a la Luna
  series.ts      series temporales, ventanas, métricas
  sites.ts       catálogo de sitios
  scenario.ts    escenarios comparables
  urlState.ts    estado en la dirección (enlaces compartibles)
  search.ts      elección de los mejores puntos cercanos
src/components/  Panorama, PolarMap (WebGL2), Globe (three.js), Timeline, Panels
tests/           validación contra JPL Horizons y pruebas del terreno
docs/            índice, plan, specs, historial y guion para el jurado
```

## Datos y créditos

- Topografía: Lunar Orbiter Laser Altimeter (LOLA), Lunar Reconnaissance Orbiter, NASA GSFC, vía PDS Geosciences Node.
- Imagen lunar: mosaico LROC WAC, NASA Scientific Visualization Studio (CGI Moon Kit).
- Referencia de efemérides: NASA/JPL Horizons System.
- Cálculo de efemérides: [astronomy-engine](https://github.com/cosinekitty/astronomy) (licencia MIT).

NASA no avala este proyecto. Es una herramienta de apoyo a la planificación y no sustituye un análisis de misión.

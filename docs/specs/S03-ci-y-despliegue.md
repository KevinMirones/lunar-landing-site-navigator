---
id: S03
titulo: Integración continua y despliegue público
title: Continuous integration and public deployment
estado: hecha
dia: 1
prioridad: imprescindible
depende: -
resumen: Cada cambio se prueba solo y hay una dirección pública que el jurado puede abrir.
summary: Every change is tested automatically and there is a public address the jury can open.
---

<a id="en"></a>
**English** | [Español](#es)

# S03: Continuous integration and public deployment

## Problem

The project only works on the team's machines. The delivery needs a public link, and for several people to work at once without breaking anything, the tests have to run by themselves and give the same result on any machine.

## What the user will see

- On GitHub, every push shows a green or red mark.
- The README includes the public address of the tool.
- If the public server has had no visits for a while, the first load takes about a minute. The README warns about it.

## Status

Done and tested:

- Continuous integration workflow in [ci.yml](../../.github/workflows/ci.yml).
- Limit of 30 requests per minute on `/api/jpl`, with a response cache ([rateLimit.js](../../server/rateLimit.js)).
- Security headers and content policy, checked with the built app.
- [app.js](../../server/app.js) separates creating the app from starting it, so the API can be tested.
- Deployment settings documented in the [README](../../README.md).
- Timing tests outside `npm test`, with `npm run test:perf` ([Timing tests](#timing-tests)). Checked on the second laptop: `npm test` passes (118 tests, 5 skipped without the fine grids) and `npm run test:perf` fails there with 633 ms against 300 ms, as expected on a slower machine.

Closed on 15 November, on finishing the project (`v1.0.0`):

- **Hosting: Hostinger**, instead of Render. The team already had a plan there with Node.js apps, and an app connected to GitHub that redeploys on every push to `main`. The steps and settings are in the [README](../../README.md#on-hostinger-hpanel-nodejs-app).
- **Data:** everything there is gets deployed, including the global grid of [S17](S17-relieve-global.md) (531 MB). Hostinger's Express preset has no build step, so the download and the build happen during the install: [postinstall.mjs](../../scripts/postinstall.mjs) runs them only with `LUMINA_DEPLOY=1`. The install has a 15-minute limit, so the global grid stops after 9 and the next deployment continues. The 240 m grid comes down in about 20 seconds. On hosts with a build step, `npm run build:deploy` will do.
- **The DEM does not go into the repository:** with the parallel download it is no longer needed, and the decision was irreversible.
- **Public address:** <https://cornflowerblue-meerkat-181187.hostingersite.com>, in the README. On 15 November `/api/health` answered there with the DEM loaded, the global grid complete and 111 precomputed horizons.

Not done:

1. Measure the point search on the public address and write the time in the README (criterion 6), and open the address on a phone (criterion 4).
2. Check in the Actions tab on GitHub that the workflow ends green. The repository is private and could not be checked from outside.
3. The [static backup copy](#static-backup-copy), which was optional.

## Design

### Continuous integration

`.github/workflows/ci.yml`, with Node 22, on every push and every pull request:

1. `npm ci`
2. `npm run typecheck`
3. `npm run fetch-data`, with the DEM cached between runs, so as not to depend on NASA's server every time. If it fails, the run goes on.
4. `npm test`
5. `npm run build`
6. `npm run docs:check`
7. `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).

The terrain tests and the browser tests skip themselves if the DEM is not there.

### Timing tests

Several specs set a time limit "on the development laptop" and there are automated tests that enforce it. On another machine those tests fail even though the code is fine: on 14 November, on a second laptop, recomputing six scenarios took 633 ms against the 300 ms limit of [scenario.test.ts](../../tests/scenario.test.ts), and `npm test` ended red.

- The assertions on pure computation time now run only with `LUMINA_PERF=1`. There are three: [scenario.test.ts](../../tests/scenario.test.ts) (300 ms), [bestDates.test.ts](../../tests/bestDates.test.ts) (100 ms) and [hiresTerrain.test.js](../../tests/hiresTerrain.test.js) (250 ms).
- New script `npm run test:perf`, which sets that variable. It is run by hand on the development laptop before closing a spec with a time limit.
- `npm test` and continuous integration keep checking the result of those tests, not how long they take.
- The two tests in [searchServer.test.js](../../tests/searchServer.test.js) that measure that the API does not block during a search do not change: they check a behaviour, not a speed.

### Data in the repository

**Proposal: include the 240 m grid in the repository** (`server/data/ldem_75s_240m.img`, 29 MB).

| | With the DEM in the repository | As today (it is downloaded) |
| --- | --- | --- |
| Build on the host | `npm ci && npm run build` | Depends on NASA's server, which sometimes runs at 60 KB/s |
| Continuous integration | Runs the terrain tests | Skips them |
| Fresh clone | Works with no extra steps | Needs `npm run fetch-data` |
| Cost | 29 MB in the git history for ever | None |

The LOLA data are public. The globe texture is already in the repository. If it is accepted:

- Add `!server/data/ldem_75s_240m.img` to [.gitignore](../../.gitignore), after the line that ignores `server/data/*.img`.
- Remove `npm run fetch-data` from the build command in the README.
- `npm run fetch-data` still exists for the fine grids and the validation maps.

It cannot be undone without rewriting the history, so the team confirms it. Meanwhile the build downloads the DEM.

### Deployment

A single Node service serves the API and the web app.

**What the host needs:**

| Requirement | Value |
| --- | --- |
| Node | 22.18 or newer. This is mandatory: the server loads the TypeScript modules of `src/lib` directly |
| Memory | 256 MB. Measured on 14 November with only the 240 m grid: 80 MB on start and a peak of 123 MB during a search with one thread (148 MB with a laptop's default threads) |
| Disk | 60 MB with the DEM |
| Process | A service that stays running; static-file-only hosting will not do |

The fine grids (345 MB on disk, about 400 MB in memory) are not deployed. The catalogue sites still answer with fine terrain thanks to the precomputed horizons of [S06](S06-terreno-multirresolucion.md).

**Proposal: Render, free plan.** According to its [documentation](https://render.com/docs/free), consulted on 14 November 2026: 512 MB of memory, 0.1 CPU, and the service sleeps after 15 minutes without visits and takes about a minute to wake up. Any other host that meets the table above is just as good.

| Setting | Value |
| --- | --- |
| Build | `npm ci && npm run build` (with `npm run fetch-data` in front while the DEM is not in the repository) |
| Start | `npm start` |
| Health check | `/api/health`, which must answer `"dem": true` and `"precomputed": 36` |
| `NODE_VERSION` | A 22.x version equal to or above 22.18 |
| `TRUST_PROXY` | `1`, so the rate limit sees the client's real address |
| `SEARCH_WORKERS` | `1` |
| `SEARCH_MAX_GRID` | `11` at first |

**The search with 0.1 CPU.** The point search of [S04](S04-buscador-de-puntos.md) is pure computation and will run much slower there than on a laptop. On the first day the grid of 11 is measured:

- If it answers in under 10 s, try raising `SEARCH_MAX_GRID` to 21.
- If it takes more than 30 s, note under "Known limits" in the README that the search is slow on the public address, and demo the search locally.

The answer already states the grid actually used, so the interface does not change.

**Before showing it.** Open the address a few minutes before the demo, so the service is awake.

### Protecting the public server

- `/api/jpl` forwards queries to JPL Horizons. It is limited to 30 requests per minute per address, with a cache.
- Basic security headers and no directory listing.

### Static backup copy

Can be cut. A copy of the app that works without a server, published on GitHub Pages, so that the jury's link always opens at once even if the free service is asleep or down.

It is possible because the ephemeris is already computed in the browser and the catalogue horizons are already precomputed.

- New `npm run build:static`: builds the web app with relative paths and copies next to it the 36 horizons of `server/data/horizons/` and the height map that `/api/heightmap` serves today, generated as a file.
- In [util.ts](../../src/lib/util.ts), `fetchHorizon` and `fetchHeightmap` try the API first and, if it does not answer, use those files.
- Without a server these are disabled, with a notice that explains it: the point search, the check with JPL Horizons and real terrain for custom points (which already fall back to a smooth Moon today and say so).
- A GitHub Actions workflow publishes it on every push to `main`. Free GitHub Pages requires the repository to be public, and today it is private; it has to be made public for the delivery anyway.

Later specs that add server data for catalogue sites ([S11](S11-vista-3d.md), [S16](S16-sombra-permanente.md)) precompute them too, so that the static copy has them.

## Acceptance criteria

1. A push to any branch runs continuous integration and ends green.
2. A change that breaks a test leaves the mark red.
3. `npm test` passes on a machine other than the development laptop, and `npm run test:perf` passes on the development laptop.
4. The public address loads on a phone and `/api/health` answers with the DEM loaded and the 36 precomputed horizons.
5. Request number 31 to `/api/jpl` within a minute gets a 429 error.
6. The README contains the public address and the measured time of the search on it.
7. If the static copy is made: with it, the 12 polar catalogue sites show the same figures as with a server, and the features that need one appear disabled with their explanation.

## Tests

- Automated: the rate limit (it already exists) and, for the static copy, that `fetchHorizon` uses the file when the API fails.
- By hand: criteria 1 to 4 and 6.

## Out of scope

- Custom domain, automatic deployment by tag and monitoring.
- Deploying the fine grids.

## Risks

- **The free service is asleep when the jury opens the link.** A warning in the README, opening it before the demo and, if it is made, the static copy.
- **The search is too slow in public.** It is measured on the first day and documented. The live demo is done locally with `npm run share`.
- **The conditions of the free plan change.** The requirements are in a table separate from the provider, so another one can be chosen.
- **No internet at the presentation.** `npm run share` locally, which does not depend on the deployment.

---

<a id="es"></a>
**Español** | [English](#en)

# S03: Integración continua y despliegue público

## Problema

El proyecto solo funciona en las máquinas del equipo. Para la entrega hace falta un enlace público, y para trabajar varias personas a la vez sin romper nada hace falta que las pruebas se ejecuten solas y den el mismo resultado en cualquier equipo.

## Qué verá el usuario

- En GitHub, cada push muestra una marca verde o roja.
- El README incluye la dirección pública de la herramienta.
- Si el servidor público lleva un rato sin visitas, la primera carga tarda alrededor de un minuto. El README lo avisa.

## Estado

Hecho y probado:

- Flujo de integración continua en [ci.yml](../../.github/workflows/ci.yml).
- Límite de 30 peticiones por minuto en `/api/jpl`, con caché de respuestas ([rateLimit.js](../../server/rateLimit.js)).
- Cabeceras de seguridad y política de contenido, comprobadas con la app compilada.
- [app.js](../../server/app.js) separa la creación de la app del arranque, para poder probar la API.
- Ajustes de despliegue documentados en el [README](../../README.md).
- Pruebas de tiempo fuera de `npm test`, con `npm run test:perf` ([Pruebas de tiempo](#pruebas-de-tiempo)). Comprobado en el segundo portátil: `npm test` pasa (118 pruebas, 5 omitidas sin mallas finas) y `npm run test:perf` falla allí por 633 ms frente a 300 ms, como se espera en un equipo más lento.

Cerrada el 15 de noviembre, al terminar el proyecto (`v1.0.0`):

- **Alojamiento: Hostinger**, en lugar de Render. El equipo ya tenía allí un plan con aplicaciones Node.js, y una aplicación conectada a GitHub que se redespliega en cada push a `main`. Los pasos y los ajustes están en el [README](../../README.md#en-hostinger-aplicación-nodejs-de-hpanel).
- **Datos:** se despliegan todos los que hay, incluida la malla global de [S17](S17-relieve-global.md) (531 MB). El preajuste Express de Hostinger no tiene paso de compilación, así que la descarga y la compilación van en la instalación: [postinstall.mjs](../../scripts/postinstall.mjs) las ejecuta solo con `LUMINA_DEPLOY=1`. La instalación tiene un límite de 15 minutos, así que la malla global se detiene a los 9 y el siguiente despliegue continúa. La malla de 240 m baja en unos 20 segundos. En alojamientos con paso de compilación vale `npm run build:deploy`.
- **El DEM no entra en el repositorio:** con la descarga en paralelo ya no hace falta, y la decisión era irreversible.
- **Dirección pública:** <https://cornflowerblue-meerkat-181187.hostingersite.com>, en el README. El 15 de noviembre `/api/health` respondía allí con el DEM cargado, la malla global completa y 111 horizontes precalculados.

Sin hacer:

1. Medir el buscador de puntos en la dirección pública y anotar el tiempo en el README (criterio 6), y abrir la dirección en un móvil (criterio 4).
2. Comprobar en la pestaña Actions de GitHub que el flujo termina en verde. El repositorio es privado y no se pudo comprobar desde fuera.
3. La [copia estática de respaldo](#copia-estática-de-respaldo), que era opcional.

## Diseño

### Integración continua

`.github/workflows/ci.yml`, con Node 22, en cada push y cada pull request:

1. `npm ci`
2. `npm run typecheck`
3. `npm run fetch-data`, con el DEM guardado en caché entre ejecuciones, para no depender cada vez del servidor de NASA. Si falla, la ejecución sigue.
4. `npm test`
5. `npm run build`
6. `npm run docs:check`
7. `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).

Las pruebas de terreno y las de navegador se saltan solas si el DEM no está.

### Pruebas de tiempo

Varias specs fijan un límite de tiempo "en el portátil de desarrollo" y hay pruebas automáticas que lo exigen. En otro equipo esas pruebas fallan aunque el código esté bien: el 14 de noviembre, en un segundo portátil, recalcular seis escenarios tardó 633 ms frente al límite de 300 ms de [scenario.test.ts](../../tests/scenario.test.ts), y `npm test` terminó en rojo.

- Las aserciones de tiempo de cálculo puro pasan a ejecutarse solo con `LUMINA_PERF=1`. Son tres: [scenario.test.ts](../../tests/scenario.test.ts) (300 ms), [bestDates.test.ts](../../tests/bestDates.test.ts) (100 ms) y [hiresTerrain.test.js](../../tests/hiresTerrain.test.js) (250 ms).
- Nuevo script `npm run test:perf`, que activa esa variable. Se ejecuta a mano en el portátil de desarrollo antes de cerrar una spec con límite de tiempo.
- `npm test` y la integración continua siguen comprobando el resultado de esas pruebas, no su duración.
- Las dos pruebas de [searchServer.test.js](../../tests/searchServer.test.js) que miden que la API no se bloquea durante una búsqueda no cambian: comprueban un comportamiento, no una velocidad.

### Datos en el repositorio

**Propuesta: incluir en el repositorio la malla de 240 m** (`server/data/ldem_75s_240m.img`, 29 MB).

| | Con el DEM en el repositorio | Como hoy (se descarga) |
| --- | --- | --- |
| Compilación del alojamiento | `npm ci && npm run build` | Depende del servidor de NASA, que a veces va a 60 KB/s |
| Integración continua | Ejecuta las pruebas de terreno | Las salta |
| Clon nuevo | Funciona sin pasos extra | Necesita `npm run fetch-data` |
| Coste | 29 MB para siempre en el historial de git | Ninguno |

Los datos de LOLA son públicos. La textura del globo ya está en el repositorio. Si se acepta:

- Añadir `!server/data/ldem_75s_240m.img` a [.gitignore](../../.gitignore), después de la línea que ignora `server/data/*.img`.
- Quitar `npm run fetch-data` del comando de compilación del README.
- `npm run fetch-data` sigue existiendo para las mallas finas y los mapas de validación.

No se puede deshacer sin reescribir el historial, así que la confirma el equipo. Mientras tanto la compilación descarga el DEM.

### Despliegue

Un único servicio Node sirve la API y la web.

**Lo que necesita el alojamiento:**

| Requisito | Valor |
| --- | --- |
| Node | 22.18 o superior. Es obligatorio: el servidor carga los módulos TypeScript de `src/lib` directamente |
| Memoria | 256 MB. Medido el 14 de noviembre con solo la malla de 240 m: 80 MB al arrancar y 123 MB de pico durante una búsqueda con un hilo (148 MB con los hilos por defecto de un portátil) |
| Disco | 60 MB con el DEM |
| Proceso | Un servicio que se mantenga en ejecución; no sirve un alojamiento solo de archivos estáticos |

Las mallas finas (345 MB en disco, unos 400 MB en memoria) no se despliegan. Los sitios del catálogo responden igualmente con terreno fino gracias a los horizontes precalculados de [S06](S06-terreno-multirresolucion.md).

**Propuesta: Render, plan gratuito.** Según su [documentación](https://render.com/docs/free), consultada el 14 de noviembre de 2026: 512 MB de memoria, 0.1 de CPU, y el servicio se duerme tras 15 minutos sin visitas y tarda alrededor de un minuto en despertar. Cualquier otro alojamiento que cumpla la tabla anterior vale igual.

| Ajuste | Valor |
| --- | --- |
| Compilación | `npm ci && npm run build` (con `npm run fetch-data` delante mientras el DEM no esté en el repositorio) |
| Arranque | `npm start` |
| Comprobación de salud | `/api/health`, que debe responder `"dem": true` y `"precomputed": 36` |
| `NODE_VERSION` | Una versión 22.x igual o superior a 22.18 |
| `TRUST_PROXY` | `1`, para que el límite de peticiones vea la dirección real del cliente |
| `SEARCH_WORKERS` | `1` |
| `SEARCH_MAX_GRID` | `11` al principio |

**El buscador con 0.1 de CPU.** El buscador de puntos de [S04](S04-buscador-de-puntos.md) es cálculo puro y allí irá mucho más lento que en un portátil. El primer día se mide la malla de 11:

- Si responde en menos de 10 s, se prueba a subir `SEARCH_MAX_GRID` a 21.
- Si tarda más de 30 s, se anota en "Límites conocidos" del README que el buscador va lento en la dirección pública, y la demostración del buscador se hace en local.

La respuesta ya indica la malla realmente usada, así que la interfaz no cambia.

**Antes de enseñarlo.** Abrir la dirección unos minutos antes de la demostración, para que el servicio esté despierto.

### Protección del servidor público

- `/api/jpl` reenvía consultas a JPL Horizons. Está limitado a 30 peticiones por minuto y por dirección, con caché.
- Cabeceras de seguridad básicas y sin listado de directorios.

### Copia estática de respaldo

Recortable. Una copia de la app que funciona sin servidor, publicada en GitHub Pages, para que el enlace del jurado abra siempre y al instante aunque el servicio gratuito esté dormido o caído.

Es posible porque las efemérides ya se calculan en el navegador y los horizontes del catálogo ya están precalculados.

- Nuevo `npm run build:static`: compila la web con rutas relativas y copia junto a ella los 36 horizontes de `server/data/horizons/` y el mapa de alturas que hoy sirve `/api/heightmap`, generado como archivo.
- En [util.ts](../../src/lib/util.ts), `fetchHorizon` y `fetchHeightmap` prueban primero la API y, si no responde, usan esos archivos.
- Sin servidor quedan desactivados, con un aviso que lo explica: el buscador de puntos, la comprobación con JPL Horizons y el terreno real para puntos propios (que ya caen hoy a una Luna lisa y lo dicen).
- Un flujo de GitHub Actions la publica en cada push a `main`. GitHub Pages gratuito exige que el repositorio sea público, y hoy es privado; hay que hacerlo público de todos modos para la entrega.

Las specs posteriores que añadan datos del servidor para sitios del catálogo ([S11](S11-vista-3d.md), [S16](S16-sombra-permanente.md)) los precalculan también, para que la copia estática los tenga.

## Criterios de aceptación

1. Un push a cualquier rama ejecuta la integración continua y termina en verde.
2. Un cambio que rompe una prueba deja la marca en rojo.
3. `npm test` pasa en un equipo distinto del portátil de desarrollo, y `npm run test:perf` pasa en el portátil de desarrollo.
4. La dirección pública carga en un móvil y `/api/health` responde con el DEM cargado y los 36 horizontes precalculados.
5. La petición número 31 a `/api/jpl` en un minuto recibe un error 429.
6. El README contiene la dirección pública y el tiempo medido del buscador en ella.
7. Si se hace la copia estática: con ella, los 12 sitios polares del catálogo muestran las mismas cifras que con servidor, y las funciones que lo necesitan aparecen desactivadas con su explicación.

## Pruebas

- Automáticas: el límite de peticiones (ya existe) y, para la copia estática, que `fetchHorizon` usa el archivo cuando la API falla.
- A mano: los criterios 1 a 4 y 6.

## Fuera de alcance

- Dominio propio, despliegue automático por etiqueta y monitorización.
- Desplegar las mallas finas.

## Riesgos

- **El servicio gratuito está dormido cuando el jurado abre el enlace.** Aviso en el README, abrirlo antes de la demostración y, si se hace, la copia estática.
- **El buscador es demasiado lento en público.** Se mide el primer día y se documenta. La demostración en vivo se hace en local con `npm run share`.
- **Las condiciones del plan gratuito cambian.** Los requisitos están en una tabla aparte del proveedor, para poder elegir otro.
- **Sin internet en la presentación.** `npm run share` en local, que no depende del despliegue.

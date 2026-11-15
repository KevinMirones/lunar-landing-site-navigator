---
id: S15
titulo: Pruebas de navegador en el repositorio
title: Browser tests in the repository
estado: hecha
dia: 4
prioridad: imprescindible
depende: S03
resumen: Una orden que abre la app en un navegador real y comprueba cada función, también en cada pull request.
summary: One command that opens the app in a real browser and checks every feature, on every pull request too.
---

<a id="en"></a>
**English** | [Español](#es)

# S15: Browser tests in the repository

## Problem

Specs S01 to S07 were checked in a real browser with scripts that stayed in a temporary folder, outside the repository. Nobody else can repeat them. Now several people work at once on the same interface files, and the merge of 14 November (collapsible panels over specs S01 to S05) left eight conflicts in a single file, resolved by hand and not checked in the browser. A net is needed that warns when a change breaks what already worked.

## What the user will see

Nothing in the app. The team gains:

- `npm run e2e`: opens the built app in a browser and goes through every feature. It ends with "ALL CHECKS PASSED" or with the list of what failed.
- The same check on every pull request, inside continuous integration.

## Status

Done and checked on the second laptop, on 15 November:

- `npm run e2e` with its launcher ([run.mjs](../../e2e/run.mjs)) and the shared helpers ([lib.mjs](../../e2e/lib.mjs)).
- Six flows, all green and with no errors in the console: the five recovered ones, now adapted, and the new panels one.
- With `E2E_HIRES=1` the checks with fine grids pass too, including the one that the precomputed horizon gives the same figures as the fine terrain.
- Breaking the duplicate button on purpose makes the S01 flow fail, and it says at which step it stopped (criterion 3).
- The new step in [ci.yml](../../.github/workflows/ci.yml), with the DEM cached.

Missing:

1. **Criterion 1, total time.** On the second laptop the suite takes about 5 minutes, with software WebGL. It has to be measured on the development laptop.
2. **Criterion 5.** Seeing the new step green on GitHub. The repository is private and could not be checked from outside.

## Design

**Tool:** `playwright-core` as a development dependency. It drives a browser already installed, so it downloads none.

- The browser is chosen with `E2E_CHANNEL`: by default `msedge` on Windows and `chrome` elsewhere.
- Software WebGL (SwiftShader) by default. Forcing the graphics card, as the original scripts did, left the second laptop without WebGL2; it is still available with `E2E_GPU=1`.
- The scripts are standalone modules with the functions of [lib.mjs](../../e2e/lib.mjs): `open` (opens the page and collects the console errors), `ready` (waits until nothing is still computing), `check` (records a check) and `done` (summarises and sets the exit code). No test framework is needed.
- `npm run e2e -- s04 paneles` runs only the flows whose name contains one of those words.

**Launcher** `e2e/run.mjs`, which is what `npm run e2e` runs:

1. It checks that `dist/` exists; if not, it asks you to run `npm run build`.
2. It starts the real server on a free port with `LUMINA_HIRES=0`. That way the result is the same with or without the fine grids installed: the catalogue sites answer with their precomputed horizons.
3. It runs the flows one after another against that server and adds up the failures.
4. It stops the server and exits with a non-zero code if anything failed.

With `E2E_URL` step 2 is skipped and an address already running is tested, for example the public one.

**Rules for the flows:**

- Each flow opens the app with a shareable link that sets the state ([S02](S02-enlaces-compartibles.md)): date, sites and language. None depends on today's date.
- Each flow starts with the browser storage empty, so that the panels are open.
- None depends on the internet: the check with JPL Horizons is not used.
- Any error in the browser console counts as a failure.
- The flows are renamed to `sNN-name.mjs`.

**Flows**, with what each one checks:

| Flow | Checks | What it covers |
| --- | --- | --- |
| S01 scenarios | 16 | Duplicating with another date, that the top bar only edits the active one, common axis of the strips, removing, maximum of six |
| S02 links | 14 | The address reflects the state, copying, opening in another tab, playing without filling the history, damaged links |
| S04 search | 14 | Results on the Malapert slope, heat map, change of criterion with no new request, that the scenario created gives the promised figures, out of coverage. The two time limits are only checked with `LUMINA_PERF=1` |
| S05 best dates | 12 | Index row, sorted list, Sun filter, applying and adding dates |
| S06 and S07 | 11, and 4 more with `E2E_HIRES=1` | Terrain resolution and source of the coordinates on screen, precomputed horizon, English, 390 px wide |
| Panels | 20 | What is in the list below |

The S06 flow compared two servers, one with fine grids and one without. In `npm run e2e` only the part without fine grids remains; the other is run with `E2E_HIRES=1` on a machine that has them.

**Panels flow** (what was done on 14 November):

- Each section collapses and expands with its button, and the button changes its accessible text.
- After reloading, the collapsed sections are still collapsed.
- The enlarge-map button closes the two side panels and opens them again.
- A closed side panel leaves a bar with its name, which reopens it.
- At 390 px wide there is no horizontal overflow and the panels collapse upwards.
- With a panel collapsed, the figures of the table do not change.

**The following specs** add their own flow on finishing: it is part of "done" in the [plan](../PLAN.md).

**Continuous integration.** One more step in [ci.yml](../../.github/workflows/ci.yml), after `npm run build`: `npm run e2e`.

- GitHub's runners come with Chrome installed: `E2E_CHANNEL=chrome`.
- They have no graphics card: the software WebGL of the flows is exactly what they need.
- It needs the DEM. While it is not in the repository ([S03](S03-ci-y-despliegue.md)), continuous integration downloads it once and caches it. If the download fails, `E2E_ALLOW_NO_DEM=1` makes the step skip with a notice instead of failing.

## Acceptance criteria

1. `npm run e2e` passes locally against the built app, in under three minutes.
2. It passes the same on a machine with fine grids and on one without.
3. Breaking a feature on purpose (for example, removing the duplicate button) makes it end with an error and say which check failed.
4. No flow leaves errors in the browser console.
5. Continuous integration runs it on every pull request, or states why it skips it.
6. The panels flow exists and passes.

## Tests

This spec is the tests. It is checked with criteria 1 to 3.

## Out of scope

- Screenshot comparison.
- Testing in several browsers at once: that is the manual list of [S14](S14-robustez-y-calidad.md).
- Performance tests.

## Risks

- **Fragile tests.** Several flows read the table text with regular expressions. When adapting them it is worth moving to stable selectors; if needed, `data-testid` attributes are added to the interface.
- **Fixed waits fail on slow machines.** They are replaced with waits for the element to appear.
- **No WebGL in continuous integration.** The drawing checks are skipped there and run locally.

---

<a id="es"></a>
**Español** | [English](#en)

# S15: Pruebas de navegador en el repositorio

## Problema

Las specs S01 a S07 se comprobaron en un navegador real con scripts que se quedaron en una carpeta temporal, fuera del repositorio. Nadie más puede repetirlos. Ahora trabajan varias personas a la vez sobre los mismos archivos de interfaz, y la mezcla del 14 de noviembre (paneles plegables sobre las specs S01 a S05) dejó ocho conflictos en un solo archivo, resueltos a mano y sin comprobar en el navegador. Hace falta una red que avise cuando un cambio rompe lo que ya funcionaba.

## Qué verá el usuario

Nada en la app. El equipo gana:

- `npm run e2e`: abre la app compilada en un navegador y recorre cada función. Termina con "ALL CHECKS PASSED" o con la lista de lo que falló.
- La misma comprobación en cada pull request, dentro de la integración continua.

## Estado

Hecho y comprobado en el segundo portátil, el 15 de noviembre:

- `npm run e2e` con su lanzador ([run.mjs](../../e2e/run.mjs)) y las utilidades comunes ([lib.mjs](../../e2e/lib.mjs)).
- Seis flujos, todos en verde y sin errores en la consola: los cinco recuperados, ya adaptados, y el nuevo de paneles.
- Con `E2E_HIRES=1` pasan también las comprobaciones con mallas finas, incluida la de que el horizonte precalculado da las mismas cifras que el terreno fino.
- Romper el botón de duplicar a propósito hace fallar el flujo de S01, que dice en qué paso se quedó (criterio 3).
- El paso nuevo en [ci.yml](../../.github/workflows/ci.yml), con el DEM en caché.

Falta:

1. **Criterio 1, tiempo total.** En el segundo portátil la batería tarda unos 5 minutos, con WebGL por software. Hay que medirla en el portátil de desarrollo.
2. **Criterio 5.** Ver el paso nuevo en verde en GitHub. El repositorio es privado y no se pudo comprobar desde fuera.

## Diseño

**Herramienta:** `playwright-core` como dependencia de desarrollo. Maneja un navegador ya instalado, así que no descarga ninguno.

- El navegador se elige con `E2E_CHANNEL`: por defecto `msedge` en Windows y `chrome` en el resto.
- WebGL por software (SwiftShader) por defecto. Forzar la tarjeta gráfica, como hacían los scripts originales, dejaba sin WebGL2 al segundo portátil; sigue disponible con `E2E_GPU=1`.
- Los scripts son módulos sueltos con las funciones de [lib.mjs](../../e2e/lib.mjs): `open` (abre la página y recoge los errores de consola), `ready` (espera a que no quede nada calculándose), `check` (anota una comprobación) y `done` (resume y fija el código de salida). No hace falta un marco de pruebas.
- `npm run e2e -- s04 paneles` ejecuta solo los flujos cuyo nombre contiene alguna de esas palabras.

**Lanzador** `e2e/run.mjs`, que es lo que ejecuta `npm run e2e`:

1. Comprueba que existe `dist/`; si no, pide ejecutar `npm run build`.
2. Arranca el servidor real en un puerto libre con `LUMINA_HIRES=0`. Así el resultado es el mismo con mallas finas instaladas o sin ellas: los sitios del catálogo responden con sus horizontes precalculados.
3. Ejecuta los flujos uno tras otro contra ese servidor y suma los fallos.
4. Apaga el servidor y sale con código distinto de 0 si algo falló.

Con `E2E_URL` se salta el paso 2 y prueba una dirección ya en marcha, por ejemplo la pública.

**Reglas de los flujos:**

- Cada flujo abre la app con un enlace compartible que fija el estado ([S02](S02-enlaces-compartibles.md)): fecha, sitios e idioma. Ninguno depende de la fecha de hoy.
- Cada flujo empieza con el almacenamiento del navegador vacío, para que los paneles estén abiertos.
- Ninguno depende de internet: no se usa la comprobación con JPL Horizons.
- Cualquier error en la consola del navegador cuenta como fallo.
- Los flujos se renombran a `sNN-nombre.mjs`.

**Flujos**, con lo que comprueba cada uno:

| Flujo | Comprobaciones | Qué recorre |
| --- | --- | --- |
| S01 escenarios | 16 | Duplicar con otra fecha, que la barra superior solo edite el activo, eje común de las franjas, eliminar, máximo de seis |
| S02 enlaces | 14 | La dirección refleja el estado, copiar, abrir en otra pestaña, reproducir sin llenar el historial, enlaces dañados |
| S04 buscador | 14 | Resultados en la ladera de Malapert, mapa de calor, cambio de criterio sin nueva petición, que el escenario creado dé las cifras prometidas, fuera de cobertura. Los dos límites de tiempo solo se comprueban con `LUMINA_PERF=1` |
| S05 mejores fechas | 12 | Fila de índice, lista ordenada, filtro de Sol, aplicar y añadir fechas |
| S06 y S07 | 11, y 4 más con `E2E_HIRES=1` | Resolución del terreno y fuente de las coordenadas en pantalla, horizonte precalculado, inglés, 390 px de ancho |
| Paneles | 20 | Lo de la lista siguiente |

El flujo de S06 comparaba dos servidores, uno con mallas finas y otro sin ellas. En `npm run e2e` solo queda la parte sin mallas finas; la otra se ejecuta con `E2E_HIRES=1` en un equipo que las tenga.

**Flujo de paneles** (lo hecho el 14 de noviembre):

- Cada sección se pliega y se despliega con su botón, y el botón cambia su texto accesible.
- Tras recargar, las secciones plegadas siguen plegadas.
- El botón de ampliar el mapa cierra los dos paneles laterales y los vuelve a abrir.
- Un panel lateral cerrado deja una barra con su nombre, que lo reabre.
- A 390 px de ancho no hay desbordamiento horizontal y los paneles se pliegan hacia arriba.
- Con un panel plegado, las cifras de la tabla no cambian.

**Las specs siguientes** añaden su propio flujo al terminar: es parte de "terminado" en el [plan](../PLAN.md).

**Integración continua.** Un paso más en [ci.yml](../../.github/workflows/ci.yml), después de `npm run build`: `npm run e2e`.

- Los equipos de GitHub traen Chrome instalado: `E2E_CHANNEL=chrome`.
- No tienen tarjeta gráfica: el WebGL por software de los flujos es justo lo que necesitan.
- Necesita el DEM. Mientras no esté en el repositorio ([S03](S03-ci-y-despliegue.md)), la integración continua lo descarga una vez y lo guarda en caché. Si la descarga falla, `E2E_ALLOW_NO_DEM=1` hace que el paso se salte con un aviso en lugar de fallar.

## Criterios de aceptación

1. `npm run e2e` pasa en local contra la versión compilada, en menos de tres minutos.
2. Pasa igual en un equipo con mallas finas y en uno sin ellas.
3. Romper a propósito una función (por ejemplo, quitar el botón de duplicar) hace que termine con error y diga qué comprobación falló.
4. Ningún flujo deja errores en la consola del navegador.
5. La integración continua lo ejecuta en cada pull request, o deja dicho por qué lo salta.
6. Existe el flujo de paneles y pasa.

## Pruebas

Esta spec son las pruebas. Se comprueba con los criterios 1 a 3.

## Fuera de alcance

- Comparación de capturas de pantalla.
- Probar en varios navegadores a la vez: eso es la lista manual de [S14](S14-robustez-y-calidad.md).
- Pruebas de rendimiento.

## Riesgos

- **Pruebas frágiles.** Varios flujos leen el texto de la tabla con expresiones regulares. Al adaptarlos conviene pasar a selectores estables; si hace falta, se añaden atributos `data-testid` a la interfaz.
- **Los tiempos de espera fijos fallan en equipos lentos.** Se sustituyen por esperas a que aparezca el elemento.
- **Sin WebGL en la integración continua.** Las comprobaciones de dibujo se omiten allí y se ejecutan en local.

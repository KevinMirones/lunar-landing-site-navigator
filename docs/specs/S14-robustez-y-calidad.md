---
id: S14
titulo: Robustez y calidad
title: Robustness and quality
estado: hecha
dia: 6
prioridad: imprescindible
depende: S01, S02, S03, S15
resumen: Que funcione en cualquier equipo y navegador, con teclado, y sin sorpresas en la demostración.
summary: That it works on any machine and browser, with the keyboard, and with no surprises in the demo.
---

<a id="en"></a>
**English** | [Español](#es)

# S14: Robustness and quality

## Problem

Nearly everything has been tested on a single laptop with a single browser. The demo may be given on another machine, with a projector or a poor connection. On 14 November the first case already appeared: a timing test that passed on one laptop failed on another (solved in [S03](S03-ci-y-despliegue.md)).

## Status

The code part has been done since 15 November and checked with [quality.test.js](../../tests/quality.test.js) (13 tests) and in the browser with [s14-robustez.mjs](../../e2e/s14-robustez.mjs) (11 checks):

- **Adaptive performance.** If 8 frames in a row average more than 33 ms, the shadow map first lowers the canvas resolution and then goes from 150 to 90 ray steps, longer ones, with the same reach (about 456 km). A 1.5 s pause brings back full quality. With the browser's CPU throttled, playback lowers the quality and pausing recovers it.
- **Keyboard on the polar map:** arrows to pan, `+` and `−` to zoom and `0` to see the whole pole, with an accessible name that explains it.
- **Contrast.** Tertiary text goes from `#77746d` (3.7:1) to `#908c83`: 5.1:1 over the chassis and 4.6:1 over raised panels. A test measures the three text tones over the three backgrounds.
- **Saved state that is corrupt or from another version:** whatever does not fit is ignored, key by key.
- **No server mid-session:** the app carries on with a smooth Moon and says so.
- **JavaScript budget:** `npm run check:bundle`, also in continuous integration. Today, 271 KB compressed out of 350.

Missing, and it is manual work:

1. The list of 20 actions on two machines, on the built app (criteria 1 and 2).
2. Lighthouse for accessibility (criterion 3).
3. Chrome, Edge, Firefox and Safari, a phone and a projector at 1280 × 720.
4. Frames per second on an integrated graphics card (criterion 4).
5. Initial load on the local network and the 95th percentile of the horizon (criterion 5).
6. `npm run e2e` against the public address, once it exists (criterion 6).

## What the user will see

Nothing new. The app stops failing in edge cases.

## Design

**Adaptive performance.** The shadow map measures the time per frame during playback. If the average exceeds 33 ms, it first lowers the canvas resolution and then the ray steps from 150 to 90. On pausing it returns to full quality. The 3D view of [S11](S11-vista-3d.md), if it exists, uses the same mechanism.

**Browsers and screens:** Chrome, Edge, Firefox and Safari; phone; projector at 1280 × 720.

**Accessibility:**

- Polar map usable with the keyboard: arrows to pan, `+` and `−` to zoom.
- Contrast: tertiary text (`#77746d` over `#1a1b1e`) has a contrast of 3.7:1, below the 4.5:1 minimum for small text. It has to be lightened.
- Logical focus order and visible focus on all controls, including the buttons that collapse panels and the closed side bars.
- With "reduce motion" on in the system there are no transitions: the stylesheet already does this; it remains to be checked with the collapsible panels and the tour card.

**Loading and error states:**

- The server goes down mid-session.
- The horizon is slow: a loading indicator instead of an empty screen.
- No internet: the app already falls back to a smooth Moon; the notice must be seen.
- The saved state of the panels is corrupt or from an earlier version: it is ignored and the defaults are used.

**Budgets:**

| Measure | Limit | Today |
| --- | --- | --- |
| JavaScript of the initial load, compressed | 350 KB | 262 KB |
| Initial load on the local network | 3 s | not measured |
| Horizon request (95th percentile) | 200 ms | about 55 ms on 20 m terrain |

The 3D view is loaded on demand and does not count towards the initial load.

**List of 20 actions** for the bug hunt, done by someone who did not program that part. Actions of specs that were cut are crossed out.

1. Open the app and wait for the map to load.
2. Select five sites in a row.
3. Change the landing date by hand, and try the four durations and the three mast heights.
4. Play, pause and change speed.
5. Drag the timeline and move it with the keyboard.
6. Zoom and pan the polar map, with the mouse and with the keyboard.
7. Click the map to create a point, and add coordinates by hand, valid and invalid.
8. Switch between polar map, globe and 3D terrain, and between the Sun and Earth layers.
9. Add, duplicate and remove scenarios up to the maximum of six.
10. Click the year calendar and apply one of the best dates.
11. Search for the best point nearby, change the radius and the criterion, and add a result.
12. Collapse and expand each panel, enlarge the map and reload: the state is kept.
13. Change the solar panel, the consumptions and the battery, and watch the verdict change.
14. Change the elevation margin and the station network.
15. Do the whole guided tour, and on another attempt leave halfway.
16. Switch between simple and expert view.
17. Download the two CSVs and print the report.
18. Copy the link and open it in another browser; change language with everything open.
19. Check with JPL Horizons, and narrow the window down to the width of a phone.
20. Turn off the server and keep using the app.

## Acceptance criteria

1. The 20 actions pass without errors on two different machines, on the built app.
2. There are no errors in the console in any of them.
3. Lighthouse gives 90 or more for accessibility.
4. Playback stays above 30 frames per second on an integrated graphics card.
5. The three budgets are met.
6. `npm run e2e` passes against the built app and against the public address.

## Tests

- By hand: the list of 20 actions, which is saved ticked in `docs/historial/` together with version 1.0.
- Automated: the size of the JavaScript, in continuous integration, and the browser tests of [S15](S15-pruebas-de-navegador.md).

## Out of scope

- New features. When this spec starts, the scope is frozen.

## Risks

- **Serious faults appear on the last day.** That is why the earlier specs require trying each feature in the browser before calling it done, and the browser tests are repeated on every change.
- **Several people touch the same files up to the end.** During this spec only fixes go in, one at a time and by pull request.

---

<a id="es"></a>
**Español** | [English](#en)

# S14: Robustez y calidad

## Problema

Casi todo se ha probado en un solo portátil con un solo navegador. La demostración puede hacerse en otro equipo, con un proyector o con mala conexión. El 14 de noviembre ya apareció el primer caso: una prueba de tiempos que pasaba en un portátil falló en otro (resuelto en [S03](S03-ci-y-despliegue.md)).

## Estado

La parte de código está hecha desde el 15 de noviembre y comprobada con [quality.test.js](../../tests/quality.test.js) (13 pruebas) y en el navegador con [s14-robustez.mjs](../../e2e/s14-robustez.mjs) (11 comprobaciones):

- **Rendimiento adaptativo.** Si 8 fotogramas seguidos promedian más de 33 ms, el mapa de sombras baja primero la resolución del lienzo y después pasa de 150 a 90 pasos de rayo, más largos, con el mismo alcance (unos 456 km). Una pausa de 1.5 s devuelve la calidad completa. Con la CPU del navegador ralentizada, la reproducción baja la calidad y la pausa la recupera.
- **Teclado en el mapa polar:** flechas para desplazar, `+` y `−` para el zoom y `0` para ver todo el polo, con un nombre accesible que lo explica.
- **Contraste.** El texto terciario pasa de `#77746d` (3.7:1) a `#908c83`: 5.1:1 sobre el chasis y 4.6:1 sobre los paneles elevados. Una prueba mide los tres tonos de texto sobre los tres fondos.
- **Estado guardado corrupto o de otra versión:** se ignora lo que no encaje, clave a clave.
- **Sin servidor a mitad de sesión:** la app sigue con una Luna lisa y lo dice.
- **Presupuesto de JavaScript:** `npm run check:bundle`, también en la integración continua. Hoy, 271 KB comprimidos de 350.

Falta, y es trabajo a mano:

1. La lista de 20 acciones en dos equipos, en la versión compilada (criterios 1 y 2).
2. Lighthouse en accesibilidad (criterio 3).
3. Chrome, Edge, Firefox y Safari, un móvil y un proyector a 1280 × 720.
4. Los fotogramas por segundo en una gráfica integrada (criterio 4).
5. La carga inicial en red local y el percentil 95 del horizonte (criterio 5).
6. `npm run e2e` contra la dirección pública, cuando exista (criterio 6).

## Qué verá el usuario

Nada nuevo. La app deja de fallar en los casos límite.

## Diseño

**Rendimiento adaptativo.** El mapa de sombras mide el tiempo por fotograma durante la reproducción. Si la media supera 33 ms, baja primero la resolución del lienzo y después los pasos del rayo de 150 a 90. Al pausar vuelve a la calidad completa. La vista 3D de [S11](S11-vista-3d.md), si existe, usa el mismo mecanismo.

**Navegadores y pantallas:** Chrome, Edge, Firefox y Safari; móvil; proyector a 1280 × 720.

**Accesibilidad:**

- Mapa polar manejable con teclado: flechas para desplazar, `+` y `−` para el zoom.
- Contraste: el texto terciario (`#77746d` sobre `#1a1b1e`) tiene un contraste de 3.7:1, por debajo del mínimo de 4.5:1 para texto pequeño. Hay que aclararlo.
- Orden de foco lógico y foco visible en todos los controles, incluidos los botones que pliegan paneles y las barras laterales cerradas.
- Con "reducir movimiento" activado en el sistema no hay transiciones: la hoja de estilos ya lo hace; falta comprobarlo con los paneles plegables y con la tarjeta del recorrido.

**Estados de carga y de error:**

- El servidor cae a mitad de sesión.
- El horizonte tarda: indicador de carga en lugar de pantalla vacía.
- Sin internet: la app ya cae a una Luna lisa; el aviso debe verse.
- El estado guardado de los paneles está corrupto o es de una versión anterior: se ignora y se usan los valores por defecto.

**Presupuestos:**

| Medida | Límite | Hoy |
| --- | --- | --- |
| JavaScript de la carga inicial, comprimido | 350 KB | 262 KB |
| Carga inicial en red local | 3 s | sin medir |
| Petición de horizonte (percentil 95) | 200 ms | unos 55 ms con terreno de 20 m |

La vista 3D se carga bajo demanda y no cuenta en la carga inicial.

**Lista de 20 acciones** para la caza de errores, hecha por una persona que no haya programado esa parte. Las acciones de specs recortadas se tachan.

1. Abrir la app y esperar a que cargue el mapa.
2. Seleccionar cinco sitios seguidos.
3. Cambiar la fecha de alunizaje a mano, y probar las cuatro duraciones y las tres alturas de mástil.
4. Reproducir, pausar y cambiar de velocidad.
5. Arrastrar la línea de tiempo y moverla con el teclado.
6. Hacer zoom y desplazar el mapa polar, con el ratón y con el teclado.
7. Hacer clic en el mapa para crear un punto, y añadir coordenadas a mano, válidas e inválidas.
8. Cambiar entre mapa polar, globo y terreno 3D, y entre las capas de Sol y de Tierra.
9. Añadir, duplicar y eliminar escenarios hasta el máximo de seis.
10. Hacer clic en el calendario anual y aplicar una de las mejores fechas.
11. Buscar el mejor punto cerca, cambiar el radio y el criterio, y añadir un resultado.
12. Plegar y desplegar cada panel, ampliar el mapa y recargar: el estado se conserva.
13. Cambiar el panel solar, los consumos y la batería, y ver cambiar el veredicto.
14. Cambiar el margen de elevación y la red de estaciones.
15. Hacer el recorrido guiado completo, y en otro intento salir a la mitad.
16. Cambiar entre vista sencilla y experta.
17. Descargar los dos CSV e imprimir el informe.
18. Copiar el enlace y abrirlo en otro navegador; cambiar de idioma con todo abierto.
19. Comprobar con JPL Horizons, y estrechar la ventana hasta el ancho de un móvil.
20. Apagar el servidor y seguir usando la app.

## Criterios de aceptación

1. Las 20 acciones pasan sin errores en dos equipos distintos, en la versión compilada.
2. No hay errores en la consola en ninguna de ellas.
3. Lighthouse da 90 o más en accesibilidad.
4. La reproducción se mantiene por encima de 30 fotogramas por segundo en una gráfica integrada.
5. Se cumplen los tres presupuestos.
6. `npm run e2e` pasa contra la versión compilada y contra la dirección pública.

## Pruebas

- A mano: la lista de 20 acciones, que se guarda marcada en `docs/historial/` junto a la versión 1.0.
- Automáticas: el tamaño del JavaScript, en la integración continua, y las pruebas de navegador de [S15](S15-pruebas-de-navegador.md).

## Fuera de alcance

- Funciones nuevas. Al empezar esta spec se congela el alcance.

## Riesgos

- **Aparecen fallos graves el último día.** Por eso las specs anteriores exigen probar cada función en el navegador antes de darla por hecha, y las pruebas de navegador se repiten en cada cambio.
- **Varias personas tocan los mismos archivos hasta el final.** Durante esta spec solo entran correcciones, de una en una y por pull request.

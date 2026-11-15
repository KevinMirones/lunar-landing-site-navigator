---
fecha: 2026-11-14
titulo: Paneles plegables, mapa ampliado y logo nuevo
title: Collapsible panels, enlarged map and new logo
tipo: hito
resumen: Cada sección se pliega y recuerda su estado; un botón deja el mapa a todo el ancho. Mezclado con S01 a S07 y ya en main.
summary: Each section collapses and remembers its state; one button gives the map the full width. Merged with S01 to S07 and already in main.
---

<a id="en"></a>
**English** | [Español](#es)

# Collapsible panels, enlarged map and new logo

Work done in parallel with specs S01 to S07, on another machine and without a spec of its own. It was done on the `samuel` branch (commit `7c2611a`), merged there with the specs from `main` (`986df5f`) and went into `main` with pull request #6.

## What was done

- **Collapsible sections.** The panorama, the timeline, the comparison and the calendar collapse with a button in their header.
- **Side panels.** The site list and the site status close to one side and leave a narrow bar with their name, which reopens them. On screens where they sit above or below the map, they collapse upwards.
- **Enlarged map.** A button in the map header closes both side panels at once and brings them back.
- **The state is remembered** in the browser, under the `lumina.panels` key.
- **Collapsing stops nothing.** It is visual only: the computations of a closed panel carry on, and the figures of the rest do not change.
- **Logo and favicon.** The limb of the Moon with sunlight showing over it.
- **Panorama.** Long labels, such as "Earth −3.9° (hidden)", are no longer cut off near the right edge.

## How it is built

- [Collapse.tsx](../../src/components/Collapse.tsx): `Collapse` (the region that collapses), `SectionToggle` (its button, with `aria-expanded` and accessible text) and the icons.
- [Wordmark.tsx](../../src/components/Wordmark.tsx): the logo.
- [util.ts](../../src/lib/util.ts): `useStoredState` (state remembered in the browser; if storage is blocked, it keeps working without remembering) and `useMedia`.
- [App.tsx](../../src/App.tsx): the `PANELS` constant with one key per section (`sites`, `status`, `hero`, `when`, `compare`, `calendar`).
- The animation is CSS, on the rows of a grid, so the panel animates its real size and the maps resize with it.

## What the following specs must respect

- A new interface block goes inside a `Collapse`, with its key in `PANELS` and its `SectionToggle` in the header.
- A closed panel must not stop computing: other parts of the app use its results.
- New keys are added to `PANELS` with their default value. `useStoredState` fills in with the defaults whatever is missing from a state saved by an earlier version.

## The merge with main

That same day `main` had received specs S01 to S05, which rewrite the state of `App.tsx`. The merge left eight conflicts, all in that file. All the features of `main` were kept and the panels were applied to them. Two visible changes:

- The "Find the best point nearby" button ended up grouped with the layer selector and the enlarge-map button.
- The title of the comparison is "Compare scenarios", as in `main`.

## What was checked and what was not

| Check | Result |
| --- | --- |
| `npm run build` (types and build) | Passes |
| `npm test` | 117 pass, 5 skipped, 1 fails |
| Compressed JavaScript | 262 KB |
| The app in a browser, after the merge | Not checked |

- The failing test is the timing one in [scenario.test.ts](../../tests/scenario.test.ts): 633 ms against a 300 ms limit. It only uses code that is identical to that of `main`; it fails because this machine is slower. [S03](../specs/S03-ci-y-despliegue.md) takes the timing tests out of `npm test`.
- The combination of panels and search has not been seen on screen. [S15](../specs/S15-pruebas-de-navegador.md) includes a panels flow to cover it.

---

<a id="es"></a>
**Español** | [English](#en)

# Paneles plegables, mapa ampliado y logo nuevo

Trabajo hecho en paralelo a las specs S01 a S07, en otro equipo y sin spec propia. Se hizo en la rama `samuel` (commit `7c2611a`), se mezcló allí con las specs de `main` (`986df5f`) y entró en `main` con el pull request #6.

## Qué se hizo

- **Secciones plegables.** El panorama, la línea de tiempo, la comparación y el calendario se pliegan con un botón en su cabecera.
- **Paneles laterales.** La lista de sitios y el estado del sitio se cierran hacia un lado y dejan una barra estrecha con su nombre, que los reabre. En pantallas donde quedan encima o debajo del mapa, se pliegan hacia arriba.
- **Mapa ampliado.** Un botón en la cabecera del mapa cierra los dos paneles laterales a la vez y los devuelve.
- **El estado se recuerda** en el navegador, bajo la clave `lumina.panels`.
- **Plegar no detiene nada.** Es solo visual: los cálculos de un panel cerrado siguen, y las cifras del resto no cambian.
- **Logo y favicon.** El limbo de la Luna con la luz del Sol asomando sobre él.
- **Panorama.** Las etiquetas largas, como "Tierra −3.9° (oculto)", ya no se cortan cerca del borde derecho.

## Cómo está hecho

- [Collapse.tsx](../../src/components/Collapse.tsx): `Collapse` (la región que se pliega), `SectionToggle` (su botón, con `aria-expanded` y texto accesible) y los iconos.
- [Wordmark.tsx](../../src/components/Wordmark.tsx): el logo.
- [util.ts](../../src/lib/util.ts): `useStoredState` (estado recordado en el navegador; si el almacenamiento está bloqueado, sigue funcionando sin recordar) y `useMedia`.
- [App.tsx](../../src/App.tsx): la constante `PANELS` con una clave por sección (`sites`, `status`, `hero`, `when`, `compare`, `calendar`).
- La animación es de CSS, sobre las filas de una rejilla, así que el panel anima su tamaño real y los mapas se redimensionan con él.

## Lo que deben respetar las specs siguientes

- Un bloque nuevo de la interfaz va dentro de un `Collapse`, con su clave en `PANELS` y su `SectionToggle` en la cabecera.
- Un panel cerrado no debe dejar de calcular: otras partes de la app usan sus resultados.
- Las claves nuevas se añaden a `PANELS` con su valor por defecto. `useStoredState` completa con los valores por defecto lo que falte en un estado guardado por una versión anterior.

## La mezcla con main

`main` había recibido ese mismo día las specs S01 a S05, que reescriben el estado de `App.tsx`. La mezcla dejó ocho conflictos, todos en ese archivo. Se conservaron todas las funciones de `main` y se les aplicaron los paneles. Dos cambios visibles:

- El botón "Buscar el mejor punto cerca" quedó agrupado con el selector de capa y el botón de ampliar el mapa.
- El título de la comparación es "Comparar escenarios", como en `main`.

## Qué se comprobó y qué no

| Comprobación | Resultado |
| --- | --- |
| `npm run build` (tipos y compilación) | Pasa |
| `npm test` | 117 pasan, 5 omitidas, 1 falla |
| JavaScript comprimido | 262 KB |
| La app en un navegador, después de la mezcla | Sin comprobar |

- La prueba que falla es la de tiempos de [scenario.test.ts](../../tests/scenario.test.ts): 633 ms frente a un límite de 300 ms. Solo usa código que es idéntico al de `main`; falla porque este equipo es más lento. [S03](../specs/S03-ci-y-despliegue.md) saca las pruebas de tiempo de `npm test`.
- La combinación de paneles y buscador no se ha visto en pantalla. [S15](../specs/S15-pruebas-de-navegador.md) incluye un flujo de paneles para cubrirlo.

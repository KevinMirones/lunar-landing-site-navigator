---
id: S01
titulo: Escenarios comparables
title: Comparable scenarios
estado: hecha
dia: 1
prioridad: imprescindible
depende: -
resumen: Comparar lado a lado el mismo sitio en fechas, duraciones o mástiles distintos.
summary: Compare the same site side by side on different dates, durations or mast heights.
---

<a id="en"></a>
**English** | [Español](#es)

# S01: Comparable scenarios

## Problem

The comparison table only accepts different sites with one shared date, duration and mast height. The challenge brief asks for the opposite when there is a delay: "alternative dates at the same site". Today that means changing the date and remembering the earlier figures.

## What the user will see

- A **scenario** is a combination of site, landing date, duration and mast height.
- There is always one active scenario: it is the one shown by the panorama, the map, the status and the timeline. The controls in the top bar edit that scenario.
- "Compare" in the site list adds a scenario with that site and the active date, duration and mast.
- Each table row has "Duplicate with another date", which creates a copy seven days later and leaves it active for adjusting.
- The table gains a "Landing" column with date, duration and mast.
- The window strips are aligned by mission day: day 0 is the landing in every row. If the durations differ, the axis spans the longest.
- On the year calendar, a click moves the landing of the active scenario; a Shift-click adds a new scenario on that day.
- Every new scenario becomes active, so it can be seen and adjusted at once.
- Six scenarios at most. The last one cannot be removed.
- The comparison and the calendar take the full width, one below the other: with the landing column and the actions, the table no longer fits in half a screen.

## Design

- New `src/lib/scenario.ts` with the type `Scenario { id, siteId, landing, durationDays, mast }` and the functions to create, duplicate and get the cache key.
- In [App.tsx](../../src/App.tsx), `pinned: string[]` and the global values `landing`, `durationDays` and `mast` are replaced by `scenarios: Scenario[]` and `activeId`. Date, duration and mast are derived from the active scenario.
- The `analyses` map is now indexed by scenario id. Each scenario has its own time grid.
- The ephemeris cache of [series.ts](../../src/lib/series.ts) holds 12 grids today; it is enlarged for six scenarios plus the year series.
- `WindowStrip` in [Timeline.tsx](../../src/components/Timeline.tsx) receives the start of each scenario and the longest duration, and places each window at `(t − landing) / longestDuration`.
- The highlight of the best value per column does not change.

## Acceptance criteria

1. The same site added twice with different dates shows different metrics.
2. Changing the date in the top bar only alters the active row.
3. The strips of all rows start at the same point (day 0).
4. Removing the active scenario activates the previous one; the last one cannot be removed.
5. With six 90-day scenarios, the full recomputation takes under 300 ms.

## Tests

- Automated: creating and duplicating scenarios, and normalising windows by mission day.
- By hand: the five criteria above in the browser.

## Out of scope

- Saving scenarios between sessions: [S02](S02-enlaces-compartibles.md) covers it.
- Power parameters: [S08](S08-energia-y-bateria.md), which uses a single configuration for all scenarios.

## Risks

- It is the change that touches the application state the most. It is done first because the other specs build on it; if it gets complicated, go back to the `mvp-v0.1.0` tag.

---

<a id="es"></a>
**Español** | [English](#en)

# S01: Escenarios comparables

## Problema

La tabla de comparación solo admite sitios distintos con una misma fecha, duración y altura de mástil. La consigna pide lo contrario cuando hay un retraso: "fechas alternativas en el mismo sitio". Hoy eso obliga a cambiar la fecha y recordar las cifras anteriores.

## Qué verá el usuario

- Un **escenario** es una combinación de sitio, fecha de alunizaje, duración y altura de mástil.
- Siempre hay un escenario activo: es el que muestran el panorama, el mapa, el estado y la línea de tiempo. Los controles de la barra superior editan ese escenario.
- "Comparar" en la lista de sitios añade un escenario con ese sitio y la fecha, duración y mástil activos.
- Cada fila de la tabla tiene "Duplicar con otra fecha", que crea una copia siete días después y la deja activa para ajustarla.
- La tabla gana una columna "Alunizaje" con fecha, duración y mástil.
- Las franjas de ventanas se alinean por día de misión: el día 0 es el alunizaje en todas las filas. Si las duraciones difieren, el eje abarca la más larga.
- En el calendario anual, un clic mueve el alunizaje del escenario activo; un clic con Mayús añade un escenario nuevo en ese día.
- Todo escenario nuevo queda activo, para verlo y ajustarlo enseguida.
- Máximo seis escenarios. No se puede eliminar el último.
- La comparación y el calendario ocupan el ancho completo, uno debajo del otro: con la columna de alunizaje y las acciones, la tabla ya no cabe en media pantalla.

## Diseño

- Nuevo `src/lib/scenario.ts` con el tipo `Scenario { id, siteId, landing, durationDays, mast }` y las funciones para crear, duplicar y obtener la clave de caché.
- En [App.tsx](../../src/App.tsx), `pinned: string[]` y los valores globales `landing`, `durationDays` y `mast` se sustituyen por `scenarios: Scenario[]` y `activeId`. La fecha, la duración y el mástil se derivan del escenario activo.
- El mapa `analyses` pasa a indexarse por id de escenario. Cada escenario tiene su propia rejilla de tiempo.
- La caché de efemérides de [series.ts](../../src/lib/series.ts) admite hoy 12 rejillas; se amplía para seis escenarios más la serie anual.
- `WindowStrip` en [Timeline.tsx](../../src/components/Timeline.tsx) recibe el inicio de cada escenario y la duración máxima, y coloca cada ventana en `(t − alunizaje) / duraciónMáxima`.
- El resaltado del mejor valor por columna no cambia.

## Criterios de aceptación

1. El mismo sitio añadido dos veces con fechas distintas muestra métricas distintas.
2. Cambiar la fecha en la barra superior solo altera la fila activa.
3. Las franjas de todas las filas empiezan en el mismo punto (día 0).
4. Al eliminar el escenario activo se activa el anterior; el último no se puede eliminar.
5. Con seis escenarios de 90 días, el recálculo completo tarda menos de 300 ms.

## Pruebas

- Automáticas: creación y duplicado de escenarios, y normalización de ventanas por día de misión.
- A mano: los cinco criterios anteriores en el navegador.

## Fuera de alcance

- Guardar los escenarios entre sesiones: lo cubre [S02](S02-enlaces-compartibles.md).
- Parámetros de energía: [S08](S08-energia-y-bateria.md), que usa una sola configuración para todos los escenarios.

## Riesgos

- Es el cambio que más toca el estado de la aplicación. Se hace el primero porque las demás specs se apoyan en él; si se complica, se vuelve a la etiqueta `mvp-v0.1.0`.

---
id: S04
titulo: Buscador de puntos cercanos
title: Search for nearby points
estado: hecha
dia: 2
prioridad: imprescindible
depende: S01
resumen: Mapa de calor alrededor de un punto y los cinco mejores lugares para aterrizar cerca.
summary: A heat map around a point and the five best places to land nearby.
---

<a id="en"></a>
**English** | [Español](#es)

# S04: Search for nearby points

## Problem

On the Malapert massif, moving the point 1.2 km changes the Earth link from 0% to 100% ([finding](../historial/2026-11-14-03-hallazgo-malapert.md)). Today the user only discovers this by trying click after click. The challenge brief asks to help understand why a small change of location has such an impact and to assess "alternative sites in the same region".

## What the user will see

- In the active scenario, a "Find the best point nearby" button.
- They choose the radius (2, 5 or 10 km) and the criterion: sunlight, link or index.
- A coarse heat map appears at once over the polar map, and is refined a few seconds later.
- A list with the five best points: distance and bearing from the original, sunlight, link, longest night and terrain slope.
- Each point can be selected or added as a scenario.

## Design

**Service** `GET /api/search?lat&lon&radius&mast&t0&days&grid`:

- `grid` is 11, 21 or 41 points per side. The client asks for 11 first and then 41.
- Response: `{ center, radiusKm, grid, cellKm, ms, cells: [{ i, j, lat, lon, covered, elevM, slopeDeg, sunShare, earthShare, bothShare, longestDarkH, score }] }`.
- The server returns all the cells and the browser picks the five best ([search.ts](../../src/lib/search.ts)). That way, changing the criterion reorders at once, with no further request.
- The grid is laid out in the plane of the polar map, so the cells are squares aligned with the map.
- Cells north of 80°S are marked "no real terrain".

**Shared computation.** The server needs the ephemeris and the metrics, which today exist only in `src/lib` in TypeScript. The server will import those modules directly: Node 22.18 or newer strips the types when loading them. The `.ts` extension has to be added to their relative imports and `engines` set in `package.json`. If the host does not allow it, they are compiled with esbuild.

**Performance:**

| Grid | Cells in the disc | Estimated, one thread | Measured, four threads |
| --- | --- | --- | --- |
| 11 × 11 | about 100 | about 2 s | 0.6 s |
| 21 × 21 | about 320 | about 5 s | 1.0 s |
| 41 × 41 | about 1260 | about 20 s | 3.9 s |

Measured on the development laptop (12 cores), 5 km radius and a 30-day mission.

- Each cell costs about 16 ms: a horizon with 360 azimuths and a series with a one-hour step.
- Worker threads (`worker_threads`), four at most, with the DEM in shared memory so it is not copied.
- One search at a time per server; the others wait. It is cancelled if the client disconnects. Results are cached.
- `SEARCH_WORKERS` sets the number of threads and `SEARCH_MAX_GRID` limits the grid on a small server; the response states the grid used.

**Terrain slope.** Each cell includes the local slope computed from the DEM. A point with a lot of sunlight on a 25° slope is no good for landing; the five best exclude slopes above 15°. On the map, those cells are hatched.

**Ties.** With the same value of the criterion, the higher index wins and, after that, the point closest to the original.

**Point created.** Using or adding a result creates a custom point with the name of the original and its offset, for example "Custom 1 +1.7 km NE". It keeps five decimals so that the scenario gives exactly the figures of the search ([why](../historial/2026-11-14-06-dieciseis-metros.md)).

**Heat map.** A layer over [PolarMap.tsx](../../src/components/PolarMap.tsx), with a single hue per criterion (gold for sunlight, blue for link) and a legend with minimum and maximum.

## Acceptance criteria

1. From the south slope of Malapert (85.99°S, 2.93°W), with a 5 km radius and the link criterion, it proposes a point with continuous link.
2. The grid of 11 answers in under 2 seconds and the grid of 41 in under 10, on the development laptop.
6. The scenario created from a result shows exactly the sunlight, link and index that the search showed.
3. The five best are at least one cell apart and none exceeds the slope limit.
4. The centre cell matches the metrics of the active scenario (one point of difference at most).
5. Two simultaneous searches do not block the rest of the API.

## Tests

- Automated: criterion 1 as a regression test, and criterion 4.
- By hand: timings and the look of the heat map.

## Out of scope

- Continuous optimisation (finer than the grid).
- Rocks, small craters and other landing safety criteria.

## Risks

- **Computation time on a small public server.** There it is limited to the grid of 21, with a notice.
- **Resolution.** With 240 m cells the heat map is coarse for 2 km radii; it improves with [S06](S06-terreno-multirresolucion.md).

---

<a id="es"></a>
**Español** | [English](#en)

# S04: Buscador de puntos cercanos

## Problema

En el macizo Malapert, mover el punto 1.2 km cambia el enlace con la Tierra de 0% a 100% ([hallazgo](../historial/2026-11-14-03-hallazgo-malapert.md)). Hoy el usuario solo lo descubre probando clic a clic. La consigna pide ayudar a entender por qué un cambio pequeño de ubicación tiene tanto impacto y evaluar "sitios alternativos en la misma región".

## Qué verá el usuario

- En el escenario activo, un botón "Buscar el mejor punto cerca".
- Elige el radio (2, 5 o 10 km) y el criterio: luz solar, enlace o índice.
- Aparece enseguida un mapa de calor grueso sobre el mapa polar, que se afina unos segundos después.
- Una lista con los cinco mejores puntos: distancia y rumbo desde el original, luz, enlace, noche más larga y pendiente del terreno.
- Cada punto se puede seleccionar o añadir como escenario.

## Diseño

**Servicio** `GET /api/search?lat&lon&radius&mast&t0&days&grid`:

- `grid` es 11, 21 o 41 puntos por lado. El cliente pide primero 11 y después 41.
- Respuesta: `{ center, radiusKm, grid, cellKm, ms, cells: [{ i, j, lat, lon, covered, elevM, slopeDeg, sunShare, earthShare, bothShare, longestDarkH, score }] }`.
- El servidor devuelve todas las celdas y el navegador elige las cinco mejores ([search.ts](../../src/lib/search.ts)). Así, cambiar de criterio reordena al instante, sin otra petición.
- La malla se traza en el plano del mapa polar, de modo que las celdas son cuadrados alineados con el mapa.
- Las celdas al norte de 80°S se marcan como "sin terreno real".

**Cálculo compartido.** El servidor necesita las efemérides y las métricas, que hoy solo existen en `src/lib` en TypeScript. El servidor importará esos módulos directamente: Node 22.18 o superior elimina los tipos al cargarlos. Hay que añadir la extensión `.ts` a sus importaciones relativas y fijar `engines` en `package.json`. Si el alojamiento no lo permite, se compilan con esbuild.

**Rendimiento:**

| Malla | Celdas en el disco | Estimado, un hilo | Medido, cuatro hilos |
| --- | --- | --- | --- |
| 11 × 11 | unas 100 | unos 2 s | 0.6 s |
| 21 × 21 | unas 320 | unos 5 s | 1.0 s |
| 41 × 41 | unas 1260 | unos 20 s | 3.9 s |

Medido en el portátil de desarrollo (12 núcleos), radio de 5 km y misión de 30 días.

- Cada celda cuesta unos 16 ms: horizonte con 360 azimuts y serie con paso de una hora.
- Hilos de trabajo (`worker_threads`), como máximo cuatro, con el DEM en memoria compartida para no copiarlo.
- Una sola búsqueda a la vez por servidor; las demás esperan. Se cancela si el cliente se desconecta. Resultados en caché.
- `SEARCH_WORKERS` fija el número de hilos y `SEARCH_MAX_GRID` limita la malla en un servidor pequeño; la respuesta indica la malla usada.

**Pendiente del terreno.** Cada celda incluye la pendiente local calculada del DEM. Un punto con mucha luz en una ladera de 25° no sirve para aterrizar; los cinco mejores excluyen pendientes mayores de 15°. En el mapa, esas celdas van rayadas.

**Empates.** Con el mismo valor del criterio gana el índice más alto y, después, el punto más cercano al original.

**Punto creado.** Al usar o añadir un resultado se crea un punto propio con el nombre del original y su desplazamiento, por ejemplo "Custom 1 +1.7 km NE". Guarda cinco decimales para que el escenario dé exactamente las cifras del buscador ([por qué](../historial/2026-11-14-06-dieciseis-metros.md)).

**Mapa de calor.** Capa sobre [PolarMap.tsx](../../src/components/PolarMap.tsx), con un solo tono por criterio (oro para luz, azul para enlace) y leyenda con mínimo y máximo.

## Criterios de aceptación

1. Desde la ladera sur de Malapert (85.99°S, 2.93°W), con radio de 5 km y criterio de enlace, propone un punto con enlace continuo.
2. La malla de 11 responde en menos de 2 segundos y la de 41 en menos de 10, en el portátil de desarrollo.
6. El escenario creado desde un resultado muestra exactamente la luz, el enlace y el índice que mostraba el buscador.
3. Los cinco mejores están separados entre sí al menos una celda y ninguno supera el límite de pendiente.
4. La celda central coincide con las métricas del escenario activo (diferencia de un punto como máximo).
5. Dos búsquedas simultáneas no bloquean el resto de la API.

## Pruebas

- Automáticas: criterio 1 como prueba de regresión y criterio 4.
- A mano: tiempos y aspecto del mapa de calor.

## Fuera de alcance

- Optimización continua (más fina que la malla).
- Rocas, cráteres pequeños y otros criterios de seguridad del aterrizaje.

## Riesgos

- **Tiempo de cálculo en un servidor público pequeño.** Allí se limita a la malla de 21 y se avisa.
- **Resolución.** Con celdas de 240 m el mapa de calor es grueso para radios de 2 km; mejora con [S06](S06-terreno-multirresolucion.md).

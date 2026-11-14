---
id: S04
titulo: Buscador de puntos cercanos
estado: hecha
dia: 2
prioridad: imprescindible
depende: S01
resumen: Mapa de calor alrededor de un punto y los cinco mejores lugares para aterrizar cerca.
---

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

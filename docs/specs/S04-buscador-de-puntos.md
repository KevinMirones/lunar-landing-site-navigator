---
id: S04
titulo: Buscador de puntos cercanos
estado: pendiente
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
- Respuesta: `{ cells: [{ lat, lon, elevM, slopeDeg, sunShare, earthShare, bothShare, longestDarkH, score }], best: [...] }`.
- Las celdas al norte de 80°S se marcan como "sin terreno real".

**Cálculo compartido.** El servidor necesita las efemérides y las métricas, que hoy solo existen en `src/lib` en TypeScript. El servidor importará esos módulos directamente: Node 22.18 o superior elimina los tipos al cargarlos. Hay que añadir la extensión `.ts` a sus importaciones relativas y fijar `engines` en `package.json`. Si el alojamiento no lo permite, se compilan con esbuild.

**Rendimiento:**

| Malla | Celdas | Un hilo | Cuatro hilos |
| --- | --- | --- | --- |
| 11 × 11 | 121 | unos 2 s | menos de 1 s |
| 41 × 41 | 1681 | unos 27 s | unos 7 s |

- Cada celda cuesta unos 16 ms: horizonte con 360 azimuts y serie con paso de una hora.
- Hilos de trabajo (`worker_threads`), como máximo cuatro, con el DEM en memoria compartida para no copiarlo.
- Una sola búsqueda a la vez por servidor; las demás esperan. Se cancela si el cliente se desconecta. Resultados en caché.

**Pendiente del terreno.** Cada celda incluye la pendiente local calculada del DEM. Un punto con mucha luz en una ladera de 25° no sirve para aterrizar; los cinco mejores excluyen pendientes mayores de 15°, y el límite es ajustable.

**Mapa de calor.** Capa sobre [PolarMap.tsx](../../src/components/PolarMap.tsx), con un solo tono por criterio (oro para luz, azul para enlace) y leyenda con mínimo y máximo.

## Criterios de aceptación

1. Desde la ladera sur de Malapert (85.99°S, 2.93°W), con radio de 5 km y criterio de enlace, propone un punto con enlace continuo.
2. La malla de 11 responde en menos de 2 segundos y la de 41 en menos de 10, en el portátil de desarrollo.
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

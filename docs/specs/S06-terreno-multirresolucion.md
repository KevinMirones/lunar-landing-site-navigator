---
id: S06
titulo: Terreno multirresolución
estado: hecha
dia: 3
prioridad: imprescindible
depende: -
resumen: Horizonte calculado con celdas de 20 a 80 m cerca del sitio, en lugar de 240 m.
---

# S06: Terreno multirresolución

## Problema

Con celdas de 240 m, el horizonte cercano es solo una aproximación de la pendiente local. En el polo, donde el Sol roza el horizonte, una loma de 30 m a 300 m de distancia tapa 5° de cielo. Es el límite de precisión más importante del MVP.

## Qué verá el usuario

- En el estado del sitio, la resolución usada: "Horizonte calculado con topografía LOLA de 20 m".
- Resultados más fiables cerca del polo, sin cambios en la forma de usar la herramienta.

## Diseño

**Mallas anidadas** del mismo catálogo LOLA, todas en proyección estereográfica polar:

| Producto | Celda | Cobertura | Tamaño | Lado |
| --- | --- | --- | --- | --- |
| `ldem_875s_20m` | 20 m | 87.5°S a 90°S | 115 MB | 7584 |
| `ldem_85s_40m` | 40 m | 85°S a 90°S | 115 MB | 7584 |
| `ldem_80s_80m` | 80 m | 80°S a 90°S | 116 MB | 7600 |
| `ldem_75s_240m` (actual) | 240 m | 75°S a 90°S | 28 MB | 3812 |

- [dem.js](../../server/dem.js) pasa de una malla fija a una lista. `heightAtXY` usa la más fina que contenga el punto.
- [horizon.js](../../server/horizon.js) empieza el rayo a media celda de la malla que hay bajo el sitio (10 m con la de 20 m), avanza de media celda en media celda y luego un 1% de la distancia por paso. Son unos 700 pasos por rayo frente a los 450 anteriores. Las distancias y sus senos y cosenos se calculan una vez y se comparten entre todos los rayos.
- La respuesta de `/api/horizon` añade `resolutionM`, y `precomputed` cuando el horizonte es precalculado. El modelo pasa a llamarse `lola` (antes `lola-240m`).
- `/api/health` informa de las mallas cargadas (`resolutionsM`) y del número de horizontes precalculados.
- `npm run fetch-data -- --hires` descarga las tres mallas (345 MB), con la descarga reanudable que ya existe. Sin ellas todo funciona con 240 m.
- `LUMINA_HIRES=0` arranca el servidor sin cargar las mallas finas aunque estén instaladas.
- El buscador de puntos de [S04](S04-buscador-de-puntos.md) usa también el terreno fino. Para compensar el coste, pasa de 4 a 8 hilos de trabajo como máximo.

**Horizontes precalculados.** Cargar 345 MB no cabe en un alojamiento gratuito. `npm run precompute` calcula con terreno fino los horizontes de los sitios del catálogo para cada altura de mástil y los guarda en `server/data/horizons/` (36 archivos, unos 12 KB cada uno, que sí van en el repositorio). El servidor usa uno de ellos cuando su terreno es más fino que el que tiene instalado. Hay que repetir la orden si cambian las coordenadas del catálogo.

**Sin cambios:** el mapa de sombras del navegador sigue con celdas de 480 m.

## Criterios de aceptación

1. Las pruebas existentes de [horizon.test.js](../../tests/horizon.test.js) pasan con y sin mallas finas. Solo cambió en ellas el nombre del modelo.
2. En el mismo punto, la altura de dos mallas contiguas difiere menos de 50 m de media.
3. Un horizonte con terreno fino tarda menos de 100 ms. Medido: 55 ms con la malla de 20 m.
4. El sitio indica la resolución realmente usada, incluido el caso precalculado.
5. Hay una tabla con el cambio de luz y enlace entre 240 m y malla fina en ocho sitios: sección 3 de [VALIDACION-salida.md](../VALIDACION-salida.md).
6. El buscador de puntos sigue respondiendo en menos de 10 s con la malla de 41. Medido: 5.2 s en la cresta, sobre terreno de 20 m.

## Pruebas

- Automáticas, sin descargar nada: mallas sintéticas para la elección de malla y para una loma de 30 m a 300 m, que debe levantar el horizonte unos 5°; y el uso del horizonte precalculado.
- Automáticas, con las mallas finas instaladas: criterios 1, 2 y 3. Toda la batería se ejecuta también con `LUMINA_HIRES=0`.
- En el navegador: el texto de resolución con mallas finas, con horizonte precalculado y con un punto personalizado sobre 240 m; y que el horizonte precalculado da las mismas cifras que el calculado.
- Criterio 5: lo genera `npm run validate`, junto con [S07](S07-validacion-y-coordenadas.md).

## Fuera de alcance

- La malla de 20 m para toda la zona (`ldem_80s_20m`, 1.85 GB).
- Mallas de 5 y 10 m.
- Mapa de sombras a mayor resolución.

## Riesgos

- **Descarga lenta.** A 60 KB/s cada archivo tarda media hora. Se lanza el día 1.
- **Cabeceras distintas.** Cada producto tiene su propio archivo `.lbl`; el tamaño y el desplazamiento se leen de ahí, no se suponen.
- **Recorte posible:** si falta tiempo se deja fuera la malla de 20 m y se conservan 40 y 80 m. No hizo falta.
- **Memoria.** Con las tres mallas el servidor usa unos 400 MB. Un alojamiento pequeño arranca sin ellas y sirve los sitios del catálogo con los horizontes precalculados; los puntos personalizados y el buscador quedan entonces en 240 m.

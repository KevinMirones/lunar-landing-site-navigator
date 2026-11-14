---
id: S06
titulo: Terreno multirresolución
estado: pendiente
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
- [horizon.js](../../server/horizon.js) empieza el rayo a media celda de la malla más fina (10 m) y sigue creciendo un 1% por paso. Son unos 700 pasos por rayo frente a los 450 actuales.
- La respuesta de `/api/horizon` añade `resolutionM`.
- `npm run fetch-data -- --hires` descarga las tres mallas (345 MB), con la descarga reanudable que ya existe. Sin ellas todo funciona con 240 m.

**Horizontes precalculados.** Cargar 345 MB no cabe en un alojamiento gratuito. `npm run precompute` calcula con terreno fino los horizontes de los sitios del catálogo para cada altura de mástil y los guarda en `server/data/horizons/` (unos 8 KB por archivo). El servidor los usa cuando no tiene las mallas finas.

**Sin cambios:** el mapa de sombras del navegador sigue con celdas de 480 m.

## Criterios de aceptación

1. Las pruebas existentes de [horizon.test.js](../../tests/horizon.test.js) pasan con y sin mallas finas.
2. En el mismo punto, la altura de dos mallas contiguas difiere menos de 50 m de media.
3. Un horizonte con terreno fino tarda menos de 100 ms.
4. El sitio indica la resolución realmente usada, incluido el caso precalculado.
5. Hay una tabla con el cambio de luz y enlace entre 240 m y malla fina en cinco sitios.

## Pruebas

- Automáticas: criterios 1 y 2, y que un sitio del catálogo sin mallas finas devuelve el horizonte precalculado.
- A mano: criterio 5, que alimenta [S07](S07-validacion-y-coordenadas.md).

## Fuera de alcance

- La malla de 20 m para toda la zona (`ldem_80s_20m`, 1.85 GB).
- Mallas de 5 y 10 m.
- Mapa de sombras a mayor resolución.

## Riesgos

- **Descarga lenta.** A 60 KB/s cada archivo tarda media hora. Se lanza el día 1.
- **Cabeceras distintas.** Cada producto tiene su propio archivo `.lbl`; el tamaño y el desplazamiento se leen de ahí, no se suponen.
- **Recorte posible:** si falta tiempo se deja fuera la malla de 20 m y se conservan 40 y 80 m.

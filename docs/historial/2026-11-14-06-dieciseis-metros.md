---
fecha: 2026-11-14
titulo: Redondear un punto 16 m cambiaba su enlace de 100% a 93%
tipo: hallazgo
resumen: Los puntos propios se guardaban con tres decimales; ahora se guardan con cinco.
---

# Redondear un punto 16 m cambiaba su enlace de 100% a 93%

## Qué se vio

Al probar el [buscador de puntos](../specs/S04-buscador-de-puntos.md) desde la ladera sur de Malapert, el mejor punto propuesto tenía 100% de enlace con la Tierra. Al añadirlo como escenario, la tabla mostraba 93%.

## Qué era

No era el buscador. Se comprobaron tres posibles causas:

| Posible causa | Efecto medido |
| --- | --- |
| Horizonte con 360 direcciones en vez de 720 | 0.4 puntos como máximo en 317 celdas |
| Paso de una hora en vez de media hora | ninguno en este punto |
| Coordenadas redondeadas a tres decimales | de 100% a 92.8% |

Los puntos propios se guardaban con tres decimales de grado. En latitud eso son hasta 16 m, y en la cresta de Malapert ese desplazamiento basta para que el relieve cercano tape la Tierra una parte del mes.

## Qué se hizo

- Los puntos propios y los enlaces compartibles guardan ahora cinco decimales (0.3 m).
- Hay una prueba automática que lo fija y una comprobación en el navegador: el escenario creado desde el buscador debe mostrar exactamente las cifras que el buscador prometió.

## Qué enseña

- Es el mismo fenómeno del [hallazgo de Malapert](2026-11-14-03-hallazgo-malapert.md), a una escala cien veces menor.
- Con celdas de 240 m, una sensibilidad de 16 m es en parte un efecto de la interpolación del terreno, no una propiedad real del sitio. Refuerza la necesidad del [terreno fino](../specs/S06-terreno-multirresolucion.md): hasta entonces, las cifras de un punto en una cresta deben leerse como orientativas.
- Para el guion: en el polo sur, la precisión de aterrizaje importa tanto como la elección del sitio.

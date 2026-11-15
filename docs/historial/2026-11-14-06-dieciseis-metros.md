---
fecha: 2026-11-14
titulo: Redondear un punto 16 m cambiaba su enlace de 100% a 93%
title: Rounding a point by 16 m changed its link from 100% to 93%
tipo: hallazgo
resumen: Los puntos propios se guardaban con tres decimales; ahora se guardan con cinco.
summary: Custom points were stored with three decimals; they are now stored with five.
---

<a id="en"></a>
**English** | [Español](#es)

# Rounding a point by 16 m changed its link from 100% to 93%

## What was seen

On trying the [point search](../specs/S04-buscador-de-puntos.md) from the south slope of Malapert, the best point proposed had 100% link to Earth. When it was added as a scenario, the table showed 93%.

## What it was

It was not the search. Three possible causes were checked:

| Possible cause | Measured effect |
| --- | --- |
| Horizon with 360 directions instead of 720 | 0.4 points at most over 317 cells |
| One-hour step instead of half an hour | none at this point |
| Coordinates rounded to three decimals | from 100% to 92.8% |

Custom points were stored with three decimals of a degree. In latitude that is up to 16 m, and on the Malapert ridge that shift is enough for the nearby relief to block Earth for part of the month.

## What was done

- Custom points and shareable links now keep five decimals (0.3 m).
- There is an automated test that pins it down and a check in the browser: the scenario created from the search must show exactly the figures the search promised.

## What it teaches

- It is the same phenomenon as the [Malapert finding](2026-11-14-03-hallazgo-malapert.md), at a scale a hundred times smaller.
- With 240 m cells, a sensitivity of 16 m is partly an effect of the terrain interpolation, not a real property of the site. It reinforces the need for the [fine terrain](../specs/S06-terreno-multirresolucion.md): until then, the figures of a point on a ridge crest must be read as indicative.
- For the pitch: at the south pole, landing accuracy matters as much as the choice of site.

---

<a id="es"></a>
**Español** | [English](#en)

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

---
fecha: 2026-11-14
titulo: Dos decimales de latitud bastaban a 240 m; a 20 m, no
title: Two decimals of latitude were enough at 240 m; at 20 m they are not
tipo: hallazgo
resumen: Con terreno fino, el punto de Shackleton del catálogo pasó de 100% a 12% de luz; sus coordenadas tenían 300 m de margen.
summary: On fine terrain, the catalogue's Shackleton point went from 100% to 12% sunlight; its coordinates had 300 m of leeway.
---

<a id="en"></a>
**English** | [Español](#es)

# Two decimals of latitude were enough at 240 m; at 20 m they are not

## What was seen

On loading the 20 m grids of [S06](../specs/S06-terreno-multirresolucion.md), two catalogue sites changed completely. 30-day mission from 14 November 2026, 2 m mast:

| Site, with the MVP coordinates | Sunlight, 240 m grid | Sunlight, fine grids | Link, 240 m | Link, fine |
| --- | --- | --- | --- | --- |
| Shackleton Rim, 89.78°S 155.73°W | 100% | 12% | 45% | 14% |
| Connecting Ridge, 89.45°S 137.31°W | 100% | 95% | 44% | 33% |
| Malapert Massif, 85.95°S 2.93°W | 41% | 38% | 100% | 85% |

## What it was

The code was fine. The coordinates of the first two came from Mazarico et al. (2011), who give them with two decimals: about 300 m of leeway in latitude. On the 240 m grid of that study, that points to one cell. On the 20 m grid, the point falls on the crater wall, to one side of the ridge.

NASA's own 60 m illumination map confirms it. At the pixel of those coordinates it gives 6.3% Sun at Shackleton and 0.0% on the ridge; 60 m away it gives 85% and 86%.

The Malapert point had been chosen by hand on the 240 m grid. With the 40 m one, nearby relief blocks Earth from it 15% of the time.

## What was done

- Connecting Ridge and Shackleton Rim now use the four-decimal coordinates of Gläser et al. (2018), table 2. They lie 312 m and 3.0 km from the earlier ones.
- Malapert Massif moves to the summit of the massif (85.96703°S, 2.2392°W), found with the point search over 40 m terrain: 100% sunlight and 100% link on that mission.
- Each site says on screen where its coordinates come from. See [S07](../specs/S07-validacion-y-coordenadas.md) and [VALIDACION.md](../VALIDACION.md).

## What changes in earlier figures

The figures in earlier history entries are those of their time, with the 240 m grid and the MVP coordinates. With today's:

| Figure | Before | Now |
| --- | --- | --- |
| [Malapert](2026-11-14-03-hallazgo-malapert.md): distance between the point with no link and the one with continuous link | 1.2 km | 1.6 km |
| [Seasons](2026-11-14-07-estaciones-lunares.md): sunlight on the ridge landing in mid-April 2027 | 28% | 56% |
| Seasons: worst day of the year to land on the ridge | 16 April, index 27 | 20 April, index 44 |

The conclusions hold: the point on the south slope of Malapert still has no link, and April is still the worst month on the ridge.

## What it teaches

- At the summit of Malapert, moving 40 m south lowers the link from 100% to 51%. At the pole, the landing accuracy needed is measured in tens of metres.
- A coordinate is only worth something together with the terrain it was computed on. It is a direct argument for the pitch: the tool shows how much the result changes as the terrain is refined.

---

<a id="es"></a>
**Español** | [English](#en)

# Dos decimales de latitud bastaban a 240 m; a 20 m, no

## Qué se vio

Al cargar las mallas de 20 m de [S06](../specs/S06-terreno-multirresolucion.md), dos sitios del catálogo cambiaron por completo. Misión de 30 días desde el 14 de noviembre de 2026, mástil de 2 m:

| Sitio, con las coordenadas del MVP | Luz, malla de 240 m | Luz, mallas finas | Enlace, 240 m | Enlace, fino |
| --- | --- | --- | --- | --- |
| Shackleton Rim, 89.78°S 155.73°O | 100% | 12% | 45% | 14% |
| Connecting Ridge, 89.45°S 137.31°O | 100% | 95% | 44% | 33% |
| Malapert Massif, 85.95°S 2.93°O | 41% | 38% | 100% | 85% |

## Qué era

El código estaba bien. Las coordenadas de los dos primeros venían de Mazarico et al. (2011), que las da con dos decimales: unos 300 m de margen en latitud. Sobre la malla de 240 m de aquel estudio, eso señala una celda. Sobre la malla de 20 m, el punto cae en la pared del cráter, a un lado de la cresta.

El propio mapa de iluminación de NASA de 60 m lo confirma. En el píxel de esas coordenadas da 6.3% de Sol en Shackleton y 0.0% en la cresta; a 60 m de distancia da 85% y 86%.

El punto de Malapert se había elegido a mano sobre la malla de 240 m. Con la de 40 m, un relieve cercano le tapa la Tierra el 15% del tiempo.

## Qué se hizo

- Connecting Ridge y Shackleton Rim usan ahora las coordenadas de cuatro decimales de Gläser et al. (2018), tabla 2. Quedan a 312 m y 3.0 km de las anteriores.
- Malapert Massif pasa a la cima del macizo (85.96703°S, 2.2392°O), encontrada con el buscador de puntos sobre terreno de 40 m: 100% de luz y 100% de enlace en esa misión.
- Cada sitio dice en pantalla de dónde salen sus coordenadas. Ver [S07](../specs/S07-validacion-y-coordenadas.md) y [VALIDACION.md](../VALIDACION.md).

## Qué cambia en cifras anteriores

Las cifras de entradas anteriores del historial son las de su momento, con la malla de 240 m y las coordenadas del MVP. Con las de ahora:

| Cifra | Antes | Ahora |
| --- | --- | --- |
| [Malapert](2026-11-14-03-hallazgo-malapert.md): distancia entre el punto sin enlace y el de enlace continuo | 1.2 km | 1.6 km |
| [Estaciones](2026-11-14-07-estaciones-lunares.md): luz en la cresta aterrizando a mediados de abril de 2027 | 28% | 56% |
| Estaciones: peor día del año para aterrizar en la cresta | 16 de abril, índice 27 | 20 de abril, índice 44 |

Las conclusiones se mantienen: el punto de la ladera sur de Malapert sigue sin enlace, y abril sigue siendo el peor mes en la cresta.

## Qué enseña

- En la cima de Malapert, moverse 40 m al sur baja el enlace de 100% a 51%. En el polo, la precisión de aterrizaje que hace falta se mide en decenas de metros.
- Una coordenada solo vale junto con el terreno sobre el que se calculó. Es un argumento directo para el guion: la herramienta enseña cuánto cambia el resultado al afinar el terreno.

---
fecha: 2026-11-15
titulo: Relieve real en toda la Luna
title: Real relief across the whole Moon
tipo: hito
resumen: Los 25 sitios del catálogo fuera del polo sur, como los Apollo, tienen horizonte con relieve real y vista 3D. La topografía global se precalcula una vez y va en el repositorio, así que el resto del equipo no descarga nada.
summary: The 25 catalogue sites away from the south pole, such as the Apollo ones, have a horizon with real relief and a 3D view. The global topography is precomputed once and goes in the repository, so the rest of the team downloads nothing.
---

<a id="en"></a>
**English** | [Español](#es)

# Real relief across the whole Moon

On testing the integrated `main`, Apollo 11 came out with a flat horizon and no 3D view. The 25 sites away from the south pole used a smooth Moon, because the project only had topography from 75°S to the pole. [S17](../specs/S17-relieve-global.md) was written and implemented the same day.

## What was decided

- **LOLA's global grid at 474 m** (`LDEM_64`, 531 MB), optional, with `npm run fetch-data -- --global`. With it, any custom point has relief. The 237 m one was ruled out because it weighs 2.1 GB.
- **The 25 catalogue sites are precomputed** and go in the repository: 7.4 MB. Whoever does not download the global grid still sees the relief of those sites.
- **A single height function for the whole Moon:** the polar grid where there is one and the global one elsewhere. The horizon and the 3D view stop asking about latitude and ask whether there is terrain at the point.
- **The global grid is not loaded whole:** it is read in blocks of 4° × 4° and the last 32 MB are kept.

## What was learned

- **NASA's server shares out bandwidth per connection.** With a single connection it ran at 37 KB/s and the download would have taken 4 hours. With 16 connections and 1 MB pieces it reached 400 KB/s. `fetch-data` downloads every file of 16 MB or more that way, and records the finished pieces so it can resume. With 4 MB pieces, the 16 connections ran into the timeout at once.
- **Far from the pole, the Sun climbs almost to the zenith.** The 3D camera, limited to 60° upwards, could not look at it, and now it reaches 85°. But opening the view looking at the Sun left the ground off the screen, so it opens tilted 15° at most. With 25°, the plain of Apollo 11 ended up behind the controls bar.
- **The results fit the known terrain.** From Apollo 15, Hadley Delta is seen at 13° and Mons Hadley at 11°. From Apollo 17, the North Massif is seen at 14°. Apollo 11 does not go above 1°.

## Merged with the map fixes

The same branch carries the [fixes to the polar map and the comparison](2026-11-15-15-mapa-y-comparar.md), by the team's decision, and was merged straight into `main` on closing the project.

---

<a id="es"></a>
**Español** | [English](#en)

# Relieve real en toda la Luna

Al probar `main` integrado, Apollo 11 salía con el horizonte plano y sin vista 3D. Los 25 sitios fuera del polo sur usaban una Luna lisa, porque el proyecto solo tenía topografía de 75°S al polo. Se escribió e implementó [S17](../specs/S17-relieve-global.md) el mismo día.

## Qué se decidió

- **La malla global de LOLA a 474 m** (`LDEM_64`, 531 MB), opcional, con `npm run fetch-data -- --global`. Con ella, cualquier punto propio tiene relieve. Se descartó la de 237 m porque pesa 2.1 GB.
- **Los 25 sitios del catálogo se precalculan** y van en el repositorio: 7.4 MB. Quien no descarga la malla global ve igualmente el relieve de esos sitios.
- **Una sola función de altura para toda la Luna:** la malla polar donde la hay y la global en el resto. El horizonte y la vista 3D dejan de preguntar por la latitud y preguntan si hay terreno en el punto.
- **La malla global no se carga entera:** se lee por bloques de 4° × 4° y se guardan los últimos 32 MB.

## Lo que se aprendió

- **El servidor de NASA reparte el ancho de banda por conexión.** Con una sola conexión iba a 37 KB/s y la descarga habría tardado 4 horas. Con 16 conexiones y trozos de 1 MB llegó a 400 KB/s. `fetch-data` baja así todos los archivos de 16 MB o más, y apunta los trozos terminados para poder reanudar. Con trozos de 4 MB, las 16 conexiones agotaban a la vez el tiempo de espera.
- **Lejos del polo, el Sol sube casi al cenit.** La cámara 3D, limitada a 60° hacia arriba, no podía mirarlo, y ahora llega a 85°. Pero abrir la vista mirando al Sol dejaba el suelo fuera de la pantalla, así que abre inclinada como mucho 15°. Con 25°, la llanura de Apollo 11 quedaba detrás de la barra de controles.
- **Los resultados cuadran con el terreno conocido.** Desde Apollo 15, Hadley Delta se ve a 13° y Mons Hadley a 11°. Desde Apollo 17, el North Massif se ve a 14°. Apollo 11 no pasa de 1°.

## Mezclado con los arreglos del mapa

La misma rama lleva los [arreglos del mapa polar y de la comparación](2026-11-15-15-mapa-y-comparar.md), por decisión del equipo, y se mezcló directamente en `main` al cerrar el proyecto.

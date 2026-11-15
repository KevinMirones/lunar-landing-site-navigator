---
fecha: 2026-11-15
titulo: Relieve real en toda la Luna
tipo: hito
resumen: Los 25 sitios del catálogo fuera del polo sur, como los Apollo, tienen horizonte con relieve real y vista 3D. La topografía global se precalcula una vez y va en el repositorio, así que el resto del equipo no descarga nada.
---

# Relieve real en toda la Luna

Al probar `main` integrado, Apollo 11 salía con el horizonte plano y sin vista 3D. Los 25 sitios fuera del polo sur usaban una Luna lisa, porque el proyecto solo tenía topografía de 75°S al polo. Se escribió e implementó [S17](../specs/S17-relieve-global.md) el mismo día.

## Qué se decidió

- **La malla global de LOLA a 474 m** (`LDEM_64`, 531 MB), opcional, con `npm run fetch-data -- --global`. Con ella, cualquier punto propio tiene relieve. Se descartó la de 237 m porque pesa 2.1 GB.
- **Los 25 sitios del catálogo se precalculan** y van en el repositorio: 7.4 MB. Quien no descarga la malla global ve igualmente el relieve de esos sitios.
- **Una sola función de altura para toda la Luna:** la malla polar donde la hay y la global en el resto. El horizonte y la vista 3D dejan de preguntar por la latitud y preguntan si hay terreno en el punto.
- **La malla global no se carga entera:** se lee por bloques de 4° × 4° y se guardan los últimos 32 MB.

## Lo que se aprendió

- **El servidor de NASA reparte el ancho de banda por conexión.** Con una sola conexión iba a 37 KB/s y la descarga habría tardado 4 horas. Con 16 conexiones y trozos de 1 MB llegó a 400 KB/s. `fetch-data` baja así todos los archivos de 64 MB o más, y apunta los trozos terminados para poder reanudar. Con trozos de 4 MB, las 16 conexiones agotaban a la vez el tiempo de espera.
- **Lejos del polo, el Sol sube casi al cenit.** La cámara 3D, limitada a 60° hacia arriba, no podía mirarlo, y ahora llega a 85°. Pero abrir la vista mirando al Sol dejaba el suelo fuera de la pantalla, así que abre inclinada como mucho 15°. Con 25°, la llanura de Apollo 11 quedaba detrás de la barra de controles.
- **Los resultados cuadran con el terreno conocido.** Desde Apollo 15, Hadley Delta se ve a 13° y Mons Hadley a 11°. Desde Apollo 17, el North Massif se ve a 14°. Apollo 11 no pasa de 1°.

## Mezclado con los arreglos del mapa

El mismo pull request lleva los [arreglos del mapa polar y de la comparación](2026-11-15-15-mapa-y-comparar.md), por decisión del equipo.

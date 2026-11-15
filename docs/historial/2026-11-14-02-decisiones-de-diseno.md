---
fecha: 2026-11-14
titulo: Decisiones de diseño del MVP
title: Design decisions of the MVP
tipo: decisión
resumen: Por qué las efemérides van en el navegador, el terreno en el servidor, y cómo se define "visible".
summary: Why the ephemeris runs in the browser, the terrain on the server, and how "visible" is defined.
---

<a id="en"></a>
**English** | [Español](#es)

# Design decisions of the MVP

Decisions made while building the MVP, with their reason and their cost. If any is changed, it helps to know why it was that way.

## Ephemeris in the browser

- **Decision:** compute the position of the Sun and Earth in the browser with `astronomy-engine`, instead of querying JPL Horizons at each instant.
- **Reason:** it costs 14 µs per instant, which lets the mission be animated and a whole year computed with no waiting and no connection.
- **Cost:** it is not JPL's DE441 ephemeris. This is offset by validating against Horizons: the maximum error measured is 0.0037°, about 140 times smaller than the solar disc.

## Everything in the Moon-fixed frame

- **Decision:** express the Sun and Earth in a frame that turns with the Moon, using the IAU rotation model.
- **Reason:** a site is then a constant vector, and libration is included without treating it separately. The ephemeris series is computed once and serves every site.

## Horizon on the server

- **Decision:** the Node server loads the LOLA DEM and computes the horizon; the browser only receives 720 angles.
- **Reason:** the DEM weighs 28 MB, too much to send to the browser. The computation takes about 30 ms.
- **How:** one ray every 0.5° of azimuth, out to 400 km, with the Moon's curvature. The step grows by 1% with distance.

## Coverage limited to 80°S

- **Decision:** real terrain only south of 80°S, even though the DEM reaches 75°S.
- **Reason:** a ray needs a margin of terrain around it. With the edge 150 km away, the horizon towards the north is still reliable.
- **Outside coverage:** smooth sphere, with the horizon 0.087° below the horizontal for a 2 m mast. The screen says so.

## What "visible" means

- **Sun:** there is sunlight when at least 2% of the disc shows. Power is proportional to the visible fraction.
- **Earth:** there is a link when at least half the disc clears the terrain.
- **How it is measured:** the disc is cut into nine vertical strips and each is compared with the terrain profile, to handle a jagged ridge properly.
- **No atmosphere:** there is no refraction and no twilight. It is pure geometry.

## Viability index

- **Decision:** a number from 0 to 100: 40% sunlight, 25% short nights, 35% link. The night penalises linearly up to 14 days.
- **Reason:** it lets scenarios be ranked at a glance.
- **Cost:** the weights are our own choice, not a mission criterion. The metrics that make it up are always shown.

## Shadow map on the graphics card

- **Decision:** a WebGL2 shader repeats the horizon computation for every pixel, with 150 steps per ray over a 480 m grid.
- **Reason:** the shadows move in real time as the mission plays.
- **Cost:** it is less accurate than the server's horizon. The figures always come from the server; the map is for looking at.

## Visual appearance

- **Decision:** the horizon is the protagonist. Regolith-grey chassis, black windows for the sky, and only two colours with meaning: gold for the Sun and power, blue for Earth and the link. A single type family, Archivo.
- **Reason:** to avoid the generic look of a navy-and-neon "space dashboard", and to make colour carry information.

## DEM outside the repository

- **Decision:** the DEM is not pushed to git; `npm run fetch-data` downloads it.
- **Reason:** adding it later is easy; removing it from the history is not.
- **Pending:** for deployment it is worth including it. See [S03](../specs/S03-ci-y-despliegue.md).

---

<a id="es"></a>
**Español** | [English](#en)

# Decisiones de diseño del MVP

Decisiones tomadas al construir el MVP, con su motivo y su coste. Si alguna se cambia, conviene saber por qué estaba así.

## Efemérides en el navegador

- **Decisión:** calcular la posición del Sol y la Tierra en el navegador con `astronomy-engine`, en vez de consultar JPL Horizons en cada instante.
- **Motivo:** cuesta 14 µs por instante, lo que permite animar la misión y calcular un año entero sin esperas ni conexión.
- **Coste:** no es la efeméride DE441 de JPL. Se compensa validando contra Horizons: el error máximo medido es 0.0037°, unas 140 veces menor que el disco solar.

## Todo en el sistema fijo a la Luna

- **Decisión:** expresar el Sol y la Tierra en un sistema que gira con la Luna, usando el modelo de rotación de la IAU.
- **Motivo:** un sitio es entonces un vector constante, y la libración queda incluida sin tratarla aparte. La serie de efemérides se calcula una vez y sirve para todos los sitios.

## Horizonte en el servidor

- **Decisión:** el servidor Node carga el DEM de LOLA y calcula el horizonte; el navegador solo recibe 720 ángulos.
- **Motivo:** el DEM pesa 28 MB, demasiado para enviarlo al navegador. El cálculo tarda unos 30 ms.
- **Cómo:** un rayo cada 0.5° de azimut, hasta 400 km, con la curvatura lunar. El paso crece un 1% con la distancia.

## Cobertura limitada a 80°S

- **Decisión:** terreno real solo al sur de 80°S, aunque el DEM llega a 75°S.
- **Motivo:** un rayo necesita margen de terreno a su alrededor. Con el borde a 150 km, el horizonte hacia el norte sigue siendo fiable.
- **Fuera de cobertura:** esfera lisa, con el horizonte 0.087° por debajo de la horizontal para un mástil de 2 m. La pantalla lo indica.

## Qué significa "visible"

- **Sol:** hay luz cuando asoma al menos el 2% del disco. La potencia es proporcional a la fracción visible.
- **Tierra:** hay enlace cuando al menos medio disco supera el terreno.
- **Cómo se mide:** el disco se corta en nueve franjas verticales y cada una se compara con el perfil del terreno, para tratar bien una cresta irregular.
- **Sin atmósfera:** no hay refracción ni crepúsculo. Es geometría pura.

## Índice de viabilidad

- **Decisión:** un número de 0 a 100: 40% luz solar, 25% noches cortas, 35% enlace. La noche penaliza de forma lineal hasta 14 días.
- **Motivo:** permite ordenar escenarios de un vistazo.
- **Coste:** los pesos son una elección nuestra, no un criterio de misión. Siempre se muestran las métricas que lo componen.

## Mapa de sombras en la tarjeta gráfica

- **Decisión:** un sombreador WebGL2 repite el cálculo del horizonte para cada píxel, con 150 pasos por rayo sobre una malla de 480 m.
- **Motivo:** las sombras se mueven en tiempo real al reproducir la misión.
- **Coste:** es menos preciso que el horizonte del servidor. Las cifras salen siempre del servidor; el mapa es para ver.

## Aspecto visual

- **Decisión:** el horizonte es el protagonista. Chasis gris regolito, ventanas negras para el cielo, y solo dos colores con significado: oro para el Sol y la energía, azul para la Tierra y el enlace. Una sola familia tipográfica, Archivo.
- **Motivo:** evitar el aspecto genérico de "panel espacial" azul marino con neón, y que el color informe.

## DEM fuera del repositorio

- **Decisión:** el DEM no se sube a git; lo descarga `npm run fetch-data`.
- **Motivo:** añadirlo después es fácil; quitarlo del historial, no.
- **Pendiente:** para el despliegue conviene incluirlo. Ver [S03](../specs/S03-ci-y-despliegue.md).

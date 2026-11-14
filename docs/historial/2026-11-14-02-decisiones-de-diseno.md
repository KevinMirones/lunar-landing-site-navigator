---
fecha: 2026-11-14
titulo: Decisiones de diseño del MVP
tipo: decisión
resumen: Por qué las efemérides van en el navegador, el terreno en el servidor, y cómo se define "visible".
---

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

---
id: S09
titulo: Ventanas de contacto reales
estado: pendiente
dia: 4
prioridad: imprescindible
depende: S01
resumen: Enlace con margen de elevación y con las estaciones de tierra que ven la Luna en cada momento.
---

# S09: Ventanas de contacto reales

## Problema

Hoy "enlace" significa que medio disco de la Tierra supera el terreno. Faltan dos cosas que un planificador da por supuestas: un margen mínimo de elevación para la antena, y que haya una estación en la Tierra mirando a la Luna en ese momento.

## Qué verá el usuario

- Un selector "Margen de elevación": 0°, 2° o 5° sobre el terreno.
- Un selector de red de tierra:
  - Red del Espacio Profundo de NASA (Goldstone, Madrid y Canberra).
  - Una sola estación propia, con latitud y longitud.
- Una fila "Contacto" en la línea de tiempo, con cada tramo marcado por la estación que lo cubre.
- Horas de contacto diarias en el balance de la misión.

## Diseño

Nuevo `src/lib/comms.ts`.

- **Margen:** hay línea de vista cuando el centro de la Tierra está al menos el margen elegido por encima del terreno. Con margen 0 equivale al criterio actual de medio disco.
- **Estaciones:** una estación ve la Luna cuando esta supera 10° de elevación sobre su horizonte (ajustable). Se calcula con `Equator` y `Horizon` de `astronomy-engine`.

  | Estación | Latitud | Longitud |
  | --- | --- | --- |
  | Goldstone | 35.43°N | 116.89°O |
  | Madrid (Robledo) | 40.43°N | 4.25°O |
  | Canberra (Tidbinbilla) | 35.40°S | 148.98°E |

- **Contacto:** línea de vista desde el sitio y al menos una estación viendo la Luna.
- Con las tres estaciones, separadas unos 120° en longitud, la cobertura es casi continua y lo interesante son los relevos. Con una sola estación, el contacto cae a unas 8 a 12 horas al día: es el caso de muchas misiones comerciales y el que más enseña.

## Criterios de aceptación

1. Con margen 0 y sin filtro de estaciones, las ventanas coinciden con las actuales.
2. Subir el margen nunca aumenta el tiempo de enlace.
3. Con las tres estaciones, el contacto es al menos el 95% de la línea de vista.
4. Con una sola estación en latitud media, el contacto diario está entre 6 y 14 horas cuando hay línea de vista todo el día.
5. La elevación de la Luna desde Madrid coincide con JPL Horizons en tres instantes, con error menor de 0.1°.

## Pruebas

- Automáticas: criterios 1, 2 y 5 (este último con valores de referencia guardados, como en [ephemeris.test.ts](../../tests/ephemeris.test.ts)).
- A mano: criterios 3 y 4.

## Fuera de alcance

- Balance de enlace en decibelios y tasas de datos.
- Satélites repetidores.
- Disponibilidad real y agenda de las estaciones.

## Riesgos

- **Recorte posible:** si falta tiempo se deja el margen de elevación y se aplaza la parte de estaciones.
- **Coste de cálculo:** tres estaciones por muestra. Se calcula una vez por rejilla de tiempo, igual que las efemérides.

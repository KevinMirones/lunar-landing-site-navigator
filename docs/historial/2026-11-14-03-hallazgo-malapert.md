---
fecha: 2026-11-14
titulo: En Malapert, 1.2 km separan 0% y 100% de enlace
tipo: hallazgo
resumen: El punto del catálogo quedaba tapado por su propia ladera; movido 1.2 km tiene enlace continuo.
---

# En Malapert, 1.2 km separan 0% y 100% de enlace

## Qué se vio

Al revisar la primera comparación de sitios, el macizo Malapert aparecía con 0% de enlace con la Tierra. Era sospechoso: Malapert es conocido justo por su buena vista de la Tierra.

## Qué era

No era un error de cálculo. El punto elegido estaba en una ladera que mira al sur, y el propio macizo le tapaba la Tierra.

| Punto | Coordenadas | Altura | Horizonte hacia el norte | Enlace en 30 días |
| --- | --- | --- | --- | --- |
| Ladera sur (original) | 85.99°S, 2.93°O | 4841 m | +12.3°, relieve a 100 m | 0% |
| Hombro norte (actual) | 85.95°S, 2.93°O | 4877 m | −3.5°, relieve a 118 km | 100% |
| Cumbre | 85.99°S, 2.10°E | 5169 m | −0.8°, relieve a 200 m | sin calcular |

Condiciones: alunizaje el 14 de noviembre de 2026 a las 00:00 UTC, misión de 30 días, mástil de 2 m, terreno de 240 m.

Los dos primeros puntos distan 1.2 km.

## Qué se hizo

- El sitio del catálogo se movió al hombro norte, que representa mejor por qué interesa Malapert.
- El caso pasó a ser el primer resultado del [guion para el jurado](../PITCH.md): es el ejemplo más claro de "un cambio pequeño de sitio lo cambia todo".

## Qué enseña

- En el polo, el horizonte cercano manda. Una pendiente de 12° a 100 m pesa más que una montaña a 100 km.
- Elegir un punto a mano es frágil. De aquí sale el [buscador de puntos cercanos](../specs/S04-buscador-de-puntos.md).

## Cautela

Con celdas de 240 m, ese horizonte de 12° es la pendiente local estimada a partir de la primera muestra del rayo, a 120 m. La cifra exacta puede cambiar con el [terreno fino](../specs/S06-terreno-multirresolucion.md), y hay que recalcularla antes de presentarla.

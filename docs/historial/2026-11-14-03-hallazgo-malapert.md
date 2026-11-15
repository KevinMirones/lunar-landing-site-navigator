---
fecha: 2026-11-14
titulo: En Malapert, 1.2 km separan 0% y 100% de enlace
title: At Malapert, 1.2 km separate 0% and 100% link
tipo: hallazgo
resumen: El punto del catálogo quedaba tapado por su propia ladera; movido 1.2 km tiene enlace continuo.
summary: The catalogue point was blocked by its own slope; moved 1.2 km it has continuous link.
---

<a id="en"></a>
**English** | [Español](#es)

# At Malapert, 1.2 km separate 0% and 100% link

## What was seen

On reviewing the first site comparison, the Malapert massif appeared with 0% link to Earth. That was suspicious: Malapert is known precisely for its good view of Earth.

## What it was

It was not a computation error. The point chosen was on a south-facing slope, and the massif itself blocked Earth from it.

| Point | Coordinates | Height | Horizon towards the north | Link over 30 days |
| --- | --- | --- | --- | --- |
| South slope (original) | 85.99°S, 2.93°W | 4841 m | +12.3°, relief 100 m away | 0% |
| North shoulder (current) | 85.95°S, 2.93°W | 4877 m | −3.5°, relief 118 km away | 100% |
| Summit | 85.99°S, 2.10°E | 5169 m | −0.8°, relief 200 m away | not computed |

Conditions: landing on 14 November 2026 at 00:00 UTC, 30-day mission, 2 m mast, 240 m terrain.

The first two points are 1.2 km apart.

## What was done

- The catalogue site was moved to the north shoulder, which better represents why Malapert matters.
- The case became the first result of the [pitch for the jury](../PITCH.md): it is the clearest example of "a small change of site changes everything".

## What it teaches

- At the pole, the nearby horizon rules. A 12° slope 100 m away weighs more than a mountain 100 km away.
- Choosing a point by hand is fragile. The [search for nearby points](../specs/S04-buscador-de-puntos.md) comes out of this.

## Caution

With 240 m cells, that 12° horizon is the local slope estimated from the first sample of the ray, at 120 m. The exact figure may change with the [fine terrain](../specs/S06-terreno-multirresolucion.md), and it has to be recomputed before presenting it.

---

<a id="es"></a>
**Español** | [English](#en)

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

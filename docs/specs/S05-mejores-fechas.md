---
id: S05
titulo: Buscador de mejores fechas
title: Search for the best dates
estado: hecha
dia: 2
prioridad: imprescindible
depende: S01
resumen: Las cinco mejores fechas de alunizaje del año para un sitio y una duración dados.
summary: The five best landing dates of the year for a given site and duration.
---

<a id="en"></a>
**English** | [Español](#es)

# S05: Search for the best dates

## Problem

The year calendar shows the sunlight and link of each day, but the user has to judge by eye which date suits a 30-day mission. When a delay forces replanning, the question is direct: which is the next good date?

## What the user will see

- A third row in the calendar: the index the mission would have if it landed that day.
- A "Best dates" list with the five best of the year, with sunlight, longest night and link.
- Each date can be applied to the active scenario or added as a new scenario.
- A filter that is on by default: "only dates with the Sun visible at landing". Landing at night is not viable for most missions.

## Design

- New function `windowScores(series, durationDays)` in [series.ts](../../src/lib/series.ts). The sunlight and link windows are computed once for the whole series; each candidate day only clips them, with a cursor that moves forward, so the cost grows linearly.
- `bestDates(scores)` picks the dates, and `scoreOf` is the index formula, shared with the rest of the app.
- The year series is extended from 366 to 366 + 90 days, so that a mission starting on the last day has data.
- The five best dates are at least seven days apart. The first version used three and, with real data, proposed four dates almost in a row.
- With the same index, the earlier date wins.
- Everything is computed in the browser. No server is needed.

## Acceptance criteria

1. The index of the best date matches the one the scenario gives when it is applied (one point of difference at most, because of the two-hour step of the year series).
2. The computation takes under 100 ms.
3. With the filter on, no proposed date has the Sun hidden at landing.
4. At Connecting Ridge with 30 days, the proposed dates have continuous sunlight and lie more than 60 days from the southern winter solstice (27 April 2027). See [the lunar seasons](../historial/2026-11-14-07-estaciones-lunares.md).
5. An "Index" row in the calendar and a numbered triangle under each proposed date.

## Tests

- Automated: sliding window against the direct computation on ten dates, the sunlight filter, the spacing between dates and criterion 4 on real terrain.
- In the browser: applying a date moves the landing and the scenario shows the promised index.

## Out of scope

- Launch constraints (injection windows, transfer orbit).
- Combined search for point and date at once.

## Risks

- A single index hides trade-offs. The list always shows the three metrics, not just the index.

---

<a id="es"></a>
**Español** | [English](#en)

# S05: Buscador de mejores fechas

## Problema

El calendario anual muestra la luz y el enlace de cada día, pero el usuario tiene que estimar a ojo qué fecha conviene para una misión de 30 días. Cuando un retraso obliga a replanificar, la pregunta es directa: ¿cuál es la siguiente fecha buena?

## Qué verá el usuario

- Una tercera fila en el calendario: el índice que tendría la misión si se aterrizara ese día.
- Una lista "Mejores fechas" con las cinco mejores del año, con luz, noche más larga y enlace.
- Cada fecha se puede aplicar al escenario activo o añadir como escenario nuevo.
- Un filtro activado por defecto: "solo fechas con Sol visible en el alunizaje". Aterrizar de noche no es viable para la mayoría de misiones.

## Diseño

- Nueva función `windowScores(series, durationDays)` en [series.ts](../../src/lib/series.ts). Las ventanas de luz y de enlace se calculan una sola vez para toda la serie; cada día candidato solo las recorta, con un cursor que avanza, de modo que el coste crece de forma lineal.
- `bestDates(scores)` elige las fechas, y `scoreOf` es la fórmula del índice, compartida con el resto de la app.
- La serie anual se amplía de 366 a 366 + 90 días, para que una misión que empiece el último día tenga datos.
- Las cinco mejores fechas se separan al menos siete días entre sí. La primera versión usaba tres y, con datos reales, proponía cuatro fechas casi seguidas.
- Con el mismo índice gana la fecha más temprana.
- Todo se calcula en el navegador. No hace falta servidor.

## Criterios de aceptación

1. El índice de la mejor fecha coincide con el que da el escenario al aplicarla (diferencia de un punto como máximo, por el paso de dos horas de la serie anual).
2. El cálculo tarda menos de 100 ms.
3. Con el filtro activo, ninguna fecha propuesta tiene el Sol oculto en el alunizaje.
4. En Connecting Ridge con 30 días, las fechas propuestas tienen luz continua y quedan a más de 60 días del solsticio de invierno austral (27 de abril de 2027). Ver [las estaciones lunares](../historial/2026-11-14-07-estaciones-lunares.md).
5. Una fila "Índice" en el calendario y un triángulo numerado bajo cada fecha propuesta.

## Pruebas

- Automáticas: ventana deslizante contra el cálculo directo en diez fechas, el filtro de luz, la separación entre fechas y el criterio 4 con terreno real.
- En el navegador: aplicar una fecha mueve el alunizaje y el escenario muestra el índice prometido.

## Fuera de alcance

- Restricciones de lanzamiento (ventanas de inyección, órbita de transferencia).
- Búsqueda combinada de punto y fecha a la vez.

## Riesgos

- Un índice único esconde compromisos. La lista muestra siempre las tres métricas, no solo el índice.

---
id: S05
titulo: Buscador de mejores fechas
estado: hecha
dia: 2
prioridad: imprescindible
depende: S01
resumen: Las cinco mejores fechas de alunizaje del año para un sitio y una duración dados.
---

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

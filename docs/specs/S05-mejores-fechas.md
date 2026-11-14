---
id: S05
titulo: Buscador de mejores fechas
estado: pendiente
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

- Nueva función `windowScores(series, durationDays)` en [series.ts](../../src/lib/series.ts). Recorre la serie anual con una ventana deslizante:
  - Las cuotas de luz y enlace salen de sumas acumuladas.
  - La noche más larga, de la lista de intervalos con dos punteros.
  - El coste total es lineal con el número de muestras.
- La serie anual se amplía de 366 a 366 + 90 días, para que una misión que empiece el último día tenga datos.
- Las cinco mejores fechas se separan al menos tres días entre sí, para no ofrecer cinco días seguidos del mismo periodo.
- Todo se calcula en el navegador. No hace falta servidor.

## Criterios de aceptación

1. El índice de la mejor fecha coincide con el que da el escenario al aplicarla (diferencia de un punto como máximo, por el paso de dos horas de la serie anual).
2. El cálculo tarda menos de 100 ms.
3. Con el filtro activo, ninguna fecha propuesta tiene el Sol oculto en el alunizaje.
4. En Connecting Ridge con 30 días, las fechas propuestas caen en el verano austral lunar, no en los meses con huecos de luz.

## Pruebas

- Automáticas: ventana deslizante contra el cálculo directo en diez fechas, y el filtro de luz.
- A mano: criterio 4.

## Fuera de alcance

- Restricciones de lanzamiento (ventanas de inyección, órbita de transferencia).
- Búsqueda combinada de punto y fecha a la vez.

## Riesgos

- Un índice único esconde compromisos. La lista muestra siempre las tres métricas, no solo el índice.

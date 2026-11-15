---
id: S01
titulo: Escenarios comparables
estado: hecha
dia: 1
prioridad: imprescindible
depende: -
resumen: Comparar lado a lado el mismo sitio en fechas, duraciones o mástiles distintos.
---

# S01: Escenarios comparables

## Problema

La tabla de comparación solo admite sitios distintos con una misma fecha, duración y altura de mástil. La consigna pide lo contrario cuando hay un retraso: "fechas alternativas en el mismo sitio". Hoy eso obliga a cambiar la fecha y recordar las cifras anteriores.

## Qué verá el usuario

- Un **escenario** es una combinación de sitio, fecha de alunizaje, duración y altura de mástil.
- Siempre hay un escenario activo: es el que muestran el panorama, el mapa, el estado y la línea de tiempo. Los controles de la barra superior editan ese escenario.
- "Comparar" en la lista de sitios añade un escenario con ese sitio y la fecha, duración y mástil activos.
- Cada fila de la tabla tiene "Duplicar con otra fecha", que crea una copia siete días después y la deja activa para ajustarla.
- La tabla gana una columna "Alunizaje" con fecha, duración y mástil.
- Las franjas de ventanas se alinean por día de misión: el día 0 es el alunizaje en todas las filas. Si las duraciones difieren, el eje abarca la más larga.
- En el calendario anual, un clic mueve el alunizaje del escenario activo; un clic con Mayús añade un escenario nuevo en ese día.
- Todo escenario nuevo queda activo, para verlo y ajustarlo enseguida.
- Máximo seis escenarios. No se puede eliminar el último.
- La comparación y el calendario ocupan el ancho completo, uno debajo del otro: con la columna de alunizaje y las acciones, la tabla ya no cabe en media pantalla.

## Diseño

- Nuevo `src/lib/scenario.ts` con el tipo `Scenario { id, siteId, landing, durationDays, mast }` y las funciones para crear, duplicar y obtener la clave de caché.
- En [App.tsx](../../src/App.tsx), `pinned: string[]` y los valores globales `landing`, `durationDays` y `mast` se sustituyen por `scenarios: Scenario[]` y `activeId`. La fecha, la duración y el mástil se derivan del escenario activo.
- El mapa `analyses` pasa a indexarse por id de escenario. Cada escenario tiene su propia rejilla de tiempo.
- La caché de efemérides de [series.ts](../../src/lib/series.ts) admite hoy 12 rejillas; se amplía para seis escenarios más la serie anual.
- `WindowStrip` en [Timeline.tsx](../../src/components/Timeline.tsx) recibe el inicio de cada escenario y la duración máxima, y coloca cada ventana en `(t − alunizaje) / duraciónMáxima`.
- El resaltado del mejor valor por columna no cambia.

## Criterios de aceptación

1. El mismo sitio añadido dos veces con fechas distintas muestra métricas distintas.
2. Cambiar la fecha en la barra superior solo altera la fila activa.
3. Las franjas de todas las filas empiezan en el mismo punto (día 0).
4. Al eliminar el escenario activo se activa el anterior; el último no se puede eliminar.
5. Con seis escenarios de 90 días, el recálculo completo tarda menos de 300 ms.

## Pruebas

- Automáticas: creación y duplicado de escenarios, y normalización de ventanas por día de misión.
- A mano: los cinco criterios anteriores en el navegador.

## Fuera de alcance

- Guardar los escenarios entre sesiones: lo cubre [S02](S02-enlaces-compartibles.md).
- Parámetros de energía: [S08](S08-energia-y-bateria.md), que usa una sola configuración para todos los escenarios.

## Riesgos

- Es el cambio que más toca el estado de la aplicación. Se hace el primero porque las demás specs se apoyan en él; si se complica, se vuelve a la etiqueta `mvp-v0.1.0`.

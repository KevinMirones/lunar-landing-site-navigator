---
fecha: 2026-11-14
titulo: Todas las specs pendientes, listas para implementar
title: All the pending specs, ready to implement
tipo: decisión
resumen: S03 y S08 a S14 revisadas contra el código real, dos specs nuevas (S15 y S16) y un plan con orden, reparto y reglas.
summary: S03 and S08 to S14 reviewed against the real code, two new specs (S15 and S16) and a plan with order, tracks and rules.
---

<a id="en"></a>
**English** | [Español](#es)

# All the pending specs, ready to implement

## Why it was needed

Specs S08 to S14 were written before S01 to S07 were implemented. Since then the code they build on has changed (scenarios, links, fine terrain, precomputed horizons) and so have figures they quoted. Also, several people now work at once, and the [plan](../PLAN.md) was still a seven-day calendar for one person.

## What changed in each spec

| Spec | Main change |
| --- | --- |
| [S03](../specs/S03-ci-y-despliegue.md) | Timing tests out of `npm test`; memory measured; concrete proposals for the DEM and the hosting; static backup copy |
| [S08](../specs/S08-energia-y-bateria.md) | The battery becomes the sixth input (the verdict needed it and it was not listed); one configuration shared by all scenarios; eclipses computed per site; a column in the table; a parameter in the link |
| [S09](../specs/S09-ventanas-de-contacto.md) | The margin is applied where the series is born, so that the index, the calendar and the search respect it; with the defaults nothing changes; the network does not go into the index |
| [S10](../specs/S10-exportacion.md) | Complete columns, decimal comma in Spanish, report independent of the collapsed panels |
| [S11](../specs/S11-vista-3d.md) | Two nested patches instead of one; precomputed patches for the public server; distant relief taken from the horizon profile |
| [S12](../specs/S12-modo-educativo.md) | A tour step is a shareable-link state; the simple view is made by marking the expert elements; a measurable criterion for it |
| [S13](../specs/S13-catalogo-y-polo-norte.md) | North pole products checked; `program` and `year` fields; precomputing for the new polar sites |
| [S14](../specs/S14-robustez-y-calidad.md) | Budgets with today's figures; list of 20 actions redone with all the features |

## New specs

- **[S15](../specs/S15-pruebas-de-navegador.md), browser tests in the repository.** The two previous milestone entries asked for it. The original scripts were recovered from the log of the session that created them and are in `e2e/`, not yet run.
- **[S16](../specs/S16-sombra-permanente.md), distance to permanent shadow.** It was not in the plan. It fills a gap in the brief: the app gave no figure of scientific interest. It can be cut and goes last.

## What was checked in order to write them

| Fact | Result | How |
| --- | --- | --- |
| Server memory with only the 240 m grid | 80 MB on start; a peak of 123 MB with one search thread and 148 MB with the default threads | Real server on a free port, going through all the services |
| `npm test` on a second machine | One timing test fails: 633 ms against 300 ms | Full, isolated run |
| LOLA grids of the north pole | The 240, 80, 40 and 20 m ones exist, with the same sizes as the southern ones | Query to the data server |
| Permanent shadow maps | NASA publishes `LPSR_75S_120M_201608`: 116 MB, 120 m, from 75°S to 90°S | Query to the server and reading its label |
| Render free plan | 512 MB, 0.1 CPU, sleeps after 15 minutes | [Its documentation](https://render.com/docs/free) |
| State of continuous integration on GitHub | Not checked: the repository is private | — |

The response times measured in that memory test are not reliable and are not quoted: the measuring tool itself kept the processor busy.

## Decisions made in the specs

- **With the defaults, no new spec changes an existing figure.** S08, S09 and S16 have it as an acceptance criterion. The figures of the pitch and the validation still hold.
- **Neither power, nor the station network, nor permanent shadow goes into the viability index.** Each is shown separately.
- **Everything the server computes for a catalogue site is precomputed**, so that the public server and the static copy have it without the fine grids.
- **Each new spec adds its browser flow and has its link parameter reserved.**

## Tracks

The plan splits the work into three tracks. The 3D view ([S11](../specs/S11-vista-3d.md)) has its own and Andrés has it; the other two, engine and interface, are still to be assigned.

## What is left to decide

It is under [Open decisions](../PLAN.md#open-decisions) in the plan: the DEM in the repository, the hosting, whether S16 is done, who takes tracks A and B, when the repository is made public, and the date and format of the delivery.

---

<a id="es"></a>
**Español** | [English](#en)

# Todas las specs pendientes, listas para implementar

## Por qué hizo falta

Las specs S08 a S14 se escribieron antes de implementar S01 a S07. Desde entonces cambió el código sobre el que se apoyan (escenarios, enlaces, terreno fino, horizontes precalculados) y cambiaron cifras que citaban. Además, ahora trabajan varias personas a la vez, y el [plan](../PLAN.md) seguía siendo un calendario de siete días para una sola.

## Qué cambió en cada spec

| Spec | Cambio principal |
| --- | --- |
| [S03](../specs/S03-ci-y-despliegue.md) | Pruebas de tiempo fuera de `npm test`; memoria medida; propuestas concretas para el DEM y el alojamiento; copia estática de respaldo |
| [S08](../specs/S08-energia-y-bateria.md) | La batería pasa a ser el sexto dato de entrada (el veredicto la necesitaba y no figuraba); una configuración común a todos los escenarios; eclipses calculados por sitio; columna en la tabla; parámetro en el enlace |
| [S09](../specs/S09-ventanas-de-contacto.md) | El margen se aplica donde nace la serie, para que lo respeten el índice, el calendario y el buscador; con los valores por defecto nada cambia; la red no entra en el índice |
| [S10](../specs/S10-exportacion.md) | Columnas completas, coma decimal en español, informe independiente de los paneles plegados |
| [S11](../specs/S11-vista-3d.md) | Dos parches anidados en lugar de uno; parches precalculados para el servidor público; relieve lejano tomado del perfil de horizonte |
| [S12](../specs/S12-modo-educativo.md) | Un paso del recorrido es un estado de enlace compartible; la vista sencilla se hace marcando los elementos expertos; criterio medible para ella |
| [S13](../specs/S13-catalogo-y-polo-norte.md) | Productos del polo norte comprobados; campos `program` y `year`; precalcular para los sitios polares nuevos |
| [S14](../specs/S14-robustez-y-calidad.md) | Presupuestos con las cifras de hoy; lista de 20 acciones rehecha con todas las funciones |

## Specs nuevas

- **[S15](../specs/S15-pruebas-de-navegador.md), pruebas de navegador en el repositorio.** Las dos entradas de hito anteriores la pedían. Los scripts originales se recuperaron del registro de la sesión que los creó y están en `e2e/`, sin ejecutar todavía.
- **[S16](../specs/S16-sombra-permanente.md), distancia a la sombra permanente.** No estaba en el plan. Cubre un hueco de la consigna: la app no daba ninguna cifra de interés científico. Es recortable y va la última.

## Lo que se comprobó para escribirlas

| Dato | Resultado | Cómo |
| --- | --- | --- |
| Memoria del servidor con solo la malla de 240 m | 80 MB al arrancar; 123 MB de pico con un hilo de búsqueda y 148 MB con los hilos por defecto | Servidor real en un puerto libre, recorriendo todos los servicios |
| `npm test` en un segundo equipo | Falla una prueba de tiempos: 633 ms frente a 300 ms | Ejecución completa y aislada |
| Mallas LOLA del polo norte | Existen las de 240, 80, 40 y 20 m, con los mismos tamaños que las del sur | Consulta al servidor de datos |
| Mapas de sombra permanente | NASA publica `LPSR_75S_120M_201608`: 116 MB, 120 m, de 75°S a 90°S | Consulta al servidor y lectura de su etiqueta |
| Plan gratuito de Render | 512 MB, 0.1 de CPU, se duerme tras 15 minutos | [Su documentación](https://render.com/docs/free) |
| Estado de la integración continua en GitHub | Sin comprobar: el repositorio es privado | — |

Los tiempos de respuesta medidos en esa prueba de memoria no son fiables y no se citan: el propio medidor ocupaba el procesador.

## Decisiones tomadas en las specs

- **Con los valores por defecto, ninguna spec nueva cambia una cifra existente.** S08, S09 y S16 lo tienen como criterio de aceptación. Las cifras del guion y de la validación siguen valiendo.
- **Ni la energía, ni la red de estaciones, ni la sombra permanente entran en el índice de viabilidad.** Cada una se muestra aparte.
- **Todo lo que el servidor calcule para un sitio del catálogo se precalcula**, para que el servidor público y la copia estática lo tengan sin las mallas finas.
- **Cada spec nueva añade su flujo de navegador y tiene reservado su parámetro del enlace.**

## Reparto

El plan divide el trabajo en tres pistas. La vista 3D ([S11](../specs/S11-vista-3d.md)) tiene la suya y la lleva Andrés; las otras dos, de motor e interfaz, están por repartir.

## Qué queda por decidir

Está en [Decisiones pendientes](../PLAN.md#decisiones-pendientes) del plan: el DEM en el repositorio, el alojamiento, si se hace S16, quién lleva las pistas A y B, cuándo se hace público el repositorio, y la fecha y el formato de la entrega.

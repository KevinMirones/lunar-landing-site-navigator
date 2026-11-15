---
fecha: 2026-11-14
titulo: Todas las specs pendientes, listas para implementar
tipo: decisión
resumen: S03 y S08 a S14 revisadas contra el código real, dos specs nuevas (S15 y S16) y un plan con orden, reparto y reglas.
---

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

# LUMINA: plan de la semana

Calendario de siete días para llevar el MVP al alcance completo del reto. El detalle de cada función está en su spec; el estado de todas se ve en el [índice](README.md).

- **Punto de partida:** etiqueta `mvp-v0.1.0` (14 de noviembre de 2026). Ver el [historial](README.md#historial-del-proyecto).
- **Supuesto:** siete días de trabajo seguidos. Si la entrega es antes, se recorta según [Si vamos tarde](#si-vamos-tarde).
- **Fechas:** anota aquí la fecha de cada día y la hora límite de entrega en cuanto las confirmes.

## Calendario

| Día | Objetivo | Specs | Lo que se podrá enseñar |
| --- | --- | --- | --- |
| 1 | Comparar fechas y tener dirección pública | [S01](specs/S01-escenarios.md), [S02](specs/S02-enlaces-compartibles.md), [S03](specs/S03-ci-y-despliegue.md) | "¿Y si el lanzamiento se retrasa tres semanas?" en una sola tabla |
| 2 | Que la herramienta proponga | [S04](specs/S04-buscador-de-puntos.md), [S05](specs/S05-mejores-fechas.md) | El mejor punto en 5 km y la mejor fecha del año |
| 3 | Rigor científico | [S06](specs/S06-terreno-multirresolucion.md), [S07](specs/S07-validacion-y-coordenadas.md) | Tabla "publicado frente a LUMINA" |
| 4 | Cifras de ingeniería | [S08](specs/S08-energia-y-bateria.md), [S09](specs/S09-ventanas-de-contacto.md), [S10](specs/S10-exportacion.md) | "Sobrevive la noche más larga: sí o no" |
| 5 | Impacto visual y público general | [S11](specs/S11-vista-3d.md), [S12](specs/S12-modo-educativo.md), [S13](specs/S13-catalogo-y-polo-norte.md) | Paisaje 3D y recorrido guiado |
| 6 | Versión 1.0 estable | [S14](specs/S14-robustez-y-calidad.md) | Las 20 acciones sin errores en dos equipos |
| 7 | Entrega | [Lista de entrega](#día-7-entrega) | Vídeo, diapositivas y texto |

Los tres primeros días no se reordenan: son los que más diferencian el proyecto y los de mayor riesgo técnico.

El día 1 se lanza además, en segundo plano, la descarga del terreno fino que usa el día 3 (345 MB desde un servidor que a veces va a 60 KB/s).

## Reglas de trabajo

- **Ramas:** cada spec va en su rama (`feat/s01-escenarios`, …). `main` solo recibe trabajo terminado.
- **Terminado significa:** se cumplen los criterios de aceptación de la spec, pasan `npm test`, `npm run build` y `npm run docs:check`, y un clon limpio arranca.
- **Estado al día:** al empezar una spec se pone `estado: en curso` en su cabecera; al terminar, `hecha`. Después, `npm run docs:index`.
- **Etiqueta diaria:** al cerrar cada día, `v0.2.0`, `v0.3.0`, … Si un día sale mal, se vuelve a la etiqueta anterior.
- **Historial:** cada hito, decisión importante, hallazgo o incidencia se anota en `docs/historial/`.
- **Cifras del guion:** toda cifra que se diga ante el jurado debe poder reproducirse en la app, con fecha y sitio anotados.

## Si vamos tarde

Se recorta en este orden:

1. [S11](specs/S11-vista-3d.md): vista 3D del terreno.
2. [S09](specs/S09-ventanas-de-contacto.md): solo la parte de estaciones de tierra; se conserva el margen de elevación.
3. [S10](specs/S10-exportacion.md): solo el informe imprimible; se conserva el CSV.
4. [S13](specs/S13-catalogo-y-polo-norte.md): primero el polo norte, después los sitios extra.
5. [S06](specs/S06-terreno-multirresolucion.md): solo la malla de 20 m; se conservan 40 y 80 m.

No se recorta: escenarios, buscadores, validación, despliegue y materiales de entrega.

Una spec que se deja fuera se marca `estado: recortada`, para que el índice lo refleje.

## Día 7: entrega

- [ ] Recalcular todas las cifras de [PITCH.md](PITCH.md) con la versión final y actualizar el guion.
- [ ] Vídeo o diapositivas en el formato que pidan las reglas.
- [ ] Texto del proyecto: resumen, datos de NASA usados, créditos y declaración del uso de IA.
- [ ] Tres ensayos con cronómetro y repaso de las preguntas probables.
- [ ] Plan B sin internet: `npm run share` en local, vídeo grabado y capturas.
- [ ] Entregar al menos tres horas antes del límite.

## Trabajo en paralelo

Tareas que no son código y puede llevar otra persona:

| Cuándo | Tarea | Para |
| --- | --- | --- |
| Días 1 y 2 | Buscar las coordenadas publicadas de cada sitio y anotar la fuente | [S07](specs/S07-validacion-y-coordenadas.md) |
| Días 1 a 3 | Reunir los valores de iluminación de los artículos de referencia | [S07](specs/S07-validacion-y-coordenadas.md) |
| Días 2 a 6 | Probar cada función nueva en otro equipo y navegador | todas |
| Día 5 | Hacer el recorrido educativo sin ayuda y contar qué no se entiende | [S12](specs/S12-modo-educativo.md) |
| Día 6 | Ejecutar la lista de 20 acciones | [S14](specs/S14-robustez-y-calidad.md) |
| Días 5 a 7 | Guion, capturas, vídeo y diapositivas | entrega |

## Riesgos generales

| Riesgo | Señal de alarma | Respuesta |
| --- | --- | --- |
| Una función rompe lo que ya funcionaba | Fallan las pruebas o la demostración | Volver a la etiqueta del día anterior |
| Descargas de NASA lentas o caídas | La descarga no avanza | Es reanudable; seguir con 240 m mientras tanto |
| El alojamiento gratuito no aguanta | Se cae o tarda en arrancar | Horizontes precalculados; plan B en local |
| Sin internet en la presentación | — | `npm run share` y vídeo grabado |
| Una cifra del guion deja de ser cierta | Cambia al mejorar el terreno | Recalcular todas las cifras el día 7 |

## Decisiones pendientes

- **Fecha y formato de entrega.** Confirmarlos en las reglas de la sede. Lo habitual en Space Apps es un vídeo de 30 segundos o siete diapositivas, repositorio público y declaración del uso de IA. Este proyecto se desarrolló con asistencia de IA y habría que indicarlo.
- **DEM en el repositorio.** Hoy no está: se descarga con `npm run fetch-data`. Para el despliegue conviene incluirlo, porque así la compilación no depende de un servidor lento. El coste es que 28 MB quedan en el historial de git.
- **Alojamiento.** Hace falta un servicio que ejecute Node, no solo archivos estáticos. Se elige el día 1 según memoria disponible, versión de Node y tiempo de arranque.

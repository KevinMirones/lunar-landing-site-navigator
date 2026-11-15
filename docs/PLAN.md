# LUMINA: plan de implementación

Qué está hecho, qué falta y en qué orden se hace. El detalle de cada función está en su spec; el estado de todas se ve en el [índice](README.md).

> **Proyecto terminado el 15 de noviembre de 2026, etiqueta `v1.0.0`.** Las 17 specs están hechas. Lo que quedó sin comprobar a mano, y el despliegue en Hostinger, están en [la entrada de cierre](historial/2026-11-15-17-proyecto-terminado.md).

- **Punto de partida:** etiqueta `mvp-v0.1.0` (14 de noviembre de 2026). Ver el [historial](README.md#historial-del-proyecto).
- **Actualizado:** 15 de noviembre de 2026, al cerrar el proyecto.
- **Fechas:** anota aquí la hora límite de entrega en cuanto la confirmes. El plan cuenta en días de trabajo, no en fechas del calendario.

## Dónde estamos

| Bloque del plan | Specs | Estado |
| --- | --- | --- |
| Día 1: comparar fechas y tener dirección pública | [S01](specs/S01-escenarios.md), [S02](specs/S02-enlaces-compartibles.md), [S03](specs/S03-ci-y-despliegue.md) | S01 y S02 hechas. S03 a falta de desplegar |
| Día 2: que la herramienta proponga | [S04](specs/S04-buscador-de-puntos.md), [S05](specs/S05-mejores-fechas.md) | Hechas |
| Día 3: rigor científico | [S06](specs/S06-terreno-multirresolucion.md), [S07](specs/S07-validacion-y-coordenadas.md) | Hechas |
| Fuera del plan | [Paneles plegables, mapa ampliado y logo](historial/2026-11-14-11-paneles-plegables.md) | Hecho y mezclado en `main` (pull request #6) |
| Días 4 a 6 | [S08](specs/S08-energia-y-bateria.md), [S09](specs/S09-ventanas-de-contacto.md), [S10](specs/S10-exportacion.md), [S12](specs/S12-modo-educativo.md), [S13](specs/S13-catalogo-y-polo-norte.md), [S14](specs/S14-robustez-y-calidad.md), [S15](specs/S15-pruebas-de-navegador.md), [S16](specs/S16-sombra-permanente.md) | [Implementadas el 15 de noviembre](historial/2026-11-15-14-specs-s08-a-s16.md), cada una en su rama. Quedan pruebas a mano (ver cada spec) |
| En paralelo | [S11](specs/S11-vista-3d.md) | De Andrés, integrada en `main` con el resto (pull request #9) |
| Fuera del plan | [S17](specs/S17-relieve-global.md) y [arreglos del mapa](historial/2026-11-15-15-mapa-y-comparar.md) | [Hechos el 15 de noviembre](historial/2026-11-15-16-relieve-global.md) y mezclados en `main` |

Los tres primeros días del plan se hicieron en uno. Como referencia de ritmo: S01 a S05 se implementaron en una sesión de unos 40 minutos y S06 y S07 en otra de 30, sin contar la revisión de una persona.

## Lo que falta, en orden

| Paso | Qué | Lo que aporta | Prioridad | Tamaño |
| --- | --- | --- | --- | --- |
| 0 | Mezclar en `main` este plan y las specs (pull request de `samuel`) | Todo el equipo parte de las mismas specs | — | Pequeño |
| 1 | [S03](specs/S03-ci-y-despliegue.md), lo que falta | Pruebas que pasan en cualquier equipo y dirección pública | imprescindible | Pequeño, más las cuentas del equipo |
| 2 | [S15](specs/S15-pruebas-de-navegador.md) | Pruebas de navegador en el repositorio | imprescindible | Mediano |
| 3 | [S08](specs/S08-energia-y-bateria.md) | Vatios, batería y "sobrevive la noche" | imprescindible | Mediano |
| 4 | [S09](specs/S09-ventanas-de-contacto.md) | Margen de elevación y estaciones de tierra | imprescindible | Mediano |
| 5 | [S12](specs/S12-modo-educativo.md) | Recorrido guiado, vista sencilla y glosario | imprescindible | Mediano |
| 6 | [S10](specs/S10-exportacion.md) | CSV e informe imprimible | recortable | Pequeño |
| 7 | [S13](specs/S13-catalogo-y-polo-norte.md) | Más sitios, búsqueda y polo norte | recortable | Mediano; grande con el polo norte |
| 8 | [S16](specs/S16-sombra-permanente.md) | Distancia a la sombra permanente | recortable | Mediano |
| 9 | [S14](specs/S14-robustez-y-calidad.md) | Versión 1.0 estable | imprescindible | Mediano |
| 10 | [Entrega](#entrega) | Vídeo, diapositivas y texto | imprescindible | — |
| 11 | [S17](specs/S17-relieve-global.md) | Relieve y vista 3D en los sitios fuera del polo sur | recortable | Mediano, más una descarga de 531 MB para una sola persona |
| En paralelo | [S11](specs/S11-vista-3d.md) | Paisaje 3D con sombras | recortable | Grande. La lleva Andrés desde el principio |

Las imprescindibles van delante de las recortables. Si el tiempo se acaba en cualquier punto a partir del paso 5, se salta directamente a S14 y a la entrega.

**Dependencias que obligan el orden:**

- S15 va antes que las demás, para que cada spec nueva añada su flujo de navegador.
- S10 necesita S08 y S09.
- S11 y los sitios polares nuevos de S13 necesitan precalcular con las mallas finas (345 MB, `npm run fetch-data -- --hires`). Hoy solo las tiene un equipo.
- S11 tiene que estar mezclada en `main` antes de que empiece S14. Si no llega, queda fuera de la versión 1.0.
- S14 va la última: al empezarla se congela el alcance.

## Reparto

Tres pistas que tocan archivos distintos casi todo el tiempo:

| | Pista A: motor e ingeniería | Pista B: interfaz y público | Pista C: vista 3D |
| --- | --- | --- | --- |
| Quién | Por decidir | Por decidir | Andrés |
| Orden | S03 (cierre) → S08 → S09 → S10 → S16 | S15 → S12 → S13 | S11 |
| Archivos propios | `src/lib/series.ts`, `power.ts`, `comms.ts`, `export.ts`, `server/psr.js`, `Timeline.tsx` | `e2e/`, `tour.ts`, `glossary.ts`, `sites.ts`, la lista de sitios | `Terrain3D.tsx`, `server/data/patches/`, el script de precálculo |
| Al final | S14 y la entrega | S14 y la entrega | Su flujo de navegador y la mezcla en `main` |

**S11 es de Andrés.** Las pistas A y B no la tocan, ni adelantan nada de ella.

Archivos que tocan varias pistas y donde aparecerán los conflictos: [App.tsx](../src/App.tsx), [styles.css](../src/styles.css), [urlState.ts](../src/lib/urlState.ts), [Panels.tsx](../src/components/Panels.tsx) y, entre las pistas A y C, [app.js](../server/app.js). Las reglas de abajo existen para reducirlos.

Si trabaja una sola persona, se sigue la tabla anterior de arriba abajo.

## Calendario

| Día | Objetivo | Specs | Lo que se podrá enseñar |
| --- | --- | --- | --- |
| 4 | Cifras de ingeniería y red de seguridad | S03 (cierre), S15, S08, S09, S10 | "Sobrevive la noche más larga: sí o no", y la dirección pública |
| 5 | Público general y catálogo | S12, S13, S16 | Recorrido guiado, y el paisaje 3D en cuanto se mezcle |
| 6 | Versión 1.0 estable | S14 | Las 20 acciones sin errores en dos equipos |
| 7 | Entrega | [Lista de entrega](#entrega) | Vídeo, diapositivas y texto |

S11 avanza en paralelo durante los días 4 y 5.

## Reglas de trabajo

**Cómo se implementa una spec:**

1. Rama nueva desde `main` actualizado: `feat/s08-energia`, `feat/s12-modo-educativo`, …
2. En la cabecera de la spec, `estado: en curso`, y `npm run docs:index`.
3. La lógica, con la prueba primero: se ve fallar antes de escribir el código.
4. La interfaz, y su flujo en `e2e/`.
5. Verificación completa: `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e` y `npm run docs:check`. Si la spec tiene límites de tiempo, también `npm run test:perf` en el portátil de desarrollo.
6. Spec a `estado: hecha`, con las medidas reales anotadas en sus criterios. Entrada en `docs/historial/` si hubo un hito, un hallazgo o una decisión. `npm run docs:index`.
7. Pull request a `main`. Otra persona del equipo lo prueba en su equipo antes de mezclarlo.

**Terminado significa:** se cumplen los criterios de aceptación de la spec, pasa la verificación completa del paso 5 y un clon limpio arranca.

**Si una spec se queda a medias** (se acaba el tiempo o la sesión de trabajo): se añade a la spec un apartado "Estado" con lo hecho y lo que falta, como en [S03](specs/S03-ci-y-despliegue.md), y se sube la rama. Así la puede retomar otra persona.

**Para no pisarse:**

- **Un pull request por spec, y pequeño.** Antes de abrirlo se mezcla `main` en la rama y se repite la verificación.
- **`App.tsx` solo conecta.** El estado y la lógica de cada spec viven en su propio módulo y su propio componente; en `App.tsx` entran unas pocas líneas.
- **Parámetros del enlace compartible.** Cada spec tiene el suyo reservado, para que dos ramas no elijan la misma letra:

  | Parámetro | Spec | Contenido |
  | --- | --- | --- |
  | `s`, `a`, `t`, `l`, `v`, `m` | S02 (hecha) | Escenarios, activo, horas, idioma, mapa y capa |
  | `p` | S08 | Configuración de energía |
  | `c` | S09 | Margen de elevación y red de estaciones |
  | `x` | S12 | Vista sencilla |
  | `v=terrain` | S11 | Un valor nuevo del parámetro del mapa |

  Un enlace antiguo debe seguir abriendo, y cada parámetro nuevo lleva sus pruebas en [urlState.test.ts](../tests/urlState.test.ts).
- **Bloques nuevos de la interfaz.** Van dentro de un `Collapse` con su clave en `PANELS`, como explica [la entrada de los paneles](historial/2026-11-14-11-paneles-plegables.md). Los de ingeniería se marcan con `data-level="expert"` para la vista sencilla de S12.
- **Estilos.** Cada spec añade su sección al final de `styles.css`, con un comentario de cabecera que la nombra, como ya hace la de S04.
- **Textos.** Siempre en español y en inglés, con `tr(es, en)`.
- **Dependencias.** Solo las que nombra la spec.

**Etiquetas:** `v0.4.0` al cerrar el día 4, `v0.5.0` al cerrar el día 5 y `v1.0.0` al cerrar S14. Si un día sale mal, se vuelve a la etiqueta anterior.

**Historial:** cada hito, decisión importante, hallazgo o incidencia se anota en `docs/historial/`.

**Cifras del guion:** toda cifra que se diga ante el jurado o en el recorrido guiado debe poder reproducirse en la app, con fecha y sitio anotados.

## Si vamos tarde

Se recorta en este orden:

1. [S16](specs/S16-sombra-permanente.md): entera.
2. [S13](specs/S13-catalogo-y-polo-norte.md): el polo norte.
3. [S13](specs/S13-catalogo-y-polo-norte.md): los sitios extra.
4. [S10](specs/S10-exportacion.md): el informe imprimible; se conservan los CSV.
5. [S09](specs/S09-ventanas-de-contacto.md): las estaciones de tierra; se conserva el margen de elevación.
6. [S12](specs/S12-modo-educativo.md): el glosario; se conservan el recorrido y la vista sencilla.

La copia estática de [S03](specs/S03-ci-y-despliegue.md) es recortable en cualquier momento.

[S11](specs/S11-vista-3d.md) no está en la lista porque tiene su propia pista: recortarla no libera tiempo para las demás. Solo queda fuera si no está mezclada cuando empiece S14.

No se recorta: energía, margen de elevación, recorrido guiado, pruebas de navegador, despliegue, robustez y materiales de entrega.

Una spec que se deja fuera se marca `estado: recortada`, para que el índice lo refleje.

## Entrega

- [ ] Hacer público el repositorio. Hoy es privado.
- [ ] Recalcular todas las cifras de [PITCH.md](PITCH.md) y del recorrido guiado con la versión final.
- [ ] Añadir al guion lo nuevo: energía, contacto, recorrido y, si están, 3D y sombra permanente.
- [ ] Vídeo o diapositivas en el formato que pidan las reglas.
- [ ] Texto del proyecto: resumen, datos de NASA usados, créditos y declaración del uso de IA.
- [ ] La lista de 20 acciones de [S14](specs/S14-robustez-y-calidad.md), marcada y guardada en el historial.
- [ ] Tres ensayos con cronómetro y repaso de las preguntas probables.
- [ ] Plan B sin internet: `npm run share` en local, vídeo grabado y capturas.
- [ ] Abrir la dirección pública unos minutos antes de cada demostración.
- [ ] Entregar al menos tres horas antes del límite.

## Trabajo en paralelo

Tareas que no son código:

| Cuándo | Tarea | Para |
| --- | --- | --- |
| Día 4 | Crear la cuenta del alojamiento y desplegar | [S03](specs/S03-ci-y-despliegue.md) |
| Días 4 y 5 | Buscar las coordenadas publicadas de los sitios nuevos y anotar la fuente | [S13](specs/S13-catalogo-y-polo-norte.md) |
| Días 4 a 6 | Probar cada función nueva en el otro equipo y en otro navegador | todas |
| Día 5 | Hacer el recorrido educativo sin ayuda, con alguien ajeno al tema, y anotar qué no se entiende | [S12](specs/S12-modo-educativo.md) |
| Día 6 | Ejecutar la lista de 20 acciones | [S14](specs/S14-robustez-y-calidad.md) |
| Días 5 a 7 | Guion, capturas, vídeo y diapositivas | entrega |

## Riesgos generales

| Riesgo | Señal de alarma | Respuesta |
| --- | --- | --- |
| Una función rompe lo que ya funcionaba | Fallan las pruebas o `npm run e2e` | Se arregla antes de mezclar; si ya está en `main`, se vuelve a la etiqueta anterior |
| Dos ramas chocan en los mismos archivos | Conflictos al mezclar `main` | Pull requests pequeños y las reglas de "Para no pisarse" |
| La vista 3D no llega a tiempo | No está mezclada al empezar S14 | Queda fuera de la 1.0; el panorama y el mapa polar ya cubren la consigna |
| Una spec se queda a medias | Se acaba el tiempo o la sesión | Apartado "Estado" en la spec y rama subida |
| Descargas de NASA lentas o caídas | La descarga no avanza | Es reanudable; el DEM de 240 m, en el repositorio |
| El alojamiento gratuito no aguanta | Se duerme, tarda o se queda corto de CPU | Horizontes precalculados, copia estática y plan B en local |
| Sin internet en la presentación | — | `npm run share` y vídeo grabado |
| Una cifra del guion deja de ser cierta | Cambia al tocar el terreno o el catálogo | Recalcular todas las cifras antes de la entrega |

## Decisiones pendientes

Las toma el equipo. Las specs ya proponen una respuesta para las tres primeras.

- **DEM en el repositorio.** Propuesta de [S03](specs/S03-ci-y-despliegue.md): sí, la malla de 240 m (29 MB). No se puede deshacer sin reescribir el historial.
- **Alojamiento.** Propuesta de [S03](specs/S03-ci-y-despliegue.md): Render, plan gratuito. Hace falta una cuenta.
- **Sombra permanente.** [S16](specs/S16-sombra-permanente.md) no estaba en el plan original. Se hace al final o se marca `recortada` desde ya.
- **Reparto de pistas.** Quién lleva la A y quién la B. La C ya es de Andrés.
- **Cuándo se hace público el repositorio.** Lo necesitan la copia estática y la entrega.
- **Fecha y formato de entrega.** Confirmarlos en las reglas de la sede. Lo habitual en Space Apps es un vídeo de 30 segundos o siete diapositivas, repositorio público y declaración del uso de IA. Este proyecto se desarrolló con asistencia de IA y hay que indicarlo.

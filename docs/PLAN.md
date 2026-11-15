<a id="en"></a>
**English** | [Español](#es)

# LUMINA: implementation plan

What is done, what is left and in what order it gets done. The detail of each feature is in its spec; the status of all of them is in the [index](README.md).

> **Project finished on 15 November 2026, tag `v1.0.0`.** All 17 specs are done. What was left without a manual check, and the Hostinger deployment, are in [the closing entry](historial/2026-11-15-17-proyecto-terminado.md).

- **Starting point:** tag `mvp-v0.1.0` (14 November 2026). See the [history](README.md#project-history).
- **Updated:** 15 November 2026, on closing the project.
- **Dates:** write the submission deadline here as soon as you confirm it. The plan counts working days, not calendar dates.

## Where we are

| Plan block | Specs | Status |
| --- | --- | --- |
| Day 1: compare dates and have a public address | [S01](specs/S01-escenarios.md), [S02](specs/S02-enlaces-compartibles.md), [S03](specs/S03-ci-y-despliegue.md) | S01 and S02 done. S03 still to be deployed |
| Day 2: have the tool make proposals | [S04](specs/S04-buscador-de-puntos.md), [S05](specs/S05-mejores-fechas.md) | Done |
| Day 3: scientific rigour | [S06](specs/S06-terreno-multirresolucion.md), [S07](specs/S07-validacion-y-coordenadas.md) | Done |
| Outside the plan | [Collapsible panels, enlarged map and logo](historial/2026-11-14-11-paneles-plegables.md) | Done and merged into `main` (pull request #6) |
| Days 4 to 6 | [S08](specs/S08-energia-y-bateria.md), [S09](specs/S09-ventanas-de-contacto.md), [S10](specs/S10-exportacion.md), [S12](specs/S12-modo-educativo.md), [S13](specs/S13-catalogo-y-polo-norte.md), [S14](specs/S14-robustez-y-calidad.md), [S15](specs/S15-pruebas-de-navegador.md), [S16](specs/S16-sombra-permanente.md) | [Implemented on 15 November](historial/2026-11-15-14-specs-s08-a-s16.md), each on its own branch. Manual checks remain (see each spec) |
| In parallel | [S11](specs/S11-vista-3d.md) | By Andrés, merged into `main` with the rest (pull request #9) |
| Outside the plan | [S17](specs/S17-relieve-global.md) and [map fixes](historial/2026-11-15-15-mapa-y-comparar.md) | [Done on 15 November](historial/2026-11-15-16-relieve-global.md) and merged into `main` |

The first three days of the plan were done in one. As a reference for pace: S01 to S05 were implemented in one session of about 40 minutes and S06 and S07 in another of 30, not counting review by a person.

## What is left, in order

| Step | What | What it brings | Priority | Size |
| --- | --- | --- | --- | --- |
| 0 | Merge this plan and the specs into `main` (pull request from `samuel`) | The whole team starts from the same specs | — | Small |
| 1 | [S03](specs/S03-ci-y-despliegue.md), what is left | Tests that pass on any machine, and a public address | essential | Small, plus the team's accounts |
| 2 | [S15](specs/S15-pruebas-de-navegador.md) | Browser tests in the repository | essential | Medium |
| 3 | [S08](specs/S08-energia-y-bateria.md) | Watts, battery and "survives the night" | essential | Medium |
| 4 | [S09](specs/S09-ventanas-de-contacto.md) | Elevation margin and ground stations | essential | Medium |
| 5 | [S12](specs/S12-modo-educativo.md) | Guided tour, simple view and glossary | essential | Medium |
| 6 | [S10](specs/S10-exportacion.md) | CSV and printable report | can be cut | Small |
| 7 | [S13](specs/S13-catalogo-y-polo-norte.md) | More sites, search and north pole | can be cut | Medium; large with the north pole |
| 8 | [S16](specs/S16-sombra-permanente.md) | Distance to permanent shadow | can be cut | Medium |
| 9 | [S14](specs/S14-robustez-y-calidad.md) | Stable version 1.0 | essential | Medium |
| 10 | [Delivery](#delivery) | Video, slides and text | essential | — |
| 11 | [S17](specs/S17-relieve-global.md) | Relief and 3D view at the sites away from the south pole | can be cut | Medium, plus a 531 MB download for one person only |
| In parallel | [S11](specs/S11-vista-3d.md) | 3D landscape with shadows | can be cut | Large. Andrés has it from the start |

Essential specs go before those that can be cut. If time runs out at any point from step 5 on, jump straight to S14 and to delivery.

**Dependencies that force the order:**

- S15 goes before the others, so that each new spec adds its browser flow.
- S10 needs S08 and S09.
- S11 and the new polar sites of S13 need precomputing with the fine grids (345 MB, `npm run fetch-data -- --hires`). Today only one machine has them.
- S11 has to be merged into `main` before S14 starts. If it is not, it stays out of version 1.0.
- S14 goes last: when it starts, the scope is frozen.

## Who does what

Three tracks that touch different files nearly all the time:

| | Track A: engine and engineering | Track B: interface and public | Track C: 3D view |
| --- | --- | --- | --- |
| Who | To be decided | To be decided | Andrés |
| Order | S03 (closing) → S08 → S09 → S10 → S16 | S15 → S12 → S13 | S11 |
| Own files | `src/lib/series.ts`, `power.ts`, `comms.ts`, `export.ts`, `server/psr.js`, `Timeline.tsx` | `e2e/`, `tour.ts`, `glossary.ts`, `sites.ts`, the site list | `Terrain3D.tsx`, `server/data/patches/`, the precompute script |
| At the end | S14 and delivery | S14 and delivery | Its browser flow and the merge into `main` |

**S11 belongs to Andrés.** Tracks A and B do not touch it, and do not get ahead on any of it.

Files that several tracks touch and where conflicts will show up: [App.tsx](../src/App.tsx), [styles.css](../src/styles.css), [urlState.ts](../src/lib/urlState.ts), [Panels.tsx](../src/components/Panels.tsx) and, between tracks A and C, [app.js](../server/app.js). The rules below exist to reduce them.

If one person works alone, follow the table above from top to bottom.

## Calendar

| Day | Goal | Specs | What can be shown |
| --- | --- | --- | --- |
| 4 | Engineering figures and safety net | S03 (closing), S15, S08, S09, S10 | "Survives the longest night: yes or no", and the public address |
| 5 | General public and catalogue | S12, S13, S16 | Guided tour, and the 3D landscape as soon as it is merged |
| 6 | Stable version 1.0 | S14 | The 20 actions without errors on two machines |
| 7 | Delivery | [Delivery list](#delivery) | Video, slides and text |

S11 moves forward in parallel during days 4 and 5.

## Working rules

**How a spec is implemented:**

1. New branch from an up-to-date `main`: `feat/s08-energia`, `feat/s12-modo-educativo`, …
2. In the spec's front matter, `estado: en curso`, and `npm run docs:index`.
3. The logic, test first: watch it fail before writing the code.
4. The interface, and its flow in `e2e/`.
5. Full verification: `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e` and `npm run docs:check`. If the spec has time limits, also `npm run test:perf` on the development laptop.
6. Spec to `estado: hecha`, with the real measurements written into its criteria. An entry in `docs/historial/` if there was a milestone, a finding or a decision. `npm run docs:index`.
7. Pull request to `main`. Someone else on the team tries it on their machine before merging it.

**Done means:** the spec's acceptance criteria are met, the full verification of step 5 passes and a clean clone starts.

**If a spec is left half done** (time or the work session runs out): add a "Status" section to the spec with what is done and what is left, as in [S03](specs/S03-ci-y-despliegue.md), and push the branch. That way someone else can pick it up.

**So as not to step on each other:**

- **One pull request per spec, and a small one.** Before opening it, merge `main` into the branch and repeat the verification.
- **`App.tsx` only wires things up.** The state and logic of each spec live in its own module and its own component; only a few lines go into `App.tsx`.
- **Parameters of the shareable link.** Each spec has its own reserved, so that two branches do not pick the same letter:

  | Parameter | Spec | Content |
  | --- | --- | --- |
  | `s`, `a`, `t`, `l`, `v`, `m` | S02 (done) | Scenarios, active one, hours, language, map and layer |
  | `p` | S08 | Power configuration |
  | `c` | S09 | Elevation margin and station network |
  | `x` | S12 | Simple view |
  | `v=terrain` | S11 | A new value of the map parameter |

  An old link must keep opening, and each new parameter has its tests in [urlState.test.ts](../tests/urlState.test.ts).
- **New interface blocks.** They go inside a `Collapse` with its key in `PANELS`, as [the panels entry](historial/2026-11-14-11-paneles-plegables.md) explains. Engineering ones are marked `data-level="expert"` for the simple view of S12.
- **Styles.** Each spec adds its section at the end of `styles.css`, with a header comment that names it, as the S04 one already does.
- **Texts.** Always in Spanish and English, with `tr(es, en)`.
- **Dependencies.** Only those the spec names.

**Tags:** `v0.4.0` on closing day 4, `v0.5.0` on closing day 5 and `v1.0.0` on closing S14. If a day goes wrong, go back to the previous tag.

**History:** every milestone, important decision, finding or incident is recorded in `docs/historial/`.

**Figures in the pitch:** every figure said to the jury or in the guided tour must be reproducible in the app, with the date and site noted.

## If we run late

Cut in this order:

1. [S16](specs/S16-sombra-permanente.md): all of it.
2. [S13](specs/S13-catalogo-y-polo-norte.md): the north pole.
3. [S13](specs/S13-catalogo-y-polo-norte.md): the extra sites.
4. [S10](specs/S10-exportacion.md): the printable report; the CSVs stay.
5. [S09](specs/S09-ventanas-de-contacto.md): the ground stations; the elevation margin stays.
6. [S12](specs/S12-modo-educativo.md): the glossary; the tour and the simple view stay.

The static copy of [S03](specs/S03-ci-y-despliegue.md) can be cut at any time.

[S11](specs/S11-vista-3d.md) is not on the list because it has its own track: cutting it frees no time for the others. It only stays out if it is not merged when S14 starts.

Not cut: power, elevation margin, guided tour, browser tests, deployment, robustness and delivery materials.

A spec that is left out is marked `estado: recortada`, so that the index reflects it.

## Delivery

- [ ] Make the repository public. Today it is private.
- [ ] Recompute every figure in [PITCH.md](PITCH.md) and in the guided tour with the final version.
- [ ] Add what is new to the pitch: power, contact, tour and, if they are in, 3D and permanent shadow.
- [ ] Video or slides in the format the rules ask for.
- [ ] Project text: summary, NASA data used, credits and the statement on the use of AI.
- [ ] The list of 20 actions of [S14](specs/S14-robustez-y-calidad.md), ticked and saved in the history.
- [ ] Three timed rehearsals and a review of the likely questions.
- [ ] Plan B without internet: `npm run share` locally, a recorded video and screenshots.
- [ ] Open the public address a few minutes before each demo.
- [ ] Submit at least three hours before the deadline.

## Work in parallel

Tasks that are not code:

| When | Task | For |
| --- | --- | --- |
| Day 4 | Create the hosting account and deploy | [S03](specs/S03-ci-y-despliegue.md) |
| Days 4 and 5 | Find the published coordinates of the new sites and note the source | [S13](specs/S13-catalogo-y-polo-norte.md) |
| Days 4 to 6 | Try each new feature on the other machine and in another browser | all |
| Day 5 | Do the educational tour without help, with someone new to the subject, and note what is not understood | [S12](specs/S12-modo-educativo.md) |
| Day 6 | Run the list of 20 actions | [S14](specs/S14-robustez-y-calidad.md) |
| Days 5 to 7 | Pitch, screenshots, video and slides | delivery |

## General risks

| Risk | Warning sign | Response |
| --- | --- | --- |
| A feature breaks what already worked | The tests or `npm run e2e` fail | Fix it before merging; if it is already in `main`, go back to the previous tag |
| Two branches collide in the same files | Conflicts when merging `main` | Small pull requests and the rules under "So as not to step on each other" |
| The 3D view is not ready in time | It is not merged when S14 starts | It stays out of 1.0; the panorama and the polar map already cover the brief |
| A spec is left half done | Time or the session runs out | A "Status" section in the spec and the branch pushed |
| NASA downloads slow or down | The download does not advance | It can be resumed; the 240 m DEM is in the repository |
| The free host cannot cope | It sleeps, is slow or runs short of CPU | Precomputed horizons, static copy and plan B locally |
| No internet at the presentation | — | `npm run share` and a recorded video |
| A figure in the pitch stops being true | It changes when the terrain or the catalogue is touched | Recompute every figure before delivery |

## Open decisions

The team makes them. The specs already propose an answer for the first three.

- **DEM in the repository.** Proposal of [S03](specs/S03-ci-y-despliegue.md): yes, the 240 m grid (29 MB). It cannot be undone without rewriting the history.
- **Hosting.** Proposal of [S03](specs/S03-ci-y-despliegue.md): Render, free plan. An account is needed.
- **Permanent shadow.** [S16](specs/S16-sombra-permanente.md) was not in the original plan. It is done at the end or marked `recortada` right away.
- **Who takes which track.** Who takes A and who takes B. C already belongs to Andrés.
- **When the repository is made public.** The static copy and the delivery need it.
- **Delivery date and format.** Confirm them in the local event's rules. The usual in Space Apps is a 30-second video or seven slides, a public repository and a statement on the use of AI. This project was developed with AI assistance, and that has to be stated.

---

<a id="es"></a>
**Español** | [English](#en)

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

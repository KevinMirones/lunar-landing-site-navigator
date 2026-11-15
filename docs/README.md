<a id="en"></a>
**English** | [Español](#es)

# LUMINA documentation

> Index generated with `npm run docs:index` from the front matter of each file. Do not edit it by hand.

## Where to start

- [Project README](../README.md): What LUMINA is, how it works and how to start it.
- [Implementation plan](PLAN.md): What is done, what is left and in what order; tracks, working rules, cuts and risks.
- [Pitch for the jury](PITCH.md): Problem, results, three-minute demo and likely questions.
- [Scientific validation](VALIDACION.md): Comparison of LUMINA's results with published values.

## Specs

17 specs: 0 pending, 0 in progress, 17 done, 0 cut.

| ID | Spec | Day | Priority | Status | Depends on |
| --- | --- | --- | --- | --- | --- |
| S01 | [Comparable scenarios](specs/S01-escenarios.md)<br>Compare the same site side by side on different dates, durations or mast heights. | 1 | essential | done | — |
| S02 | [Shareable links](specs/S02-enlaces-compartibles.md)<br>Copy a link that opens exactly the same comparison in another browser. | 1 | essential | done | [S01](specs/S01-escenarios.md) |
| S03 | [Continuous integration and public deployment](specs/S03-ci-y-despliegue.md)<br>Every change is tested automatically and there is a public address the jury can open. | 1 | essential | done | — |
| S04 | [Search for nearby points](specs/S04-buscador-de-puntos.md)<br>A heat map around a point and the five best places to land nearby. | 2 | essential | done | [S01](specs/S01-escenarios.md) |
| S05 | [Search for the best dates](specs/S05-mejores-fechas.md)<br>The five best landing dates of the year for a given site and duration. | 2 | essential | done | [S01](specs/S01-escenarios.md) |
| S06 | [Multi-resolution terrain](specs/S06-terreno-multirresolucion.md)<br>Horizon computed with cells of 20 to 80 m near the site, instead of 240 m. | 3 | essential | done | — |
| S07 | [Scientific validation and official coordinates](specs/S07-validacion-y-coordenadas.md)<br>A table that compares our results with published ones, and every site with its source. | 3 | essential | done | [S06](specs/S06-terreno-multirresolucion.md) |
| S08 | [Power and battery model](specs/S08-energia-y-bateria.md)<br>Power, daily energy and the battery needed to survive the longest night. | 4 | essential | done | [S01](specs/S01-escenarios.md) |
| S09 | [Real contact windows](specs/S09-ventanas-de-contacto.md)<br>Link with an elevation margin and with the ground stations that see the Moon at each moment. | 4 | essential | done | [S01](specs/S01-escenarios.md) |
| S10 | [Window export and report](specs/S10-exportacion.md)<br>Download the windows as CSV and print a one-page report with the comparison. | 4 | can be cut | done | [S01](specs/S01-escenarios.md), [S08](specs/S08-energia-y-bateria.md), [S09](specs/S09-ventanas-de-contacto.md) |
| S11 | [3D view of the terrain](specs/S11-vista-3d.md)<br>Stand at the site, at mast height, and look around while the Sun and Earth move over the real relief. | 5 | can be cut | done | [S06](specs/S06-terreno-multirresolucion.md) |
| S12 | [Educational mode](specs/S12-modo-educativo.md)<br>A five-step guided tour, a glossary and a simple view for non-specialists. | 5 | essential | done | [S01](specs/S01-escenarios.md) |
| S13 | [Extended catalogue and north pole](specs/S13-catalogo-y-polo-norte.md)<br>More historic and future sites, with a search, and real terrain at the north pole too. | 5 | can be cut | done | [S07](specs/S07-validacion-y-coordenadas.md) |
| S14 | [Robustness and quality](specs/S14-robustez-y-calidad.md)<br>That it works on any machine and browser, with the keyboard, and with no surprises in the demo. | 6 | essential | done | [S01](specs/S01-escenarios.md), [S02](specs/S02-enlaces-compartibles.md), [S03](specs/S03-ci-y-despliegue.md), [S15](specs/S15-pruebas-de-navegador.md) |
| S15 | [Browser tests in the repository](specs/S15-pruebas-de-navegador.md)<br>One command that opens the app in a real browser and checks every feature, on every pull request too. | 4 | essential | done | [S03](specs/S03-ci-y-despliegue.md) |
| S16 | [Distance to permanent shadow](specs/S16-sombra-permanente.md)<br>Each site says how far away the nearest permanently shadowed area is, where ice can be preserved. | 5 | can be cut | done | [S04](specs/S04-buscador-de-puntos.md), [S07](specs/S07-validacion-y-coordenadas.md) |
| S17 | [Relief across the whole Moon](specs/S17-relieve-global.md)<br>Sites away from the south pole, such as those of the Apollo programme, have a horizon with real relief and a 3D view, like the polar ones. | 7 | can be cut | done | [S06](specs/S06-terreno-multirresolucion.md), [S11](specs/S11-vista-3d.md), [S13](specs/S13-catalogo-y-polo-norte.md) |

## Project history

Most recent first.

| Date | Entry | Type |
| --- | --- | --- |
| 2026-11-15 | [Project finished (v1.0.0)](historial/2026-11-15-17-proyecto-terminado.md)<br>All 17 specs are done and LUMINA closes with the v1.0.0 tag. It is deployed on Hostinger with all the data. What could not be checked by hand is on record. | milestone |
| 2026-11-15 | [Real relief across the whole Moon](historial/2026-11-15-16-relieve-global.md)<br>The 25 catalogue sites away from the south pole, such as the Apollo ones, have a horizon with real relief and a 3D view. The global topography is precomputed once and goes in the repository, so the rest of the team downloads nothing. | milestone |
| 2026-11-15 | [The polar map stays on its data and the list takes sites out of the comparison](historial/2026-11-15-15-mapa-y-comparar.md)<br>Testing the integrated version showed that the map's zoom buttons did nothing, that the map could be dragged off its data and that there was no clear way to take a site out of the comparison. Fixed. | incident |
| 2026-11-15 | [Specs S08 to S16 implemented, except S11](historial/2026-11-15-14-specs-s08-a-s16.md)<br>Power, contact, export, educational mode, catalogue, permanent shadow, robustness and browser tests, on stacked branches. | milestone |
| 2026-11-15 | [The 3D view opens from the panorama](historial/2026-11-15-13-vista-3d.md)<br>S11 goes from a map tab to a full-screen first-person view, with the real relief and the Sun and Earth in motion. Phase 1 implemented. | decision |
| 2026-11-14 | [All the pending specs, ready to implement](historial/2026-11-14-12-specs-completas-y-plan.md)<br>S03 and S08 to S14 reviewed against the real code, two new specs (S15 and S16) and a plan with order, tracks and rules. | decision |
| 2026-11-14 | [Collapsible panels, enlarged map and new logo](historial/2026-11-14-11-paneles-plegables.md)<br>Each section collapses and remembers its state; one button gives the map the full width. Merged with S01 to S07 and already in main. | milestone |
| 2026-11-14 | [Specs S06 and S07 implemented](historial/2026-11-14-10-specs-s06-y-s07.md)<br>Terrain of 20 to 80 m, precomputed horizons and validation against NASA's maps and Gläser et al. | milestone |
| 2026-11-14 | [Two decimals of latitude were enough at 240 m; at 20 m they are not](historial/2026-11-14-09-trescientos-metros.md)<br>On fine terrain, the catalogue's Shackleton point went from 100% to 12% sunlight; its coordinates had 300 m of leeway. | finding |
| 2026-11-14 | [Specs S01 to S05 implemented](historial/2026-11-14-08-specs-s01-a-s05.md)<br>Scenarios, shareable links, point search and date search, and the server ready to go public. | milestone |
| 2026-11-14 | [A five-month delay takes the ridge from 100% to 28% sunlight](historial/2026-11-14-07-estaciones-lunares.md)<br>The date search shows the lunar seasons; southern winter falls at the end of April 2027. | finding |
| 2026-11-14 | [Rounding a point by 16 m changed its link from 100% to 93%](historial/2026-11-14-06-dieciseis-metros.md)<br>Custom points were stored with three decimals; they are now stored with five. | finding |
| 2026-11-14 | [The week's plan turned into 14 specs](historial/2026-11-14-05-plan-y-specs.md)<br>The remaining work is split into specs with a status, and the index generates itself. | decision |
| 2026-11-14 | [Publishing on GitHub and a resumable data download](historial/2026-11-14-04-publicacion-y-descarga.md)<br>Testing a clean clone revealed a fault in the DEM download; it was fixed before publishing. | incident |
| 2026-11-14 | [At Malapert, 1.2 km separate 0% and 100% link](historial/2026-11-14-03-hallazgo-malapert.md)<br>The catalogue point was blocked by its own slope; moved 1.2 km it has continuous link. | finding |
| 2026-11-14 | [Design decisions of the MVP](historial/2026-11-14-02-decisiones-de-diseno.md)<br>Why the ephemeris runs in the browser, the terrain on the server, and how "visible" is defined. | decision |
| 2026-11-14 | [MVP built and verified](historial/2026-11-14-01-mvp.md)<br>First complete version of LUMINA, from the ephemeris to the interface, tagged mvp-v0.1.0. | milestone |

## How to maintain this

- **Every document is bilingual:** English first, Spanish below. In the front matter, `title` and `summary` are the English of `titulo` and `resumen`.
- **Changing the status of a spec:** edit `estado` in its front matter (`pendiente`, `en curso`, `hecha`, `recortada`, that is: pending, in progress, done, cut) and run `npm run docs:index`.
- **Adding a spec:** copy [specs/_plantilla.md](specs/_plantilla.md) with the next number (`S18-name.md`).
- **Adding a history entry:** create `historial/YYYY-MM-DD-NN-name.md` with `fecha`, `titulo`, `title`, `tipo` (`hito`, `decisión`, `hallazgo`, `incidencia`, that is: milestone, decision, finding, incident), `resumen` and `summary`.
- **Checking:** `npm run docs:check` fails if the index is out of date, a field is missing or there is a broken link.

---

<a id="es"></a>
**Español** | [English](#en)

# Documentación de LUMINA

> Índice generado con `npm run docs:index` a partir de la cabecera de cada archivo. No lo edites a mano.

## Por dónde empezar

- [README del proyecto](../README.md): Qué es LUMINA, cómo funciona y cómo arrancarlo.
- [Plan de implementación](PLAN.md): Qué está hecho, qué falta y en qué orden; reparto, reglas de trabajo, recortes y riesgos.
- [Guion para el jurado](PITCH.md): Problema, resultados, demostración de tres minutos y preguntas probables.
- [Validación científica](VALIDACION.md): Comparación de los resultados de LUMINA con valores publicados.

## Specs

17 specs: 0 pendientes, 0 en curso, 17 hechas, 0 recortadas.

| ID | Spec | Día | Prioridad | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| S01 | [Escenarios comparables](specs/S01-escenarios.md)<br>Comparar lado a lado el mismo sitio en fechas, duraciones o mástiles distintos. | 1 | imprescindible | hecha | — |
| S02 | [Enlaces compartibles](specs/S02-enlaces-compartibles.md)<br>Copiar un enlace que abre exactamente la misma comparación en otro navegador. | 1 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S03 | [Integración continua y despliegue público](specs/S03-ci-y-despliegue.md)<br>Cada cambio se prueba solo y hay una dirección pública que el jurado puede abrir. | 1 | imprescindible | hecha | — |
| S04 | [Buscador de puntos cercanos](specs/S04-buscador-de-puntos.md)<br>Mapa de calor alrededor de un punto y los cinco mejores lugares para aterrizar cerca. | 2 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S05 | [Buscador de mejores fechas](specs/S05-mejores-fechas.md)<br>Las cinco mejores fechas de alunizaje del año para un sitio y una duración dados. | 2 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S06 | [Terreno multirresolución](specs/S06-terreno-multirresolucion.md)<br>Horizonte calculado con celdas de 20 a 80 m cerca del sitio, en lugar de 240 m. | 3 | imprescindible | hecha | — |
| S07 | [Validación científica y coordenadas oficiales](specs/S07-validacion-y-coordenadas.md)<br>Tabla que compara nuestros resultados con los publicados, y cada sitio con su fuente. | 3 | imprescindible | hecha | [S06](specs/S06-terreno-multirresolucion.md) |
| S08 | [Modelo de energía y batería](specs/S08-energia-y-bateria.md)<br>Potencia, energía diaria y batería necesaria para sobrevivir la noche más larga. | 4 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S09 | [Ventanas de contacto reales](specs/S09-ventanas-de-contacto.md)<br>Enlace con margen de elevación y con las estaciones de tierra que ven la Luna en cada momento. | 4 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S10 | [Exportación de ventanas e informe](specs/S10-exportacion.md)<br>Descargar las ventanas en CSV e imprimir un informe de una página con la comparación. | 4 | recortable | hecha | [S01](specs/S01-escenarios.md), [S08](specs/S08-energia-y-bateria.md), [S09](specs/S09-ventanas-de-contacto.md) |
| S11 | [Vista 3D del terreno](specs/S11-vista-3d.md)<br>Ponerse en el sitio, a la altura del mástil, y mirar alrededor mientras el Sol y la Tierra se mueven sobre el relieve real. | 5 | recortable | hecha | [S06](specs/S06-terreno-multirresolucion.md) |
| S12 | [Modo educativo](specs/S12-modo-educativo.md)<br>Un recorrido guiado de cinco pasos, un glosario y una vista sencilla para quien no es especialista. | 5 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S13 | [Catálogo ampliado y polo norte](specs/S13-catalogo-y-polo-norte.md)<br>Más sitios históricos y futuros, con buscador, y terreno real también en el polo norte. | 5 | recortable | hecha | [S07](specs/S07-validacion-y-coordenadas.md) |
| S14 | [Robustez y calidad](specs/S14-robustez-y-calidad.md)<br>Que funcione en cualquier equipo y navegador, con teclado, y sin sorpresas en la demostración. | 6 | imprescindible | hecha | [S01](specs/S01-escenarios.md), [S02](specs/S02-enlaces-compartibles.md), [S03](specs/S03-ci-y-despliegue.md), [S15](specs/S15-pruebas-de-navegador.md) |
| S15 | [Pruebas de navegador en el repositorio](specs/S15-pruebas-de-navegador.md)<br>Una orden que abre la app en un navegador real y comprueba cada función, también en cada pull request. | 4 | imprescindible | hecha | [S03](specs/S03-ci-y-despliegue.md) |
| S16 | [Distancia a la sombra permanente](specs/S16-sombra-permanente.md)<br>Cada sitio dice a qué distancia tiene la zona en sombra permanente más cercana, donde puede conservarse hielo. | 5 | recortable | hecha | [S04](specs/S04-buscador-de-puntos.md), [S07](specs/S07-validacion-y-coordenadas.md) |
| S17 | [Relieve en toda la Luna](specs/S17-relieve-global.md)<br>Los sitios fuera del polo sur, como los del programa Apollo, tienen horizonte con relieve real y vista 3D, igual que los del polo. | 7 | recortable | hecha | [S06](specs/S06-terreno-multirresolucion.md), [S11](specs/S11-vista-3d.md), [S13](specs/S13-catalogo-y-polo-norte.md) |

## Historial del proyecto

De lo más reciente a lo más antiguo.

| Fecha | Entrada | Tipo |
| --- | --- | --- |
| 2026-11-15 | [Proyecto terminado (v1.0.0)](historial/2026-11-15-17-proyecto-terminado.md)<br>Las 17 specs están hechas y LUMINA se cierra con la etiqueta v1.0.0. Se despliega en Hostinger con todos los datos. Queda anotado qué no se pudo comprobar a mano. | hito |
| 2026-11-15 | [Relieve real en toda la Luna](historial/2026-11-15-16-relieve-global.md)<br>Los 25 sitios del catálogo fuera del polo sur, como los Apollo, tienen horizonte con relieve real y vista 3D. La topografía global se precalcula una vez y va en el repositorio, así que el resto del equipo no descarga nada. | hito |
| 2026-11-15 | [El mapa polar se queda en sus datos y la lista saca sitios de la comparación](historial/2026-11-15-15-mapa-y-comparar.md)<br>Al probar la versión integrada se vio que los botones de zoom del mapa no hacían nada, que el mapa se podía arrastrar fuera de sus datos y que no había forma clara de sacar un sitio de la comparación. Corregido. | incidencia |
| 2026-11-15 | [Specs S08 a S16 implementadas, salvo S11](historial/2026-11-15-14-specs-s08-a-s16.md)<br>Energía, contacto, exportación, modo educativo, catálogo, sombra permanente, robustez y pruebas de navegador, en ramas apiladas. | hito |
| 2026-11-15 | [La vista 3D se abre desde el panorama](historial/2026-11-15-13-vista-3d.md)<br>S11 pasa de una pestaña del mapa a una vista en primera persona a pantalla completa, con el relieve real y el Sol y la Tierra en movimiento. Fase 1 implementada. | decisión |
| 2026-11-14 | [Todas las specs pendientes, listas para implementar](historial/2026-11-14-12-specs-completas-y-plan.md)<br>S03 y S08 a S14 revisadas contra el código real, dos specs nuevas (S15 y S16) y un plan con orden, reparto y reglas. | decisión |
| 2026-11-14 | [Paneles plegables, mapa ampliado y logo nuevo](historial/2026-11-14-11-paneles-plegables.md)<br>Cada sección se pliega y recuerda su estado; un botón deja el mapa a todo el ancho. Mezclado con S01 a S07 y ya en main. | hito |
| 2026-11-14 | [Specs S06 y S07 implementadas](historial/2026-11-14-10-specs-s06-y-s07.md)<br>Terreno de 20 a 80 m, horizontes precalculados y validación contra los mapas de NASA y Gläser et al. | hito |
| 2026-11-14 | [Dos decimales de latitud bastaban a 240 m; a 20 m, no](historial/2026-11-14-09-trescientos-metros.md)<br>Con terreno fino, el punto de Shackleton del catálogo pasó de 100% a 12% de luz; sus coordenadas tenían 300 m de margen. | hallazgo |
| 2026-11-14 | [Specs S01 a S05 implementadas](historial/2026-11-14-08-specs-s01-a-s05.md)<br>Escenarios, enlaces compartibles, buscador de puntos y de fechas, y el servidor listo para publicarse. | hito |
| 2026-11-14 | [Un retraso de cinco meses lleva la cresta de 100% a 28% de luz](historial/2026-11-14-07-estaciones-lunares.md)<br>El buscador de fechas muestra las estaciones lunares; el invierno austral cae a finales de abril de 2027. | hallazgo |
| 2026-11-14 | [Redondear un punto 16 m cambiaba su enlace de 100% a 93%](historial/2026-11-14-06-dieciseis-metros.md)<br>Los puntos propios se guardaban con tres decimales; ahora se guardan con cinco. | hallazgo |
| 2026-11-14 | [Plan de la semana convertido en 14 specs](historial/2026-11-14-05-plan-y-specs.md)<br>El trabajo pendiente queda dividido en specs con estado, y el índice se genera solo. | decisión |
| 2026-11-14 | [Publicación en GitHub y descarga de datos reanudable](historial/2026-11-14-04-publicacion-y-descarga.md)<br>Al probar un clon limpio apareció un fallo en la descarga del DEM; se corrigió antes de publicar. | incidencia |
| 2026-11-14 | [En Malapert, 1.2 km separan 0% y 100% de enlace](historial/2026-11-14-03-hallazgo-malapert.md)<br>El punto del catálogo quedaba tapado por su propia ladera; movido 1.2 km tiene enlace continuo. | hallazgo |
| 2026-11-14 | [Decisiones de diseño del MVP](historial/2026-11-14-02-decisiones-de-diseno.md)<br>Por qué las efemérides van en el navegador, el terreno en el servidor, y cómo se define "visible". | decisión |
| 2026-11-14 | [MVP construido y verificado](historial/2026-11-14-01-mvp.md)<br>Primera versión completa de LUMINA, de la efeméride a la interfaz, etiquetada como mvp-v0.1.0. | hito |

## Cómo mantener esto

- **Todos los documentos son bilingües:** primero en inglés y debajo en español. En la cabecera, `title` y `summary` son la versión en inglés de `titulo` y `resumen`.
- **Cambiar el estado de una spec:** edita `estado` en su cabecera (`pendiente`, `en curso`, `hecha`, `recortada`) y ejecuta `npm run docs:index`.
- **Añadir una spec:** copia [specs/_plantilla.md](specs/_plantilla.md) con el siguiente número (`S18-nombre.md`).
- **Añadir una entrada al historial:** crea `historial/AAAA-MM-DD-NN-nombre.md` con `fecha`, `titulo`, `title`, `tipo` (`hito`, `decisión`, `hallazgo`, `incidencia`), `resumen` y `summary`.
- **Comprobar:** `npm run docs:check` falla si el índice está desactualizado, falta un campo o hay un enlace roto.

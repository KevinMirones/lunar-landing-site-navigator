---
id: S13
titulo: Catálogo ampliado y polo norte
title: Extended catalogue and north pole
estado: hecha
dia: 5
prioridad: recortable
depende: S07
resumen: Más sitios históricos y futuros, con buscador, y terreno real también en el polo norte.
summary: More historic and future sites, with a search, and real terrain at the north pole too.
---

<a id="en"></a>
**English** | [Español](#es)

# S13: Extended catalogue and north pole

## Problem

The catalogue has 18 sites: 12 at the south pole with real terrain and 6 over the rest of the Moon. The challenge brief mentions Apollo missions, CLPS targets, commercial missions and other countries' programmes; there are obvious gaps. Also, real terrain only covers the south pole.

## Result

The catalogue and the search have been done since 15 November. The north pole, which the spec marks as optional, is left undone: the [plan](../PLAN.md#if-we-run-late) cuts it before the extra sites.

| Criterion | Result |
| --- | --- |
| 1. At least 35 sites with a source | 37: the earlier 18 and 19 historic landings (Apollo 12, 14, 15 and 16; Luna 9, 13, 16, 17, 20, 21 and 24; Surveyor 1, 3, 5, 6 and 7; Chang'e 3, 5 and 6) |
| 2. Searching "CLPS" or "1972" | Filters the four CLPS sites and the three landings of 1972. Words are combined, and case, accents and apostrophes are ignored |
| 3. Links with new sites | They work, checked in another tab |
| 4. Precomputed horizons of the new polar sites | There are no new polar sites. An automated test requires the three horizons for every site south of 80°S, for when there are |
| 5. North pole | Not done |

Checked with [sites.test.ts](../../tests/sites.test.ts) and in the browser with [s13-catalogo.mjs](../../e2e/s13-catalogo.mjs) (11 checks).

**Source of the new sites.** The coordinates come from Wikipedia's "List of artificial objects on the Moon" article, which cites the source for each mission, and each site says so. It is a weaker source than those of [S07](S07-validacion-y-coordenadas.md): they should be checked against LROC images before being quoted to the jury. No figure in the pitch depends on them.

**Not added:** the missing Artemis III regions and future CLPS missions: no published point was found for them, and the rule is that a site without a source does not go in.

**How it is grouped.** The list's groups by region are kept (south pole, other latitudes and your points). Each site gains `program` and `year`, which feed the search.

## What the user will see

- About 35 sites, grouped by region and programme.
- A search field in the list, by name, programme or year.
- Optional: a north/south switch on the polar map and a real horizon north of 80°N.

## Design

### Catalogue

**Sites added**, each with its source under the rule of [S07](S07-validacion-y-coordenadas.md):

- Apollo 12, 14, 15 and 16.
- Luna 9, 16, 17 and 24; Surveyor 1 and 3.
- Chang'e 3, 5 and 6.
- The Artemis III candidate regions missing from the nine of October 2024, as representative points.
- Upcoming CLPS and commercial missions with an announced site.

**Changes in [sites.ts](../../src/lib/sites.ts):**

- New field `program`: `apollo`, `luna`, `surveyor`, `change`, `chandrayaan`, `clps`, `artemis`, `commercial` or `other`.
- New field `year`: year of the landing, or the planned one. It is omitted for points that do not correspond to a mission.
- The search compares the text with the name, the tag, the programme and the year.

**Site list** (`SiteList` in [Panels.tsx](../../src/components/Panels.tsx)): search field at the top and collapsible groups by region.

**New polar sites.** Each site south of 80°S needs its precomputed horizons, and its patches if [S11](S11-vista-3d.md) is done. `npm run precompute` has to be run on a machine with the fine grids and the new files pushed.

**Rule:** a site without a reliable source for its coordinates does not go into the catalogue.

### North pole (optional)

The equivalent products exist. Checked on 14 November 2026 on the same server the southern ones are downloaded from:

| Product | Cell | Size |
| --- | --- | --- |
| `ldem_75n_240m` | 240 m | 29 MB, the same as the southern one |
| `ldem_80n_80m` | 80 m | 116 MB |
| `ldem_85n_40m` | 40 m | 115 MB |
| `ldem_875n_20m` | 20 m | 115 MB |

- Only the 240 m grid is used: `npm run fetch-data -- --north`.
- [dem.js](../../server/dem.js), [horizon.js](../../server/horizon.js) and the shader of [PolarMap.tsx](../../src/components/PolarMap.tsx) assume the south pole. The sign of the projection and the coverage (today `COVERAGE_MAX_LAT = -80`) have to be generalised.
- `/api/heightmap` accepts `pole=n`, and the polar map gains the north/south switch.
- `Site.group` gains the value `north`.
- The point search and the fine grids of the north are left out.

## Acceptance criteria

1. The catalogue has at least 35 sites, all with source and programme, and with year those that correspond to a mission.
2. Searching "CLPS" or "1972" filters the list correctly.
3. Shareable links with new sites work.
4. Every new site south of 80°S has its three precomputed horizons.
5. If the north pole is done: a point on the rim of Peary crater shows a horizon with real terrain, and all the south pole tests give the same results as before.

## Tests

- Automated: no repeated id, coordinates within range, all sites with source and programme, the search filter and criterion 4. The test in [sites.test.ts](../../tests/sites.test.ts) already covers part.
- In the browser: the search and the groups, in `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- By hand: criterion 5.

## Out of scope

- Impact sites and orbiter sites.
- Detailed fact sheets for each mission.
- Fine terrain and point search at the north pole.

## Risks

- **Possible cut:** the whole north pole, and then the extra sites. Neither is needed for the demo.
- **Coordinates without a reliable source.** That site does not go in.
- **Generalising the pole breaks the south.** Criterion 5 requires that the current tests do not change.
- **Whoever adds polar sites needs the fine grids** (345 MB) to precompute.

---

<a id="es"></a>
**Español** | [English](#en)

# S13: Catálogo ampliado y polo norte

## Problema

El catálogo tiene 18 sitios: 12 del polo sur con terreno real y 6 del resto de la Luna. La consigna menciona misiones Apollo, objetivos CLPS, misiones comerciales y programas de otros países; hay huecos evidentes. Además, el terreno real solo cubre el polo sur.

## Resultado

El catálogo y la búsqueda están hechos desde el 15 de noviembre. El polo norte, que la spec marca como opcional, queda sin hacer: el [plan](../PLAN.md#si-vamos-tarde) lo recorta antes que los sitios extra.

| Criterio | Resultado |
| --- | --- |
| 1. Al menos 35 sitios con fuente | 37: los 18 de antes y 19 alunizajes históricos (Apollo 12, 14, 15 y 16; Luna 9, 13, 16, 17, 20, 21 y 24; Surveyor 1, 3, 5, 6 y 7; Chang'e 3, 5 y 6) |
| 2. Buscar "CLPS" o "1972" | Filtra los cuatro sitios CLPS y los tres alunizajes de 1972. Las palabras se combinan e ignoran mayúsculas, acentos y apóstrofos |
| 3. Enlaces con sitios nuevos | Funcionan, comprobado en otra pestaña |
| 4. Horizontes precalculados de los sitios polares nuevos | No hay sitios polares nuevos. Una prueba automática exige los tres horizontes a todo sitio al sur de 80°S, para cuando los haya |
| 5. Polo norte | Sin hacer |

Comprobado con [sites.test.ts](../../tests/sites.test.ts) y en el navegador con [s13-catalogo.mjs](../../e2e/s13-catalogo.mjs) (11 comprobaciones).

**Fuente de los sitios nuevos.** Las coordenadas vienen del artículo «List of artificial objects on the Moon» de Wikipedia, que cita la fuente de cada misión, y así lo dice cada sitio. Es una fuente más débil que las de [S07](S07-validacion-y-coordenadas.md): conviene contrastarlas con las imágenes de LROC antes de citarlas ante el jurado. Ninguna cifra del guion depende de ellas.

**No se añadieron** las regiones de Artemis III que faltan ni misiones CLPS futuras: no se encontró un punto publicado para ellas, y la regla es que un sitio sin fuente no entra.

**Cómo se agrupa.** Se mantienen los grupos por región de la lista (polo sur, otras latitudes y tus puntos). Cada sitio gana `program` y `year`, que alimentan la búsqueda.

## Qué verá el usuario

- Unos 35 sitios, agrupados por región y programa.
- Un campo de búsqueda en la lista, por nombre, programa o año.
- Opcional: un conmutador norte/sur en el mapa polar y horizonte real al norte de 80°N.

## Diseño

### Catálogo

**Sitios que se añaden**, cada uno con su fuente según la regla de [S07](S07-validacion-y-coordenadas.md):

- Apollo 12, 14, 15 y 16.
- Luna 9, 16, 17 y 24; Surveyor 1 y 3.
- Chang'e 3, 5 y 6.
- Las regiones candidatas de Artemis III que falten de las nueve de octubre de 2024, como puntos representativos.
- Próximas misiones CLPS y comerciales con sitio anunciado.

**Cambios en [sites.ts](../../src/lib/sites.ts):**

- Campo nuevo `program`: `apollo`, `luna`, `surveyor`, `change`, `chandrayaan`, `clps`, `artemis`, `commercial` u `other`.
- Campo nuevo `year`: año del alunizaje, o el previsto. Se omite en los puntos que no corresponden a una misión.
- La búsqueda compara el texto con el nombre, la etiqueta, el programa y el año.

**Lista de sitios** (`SiteList` en [Panels.tsx](../../src/components/Panels.tsx)): campo de búsqueda arriba y grupos plegables por región.

**Sitios polares nuevos.** Cada sitio al sur de 80°S necesita sus horizontes precalculados, y sus parches si [S11](S11-vista-3d.md) está hecha. Hay que ejecutar `npm run precompute` en un equipo con las mallas finas y subir los archivos nuevos.

**Regla:** un sitio sin fuente fiable de coordenadas no entra en el catálogo.

### Polo norte (opcional)

Los productos equivalentes existen. Comprobado el 14 de noviembre de 2026 en el mismo servidor del que se descargan los del sur:

| Producto | Celda | Tamaño |
| --- | --- | --- |
| `ldem_75n_240m` | 240 m | 29 MB, igual que el del sur |
| `ldem_80n_80m` | 80 m | 116 MB |
| `ldem_85n_40m` | 40 m | 115 MB |
| `ldem_875n_20m` | 20 m | 115 MB |

- Solo se usa la malla de 240 m: `npm run fetch-data -- --north`.
- [dem.js](../../server/dem.js), [horizon.js](../../server/horizon.js) y el sombreador de [PolarMap.tsx](../../src/components/PolarMap.tsx) suponen el polo sur. Hay que generalizar el signo de la proyección y la cobertura (hoy `COVERAGE_MAX_LAT = -80`).
- `/api/heightmap` admite `pole=n`, y el mapa polar gana el conmutador norte/sur.
- `Site.group` gana el valor `north`.
- El buscador de puntos y las mallas finas del norte quedan fuera.

## Criterios de aceptación

1. El catálogo tiene al menos 35 sitios, todos con fuente y programa, y con año los que corresponden a una misión.
2. Buscar "CLPS" o "1972" filtra la lista correctamente.
3. Los enlaces compartibles con sitios nuevos funcionan.
4. Todo sitio nuevo al sur de 80°S tiene sus tres horizontes precalculados.
5. Si se hace el polo norte: un punto en el borde del cráter Peary muestra horizonte con terreno real, y todas las pruebas del polo sur dan los mismos resultados que antes.

## Pruebas

- Automáticas: ningún id repetido, coordenadas dentro de rango, todos los sitios con fuente y programa, el filtro de búsqueda y el criterio 4. La prueba de [sites.test.ts](../../tests/sites.test.ts) ya cubre parte.
- En el navegador: la búsqueda y los grupos, en `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- A mano: criterio 5.

## Fuera de alcance

- Sitios de impacto y de orbitadores.
- Fichas detalladas de cada misión.
- Terreno fino y buscador de puntos en el polo norte.

## Riesgos

- **Recorte posible:** todo el polo norte, y después los sitios extra. Ninguno es necesario para la demostración.
- **Coordenadas sin fuente fiable.** Ese sitio no entra.
- **Generalizar el polo rompe el sur.** El criterio 5 exige que las pruebas actuales no cambien.
- **Quien añada sitios polares necesita las mallas finas** (345 MB) para precalcular.

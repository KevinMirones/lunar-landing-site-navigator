---
id: S09
titulo: Ventanas de contacto reales
title: Real contact windows
estado: hecha
dia: 4
prioridad: imprescindible
depende: S01
resumen: Enlace con margen de elevación y con las estaciones de tierra que ven la Luna en cada momento.
summary: Link with an elevation margin and with the ground stations that see the Moon at each moment.
---

<a id="en"></a>
**English** | [Español](#es)

# S09: Real contact windows

## Problem

Today "link" means that half of Earth's disc clears the terrain. Two things a planner takes for granted are missing: a minimum elevation margin for the antenna, and a station on Earth looking at the Moon at that moment.

## What the user will see

- A collapsible "Communications" block in the site status, with two selectors:
  - **Elevation margin:** 0°, 2° or 5° above the terrain.
  - **Ground network:** none (geometry only, as today), NASA's Deep Space Network (Goldstone, Madrid and Canberra), or a single station of your own with its latitude and longitude.
- With the defaults (margin 0° and no network) everything stays exactly as today.
- With a network chosen:
  - A "Contact" row in the timeline, with each stretch marked by the station that covers it.
  - Daily contact hours and the longest contact outage in the mission balance.
  - A "Contact" column in the scenario table.
- On the Earth card, when the margin is not 0: "At +1.2° above the terrain; with a 2° margin there is no link."

## Result

Done on 15 November.

| Criterion | Result |
| --- | --- |
| 1. Margin 0 and no network | The series is identical to the earlier one, value by value |
| 2. More margin, less link | Checked at Malapert and Apollo 11 with 0°, 2° and 5° |
| 3. With 2°, the link goes exactly below 2° | Every discrepancy falls in the step of the crossing |
| 4. Deep Space Network at Malapert, 30 days | 100% of the time with link has contact, with a 5° margin. At Apollo 11, without margin, 98% |
| 4. A single station (Madrid) at Apollo 11 | 9.4 h a day; the longest outage, 18 h 48 min |
| 5. Elevation of the Moon against JPL Horizons | Under 0.1° at 33 instants of the three stations ([stations.json](../../tests/fixtures/stations.json), from [fetch-station-fixtures.mjs](../../scripts/fetch-station-fixtures.mjs)) |
| 6. Search with a 5° margin | The centre cell gives the same link as the scenario: 56% and 56% |
| 7. Shareable link | Reproduces margin and network in another tab |

Checked in the browser with [s09-contacto.mjs](../../e2e/s09-contacto.mjs) (14 checks).

**Finding.** At the summit of Malapert, a 5° margin lowers the link of the 30-day mission from 100% to 51% on 40 m terrain, and to 56% on the 240 m one. Earth spends a good part of the month less than 5° above the relief.

Differences from the design:

- **Speed.** The Moon is placed once per instant in an Earth-fixed frame, and each station is simple geometry after that. Precession and nutation are computed once per grid. First computation with the three stations: 130 to 170 ms per scenario on the second laptop, against 430 ms with a full ephemeris per station and instant. The difference from the full computation is under 0.01°.
- **Contact hours in the balance.** They are in the mission balance and, in more detail, in the "Communications" block.
- **The Earth card** says when the link is lost because of the margin: "At 2.2° above the terrain: with a 5° margin there is no link".

## Design

New `src/lib/comms.ts`. It imports with the `.ts` extension, because the server loads these modules.

**Configuration**, one for the whole comparison:

```ts
interface CommsConfig {
  marginDeg: 0 | 2 | 5;
  network: 'none' | 'dsn' | 'single';
  station?: { lat: number; lon: number };   // 'single' only
}
```

**Elevation margin.** It is applied where the series is born, so that every figure respects it without touching the rest of the code:

- `siteSeries` in [series.ts](../../src/lib/series.ts) receives the margin and computes `earthFrac` against the terrain horizon raised by those degrees. So "link" becomes half of Earth's disc clearing the terrain plus the margin.
- With margin 0 the computation is identical to the current one.
- The metrics, the index, the strips, the calendar and the best dates use it with no further change.
- `analysisKey` in [scenario.ts](../../src/lib/scenario.ts) includes the margin, so as not to reuse an analysis made with another.
- The point search receives it as a new parameter, `margin`, in `/api/search`, and passes it to `siteSeries` in [searchWorker.js](../../server/searchWorker.js). It goes into its cache key.
- `skyAt` does not change: the Earth card keeps showing the real geometry, and decides whether there is a link by comparing the height above the terrain with the margin.

**Stations.** A station sees the Moon when it is more than 10° of elevation above its horizon (constant `STATION_MASK_DEG`).

| Station | Latitude | Longitude |
| --- | --- | --- |
| Goldstone | 35.43°N | 116.89°W |
| Madrid (Robledo) | 40.43°N | 4.25°W |
| Canberra (Tidbinbilla) | 35.40°S | 148.98°E |

- The elevation of the Moon from each station is computed with `Equator` and `Horizon` of `astronomy-engine`.
- It depends only on time, not on the lunar site: it is computed once per time grid and cached, like the ephemeris of `frameSeries`.

**Contact:** there is a link from the site (with the margin) and at least one station sees the Moon. When several see it, the stretch is assigned to the one that has it highest.

```ts
interface CommsResult {
  contactIntervals: Interval[];
  byStation: Array<{ name: string; intervals: Interval[] }>;
  contactShare: number;        // part of the mission with contact
  contactHoursPerDay: number;
  longestGapMs: number;
}
function analyzeComms(series: SiteSeries, metrics: Metrics, config: CommsConfig): CommsResult | null   // null with network 'none'
```

**What does not change with the network.** The viability index, the point search and the best dates keep using the geometric link with margin. The visibility of the stations depends on the time and not on the lunar site, so it barely changes which site or which date is better, and keeping it out avoids recomputing those features.

**What each network teaches.** With the three stations, about 120° apart in longitude, coverage is nearly continuous and the interesting part is the handovers. With a single station the contact drops to between 6 and 13 hours a day: that is the case of many commercial missions.

**Interface:**

- New `src/components/Comms.tsx` with the block, inside a `Collapse` and marked as expert content for [S12](S12-modo-educativo.md).
- [Timeline.tsx](../../src/components/Timeline.tsx): "Contact" row below "Link", only when there is a network, with the station's initial on each stretch.
- `Compare` and the mission balance in [Panels.tsx](../../src/components/Panels.tsx): daily contact, only when there is a network.

**Shareable link.** [urlState.ts](../../src/lib/urlState.ts) gains the `c` parameter, with the margin and the network:

```
c=5~dsn
c=2~35.43,-116.89
```

If it is missing, `0~none` applies. An old link opens as before.

## Acceptance criteria

1. With margin 0 and no network, every figure in the app matches those from before this spec.
2. Raising the margin never increases the link time.
3. With a 2° margin the link disappears exactly at the instants when Earth is less than 2° above the terrain (maximum difference of one step of the series).
4. With the three stations, on a 30-day mission at Malapert, the contact is at least 90% of the time with link. The measured value is written here.
5. With a single station at mid latitude, the daily contact is between 5 and 14 hours when there is link all day.
6. The elevation of the Moon from Madrid matches JPL Horizons at three instants, with an error under 0.1°.
7. The point search with a 5° margin gives in its centre cell the same figures as the active scenario with that margin.
8. The copied link reproduces the margin and the network in another browser.

## Tests

- Automated: criteria 1 to 3, 5 and 6 (the last with reference values stored in `tests/fixtures`, like those of [ephemeris.test.ts](../../tests/ephemeris.test.ts)), the `margin` parameter of the search and the round trip of the `c` parameter.
- In the browser: criteria 4, 7 and 8, with a new flow in `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).

## Out of scope

- Link budget in decibels and data rates.
- Relay satellites.
- Real availability and scheduling of the stations.
- Other predefined networks.
- The station network influencing the index, the point search or the best dates.

## Risks

- **Possible cut:** if time is short, the elevation margin stays and the stations part is postponed.
- **The margin touches the function all the figures come from.** Criterion 1 is the safety net: with margin 0 nothing can change.
- **Computation cost:** three stations per instant. It is computed once per time grid.

---

<a id="es"></a>
**Español** | [English](#en)

# S09: Ventanas de contacto reales

## Problema

Hoy "enlace" significa que medio disco de la Tierra supera el terreno. Faltan dos cosas que un planificador da por supuestas: un margen mínimo de elevación para la antena, y que haya una estación en la Tierra mirando a la Luna en ese momento.

## Qué verá el usuario

- Un bloque plegable "Comunicaciones" en el estado del sitio, con dos selectores:
  - **Margen de elevación:** 0°, 2° o 5° sobre el terreno.
  - **Red de tierra:** ninguna (solo geometría, como hoy), la Red del Espacio Profundo de NASA (Goldstone, Madrid y Canberra), o una sola estación propia con su latitud y longitud.
- Con los valores por defecto (margen 0° y ninguna red) todo queda exactamente como hoy.
- Con una red elegida:
  - Una fila "Contacto" en la línea de tiempo, con cada tramo marcado por la estación que lo cubre.
  - Horas de contacto diarias y corte de contacto más largo en el balance de la misión.
  - Una columna "Contacto" en la tabla de escenarios.
- En la tarjeta de la Tierra, cuando el margen no es 0: "A +1.2° sobre el terreno; con margen de 2° no hay enlace."

## Resultado

Hecha el 15 de noviembre.

| Criterio | Resultado |
| --- | --- |
| 1. Margen 0 y sin red | La serie es idéntica a la de antes, valor por valor |
| 2. Más margen, menos enlace | Comprobado en Malapert y Apollo 11 con 0°, 2° y 5° |
| 3. Con 2°, el enlace se va justo bajo 2° | Toda discrepancia cae en el paso del cruce |
| 4. Red del Espacio Profundo en Malapert, 30 días | El 100% del tiempo con enlace tiene contacto, con margen de 5°. En Apollo 11, sin margen, el 98% |
| 4. Una sola estación (Madrid) en Apollo 11 | 9.4 h al día; el corte más largo, 18 h 48 min |
| 5. Elevación de la Luna frente a JPL Horizons | Menos de 0.1° en 33 instantes de las tres estaciones ([stations.json](../../tests/fixtures/stations.json), de [fetch-station-fixtures.mjs](../../scripts/fetch-station-fixtures.mjs)) |
| 6. Buscador con margen de 5° | La celda central da el mismo enlace que el escenario: 56% y 56% |
| 7. Enlace compartible | Reproduce margen y red en otra pestaña |

Comprobado en el navegador con [s09-contacto.mjs](../../e2e/s09-contacto.mjs) (14 comprobaciones).

**Hallazgo.** En la cima de Malapert, un margen de 5° baja el enlace de la misión de 30 días del 100% al 51% con terreno de 40 m, y al 56% con el de 240 m. La Tierra pasa buena parte del mes a menos de 5° sobre el relieve.

Diferencias con el diseño:

- **Velocidad.** La Luna se sitúa una vez por instante en un sistema fijo a la Tierra, y cada estación es después geometría sencilla. La precesión y la nutación se calculan una vez por rejilla. Primer cálculo con las tres estaciones: 130 a 170 ms por escenario en el segundo portátil, frente a 430 ms con una efeméride completa por estación e instante. La diferencia con el cálculo completo es menor de 0.01°.
- **Horas de contacto en el balance.** Están en el balance de la misión y, con más detalle, en el bloque "Comunicaciones".
- **La tarjeta de la Tierra** dice cuándo el enlace se pierde por el margen: "A 2.2° sobre el terreno: con margen de 5° no hay enlace".

## Diseño

Nuevo `src/lib/comms.ts`. Importa con la extensión `.ts`, porque el servidor carga estos módulos.

**Configuración**, una para toda la comparación:

```ts
interface CommsConfig {
  marginDeg: 0 | 2 | 5;
  network: 'none' | 'dsn' | 'single';
  station?: { lat: number; lon: number };   // solo 'single'
}
```

**Margen de elevación.** Se aplica donde nace la serie, para que lo respeten todas las cifras sin tocar el resto del código:

- `siteSeries` en [series.ts](../../src/lib/series.ts) recibe el margen y calcula `earthFrac` contra el horizonte del terreno subido esos grados. Así "enlace" pasa a ser que medio disco de la Tierra supere el terreno más el margen.
- Con margen 0 el cálculo es idéntico al actual.
- Lo usan sin más cambios las métricas, el índice, las franjas, el calendario y las mejores fechas.
- `analysisKey` en [scenario.ts](../../src/lib/scenario.ts) incluye el margen, para no reutilizar un análisis hecho con otro.
- El buscador de puntos lo recibe como parámetro nuevo, `margin`, en `/api/search`, y lo pasa a `siteSeries` en [searchWorker.js](../../server/searchWorker.js). Entra en la clave de su caché.
- `skyAt` no cambia: la tarjeta de la Tierra sigue mostrando la geometría real, y decide si hay enlace comparando la altura sobre el terreno con el margen.

**Estaciones.** Una estación ve la Luna cuando esta supera 10° de elevación sobre su horizonte (constante `STATION_MASK_DEG`).

| Estación | Latitud | Longitud |
| --- | --- | --- |
| Goldstone | 35.43°N | 116.89°O |
| Madrid (Robledo) | 40.43°N | 4.25°O |
| Canberra (Tidbinbilla) | 35.40°S | 148.98°E |

- La elevación de la Luna desde cada estación se calcula con `Equator` y `Horizon` de `astronomy-engine`.
- Depende solo del tiempo, no del sitio lunar: se calcula una vez por rejilla de tiempo y se guarda en caché, igual que las efemérides de `frameSeries`.

**Contacto:** hay enlace desde el sitio (con el margen) y al menos una estación ve la Luna. Cuando la ven varias, el tramo se asigna a la que la tiene más alta.

```ts
interface CommsResult {
  contactIntervals: Interval[];
  byStation: Array<{ name: string; intervals: Interval[] }>;
  contactShare: number;        // parte de la misión con contacto
  contactHoursPerDay: number;
  longestGapMs: number;
}
function analyzeComms(series: SiteSeries, metrics: Metrics, config: CommsConfig): CommsResult | null   // null con network 'none'
```

**Qué no cambia con la red.** El índice de viabilidad, el buscador de puntos y las mejores fechas siguen usando el enlace geométrico con margen. La visibilidad de las estaciones depende de la hora y no del sitio lunar, así que apenas cambia qué sitio o qué fecha es mejor, y mantenerla fuera evita recalcular esas funciones.

**Lo que enseña cada red.** Con las tres estaciones, separadas unos 120° en longitud, la cobertura es casi continua y lo interesante son los relevos. Con una sola estación el contacto cae a entre 6 y 13 horas al día: es el caso de muchas misiones comerciales.

**Interfaz:**

- Nuevo `src/components/Comms.tsx` con el bloque, dentro de un `Collapse` y marcado como contenido experto para [S12](S12-modo-educativo.md).
- [Timeline.tsx](../../src/components/Timeline.tsx): fila "Contacto" debajo de "Enlace", solo cuando hay red, con la inicial de la estación en cada tramo.
- `Compare` y el balance de la misión en [Panels.tsx](../../src/components/Panels.tsx): contacto diario, solo cuando hay red.

**Enlace compartible.** [urlState.ts](../../src/lib/urlState.ts) gana el parámetro `c`, con el margen y la red:

```
c=5~dsn
c=2~35.43,-116.89
```

Si falta vale `0~none`. Un enlace antiguo abre igual que antes.

## Criterios de aceptación

1. Con margen 0 y ninguna red, todas las cifras de la app coinciden con las de antes de esta spec.
2. Subir el margen nunca aumenta el tiempo de enlace.
3. Con margen de 2° el enlace desaparece exactamente en los instantes en que la Tierra está a menos de 2° sobre el terreno (diferencia máxima de un paso de la serie).
4. Con las tres estaciones, en una misión de 30 días en Malapert, el contacto es al menos el 90% del tiempo con enlace. El valor medido se anota aquí.
5. Con una sola estación en latitud media, el contacto diario está entre 5 y 14 horas cuando hay enlace todo el día.
6. La elevación de la Luna desde Madrid coincide con JPL Horizons en tres instantes, con error menor de 0.1°.
7. El buscador de puntos con margen de 5° da en su celda central las mismas cifras que el escenario activo con ese margen.
8. El enlace copiado reproduce el margen y la red en otro navegador.

## Pruebas

- Automáticas: criterios 1 a 3, 5 y 6 (este último con valores de referencia guardados en `tests/fixtures`, como los de [ephemeris.test.ts](../../tests/ephemeris.test.ts)), el parámetro `margin` del buscador y la ida y vuelta del parámetro `c`.
- En el navegador: criterios 4, 7 y 8, con un flujo nuevo en `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).

## Fuera de alcance

- Balance de enlace en decibelios y tasas de datos.
- Satélites repetidores.
- Disponibilidad real y agenda de las estaciones.
- Otras redes predefinidas.
- Que la red de estaciones influya en el índice, el buscador de puntos o las mejores fechas.

## Riesgos

- **Recorte posible:** si falta tiempo se deja el margen de elevación y se aplaza la parte de estaciones.
- **El margen toca la función de la que salen todas las cifras.** El criterio 1 es la red de seguridad: con margen 0 nada puede cambiar.
- **Coste de cálculo:** tres estaciones por instante. Se calcula una vez por rejilla de tiempo.

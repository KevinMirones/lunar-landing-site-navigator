---
id: S08
titulo: Modelo de energía y batería
title: Power and battery model
estado: hecha
dia: 4
prioridad: imprescindible
depende: S01
resumen: Potencia, energía diaria y batería necesaria para sobrevivir la noche más larga.
summary: Power, daily energy and the battery needed to survive the longest night.
---

<a id="en"></a>
**English** | [Español](#es)

# S08: Power and battery model

## Problem

The tool says what share of the time there is sunlight, but an engineer needs watts, watt-hours and to know whether the lander is still alive at the next sunrise. The challenge brief asks to assess the "power generation potential". Today the site status only shows the irradiance at the instant.

## What the user will see

- A collapsible "Power" block in the site status, with six inputs that already carry example values:

  | Input | Example value |
  | --- | --- |
  | Panel type | Two-axis tracker. Also: fixed horizontal, or fixed tilted with its tilt and orientation |
  | Panel area | 2 m² |
  | Efficiency | 28% |
  | Consumption when operating | 200 W |
  | Consumption when hibernating | 25 W |
  | Battery | 3000 Wh |

  These are values for a small generic lander, not those of a particular mission, and the block says so.
- Results for the active scenario: power at the selected instant, average energy per day, minimum battery needed and a verdict:
  - "Survives the longest night, with a 40% margin."
  - "Does not survive: the battery runs out on day 9, 31 hours before the Sun returns."
- In the scenario table, a "Battery" column with the minimum battery of each scenario and the mark of whether it survives. The same equipment is compared across all sites and dates.
- A "Power" row in the timeline.
- If Earth covers the Sun during the mission, a mark on the timeline and a notice: "On 3 March Earth covers the Sun for 71 minutes."
- The assumptions, next to the result: no dust, no degradation, no temperature effect, battery charged at landing.

## Result

Done on 15 November. Measured with a smooth Moon, without terrain:

| Criterion | Result |
| --- | --- |
| 1. Tracker in full Sun | Equal to the formula with the distance correction, to a tenth of a watt. Over 2027 the maximum stays between 95% and 105% of the uncorrected figure |
| 2. Horizontal against tracker at Connecting Ridge | Always below 5%. With real terrain, in the app: 20 W against 780 W |
| 3. Tilted with tilt 0 | Identical to horizontal |
| 4. Minimum battery at Apollo 11 (30 days from 14 November 2026) | 8 492 Wh, against 25 W × 338 h = 8 440 Wh: 0.6% more, because of the operating consumption at sunrise, with little Sun yet |
| 5. Eclipse of 3 March 2026 | Maximum 4 minutes before that of `SearchLunarEclipse`. Sun fully covered for 134 min at Apollo 11 and 69 min at Malapert, against the 136 and 71 computed on 14 November with a fine step |
| 6 to 8 | Checked in the browser ([s08-energia.mjs](../../e2e/s08-energia.mjs), 15 checks) and, for 8, also in the automated tests |

Differences from the design:

- **Eclipse contacts.** They are computed from the angular separation between the centres, which varies smoothly. The coverage jumps to 1 and, with samples every 30 minutes, it clipped the total phase by up to one sample at each end: the first version gave 91 minutes at Apollo 11 instead of 134.
- **Only the eclipses that matter are reported:** with the Sun above the terrain and at least 1% of its disc covered.
- **Default tilted panel:** vertical and facing north, because at the pole the Sun is always low.
- **Accessible names of the fields** with the unit: "Battery (Wh)".

## Design

New `src/lib/power.ts`, with no dependencies on the interface. It imports `series.ts` and `ephemeris.ts` with the extension, as [scenario.ts](../../src/lib/scenario.ts) does.

**Configuration.** One for the whole comparison, not one per scenario: what is compared are sites and dates with the same equipment.

```ts
interface PowerConfig {
  panel: 'tracker' | 'horizontal' | 'tilted';
  tiltDeg: number;      // 'tilted' only: 0 = horizontal, 90 = vertical
  azimuthDeg: number;   // 'tilted' only: where the panel faces
  areaM2: number;
  efficiency: number;   // 0..1
  loadW: number;
  hibernateW: number;
  batteryWh: number;
}
```

**Power** at each instant of the scenario's series:

```
P = S × visible × efficiency × area × cos θ
```

- `S` is the irradiance: 1361 W/m² times the square of (1 AU / distance to the Sun). The distance comes from the Sun vector that `FrameSeries` already stores.
- `visible` is `sunFrac` (the part of the solar disc that clears the terrain) multiplied by the part that Earth does not cover (see eclipses).
- `cos θ` depending on the panel:
  - Two-axis tracker: 1.
  - Horizontal: the sine of the Sun's elevation, or 0 if it is below.
  - Tilted: `sin(el)·cos(tilt) + cos(el)·sin(tilt)·cos(az − azPanel)`, or 0 if it comes out negative.

**Battery.** The mission is stepped through with the step of the series:

- Consumption: operating when there is Sun (the same threshold as sunlight, `SUN_THRESHOLD`) and hibernating when there is not.
- Balance of each step: `(P − consumption) × step duration`.
- **Minimum battery**: the largest accumulated deficit, assuming the battery arrives full at landing. It does not depend on the battery the user enters.
- **Verdict**: it survives if the battery entered is greater than or equal to the minimum. The margin is `battery / minimum − 1`. If it does not survive, the mission day on which it runs out is given, and how long is left until the next sunlight window.

**Eclipses.** Seen from the Moon, Earth can cover the Sun for hours; from Earth it is seen as a lunar eclipse.

- For each instant the angular separation between the Sun and Earth as seen from the site is computed, with the same topocentric vectors that `skyAt` uses, and from it the part of the solar disc that Earth's disc covers (intersection area of two circles).
- It is a per-site calculation: in a partial eclipse some sites are covered and others are not.
- Approximation: the terrain and Earth are treated as independent (`sunFrac × (1 − covered)`). It is exact when one of the two is 0 or 1, which is nearly always.
- It does not change `sunFrac` or the sunlight metrics, the index or the search. They are a few hours a year and those figures are validated against publications that do not discount them either.

**Result:**

```ts
interface PowerResult {
  powerW: Float32Array;          // one sample per instant of the series
  eclipses: Interval[];          // stretches with more than 1% of the Sun covered by Earth
  peakW: number;
  meanDailyWh: number;
  minBatteryWh: number;
  survives: boolean;
  margin: number;                // battery / minimum − 1
  depletedAt: number | null;     // instant at which it runs out, if it does not survive
}
function analyzePower(series: SiteSeries, frames: FrameSeries, site: { lat: number; lon: number }, horizon: Horizon, config: PowerConfig): PowerResult
```

**Interface:**

- New `src/components/Power.tsx` with the block. It goes inside a `Collapse`, like the other panels, and is marked as expert content for the simple view of [S12](S12-modo-educativo.md).
- [Timeline.tsx](../../src/components/Timeline.tsx): third row, with the power as colour intensity and the eclipses marked.
- `Compare` in [Panels.tsx](../../src/components/Panels.tsx): "Battery" column, with the best value highlighted as in the others.
- The result is computed in [App.tsx](../../src/App.tsx) with `useMemo`, per scenario, from the series already computed and from `frameSeries(gridFor(scenario))`, which is cached.

**Shareable link.** [urlState.ts](../../src/lib/urlState.ts) gains the `p` parameter:

```
p=tracker~2~28~200~25~3000
p=tilted:35:180~2~28~200~25~3000
```

Panel, area, efficiency in percent, operating consumption, hibernating consumption and battery. If it is missing, the example values apply; if it is not understood, likewise, and the existing incomplete-link warning appears.

**Presenting figures:** two significant figures, with the assumptions alongside.

## Acceptance criteria

1. A tracker in full Sun gives `1361 × efficiency × area` corrected for distance, and over a year that value does not depart by more than 5% from the uncorrected figure.
2. At Connecting Ridge, a horizontal panel generates less than 5% of what a tracker does at the same instant.
3. A tilted panel with tilt 0 gives the same as the horizontal one.
4. At Apollo 11, the minimum battery equals the hibernating consumption multiplied by the hours of the night, with an error under 2%.
5. On 3 March 2026, at Apollo 11, Earth comes to cover 100% of the Sun, and the maximum falls within 30 minutes of the one given by `SearchLunarEclipse` of `astronomy-engine`. The stretch appears marked on the timeline.
6. Changing the panel type or the battery updates the verdict and the table column without reloading.
7. The copied link reproduces the same configuration and the same verdict in another browser.
8. With any configuration, the sunlight, link and index figures are the same as before this spec.

## Tests

- Automated: criteria 1 to 5 and 8, and the round trip of the `p` parameter.
- In the browser: criteria 6 and 7, with a new flow in `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).

## Out of scope

- Thermal model and heaters.
- Panel degradation, dust and the lander's own shadow.
- Radioisotope generators.
- Discounting eclipses from the sunlight metrics.
- A different power configuration per scenario.

## Risks

- **The model growing without end.** It is limited to the six inputs above.
- **False precision.** Two significant figures and the assumptions in view.
- **The example values being taken for those of a real mission.** The block says they are generic.

---

<a id="es"></a>
**Español** | [English](#en)

# S08: Modelo de energía y batería

## Problema

La herramienta dice qué porcentaje del tiempo hay luz, pero un ingeniero necesita vatios, vatios hora y saber si el módulo llega vivo al siguiente amanecer. La consigna pide evaluar el "potencial de generación de energía". Hoy el estado del sitio solo muestra la irradiancia del instante.

## Qué verá el usuario

- Un bloque plegable "Energía" en el estado del sitio, con seis datos de entrada que ya traen valores de ejemplo:

  | Dato | Valor de ejemplo |
  | --- | --- |
  | Tipo de panel | Seguidor de dos ejes. También: fijo horizontal, o fijo inclinado con su inclinación y orientación |
  | Área del panel | 2 m² |
  | Eficiencia | 28% |
  | Consumo en operación | 200 W |
  | Consumo en hibernación | 25 W |
  | Batería | 3000 Wh |

  Son valores de un módulo pequeño genérico, no los de una misión concreta, y el bloque lo dice.
- Resultados del escenario activo: potencia en el instante seleccionado, energía media por día, batería mínima necesaria y un veredicto:
  - "Sobrevive la noche más larga, con un 40% de margen."
  - "No sobrevive: la batería se agota el día 9, 31 horas antes de que vuelva el Sol."
- En la tabla de escenarios, una columna "Batería" con la batería mínima de cada escenario y la marca de si sobrevive. El mismo equipo se compara en todos los sitios y fechas.
- Una fila "Potencia" en la línea de tiempo.
- Si la Tierra tapa el Sol durante la misión, una marca en la línea de tiempo y un aviso: "El 3 de marzo la Tierra tapa el Sol durante 71 minutos."
- Los supuestos, junto al resultado: sin polvo, sin degradación, sin efecto de la temperatura, batería cargada al alunizar.

## Resultado

Hecha el 15 de noviembre. Medido con una Luna lisa, sin terreno:

| Criterio | Resultado |
| --- | --- |
| 1. Seguidor a pleno Sol | Igual a la fórmula con la distancia corregida, al décimo de vatio. A lo largo de 2027 el máximo queda entre el 95% y el 105% de la cifra sin corregir |
| 2. Horizontal frente a seguidor en Connecting Ridge | Siempre por debajo del 5%. Con terreno real, en la app: 20 W frente a 780 W |
| 3. Inclinado con inclinación 0 | Idéntico al horizontal |
| 4. Batería mínima en Apollo 11 (30 días desde el 14 de noviembre de 2026) | 8 492 Wh, frente a 25 W × 338 h = 8 440 Wh: un 0.6% más, por el consumo de operación al amanecer, con poco Sol todavía |
| 5. Eclipse del 3 de marzo de 2026 | Máximo 4 minutos antes que el de `SearchLunarEclipse`. Sol tapado por completo 134 min en Apollo 11 y 69 min en Malapert, frente a los 136 y 71 calculados el 14 de noviembre con paso fino |
| 6 a 8 | Comprobados en el navegador ([s08-energia.mjs](../../e2e/s08-energia.mjs), 15 comprobaciones) y, el 8, también en las pruebas automáticas |

Diferencias con el diseño:

- **Contactos del eclipse.** Se calculan con la separación angular entre los centros, que varía de forma suave. La cobertura salta a 1 y, con muestras cada 30 minutos, recortaba la fase total hasta una muestra por cada extremo: la primera versión daba 91 minutos en Apollo 11 en lugar de 134.
- **Solo se avisa de los eclipses que importan:** con el Sol sobre el terreno y al menos un 1% de su disco tapado.
- **Panel inclinado por defecto:** vertical y mirando al norte, porque en el polo el Sol está siempre bajo.
- **Nombres accesibles de los campos** con la unidad: «Batería (Wh)».

## Diseño

Nuevo `src/lib/power.ts`, sin dependencias de la interfaz. Importa `series.ts` y `ephemeris.ts` con la extensión, como hace [scenario.ts](../../src/lib/scenario.ts).

**Configuración.** Una sola para toda la comparación, no una por escenario: lo que se compara son sitios y fechas con el mismo equipo.

```ts
interface PowerConfig {
  panel: 'tracker' | 'horizontal' | 'tilted';
  tiltDeg: number;      // solo 'tilted': 0 = horizontal, 90 = vertical
  azimuthDeg: number;   // solo 'tilted': hacia dónde mira el panel
  areaM2: number;
  efficiency: number;   // 0..1
  loadW: number;
  hibernateW: number;
  batteryWh: number;
}
```

**Potencia** en cada instante de la serie del escenario:

```
P = S × visible × eficiencia × área × cos θ
```

- `S` es la irradiancia: 1361 W/m² por el cuadrado de (1 UA / distancia al Sol). La distancia sale del vector del Sol que ya guarda `FrameSeries`.
- `visible` es `sunFrac` (la parte del disco solar que supera el terreno) multiplicada por la parte que no tapa la Tierra (ver eclipses).
- `cos θ` según el panel:
  - Seguidor de dos ejes: 1.
  - Horizontal: el seno de la elevación del Sol, o 0 si está por debajo.
  - Inclinado: `sin(el)·cos(incl) + cos(el)·sin(incl)·cos(az − azPanel)`, o 0 si sale negativo.

**Batería.** Se recorre la misión con el paso de la serie:

- Consumo: el de operación cuando hay Sol (el mismo umbral que la luz solar, `SUN_THRESHOLD`) y el de hibernación cuando no.
- Balance de cada paso: `(P − consumo) × duración del paso`.
- **Batería mínima**: el mayor déficit acumulado, suponiendo que la batería llega llena al alunizaje. No depende de la batería que introduzca el usuario.
- **Veredicto**: sobrevive si la batería introducida es mayor o igual que la mínima. El margen es `batería / mínima − 1`. Si no sobrevive, se indica el día de misión en que se agota y cuánto falta para la siguiente ventana de luz.

**Eclipses.** Vista desde la Luna, la Tierra puede tapar el Sol durante horas; en la Tierra se ve como un eclipse lunar.

- Para cada instante se calcula la separación angular entre el Sol y la Tierra vistos desde el sitio, con los mismos vectores topocéntricos que usa `skyAt`, y con ella la parte del disco solar que cubre el disco terrestre (área de intersección de dos círculos).
- Es un cálculo por sitio: en un eclipse parcial unos sitios quedan cubiertos y otros no.
- Aproximación: el terreno y la Tierra se tratan como independientes (`sunFrac × (1 − cubierto)`). Es exacto cuando uno de los dos vale 0 o 1, que es casi siempre.
- No cambia `sunFrac` ni las métricas de luz, el índice ni el buscador. Son unas pocas horas al año y esas cifras están validadas con publicaciones que tampoco los descuentan.

**Resultado:**

```ts
interface PowerResult {
  powerW: Float32Array;          // una muestra por instante de la serie
  eclipses: Interval[];          // tramos con más del 1% del Sol cubierto por la Tierra
  peakW: number;
  meanDailyWh: number;
  minBatteryWh: number;
  survives: boolean;
  margin: number;                // batería / mínima − 1
  depletedAt: number | null;     // instante en que se agota, si no sobrevive
}
function analyzePower(series: SiteSeries, frames: FrameSeries, site: { lat: number; lon: number }, horizon: Horizon, config: PowerConfig): PowerResult
```

**Interfaz:**

- Nuevo `src/components/Power.tsx` con el bloque. Va dentro de un `Collapse`, como los demás paneles, y marcado como contenido experto para la vista sencilla de [S12](S12-modo-educativo.md).
- [Timeline.tsx](../../src/components/Timeline.tsx): tercera fila, con la potencia como intensidad de color y los eclipses marcados.
- `Compare` en [Panels.tsx](../../src/components/Panels.tsx): columna "Batería", con el mejor valor resaltado como en las demás.
- El resultado se calcula en [App.tsx](../../src/App.tsx) con `useMemo`, por escenario, a partir de la serie ya calculada y de `frameSeries(gridFor(escenario))`, que está en caché.

**Enlace compartible.** [urlState.ts](../../src/lib/urlState.ts) gana el parámetro `p`:

```
p=tracker~2~28~200~25~3000
p=tilted:35:180~2~28~200~25~3000
```

Panel, área, eficiencia en porcentaje, consumo en operación, consumo en hibernación y batería. Si falta, valen los valores de ejemplo; si no se entiende, también, y sale el aviso de enlace incompleto que ya existe.

**Presentación de cifras:** dos cifras significativas, con los supuestos al lado.

## Criterios de aceptación

1. Un seguidor a pleno Sol da `1361 × eficiencia × área` corregido por la distancia, y a lo largo de un año ese valor no se aparta más de un 5% de la cifra sin corregir.
2. En Connecting Ridge, un panel horizontal genera menos del 5% que un seguidor en el mismo instante.
3. Un panel inclinado con inclinación 0 da lo mismo que el horizontal.
4. En Apollo 11, la batería mínima es igual al consumo en hibernación multiplicado por las horas de la noche, con un error menor del 2%.
5. El 3 de marzo de 2026, en Apollo 11, la Tierra llega a cubrir el 100% del Sol, y el máximo cae a menos de 30 minutos del que da `SearchLunarEclipse` de `astronomy-engine`. El tramo aparece marcado en la línea de tiempo.
6. Cambiar el tipo de panel o la batería actualiza el veredicto y la columna de la tabla sin recargar.
7. El enlace copiado reproduce la misma configuración y el mismo veredicto en otro navegador.
8. Con cualquier configuración, las cifras de luz, enlace e índice son las mismas que antes de esta spec.

## Pruebas

- Automáticas: criterios 1 a 5 y 8, y la ida y vuelta del parámetro `p`.
- En el navegador: criterios 6 y 7, con un flujo nuevo en `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).

## Fuera de alcance

- Modelo térmico y calentadores.
- Degradación del panel, polvo y sombra del propio módulo.
- Generadores de radioisótopos.
- Descontar los eclipses de las métricas de luz.
- Una configuración de energía distinta por escenario.

## Riesgos

- **Que el modelo crezca sin fin.** Se limita a los seis datos de entrada de arriba.
- **Falsa precisión.** Dos cifras significativas y los supuestos a la vista.
- **Los valores de ejemplo se toman por los de una misión real.** El bloque dice que son genéricos.

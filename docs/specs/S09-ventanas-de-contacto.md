---
id: S09
titulo: Ventanas de contacto reales
estado: pendiente
dia: 4
prioridad: imprescindible
depende: S01
resumen: Enlace con margen de elevación y con las estaciones de tierra que ven la Luna en cada momento.
---

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

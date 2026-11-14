# LUMINA

**Lunar Mission Illumination & Network Analyzer.** Compara sitios y fechas de alunizaje en segundos: dónde están el Sol y la Tierra respecto al horizonte real del terreno, cuánta energía solar habrá y cuándo hay enlace directo con la Tierra.

Proyecto para el reto de NASA Space Apps sobre planificación de misiones al polo sur lunar.

## Qué hace

| Necesidad del reto | Cómo la resuelve LUMINA |
| --- | --- |
| Posición del Sol y la Tierra respecto al horizonte | Panorama de 360° con la silueta real del terreno y primeros planos a escala del disco solar y terrestre |
| Tiempo hasta la puesta de Sol o de la Tierra | Cuenta regresiva en vivo: "se oculta en 3 d 4 h", "enlace vuelve en 13 h" |
| Energía y comunicaciones | Porcentaje de luz, noche más larga, porcentaje de enlace, cortes, irradiancia e índice de viabilidad |
| Comparar sitios | Tabla lado a lado con las ventanas de luz y enlace alineadas en el tiempo |
| Comparar fechas | Calendario de 12 meses, día a día; un clic mueve el alunizaje |
| Sitios notables y coordenadas propias | 18 sitios (Artemis, CLPS, Apollo, ISRO, JAXA, CNSA) más coordenadas manuales o clic en el mapa |
| Mapas 2D y 3D | Mapa polar con sombras calculadas en vivo en la GPU y globo 3D iluminado por el Sol real |
| Dinámica temporal | Reproducción animada de toda la misión |
| Público general | Explicaciones en lenguaje llano generadas a partir de los datos, en español e inglés |

## Cómo funciona

1. **Efemérides.** El navegador calcula la posición del Sol y la Tierra y la orientación de la Luna (modelo de rotación IAU, que incluye la libración) con `astronomy-engine`, y las expresa en el sistema fijo a la Luna. Cuesta unos 14 µs por instante.
2. **Terreno.** El servidor Node carga el modelo de elevación LOLA del polo sur (LDEM_75S_240M: 3812 × 3812 celdas de 240 m). Para cada sitio lanza 720 rayos, uno cada 0.5° de azimut, hasta 400 km, teniendo en cuenta la curvatura lunar, y devuelve el ángulo del horizonte en cada dirección. Tarda unos 30 ms.
3. **Visibilidad.** En la Luna no hay atmósfera, así que no hay refracción ni crepúsculo: se compara cada disco (Sol 0.53°, Tierra 1.9°) con la línea del terreno y se obtiene la fracción visible.
4. **Mapa de sombras.** Un shader WebGL2 hace el mismo cálculo para cada píxel del mapa polar, 150 pasos por rayo, en tiempo real.

## Validación

- **Efemérides contra NASA/JPL Horizons (DE441):** 300 comparaciones (5 sitios, 30 instantes entre nov 2026 y dic 2027, Sol y Tierra). Error máximo en el cielo: **0.0037°**, unas 140 veces menor que el disco solar. Se repite con `npm test`, y el botón "Comprobar con JPL Horizons" lo hace en vivo para cualquier sitio y fecha.
- **Terreno:** las pruebas comprueban la orientación del modelo con geografía conocida (fondos de Shackleton, Shoemaker y Cabeus; macizo Malapert) y el comportamiento físico del horizonte.

## Límites conocidos

- El terreno real cubre de 80°S a 90°S. En el resto de la Luna se usa una esfera lisa (se indica en pantalla).
- A 240 m por celda no se resuelven rocas ni relieve pequeño; el horizonte cercano es una aproximación de la pendiente local.
- "Enlace" significa que al menos medio disco terrestre supera el terreno. No se modelan estaciones de tierra ni antenas.
- El índice de viabilidad es orientativo (40% luz, 25% noches cortas, 35% enlace).
- Los puntos "candidato Artemis" son posiciones representativas dentro de cada región, no objetivos oficiales.

## Puesta en marcha

Requiere Node 20 o superior.

```bash
npm install
npm run fetch-data   # descarga el DEM LOLA (29 MB) y la textura lunar desde NASA
npm run dev          # API en :8787 y web en http://localhost:5173
```

Producción:

```bash
npm run build
npm start            # sirve API y web en http://localhost:8787
```

Pruebas: `npm test`.

## Estructura

```
server/          API Express
  dem.js         lectura del DEM LOLA y proyección estereográfica polar
  horizon.js     horizonte del terreno por trazado de rayos
  index.js       /api/horizon, /api/heightmap, /api/jpl
src/lib/
  ephemeris.ts   Sol y Tierra en el sistema fijo a la Luna
  series.ts      series temporales, ventanas, métricas
  sites.ts       catálogo de sitios
src/components/  Panorama, PolarMap (WebGL2), Globe (three.js), Timeline, Panels
tests/           validación contra JPL Horizons y pruebas del terreno
```

## Datos y créditos

- Topografía: Lunar Orbiter Laser Altimeter (LOLA), Lunar Reconnaissance Orbiter, NASA GSFC, vía PDS Geosciences Node.
- Imagen lunar: mosaico LROC WAC, NASA Scientific Visualization Studio (CGI Moon Kit).
- Referencia de efemérides: NASA/JPL Horizons System.
- Cálculo de efemérides: [astronomy-engine](https://github.com/cosinekitty/astronomy) (licencia MIT).

NASA no avala este proyecto. Es una herramienta de apoyo a la planificación y no sustituye un análisis de misión.

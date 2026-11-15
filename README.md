# LUMINA

**Lunar Mission Illumination & Network Analyzer.** Compara sitios y fechas de alunizaje en segundos: dónde están el Sol y la Tierra respecto al horizonte real del terreno, cuánta energía solar habrá y cuándo hay enlace directo con la Tierra.

Proyecto para el reto de NASA Space Apps sobre planificación de misiones al polo sur lunar.

## Qué hace

| Necesidad del reto | Cómo la resuelve LUMINA |
| --- | --- |
| Posición del Sol y la Tierra respecto al horizonte | Panorama de 360° con la silueta real del terreno y primeros planos a escala del disco solar y terrestre |
| Tiempo hasta la puesta de Sol o de la Tierra | Cuenta regresiva en vivo: "se oculta en 3 d 4 h", "enlace vuelve en 13 h" |
| Energía y comunicaciones | Porcentaje de luz, noche más larga, porcentaje de enlace, cortes, irradiancia e índice de viabilidad |
| Comparar sitios | Tabla de escenarios lado a lado, con las ventanas alineadas por día de misión, y enlace para compartirla |
| Por qué un cambio pequeño importa | Buscador que evalúa la zona alrededor de un punto y propone los cinco mejores lugares cercanos |
| Comparar fechas | Escenarios con el mismo sitio en fechas distintas, calendario de 12 meses y las cinco mejores fechas de alunizaje |
| Sitios notables y coordenadas propias | 18 sitios (Artemis, CLPS, Apollo, ISRO, JAXA, CNSA), cada uno con la fuente de sus coordenadas, más coordenadas manuales o clic en el mapa |
| Mapas 2D y 3D | Mapa polar con sombras calculadas en vivo en la GPU y globo 3D iluminado por el Sol real |
| Dinámica temporal | Reproducción animada de toda la misión |
| Público general | Explicaciones en lenguaje llano generadas a partir de los datos, en español e inglés |

## Cómo funciona

1. **Efemérides.** El navegador calcula la posición del Sol y la Tierra y la orientación de la Luna (modelo de rotación IAU, que incluye la libración) con `astronomy-engine`, y las expresa en el sistema fijo a la Luna. Cuesta unos 14 µs por instante.
2. **Terreno.** El servidor Node carga los modelos de elevación LOLA del polo sur: cuatro mallas anidadas de 20 m (87.5°S a 90°S), 40 m (desde 85°S), 80 m (desde 80°S) y 240 m (desde 75°S), y lee siempre la más fina que contiene cada punto. Para cada sitio lanza 720 rayos, uno cada 0.5° de azimut, hasta 400 km, teniendo en cuenta la curvatura lunar, y devuelve el ángulo del horizonte en cada dirección. Tarda unos 55 ms con terreno de 20 m. Sin las mallas finas funciona con la de 240 m, y los sitios del catálogo usan horizontes precalculados con terreno fino.
3. **Visibilidad.** En la Luna no hay atmósfera, así que no hay refracción ni crepúsculo: se compara cada disco (Sol 0.53°, Tierra 1.9°) con la línea del terreno y se obtiene la fracción visible.
4. **Mapa de sombras.** Un shader WebGL2 hace el mismo cálculo para cada píxel del mapa polar, 150 pasos por rayo, en tiempo real.

## Validación

- **Efemérides contra NASA/JPL Horizons (DE441):** 300 comparaciones (5 sitios, 30 instantes entre nov 2026 y dic 2027, Sol y Tierra). Error máximo en el cielo: **0.0037°**, unas 140 veces menor que el disco solar. Se repite con `npm test`, y el botón "Comprobar con JPL Horizons" lo hace en vivo para cualquier sitio y fecha.
- **Luz y enlace contra resultados publicados:** [docs/VALIDACION.md](docs/VALIDACION.md). A 2 m del suelo, LUMINA reproduce la visibilidad solar de 20 años de Gläser et al. (2018) con diferencias de 0.0 a 2.5 puntos en tres de sus cuatro puntos. Frente a los mapas de NASA de 18.6 años, el valor cae dentro del rango publicado a ±60 m en 10 de 11 sitios. A ras de suelo las diferencias llegan a 20 puntos y están explicadas. Se repite con `npm run validate`.
- **Terreno:** las pruebas comprueban la orientación del modelo con geografía conocida (fondos de Shackleton, Shoemaker y Cabeus; macizo Malapert), el comportamiento físico del horizonte y que las mallas contiguas coinciden donde se solapan.

## Límites conocidos

- El terreno real cubre de 80°S a 90°S. En el resto de la Luna se usa una esfera lisa (se indica en pantalla).
- Con celdas de 20 a 80 m no se resuelven rocas ni relieve de pocos metros. Cerca de una cresta, moverse 40 m puede cambiar el resultado en decenas de puntos.
- El mapa de sombras usa siempre celdas de 480 m. En un servidor sin mallas finas, el buscador de puntos y los puntos personalizados usan terreno de 240 m.
- "Enlace" significa que al menos medio disco terrestre supera el terreno. No se modelan estaciones de tierra ni antenas.
- El índice de viabilidad es orientativo (40% luz, 25% noches cortas, 35% enlace).
- Los puntos "Región Artemis III" son posiciones representativas, no objetivos oficiales. Cada sitio indica en pantalla si sus coordenadas son publicadas o representativas.

## Puesta en marcha

Requiere Node 22.18 o superior: el servidor carga directamente los módulos TypeScript de análisis.

```bash
npm install
npm run fetch-data   # descarga el DEM LOLA de 240 m (29 MB) y la textura lunar desde NASA
npm run dev          # API en :8787 y web en http://localhost:5173
```

Terreno fino, opcional:

```bash
npm run fetch-data -- --hires   # mallas de 20, 40 y 80 m (345 MB)
npm run precompute              # recalcula los horizontes del catálogo en server/data/horizons/
```

Con las mallas finas el servidor usa unos 400 MB de memoria. `LUMINA_HIRES=0` las deja sin cargar.

Producción:

```bash
npm run build
npm start            # sirve API y web en http://localhost:8787
```

Pruebas: `npm test`. Los límites de tiempo de cálculo se comprueban aparte, en el portátil de desarrollo, con `npm run test:perf`. Pruebas en un navegador real, sobre la versión compilada: `npm run build && npm run e2e` (ver [S15](docs/specs/S15-pruebas-de-navegador.md)). Validación científica: `npm run validate` (ver [docs/VALIDACION.md](docs/VALIDACION.md)).

### Despliegue público

Un único servicio Node sirve la API y la web. Vale cualquier alojamiento que ejecute Node, no solo archivos estáticos.

| Ajuste | Valor |
| --- | --- |
| Compilación | `npm ci && npm run fetch-data && npm run build` |
| Arranque | `npm start` |
| Puerto | variable `PORT` |
| Comprobación de salud | `/api/health` debe responder `"dem": true` |
| Memoria | 256 MB bastan con la malla de 240 m; los sitios del catálogo responden igualmente con terreno fino, precalculado |
| Detrás de un proxy | `TRUST_PROXY=1`, para que el límite de peticiones vea la dirección real del cliente |
| Servidor pequeño | `SEARCH_WORKERS=1` y `SEARCH_MAX_GRID=21` reducen el coste del buscador de puntos |

En público, `/api/jpl` admite 30 consultas por minuto y por dirección, y guarda las respuestas en caché. El servidor envía cabeceras de seguridad, incluida una política de contenido que solo permite recursos propios.

Dirección pública: pendiente de desplegar.

### Compartir en la red local

Para que otra persona en la misma red abra la herramienta desde su navegador:

```bash
npm run share      # compila y sirve todo en el puerto 8787
npm run dev:lan    # o, con recarga en vivo, en el puerto 5173
```

El servidor muestra al arrancar la dirección que hay que compartir, del tipo `http://10.0.0.5:8787`. En Windows, el firewall debe permitir conexiones entrantes a Node.js en el perfil de red activo.

## Documentación

El [índice de documentación](docs/README.md) reúne el plan de implementación, las specs de cada función con su estado, y el historial de decisiones y hallazgos del proyecto.

## Estructura

```
server/          API Express
  dem.js         mallas LOLA anidadas y proyección estereográfica polar
  horizon.js     horizonte del terreno por trazado de rayos
  precomputed.js horizontes del catálogo calculados de antemano con terreno fino
  app.js         /api/horizon, /api/heightmap, /api/jpl, /api/search
  search.js      búsqueda en una malla alrededor de un punto, en hilos de trabajo
  index.js       arranque
src/lib/
  ephemeris.ts   Sol y Tierra en el sistema fijo a la Luna
  series.ts      series temporales, ventanas, métricas
  sites.ts       catálogo de sitios
  scenario.ts    escenarios comparables
  urlState.ts    estado en la dirección (enlaces compartibles)
  search.ts      elección de los mejores puntos cercanos
src/components/  Panorama, PolarMap (WebGL2), Globe (three.js), Timeline, Panels
tests/           validación contra JPL Horizons y pruebas del terreno
docs/            índice, plan, specs, historial y guion para el jurado
```

## Datos y créditos

- Topografía: Lunar Orbiter Laser Altimeter (LOLA), Lunar Reconnaissance Orbiter, NASA GSFC, vía PDS Geosciences Node.
- Imagen lunar: mosaico LROC WAC, NASA Scientific Visualization Studio (CGI Moon Kit).
- Referencia de efemérides: NASA/JPL Horizons System.
- Cálculo de efemérides: [astronomy-engine](https://github.com/cosinekitty/astronomy) (licencia MIT).

NASA no avala este proyecto. Es una herramienta de apoyo a la planificación y no sustituye un análisis de misión.

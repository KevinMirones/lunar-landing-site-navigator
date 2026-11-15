<a id="en"></a>
**English** | [Español](#es)

# LUMINA: pitch for the jury

## The idea in one sentence

LUMINA answers in seconds the question that today takes three tools and hours of work: **if I land here, on this date, will I have sunlight for my panels and line of sight to Earth?**

## The problem

Near the lunar south pole the Sun barely rises a few degrees above the horizon. With light that low, a hill 50 km away decides whether a lander has power or freezes, and libration makes Earth appear and disappear behind the terrain every month.

Quickmap, Moon Trek and JPL Horizons have the data, but they are built for detailed analysis: to assess a single site and date you have to work through several interfaces and interpret tables. When a launch slips, science and engineering teams need to compare alternatives now, not next week.

## What we show

Four results that come out of the tool itself, with real NASA data:

1. **1.6 km changes everything, and sometimes 40 m does.** On the Malapert massif, a point on the south slope has 0% direct link to Earth during a 30-day mission. At the summit, 1.6 km away, it has 100% link and 100% sunlight. And 40 m south of the summit the link already drops to 51%. LUMINA finds that point with its search.
2. **Same pole, opposite fates.** For a landing on 14 November 2026: the ridge between Shackleton and de Gerlache gets Sun for 100% of 30 days; the floor of Shackleton, 20 km away, 0%.
3. **The calendar decides.** The same ridge, landing in April 2027 instead of November 2026, drops from 100% to 56% sunlight: it is lunar southern winter. November is the best case of the year, and we say so.
4. **Accuracy you can check.** The ephemeris agrees with JPL Horizons with a maximum error of 0.0037° over 300 comparisons. And the computed sunlight agrees with the published one: at a point on the ridge, Gläser et al. (2018) give 82.0% solar visibility over 20 years and 165 hours of longest shadow; LUMINA gives 82.1% and 165 hours. The full table, with the differences that do not match and why, is in [VALIDACION.md](VALIDACION.md).

## How it works

- **Ephemeris in the browser.** Position of the Sun and Earth and orientation of the Moon, libration included. 14 microseconds per instant, which lets a whole mission be animated without waiting.
- **Real horizon.** The server casts 720 rays over the LOLA topography from Lunar Reconnaissance Orbiter (20 m cells next to the pole, 40 and 80 m further out), with the Moon's curvature, and gets the terrain silhouette seen from the site in 55 milliseconds.
- **No atmosphere, no excuses.** On the Moon there is no refraction and no twilight. We compare each body's disc with the terrain line and get the fraction that shows.
- **Live shadow map.** The graphics card repeats that calculation for every pixel of the south pole, so you watch the shadow sweep across the craters as time advances.

## Demo in 3 minutes

Before starting, set the landing to 14 November 2026 at 00:00 UTC: the figures in this pitch are for that date.

1. **The sky (30 s).** Open on Connecting Ridge. Point at the panorama: the Sun at 1.5°, grazing the terrain, Earth hidden. "This is what the lander's camera would see."
2. **Time (30 s).** Press Play. The Sun circles the horizon without setting; Earth rises and falls with libration. On the map, the shadows turn.
3. **Compare sites (45 s).** Scroll to the table. Four sites, same dates: ridge 100% sunlight, Shackleton floor 0%, Malapert summit 100% sunlight and link. "Science wants the ice on the floor; engineering wants the light on the ridge. Here they negotiate with the same numbers."
4. **The delay (45 s).** "The launch slips to April." Click April on the year calendar. Everything is recomputed at once: in winter the ridge drops to 56% sunlight.
5. **Any point (30 s).** Click the map on a crater: horizon, windows and index in under a second. Change the mast from 2 to 10 m and watch the horizon open up.
6. **The proof (15 s).** Press "Check with JPL Horizons": a difference of thousandths of a degree, live.

## Who it is for

- **Mission planners (CLPS, Artemis):** quick screening of sites and dates before the detailed analysis, and a common language between science and engineering.
- **Teachers:** the contrast between Apollo 11 (14 days of light, 14 of night, Earth fixed in the sky) and the south pole is clear at a glance.
- **The public:** plain-language sentences generated from the data, in Spanish and English.

## What it does not do (yet)

Saying it before they ask builds credibility:

- Real terrain covers 80°S to 90°S; outside it a smooth Moon is used.
- Cells of 20 to 80 m do not show rocks or relief a few metres high, and near a ridge crest 40 m change the result.
- At ground level our numbers differ from the published ones by up to 20 points; at 2 m, which is where a panel goes, they agree.
- The link is geometric: it does not model antennas or ground stations.
- The viability index is indicative, not a mission criterion.

## Next phase

- 5 m LOLA topography around the candidate sites.
- North pole and global relief.
- Exportable report.
- Visibility of relay satellites for sites without line of sight.

## Likely questions

**Why not use JPL Horizons directly?** Horizons gives the Sun's angle over an ideal sphere, for one site and one query at a time. It knows nothing about the terrain and does not compare scenarios. We use it as the reference to validate against.

**Where does the terrain come from?** From the LOLA laser altimeter on Lunar Reconnaissance Orbiter: four public products from NASA's Planetary Data System, at 20, 40, 80 and 240 m per cell.

**Where do the site coordinates come from?** Each site says so on screen. Those of missions already flown and of the most illuminated points are published. NASA gives regions for Artemis III, not points, so those sites are representative and are labelled as such.

**Have you compared the sunlight with anything published?** Yes: with the LOLA team's 18.6-year maps and with Gläser et al. (2014 and 2018). At 2 m above ground we agree to tenths of a point at two of four sites and to under 3 points at a third; at ground level we do not, and we explain why.

**How accurate is a sunlight window?** The ephemeris contributes an error of thousandths of a degree; the real limit is the terrain. That is why each site states the resolution used, and the validation shows how much the results change between 240 m and 20 m.

**Does it work offline?** The web app computes the ephemeris locally. Without a terrain server it keeps working with a smooth Moon and says so.

---

<a id="es"></a>
**Español** | [English](#en)

# LUMINA: guion para el jurado

## La idea en una frase

LUMINA responde en segundos la pregunta que hoy exige tres herramientas y horas de trabajo: **si aterrizo aquí, en esta fecha, ¿tendré luz para mis paneles y línea de vista con la Tierra?**

## El problema

Cerca del polo sur lunar el Sol apenas se levanta unos pocos grados sobre el horizonte. Con una luz tan rasante, una colina a 50 km decide si un módulo tiene energía o se congela, y la libración hace que la Tierra aparezca y desaparezca tras el relieve cada mes.

Quickmap, Moon Trek y JPL Horizons tienen los datos, pero están hechos para análisis detallado: para evaluar un solo par sitio-fecha hay que recorrer varias interfaces e interpretar tablas. Cuando un lanzamiento se retrasa, los equipos de ciencia e ingeniería necesitan comparar alternativas ya, no la semana siguiente.

## Qué demostramos

Cuatro resultados que salen de la propia herramienta, con datos reales de NASA:

1. **1.6 km lo cambian todo, y a veces 40 m.** En el macizo Malapert, un punto en la ladera sur tiene 0% de enlace directo con la Tierra durante una misión de 30 días. En la cima, a 1.6 km, tiene 100% de enlace y 100% de luz. Y 40 m al sur de la cima el enlace ya baja a 51%. LUMINA encuentra ese punto con su buscador.
2. **Mismo polo, destinos opuestos.** Para un alunizaje el 14 de noviembre de 2026: la cresta entre Shackleton y de Gerlache recibe Sol el 100% de 30 días; el fondo de Shackleton, a 20 km, el 0%.
3. **El calendario decide.** La misma cresta, con el alunizaje en abril de 2027 en lugar de noviembre de 2026, baja de 100% a 56% de luz: es el invierno austral lunar. Noviembre es el mejor caso del año, y lo decimos.
4. **Precisión comprobable.** Las efemérides coinciden con JPL Horizons con un error máximo de 0.0037° en 300 comparaciones. Y la luz calculada coincide con la publicada: en un punto de la cresta, Gläser et al. (2018) dan 82.0% de visibilidad solar en 20 años y 165 horas de sombra máxima; LUMINA da 82.1% y 165 horas. La tabla completa, con las diferencias que no cuadran y su explicación, está en [VALIDACION.md](VALIDACION.md).

## Cómo funciona

- **Efemérides en el navegador.** Posición del Sol y la Tierra y orientación de la Luna con libración incluida. 14 microsegundos por instante, lo que permite animar una misión entera sin esperas.
- **Horizonte real.** El servidor traza 720 rayos sobre la topografía LOLA de Lunar Reconnaissance Orbiter (celdas de 20 m junto al polo, de 40 y 80 m más lejos), con la curvatura de la Luna, y obtiene la silueta del terreno vista desde el sitio en 55 milisegundos.
- **Sin atmósfera, sin excusas.** En la Luna no hay refracción ni crepúsculo. Comparamos el disco de cada astro con la línea del terreno y obtenemos qué fracción se ve.
- **Mapa de sombras en vivo.** La tarjeta gráfica repite ese cálculo para cada píxel del polo sur, así que se ve la sombra barrer los cráteres mientras avanza el tiempo.

## Demostración en 3 minutos

Antes de empezar, fijar el alunizaje en el 14 de noviembre de 2026 a las 00:00 UTC: las cifras de este guion corresponden a esa fecha.

1. **El cielo (30 s).** Abrir en Connecting Ridge. Señalar el panorama: el Sol a 1.5° rozando el terreno, la Tierra oculta. "Esto es lo que vería la cámara del módulo."
2. **El tiempo (30 s).** Pulsar Reproducir. El Sol da la vuelta al horizonte sin ponerse; la Tierra sube y baja por la libración. En el mapa, las sombras giran.
3. **Comparar sitios (45 s).** Bajar a la tabla. Cuatro sitios, mismas fechas: cresta 100% de luz, fondo de Shackleton 0%, cima de Malapert 100% de luz y de enlace. "Ciencia quiere el hielo del fondo; ingeniería quiere la luz de la cresta. Aquí negocian con los mismos números."
4. **El retraso (45 s).** "El lanzamiento se retrasa a abril." Hacer clic en abril en el calendario anual. Todo se recalcula al instante: en invierno la cresta baja a 56% de luz.
5. **Un punto cualquiera (30 s).** Clic en el mapa sobre un cráter: horizonte, ventanas e índice en menos de un segundo. Cambiar el mástil de 2 a 10 m y ver cómo se abre el horizonte.
6. **La prueba (15 s).** Pulsar "Comprobar con JPL Horizons": diferencia de milésimas de grado, en vivo.

## Para quién sirve

- **Planificadores de misión (CLPS, Artemis):** cribado rápido de sitios y fechas antes del análisis fino, y lenguaje común entre ciencia e ingeniería.
- **Docentes:** el contraste entre Apollo 11 (14 días de luz, 14 de noche, Tierra fija en el cielo) y el polo sur se entiende de un vistazo.
- **Público:** frases en lenguaje llano generadas a partir de los datos, en español e inglés.

## Lo que no hace (todavía)

Decirlo antes de que lo pregunten da credibilidad:

- El terreno real cubre de 80°S a 90°S; fuera de ahí se usa una Luna lisa.
- Con celdas de 20 a 80 m no se ven rocas ni relieve de pocos metros, y cerca de una cresta 40 m cambian el resultado.
- A ras de suelo nuestros números difieren de los publicados hasta 20 puntos; a 2 m, que es donde va un panel, coinciden.
- El enlace es geométrico: no modela antenas ni estaciones de tierra.
- El índice de viabilidad es orientativo, no un criterio de misión.

## Siguiente fase

- Topografía LOLA de 5 m alrededor de los sitios candidatos.
- Polo norte y relieve global.
- Informe exportable.
- Visibilidad de satélites repetidores para sitios sin línea de vista.

## Preguntas probables

**¿Por qué no usar directamente JPL Horizons?** Horizons da el ángulo del Sol sobre una esfera ideal y para un sitio y una consulta cada vez. No sabe nada del terreno ni compara escenarios. Lo usamos como referencia para validar.

**¿De dónde sale el terreno?** Del altímetro láser LOLA de Lunar Reconnaissance Orbiter: cuatro productos públicos del Planetary Data System de NASA, de 20, 40, 80 y 240 m por celda.

**¿De dónde salen las coordenadas de los sitios?** Cada sitio lo dice en pantalla. Las de misiones ya realizadas y las de los puntos más iluminados están publicadas. NASA da regiones para Artemis III, no puntos, así que esos sitios son representativos y así se etiquetan.

**¿Han comparado la luz con algo publicado?** Sí: con los mapas de 18.6 años del equipo LOLA y con Gläser et al. (2014 y 2018). A 2 m del suelo coincidimos en décimas de punto en dos de cuatro sitios y en menos de 3 puntos en un tercero; a ras de suelo no, y explicamos por qué.

**¿Qué precisión tiene una ventana de luz?** La efeméride aporta un error de milésimas de grado; el límite real es el terreno. Por eso cada sitio indica la resolución usada, y la validación muestra cuánto cambian los resultados entre 240 m y 20 m.

**¿Funciona sin conexión?** La web calcula las efemérides localmente. Sin servidor de terreno sigue funcionando con una Luna lisa y lo avisa.

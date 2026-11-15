<a id="en"></a>
**English** | [Español](#es)

# Scientific validation

This document compares what LUMINA computes with published results and says where each catalogue coordinate comes from. The figures come from `npm run validate`; the full output is in [VALIDACION-salida.md](VALIDACION-salida.md).

Rule followed: no parameter was tuned to make the numbers match. The differences are shown and explained.

## Summary

- **At 2 m above ground, LUMINA reproduces the published values.** At two of the four points of Gläser et al. (2018) the 20-year solar visibility agrees to a tenth of a point and the longest shadow to the hour.
- **Against NASA's 18.6-year maps,** LUMINA's value falls within the published range at ±60 m at 10 of 11 sites, for both the Sun and Earth.
- **At ground level the differences are large** (up to 20 points) and have a known cause: with the observer at 0 m, the relief of the first few metres rules, and there every terrain model is different.
- **Coordinates matter at the scale of tens of metres.** Two catalogue sites used coordinates with two decimals; on fine terrain they fell off the ridge. They now use those of Gläser et al. (2018).

## What was validated and how

| Layer | Reference | How it is compared |
| --- | --- | --- |
| Position of the Sun and Earth | NASA/JPL Horizons, DE441 | 300 comparisons in the automated tests; maximum error 0.0037° |
| Long-term visibility | Maps by NASA's LOLA team, method of Mazarico et al. (2011) | Same criterion (any fraction of the disc), at 0 m, 18.6 years, at each catalogue site |
| Most illuminated points | Gläser et al. (2018), tables 1 and 2; Gläser et al. (2014) | Same period (2017 to 2037), same step (one hour), same coordinates and heights |

In all three layers LUMINA uses its normal code: the app's ephemeris, the horizon of [horizon.js](../server/horizon.js) over the LOLA grids of 20, 40, 80 and 240 m, and the visible disc fraction of [series.ts](../src/lib/series.ts).

The publications count the Sun as visible if any part of the disc shows. The app is stricter (at least 2% of the solar disc for sunlight and 50% of Earth's disc for the link), so the validation uses the publications' criterion and not the app's.

## Published against LUMINA

"Diff." is LUMINA minus the published value, in percentage points.

| Site | Quantity | Published | Source | LUMINA | Diff. | Comment |
| --- | --- | --- | --- | --- | --- | --- |
| Connecting Ridge C2, 2 m | Solar visibility, 20 years | 82.0% | Gläser 2018, table 2 | 82.1% | +0.1 | |
| Connecting Ridge C2, 2 m | Average illumination | 78.1% | Gläser 2018, table 2 | 78.1% | 0.0 | |
| Connecting Ridge C2, 2 m | Longest shadow | 165 h | Gläser 2018, table 2 | 165 h | 0 h | |
| Shackleton (a), 2 m | Solar visibility | 89.4% | Gläser 2018, table 2 | 89.4% | 0.0 | |
| Shackleton (a), 2 m | Average illumination | 85.5% | Gläser 2018, table 2 | 84.1% | −1.4 | |
| Shackleton (a), 2 m | Longest shadow | 66 h | Gläser 2018, table 2 | 66 h | 0 h | |
| Connecting Ridge C1, 2 m | Solar visibility | 92.1% | Gläser 2018, table 2 | 89.6% | −2.5 | 91.5% at the best point within 40 m |
| Connecting Ridge C1, 2 m | Average illumination | 88.0% | Gläser 2018, table 2 | 85.0% | −3.0 | 87.3% at the best point within 40 m |
| Connecting Ridge C1, 2 m | Longest shadow | 112 h | Gläser 2018, table 2 | 268 h | +156 h | See note 2 |
| Shackleton (b), 2 m | Solar visibility | 89.8% | Gläser 2018, table 2 | 82.5% | −7.3 | See note 3 |
| Connecting Ridge, 2 m | Solar visibility, 19 years | 92.27% | Gläser 2014 | 91.5% | −0.8 | Best point within 40 m of C1 |
| Connecting Ridge, 10 m | Solar visibility, 19 years | 95.65% | Gläser 2014 | 95.0% | −0.6 | Longest shadow: 3.7 days (published: 3 to 5) |
| Haworth, 0 m | Sun visible, 18.6 years | 42.6% | NASA map, 60 m | 42.3% | −0.3 | |
| Haworth, 0 m | Earth visible, 18.6 years | 60.7% | NASA map, 60 m | 60.4% | −0.3 | |
| IM-2 Athena, 0 m | Sun visible | 45.1% | NASA map, 60 m | 46.5% | +1.4 | |
| IM-2 Athena, 0 m | Earth visible | 92.1% | NASA map, 60 m | 93.1% | +1.0 | |
| Cabeus (LCROSS), 0 m | Earth visible | 18.6% | NASA map, 60 m | 18.6% | 0.0 | The Sun is never seen in either |
| Nobile Rim, 0 m | Earth visible | 46.7% | NASA map, 60 m | 46.8% | +0.1 | Sun: 28.0% against 24.9% |
| Malapert Massif, 0 m | Earth visible | 73.0% | NASA map, 60 m | 67.1% | −5.9 | See note 1; at ±60 m the map goes from 44.7% to 100% |
| de Gerlache Rim, 0 m | Sun visible | 44.9% | NASA map, 60 m | 18.7% | −26.2 | See note 1; with the 240 m grid, 50.4% |
| de Gerlache Rim, 0 m | Earth visible | 61.2% | NASA map, 60 m | 47.5% | −13.7 | See note 1; with the 240 m grid, 61.6% |
| Connecting Ridge C1, 0 m | Solar visibility | 81.3% | Gläser 2018, table 1 | 66.3% | −15.0 | See note 1 |
| Connecting Ridge C2, 0 m | Solar visibility | 80.6% | Gläser 2018, table 1 | 62.8% | −17.8 | See note 1 |
| Shackleton, 0 m | Solar visibility | 85.5% | Gläser 2018, table 1 | 81.2% | −4.3 | Longest shadow: 232 h against 221 h |

## Why they differ

**Note 1. At ground level the relief of the first few metres rules.** With the observer at 0 m, a rise of one metre 20 m away lifts the horizon by 3°, and the polar Sun never climbs much above 1.5°. At that scale every terrain model is different: NASA's maps use 60 m cells, Gläser et al. built their own 20 m model and LUMINA uses the 20 and 40 m grids from the PDS. Two checks support this:

- With the 240 m grid alone, LUMINA gives 50.4% Sun and 61.6% Earth at de Gerlache, next to the 44.9% and 61.2% of NASA's map.
- At 2 m height, where that nearby relief no longer blocks the view, the agreement with Gläser et al. is back to tenths of a point.

For a mission this is not a flaw in the method but a warning: panels and antenna go on a mast, and the app always computes with the mast height.

**Note 2. The longest shadow depends on a single episode.** It only takes 1% of the solar disc showing for one day to split a long night in two. That is why this quantity varies a lot over a few metres: at C1 it goes from 268 h to 181 h at 40 m distance.

**Note 3. The published maxima are one or two cells wide.** Gläser et al. (2018) note that their zones of maximum illumination are 20 to 40 m wide. With a different terrain model, the maximum does not fall in the same cell. At Shackleton (b) LUMINA does not find it within a 40 m radius.

**Other differences in method:**

- We do not know on what date the 18.6 years of NASA's maps begin; LUMINA starts on 1 January 2017.
- NASA's maps and the PDS grids use the same coordinate system (mean Earth/polar axis of DE421), so there is no change of system between them.

## What the coordinates teach

Mazarico et al. (2011) give the most illuminated point of the south pole as 89.45°S, 222.69°E, with two decimals: about 300 m of leeway in latitude. On the 240 m grid of the time that was enough. On fine terrain it is not:

| Point, with the 2011 coordinates | Mazarico et al. (2011), 240 m | NASA 60 m map at that pixel | Range of the map at ±60 m | LUMINA, fine grids |
| --- | --- | --- | --- | --- |
| Connecting Ridge, 89.45°S 222.69°E | 92.7% | 0.0% | 0.0% to 86.4% | 36.7% |
| Shackleton, 89.78°S 204.27°E | 90.5% | 6.3% | 0.0% to 85.2% | 0.0% |

Both points were in the MVP catalogue. For a 30-day mission with a 2 m mast, the Shackleton one went from 100% sunlight on the 240 m grid to 12% on the 20 m one. The catalogue now uses the four-decimal coordinates of Gläser et al. (2018), table 2.

## Catalogue coordinates

- **Published:** the coordinates are the ones a mission or a paper gives.
- **Representative:** a point chosen inside a named area; it is not an official target.

| Site | Latitude | Longitude | Precision | Source |
| --- | --- | --- | --- | --- |
| Connecting Ridge | 89.4398°S | 137.17°W | published | Gläser et al. (2018), table 2: Connecting Ridge C1, 2 m above ground |
| Shackleton Rim | 89.6866°S | 162.81°W | published | Gläser et al. (2018), table 2: Shackleton, 2 m above ground |
| Shackleton Floor | 89.66°S | 129.2°E | representative | Point chosen for this project on the crater floor |
| de Gerlache Rim | 88.67°S | 68°W | representative | Artemis III candidate region "de Gerlache Rim 2" (NASA, 2024) |
| Shackleton Rim East | 88.8°S | 123.4°E | representative | Secondary sources on Chang'e 7; CNSA has not published a final point |
| Malapert Massif | 85.967°S | 2.2392°W | representative | Artemis III candidate region "Malapert Massif"; the summit, chosen with LUMINA's search |
| Haworth | 86.8°S | 22°W | representative | Artemis III candidate region "Haworth" |
| Mons Mouton (VIPER) | 85.42°S | 31.6°E | representative | NASA chose Mons Mouton for VIPER in 2021; the point is approximate |
| Nobile Rim | 85.43°S | 37°E | representative | Artemis III candidate region "Nobile Rim 1" |
| IM-2 Athena | 84.7906°S | 29.1957°E | published | NASA, Lunar Reconnaissance Orbiter |
| Cabeus (LCROSS) | 84.675°S | 48.725°W | published | Colaprete et al. (2010) |
| IM-1 Odysseus | 80.13°S | 1.44°E | published | NASA, Lunar Reconnaissance Orbiter (LROC) |
| Chandrayaan-3 | 69.373°S | 32.319°E | published | ISRO |
| Apollo 11 | 0.6742°N | 23.4731°E | published | NASA, LROC |
| Apollo 17 | 20.1911°N | 30.7723°E | published | NASA, LROC |
| Blue Ghost M1 | 18.56°N | 61.81°E | published | Firefly Aerospace and NASA |
| SLIM | 13.316°S | 25.251°E | published | JAXA |
| Chang'e 4 | 45.4446°S | 177.5991°E | published | CNSA; confirmed in LROC images |

**About the Artemis III regions.** On 28 October 2024 NASA narrowed the list to nine regions: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2 and Slater Plain. Connecting Ridge was on the 2022 list of thirteen and is no longer there, so the catalogue stopped calling it an "Artemis candidate". NASA gives regions, not points: the four sites marked "Artemis III region" are representative points, and it has not been checked that they fall inside the official outline of each region.

**What was checked in this review and what was not.** The coordinates of Connecting Ridge and Shackleton Rim (table of Gläser et al. 2018), those of IM-2 and the list of Artemis III regions were checked against their source. The VIPER point and the Chang'e 7 point could not be confirmed, which is why they are representative. The other published coordinates come from the sources stated and were not checked again one by one.

## Known limits

- Only sites south of about 85°S are validated, which is what the 60 m maps cover. IM-1 is left out.
- There is no pixel-by-pixel comparison with the maps, nor with real images from the LROC camera.
- The Earth link is validated as geometric visibility. Antennas and ground stations are not modelled.
- The LOLA grids have their own error. Barker et al. (2021) estimate 0.3 to 0.5 m of height error in their improved 5 m grids; the PDS 20 m ones are no better, and at ground level that already changes the result.

## How to repeat it

```
npm run fetch-data -- --hires --validation
npm run validate
```

The first command downloads the 20, 40 and 80 m grids (345 MB) and the two NASA maps (102 MB). The second takes about a minute and rewrites [VALIDACION-salida.md](VALIDACION-salida.md).

## References

- Mazarico, E. et al. (2011). Illumination conditions of the lunar polar regions using LOLA topography. *Icarus* 211, 1066–1081.
- Gläser, P. et al. (2014). Illumination conditions at the lunar south pole using high resolution Digital Terrain Models from LOLA. *Icarus* 243, 78–90.
- Gläser, P. et al. (2018). Illumination conditions at the lunar poles: Implications for future exploration. *Planetary and Space Science* 162, 170–178. The values of tables 1 and 2 were taken from the manuscript on the NASA Technical Reports Server (NTRS 20170007365).
- Barker, M. K. et al. (2021). Improved LOLA elevation maps for south pole landing sites: Error estimates and their impact on illumination conditions. *Planetary and Space Science*, doi:10.1016/j.pss.2020.105119.
- Maps `AVGVISIB_85S_060M_201608` and `AVGVISIB_85S_060M_201608_EARTH`, LOLA team, [Lunar Polar Illumination](https://pgda.gsfc.nasa.gov/products/69), NASA Goddard.
- Grids `LDEM_875S_20M`, `LDEM_85S_40M`, `LDEM_80S_80M` and `LDEM_75S_240M`, [PDS Geosciences Node](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/).
- NASA (28 October 2024). [NASA Provides Update on Artemis III Moon Landing Regions](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/).

---

<a id="es"></a>
**Español** | [English](#en)

# Validación científica

Este documento compara lo que calcula LUMINA con resultados publicados y dice de dónde sale cada coordenada del catálogo. Las cifras salen de `npm run validate`; la salida completa está en [VALIDACION-salida.md](VALIDACION-salida.md).

Regla seguida: no se ajustó ningún parámetro para que los números coincidan. Las diferencias se muestran y se explican.

## Resumen

- **A 2 m del suelo, LUMINA reproduce los valores publicados.** En dos de los cuatro puntos de Gläser et al. (2018) la visibilidad solar de 20 años coincide a una décima de punto y la sombra más larga, a la hora.
- **Frente a los mapas de NASA de 18.6 años,** el valor de LUMINA cae dentro del rango publicado a ±60 m en 10 de 11 sitios, tanto para el Sol como para la Tierra.
- **A ras de suelo las diferencias son grandes** (hasta 20 puntos) y tienen una causa conocida: con el observador a 0 m manda el relieve de los primeros metros, y ahí cada modelo de terreno es distinto.
- **Las coordenadas importan a escala de decenas de metros.** Dos sitios del catálogo usaban coordenadas con dos decimales; con terreno fino caían fuera de la cresta. Ahora usan las de Gläser et al. (2018).

## Qué se validó y cómo

| Capa | Referencia | Cómo se compara |
| --- | --- | --- |
| Posición del Sol y la Tierra | NASA/JPL Horizons, DE441 | 300 comparaciones en las pruebas automáticas; error máximo 0.0037° |
| Visibilidad a largo plazo | Mapas del equipo LOLA de NASA, método de Mazarico et al. (2011) | Mismo criterio (cualquier fracción del disco), a 0 m, 18.6 años, en cada sitio del catálogo |
| Puntos más iluminados | Gläser et al. (2018), tablas 1 y 2; Gläser et al. (2014) | Mismo periodo (2017 a 2037), mismo paso (una hora), mismas coordenadas y alturas |

En las tres capas LUMINA usa su código normal: las efemérides de la app, el horizonte de [horizon.js](../server/horizon.js) sobre las mallas LOLA de 20, 40, 80 y 240 m, y la fracción visible del disco de [series.ts](../src/lib/series.ts).

Las publicaciones cuentan el Sol como visible si asoma cualquier parte del disco. La app es más exigente (al menos 2% del disco solar para la luz y 50% del disco de la Tierra para el enlace), así que para validar se usa el criterio de las publicaciones y no el de la app.

## Publicado frente a LUMINA

"Dif." es LUMINA menos el valor publicado, en puntos porcentuales.

| Sitio | Magnitud | Publicado | Fuente | LUMINA | Dif. | Comentario |
| --- | --- | --- | --- | --- | --- | --- |
| Connecting Ridge C2, 2 m | Visibilidad solar, 20 años | 82.0% | Gläser 2018, tabla 2 | 82.1% | +0.1 | |
| Connecting Ridge C2, 2 m | Iluminación media | 78.1% | Gläser 2018, tabla 2 | 78.1% | 0.0 | |
| Connecting Ridge C2, 2 m | Sombra más larga | 165 h | Gläser 2018, tabla 2 | 165 h | 0 h | |
| Shackleton (a), 2 m | Visibilidad solar | 89.4% | Gläser 2018, tabla 2 | 89.4% | 0.0 | |
| Shackleton (a), 2 m | Iluminación media | 85.5% | Gläser 2018, tabla 2 | 84.1% | −1.4 | |
| Shackleton (a), 2 m | Sombra más larga | 66 h | Gläser 2018, tabla 2 | 66 h | 0 h | |
| Connecting Ridge C1, 2 m | Visibilidad solar | 92.1% | Gläser 2018, tabla 2 | 89.6% | −2.5 | 91.5% en el mejor punto a 40 m |
| Connecting Ridge C1, 2 m | Iluminación media | 88.0% | Gläser 2018, tabla 2 | 85.0% | −3.0 | 87.3% en el mejor punto a 40 m |
| Connecting Ridge C1, 2 m | Sombra más larga | 112 h | Gläser 2018, tabla 2 | 268 h | +156 h | Ver nota 2 |
| Shackleton (b), 2 m | Visibilidad solar | 89.8% | Gläser 2018, tabla 2 | 82.5% | −7.3 | Ver nota 3 |
| Connecting Ridge, 2 m | Visibilidad solar, 19 años | 92.27% | Gläser 2014 | 91.5% | −0.8 | Mejor punto a 40 m de C1 |
| Connecting Ridge, 10 m | Visibilidad solar, 19 años | 95.65% | Gläser 2014 | 95.0% | −0.6 | Sombra más larga: 3.7 días (publicado: 3 a 5) |
| Haworth, 0 m | Sol visible, 18.6 años | 42.6% | Mapa de NASA, 60 m | 42.3% | −0.3 | |
| Haworth, 0 m | Tierra visible, 18.6 años | 60.7% | Mapa de NASA, 60 m | 60.4% | −0.3 | |
| IM-2 Athena, 0 m | Sol visible | 45.1% | Mapa de NASA, 60 m | 46.5% | +1.4 | |
| IM-2 Athena, 0 m | Tierra visible | 92.1% | Mapa de NASA, 60 m | 93.1% | +1.0 | |
| Cabeus (LCROSS), 0 m | Tierra visible | 18.6% | Mapa de NASA, 60 m | 18.6% | 0.0 | El Sol no se ve nunca en ninguno de los dos |
| Nobile Rim, 0 m | Tierra visible | 46.7% | Mapa de NASA, 60 m | 46.8% | +0.1 | Sol: 28.0% frente a 24.9% |
| Malapert Massif, 0 m | Tierra visible | 73.0% | Mapa de NASA, 60 m | 67.1% | −5.9 | Ver nota 1; a ±60 m el mapa va de 44.7% a 100% |
| de Gerlache Rim, 0 m | Sol visible | 44.9% | Mapa de NASA, 60 m | 18.7% | −26.2 | Ver nota 1; con la malla de 240 m, 50.4% |
| de Gerlache Rim, 0 m | Tierra visible | 61.2% | Mapa de NASA, 60 m | 47.5% | −13.7 | Ver nota 1; con la malla de 240 m, 61.6% |
| Connecting Ridge C1, 0 m | Visibilidad solar | 81.3% | Gläser 2018, tabla 1 | 66.3% | −15.0 | Ver nota 1 |
| Connecting Ridge C2, 0 m | Visibilidad solar | 80.6% | Gläser 2018, tabla 1 | 62.8% | −17.8 | Ver nota 1 |
| Shackleton, 0 m | Visibilidad solar | 85.5% | Gläser 2018, tabla 1 | 81.2% | −4.3 | Sombra más larga: 232 h frente a 221 h |

## Por qué difieren

**Nota 1. A ras de suelo manda el relieve de los primeros metros.** Con el observador a 0 m, una subida de un metro a 20 m de distancia levanta el horizonte 3°, y el Sol polar nunca sube mucho más de 1.5°. A esa escala cada modelo de terreno es distinto: los mapas de NASA usan celdas de 60 m, Gläser et al. construyeron su propio modelo de 20 m y LUMINA usa las mallas de 20 y 40 m del PDS. Dos comprobaciones lo apoyan:

- Con solo la malla de 240 m, LUMINA da en de Gerlache 50.4% de Sol y 61.6% de Tierra, junto a los 44.9% y 61.2% del mapa de NASA.
- A 2 m de altura, donde ese relieve cercano deja de tapar, el acuerdo con Gläser et al. vuelve a ser de décimas.

Para una misión esto no es un defecto del método sino un aviso: los paneles y la antena van en un mástil, y la app calcula siempre con la altura del mástil.

**Nota 2. La sombra más larga depende de un solo episodio.** Basta que un 1% del disco solar asome un día para partir una noche larga en dos. Por eso esta magnitud varía mucho con pocos metros: en C1 pasa de 268 h a 181 h a 40 m de distancia.

**Nota 3. Los máximos publicados miden una o dos celdas de ancho.** Gläser et al. (2018) señalan que sus zonas de máxima iluminación tienen de 20 a 40 m de ancho. Con otro modelo de terreno, el máximo no cae en la misma celda. En Shackleton (b) LUMINA no lo encuentra en un radio de 40 m.

**Otras diferencias de método:**

- No sabemos en qué fecha empiezan los 18.6 años de los mapas de NASA; LUMINA empieza el 1 de enero de 2017.
- Los mapas de NASA y las mallas del PDS usan el mismo sistema de coordenadas (ejes medios Tierra/polo de DE421), así que no hay cambio de sistema entre ambos.

## Lo que enseñan las coordenadas

Mazarico et al. (2011) dan el punto más iluminado del polo sur como 89.45°S, 222.69°E, con dos decimales: unos 300 m de margen en latitud. Sobre la malla de 240 m de entonces eso bastaba. Sobre terreno fino, no:

| Punto, con las coordenadas de 2011 | Mazarico et al. (2011), 240 m | Mapa de NASA de 60 m en ese píxel | Rango del mapa a ±60 m | LUMINA, mallas finas |
| --- | --- | --- | --- | --- |
| Connecting Ridge, 89.45°S 222.69°E | 92.7% | 0.0% | 0.0% a 86.4% | 36.7% |
| Shackleton, 89.78°S 204.27°E | 90.5% | 6.3% | 0.0% a 85.2% | 0.0% |

Los dos puntos estaban en el catálogo del MVP. Para una misión de 30 días con mástil de 2 m, el de Shackleton pasaba de 100% de luz con la malla de 240 m a 12% con la de 20 m. Ahora el catálogo usa las coordenadas de cuatro decimales de Gläser et al. (2018), tabla 2.

## Coordenadas del catálogo

- **Publicada:** las coordenadas son las que da una misión o un artículo.
- **Representativa:** un punto elegido dentro de una zona con nombre; no es un objetivo oficial.

| Sitio | Latitud | Longitud | Precisión | Fuente |
| --- | --- | --- | --- | --- |
| Connecting Ridge | 89.4398°S | 137.17°O | publicada | Gläser et al. (2018), tabla 2: Connecting Ridge C1, a 2 m del suelo |
| Shackleton Rim | 89.6866°S | 162.81°O | publicada | Gläser et al. (2018), tabla 2: Shackleton, a 2 m del suelo |
| Shackleton Floor | 89.66°S | 129.2°E | representativa | Punto elegido para este proyecto en el fondo del cráter |
| de Gerlache Rim | 88.67°S | 68°O | representativa | Región candidata de Artemis III «de Gerlache Rim 2» (NASA, 2024) |
| Shackleton Rim East | 88.8°S | 123.4°E | representativa | Fuentes secundarias sobre Chang'e 7; la CNSA no ha publicado un punto definitivo |
| Malapert Massif | 85.967°S | 2.2392°O | representativa | Región candidata de Artemis III «Malapert Massif»; la cima, elegida con el buscador de LUMINA |
| Haworth | 86.8°S | 22°O | representativa | Región candidata de Artemis III «Haworth» |
| Mons Mouton (VIPER) | 85.42°S | 31.6°E | representativa | NASA eligió Mons Mouton para VIPER en 2021; el punto es aproximado |
| Nobile Rim | 85.43°S | 37°E | representativa | Región candidata de Artemis III «Nobile Rim 1» |
| IM-2 Athena | 84.7906°S | 29.1957°E | publicada | NASA, Lunar Reconnaissance Orbiter |
| Cabeus (LCROSS) | 84.675°S | 48.725°O | publicada | Colaprete et al. (2010) |
| IM-1 Odysseus | 80.13°S | 1.44°E | publicada | NASA, Lunar Reconnaissance Orbiter (LROC) |
| Chandrayaan-3 | 69.373°S | 32.319°E | publicada | ISRO |
| Apollo 11 | 0.6742°N | 23.4731°E | publicada | NASA, LROC |
| Apollo 17 | 20.1911°N | 30.7723°E | publicada | NASA, LROC |
| Blue Ghost M1 | 18.56°N | 61.81°E | publicada | Firefly Aerospace y NASA |
| SLIM | 13.316°S | 25.251°E | publicada | JAXA |
| Chang'e 4 | 45.4446°S | 177.5991°E | publicada | CNSA; confirmado con imágenes de LROC |

**Sobre las regiones de Artemis III.** El 28 de octubre de 2024 NASA redujo la lista a nueve regiones: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2 y Slater Plain. Connecting Ridge figuraba en la lista de trece de 2022 y ya no está, así que en el catálogo dejó de llamarse "candidato Artemis". NASA da regiones, no puntos: los cuatro sitios marcados "Región Artemis III" son puntos representativos, y no se ha comprobado que caigan dentro del contorno oficial de cada región.

**Qué se contrastó en esta revisión y qué no.** Se comprobaron con su fuente las coordenadas de Connecting Ridge y Shackleton Rim (tabla de Gläser et al. 2018), las de IM-2 y la lista de regiones de Artemis III. No se pudo confirmar el punto de VIPER ni el de Chang'e 7, y por eso son representativos. Las demás coordenadas publicadas proceden de las fuentes indicadas y no se volvieron a contrastar una por una.

## Límites conocidos

- Solo se validan sitios al sur de 85°S aproximadamente, que es lo que cubren los mapas de 60 m. IM-1 queda fuera.
- No hay comparación píxel a píxel con los mapas, ni con imágenes reales de la cámara LROC.
- El enlace con la Tierra se valida como visibilidad geométrica. No se modelan antenas ni estaciones de tierra.
- Las mallas LOLA tienen error propio. Barker et al. (2021) estiman de 0.3 a 0.5 m de error de altura en sus mallas mejoradas de 5 m; las de 20 m del PDS no son mejores, y a ras de suelo eso ya cambia el resultado.

## Cómo repetirlo

```
npm run fetch-data -- --hires --validation
npm run validate
```

La primera orden descarga las mallas de 20, 40 y 80 m (345 MB) y los dos mapas de NASA (102 MB). La segunda tarda alrededor de un minuto y reescribe [VALIDACION-salida.md](VALIDACION-salida.md).

## Referencias

- Mazarico, E. et al. (2011). Illumination conditions of the lunar polar regions using LOLA topography. *Icarus* 211, 1066–1081.
- Gläser, P. et al. (2014). Illumination conditions at the lunar south pole using high resolution Digital Terrain Models from LOLA. *Icarus* 243, 78–90.
- Gläser, P. et al. (2018). Illumination conditions at the lunar poles: Implications for future exploration. *Planetary and Space Science* 162, 170–178. Los valores de las tablas 1 y 2 se tomaron del manuscrito publicado en el servidor de informes técnicos de NASA (NTRS 20170007365).
- Barker, M. K. et al. (2021). Improved LOLA elevation maps for south pole landing sites: Error estimates and their impact on illumination conditions. *Planetary and Space Science*, doi:10.1016/j.pss.2020.105119.
- Mapas `AVGVISIB_85S_060M_201608` y `AVGVISIB_85S_060M_201608_EARTH`, equipo LOLA, [Lunar Polar Illumination](https://pgda.gsfc.nasa.gov/products/69), NASA Goddard.
- Mallas `LDEM_875S_20M`, `LDEM_85S_40M`, `LDEM_80S_80M` y `LDEM_75S_240M`, [PDS Geosciences Node](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/).
- NASA (28 de octubre de 2024). [NASA Provides Update on Artemis III Moon Landing Regions](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/).

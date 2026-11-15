---
id: S07
titulo: Validación científica y coordenadas oficiales
title: Scientific validation and official coordinates
estado: hecha
dia: 3
prioridad: imprescindible
depende: S06
resumen: Tabla que compara nuestros resultados con los publicados, y cada sitio con su fuente.
summary: A table that compares our results with published ones, and every site with its source.
---

<a id="en"></a>
**English** | [Español](#es)

# S07: Scientific validation and official coordinates

## Problem

The ephemeris is validated against JPL Horizons, but the sunlight and link windows have not been compared with anything. Also, the coordinates of the Artemis candidates and of the Chang'e 7 target were entered from memory and are approximate. A technical jury will ask about both.

## What the user will see

- A document, [VALIDACION.md](../VALIDACION.md), with a "published against LUMINA" table.
- On each site, the source of its coordinates and whether they are "published" or "representative".

## Design

**Illumination validation:**

- References used:
  - The maps of average Sun and Earth visibility by NASA's LOLA team (18.6 years, 60 m per pixel, method of Mazarico et al. 2011). They are public data, so the comparison is made at each catalogue site and not only with quoted figures.
  - Gläser et al. (2018), *Planetary and Space Science* 162, tables 1 and 2: most illuminated points at ground level and at 2 m, with four-decimal coordinates. Their table 1 also quotes the values of Mazarico et al. (2011).
  - Gläser et al. (2014), *Icarus* 243: Connecting Ridge at 2 and 10 m.
- [validate-illumination.mjs](../../scripts/validate-illumination.mjs) computes the same periods as the publications, with a one-hour step: 175 320 instants, from 2017 to 2037. It takes about a minute.
- For each reference point: solar visibility, average illumination, longest shadow and difference from the published value. Also the best point within a 40 m radius, because the published maxima are one or two cells wide.
- `npm run fetch-data -- --validation` downloads the two NASA maps (102 MB) to `server/data/published/`, which does not go in the repository.

**Link validation:** visibility of Earth at each site against NASA's 18.6-year map.

**Resulting table**, with these columns: site, quantity, published value, source, LUMINA value, difference and comment.

**Coordinates:**

- Each entry of [sites.ts](../../src/lib/sites.ts) gains `source` (in Spanish and English) and `precision` (`published` or `representative`). The site panel shows it.
- Connecting Ridge and Shackleton Rim go from the two-decimal coordinates of Mazarico et al. (2011) to the four-decimal ones of Gläser et al. (2018). See [the finding](../historial/2026-11-14-09-trescientos-metros.md).
- Malapert Massif moves to the summit of the massif, chosen with the search over 40 m terrain.
- Review the "Artemis candidate" labels: NASA narrowed the list to nine regions in October 2024 (Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2 and Slater Plain). Confirmed with NASA's release: Connecting Ridge was on the 2022 list and is not on the current one. The label becomes "Artemis III region" and only representative points carry it.

**Rule:** no parameter is tuned to make the numbers match. The differences are explained (another resolution, another height, another period).

## Acceptance criteria

1. [VALIDACION.md](../VALIDACION.md) has at least five comparisons with their source. It has 24.
2. Every difference above five percentage points has an explanation.
3. All catalogue sites have `source` and `precision`.
4. The figures in [PITCH.md](../PITCH.md) have been recomputed with the fine terrain.
5. The validation script can be repeated with `npm run validate`.

## Tests

- The script itself is the test. Its output is saved in [VALIDACION-salida.md](../VALIDACION-salida.md).
- Automated: every site has a source and a precision, and no site labelled as an Artemis region is presented as a published coordinate.
- In the browser: the source line in the site panel, in Spanish and English.

## Out of scope

- Pixel-by-pixel comparison with published illumination maps.
- Validation with real images from the LROC camera.

## Risks

- **The papers cannot be consulted in time.** Collecting published values is parallel work from day 1.
- **Large differences without a clear explanation.** They are reported as they are under the known limits; hiding them would cost more credibility than showing them. It happened at ground level, with differences of up to 20 points, and they are in the document.
- **Unconfirmed coordinates.** The VIPER point and the Chang'e 7 point could not be confirmed; they stay as representative. The coordinates of missions already flown were not checked again one by one.

---

<a id="es"></a>
**Español** | [English](#en)

# S07: Validación científica y coordenadas oficiales

## Problema

Las efemérides están validadas contra JPL Horizons, pero las ventanas de luz y de enlace no se han comparado con nada. Además, las coordenadas de los candidatos Artemis y del objetivo de Chang'e 7 se pusieron de memoria y son aproximadas. Un jurado técnico preguntará por ambas cosas.

## Qué verá el usuario

- Un documento [VALIDACION.md](../VALIDACION.md) con una tabla "publicado frente a LUMINA".
- En cada sitio, la fuente de sus coordenadas y si son "publicadas" o "representativas".

## Diseño

**Validación de iluminación:**

- Referencias usadas:
  - Los mapas de visibilidad media del Sol y de la Tierra del equipo LOLA de NASA (18.6 años, 60 m por píxel, método de Mazarico et al. 2011). Son datos públicos, así que la comparación se hace en cada sitio del catálogo y no solo con cifras citadas.
  - Gläser et al. (2018), *Planetary and Space Science* 162, tablas 1 y 2: puntos más iluminados a ras de suelo y a 2 m, con coordenadas de cuatro decimales. Su tabla 1 cita además los valores de Mazarico et al. (2011).
  - Gläser et al. (2014), *Icarus* 243: Connecting Ridge a 2 y 10 m.
- [validate-illumination.mjs](../../scripts/validate-illumination.mjs) calcula los mismos periodos que las publicaciones, con paso de una hora: 175 320 instantes, de 2017 a 2037. Tarda alrededor de un minuto.
- Para cada punto de referencia: visibilidad solar, iluminación media, sombra más larga y diferencia con el valor publicado. Además, el mejor punto en un radio de 40 m, porque los máximos publicados miden una o dos celdas.
- `npm run fetch-data -- --validation` descarga los dos mapas de NASA (102 MB) a `server/data/published/`, que no va en el repositorio.

**Validación de enlace:** visibilidad de la Tierra en cada sitio frente al mapa de NASA de 18.6 años.

**Tabla resultante**, con estas columnas: sitio, magnitud, valor publicado, fuente, valor LUMINA, diferencia y comentario.

**Coordenadas:**

- Cada entrada de [sites.ts](../../src/lib/sites.ts) gana `source` (la fuente, en español e inglés) y `precision` (`published` o `representative`). El panel del sitio lo muestra.
- Connecting Ridge y Shackleton Rim pasan de las coordenadas de dos decimales de Mazarico et al. (2011) a las de cuatro de Gläser et al. (2018). Ver [el hallazgo](../historial/2026-11-14-09-trescientos-metros.md).
- Malapert Massif pasa a la cima del macizo, elegida con el buscador sobre terreno de 40 m.
- Revisar las etiquetas "Candidato Artemis": NASA redujo la lista a nueve regiones en octubre de 2024 (Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2 y Slater Plain). Confirmado con la nota de NASA: Connecting Ridge figuraba en la lista de 2022 y no está en la actual. La etiqueta pasa a ser "Región Artemis III" y solo la llevan puntos representativos.

**Regla:** no se ajusta ningún parámetro para que los números coincidan. Las diferencias se explican (otra resolución, otra altura, otro periodo).

## Criterios de aceptación

1. [VALIDACION.md](../VALIDACION.md) tiene al menos cinco comparaciones con su fuente. Tiene 24.
2. Toda diferencia mayor de cinco puntos porcentuales lleva explicación.
3. Todos los sitios del catálogo tienen `source` y `precision`.
4. Las cifras de [PITCH.md](../PITCH.md) se han recalculado con el terreno fino.
5. El script de validación se puede repetir con `npm run validate`.

## Pruebas

- El propio script es la prueba. Su salida se guarda en [VALIDACION-salida.md](../VALIDACION-salida.md).
- Automáticas: todo sitio tiene fuente y precisión, y ningún sitio etiquetado como región Artemis se presenta como coordenada publicada.
- En el navegador: la línea de fuente en el panel del sitio, en español e inglés.

## Fuera de alcance

- Comparación píxel a píxel con mapas de iluminación publicados.
- Validación con imágenes reales de la cámara LROC.

## Riesgos

- **Los artículos no se pueden consultar a tiempo.** La recogida de valores publicados es trabajo en paralelo desde el día 1.
- **Diferencias grandes sin explicación clara.** Se cuentan tal cual en los límites conocidos; ocultarlas costaría más credibilidad que mostrarlas. Ocurrió a ras de suelo, con diferencias de hasta 20 puntos, y están en el documento.
- **Coordenadas sin confirmar.** No se pudo confirmar el punto de VIPER ni el de Chang'e 7; quedan como representativos. Las coordenadas de misiones ya realizadas no se volvieron a contrastar una por una.

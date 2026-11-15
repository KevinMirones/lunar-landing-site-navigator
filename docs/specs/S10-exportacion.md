---
id: S10
titulo: Exportación de ventanas e informe
title: Window export and report
estado: hecha
dia: 4
prioridad: recortable
depende: S01, S08, S09
resumen: Descargar las ventanas en CSV e imprimir un informe de una página con la comparación.
summary: Download the windows as CSV and print a one-page report with the comparison.
---

<a id="en"></a>
**English** | [Español](#es)

# S10: Window export and report

## Problem

The results exist only on the screen. A mission team needs to take them into a spreadsheet or attach them to a decision record.

## Status

Implemented on 15 November and checked with automated tests ([export.test.ts](../../tests/export.test.ts), 9) and in the browser ([s10-exportacion.mjs](../../e2e/s10-exportacion.mjs), 13):

- **Criterion 2.** The `luz_solar` hours add up to the sunlight share of the table, in the automated test and in the app (720 h and 100% at Connecting Ridge).
- **Criterion 3.** The comparison CSV has one row per scenario with the figures of the table. With four scenarios the report fits on one page: the test generates the PDF and counts its pages.
- **Criterion 4.** The report carries the terrain resolution of each site, the visibility criteria and the link to reopen the comparison.
- **Criterion 6.** The downloads work with the built app and its security headers.

Criterion 1 is missing: opening the two CSVs in Excel and in Google Sheets. The format is designed for that (separator and decimals according to the language, byte order mark), but it has not been tried in those applications.

Differences from the design:

- **A4 landscape**, because the table has ten columns.
- **The report is mounted directly under `<body>`** while printing, so that the print stylesheet can remove the whole app. Hiding it with `visibility` left its gap and the report took five pages.
- **Comparison CSV:** besides the columns of the table, it carries the minimum battery, whether it is enough, and the daily contact. Cells that are not computed stay empty.
- **The names of the columns, the events and the files** are translated into English when the interface is in English.
- **The buttons are expert content** ([S12](S12-modo-educativo.md)).

## What the user will see

Three buttons in the header of "Compare scenarios":

- **Download windows (CSV):** one row per window of each scenario.
- **Download comparison (CSV):** the scenario table as it is shown.
- **Print report:** one page with the comparison, ready to save as PDF from the browser.

## Design

New `src/lib/export.ts` with pure functions that return text. Everything is generated in the browser and no library is added.

**Windows CSV**, with these columns:

```
escenario; sitio; latitud; longitud; alunizaje_utc; duracion_d; mastil_m; evento; inicio_utc; fin_utc; duracion_h; estacion
```

- `evento`: `luz_solar`, `enlace`, `contacto` (if there is a station network, [S09](S09-ventanas-de-contacto.md)) or `eclipse` ([S08](S08-energia-y-bateria.md)).
- `estacion` is filled in only in the `contacto` rows.
- The windows come from the same stretches the interface draws: `sunIntervals` and `earthIntervals` of `Metrics`, and the contact and eclipse ones from their specs.

**Comparison CSV:** one row per scenario, with the columns of the table and, if they exist, minimum battery, verdict and daily contact.

**Format of both:**

- Dates in ISO 8601 and UTC.
- With the interface in Spanish: separator `;` and decimal comma. In English: separator `,` and decimal point. That way Excel opens them correctly under each regional setting.
- UTF-8 byte order mark at the start, so that Excel reads the accents.
- File name: `lumina-ventanas-YYYY-MM-DD.csv` and `lumina-comparacion-YYYY-MM-DD.csv`.
- Download with a `Blob` and a temporary link. It has to be checked that it works with the built app and its security headers.

**Report:**

- New `Report` component, which mounts when the button is pressed, calls `window.print()` and unmounts when printing ends.
- Print stylesheet (`@media print`): it hides the rest of the app and switches to a white background with dark text, because the interface is dark.
- It does not depend on which panels are collapsed on screen.
- Content:
  - Generation date and the shareable link of the state ([S02](S02-enlaces-compartibles.md)), written out.
  - Scenario table with its window strips.
  - Power and contact of each scenario, if those specs are done.
  - Footer with the terrain resolution of each site, the visibility criteria (2% of the solar disc, half of Earth's disc, elevation margin) and the known limits.

## Acceptance criteria

1. The two CSVs open in Excel and in Google Sheets with the columns separated and the accents correct, in Spanish and in English.
2. The sum of `duracion_h` of `luz_solar` for a scenario, divided by its duration, matches the sunlight percentage of the table (one point of difference at most).
3. The comparison CSV has as many rows as scenarios and the same figures as the screen.
4. The report with four scenarios fits on one A4 page and is readable printed in black and white.
5. The report states the terrain resolution, the criteria used and the link to reopen the comparison.
6. The downloads work with the built app served by `npm start`.

## Tests

- Automated: generation of the two CSVs, separators by language and criteria 2 and 3.
- In the browser: that each button produces a download, in `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- By hand: criteria 1, 4 and 5.

## Out of scope

- KML or GeoJSON formats.
- Reports with several pages or additional charts.
- Generating the PDF without going through the print dialog.

## Risks

- **Possible cut:** the printable report is the first thing left out; the CSVs stay because they are cheap.
- **It depends on two specs.** If [S08](S08-energia-y-bateria.md) or [S09](S09-ventanas-de-contacto.md) are not there, the CSVs come out with sunlight and link only and the report omits those sections.

---

<a id="es"></a>
**Español** | [English](#en)

# S10: Exportación de ventanas e informe

## Problema

Los resultados solo existen en la pantalla. Un equipo de misión necesita llevárselos a una hoja de cálculo o adjuntarlos a un acta de decisión.

## Estado

Implementada el 15 de noviembre y comprobada con pruebas automáticas ([export.test.ts](../../tests/export.test.ts), 9) y en el navegador ([s10-exportacion.mjs](../../e2e/s10-exportacion.mjs), 13):

- **Criterio 2.** Las horas de `luz_solar` suman la parte de luz de la tabla, en la prueba automática y en la app (720 h y 100% en Connecting Ridge).
- **Criterio 3.** El CSV de comparación tiene una fila por escenario con las cifras de la tabla. Con cuatro escenarios el informe cabe en una página: la prueba genera el PDF y cuenta sus páginas.
- **Criterio 4.** El informe lleva la resolución del terreno de cada sitio, los criterios de visibilidad y el enlace para volver a abrir la comparación.
- **Criterio 6.** Las descargas funcionan con la versión compilada y sus cabeceras de seguridad.

Falta el criterio 1: abrir los dos CSV en Excel y en Google Sheets. El formato está pensado para eso (separador y decimales según el idioma, marca de orden de bytes), pero no se ha probado en esas aplicaciones.

Diferencias con el diseño:

- **A4 apaisado**, porque la tabla tiene diez columnas.
- **El informe se monta directamente bajo `<body>`** mientras se imprime, para que la hoja de impresión pueda quitar toda la app. Ocultarla con `visibility` dejaba su hueco y el informe ocupaba cinco páginas.
- **CSV de comparación:** además de las columnas de la tabla, lleva la batería mínima, si basta y el contacto diario. Las celdas que no se calculan quedan vacías.
- **Los nombres de las columnas, de los eventos y de los archivos** se traducen al inglés con la interfaz en inglés.
- **Los botones son contenido experto** ([S12](S12-modo-educativo.md)).

## Qué verá el usuario

Tres botones en la cabecera de "Comparar escenarios":

- **Descargar ventanas (CSV):** una fila por ventana de cada escenario.
- **Descargar comparación (CSV):** la tabla de escenarios tal como se ve.
- **Imprimir informe:** una página con la comparación, lista para guardar como PDF desde el navegador.

## Diseño

Nuevo `src/lib/export.ts` con funciones puras que devuelven texto. Todo se genera en el navegador y no se añade ninguna librería.

**CSV de ventanas**, con estas columnas:

```
escenario; sitio; latitud; longitud; alunizaje_utc; duracion_d; mastil_m; evento; inicio_utc; fin_utc; duracion_h; estacion
```

- `evento`: `luz_solar`, `enlace`, `contacto` (si hay red de estaciones, [S09](S09-ventanas-de-contacto.md)) o `eclipse` ([S08](S08-energia-y-bateria.md)).
- `estacion` solo se rellena en las filas de `contacto`.
- Las ventanas salen de los mismos tramos que dibuja la interfaz: `sunIntervals` y `earthIntervals` de `Metrics`, y los de contacto y eclipse de sus specs.

**CSV de comparación:** una fila por escenario, con las columnas de la tabla y, si existen, batería mínima, veredicto y contacto diario.

**Formato de ambos:**

- Fechas en ISO 8601 y UTC.
- Con la interfaz en español: separador `;` y coma decimal. En inglés: separador `,` y punto decimal. Así Excel los abre bien en cada configuración regional.
- Marca de orden de bytes UTF-8 al principio, para que Excel lea los acentos.
- Nombre del archivo: `lumina-ventanas-AAAA-MM-DD.csv` y `lumina-comparacion-AAAA-MM-DD.csv`.
- Descarga con un `Blob` y un enlace temporal. Hay que comprobar que funciona con la app compilada y sus cabeceras de seguridad.

**Informe:**

- Nuevo componente `Report`, que se monta al pulsar el botón, llama a `window.print()` y se desmonta al terminar la impresión.
- Hoja de estilos de impresión (`@media print`): esconde el resto de la app y pasa a fondo blanco con texto oscuro, porque la interfaz es oscura.
- No depende de qué paneles estén plegados en pantalla.
- Contenido:
  - Fecha de generación y el enlace compartible del estado ([S02](S02-enlaces-compartibles.md)), escrito.
  - Tabla de escenarios con sus franjas de ventanas.
  - Energía y contacto de cada escenario, si esas specs están hechas.
  - Pie con la resolución del terreno de cada sitio, los criterios de visibilidad (2% del disco solar, medio disco terrestre, margen de elevación) y los límites conocidos.

## Criterios de aceptación

1. Los dos CSV abren en Excel y en Google Sheets con las columnas separadas y los acentos correctos, en español y en inglés.
2. La suma de `duracion_h` de `luz_solar` de un escenario, dividida entre su duración, coincide con el porcentaje de luz de la tabla (diferencia de un punto como máximo).
3. El CSV de comparación tiene tantas filas como escenarios y las mismas cifras que la pantalla.
4. El informe con cuatro escenarios cabe en una página A4 y se lee impreso en blanco y negro.
5. El informe indica la resolución del terreno, los criterios usados y el enlace para reabrir la comparación.
6. Las descargas funcionan con la versión compilada servida por `npm start`.

## Pruebas

- Automáticas: generación de los dos CSV, separadores por idioma y criterios 2 y 3.
- En el navegador: que cada botón produce una descarga, en `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- A mano: criterios 1, 4 y 5.

## Fuera de alcance

- Formatos KML o GeoJSON.
- Informes con varias páginas o gráficos adicionales.
- Generar el PDF sin pasar por el diálogo de impresión.

## Riesgos

- **Recorte posible:** el informe imprimible es lo primero que se deja fuera; los CSV se conservan porque son baratos.
- **Depende de dos specs.** Si [S08](S08-energia-y-bateria.md) o [S09](S09-ventanas-de-contacto.md) no están, los CSV salen solo con luz y enlace y el informe omite esos apartados.

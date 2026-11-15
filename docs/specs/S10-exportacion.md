---
id: S10
titulo: Exportación de ventanas e informe
estado: pendiente
dia: 4
prioridad: recortable
depende: S01, S08, S09
resumen: Descargar las ventanas en CSV e imprimir un informe de una página con la comparación.
---

# S10: Exportación de ventanas e informe

## Problema

Los resultados solo existen en la pantalla. Un equipo de misión necesita llevárselos a una hoja de cálculo o adjuntarlos a un acta de decisión.

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

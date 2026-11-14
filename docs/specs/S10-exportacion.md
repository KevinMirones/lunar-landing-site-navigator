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

- "Descargar ventanas (CSV)": una fila por evento de cada escenario.
- "Descargar comparación (CSV)": la tabla de escenarios tal como se ve.
- "Imprimir informe": una página con la comparación, lista para guardar como PDF desde el navegador.

## Diseño

**CSV de eventos**, con estas columnas:

```
escenario; sitio; latitud; longitud; evento; inicio_utc; fin_utc; duracion_h
```

- `evento`: `luz_solar`, `enlace` o `contacto`.
- Fechas en ISO 8601 y UTC.
- Separador `;` con la interfaz en español y `,` en inglés, y marca de orden de bytes UTF-8 para que Excel lea bien los acentos.

**Informe:** hoja de estilos de impresión (`@media print`) sobre una vista dedicada. Contiene:

- Fecha de generación y enlace compartible del estado ([S02](S02-enlaces-compartibles.md)).
- Tabla de escenarios con franjas de ventanas.
- Energía y contacto de cada escenario ([S08](S08-energia-y-bateria.md), [S09](S09-ventanas-de-contacto.md)).
- Pie con la resolución del terreno usada, los criterios de visibilidad y los límites conocidos.

Todo se genera en el navegador. No se añade ninguna librería de PDF.

## Criterios de aceptación

1. El CSV abre en Excel y en Google Sheets con las columnas separadas y los acentos correctos.
2. La suma de `duracion_h` de `luz_solar` coincide con el porcentaje de luz de la tabla.
3. El informe con cuatro escenarios cabe en una página A4.
4. El informe indica la resolución del terreno y los criterios usados.

## Pruebas

- Automáticas: generación del CSV y criterio 2.
- A mano: criterios 1, 3 y 4.

## Fuera de alcance

- Formatos KML o GeoJSON.
- Informes con varias páginas o gráficos adicionales.

## Riesgos

- **Recorte posible:** el informe imprimible es lo primero que se deja fuera; el CSV se conserva porque es barato.
- **Depende de dos specs del mismo día.** Si alguna se retrasa, el CSV sale solo con luz y enlace.

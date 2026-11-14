---
id: S07
titulo: Validación científica y coordenadas oficiales
estado: hecha
dia: 3
prioridad: imprescindible
depende: S06
resumen: Tabla que compara nuestros resultados con los publicados, y cada sitio con su fuente.
---

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

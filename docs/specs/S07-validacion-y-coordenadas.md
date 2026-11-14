---
id: S07
titulo: Validación científica y coordenadas oficiales
estado: pendiente
dia: 3
prioridad: imprescindible
depende: S06
resumen: Tabla que compara nuestros resultados con los publicados, y cada sitio con su fuente.
---

# S07: Validación científica y coordenadas oficiales

## Problema

Las efemérides están validadas contra JPL Horizons, pero las ventanas de luz y de enlace no se han comparado con nada. Además, las coordenadas de los candidatos Artemis y del objetivo de Chang'e 7 se pusieron de memoria y son aproximadas. Un jurado técnico preguntará por ambas cosas.

## Qué verá el usuario

- Un documento `docs/VALIDACION.md` con una tabla "publicado frente a LUMINA".
- En cada sitio, la fuente de sus coordenadas y si son "publicadas" o "representativas".

## Diseño

**Validación de iluminación:**

- Referencias: Mazarico et al. (2011), *Icarus* 211, y Gläser et al. (2014), *Icarus* 243. Ambos dan porcentajes de iluminación para los puntos más iluminados del polo sur, a ras de suelo y a varias alturas.
- Esos promedios cubren un ciclo de precesión lunar de 18.6 años. Nuevo `scripts/validate-illumination.mjs` que calcula el mismo periodo con paso de seis horas. Son unas 27 000 muestras, menos de un segundo de efemérides.
- Para cada sitio de referencia: iluminación media, periodo de oscuridad más largo y diferencia con el valor publicado.

**Validación de enlace:** visibilidad de la Tierra desde Malapert frente a la literatura.

**Tabla resultante**, con estas columnas: sitio, magnitud, valor publicado, fuente, valor LUMINA, diferencia y comentario.

**Coordenadas:**

- Cada entrada de [sites.ts](../../src/lib/sites.ts) gana `fuente` (referencia o URL) y `precision` (`publicada` o `representativa`).
- Revisar las etiquetas "Candidato Artemis": NASA redujo la lista a nueve regiones en octubre de 2024 (Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2 y Slater Plain). Confirmarlo con la nota de NASA: Connecting Ridge figuraba en la lista de 2022 y podría no estar en la actual.

**Regla:** no se ajusta ningún parámetro para que los números coincidan. Las diferencias se explican (otra resolución, otra altura, otro periodo).

## Criterios de aceptación

1. `docs/VALIDACION.md` tiene al menos cinco comparaciones con su fuente.
2. Toda diferencia mayor de cinco puntos porcentuales lleva explicación.
3. Todos los sitios del catálogo tienen `fuente` y `precision`.
4. Las cifras de [PITCH.md](../PITCH.md) se han recalculado con el terreno fino.
5. El script de validación se puede repetir con `npm run validate`.

## Pruebas

- El propio script es la prueba. Se guarda su salida junto al documento.

## Fuera de alcance

- Comparación píxel a píxel con mapas de iluminación publicados.
- Validación con imágenes reales de la cámara LROC.

## Riesgos

- **Los artículos no se pueden consultar a tiempo.** La recogida de valores publicados es trabajo en paralelo desde el día 1.
- **Diferencias grandes sin explicación clara.** Se cuentan tal cual en los límites conocidos; ocultarlas costaría más credibilidad que mostrarlas.

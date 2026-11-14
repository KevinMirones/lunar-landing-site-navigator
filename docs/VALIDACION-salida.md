# Salida de `npm run validate`

Archivo generado por [validate-illumination.mjs](../scripts/validate-illumination.mjs). No se edita a mano; la interpretación está en [VALIDACION.md](VALIDACION.md).

- Terreno: mallas LOLA de 20, 40, 80, 240 m.
- Efemérides: 175320 instantes, uno por hora, desde el 1 de enero de 2017.
- Los porcentajes son de tiempo. "Dif." es LUMINA menos el valor publicado, en puntos porcentuales.

## 1. Mapas de NASA (18.6 años, a ras de suelo)

Publicado: productos `AVGVISIB_85S_060M_201608` y `AVGVISIB_85S_060M_201608_EARTH` del equipo LOLA, con terreno de 60 m. Dan la parte del tiempo en que se ve cualquier fracción del disco. LUMINA: mismo criterio, altura 0 m, 18.6 años desde 2017, con las mallas finas y, aparte, solo con la de 240 m. Entre paréntesis, el rango publicado en los 3 × 3 píxeles alrededor del punto (±60 m).

| Sitio | Malla fina | Sol NASA | Sol LUMINA | Dif. | Sol LUMINA, 240 m | Tierra NASA | Tierra LUMINA | Dif. | Tierra LUMINA, 240 m |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Connecting Ridge | 20 m | 44.3% (44.3 a 75.5) | 51.6% | +7.3 | 61.9% | 53.9% (50.3 a 58.2) | 52.6% | −1.3 | 53.8% |
| Shackleton Rim | 20 m | 87.1% (38.9 a 87.1) | 51.3% | −35.8 | 76.7% | 53.7% (30.9 a 53.7) | 52.2% | −1.5 | 49.0% |
| Shackleton Floor | 20 m | 0.0% (0.0 a 0.0) | 0.0% | +0.0 | 0.0% | 0.0% (0.0 a 0.0) | 0.0% | +0.0 | 0.0% |
| de Gerlache Rim | 20 m | 44.9% (44.3 a 61.0) | 18.7% | −26.2 | 50.4% | 61.2% (61.2 a 61.4) | 47.5% | −13.7 | 61.6% |
| Shackleton Rim East | 20 m | 50.0% (39.9 a 53.9) | 45.0% | −5.0 | 57.3% | 58.7% (45.3 a 60.6) | 59.4% | +0.7 | 60.7% |
| Malapert Massif | 40 m | 44.6% (2.6 a 69.5) | 49.9% | +5.2 | 63.5% | 73.0% (44.7 a 100.0) | 67.1% | −5.9 | 100.0% |
| Haworth | 40 m | 42.6% (40.2 a 42.9) | 42.3% | −0.3 | 42.4% | 60.7% (59.9 a 61.4) | 60.4% | −0.3 | 60.4% |
| Mons Mouton (VIPER) | 40 m | 42.9% (39.0 a 49.1) | 40.2% | −2.7 | 40.4% | 73.2% (58.4 a 84.5) | 65.7% | −7.4 | 68.7% |
| Nobile Rim | 40 m | 28.0% (21.3 a 33.1) | 24.9% | −3.1 | 36.8% | 46.7% (45.0 a 48.3) | 46.8% | +0.1 | 46.9% |
| IM-2 Athena | 40 m | 45.1% (40.3 a 46.9) | 46.5% | +1.4 | 46.3% | 92.1% (79.5 a 93.1) | 93.1% | +1.0 | 93.1% |
| Cabeus (LCROSS) | 40 m | 0.0% (0.0 a 0.0) | 0.0% | +0.0 | 0.0% | 18.6% (18.4 a 18.8) | 18.6% | −0.0 | 18.6% |

- Diferencia media en valor absoluto: Sol 7.9 puntos, Tierra 2.9 puntos, en 11 sitios.
- En los 3 sitios donde el valor publicado cambia menos de 5 puntos a ±60 m: Sol 0.1 puntos, Tierra 0.1 puntos.
- El valor de LUMINA cae dentro del rango publicado a ±60 m (con un punto de margen) en 10 de 11 sitios para el Sol y en 10 de 11 para la Tierra.

## 2. Puntos más iluminados del polo sur (20 años)

Publicado: Gläser et al. (2018), tablas 1 y 2, del 1 de enero de 2017 al 1 de enero de 2037, cada hora, con un modelo de terreno propio de 20 m. Las filas de Mazarico et al. (2011) son las que cita esa tabla 1. LUMINA: mismo periodo y paso, en las coordenadas publicadas, con las mallas LOLA del PDS. "Mejor a 40 m" es el punto con más visibilidad solar en una malla de 5 × 5 puntos separados 20 m.

| Sitio | Fuente | Altura | Magnitud | Publicado | LUMINA en el punto | Dif. | LUMINA, mejor a 40 m | Dif. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Connecting Ridge C1 | Gläser 2018, tabla 1 (20 m) | 0 m | Visibilidad solar | 81.3% | 66.3% | −15.0 | 68.2% | −13.1 |
| Connecting Ridge C1 | Gläser 2018, tabla 1 (20 m) | 0 m | Iluminación media | 76.0% | 61.1% | −14.9 | 61.1% | −14.9 |
| Connecting Ridge C1 | Gläser 2018, tabla 1 (20 m) | 0 m | Sombra más larga | 268 h | 488 h | +220.0 h | 1339 h | +1071.0 h |
| Connecting Ridge C1 | Mazarico 2011 (240 m) | 0 m | Visibilidad solar | 92.7% | 36.7% | −56.0 | 65.0% | −27.7 |
| Connecting Ridge C1 | Mazarico 2011 (240 m) | 0 m | Iluminación media | 89.0% | 33.1% | −55.9 | 59.8% | −29.2 |
| Connecting Ridge C1 | Mazarico 2011 (240 m) | 0 m | Sombra más larga | 141 h | 631 h | +489.9 h | 506 h | +364.9 h |
| Connecting Ridge C2 | Gläser 2018, tabla 1 (20 m) | 0 m | Visibilidad solar | 80.6% | 62.8% | −17.8 | 62.8% | −17.8 |
| Connecting Ridge C2 | Gläser 2018, tabla 1 (20 m) | 0 m | Iluminación media | 75.6% | 55.6% | −20.0 | 55.6% | −20.0 |
| Connecting Ridge C2 | Gläser 2018, tabla 1 (20 m) | 0 m | Sombra más larga | 166 h | 447 h | +281.0 h | 447 h | +281.0 h |
| Shackleton | Gläser 2018, tabla 1 (20 m) | 0 m | Visibilidad solar | 85.5% | 81.2% | −4.3 | 81.2% | −4.3 |
| Shackleton | Gläser 2018, tabla 1 (20 m) | 0 m | Iluminación media | 81.0% | 76.3% | −4.7 | 76.3% | −4.7 |
| Shackleton | Gläser 2018, tabla 1 (20 m) | 0 m | Sombra más larga | 221 h | 232 h | +11.0 h | 232 h | +11.0 h |
| Shackleton | Mazarico 2011 (240 m) | 0 m | Visibilidad solar | 90.5% | 0.0% | −90.5 | 38.5% | −52.0 |
| Shackleton | Mazarico 2011 (240 m) | 0 m | Iluminación media | 86.7% | 0.0% | −86.7 | 34.0% | −52.7 |
| Connecting Ridge C1 | Gläser 2018, tabla 2 (20 m) | 2 m | Visibilidad solar | 92.1% | 89.6% | −2.5 | 91.5% | −0.6 |
| Connecting Ridge C1 | Gläser 2018, tabla 2 (20 m) | 2 m | Iluminación media | 88.0% | 85.0% | −3.0 | 87.3% | −0.7 |
| Connecting Ridge C1 | Gläser 2018, tabla 2 (20 m) | 2 m | Sombra más larga | 112 h | 268 h | +156.0 h | 181 h | +69.0 h |
| Connecting Ridge C2 | Gläser 2018, tabla 2 (20 m) | 2 m | Visibilidad solar | 82.0% | 82.1% | +0.1 | 82.1% | +0.1 |
| Connecting Ridge C2 | Gläser 2018, tabla 2 (20 m) | 2 m | Iluminación media | 78.1% | 78.1% | +0.0 | 78.1% | +0.0 |
| Connecting Ridge C2 | Gläser 2018, tabla 2 (20 m) | 2 m | Sombra más larga | 165 h | 165 h | +0.0 h | 165 h | +0.0 h |
| Shackleton (a) | Gläser 2018, tabla 2 (20 m) | 2 m | Visibilidad solar | 89.4% | 89.4% | +0.0 | 89.5% | +0.1 |
| Shackleton (a) | Gläser 2018, tabla 2 (20 m) | 2 m | Iluminación media | 85.5% | 84.1% | −1.4 | 85.4% | −0.1 |
| Shackleton (a) | Gläser 2018, tabla 2 (20 m) | 2 m | Sombra más larga | 66 h | 66 h | +0.0 h | 67 h | +1.0 h |
| Shackleton (b) | Gläser 2018, tabla 2 (20 m) | 2 m | Visibilidad solar | 89.8% | 82.5% | −7.3 | 83.2% | −6.6 |
| Shackleton (b) | Gläser 2018, tabla 2 (20 m) | 2 m | Iluminación media | 82.1% | 75.8% | −6.3 | 76.2% | −5.9 |
| Shackleton (b) | Gläser 2018, tabla 2 (20 m) | 2 m | Sombra más larga | 65 h | 207 h | +142.0 h | 207 h | +142.0 h |

Las coordenadas de Mazarico et al. (2011) tienen dos decimales (unos 300 m en latitud). Lo que da el mapa de NASA de 60 m en esos mismos puntos:

| Punto | Sol, mapa de NASA en el píxel | Rango a ±60 m |
| --- | --- | --- |
| Connecting Ridge C1, 89.45°S 222.69°E | 0.0% | 0.0% a 86.4% |
| Shackleton, 89.78°S 204.27°E | 6.3% | 0.0% a 85.2% |

Gläser et al. (2014) dan para Connecting Ridge 92.27% de visibilidad solar a 2 m y 95.65% a 10 m, con periodos de oscuridad de 3 a 5 días. LUMINA, en el mejor punto a 40 m de C1:

| Altura | Publicado | LUMINA | Dif. | Sombra más larga LUMINA |
| --- | --- | --- | --- | --- |
| 2 m | 92.27% | 91.5% | −0.8 | 7.5 días |
| 10 m | 95.65% | 95.0% | −0.6 | 3.7 días |

## 3. Qué cambia el terreno fino

Mástil de 2 m, con los criterios de la app (luz: al menos 2% del disco solar; enlace: al menos 50% del disco de la Tierra). "Misión": 30 días desde el 14 de noviembre de 2026. "Año": los 365 días siguientes a esa fecha.

| Sitio | Malla fina | Luz misión, 240 m | Luz misión, fina | Enlace misión, 240 m | Enlace misión, fina | Luz año, 240 m | Luz año, fina | Enlace año, 240 m | Enlace año, fina |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Connecting Ridge | 20 m | 100% | 100% | 45% | 47% | 83% | 90% | 52% | 53% |
| Shackleton Rim | 20 m | 100% | 100% | 41% | 43% | 84% | 90% | 47% | 48% |
| de Gerlache Rim | 20 m | 71% | 75% | 49% | 49% | 58% | 58% | 56% | 56% |
| Malapert Massif | 40 m | 100% | 100% | 100% | 100% | 72% | 70% | 100% | 100% |
| Haworth | 40 m | 54% | 54% | 47% | 47% | 42% | 42% | 56% | 56% |
| Nobile Rim | 40 m | 60% | 53% | 36% | 36% | 42% | 35% | 43% | 43% |
| Mons Mouton (VIPER) | 40 m | 63% | 67% | 66% | 73% | 44% | 48% | 66% | 71% |
| Shackleton Floor | 20 m | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |

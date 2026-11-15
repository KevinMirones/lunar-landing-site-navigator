---
id: S16
titulo: Distancia a la sombra permanente
estado: hecha
dia: 5
prioridad: recortable
depende: S04, S07
resumen: Cada sitio dice a qué distancia tiene la zona en sombra permanente más cercana, donde puede conservarse hielo.
---

# S16: Distancia a la sombra permanente

## Problema

La consigna empieza diciendo que elegir sitio y fecha exige equilibrar las necesidades de ciencia y de ingeniería, y que el polo sur interesa por el hielo. El guion lo repite: "Ciencia quiere el hielo del fondo; ingeniería quiere la luz de la cresta. Aquí negocian con los mismos números." Pero la herramienta solo da números de ingeniería: luz, enlace, noche más larga. No hay ninguna cifra que diga qué gana la ciencia en cada sitio.

Esta spec no estaba en el plan original. Se añade como recortable porque cubre ese hueco con datos que NASA ya publica.

## Resultado

Hecha el 15 de noviembre, sin la capa opcional del mapa polar.

| Criterio | Resultado |
| --- | --- |
| 1. Fondo de Shackleton en sombra permanente | Sí |
| 2. Connecting Ridge fuera, con distancia | A 2.3 km al norte |
| 3. La celda devuelta es la más cercana | Comprobado contra una búsqueda exhaustiva en diez puntos |
| 4. Apollo 11 sin dato | Sí |
| 5. Distancia en la tabla y en el buscador | Sí, también en la vista sencilla |
| 6. Tamaño y memoria | Máscara de 3.06 MB (unos 210 KB comprimida en git). El servidor con la máscara cargada ocupa 35 MB en total |
| 7. Coste en el buscador | 40 a 50 ms para las 1257 celdas de la malla fina, frente a búsquedas de 5 a 30 s: menos del 1% |

Comprobado con [psr.test.js](../../tests/psr.test.js) (6 pruebas) y en el navegador con [s16-sombra.mjs](../../e2e/s16-sombra.mjs) (12 comprobaciones).

Otras cifras de los sitios del catálogo: Shackleton Rim a 2.1 km, Haworth a 1.8 km, IM-2 a 2.2 km, IM-1 a 4.7 km y la cima de Malapert a 7.9 km. Cabeus (LCROSS) está dentro, como el fondo de Shackleton.

**La máscara:** [build-psr.mjs](../../scripts/build-psr.mjs) recorta el mapa de NASA a 80°S y descarta 26 237 regiones de menos de 0.1 km². Quedan 6761 regiones y 20 340 km² en sombra permanente al sur de 80°S. Se reconstruye con `npm run fetch-data -- --psr` y `npm run build-psr`.

**Sin hacer:** la capa del mapa polar (opcional) y el valor precalculado para la copia estática de [S03](S03-ci-y-despliegue.md), que tampoco está hecha.

## Qué verá el usuario

- En el estado del sitio: "Sombra permanente más cercana: a 1.3 km al SE", o "Este punto está en sombra permanente".
- En la tabla de escenarios, una columna "Sombra permanente" con esa distancia.
- En los resultados del buscador de puntos, la misma distancia para cada punto propuesto.
- Una frase de veredicto que une las dos cosas, por ejemplo: "Luz el 100% de la misión y sombra permanente a 1.3 km: energía y ciencia al alcance de un rover."
- Opcional: una capa en el mapa polar que dibuja el contorno de las zonas en sombra permanente.
- Fuera de la zona cubierta, "sin dato".

Siempre se dice "sombra permanente", no "hielo": es donde el hielo puede conservarse, no donde está confirmado.

## Diseño

**Datos.** El equipo LOLA de NASA publica mapas de regiones en sombra permanente, del mismo trabajo que los mapas de iluminación usados en [S07](S07-validacion-y-coordenadas.md). Comprobado el 14 de noviembre de 2026:

| Producto | Celda | Cobertura | Tamaño | Formato |
| --- | --- | --- | --- | --- |
| `LPSR_75S_120M_201608` | 120 m | 75°S a 90°S | 116 MB | 7624 × 7624, enteros de 16 bits; cada celda vale "en sombra permanente" o "no" |

Está en proyección estereográfica polar, igual que el DEM.

**Máscara en el repositorio.** El mapa completo no cabe en el repositorio ni en el servidor público. Un script nuevo, `scripts/build-psr.mjs`:

- Descarga el producto con `npm run fetch-data -- --psr` a `server/data/published/`, que no va en el repositorio.
- Recorta a la zona con terreno real (80°S a 90°S) y descarta las regiones de menos de 0.1 km², que son celdas sueltas.
- Guarda un bit por celda en `server/data/psr_80s_120m.bin`: unos 3 MB, que sí van en el repositorio.

**Servidor.** Nuevo `server/psr.js`:

- `nearestPsr(lat, lon)` busca la celda en sombra más cercana en anillos crecientes, hasta 50 km. Devuelve si el punto está dentro, la distancia y el rumbo.
- `GET /api/psr?lat&lon` lo expone: `{ covered, inside, distanceKm, bearingDeg }`.
- `/api/search` añade `psrKm` a cada celda, con la búsqueda limitada a 20 km para no alargar el buscador.
- Para la copia estática de [S03](S03-ci-y-despliegue.md), `npm run precompute` guarda el valor de cada sitio del catálogo.

**Interfaz:**

- Línea en el estado del sitio y frase de veredicto en `Insights` de [Panels.tsx](../../src/components/Panels.tsx).
- Columna en `Compare` y en los resultados del buscador ([Search.tsx](../../src/components/Search.tsx)).
- El término "sombra permanente" entra en el glosario de [S12](S12-modo-educativo.md) y se ve también en la vista sencilla: es la parte que más interesa al público.
- Capa opcional en [PolarMap.tsx](../../src/components/PolarMap.tsx): la máscara reducida a la resolución del mapa de sombras, servida como `/api/psrmap` y dibujada como contorno.

**Qué no cambia.** El índice de viabilidad no incluye esta distancia: mezclar interés científico e ingeniería en un solo número escondería justo el compromiso que se quiere mostrar.

## Criterios de aceptación

1. El fondo de Shackleton (`shackleton-floor`) aparece como "en sombra permanente".
2. Connecting Ridge (`ridge`) no está en sombra permanente y muestra una distancia mayor que cero.
3. Para diez puntos de prueba, la celda devuelta está en sombra según la máscara y no hay ninguna más cercana (comprobado por búsqueda exhaustiva).
4. Apollo 11 muestra "sin dato".
5. La tabla de escenarios y el buscador de puntos muestran la distancia.
6. El archivo de la máscara pesa menos de 4 MB y el servidor no usa más de 20 MB adicionales.
7. El buscador de puntos no tarda más de un 20% más que antes.

## Pruebas

- Automáticas: criterios 1 a 4 y 6, con la máscara del repositorio.
- En el navegador: criterio 5, con un flujo nuevo en `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- A mano: criterio 7 y el aspecto de la capa del mapa.

## Fuera de alcance

- Temperatura del suelo y estabilidad del hielo.
- Abundancia de hidrógeno medida por otros instrumentos.
- Rutas de un rover hasta la sombra.
- Polo norte.

## Riesgos

- **Es recortable y va la última.** Si no se hace, la app no pierde nada de lo que ya tiene.
- **Se lee como "aquí hay hielo".** Todos los textos dicen "sombra permanente" y el glosario explica la diferencia.
- **La máscara y nuestro terreno no coinciden celda a celda.** La máscara viene de un modelo de 2016 a 120 m; nuestro horizonte usa mallas de 20 a 240 m. Un punto puede figurar en sombra permanente y recibir algo de luz en nuestro cálculo. Se indica la fuente junto al dato.

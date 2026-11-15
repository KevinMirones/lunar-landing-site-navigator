---
id: S11
titulo: Vista 3D del terreno
estado: pendiente
dia: 5
prioridad: recortable
depende: S06
resumen: Ver el paisaje real alrededor del sitio, con sus sombras y el Sol y la Tierra en el cielo.
---

# S11: Vista 3D del terreno

**Responsable:** Andrés, en una pista aparte del [plan](../PLAN.md#reparto). Las demás pistas no tocan esta spec ni adelantan nada de ella.

## Problema

El panorama muestra el horizonte como una silueta plana. La consigna sugiere "visualizaciones 3D de la superficie", y ver el relieve con sus sombras es lo que mejor transmite por qué el polo sur es difícil.

## Qué verá el usuario

- Una tercera pestaña en el mapa: "Terreno 3D", junto a "Polo sur" y "Globo".
- El relieve real alrededor del sitio, iluminado desde la dirección real del Sol.
- El Sol y la Tierra en el cielo, en su posición.
- Dos cámaras: "desde el módulo" (a la altura del mástil; se gira arrastrando o con las flechas) y "vista aérea".
- Un conmutador de exageración vertical: real o triple.
- Se mueve con la línea de tiempo y con la reproducción.
- Fuera de la zona con terreno real (al norte de 80°S), la pestaña aparece desactivada con su explicación, como el buscador de puntos.

## Diseño

**Dos parches anidados.** Un solo parche de 256 vértices de lado sobre 40 km daría un vértice cada 156 m y desperdiciaría el terreno de 20 m de [S06](S06-terreno-multirresolucion.md). Se usan dos, centrados en el sitio:

| Parche | Lado | Vértices | Un vértice cada | Para qué |
| --- | --- | --- | --- | --- |
| Cercano | 8 km | 256 × 256 | 31 m | Lo que rodea al módulo |
| Lejano | 64 km | 256 × 256 | 250 m | El paisaje y la vista aérea |

Más allá del parche lejano, el relieve se dibuja como una silueta tomada del perfil de horizonte del sitio, el mismo del panorama.

**Servicio** `GET /api/patch?lat&lon&size=8|64`:

- Devuelve una malla cuadrada de alturas en el plano tangente del sitio, con el este en `x` y el norte en `y`, tomada de la malla más fina disponible.
- Alturas relativas al suelo del sitio, en enteros de 16 bits y pasos de 0.5 m, con la curvatura lunar ya restada, para que el terreno lejano caiga bajo el horizonte.
- Cabeceras con el lado, el número de vértices y la resolución del terreno usado, como hace `/api/heightmap`.
- Error 400 fuera de cobertura.

**Parches precalculados.** El servidor público no tiene las mallas finas ([S03](S03-ci-y-despliegue.md)). `npm run precompute` guarda también los dos parches de cada sitio polar del catálogo en `server/data/patches/` (131 KB cada uno; unos 3 MB para los 12 sitios, que van en el repositorio). El servidor usa el precalculado cuando su terreno es más fino que el instalado, con la misma regla que los horizontes en [app.js](../../server/app.js). La copia estática de S03 los incluye.

**Dibujo** con `three.js`, que ya usa [Globe.tsx](../../src/components/Globe.tsx), en un componente nuevo `src/components/Terrain3D.tsx`:

- Dos planos de 256 × 256 vértices desplazados por sus alturas (unos 260 000 triángulos).
- **Sombras** con el método del mapa polar: en el sombreador, un rayo hacia el Sol recorre las alturas de los dos parches. Los mapas de sombras convencionales fallan con luz casi horizontal.
- **Relieve fuera de los parches.** En el polo, lo que tapa el Sol suele estar a más de 32 km. Además del rayo, un punto solo está iluminado si el Sol supera el perfil de horizonte del sitio en su azimut. Es exacto en el sitio y aproximado en los bordes del parche.
- **Coherencia con el resto de la app.** La intensidad de la luz se multiplica por la parte del disco solar visible en el sitio (`sunFrac`). Así el paisaje se apaga justo cuando el estado del sitio dice "Oculto".
- Cielo negro, sin atmósfera. El Sol y la Tierra se dibujan a escala, con una opción para ampliarlos.
- El componente se carga bajo demanda (`React.lazy`), para no aumentar la carga inicial.

**Enlace compartible.** El parámetro `v` de [urlState.ts](../../src/lib/urlState.ts) admite un valor más: `v=terrain`. La cámara y la exageración no se guardan.

## Criterios de aceptación

1. `/api/patch` devuelve altura 0 en el centro, y un punto llano a 32 km queda unos 295 m por debajo del plano, por la curvatura.
2. Desde la cámara del módulo, las cumbres del horizonte coinciden con la silueta del panorama en tres direcciones (diferencia menor de 1°).
3. El paisaje queda sin luz directa exactamente cuando el estado del sitio dice "Oculto".
4. Mantiene 30 fotogramas por segundo en una gráfica integrada.
5. Sin WebGL muestra un mensaje claro y el resto de la app sigue funcionando.
6. En un servidor sin mallas finas, un sitio del catálogo muestra el relieve precalculado y lo indica.
7. El enlace con `v=terrain` abre la vista 3D en otro navegador.

## Pruebas

- Automáticas: criterio 1, el uso del parche precalculado y el nuevo valor de `v`.
- En el navegador: que la pestaña dibuja algo y no deja errores en la consola, en `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- A mano: criterios 2 a 6. No hay pruebas automáticas del dibujo.

## Fuera de alcance

- Texturas fotográficas del terreno.
- Recorridos de un rover.
- Realidad virtual.
- Terreno 3D para puntos fuera de 80°S a 90°S.

## Riesgos

- **No llega a tiempo.** Tiene que estar mezclada en `main` antes de que empiece [S14](S14-robustez-y-calidad.md); si no, queda fuera de la versión 1.0. El panorama y el mapa polar ya cubren lo que exige la consigna.
- **Choca con otras pistas en los archivos comunes** (`App.tsx`, `urlState.ts`, `styles.css`, `server/app.js`). Lo propio de esta spec vive en `Terrain3D.tsx` y en el servicio `/api/patch`; en los archivos comunes solo entra la conexión.
- **Las sombras aproximadas no cuadran con el estado del sitio.** Por eso la luz se multiplica por `sunFrac`: el sitio manda.
- **Rendimiento en gráficas integradas.** El rayo tiene un número máximo de pasos, que el rendimiento adaptativo de [S14](S14-robustez-y-calidad.md) puede bajar.
- **Los parches precalculados hay que regenerarlos** si cambian las coordenadas del catálogo, en un equipo con las mallas finas (`npm run fetch-data -- --hires`, 345 MB).

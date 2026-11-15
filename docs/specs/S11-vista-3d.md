---
id: S11
titulo: Vista 3D del terreno
estado: en curso
dia: 5
prioridad: recortable
depende: S06
resumen: Ponerse en el sitio, a la altura del mástil, y mirar alrededor mientras el Sol y la Tierra se mueven sobre el relieve real.
---

# S11: Vista 3D del terreno

**Responsable:** Andrés, en una pista aparte del [plan](../PLAN.md#reparto). Las demás pistas no tocan esta spec ni adelantan nada de ella.

## Estado

**Fase 1 implementada** en la rama `feat/s11-vista-3d` (15 de noviembre de 2026). Pasa la verificación salvo `npm run e2e`, que todavía no existe ([S15](S15-pruebas-de-navegador.md)): el flujo `e2e/e2e-s11.mjs` se ejecutó con `playwright-core` instalado fuera del repositorio y pasa sus 13 comprobaciones.

Falta:

- **Parches precalculados** (criterio 11). El código está en `npm run precompute`, pero hay que ejecutarlo en el equipo que tenga las mallas finas y subir `server/data/patches/`. Mientras tanto, el servicio usa la malla instalada.
- **Rendimiento en una gráfica integrada real** (criterio 9). Medido solo en Edge sin ventana en el portátil de desarrollo.
- **Fase 2**, opcional.
- La revisión de otra persona y el pull request.

## Problema

El panorama muestra el horizonte como una silueta plana con la vertical exagerada unas 25 veces. Cuesta imaginar cómo se ve el sitio de verdad, y por qué una cumbre a 30 km basta para apagar el Sol. La consigna sugiere "visualizaciones 3D de la superficie". La referencia es Street View: te deja en un punto y puedes mirar a tu alrededor. La diferencia es que aquí el cielo no está quieto, porque el Sol y la Tierra siguen su recorrido.

## Qué verá el usuario

Se hace en dos fases. La fase 1 es el objetivo de esta spec. La fase 2 solo se hace si sobra tiempo antes de [S14](S14-robustez-y-calidad.md).

### Fase 1: vista desde el sitio

1. **Botón de expandir** en la esquina inferior derecha del panorama, con el texto "Ver en 3D".
2. Al pulsarlo, la vista 3D **ocupa toda la pantalla**. Se cierra con el botón ✕ o con `Esc`, y se vuelve a la app tal como estaba.
3. La cámara está **en el sitio, a la altura del mástil** (2, 10 o 50 m). Al abrir mira **hacia el Sol**, a su altura. Si el Sol está oculto, mira a la cumbre que lo tapa.
4. **Se gira** arrastrando con el ratón o con el dedo, y con las flechas del teclado. No hay zoom.
5. Se ve el **relieve real** alrededor del sitio, iluminado desde la dirección real del Sol y con sus sombras. Más allá de 32 km, las cumbres lejanas se ven como una silueta.
6. El **Sol y la Tierra** están en su posición real, junto con sus **trayectorias** durante todo el escenario (las mismas curvas que en el panorama). Por defecto se ven cuatro veces más grandes. Un conmutador "Escala real" los muestra a su tamaño verdadero (0.53° y 1.9°).
7. **El tiempo sigue corriendo.** Abajo hay reproducir y pausar, la velocidad, una barra para arrastrar la fecha y la fecha visible. Es el mismo estado que el de la app: al cerrar, el tiempo queda donde se dejó.
8. **Cambiar el mástil** desde la vista sube o baja la cámara con una transición suave. Al subir, el relieve se ve más bajo y el Sol queda menos tapado, como en el cálculo real. El mástil elegido queda elegido en la app.
9. **Exageración vertical**: un conmutador entre "Real" y "×3".
10. **Indicador mínimo** en una esquina: el rumbo ("Mirando al NE 42°"), el estado de los astros ("Sol visible 100% · Tierra oculta") y la resolución del terreno ("Terreno 240 m", con "(precalculado)" si viene del disco). No se dibuja nada más sobre el paisaje: ni rejilla, ni puntos cardinales, ni etiquetas.
11. Cielo negro, sin atmósfera, con un campo de estrellas decorativo como el del panorama.
12. **Fuera de la zona con terreno real** (al norte de 80°S), el botón aparece desactivado y explica por qué, como el buscador de puntos. También si el servidor no tiene la topografía.
13. **En móvil y tableta** funciona lo básico: girar con el dedo y controles de tiempo adaptados a pantalla pequeña, con calidad reducida.

### Fase 2: vista aérea (si sobra tiempo)

- Una tercera pestaña en el mapa, "Terreno 3D", junto a "Polo sur" y "Globo", con una cámara aérea que orbita sobre el sitio.
- Usa los mismos parches y el mismo sombreado que la fase 1.
- El enlace compartible la abre con `v=terrain`.

## Diseño

### Servicio de parches (servidor)

**Dos parches anidados**, centrados en el sitio, de 257 × 257 vértices. El número impar deja el sitio en el vértice central:

| Parche | Lado | Vértices | Un vértice cada | Para qué |
| --- | --- | --- | --- | --- |
| Cercano | 8 km | 257 × 257 | 31.25 m | Lo que rodea al módulo |
| Lejano | 64 km | 257 × 257 | 250 m | El paisaje hasta 32 km |

Con la malla de 240 m, que es la que tiene instalada la mayoría de los equipos, el parche cercano interpola: el suelo se ve liso, pero la geometría es correcta. Con las mallas finas de [S06](S06-terreno-multirresolucion.md), el mismo parche toma el detalle de 20 m sin cambiar código.

**`GET /api/patch?lat&lon&size=8|64`**, en [patch.js](../../server/patch.js) y conectado en [app.js](../../server/app.js):

- Devuelve una malla cuadrada de alturas en el plano tangente del sitio, con el este en `x`, el norte en `y` y la fila 0 en el borde norte. Cada vértice se toma de la malla más fina disponible (`heightAtXY` de [dem.js](../../server/dem.js)). La distancia en el plano se trata como distancia sobre la superficie: a 32 km, la diferencia es menor de 2 m.
- Las alturas son relativas al suelo del sitio, en enteros de 16 bits con pasos de 0.5 m. La curvatura lunar ya va restada, para que el terreno lejano caiga bajo el horizonte.
- Las cabeceras llevan el lado, el número de vértices y la resolución del terreno usado, como hace `/api/heightmap`: `X-Patch-Size-Km`, `X-Patch-Vertices`, `X-Patch-Resolution-M`, y `X-Patch-Precomputed: 1` cuando viene del disco.
- Responde con un error 400 al norte de 80°S o con otro tamaño, y con 503 si no hay ni terreno instalado ni parche precalculado.
- Cada parche tarda unos 22 ms en calcularse, y el servidor guarda los últimos 64.

**Parches precalculados.** El servidor público no tiene las mallas finas ([S03](S03-ci-y-despliegue.md)). `npm run precompute` guarda también los dos parches de cada sitio polar del catálogo en `server/data/patches/`: 132 KB cada uno, unos 3 MB para los 12 sitios, más un `index.json`. Van en el repositorio. El servidor usa el precalculado cuando su terreno es más fino que el instalado, con la misma regla que los horizontes. La copia estática de S03 los incluirá.

### Componente (cliente)

**[Terrain3D.tsx](../../src/components/Terrain3D.tsx)**, con `three.js`, que ya usa [Globe.tsx](../../src/components/Globe.tsx). La geometría que no es dibujo (direcciones, exageración, rumbo, vista inicial, anillo de cumbres) va en [terrain3d.ts](../../src/lib/terrain3d.ts), para probarla sin navegador.

- **Escena** en el marco local del sitio, en metros: el este en `x`, la vertical en `y` y el norte en `-z`. La cámara está en `(0, mástil, 0)`, con un campo de visión vertical de 60°, y la inclinación se limita entre −30° y +60°. El búfer de profundidad es logarítmico, para dibujar a la vez el suelo a 1 m y el cielo a 1000 km.
- **Terreno**: dos mallas desplazadas por sus alturas, unos 260 000 triángulos. La lejana tiene un hueco donde está la cercana y se recorta en un círculo de 32 km. Los últimos 250 m de la cercana se funden con la lejana, así que su borde cae justo sobre las aristas del hueco y no deja grietas.
- **Relieve más allá de 32 km**: una banda de 720 tramos, uno por azimut del perfil de horizonte (el mismo del panorama). Cada cumbre está a su distancia (`distanceKm`, al menos 32.5 km) y a la altura que da su ángulo visto desde el mástil. Así, lo que se ve desde la cámara coincide con el perfil del panorama.
- **Sombras en un mapa de luz.** Para cada vértice de cada parche, un sombreador recorre las alturas en dirección al Sol y guarda la parte del disco solar que queda a la vista. El rayo da 160 pasos crecientes (90 en pantallas estrechas) y llega a 46 km. El mapa solo se recalcula cuando el Sol se mueve; durante la reproducción, en cada fotograma. Si la cumbre que tapa el Sol en el perfil del sitio está más allá del parche, entra como obstáculo lejano para todos los puntos, corregido por su posición. Es exacto en el sitio y aproximado en los bordes. Los mapas de sombras convencionales fallan con luz casi horizontal, y un rayo por píxel de pantalla costaría demasiado.
- **El sitio manda alrededor del módulo.** En los primeros 150 m, la luz directa es la parte del disco solar visible en el sitio (`sky.sun.frac`), y hasta 1.5 km se funde con el mapa de luz. Así, el suelo alrededor del módulo se apaga justo cuando el estado del sitio dice "Oculto". Más lejos manda el mapa de luz, y por eso una cumbre puede seguir iluminada con el sitio a oscuras, como pasa en el polo. Esto cambia el diseño previo, que multiplicaba todo el paisaje por `sunFrac`.
- **Fotometría del regolito, simplificada.** Lommel-Seeliger, para que el suelo con el Sol a 1.5° no se vuelva negro, y una función de fase que lo hace brillante con el Sol a la espalda y oscuro a contraluz. Hay una luz ambiente mínima, para que el terreno en sombra se distinga del cielo.
- **Detalle procedural.** Las celdas LOLA miden 240 m (20 m como mucho), así que el relieve más fino es ruido. Son ondulaciones de 8 a 600 m que solo cambian la normal y el albedo, nunca la geometría ni las sombras, y se apagan donde un píxel cubre más que ellas. Bastan para leer la forma del suelo con luz rasante.
- **Cumbres lejanas**: la cara que mira a la cámara se trata como una ladera de 30° con la misma fotometría, iluminada si el Sol está sobre el horizonte ideal. Los últimos 7 km del parche lejano se funden con ese sombreado, para que su borde no se note contra la silueta.
- **Sol y Tierra**: discos en una esfera celeste de 1000 km centrada en la cámara, con su radio real (`sky.sun.radius`, `sky.earth.radius`) multiplicado por 4 si la escala real está apagada. El Sol lleva un halo. El terreno los tapa por profundidad, sin cálculo extra.
- **Trayectorias**: líneas sobre la misma esfera a partir de `series.sunAz/sunEl` y `series.earthAz/earthEl`, con hasta 2000 puntos. Se dibujan antes que los discos.
- **Exageración ×3**: la escena se estira verticalmente por 3, con la cámara incluida. Los astros y sus trayectorias se colocan con `atan(3 · tan(el))`, que es exactamente lo que el estiramiento hace a cualquier dirección. Por eso se conserva qué astro está tapado y cuál no. La inclinación de la cámara no cambia al conmutar, para que el horizonte siga a la vista.
- **Mástil**: la app vuelve a pedir el horizonte cuando cambia el mástil, y la vista conserva el anterior hasta que llega el nuevo. La cámara sube o baja en 0.6 s.
- **Controles de cámara**: el giro y la inclinación se controlan con eventos de puntero, para que el ratón y el dedo funcionen igual: la escena sigue al puntero, como en Street View. Las flechas mueven 5° por pulsación, salvo cuando la barra de tiempo tiene el foco. No se usa `OrbitControls`.
- **Calidad en pantallas pequeñas**: con menos de 700 px de ancho, la densidad de píxeles se limita a 1.5 y el rayo de sombra baja a 90 pasos. Es el mismo mecanismo que hará adaptativo [S14](S14-robustez-y-calidad.md).
- **Sin WebGL 2**: un mensaje claro dentro de la capa, que se cierra como siempre, y la app sigue funcionando debajo.
- **Carga bajo demanda** con `React.lazy`: el componente es un fragmento aparte de 21 KB (9 KB comprimido). `three.js` ya estaba en la carga inicial por el globo.
- **Se dibuja solo cuando algo cambia**: la cámara, el instante, el mástil o el tamaño de la ventana.

### Conexión con la app

En [App.tsx](../../src/App.tsx) solo entra la conexión: un estado `terrainOpen`, el motivo por el que el botón está desactivado y el componente perezoso. El componente recibe lo que la app ya calcula, sin duplicar estado: sitio, mástil, `horizon`, `sky`, `series`, el instante actual, el intervalo del escenario, `playing`, `speed` y las funciones para cambiar de instante, de reproducción, de velocidad y de mástil. El botón de expandir vive en [Panorama.tsx](../../src/components/Panorama.tsx), que recibe `expand: { onExpand, disabledReason }`. Los estilos van en la sección "3D view (S11)" al final de [styles.css](../../src/styles.css). Todos los textos van con `tr(es, en)`.

**Enlace compartible.** En la fase 1, la vista a pantalla completa no se guarda en el enlace. El valor `v=terrain` del parámetro `v` de [urlState.ts](../../src/lib/urlState.ts) queda reservado para la pestaña de la fase 2. La cámara y la exageración no se guardan nunca.

## Criterios de aceptación

Fase 1:

1. `/api/patch` devuelve altura 0 en el centro, y un punto llano a 32 km queda unos 295 m por debajo del plano, por la curvatura. **Cumple**: 0 m y entre −294 y −296 m en los cuatro bordes (prueba automática).
2. Con la escala real y el mástil a 2 m, las cumbres del horizonte coinciden con la silueta del panorama en tres direcciones distintas (diferencia menor de 1°). **Cumple**: en Connecting Ridge, el fondo de Shackleton y Malapert, a 30°, 150° y 270°, la diferencia es de 0.01° o menos en ocho de las nueve direcciones. La excepción es Malapert a 30°, con 0.93°: el panorama no mira el terreno a menos de media celda (120 m) y el parche sí lo dibuja.
3. Al pasar el mástil de 2 a 50 m, el horizonte visible baja y vuelve a coincidir con el perfil nuevo del panorama (diferencia menor de 1°). **Cumple**: 0.01° o menos en las nueve direcciones. En Connecting Ridge, por ejemplo, a 30° pasa de −1.92° a −1.98°.
4. El paisaje queda sin luz directa exactamente cuando el estado del sitio dice "Oculto". **Cumple** alrededor del módulo, por construcción: allí la luz es `sky.sun.frac`. Comprobado a mano en el fondo de Shackleton, donde el suelo está a oscuras y el borde opuesto del cráter, iluminado.
5. Al reproducir, el Sol y la Tierra se mueven sobre sus trayectorias. Al cerrar la vista, la barra de tiempo de la app muestra el mismo instante. **Cumple** (prueba de navegador).
6. Con "×3", un astro que estaba oculto sigue oculto y uno visible sigue visible. **Cumple** (prueba automática).
7. El botón está desactivado, con su explicación, en un sitio al norte de 80°S. **Cumple** (prueba de navegador, con Apollo 11).
8. `Esc` y el botón ✕ cierran la vista. Las flechas giran la cámara. **Cumple** (prueba de navegador: seis pulsaciones giran 30°).
9. Mantiene 30 fotogramas por segundo en una gráfica integrada, y se puede usar en un móvil de gama media. **A medias**: de 68 a 84 fotogramas por segundo durante la reproducción, en Edge sin ventana en el portátil de desarrollo. En un móvil emulado (390 × 844, táctil), la disposición cabe y el dedo gira la cámara. Falta medirlo en una gráfica integrada y un móvil reales.
10. Sin WebGL muestra un mensaje claro y el resto de la app sigue funcionando. **Cumple**: comprobado con WebGL desactivado en Edge.
11. En un servidor sin mallas finas, un sitio del catálogo con parche precalculado muestra ese relieve y lo indica. **Pendiente** de generar los parches. La elección entre parche precalculado e instalado está probada.

Fase 2:

12. La pestaña "Terreno 3D" muestra la vista aérea, y el enlace con `v=terrain` la abre en otro navegador. **Pendiente**.

## Pruebas

- **Automáticas**, en [patch.test.js](../../tests/patch.test.js) (12 pruebas) y [terrain3d.test.ts](../../tests/terrain3d.test.ts) (13 pruebas): el criterio 1, la orientación del parche, la elección entre parche precalculado e instalado, los errores 400, la conversión de azimut y elevación a dirección, el anillo de cumbres frente al perfil y la exageración (criterio 6). En la fase 2, el nuevo valor de `v` en [urlState.test.ts](../../tests/urlState.test.ts).
- **En el navegador**, en [e2e-s11.mjs](../../e2e/e2e-s11.mjs) ([S15](S15-pruebas-de-navegador.md)): abrir la vista, que dibuje algo, el indicador, girar con las flechas, el mástil, la reproducción, cerrar con `Esc`, que el instante y el mástil se conserven, y el botón desactivado al norte de 80°S. Sin errores en la consola.
- **A mano**: los criterios 2 a 4 y 9 a 11. No hay pruebas automáticas del dibujo. Los criterios 2 y 3 se midieron con un guion que recorre el parche de 64 km en tres direcciones y lo compara con `computeHorizon`.

## Fuera de alcance

- Zoom de la cámara.
- Brújula, rejilla de elevación, puntos cardinales y etiquetas sobre el paisaje.
- Fase de la Tierra. Se dibuja como un disco.
- Texturas fotográficas del terreno. El detalle procedural no pretende serlo.
- Recorridos de un rover o moverse por el terreno. La cámara solo gira.
- Realidad virtual.
- Terreno 3D para puntos fuera de 80°S a 90°S.

## Riesgos

- **No llega a tiempo.** Tiene que estar mezclada en `main` antes de que empiece [S14](S14-robustez-y-calidad.md). Si no, queda fuera de la versión 1.0. Por eso la fase 2 es opcional: la fase 1 sola ya cumple el objetivo. El panorama y el mapa polar cubren lo que exige la consigna.
- **Suelo liso con la malla de 240 m.** Cerca del módulo se ve poco relieve real hasta que alguien con las mallas finas genere los parches precalculados (`npm run fetch-data -- --hires`, 345 MB). El detalle procedural lo disimula, pero no lo sustituye. La silueta lejana no cambia, porque viene del perfil de horizonte.
- **Choca con otras pistas en los archivos comunes** (`App.tsx`, `Panorama.tsx`, `styles.css`, `server/app.js`). Lo propio de esta spec vive en `Terrain3D.tsx`, `terrain3d.ts` y `server/patch.js`. En los archivos comunes solo entra la conexión.
- **Las sombras aproximadas no cuadran con el estado del sitio.** Alrededor del módulo manda `sunFrac`. Más lejos, el mapa de luz puede equivocarse cerca del borde del parche, donde lo que tapa el Sol queda fuera.
- **Astros ampliados.** Un disco cuatro veces mayor puede verse tapado a medias cuando el real está entero, o al revés. El indicador muestra siempre la fracción real, y la escala real está a un clic.
- **Rendimiento en gráficas integradas y móviles.** El rayo tiene un número máximo de pasos, que se baja en pantallas pequeñas y que el rendimiento adaptativo de S14 podrá ajustar.
- **Los parches precalculados hay que regenerarlos** si cambian las coordenadas del catálogo, en un equipo con las mallas finas.

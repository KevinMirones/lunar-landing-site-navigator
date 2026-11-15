---
id: S11
titulo: Vista 3D del terreno
title: 3D view of the terrain
estado: hecha
dia: 5
prioridad: recortable
depende: S06
resumen: Ponerse en el sitio, a la altura del mástil, y mirar alrededor mientras el Sol y la Tierra se mueven sobre el relieve real.
summary: Stand at the site, at mast height, and look around while the Sun and Earth move over the real relief.
---

<a id="en"></a>
**English** | [Español](#es)

# S11: 3D view of the terrain

**Owner:** Andrés, on a separate track of the [plan](../PLAN.md#who-does-what). The other tracks do not touch this spec or get ahead on any of it.

## Status

**Phase 1 implemented** on the `feat/s11-vista-3d` branch (15 November 2026) and merged into `main`.

**Integrated with S08 to S16** the same day, on the `integracion-s11` branch:

- The browser flow is renamed [s11-vista-3d.mjs](../../e2e/s11-vista-3d.mjs) and uses the shared helpers of [S15](S15-pruebas-de-navegador.md), so it is part of `npm run e2e`.
- **Precomputed patches (criterion 11): done.** `npm run precompute` was run on a machine with the fine grids: 24 patches and their index in `server/data/patches/` (3.2 MB). The 36 horizons the same script writes came out identical to the ones already there.

Missing:

- **Performance on a real integrated graphics card** (criterion 9). Measured only in headless Edge on the development laptop.
- **Phase 2**, optional.
- Review by another person and the pull request.

## Problem

The panorama shows the horizon as a flat silhouette with the vertical exaggerated about 25 times. It is hard to picture what the site really looks like, and why a summit 30 km away is enough to put out the Sun. The challenge brief suggests "3D visualisations of the surface". The reference is Street View: it puts you at a point and you can look around. The difference is that here the sky does not stand still, because the Sun and Earth follow their paths.

## What the user will see

It is done in two phases. Phase 1 is the goal of this spec. Phase 2 is only done if there is time to spare before [S14](S14-robustez-y-calidad.md).

### Phase 1: view from the site

1. **Expand button** in the bottom right corner of the panorama, with the text "View in 3D".
2. Pressing it makes the 3D view **fill the whole screen**. It closes with the ✕ button or with `Esc`, returning to the app as it was.
3. The camera is **at the site, at mast height** (2, 10 or 50 m). On opening it looks **towards the Sun**, at its height. If the Sun is hidden, it looks at the summit that covers it.
4. **It turns** by dragging with the mouse or a finger, and with the arrow keys. There is no zoom.
5. You see the **real relief** around the site, lit from the real direction of the Sun and with its shadows. Beyond 32 km, the distant summits show as a silhouette.
6. The **Sun and Earth** are at their real position, together with their **paths** over the whole scenario (the same curves as in the panorama). By default they are shown four times larger. A "True scale" switch shows them at their real size (0.53° and 1.9°).
7. **Time keeps running.** At the bottom there are play and pause, the speed, a bar to drag the date, and the visible date. It is the same state as the app's: on closing, time stays where it was left.
8. **Changing the mast** from the view raises or lowers the camera with a smooth transition. Going up, the relief looks lower and the Sun is less covered, as in the real computation. The mast chosen stays chosen in the app.
9. **Vertical exaggeration**: a switch between "Real" and "×3".
10. **Minimal indicator** in a corner: the heading ("Looking NE 42°"), the state of the bodies ("Sun visible 100% · Earth hidden") and the terrain resolution ("Terrain 240 m", with "(precomputed)" if it comes from disk). Nothing else is drawn over the landscape: no grid, no cardinal points, no labels.
11. Black sky, no atmosphere, with a decorative star field like the panorama's.
12. **Where there is no topography**, the button appears disabled and explains why. Since [S17](S17-relieve-global.md) that only happens with a custom point away from the pole, on a server without the global grid; before, it happened everywhere north of 80°S.
13. **On phone and tablet** the basics work: turning with a finger and time controls adapted to a small screen, at reduced quality.

### Phase 2: aerial view (if there is time)

- A third tab on the map, "3D terrain", next to "South pole" and "Globe", with an aerial camera that orbits over the site.
- It uses the same patches and the same shading as phase 1.
- The shareable link opens it with `v=terrain`.

## Design

### Patch service (server)

**Two nested patches**, centred on the site, of 257 × 257 vertices. The odd number leaves the site on the centre vertex:

| Patch | Side | Vertices | One vertex every | What for |
| --- | --- | --- | --- | --- |
| Near | 8 km | 257 × 257 | 31.25 m | What surrounds the lander |
| Far | 64 km | 257 × 257 | 250 m | The landscape out to 32 km |

With the 240 m grid, which is the one most machines have installed, the near patch interpolates: the ground looks smooth, but the geometry is correct. With the fine grids of [S06](S06-terreno-multirresolucion.md), the same patch picks up the 20 m detail with no code change.

**`GET /api/patch?lat&lon&size=8|64`**, in [patch.js](../../server/patch.js) and wired up in [app.js](../../server/app.js):

- It returns a square grid of heights in the tangent plane of the site, with east on `x`, north on `y` and row 0 on the northern edge. Each vertex is taken from the finest grid available (`heightAtXY` of [dem.js](../../server/dem.js)). Distance in the plane is treated as distance over the surface: at 32 km, the difference is under 2 m.
- The heights are relative to the ground at the site, in 16-bit integers with 0.5 m steps. The Moon's curvature is already subtracted, so that distant terrain drops below the horizon.
- The headers carry the side, the number of vertices and the resolution of the terrain used, as `/api/heightmap` does: `X-Patch-Size-Km`, `X-Patch-Vertices`, `X-Patch-Resolution-M`, and `X-Patch-Precomputed: 1` when it comes from disk.
- It answers with a 400 error if the size is neither 8 nor 64 km, and with 503 if at that point there is neither installed terrain nor a precomputed patch. Until [S17](S17-relieve-global.md) it also rejected points north of 80°S.
- Each patch takes about 22 ms to compute, and the server keeps the last 64.

**Precomputed patches.** The public server does not have the fine grids ([S03](S03-ci-y-despliegue.md)). `npm run precompute` also saves the two patches of each polar catalogue site in `server/data/patches/`: 132 KB each, about 3 MB for the 12 sites, plus an `index.json`. They go in the repository. The server uses the precomputed one when its terrain is finer than the installed one, with the same rule as the horizons. The static copy of S03 will include them.

### Component (client)

**[Terrain3D.tsx](../../src/components/Terrain3D.tsx)**, with `three.js`, which [Globe.tsx](../../src/components/Globe.tsx) already uses. The geometry that is not drawing (directions, exaggeration, heading, initial view, ring of summits) goes in [terrain3d.ts](../../src/lib/terrain3d.ts), so it can be tested without a browser.

- **Scene** in the local frame of the site, in metres: east on `x`, the vertical on `y` and north on `-z`. The camera is at `(0, mast, 0)`, with a 60° vertical field of view, and the tilt is limited to between −30° and +60°. The depth buffer is logarithmic, to draw at once the ground at 1 m and the sky at 1000 km.
- **Terrain**: two meshes displaced by their heights, about 260 000 triangles. The far one has a hole where the near one is and is clipped to a 32 km circle. The last 250 m of the near one blend into the far one, so its edge falls right on the edges of the hole and leaves no cracks.
- **Relief beyond 32 km**: a band of 720 segments, one per azimuth of the horizon profile (the same as the panorama's). Each summit is at its distance (`distanceKm`, at least 32.5 km) and at the height given by its angle seen from the mast. That way, what is seen from the camera matches the panorama's profile.
- **Shadows in a light map.** For each vertex of each patch, a shader walks the heights towards the Sun and stores the part of the solar disc left in view. The ray takes 160 growing steps (90 on narrow screens) and reaches 46 km. The map is only recomputed when the Sun moves; during playback, on every frame. If the summit that covers the Sun in the site's profile is beyond the patch, it goes in as a distant obstacle for all points, corrected for their position. It is exact at the site and approximate at the edges. Conventional shadow maps fail with nearly horizontal light, and one ray per screen pixel would cost too much.
- **The site rules around the lander.** In the first 150 m, the direct light is the part of the solar disc visible at the site (`sky.sun.frac`), and out to 1.5 km it blends into the light map. That way, the ground around the lander goes dark exactly when the site status says "Hidden". Further out the light map rules, which is why a summit can stay lit with the site in darkness, as happens at the pole. This changes the earlier design, which multiplied the whole landscape by `sunFrac`.
- **Regolith photometry, simplified.** Lommel-Seeliger, so that the ground with the Sun at 1.5° does not turn black, and a phase function that makes it bright with the Sun behind you and dark against the light. There is a minimal ambient light, so that terrain in shadow can be told from the sky.
- **Procedural detail.** The LOLA cells are 240 m (20 m at best), so the finer relief is noise. It is undulations of 8 to 600 m that only change the normal and the albedo, never the geometry or the shadows, and fade out where a pixel covers more than they do. They are enough to read the shape of the ground under grazing light.
- **Distant summits**: the face looking at the camera is treated as a 30° slope with the same photometry, lit if the Sun is above the ideal horizon. The last 7 km of the far patch blend into that shading, so its edge does not show against the silhouette.
- **Sun and Earth**: discs on a celestial sphere of 1000 km centred on the camera, with their real radius (`sky.sun.radius`, `sky.earth.radius`) multiplied by 4 if true scale is off. The Sun has a halo. The terrain covers them by depth, with no extra computation.
- **Paths**: lines on the same sphere from `series.sunAz/sunEl` and `series.earthAz/earthEl`, with up to 2000 points. They are drawn before the discs.
- **×3 exaggeration**: the scene is stretched vertically by 3, camera included. The bodies and their paths are placed with `atan(3 · tan(el))`, which is exactly what the stretch does to any direction. That is why which body is covered and which is not is preserved. The camera tilt does not change on switching, so that the horizon stays in view.
- **Mast**: the app asks for the horizon again when the mast changes, and the view keeps the previous one until the new one arrives. The camera goes up or down in 0.6 s.
- **Camera controls**: turning and tilting are handled with pointer events, so that mouse and finger work the same: the scene follows the pointer, as in Street View. The arrows move 5° per press, except when the time bar has the focus. `OrbitControls` is not used.
- **Quality on small screens**: under 700 px wide, the pixel density is limited to 1.5 and the shadow ray drops to 90 steps. It is the same mechanism that [S14](S14-robustez-y-calidad.md) will make adaptive.
- **Without WebGL 2**: a clear message inside the layer, which closes as usual, and the app keeps working underneath.
- **Loaded on demand** with `React.lazy`: the component is a separate chunk of 21 KB (9 KB compressed). `three.js` was already in the initial load because of the globe.
- **It is drawn only when something changes**: the camera, the instant, the mast or the window size.

### Connection with the app

Only the wiring goes into [App.tsx](../../src/App.tsx): a `terrainOpen` state, the reason the button is disabled and the lazy component. The component receives what the app already computes, without duplicating state: site, mast, `horizon`, `sky`, `series`, the current instant, the scenario's interval, `playing`, `speed` and the functions to change instant, playback, speed and mast. The expand button lives in [Panorama.tsx](../../src/components/Panorama.tsx), which receives `expand: { onExpand, disabledReason }`. The styles go in the "3D view (S11)" section at the end of [styles.css](../../src/styles.css). All texts go through `tr(es, en)`.

**Shareable link.** In phase 1, the full-screen view is not saved in the link. The `v=terrain` value of the `v` parameter of [urlState.ts](../../src/lib/urlState.ts) is reserved for the phase 2 tab. The camera and the exaggeration are never saved.

## Acceptance criteria

Phase 1:

1. `/api/patch` returns height 0 at the centre, and a flat point 32 km away lies about 295 m below the plane, because of the curvature. **Met**: 0 m and between −294 and −296 m on the four edges (automated test).
2. With true scale and the mast at 2 m, the summits of the horizon match the panorama's silhouette in three different directions (difference under 1°). **Met**: at Connecting Ridge, the floor of Shackleton and Malapert, at 30°, 150° and 270°, the difference is 0.01° or less in eight of the nine directions. The exception is Malapert at 30°, with 0.93°: the panorama does not look at terrain closer than half a cell (120 m) and the patch does draw it.
3. Taking the mast from 2 to 50 m, the visible horizon drops and matches the panorama's new profile again (difference under 1°). **Met**: 0.01° or less in the nine directions. At Connecting Ridge, for example, at 30° it goes from −1.92° to −1.98°.
4. The landscape is left without direct light exactly when the site status says "Hidden". **Met** around the lander, by construction: there the light is `sky.sun.frac`. Checked by hand on the floor of Shackleton, where the ground is in darkness and the opposite rim of the crater is lit.
5. On playing, the Sun and Earth move along their paths. On closing the view, the app's time bar shows the same instant. **Met** (browser test).
6. With "×3", a body that was hidden stays hidden and a visible one stays visible. **Met** (automated test).
7. The button is disabled, with its explanation, where there is no topography. **Met** (browser test: first with Apollo 11; since [S17](S17-relieve-global.md), with a custom point at 10°N).
8. `Esc` and the ✕ button close the view. The arrows turn the camera. **Met** (browser test: six presses turn 30°).
9. It holds 30 frames per second on an integrated graphics card, and is usable on a mid-range phone. **Partly**: 68 to 84 frames per second during playback, in headless Edge on the development laptop. On an emulated phone (390 × 844, touch), the layout fits and a finger turns the camera. Still to be measured on a real integrated graphics card and a real phone.
10. Without WebGL it shows a clear message and the rest of the app keeps working. **Met**: checked with WebGL disabled in Edge.
11. On a server without fine grids, a catalogue site with a precomputed patch shows that relief and says so. **Pending** generation of the patches. The choice between precomputed and installed patch is tested.

Phase 2:

12. The "3D terrain" tab shows the aerial view, and the link with `v=terrain` opens it in another browser. **Pending**.

## Tests

- **Automated**, in [patch.test.js](../../tests/patch.test.js) (12 tests) and [terrain3d.test.ts](../../tests/terrain3d.test.ts) (13 tests): criterion 1, the orientation of the patch, the choice between precomputed and installed patch, the 400 errors, the conversion from azimuth and elevation to direction, the ring of summits against the profile and the exaggeration (criterion 6). In phase 2, the new value of `v` in [urlState.test.ts](../../tests/urlState.test.ts).
- **In the browser**, in [s11-vista-3d.mjs](../../e2e/s11-vista-3d.mjs) ([S15](S15-pruebas-de-navegador.md)): opening the view, that it draws something, the indicator, turning with the arrows, the mast, playback, closing with `Esc`, that the instant and the mast are kept, and the disabled button where there is no topography. No errors in the console.
- **By hand**: criteria 2 to 4 and 9 to 11. There are no automated tests of the drawing. Criteria 2 and 3 were measured with a script that walks the 64 km patch in three directions and compares it with `computeHorizon`.

## Out of scope

- Camera zoom.
- Compass, elevation grid, cardinal points and labels over the landscape.
- Phase of Earth. It is drawn as a disc.
- Photographic textures of the terrain. The procedural detail does not claim to be one.
- Rover traverses or moving across the terrain. The camera only turns.
- Virtual reality.
- 3D terrain for points outside 80°S to 90°S. [S17](S17-relieve-global.md) adds it.

## Risks

- **It is not ready in time.** It has to be merged into `main` before [S14](S14-robustez-y-calidad.md) starts. If not, it stays out of version 1.0. That is why phase 2 is optional: phase 1 alone already meets the goal. The panorama and the polar map cover what the brief requires.
- **Smooth ground with the 240 m grid.** Near the lander little real relief shows until someone with the fine grids generates the precomputed patches (`npm run fetch-data -- --hires`, 345 MB). The procedural detail disguises it, but does not replace it. The distant silhouette does not change, because it comes from the horizon profile.
- **It collides with other tracks in the shared files** (`App.tsx`, `Panorama.tsx`, `styles.css`, `server/app.js`). What belongs to this spec lives in `Terrain3D.tsx`, `terrain3d.ts` and `server/patch.js`. Only the wiring goes into the shared files.
- **The approximate shadows do not match the site status.** Around the lander `sunFrac` rules. Further out, the light map can be wrong near the edge of the patch, where what covers the Sun lies outside.
- **Enlarged bodies.** A disc four times larger can look half covered when the real one is whole, or the other way round. The indicator always shows the real fraction, and true scale is one click away.
- **Performance on integrated graphics and phones.** The ray has a maximum number of steps, which is lowered on small screens and which the adaptive performance of S14 will be able to adjust.
- **The precomputed patches have to be regenerated** if the catalogue coordinates change, on a machine with the fine grids.

---

<a id="es"></a>
**Español** | [English](#en)

# S11: Vista 3D del terreno

**Responsable:** Andrés, en una pista aparte del [plan](../PLAN.md#reparto). Las demás pistas no tocan esta spec ni adelantan nada de ella.

## Estado

**Fase 1 implementada** en la rama `feat/s11-vista-3d` (15 de noviembre de 2026) y mezclada en `main`.

**Integrada con S08 a S16** el mismo día, en la rama `integracion-s11`:

- El flujo de navegador pasa a llamarse [s11-vista-3d.mjs](../../e2e/s11-vista-3d.mjs) y usa las utilidades comunes de [S15](S15-pruebas-de-navegador.md), así que entra en `npm run e2e`.
- **Parches precalculados (criterio 11): hechos.** `npm run precompute` se ejecutó en un equipo con las mallas finas: 24 parches y su índice en `server/data/patches/` (3.2 MB). Los 36 horizontes que escribe el mismo script salieron idénticos a los que ya estaban.

Falta:

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
12. **Donde no hay topografía**, el botón aparece desactivado y explica por qué. Desde [S17](S17-relieve-global.md) eso solo pasa con un punto propio fuera del polo, en un servidor sin la malla global; antes pasaba en todo lo que quedara al norte de 80°S.
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
- Responde con un error 400 si el tamaño no es 8 ni 64 km, y con 503 si en ese punto no hay ni terreno instalado ni parche precalculado. Hasta [S17](S17-relieve-global.md) también rechazaba los puntos al norte de 80°S.
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
7. El botón está desactivado, con su explicación, donde no hay topografía. **Cumple** (prueba de navegador: primero con Apollo 11; desde [S17](S17-relieve-global.md), con un punto propio a 10°N).
8. `Esc` y el botón ✕ cierran la vista. Las flechas giran la cámara. **Cumple** (prueba de navegador: seis pulsaciones giran 30°).
9. Mantiene 30 fotogramas por segundo en una gráfica integrada, y se puede usar en un móvil de gama media. **A medias**: de 68 a 84 fotogramas por segundo durante la reproducción, en Edge sin ventana en el portátil de desarrollo. En un móvil emulado (390 × 844, táctil), la disposición cabe y el dedo gira la cámara. Falta medirlo en una gráfica integrada y un móvil reales.
10. Sin WebGL muestra un mensaje claro y el resto de la app sigue funcionando. **Cumple**: comprobado con WebGL desactivado en Edge.
11. En un servidor sin mallas finas, un sitio del catálogo con parche precalculado muestra ese relieve y lo indica. **Pendiente** de generar los parches. La elección entre parche precalculado e instalado está probada.

Fase 2:

12. La pestaña "Terreno 3D" muestra la vista aérea, y el enlace con `v=terrain` la abre en otro navegador. **Pendiente**.

## Pruebas

- **Automáticas**, en [patch.test.js](../../tests/patch.test.js) (12 pruebas) y [terrain3d.test.ts](../../tests/terrain3d.test.ts) (13 pruebas): el criterio 1, la orientación del parche, la elección entre parche precalculado e instalado, los errores 400, la conversión de azimut y elevación a dirección, el anillo de cumbres frente al perfil y la exageración (criterio 6). En la fase 2, el nuevo valor de `v` en [urlState.test.ts](../../tests/urlState.test.ts).
- **En el navegador**, en [s11-vista-3d.mjs](../../e2e/s11-vista-3d.mjs) ([S15](S15-pruebas-de-navegador.md)): abrir la vista, que dibuje algo, el indicador, girar con las flechas, el mástil, la reproducción, cerrar con `Esc`, que el instante y el mástil se conserven, y el botón desactivado donde no hay topografía. Sin errores en la consola.
- **A mano**: los criterios 2 a 4 y 9 a 11. No hay pruebas automáticas del dibujo. Los criterios 2 y 3 se midieron con un guion que recorre el parche de 64 km en tres direcciones y lo compara con `computeHorizon`.

## Fuera de alcance

- Zoom de la cámara.
- Brújula, rejilla de elevación, puntos cardinales y etiquetas sobre el paisaje.
- Fase de la Tierra. Se dibuja como un disco.
- Texturas fotográficas del terreno. El detalle procedural no pretende serlo.
- Recorridos de un rover o moverse por el terreno. La cámara solo gira.
- Realidad virtual.
- Terreno 3D para puntos fuera de 80°S a 90°S. Lo añade [S17](S17-relieve-global.md).

## Riesgos

- **No llega a tiempo.** Tiene que estar mezclada en `main` antes de que empiece [S14](S14-robustez-y-calidad.md). Si no, queda fuera de la versión 1.0. Por eso la fase 2 es opcional: la fase 1 sola ya cumple el objetivo. El panorama y el mapa polar cubren lo que exige la consigna.
- **Suelo liso con la malla de 240 m.** Cerca del módulo se ve poco relieve real hasta que alguien con las mallas finas genere los parches precalculados (`npm run fetch-data -- --hires`, 345 MB). El detalle procedural lo disimula, pero no lo sustituye. La silueta lejana no cambia, porque viene del perfil de horizonte.
- **Choca con otras pistas en los archivos comunes** (`App.tsx`, `Panorama.tsx`, `styles.css`, `server/app.js`). Lo propio de esta spec vive en `Terrain3D.tsx`, `terrain3d.ts` y `server/patch.js`. En los archivos comunes solo entra la conexión.
- **Las sombras aproximadas no cuadran con el estado del sitio.** Alrededor del módulo manda `sunFrac`. Más lejos, el mapa de luz puede equivocarse cerca del borde del parche, donde lo que tapa el Sol queda fuera.
- **Astros ampliados.** Un disco cuatro veces mayor puede verse tapado a medias cuando el real está entero, o al revés. El indicador muestra siempre la fracción real, y la escala real está a un clic.
- **Rendimiento en gráficas integradas y móviles.** El rayo tiene un número máximo de pasos, que se baja en pantallas pequeñas y que el rendimiento adaptativo de S14 podrá ajustar.
- **Los parches precalculados hay que regenerarlos** si cambian las coordenadas del catálogo, en un equipo con las mallas finas.

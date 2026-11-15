---
id: S17
titulo: Relieve en toda la Luna
estado: hecha
dia: 7
prioridad: recortable
depende: S06, S11, S13
resumen: Los sitios fuera del polo sur, como los del programa Apollo, tienen horizonte con relieve real y vista 3D, igual que los del polo.
---

# S17: Relieve en toda la Luna

## Problema

Desde [S13](S13-catalogo-y-polo-norte.md), el catálogo tiene 25 sitios fuera del polo sur: Apollo, Luna, Surveyor, Chang'e, SLIM, Chandrayaan-3 y Blue Ghost. El servidor solo tiene topografía de 75°S al polo. Por eso, al norte de 80°S:

- El horizonte es el de una esfera lisa y el panorama sale plano.
- La vista 3D de [S11](S11-vista-3d.md) está desactivada.
- El estado dice "se usa una Luna lisa".

Al probar `main` el 15 de noviembre, lo primero que se echó en falta fue el relieve de Apollo 11.

Sin relieve, la comparación entre sitios es injusta: un sitio rodeado de montañas, como Apollo 15 o Apollo 17, parece tan despejado como una llanura.

## Resultado

Hecha el 15 de noviembre. Se cumplen los 12 criterios.

| Criterio | Resultado |
| --- | --- |
| 1. Apollo 15 | Mons Hadley se ve a 11.0° (azimut 44°, a 19.7 km) y Hadley Delta a 13.3° (azimut 178°, a 10.9 km) |
| 2. Apollo 17 | El North Massif se ve a 13.7° (a 6.2 km) y el South Massif a 7.0° (a 11.6 km) |
| 3. Apollo 11 | El punto más alto del horizonte está a 0.97° |
| 4. Malla polar contra global | Las medianas son 0.06°, 0.35°, 0.03°, 0.48° y 0.05° en los cinco puntos. La de 0.48° va justa: cerca del sitio pesan las celdas de 474 m de norte a sur |
| 5. Punto propio con la malla | "LOLA de 474 m" y vista 3D a 10°N 10°E |
| 6. Catálogo sin la malla | Apollo 11 y Apollo 15 muestran "LOLA de 474 m (precalculado)", y la vista 3D carga "Terreno 474 m (precalculado)" |
| 7. Punto propio sin la malla | Luna lisa y botón 3D desactivado, con su explicación |
| 8. Coste | Un horizonte tarda 89 ms con la caché vacía y 25 ms con ella llena; un parche de 64 km, 11 ms |
| 9. Sitios polares | Los 12 sitios no cambian (0.0000°) y sus parches son idénticos. Medido con la malla de 240 m; los archivos precalculados con las mallas finas no se tocaron |
| 10. Memoria | La caché se llena en 32 MB, y el proceso crece 44 MB después de los 75 horizontes del catálogo |
| 11. Repositorio | 7.4 MB nuevos: 872 KB de horizontes y 6.5 MB de parches |
| 12. Mirar arriba | La cámara llega a 85° y la Tierra se ve en Apollo 11 |

Comprobado con:

- Pruebas sin datos: [globalDem.test.js](../../tests/globalDem.test.js) (16 pruebas, sobre mallas sintéticas).
- Pruebas con la malla real: [globalTerrain.test.js](../../tests/globalTerrain.test.js) (7 pruebas, que se saltan si falta).
- Prueba de navegador: [s17-relieve-global.mjs](../../e2e/s17-relieve-global.mjs) (11 comprobaciones; la del criterio 5 necesita `E2E_GLOBAL=1`).

**Descarga.** Con 16 conexiones en paralelo, los 531 MB bajaron a entre 320 y 400 KB/s, en unos 25 minutos. Con una sola conexión iba a 37 KB/s.

**Lo que se ve.** En Apollo 15 y Apollo 17, las montañas cierran el horizonte, también en la vista 3D. Apollo 11 es una llanura casi sin sombras con el Sol alto, como corresponde al Mar de la Tranquilidad a mediodía.

**Sin hacer:** la comparación a mano con las fotos panorámicas de las misiones.

## Qué verá el usuario

- **Sitios del catálogo fuera del polo.** El panorama dibuja su horizonte real y el estado dice "Terreno LOLA 474 m (precalculado)". Funciona en cualquier copia del proyecto, sin descargar nada más.
- **"Ver en 3D" se activa en esos sitios.**
  - Apollo 15 y Apollo 17 muestran las montañas que los rodean.
  - Apollo 11 se ve casi llano, como es el Mar de la Tranquilidad.
  - Se puede mirar hasta casi el cenit, porque lejos del polo el Sol y la Tierra suben alto en el cielo.
- **Puntos propios.** Con la topografía global instalada (`npm run fetch-data -- --global`, 531 MB), cualquier punto de la Luna tiene relieve y vista 3D. Sin ella, un punto propio fuera del polo sigue con la Luna lisa, y el estado lo dice.
- **Lo que no cambia.** El mapa de sombras sigue siendo el del polo sur. El buscador de puntos ([S04](S04-buscador-de-puntos.md)) y la sombra permanente ([S16](S16-sombra-permanente.md)) siguen limitados a 80°S–90°S. Para el resto de la Luna está la vista Globo.

**El límite se dice claro:** las celdas son de 474 m. Se ven las montañas, los cráteres de más de un par de kilómetros y la forma general del terreno. No se ven rocas ni cráteres de unos cientos de metros, como West, el que el Eagle esquivó al alunizar.

## Diseño

**Datos.** Comprobado el 15 de noviembre de 2026 en el PDS de NASA, en `lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/`:

| Producto | Celda | Cobertura | Tamaño | Formato |
| --- | --- | --- | --- | --- |
| `LDEM_64` (v3.1, 2019) | 1/64° (473.8 m en el ecuador) | Luna entera | 531 MB (530 841 600 bytes) | 23 040 × 11 520 enteros de 16 bits little-endian, en proyección cilíndrica simple. La fila 0 está en 90°N y la columna 0 en 0°E |

- La altura es DN × 0.5 m sobre la esfera de 1737.4 km, la misma referencia que las mallas polares. Las dos se pueden mezclar sin conversión.
- El servidor admite descargas por partes, así que la descarga se reanuda como las demás.
- Se descartó `LDEM_128` (237 m, 2.1 GB): cuadruplica la descarga. El horizonte lejano, que es lo que dibuja las montañas del panorama, apenas cambia, y cerca del sitio ya da textura el detalle procedural de la vista 3D.

**Lectura sin cargar el archivo entero.** Nuevo `server/globalDem.js`:

- Si existe `server/data/ldem_64.img`, lee bloques de 256 × 256 celdas (4° × 4°, 128 KB) solo cuando se necesitan. Guarda en caché los últimos 256 bloques (32 MB), así que el servidor no reserva 531 MB.
- `globalHeightAt(latDeg, lonDeg)` da la altura en km, con interpolación bilineal:
  - Da la vuelta en la longitud 0°/360°.
  - Junto a los polos, se queda en la última fila.
  - Da NaN si el archivo no está.
- También exporta `globalDemAvailable()`, y la ruta y el tamaño de la malla como parámetros, para poder probarlo con un archivo sintético pequeño.

**Una sola función de altura.** Nueva `heightAtUnit(x, y, z)` en [dem.js](../../server/dem.js): recibe un punto de la esfera unidad y devuelve su altura en km.

- Usa la malla polar más fina que contiene el punto.
- Fuera de las mallas polares, usa la global.
- Si no hay ninguna, devuelve NaN.

Junto a ella, `terrainResolutionAt(lat, lon)` da la celda que se usará en el sitio: de 20 a 240 m en el polo, 474 m fuera, o `null`.

**Horizonte** ([horizon.js](../../server/horizon.js)):

- `computeHorizon` deja de mirar la latitud. Si hay terreno en el sitio, traza los rayos con `heightAtUnit`; si no, usa la esfera lisa, como ahora.
- El rayo ya no se corta al salir de la malla polar en 75°S: si la global está instalada, sigue por ella. En los sitios polares del catálogo no cambia nada medible, porque a esa distancia la curvatura hunde el terreno más de lo que miden las montañas (criterio 9).
- El rayo arranca y avanza media celda, como ahora: 237 m fuera del polo.

**Parches 3D** ([patch.js](../../server/patch.js)). `heightFn` recibe el punto de la esfera unidad en lugar de coordenadas del mapa polar, y por defecto es `heightAtUnit`. El resto del cálculo ya vale en cualquier latitud.

**Servidor** ([app.js](../../server/app.js)):

- `/api/patch` deja de responder 400 al norte de 80°S. Responde 503 solo si en ese punto no hay ni terreno instalado ni parche precalculado.
- `/api/horizon` y `/api/patch` buscan el precalculado en cualquier latitud. Lo usan si su celda es más fina que la instalada en ese punto, o si ahí no hay terreno instalado.
- `/api/health` añade `globalDem: true | false`. `coverageMaxLat` se queda: sigue siendo el límite del buscador y del mapa polar.
- `LUMINA_GLOBAL=0` deja la malla global apagada aunque esté instalada, como `LUMINA_HIRES=0` con las mallas finas.
- El buscador de puntos la apaga en sus hilos de trabajo. Así sus resultados no cambian y cada hilo se ahorra la caché de bloques.

**Descarga** ([fetch-data.mjs](../../scripts/fetch-data.mjs)):

- Nueva opción `--global`, que baja `ldem_64.img` y su etiqueta a `server/data/`. Los `.img` de esa carpeta ya los ignora git.
- Los archivos de 16 MB o más se bajan en trozos de 1 MB por 16 conexiones a la vez, y un archivo `.pieces` apunta los trozos terminados para poder reanudar.
- El motivo: el 15 de noviembre el servidor de NASA daba de 30 a 40 KB/s por conexión, y 512 KB/s con 16 conexiones. Con una sola, los 531 MB tardarían unas 4 horas. Con trozos de 4 MB, las 16 conexiones agotaban el tiempo de espera.

**Precálculo de los 25 sitios** ([precompute-horizons.mjs](../../scripts/precompute-horizons.mjs)):

- Hoy exige las mallas finas del polo y borra todos los archivos antes de empezar. Pasa a tener dos partes independientes:
  - Los sitios polares, si están las mallas finas.
  - Los demás, si está la malla global.
- Cada parte rehace solo los archivos de sus sitios y avisa de la parte que se salta. El `index.json` de los parches se combina en vez de reescribirse.
- Cada sitio fuera del polo lleva 3 horizontes y 2 parches. En total son unos 0.9 MB de horizontes y 6.6 MB de parches; los polares ocupan hoy 0.4 MB y 3.2 MB.
- Una sola persona ejecuta `npm run fetch-data -- --global` y `npm run precompute`, y sube los archivos. El resto del equipo no descarga nada.

**Interfaz:**

- [App.tsx](../../src/App.tsx): la vista 3D se bloquea solo cuando el horizonte no es de terreno real (`horizon.model !== 'lola'`), no por la latitud. Texto: "Este punto no tiene topografía en el servidor, y la vista 3D necesita terreno real."
- [Panels.tsx](../../src/components/Panels.tsx): "Fuera de la cobertura de terreno (80°S a 90°S): se usa una Luna lisa" pasa a "Sin topografía para este punto: se usa una Luna lisa". La línea de la sombra permanente no cambia.
- [Export.tsx](../../src/components/Export.tsx): los límites del informe dicen "terreno real con celdas de 20 a 240 m en el polo sur y de 474 m en el resto".
- [terrain3d.ts](../../src/lib/terrain3d.ts): `PITCH_MAX` pasa de 60° a 85°. Lejos del polo, el Sol pasa cerca del cenit y la Tierra está fija y alta en el cielo (unos 66° en Apollo 11). Con el límite de 60° no se podían ver.
- La vista sigue abriéndose hacia el Sol, pero inclinada como mucho 15° (`START_PITCH_MAX`). Con el Sol cerca del cenit, abrir mirándolo dejaba el suelo fuera de la pantalla, porque la cámara ve 30° por encima y por debajo de su inclinación. Primero se probó con 25°, pero en la llanura de Apollo 11 el suelo quedaba detrás de la barra de controles. En los sitios polares no cambia nada, porque allí el Sol no pasa de unos 7°.
- [Terrain3D.tsx](../../src/components/Terrain3D.tsx) publica la inclinación de la cámara en `data-pitch`, para la prueba de navegador.
- El enlace compartible no gana parámetros.

**Documentación y pruebas existentes:**

- En [S11](S11-vista-3d.md), el criterio "desactivado al norte de 80°S" pasa a "desactivado donde no hay topografía".
- Los flujos de navegador de S06 y S11 comprueban la Luna lisa con un punto propio a 10°N, en lugar de con Apollo 11.
- `npm run e2e` arranca su servidor con `LUMINA_GLOBAL=0`, para dar los mismos resultados en cualquier equipo. Con `E2E_GLOBAL=1` arranca además otro servidor con la malla global, para el criterio 5.

## Criterios de aceptación

Con la malla global instalada:

1. Apollo 15 (Hadley-Apennine): el horizonte supera 5° hacia Mons Hadley (noreste) y hacia Hadley Delta (sur).
2. Apollo 17 (Taurus-Littrow): supera 5° hacia el North Massif y hacia el South Massif.
3. Apollo 11: no pasa de 3° en ninguna dirección.
4. En cinco puntos entre 77°S y 79°S, donde hay malla polar y global, los horizontes calculados con cada una difieren menos de 0.5° en la mediana de las direcciones.
5. Un punto propio a 10°N 10°E tiene horizonte de terreno ("LOLA 474 m") y vista 3D.

Sin la malla global (clon limpio y `npm run fetch-data`):

6. Los 25 sitios del catálogo fuera del polo muestran "LOLA 474 m (precalculado)" y abren la vista 3D.
7. Un punto propio a 10°N 10°E sigue con la Luna lisa, y el botón de la vista 3D está desactivado y explica por qué.

Siempre:

8. En el portátil de desarrollo, un horizonte global de 720 direcciones tarda menos de 1.5 s con la caché vacía y menos de 0.5 s con la caché llena, y un parche de 64 km menos de 1 s.
9. Los sitios polares no cambian: sus 36 horizontes precalculados difieren menos de 0.01° de los actuales, y sus parches son idénticos.
10. La malla global añade menos de 64 MB de memoria al servidor.
11. Los archivos precalculados nuevos ocupan menos de 8 MB.
12. En la vista 3D de Apollo 11 se puede mirar hasta 85° de altura y encontrar la Tierra.

## Pruebas

- **Automáticas, sin descargas:**
  - `globalDem.js` con un archivo sintético pequeño: orientación de filas y columnas, escala, vuelta en 0°/360° y polos.
  - El horizonte sobre una malla global plana es igual al de la esfera lisa.
  - Un cono sintético a una distancia conocida da la elevación esperada.
  - El parche funciona con la nueva `heightFn`.
  - Las rutas, con precalculados y sin terreno (criterios 6 y 7 en el servidor).
  - El precálculo de una parte no borra los archivos de la otra.
- **Con la malla global:** criterios 1 a 5 y 8 a 10, en un archivo de pruebas que se salta si falta la malla, como [hiresTerrain.test.js](../../tests/hiresTerrain.test.js).
- **En el navegador:** un flujo nuevo, `e2e/s17-relieve-global.mjs`, para los criterios 6, 7 y 12. Además se actualiza [s11-vista-3d.mjs](../../e2e/s11-vista-3d.mjs).
- **A mano:** comparar el panorama de Apollo 15 y Apollo 17 con las fotos panorámicas de las misiones, en el Apollo Lunar Surface Journal.

## Fuera de alcance

- **Más detalle que 474 m:** `LDEM_128` (237 m, 2.1 GB), SLDEM2015 (unos 60 m, entre 60°N y 60°S) o los modelos de LROC NAC, de pocos metros, que existen para los sitios Apollo. Se podrían añadir después con la misma `heightAtUnit`.
- **El mapa de sombras** de otras regiones o del polo norte.
- **El buscador de puntos y la sombra permanente** fuera del polo sur.
- **Rocas y cráteres pequeños.**

## Riesgos

- **La descarga es lenta.** Con una sola conexión, el servidor de NASA da de 37 a 60 KB/s, y 531 MB tardarían hasta 4 horas. Por eso `fetch-data` baja los archivos grandes por 16 conexiones, y así tardó unos 25 minutos. Es opcional, se reanuda si se corta y solo la necesita quien precalcule; el resto del equipo usa los archivos del repositorio.
- **De cerca, 474 m decepciona.** El suelo cercano se ve liso, y Apollo 11 parecerá casi plano. El indicador dice la resolución ("Terreno 474 m") y el detalle procedural de S11 da textura. Los sitios que lucen son los rodeados de montañas, como Apollo 15 y Apollo 17.
- **El repositorio crece unos 7.5 MB** con los archivos precalculados. Si molesta, los parches se pueden guardar comprimidos con `zlib`, que viene con Node y no es una dependencia nueva.
- **Se mezclan dos mallas.** Las dos son de LOLA y usan la misma esfera, pero tienen fechas y celdas distintas: en el borde puede haber un escalón de unos metros. El criterio 4 comprueba que no cambie el horizonte.
- **Cerca de los polos, la malla cilíndrica estrecha sus celdas de este a oeste:** a 85° de latitud miden 41 m de ancho y siguen midiendo 474 m de norte a sur. No afecta: en el sur manda la malla polar, y en el norte no hay sitios del catálogo.

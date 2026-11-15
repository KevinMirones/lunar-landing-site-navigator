---
id: S15
titulo: Pruebas de navegador en el repositorio
estado: en curso
dia: 4
prioridad: imprescindible
depende: S03
resumen: Una orden que abre la app en un navegador real y comprueba cada función, también en cada pull request.
---

# S15: Pruebas de navegador en el repositorio

## Problema

Las specs S01 a S07 se comprobaron en un navegador real con scripts que se quedaron en una carpeta temporal, fuera del repositorio. Nadie más puede repetirlos. Ahora trabajan varias personas a la vez sobre los mismos archivos de interfaz, y la mezcla del 14 de noviembre (paneles plegables sobre las specs S01 a S05) dejó ocho conflictos en un solo archivo, resueltos a mano y sin comprobar en el navegador. Hace falta una red que avise cuando un cambio rompe lo que ya funcionaba.

## Qué verá el usuario

Nada en la app. El equipo gana:

- `npm run e2e`: abre la app compilada en un navegador y recorre cada función. Termina con "ALL CHECKS PASSED" o con la lista de lo que falló.
- La misma comprobación en cada pull request, dentro de la integración continua.

## Estado

Hecho y comprobado en el segundo portátil, el 15 de noviembre:

- `npm run e2e` con su lanzador ([run.mjs](../../e2e/run.mjs)) y las utilidades comunes ([lib.mjs](../../e2e/lib.mjs)).
- Seis flujos, todos en verde y sin errores en la consola: los cinco recuperados, ya adaptados, y el nuevo de paneles.
- Con `E2E_HIRES=1` pasan también las comprobaciones con mallas finas, incluida la de que el horizonte precalculado da las mismas cifras que el terreno fino.
- Romper el botón de duplicar a propósito hace fallar el flujo de S01, que dice en qué paso se quedó (criterio 3).
- El paso nuevo en [ci.yml](../../.github/workflows/ci.yml), con el DEM en caché.

Falta:

1. **Criterio 1, tiempo total.** En el segundo portátil la batería tarda unos 5 minutos, con WebGL por software. Hay que medirla en el portátil de desarrollo.
2. **Criterio 5.** Ver el paso nuevo en verde en GitHub. El repositorio es privado y no se pudo comprobar desde fuera.

## Diseño

**Herramienta:** `playwright-core` como dependencia de desarrollo. Maneja un navegador ya instalado, así que no descarga ninguno.

- El navegador se elige con `E2E_CHANNEL`: por defecto `msedge` en Windows y `chrome` en el resto.
- WebGL por software (SwiftShader) por defecto. Forzar la tarjeta gráfica, como hacían los scripts originales, dejaba sin WebGL2 al segundo portátil; sigue disponible con `E2E_GPU=1`.
- Los scripts son módulos sueltos con las funciones de [lib.mjs](../../e2e/lib.mjs): `open` (abre la página y recoge los errores de consola), `ready` (espera a que no quede nada calculándose), `check` (anota una comprobación) y `done` (resume y fija el código de salida). No hace falta un marco de pruebas.
- `npm run e2e -- s04 paneles` ejecuta solo los flujos cuyo nombre contiene alguna de esas palabras.

**Lanzador** `e2e/run.mjs`, que es lo que ejecuta `npm run e2e`:

1. Comprueba que existe `dist/`; si no, pide ejecutar `npm run build`.
2. Arranca el servidor real en un puerto libre con `LUMINA_HIRES=0`. Así el resultado es el mismo con mallas finas instaladas o sin ellas: los sitios del catálogo responden con sus horizontes precalculados.
3. Ejecuta los flujos uno tras otro contra ese servidor y suma los fallos.
4. Apaga el servidor y sale con código distinto de 0 si algo falló.

Con `E2E_URL` se salta el paso 2 y prueba una dirección ya en marcha, por ejemplo la pública.

**Reglas de los flujos:**

- Cada flujo abre la app con un enlace compartible que fija el estado ([S02](S02-enlaces-compartibles.md)): fecha, sitios e idioma. Ninguno depende de la fecha de hoy.
- Cada flujo empieza con el almacenamiento del navegador vacío, para que los paneles estén abiertos.
- Ninguno depende de internet: no se usa la comprobación con JPL Horizons.
- Cualquier error en la consola del navegador cuenta como fallo.
- Los flujos se renombran a `sNN-nombre.mjs`.

**Flujos**, con lo que comprueba cada uno:

| Flujo | Comprobaciones | Qué recorre |
| --- | --- | --- |
| S01 escenarios | 16 | Duplicar con otra fecha, que la barra superior solo edite el activo, eje común de las franjas, eliminar, máximo de seis |
| S02 enlaces | 14 | La dirección refleja el estado, copiar, abrir en otra pestaña, reproducir sin llenar el historial, enlaces dañados |
| S04 buscador | 14 | Resultados en la ladera de Malapert, mapa de calor, cambio de criterio sin nueva petición, que el escenario creado dé las cifras prometidas, fuera de cobertura. Los dos límites de tiempo solo se comprueban con `LUMINA_PERF=1` |
| S05 mejores fechas | 12 | Fila de índice, lista ordenada, filtro de Sol, aplicar y añadir fechas |
| S06 y S07 | 11, y 4 más con `E2E_HIRES=1` | Resolución del terreno y fuente de las coordenadas en pantalla, horizonte precalculado, inglés, 390 px de ancho |
| Paneles | 20 | Lo de la lista siguiente |

El flujo de S06 comparaba dos servidores, uno con mallas finas y otro sin ellas. En `npm run e2e` solo queda la parte sin mallas finas; la otra se ejecuta con `E2E_HIRES=1` en un equipo que las tenga.

**Flujo de paneles** (lo hecho el 14 de noviembre):

- Cada sección se pliega y se despliega con su botón, y el botón cambia su texto accesible.
- Tras recargar, las secciones plegadas siguen plegadas.
- El botón de ampliar el mapa cierra los dos paneles laterales y los vuelve a abrir.
- Un panel lateral cerrado deja una barra con su nombre, que lo reabre.
- A 390 px de ancho no hay desbordamiento horizontal y los paneles se pliegan hacia arriba.
- Con un panel plegado, las cifras de la tabla no cambian.

**Las specs siguientes** añaden su propio flujo al terminar: es parte de "terminado" en el [plan](../PLAN.md).

**Integración continua.** Un paso más en [ci.yml](../../.github/workflows/ci.yml), después de `npm run build`: `npm run e2e`.

- Los equipos de GitHub traen Chrome instalado: `E2E_CHANNEL=chrome`.
- No tienen tarjeta gráfica: el WebGL por software de los flujos es justo lo que necesitan.
- Necesita el DEM. Mientras no esté en el repositorio ([S03](S03-ci-y-despliegue.md)), la integración continua lo descarga una vez y lo guarda en caché. Si la descarga falla, `E2E_ALLOW_NO_DEM=1` hace que el paso se salte con un aviso en lugar de fallar.

## Criterios de aceptación

1. `npm run e2e` pasa en local contra la versión compilada, en menos de tres minutos.
2. Pasa igual en un equipo con mallas finas y en uno sin ellas.
3. Romper a propósito una función (por ejemplo, quitar el botón de duplicar) hace que termine con error y diga qué comprobación falló.
4. Ningún flujo deja errores en la consola del navegador.
5. La integración continua lo ejecuta en cada pull request, o deja dicho por qué lo salta.
6. Existe el flujo de paneles y pasa.

## Pruebas

Esta spec son las pruebas. Se comprueba con los criterios 1 a 3.

## Fuera de alcance

- Comparación de capturas de pantalla.
- Probar en varios navegadores a la vez: eso es la lista manual de [S14](S14-robustez-y-calidad.md).
- Pruebas de rendimiento.

## Riesgos

- **Pruebas frágiles.** Varios flujos leen el texto de la tabla con expresiones regulares. Al adaptarlos conviene pasar a selectores estables; si hace falta, se añaden atributos `data-testid` a la interfaz.
- **Los tiempos de espera fijos fallan en equipos lentos.** Se sustituyen por esperas a que aparezca el elemento.
- **Sin WebGL en la integración continua.** Las comprobaciones de dibujo se omiten allí y se ejecutan en local.

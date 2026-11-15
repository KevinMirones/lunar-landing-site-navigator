---
id: S03
titulo: Integración continua y despliegue público
estado: en curso
dia: 1
prioridad: imprescindible
depende: -
resumen: Cada cambio se prueba solo y hay una dirección pública que el jurado puede abrir.
---

# S03: Integración continua y despliegue público

## Problema

El proyecto solo funciona en las máquinas del equipo. Para la entrega hace falta un enlace público, y para trabajar varias personas a la vez sin romper nada hace falta que las pruebas se ejecuten solas y den el mismo resultado en cualquier equipo.

## Qué verá el usuario

- En GitHub, cada push muestra una marca verde o roja.
- El README incluye la dirección pública de la herramienta.
- Si el servidor público lleva un rato sin visitas, la primera carga tarda alrededor de un minuto. El README lo avisa.

## Estado

Hecho y probado:

- Flujo de integración continua en [ci.yml](../../.github/workflows/ci.yml).
- Límite de 30 peticiones por minuto en `/api/jpl`, con caché de respuestas ([rateLimit.js](../../server/rateLimit.js)).
- Cabeceras de seguridad y política de contenido, comprobadas con la app compilada.
- [app.js](../../server/app.js) separa la creación de la app del arranque, para poder probar la API.
- Ajustes de despliegue documentados en el [README](../../README.md).
- Pruebas de tiempo fuera de `npm test`, con `npm run test:perf` ([Pruebas de tiempo](#pruebas-de-tiempo)). Comprobado en el segundo portátil: `npm test` pasa (118 pruebas, 5 omitidas sin mallas finas) y `npm run test:perf` falla allí por 633 ms frente a 300 ms, como se espera en un equipo más lento.

Falta, en este orden:

1. Comprobar en la pestaña Actions de GitHub que el flujo termina en verde. El repositorio es privado y no se pudo comprobar desde fuera.
2. Confirmar la decisión sobre el DEM (ver [Datos en el repositorio](#datos-en-el-repositorio)).
3. Desplegar (ver [Despliegue](#despliegue)) y poner la dirección en el README.
4. Opcional: la [copia estática de respaldo](#copia-estática-de-respaldo).

Los pasos 1 a 3 necesitan las cuentas del equipo.

## Diseño

### Integración continua

`.github/workflows/ci.yml`, con Node 22, en cada push y cada pull request:

1. `npm ci`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`
5. `npm run docs:check`
6. `npm run e2e`, cuando exista ([S15](S15-pruebas-de-navegador.md)).

Las pruebas de terreno se saltan solas si el DEM no está. Con el DEM en el repositorio dejan de saltarse.

### Pruebas de tiempo

Varias specs fijan un límite de tiempo "en el portátil de desarrollo" y hay pruebas automáticas que lo exigen. En otro equipo esas pruebas fallan aunque el código esté bien: el 14 de noviembre, en un segundo portátil, recalcular seis escenarios tardó 633 ms frente al límite de 300 ms de [scenario.test.ts](../../tests/scenario.test.ts), y `npm test` terminó en rojo.

- Las aserciones de tiempo de cálculo puro pasan a ejecutarse solo con `LUMINA_PERF=1`. Son tres: [scenario.test.ts](../../tests/scenario.test.ts) (300 ms), [bestDates.test.ts](../../tests/bestDates.test.ts) (100 ms) y [hiresTerrain.test.js](../../tests/hiresTerrain.test.js) (250 ms).
- Nuevo script `npm run test:perf`, que activa esa variable. Se ejecuta a mano en el portátil de desarrollo antes de cerrar una spec con límite de tiempo.
- `npm test` y la integración continua siguen comprobando el resultado de esas pruebas, no su duración.
- Las dos pruebas de [searchServer.test.js](../../tests/searchServer.test.js) que miden que la API no se bloquea durante una búsqueda no cambian: comprueban un comportamiento, no una velocidad.

### Datos en el repositorio

**Propuesta: incluir en el repositorio la malla de 240 m** (`server/data/ldem_75s_240m.img`, 29 MB).

| | Con el DEM en el repositorio | Como hoy (se descarga) |
| --- | --- | --- |
| Compilación del alojamiento | `npm ci && npm run build` | Depende del servidor de NASA, que a veces va a 60 KB/s |
| Integración continua | Ejecuta las pruebas de terreno | Las salta |
| Clon nuevo | Funciona sin pasos extra | Necesita `npm run fetch-data` |
| Coste | 29 MB para siempre en el historial de git | Ninguno |

Los datos de LOLA son públicos. La textura del globo ya está en el repositorio. Si se acepta:

- Añadir `!server/data/ldem_75s_240m.img` a [.gitignore](../../.gitignore), después de la línea que ignora `server/data/*.img`.
- Quitar `npm run fetch-data` del comando de compilación del README.
- `npm run fetch-data` sigue existiendo para las mallas finas y los mapas de validación.

No se puede deshacer sin reescribir el historial, así que la confirma el equipo. Mientras tanto la compilación descarga el DEM.

### Despliegue

Un único servicio Node sirve la API y la web.

**Lo que necesita el alojamiento:**

| Requisito | Valor |
| --- | --- |
| Node | 22.18 o superior. Es obligatorio: el servidor carga los módulos TypeScript de `src/lib` directamente |
| Memoria | 256 MB. Medido el 14 de noviembre con solo la malla de 240 m: 80 MB al arrancar y 123 MB de pico durante una búsqueda con un hilo (148 MB con los hilos por defecto de un portátil) |
| Disco | 60 MB con el DEM |
| Proceso | Un servicio que se mantenga en ejecución; no sirve un alojamiento solo de archivos estáticos |

Las mallas finas (345 MB en disco, unos 400 MB en memoria) no se despliegan. Los sitios del catálogo responden igualmente con terreno fino gracias a los horizontes precalculados de [S06](S06-terreno-multirresolucion.md).

**Propuesta: Render, plan gratuito.** Según su [documentación](https://render.com/docs/free), consultada el 14 de noviembre de 2026: 512 MB de memoria, 0.1 de CPU, y el servicio se duerme tras 15 minutos sin visitas y tarda alrededor de un minuto en despertar. Cualquier otro alojamiento que cumpla la tabla anterior vale igual.

| Ajuste | Valor |
| --- | --- |
| Compilación | `npm ci && npm run build` (con `npm run fetch-data` delante mientras el DEM no esté en el repositorio) |
| Arranque | `npm start` |
| Comprobación de salud | `/api/health`, que debe responder `"dem": true` y `"precomputed": 36` |
| `NODE_VERSION` | Una versión 22.x igual o superior a 22.18 |
| `TRUST_PROXY` | `1`, para que el límite de peticiones vea la dirección real del cliente |
| `SEARCH_WORKERS` | `1` |
| `SEARCH_MAX_GRID` | `11` al principio |

**El buscador con 0.1 de CPU.** El buscador de puntos de [S04](S04-buscador-de-puntos.md) es cálculo puro y allí irá mucho más lento que en un portátil. El primer día se mide la malla de 11:

- Si responde en menos de 10 s, se prueba a subir `SEARCH_MAX_GRID` a 21.
- Si tarda más de 30 s, se anota en "Límites conocidos" del README que el buscador va lento en la dirección pública, y la demostración del buscador se hace en local.

La respuesta ya indica la malla realmente usada, así que la interfaz no cambia.

**Antes de enseñarlo.** Abrir la dirección unos minutos antes de la demostración, para que el servicio esté despierto.

### Protección del servidor público

- `/api/jpl` reenvía consultas a JPL Horizons. Está limitado a 30 peticiones por minuto y por dirección, con caché.
- Cabeceras de seguridad básicas y sin listado de directorios.

### Copia estática de respaldo

Recortable. Una copia de la app que funciona sin servidor, publicada en GitHub Pages, para que el enlace del jurado abra siempre y al instante aunque el servicio gratuito esté dormido o caído.

Es posible porque las efemérides ya se calculan en el navegador y los horizontes del catálogo ya están precalculados.

- Nuevo `npm run build:static`: compila la web con rutas relativas y copia junto a ella los 36 horizontes de `server/data/horizons/` y el mapa de alturas que hoy sirve `/api/heightmap`, generado como archivo.
- En [util.ts](../../src/lib/util.ts), `fetchHorizon` y `fetchHeightmap` prueban primero la API y, si no responde, usan esos archivos.
- Sin servidor quedan desactivados, con un aviso que lo explica: el buscador de puntos, la comprobación con JPL Horizons y el terreno real para puntos propios (que ya caen hoy a una Luna lisa y lo dicen).
- Un flujo de GitHub Actions la publica en cada push a `main`. GitHub Pages gratuito exige que el repositorio sea público, y hoy es privado; hay que hacerlo público de todos modos para la entrega.

Las specs posteriores que añadan datos del servidor para sitios del catálogo ([S11](S11-vista-3d.md), [S16](S16-sombra-permanente.md)) los precalculan también, para que la copia estática los tenga.

## Criterios de aceptación

1. Un push a cualquier rama ejecuta la integración continua y termina en verde.
2. Un cambio que rompe una prueba deja la marca en rojo.
3. `npm test` pasa en un equipo distinto del portátil de desarrollo, y `npm run test:perf` pasa en el portátil de desarrollo.
4. La dirección pública carga en un móvil y `/api/health` responde con el DEM cargado y los 36 horizontes precalculados.
5. La petición número 31 a `/api/jpl` en un minuto recibe un error 429.
6. El README contiene la dirección pública y el tiempo medido del buscador en ella.
7. Si se hace la copia estática: con ella, los 12 sitios polares del catálogo muestran las mismas cifras que con servidor, y las funciones que lo necesitan aparecen desactivadas con su explicación.

## Pruebas

- Automáticas: el límite de peticiones (ya existe) y, para la copia estática, que `fetchHorizon` usa el archivo cuando la API falla.
- A mano: los criterios 1 a 4 y 6.

## Fuera de alcance

- Dominio propio, despliegue automático por etiqueta y monitorización.
- Desplegar las mallas finas.

## Riesgos

- **El servicio gratuito está dormido cuando el jurado abre el enlace.** Aviso en el README, abrirlo antes de la demostración y, si se hace, la copia estática.
- **El buscador es demasiado lento en público.** Se mide el primer día y se documenta. La demostración en vivo se hace en local con `npm run share`.
- **Las condiciones del plan gratuito cambian.** Los requisitos están en una tabla aparte del proveedor, para poder elegir otro.
- **Sin internet en la presentación.** `npm run share` en local, que no depende del despliegue.

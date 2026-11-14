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

El proyecto solo funciona en una máquina. Para la entrega hace falta un enlace público, y para trabajar toda la semana sin romper nada hace falta que las pruebas se ejecuten solas. Desplegar el primer día, y no el sexto, destapa pronto los problemas de memoria o de arranque.

## Qué verá el usuario

- En GitHub, cada push muestra una marca verde o roja.
- El README incluye la dirección pública de la herramienta.

## Diseño

**Integración continua** (`.github/workflows/ci.yml`), con Node 22:

1. `npm ci`
2. `npm run typecheck`
3. `npm test` (las pruebas de terreno se saltan solas si no hay DEM)
4. `npm run build`
5. `npm run docs:check`

**Despliegue:** un único servicio Node que sirve la API y la web.

- Compilación: `npm ci && npm run build`. Arranque: `npm start`. El puerto se toma de `PORT`, que [server/index.js](../../server/index.js) ya respeta.
- Comprobación de salud: `/api/health` debe responder `"dem": true`.
- Memoria: el DEM ocupa 28 MB y el mapa de alturas 3 MB; basta un plan de 256 MB.
- Datos: se recomienda incluir el DEM en el repositorio antes de desplegar, para que la compilación no dependa del servidor de NASA, que a veces va a 60 KB/s. Es una decisión pendiente del [plan](../PLAN.md).

**Protección del servidor público:**

- `/api/jpl` reenvía consultas a JPL Horizons. En público hay que limitarlo a 30 peticiones por minuto y por dirección, y guardar las respuestas en caché.
- Cabeceras de seguridad básicas y sin listado de directorios.

**Cambios pendientes de subir:** los scripts `share` y `dev:lan` y el aviso de la dirección de red entran con esta spec.

## Estado

Hecho y probado:

- Flujo de integración continua en `.github/workflows/ci.yml`.
- Límite de 30 peticiones por minuto en `/api/jpl`, con caché de respuestas ([rateLimit.js](../../server/rateLimit.js)).
- Cabeceras de seguridad y política de contenido, comprobadas con la app compilada.
- `server/app.js` separa la creación de la app del arranque, para poder probar la API.
- Ajustes de despliegue documentados en el README.

Pendiente, porque depende de decisiones y cuentas del equipo:

- Primer push, para ver la integración continua en verde (criterios 1 y 2).
- Elegir alojamiento y desplegar (criterios 3 y 5).
- Decidir si el DEM entra en el repositorio; mientras tanto la compilación lo descarga con `npm run fetch-data`.

## Criterios de aceptación

1. Un push a cualquier rama ejecuta la integración continua y termina en verde.
2. Un cambio que rompe una prueba deja la marca en rojo.
3. La dirección pública carga en un móvil y `/api/health` responde con el DEM cargado.
4. La petición número 31 a `/api/jpl` en un minuto recibe un error 429.
5. El README contiene la dirección pública.

## Pruebas

- A mano: los criterios 1 a 3 y 5.
- Automática: el límite de peticiones.

## Fuera de alcance

- Dominio propio, despliegue automático por etiqueta y monitorización.

## Riesgos

- **El alojamiento gratuito se duerme o se queda sin memoria.** Se detecta el primer día. Plan B: presentar en local con `npm run share`.
- **Versión de Node del alojamiento.** [S04](S04-buscador-de-puntos.md) puede exigir Node 22.18 o superior; conviene elegir un servicio que lo permita.

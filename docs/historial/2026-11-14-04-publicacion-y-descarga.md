---
fecha: 2026-11-14
titulo: Publicación en GitHub y descarga de datos reanudable
title: Publishing on GitHub and a resumable data download
tipo: incidencia
resumen: Al probar un clon limpio apareció un fallo en la descarga del DEM; se corrigió antes de publicar.
summary: Testing a clean clone revealed a fault in the DEM download; it was fixed before publishing.
---

<a id="en"></a>
**English** | [Español](#es)

# Publishing on GitHub and a resumable data download

## Publishing

The MVP was pushed to GitHub in eight commits ordered by layer (project, data, server, ephemeris, analysis, interface, documentation and one fix) and tagged `mvp-v0.1.0`.

Before pushing, it was cloned into a clean folder and the whole process was repeated: install, download data, test, build and start the server.

## The fault that appeared

The DEM download from NASA's server was slow: 11.7 MB of 28 MB in 200 seconds, about 60 KB/s. When it was interrupted it left a truncated file, and the script accepted it as good on the next run. The server would have started with an incomplete DEM.

## The fix

[scripts/fetch-data.mjs](../../scripts/fetch-data.mjs) now:

- Downloads to a `.part` file and only renames it when the size matches the expected one.
- Resumes where it stopped.
- Retries up to six times.
- Detects a truncated file from an earlier run and completes it.

It was checked that the resumed file is identical, byte for byte, to the one downloaded in one go.

## Other fixes for publishing

- **Package registry.** 204 of the 205 entries in `package-lock.json` pointed to an npm mirror that had hung during the install. They were changed to the official registry, so that any clone installs without depending on the mirror.
- **DEM outside git.** `server/data/*.img` and `.part` files are ignored.

## Sharing on the local network

The same day, what was needed for someone else on the same network to open the tool was added:

- `npm run share` builds and serves everything on port 8787.
- `npm run dev:lan` serves the development version, with live reload, on port 5173.
- On start, the server prints the network address to share.

Two things to keep in mind:

- The API server already serves the built app if the `dist` folder exists. Vite's development server only listens on the machine itself unless `dev:lan` is used.
- Some large networks isolate devices from each other. In that case there is nothing to be done from the machine: use a phone's hotspot.

These changes are not pushed yet; they go in with [S03](../specs/S03-ci-y-despliegue.md).

## What it teaches

Testing from a clean clone finds faults that do not show on the development machine. It stays as a working rule in the [plan](../PLAN.md).

---

<a id="es"></a>
**Español** | [English](#en)

# Publicación en GitHub y descarga de datos reanudable

## Publicación

El MVP se subió a GitHub en ocho commits ordenados por capas (proyecto, datos, servidor, efemérides, análisis, interfaz, documentación y una corrección) y se etiquetó como `mvp-v0.1.0`.

Antes de subirlo se clonó en una carpeta limpia y se repitió todo el proceso: instalar, descargar datos, probar, compilar y arrancar el servidor.

## El fallo que apareció

La descarga del DEM desde el servidor de NASA fue lenta: 11.7 MB de 28 MB en 200 segundos, unos 60 KB/s. Al interrumpirse dejó un archivo truncado, y el script lo daba por bueno en la siguiente ejecución. El servidor habría arrancado con un DEM incompleto.

## La corrección

[scripts/fetch-data.mjs](../../scripts/fetch-data.mjs) ahora:

- Descarga a un archivo `.part` y solo lo renombra cuando el tamaño coincide con el esperado.
- Reanuda donde se quedó.
- Reintenta hasta seis veces.
- Detecta un archivo truncado de una ejecución anterior y lo completa.

Se comprobó que el archivo reanudado es idéntico, byte a byte, al descargado de una vez.

## Otros arreglos de la publicación

- **Registro de paquetes.** 204 de las 205 entradas de `package-lock.json` apuntaban a un espejo de npm que se había colgado durante la instalación. Se cambiaron al registro oficial, para que cualquier clon instale sin depender del espejo.
- **DEM fuera de git.** Se ignoran `server/data/*.img` y los archivos `.part`.

## Compartir en la red local

El mismo día se añadió lo necesario para que otra persona de la misma red abra la herramienta:

- `npm run share` compila y sirve todo en el puerto 8787.
- `npm run dev:lan` sirve la versión de desarrollo, con recarga en vivo, en el puerto 5173.
- El servidor muestra al arrancar la dirección de red que hay que compartir.

Dos cosas a tener en cuenta:

- El servidor de la API ya sirve la versión compilada si existe la carpeta `dist`. El servidor de desarrollo de Vite solo escucha en la propia máquina salvo que se use `dev:lan`.
- Algunas redes grandes aíslan los dispositivos entre sí. En ese caso no hay nada que hacer desde el equipo: usar el punto de acceso de un móvil.

Estos cambios están sin subir; entran con [S03](../specs/S03-ci-y-despliegue.md).

## Qué enseña

Probar desde un clon limpio encuentra fallos que en la máquina de desarrollo no se ven. Queda como regla de trabajo en el [plan](../PLAN.md).

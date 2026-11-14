---
fecha: 2026-11-14
titulo: Publicación en GitHub y descarga de datos reanudable
tipo: incidencia
resumen: Al probar un clon limpio apareció un fallo en la descarga del DEM; se corrigió antes de publicar.
---

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

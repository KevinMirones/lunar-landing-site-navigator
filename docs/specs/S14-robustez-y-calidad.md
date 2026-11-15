---
id: S14
titulo: Robustez y calidad
estado: hecha
dia: 6
prioridad: imprescindible
depende: S01, S02, S03, S15
resumen: Que funcione en cualquier equipo y navegador, con teclado, y sin sorpresas en la demostración.
---

# S14: Robustez y calidad

## Problema

Casi todo se ha probado en un solo portátil con un solo navegador. La demostración puede hacerse en otro equipo, con un proyector o con mala conexión. El 14 de noviembre ya apareció el primer caso: una prueba de tiempos que pasaba en un portátil falló en otro (resuelto en [S03](S03-ci-y-despliegue.md)).

## Estado

La parte de código está hecha desde el 15 de noviembre y comprobada con [quality.test.js](../../tests/quality.test.js) (13 pruebas) y en el navegador con [s14-robustez.mjs](../../e2e/s14-robustez.mjs) (11 comprobaciones):

- **Rendimiento adaptativo.** Si 8 fotogramas seguidos promedian más de 33 ms, el mapa de sombras baja primero la resolución del lienzo y después pasa de 150 a 90 pasos de rayo, más largos, con el mismo alcance (unos 456 km). Una pausa de 1.5 s devuelve la calidad completa. Con la CPU del navegador ralentizada, la reproducción baja la calidad y la pausa la recupera.
- **Teclado en el mapa polar:** flechas para desplazar, `+` y `−` para el zoom y `0` para ver todo el polo, con un nombre accesible que lo explica.
- **Contraste.** El texto terciario pasa de `#77746d` (3.7:1) a `#908c83`: 5.1:1 sobre el chasis y 4.6:1 sobre los paneles elevados. Una prueba mide los tres tonos de texto sobre los tres fondos.
- **Estado guardado corrupto o de otra versión:** se ignora lo que no encaje, clave a clave.
- **Sin servidor a mitad de sesión:** la app sigue con una Luna lisa y lo dice.
- **Presupuesto de JavaScript:** `npm run check:bundle`, también en la integración continua. Hoy, 271 KB comprimidos de 350.

Falta, y es trabajo a mano:

1. La lista de 20 acciones en dos equipos, en la versión compilada (criterios 1 y 2).
2. Lighthouse en accesibilidad (criterio 3).
3. Chrome, Edge, Firefox y Safari, un móvil y un proyector a 1280 × 720.
4. Los fotogramas por segundo en una gráfica integrada (criterio 4).
5. La carga inicial en red local y el percentil 95 del horizonte (criterio 5).
6. `npm run e2e` contra la dirección pública, cuando exista (criterio 6).

## Qué verá el usuario

Nada nuevo. La app deja de fallar en los casos límite.

## Diseño

**Rendimiento adaptativo.** El mapa de sombras mide el tiempo por fotograma durante la reproducción. Si la media supera 33 ms, baja primero la resolución del lienzo y después los pasos del rayo de 150 a 90. Al pausar vuelve a la calidad completa. La vista 3D de [S11](S11-vista-3d.md), si existe, usa el mismo mecanismo.

**Navegadores y pantallas:** Chrome, Edge, Firefox y Safari; móvil; proyector a 1280 × 720.

**Accesibilidad:**

- Mapa polar manejable con teclado: flechas para desplazar, `+` y `−` para el zoom.
- Contraste: el texto terciario (`#77746d` sobre `#1a1b1e`) tiene un contraste de 3.7:1, por debajo del mínimo de 4.5:1 para texto pequeño. Hay que aclararlo.
- Orden de foco lógico y foco visible en todos los controles, incluidos los botones que pliegan paneles y las barras laterales cerradas.
- Con "reducir movimiento" activado en el sistema no hay transiciones: la hoja de estilos ya lo hace; falta comprobarlo con los paneles plegables y con la tarjeta del recorrido.

**Estados de carga y de error:**

- El servidor cae a mitad de sesión.
- El horizonte tarda: indicador de carga en lugar de pantalla vacía.
- Sin internet: la app ya cae a una Luna lisa; el aviso debe verse.
- El estado guardado de los paneles está corrupto o es de una versión anterior: se ignora y se usan los valores por defecto.

**Presupuestos:**

| Medida | Límite | Hoy |
| --- | --- | --- |
| JavaScript de la carga inicial, comprimido | 350 KB | 262 KB |
| Carga inicial en red local | 3 s | sin medir |
| Petición de horizonte (percentil 95) | 200 ms | unos 55 ms con terreno de 20 m |

La vista 3D se carga bajo demanda y no cuenta en la carga inicial.

**Lista de 20 acciones** para la caza de errores, hecha por una persona que no haya programado esa parte. Las acciones de specs recortadas se tachan.

1. Abrir la app y esperar a que cargue el mapa.
2. Seleccionar cinco sitios seguidos.
3. Cambiar la fecha de alunizaje a mano, y probar las cuatro duraciones y las tres alturas de mástil.
4. Reproducir, pausar y cambiar de velocidad.
5. Arrastrar la línea de tiempo y moverla con el teclado.
6. Hacer zoom y desplazar el mapa polar, con el ratón y con el teclado.
7. Hacer clic en el mapa para crear un punto, y añadir coordenadas a mano, válidas e inválidas.
8. Cambiar entre mapa polar, globo y terreno 3D, y entre las capas de Sol y de Tierra.
9. Añadir, duplicar y eliminar escenarios hasta el máximo de seis.
10. Hacer clic en el calendario anual y aplicar una de las mejores fechas.
11. Buscar el mejor punto cerca, cambiar el radio y el criterio, y añadir un resultado.
12. Plegar y desplegar cada panel, ampliar el mapa y recargar: el estado se conserva.
13. Cambiar el panel solar, los consumos y la batería, y ver cambiar el veredicto.
14. Cambiar el margen de elevación y la red de estaciones.
15. Hacer el recorrido guiado completo, y en otro intento salir a la mitad.
16. Cambiar entre vista sencilla y experta.
17. Descargar los dos CSV e imprimir el informe.
18. Copiar el enlace y abrirlo en otro navegador; cambiar de idioma con todo abierto.
19. Comprobar con JPL Horizons, y estrechar la ventana hasta el ancho de un móvil.
20. Apagar el servidor y seguir usando la app.

## Criterios de aceptación

1. Las 20 acciones pasan sin errores en dos equipos distintos, en la versión compilada.
2. No hay errores en la consola en ninguna de ellas.
3. Lighthouse da 90 o más en accesibilidad.
4. La reproducción se mantiene por encima de 30 fotogramas por segundo en una gráfica integrada.
5. Se cumplen los tres presupuestos.
6. `npm run e2e` pasa contra la versión compilada y contra la dirección pública.

## Pruebas

- A mano: la lista de 20 acciones, que se guarda marcada en `docs/historial/` junto a la versión 1.0.
- Automáticas: el tamaño del JavaScript, en la integración continua, y las pruebas de navegador de [S15](S15-pruebas-de-navegador.md).

## Fuera de alcance

- Funciones nuevas. Al empezar esta spec se congela el alcance.

## Riesgos

- **Aparecen fallos graves el último día.** Por eso las specs anteriores exigen probar cada función en el navegador antes de darla por hecha, y las pruebas de navegador se repiten en cada cambio.
- **Varias personas tocan los mismos archivos hasta el final.** Durante esta spec solo entran correcciones, de una en una y por pull request.

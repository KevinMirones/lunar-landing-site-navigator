---
id: S14
titulo: Robustez y calidad
estado: pendiente
dia: 6
prioridad: imprescindible
depende: S01, S02, S03
resumen: Que funcione en cualquier equipo y navegador, con teclado, y sin sorpresas en la demostración.
---

# S14: Robustez y calidad

## Problema

Todo se ha probado en un solo portátil con un solo navegador. La demostración puede hacerse en otro equipo, con un proyector o con mala conexión.

## Qué verá el usuario

Nada nuevo. La app deja de fallar en los casos límite.

## Diseño

**Rendimiento adaptativo.** El mapa de sombras mide el tiempo por fotograma durante la reproducción. Si la media supera 33 ms, baja primero la resolución del lienzo y después los pasos del rayo de 150 a 90. Al pausar vuelve a la calidad completa.

**Navegadores y pantallas:** Chrome, Edge, Firefox y Safari; móvil; proyector a 1280 × 720.

**Accesibilidad:**

- Mapa polar manejable con teclado: flechas para desplazar, `+` y `−` para el zoom.
- Contraste: el texto terciario (`#77746d` sobre `#1a1b1e`) tiene un contraste de 3.7:1, por debajo del mínimo de 4.5:1 para texto pequeño. Hay que aclararlo.
- Orden de foco lógico y foco visible en todos los controles.

**Estados de carga y de error:**

- El servidor cae a mitad de sesión.
- El horizonte tarda: indicador de carga en lugar de pantalla vacía.
- Sin internet: la app ya cae a una Luna lisa; el aviso debe verse.

**Presupuestos:**

| Medida | Límite | Hoy |
| --- | --- | --- |
| JavaScript comprimido | 350 KB | 253 KB |
| Carga inicial en red local | 3 s | sin medir |
| Petición de horizonte (percentil 95) | 200 ms | unos 30 ms |

**Lista de 20 acciones** para la caza de errores, hecha por otra persona:

1. Abrir la app y esperar a que cargue el mapa.
2. Seleccionar cinco sitios seguidos.
3. Cambiar la fecha de alunizaje a mano.
4. Probar las cuatro duraciones.
5. Probar las tres alturas de mástil.
6. Reproducir, pausar y cambiar de velocidad.
7. Arrastrar la línea de tiempo.
8. Mover la línea de tiempo con el teclado.
9. Hacer zoom y desplazar el mapa polar.
10. Hacer clic en el mapa para crear un punto.
11. Añadir coordenadas a mano, válidas e inválidas.
12. Cambiar entre mapa polar y globo.
13. Cambiar la capa entre Sol y Tierra.
14. Añadir, duplicar y eliminar escenarios.
15. Hacer clic en el calendario anual.
16. Copiar el enlace y abrirlo en otro navegador.
17. Cambiar de idioma con todo lo anterior abierto.
18. Comprobar con JPL Horizons.
19. Estrechar la ventana hasta el ancho de un móvil.
20. Apagar el servidor y seguir usando la app.

## Criterios de aceptación

1. Las 20 acciones pasan sin errores en dos equipos distintos.
2. No hay errores en la consola en ninguna de ellas.
3. Lighthouse da 90 o más en accesibilidad.
4. La reproducción se mantiene por encima de 30 fotogramas por segundo en una gráfica integrada.
5. Se cumplen los tres presupuestos.

## Pruebas

- A mano: la lista de 20 acciones, que se guarda marcada junto a la versión 1.0.
- Automáticas: el tamaño del JavaScript, en la integración continua.

## Fuera de alcance

- Funciones nuevas. A mediodía del día 6 se congela el alcance.

## Riesgos

- **Aparecen fallos graves el último día.** Por eso las specs anteriores exigen probar cada función en el navegador antes de darla por hecha.

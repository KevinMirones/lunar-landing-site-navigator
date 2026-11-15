---
fecha: 2026-11-15
titulo: El mapa polar se queda en sus datos y la lista saca sitios de la comparación
tipo: incidencia
resumen: Al probar la versión integrada se vio que los botones de zoom del mapa no hacían nada, que el mapa se podía arrastrar fuera de sus datos y que no había forma clara de sacar un sitio de la comparación. Corregido.
---

# El mapa polar se queda en sus datos y la lista saca sitios de la comparación

Tres fallos de la interfaz, vistos al probar `main` después de integrar S08 a S16.

## Los botones + / − / ⌂ del mapa no hacían nada

El mapa captura el puntero al pulsar para poder arrastrarse. Como los botones están encima del mapa, su clic llegaba al mapa y no a ellos. Además, ese clic evaluaba el punto que había debajo del botón. Ahora el mapa no captura el puntero cuando se pulsa un botón. El teclado (+, −, 0) ya funcionaba y no cambia.

## El mapa se abría descentrado y se podía arrastrar fuera

Al cargar, el mapa saltaba al sitio seleccionado aunque ya se viera, y se podía arrastrar o alejar hasta dejar medio recuadro en negro. Ahora:

- **Abre centrado en el polo, con el mapa entero a la vista.** Es también lo más lejos que se puede alejar.
- **Con el mapa entero a la vista, arrastrar no lo mueve.** Al acercar se puede recorrer, pero el borde de los datos no pasa del borde del recuadro.
- Si el recuadro es más ancho que el mapa, el mapa queda centrado en ese eje.
- Al elegir un sitio, el mapa solo se mueve si el sitio queda fuera del recuadro.

La regla está en `src/lib/mapView.ts`, con sus pruebas.

## No se podía sacar un sitio de la comparación desde la lista

"Comparar" añade un escenario con ese sitio, y "(1)" cuenta los escenarios que lo usan. Solo se podían borrar desde la tabla de abajo, y la lista se guarda en el enlace, así que volvía al refrescar. Ahora, junto a "Comparar (n)", hay una × que quita todos los escenarios de ese sitio. Siempre queda al menos un escenario, así que la × del último sitio aparece desactivada y explica por qué.

## Cómo se verificó

Pruebas unitarias del encuadre y de `removeSiteScenarios`, y un flujo de navegador nuevo, `e2e/mapa-y-comparar.mjs`, con 12 comprobaciones. Los 15 flujos pasan.

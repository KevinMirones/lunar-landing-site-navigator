---
fecha: 2026-11-15
titulo: El mapa polar se queda en sus datos y la lista saca sitios de la comparación
title: The polar map stays on its data and the list takes sites out of the comparison
tipo: incidencia
resumen: Al probar la versión integrada se vio que los botones de zoom del mapa no hacían nada, que el mapa se podía arrastrar fuera de sus datos y que no había forma clara de sacar un sitio de la comparación. Corregido.
summary: Testing the integrated version showed that the map's zoom buttons did nothing, that the map could be dragged off its data and that there was no clear way to take a site out of the comparison. Fixed.
---

<a id="en"></a>
**English** | [Español](#es)

# The polar map stays on its data and the list takes sites out of the comparison

Three interface faults, seen on testing `main` after integrating S08 to S16.

## The map's + / − / ⌂ buttons did nothing

The map captures the pointer on press so that it can be dragged. As the buttons sit on top of the map, their click reached the map and not them. That click also evaluated the point under the button. Now the map does not capture the pointer when a button is pressed. The keyboard (+, −, 0) already worked and does not change.

## The map opened off-centre and could be dragged away

On loading, the map jumped to the selected site even if it was already in view, and it could be dragged or zoomed out until half the frame was black. Now:

- **It opens centred on the pole, with the whole map in view.** That is also as far as it can be zoomed out.
- **With the whole map in view, dragging does not move it.** Zoomed in, it can be panned, but the edge of the data does not pass the edge of the frame.
- If the frame is wider than the map, the map stays centred on that axis.
- On choosing a site, the map only moves if the site lies outside the frame.

The rule is in `src/lib/mapView.ts`, with its tests.

## A site could not be taken out of the comparison from the list

"Compare" adds a scenario with that site, and "(1)" counts the scenarios that use it. They could only be deleted from the table below, and the list is saved in the link, so it came back on refresh. Now, next to "Compare (n)", there is an × that removes all the scenarios of that site. At least one scenario always remains, so the × of the last site appears disabled and explains why.

## How it was verified

Unit tests of the framing and of `removeSiteScenarios`, and a new browser flow, `e2e/mapa-y-comparar.mjs`, with 12 checks. All 15 flows pass.

---

<a id="es"></a>
**Español** | [English](#en)

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

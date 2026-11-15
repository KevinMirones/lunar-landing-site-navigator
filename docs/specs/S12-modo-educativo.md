---
id: S12
titulo: Modo educativo
title: Educational mode
estado: hecha
dia: 5
prioridad: imprescindible
depende: S01
resumen: Un recorrido guiado de cinco pasos, un glosario y una vista sencilla para quien no es especialista.
summary: A five-step guided tour, a glossary and a simple view for non-specialists.
---

<a id="en"></a>
**English** | [Español](#es)

# S12: Educational mode

## Problem

The challenge brief asks to serve educators and the public too. The app has explanatory sentences, but a newcomer sees a console full of figures and does not know where to start.

## Status

Implemented on 15 November and checked in the browser with [s12-educativo.mjs](../../e2e/s12-educativo.mjs) (21 checks):

- The five steps, with arrows and Escape. Leaving at any step restores scenarios, instant, map, layer and collapsed panels, and the address does not change during the tour (criteria 2 and 3).
- Texts in Spanish and English, 30 words at most. An automated test requires 40 at most (criterion 4).
- In the simple view no element marked as expert stays visible, and the link with `x=simple` opens in the simple view (criteria 5 and 6).
- Ten glossary terms, which open with a click or the keyboard and close with Escape.

Criterion 1 is missing: that someone new to the subject does the tour without help. It is a test with people and is in the parallel work of the [plan](../PLAN.md).

Along the way a design flaw of [S08](S08-energia-y-bateria.md) and [S09](S09-ventanas-de-contacto.md) showed up: their blocks lengthened the status column and stretched the map to 1871 px high, with the visible part in black. On wide screens the status column now scrolls inside itself, like the site list, and the map takes the height of the window.

Differences from the design:

- **Expert elements:** the tables of Sun and Earth angles, the source of the coordinates, the check with JPL Horizons, the mast, the point search, the power and communications blocks, and in the tables the longest night, "both", the battery and the contact.
- **Glossary terms on screen:** all ten. Mast in the top bar; horizon and DEM on the site's terrain line; elevation and azimuth on the Sun card; direct link on the Earth card; viability index in the balance; libration and permanent shadow in the verdict sentences; ephemeris in the footer.

## What the user will see

**Guided tour.** A "Tour" button in the top bar opens a card with Previous, Next and Exit. At each step the app places itself at the right site, date and view, and unfolds the panel it talks about:

| Step | The app shows | Idea |
| --- | --- | --- |
| 1 | Apollo 11, globe, 30-day playback | Near the equator the Sun climbs high: 14 days of light and 14 of night |
| 2 | Connecting Ridge, panorama | At the pole the Sun circles round, grazing the horizon |
| 3 | Floor of Shackleton, shadow map | 20 km from there the Sun never arrives, which is why there may be ice |
| 4 | Malapert, Earth layer | Earth rises and falls with libration; the relief decides whether there is a link |
| 5 | Scenario table | Now plan your mission: compare sites and dates |

Each step has a text of 40 words at most, in Spanish and in English.

**Simple view and expert view.** A switch in the top bar. By default, expert. The simple one keeps the panorama, the map, the countdowns, the index and the verdict sentences, and hides:

- The tables of Sun and Earth angles, the source of the coordinates and the check with JPL Horizons.
- The mast selector and the point search.
- The power and communications blocks ([S08](S08-energia-y-bateria.md), [S09](S09-ventanas-de-contacto.md)).
- In the scenario table, everything except site, landing, strips, sunlight, link and index.

**Glossary.** Terms such as libration, azimuth, elevation or direct link appear underlined; pressing them opens a definition of one or two sentences.

## Design

**Tour.** New `src/lib/tour.ts`: a list of steps, each with its text and the state it applies.

- The state of a step has the same shape as that of a shareable link, `SharedState` of [urlState.ts](../../src/lib/urlState.ts): scenarios, active scenario, hours since landing, map and layer. Applying a step is the same as opening a link.
- In [App.tsx](../../src/App.tsx), the logic that today applies the link on start (`readLink`) is extracted into a function that the tour also uses.
- Each step sets its own date, so that the tour tells the same story on any day. 14 November 2026 is used, the date of the figures in the [pitch](../PITCH.md).
- Each step states which panels must be open (`hero`, `compare`, …). While the tour lasts, panel changes are not saved in the browser.
- On entering, a copy of the state and the panels is saved; on leaving, they are restored.
- During the tour the browser address does not change.
- The card is a non-modal dialog: the app stays visible and usable behind it. Left and right arrows to move and Escape to leave.
- The figures a text quotes must be reproducible in the app at that step, as the plan requires for the figures in the pitch.

**Simple view.**

- The app container carries `data-view="simple"` or `data-view="expert"`.
- Each expert-only element is marked with `data-level="expert"`, and a rule in [styles.css](../../src/styles.css) hides it in the simple view. Specs that add engineering blocks only have to mark them.
- The view chosen goes in the link: parameter `x=simple`. Without it, expert.
- No computation changes.

**Glossary.**

- New `src/lib/glossary.ts`, with each term in Spanish and in English: libration, azimuth, elevation, horizon, direct link, mast, permanent shadow, viability index, ephemeris and DEM.
- `Term` component: a button with its associated definition, accessible with keyboard and screen reader. Escape closes it.
- It is used in the verdict sentences and in the panel labels.

## Acceptance criteria

1. Someone new to the subject completes the tour without help and explains in their own words why the south pole is difficult.
2. The tour can be driven with the keyboard alone (arrows and Escape).
3. Leaving the tour, at any step, returns the app to the state it was in: scenarios, instant, map, layer and panels.
4. All the texts of the tour and the glossary exist in Spanish and in English, and none in the tour exceeds 40 words.
5. In the simple view no element marked as expert stays visible.
6. The link copied in the simple view opens in the simple view.

## Tests

- Automated: each step produces the expected state, leaving restores it, and criterion 4.
- In the browser: criteria 2, 3, 5 and 6, with a new flow in `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- By hand: criterion 1, with at least one person.

## Out of scope

- Quizzes, scores or game mode.
- Voice narration.
- A tour the user can edit.

## Risks

- **The steps depend on particular dates and sites.** Each step sets its date, and a test checks that the sites it uses exist in the catalogue.
- **A figure in the tour stops being true** when the terrain or the coordinates change. They are reviewed together with those of the pitch before delivery.
- **Possible cut:** the glossary can be postponed; the tour cannot.

---

<a id="es"></a>
**Español** | [English](#en)

# S12: Modo educativo

## Problema

La consigna pide servir también a educadores y al público. La app tiene frases explicativas, pero un recién llegado ve una consola llena de cifras y no sabe por dónde empezar.

## Estado

Implementada el 15 de noviembre y comprobada en el navegador con [s12-educativo.mjs](../../e2e/s12-educativo.mjs) (21 comprobaciones):

- Los cinco pasos, con flechas y Escape. Salir en cualquier paso devuelve escenarios, instante, mapa, capa y paneles plegados, y la dirección no cambia durante el recorrido (criterios 2 y 3).
- Textos en español e inglés, de 30 palabras como máximo. Una prueba automática exige 40 como máximo (criterio 4).
- En vista sencilla no queda visible ningún elemento marcado como experto, y el enlace con `x=simple` abre en vista sencilla (criterios 5 y 6).
- Diez términos del glosario, que se abren con un clic o con el teclado y se cierran con Escape.

Falta el criterio 1: que una persona ajena al tema haga el recorrido sin ayuda. Es una prueba con personas y está en el trabajo en paralelo del [plan](../PLAN.md).

Por el camino apareció un fallo de diseño de [S08](S08-energia-y-bateria.md) y [S09](S09-ventanas-de-contacto.md): sus bloques alargaban la columna de estado y estiraban el mapa hasta 1871 px de alto, con la parte visible en negro. En pantallas anchas la columna de estado se desplaza ahora por dentro, como la lista de sitios, y el mapa ocupa el alto de la ventana.

Diferencias con el diseño:

- **Elementos expertos:** las tablas de ángulos del Sol y la Tierra, la fuente de las coordenadas, la comprobación con JPL Horizons, el mástil, el buscador de puntos, los bloques de energía y comunicaciones, y en las tablas la noche más larga, "ambos", la batería y el contacto.
- **Términos del glosario en pantalla:** los diez. Mástil en la barra superior; horizonte y DEM en la línea del terreno del sitio; elevación y azimut en la tarjeta del Sol; enlace directo en la de la Tierra; índice de viabilidad en el balance; libración y sombra permanente en las frases de veredicto; efemérides en el pie.

## Qué verá el usuario

**Recorrido guiado.** Un botón "Recorrido" en la barra superior abre una tarjeta con Anterior, Siguiente y Salir. En cada paso la app se coloca sola en el sitio, la fecha y la vista adecuados, y despliega el panel del que habla:

| Paso | La app muestra | Idea |
| --- | --- | --- |
| 1 | Apollo 11, globo, reproducción de 30 días | Cerca del ecuador el Sol sube alto: 14 días de luz y 14 de noche |
| 2 | Connecting Ridge, panorama | En el polo el Sol da la vuelta rozando el horizonte |
| 3 | Fondo de Shackleton, mapa de sombras | A 20 km de ahí nunca llega el Sol, y por eso puede haber hielo |
| 4 | Malapert, capa de la Tierra | La Tierra sube y baja por la libración; el relieve decide si hay enlace |
| 5 | Tabla de escenarios | Ahora planifica tu misión: compara sitios y fechas |

Cada paso tiene un texto de 40 palabras como máximo, en español y en inglés.

**Vista sencilla y vista experta.** Un conmutador en la barra superior. Por defecto, la experta. La sencilla deja el panorama, el mapa, las cuentas atrás, el índice y las frases de veredicto, y esconde:

- Las tablas de ángulos del Sol y de la Tierra, la fuente de las coordenadas y la comprobación con JPL Horizons.
- El selector de mástil y el buscador de puntos.
- Los bloques de energía y de comunicaciones ([S08](S08-energia-y-bateria.md), [S09](S09-ventanas-de-contacto.md)).
- En la tabla de escenarios, todo salvo sitio, alunizaje, franjas, luz, enlace e índice.

**Glosario.** Términos como libración, azimut, elevación o enlace directo aparecen subrayados; al pulsarlos se abre una definición de una o dos frases.

## Diseño

**Recorrido.** Nuevo `src/lib/tour.ts`: una lista de pasos, cada uno con su texto y el estado que aplica.

- El estado de un paso tiene la misma forma que el de un enlace compartible, `SharedState` de [urlState.ts](../../src/lib/urlState.ts): escenarios, escenario activo, horas desde el alunizaje, mapa y capa. Aplicar un paso es lo mismo que abrir un enlace.
- En [App.tsx](../../src/App.tsx), la lógica que hoy aplica el enlace al arrancar (`readLink`) se extrae a una función que también usa el recorrido.
- Cada paso fija su propia fecha, para que el recorrido cuente lo mismo cualquier día. Se usa el 14 de noviembre de 2026, la fecha de las cifras del [guion](../PITCH.md).
- Cada paso indica qué paneles deben estar abiertos (`hero`, `compare`, …). Mientras dura el recorrido, los cambios de paneles no se guardan en el navegador.
- Al entrar se guarda una copia del estado y de los paneles; al salir se restauran.
- Durante el recorrido la dirección del navegador no cambia.
- La tarjeta es un diálogo no modal: la app sigue visible y usable detrás. Flechas izquierda y derecha para moverse y Escape para salir.
- Las cifras que cite un texto deben poder reproducirse en la app en ese paso, como exige el plan para las cifras del guion.

**Vista sencilla.**

- El contenedor de la app lleva `data-view="simple"` o `data-view="expert"`.
- Cada elemento solo para expertos se marca con `data-level="expert"`, y una regla de [styles.css](../../src/styles.css) lo esconde en la vista sencilla. Las specs que añaden bloques de ingeniería solo tienen que marcarlos.
- La vista elegida va en el enlace: parámetro `x=simple`. Sin él, experta.
- No cambia ningún cálculo.

**Glosario.**

- Nuevo `src/lib/glossary.ts`, con cada término en español y en inglés: libración, azimut, elevación, horizonte, enlace directo, mástil, sombra permanente, índice de viabilidad, efemérides y DEM.
- Componente `Term`: un botón con su definición asociada, accesible con teclado y lector de pantalla. Escape la cierra.
- Se usa en las frases de veredicto y en las etiquetas de los paneles.

## Criterios de aceptación

1. Una persona ajena al tema completa el recorrido sin ayuda y explica con sus palabras por qué el polo sur es difícil.
2. El recorrido se maneja solo con teclado (flechas y Escape).
3. Salir del recorrido, en cualquier paso, devuelve la app al estado en que estaba: escenarios, instante, mapa, capa y paneles.
4. Todos los textos del recorrido y del glosario existen en español y en inglés, y ninguno del recorrido pasa de 40 palabras.
5. En vista sencilla no queda visible ningún elemento marcado como experto.
6. El enlace copiado en vista sencilla abre en vista sencilla.

## Pruebas

- Automáticas: cada paso produce el estado esperado, salir lo restaura, y el criterio 4.
- En el navegador: criterios 2, 3, 5 y 6, con un flujo nuevo en `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- A mano: criterio 1, con al menos una persona.

## Fuera de alcance

- Cuestionarios, puntuaciones o modo juego.
- Narración de voz.
- Un recorrido editable por el usuario.

## Riesgos

- **Los pasos dependen de fechas y sitios concretos.** Cada paso fija su fecha, y una prueba comprueba que los sitios que usa existen en el catálogo.
- **Una cifra del recorrido deja de ser cierta** al cambiar el terreno o las coordenadas. Se revisan junto con las del guion antes de la entrega.
- **Recorte posible:** el glosario puede aplazarse; el recorrido no.

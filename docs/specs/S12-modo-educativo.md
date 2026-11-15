---
id: S12
titulo: Modo educativo
estado: hecha
dia: 5
prioridad: imprescindible
depende: S01
resumen: Un recorrido guiado de cinco pasos, un glosario y una vista sencilla para quien no es especialista.
---

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

---
id: S12
titulo: Modo educativo
estado: pendiente
dia: 5
prioridad: imprescindible
depende: S01
resumen: Un recorrido guiado de cinco pasos, un glosario y una vista sencilla para quien no es especialista.
---

# S12: Modo educativo

## Problema

La consigna pide servir también a educadores y al público. El MVP tiene frases explicativas, pero un recién llegado ve una consola llena de cifras y no sabe por dónde empezar.

## Qué verá el usuario

**Recorrido guiado.** Un botón "Recorrido" abre una tarjeta con Anterior, Siguiente y Salir. En cada paso la app se coloca sola en el sitio, la fecha y la vista adecuados:

| Paso | La app muestra | Idea |
| --- | --- | --- |
| 1 | Apollo 11, reproducción de 30 días | Cerca del ecuador el Sol sube alto: 14 días de luz y 14 de noche |
| 2 | Connecting Ridge, panorama | En el polo el Sol da la vuelta rozando el horizonte |
| 3 | Fondo de Shackleton, mapa de sombras | A 20 km de ahí nunca llega el Sol, y por eso puede haber hielo |
| 4 | Malapert, capa de la Tierra | La Tierra sube y baja por la libración; el relieve decide si hay enlace |
| 5 | Tabla de escenarios | Ahora planifica tu misión: compara sitios y fechas |

Cada paso tiene un texto de 40 palabras como máximo, en español y en inglés.

**Vista sencilla y vista experta.** Un conmutador en la barra superior. La sencilla esconde las tablas de ángulos, el mástil y los bloques de ingeniería, y deja el panorama, el mapa y las frases de veredicto.

**Glosario.** Términos como libración, azimut, elevación o enlace directo aparecen subrayados; al pulsarlos se abre una definición de una o dos frases.

## Diseño

- Nuevo `src/lib/tour.ts`: lista de pasos, cada uno con el estado que aplica y su texto.
- Al salir del recorrido se restaura el estado anterior.
- La vista elegida se guarda en la dirección ([S02](S02-enlaces-compartibles.md)).
- El glosario es un botón con su descripción asociada, accesible con teclado y lector de pantalla.

## Criterios de aceptación

1. Una persona ajena al tema completa el recorrido sin ayuda y explica con sus palabras por qué el polo sur es difícil.
2. El recorrido se maneja solo con teclado (flechas y Escape).
3. Salir del recorrido devuelve la app al estado en que estaba.
4. Todos los textos existen en español y en inglés.
5. En vista sencilla no aparece ningún ángulo ni unidad técnica.

## Pruebas

- Automáticas: cada paso aplica el estado esperado y salir lo restaura.
- A mano: criterio 1 con al menos una persona, y criterio 2.

## Fuera de alcance

- Cuestionarios, puntuaciones o modo juego.
- Narración de voz.

## Riesgos

- **Los pasos dependen de fechas concretas.** Cada paso fija su propia fecha, para que el recorrido cuente lo mismo cualquier día.
- **Recorte posible:** el glosario puede aplazarse; el recorrido no.

---
id: S11
titulo: Vista 3D del terreno
estado: pendiente
dia: 5
prioridad: recortable
depende: S06
resumen: Ver el paisaje real alrededor del sitio, con sus sombras y el Sol y la Tierra en el cielo.
---

# S11: Vista 3D del terreno

## Problema

El panorama muestra el horizonte como una silueta plana. La consigna sugiere "visualizaciones 3D de la superficie", y ver el relieve con sus sombras es lo que mejor transmite por qué el polo sur es difícil.

## Qué verá el usuario

- Una tercera pestaña en el mapa: "Terreno 3D".
- El relieve real en unos 40 km alrededor del sitio, iluminado desde la dirección real del Sol.
- El Sol y la Tierra en el cielo, en su posición.
- Dos cámaras: "desde el módulo" (a la altura del mástil, se gira arrastrando) y "vista aérea".
- Un conmutador de exageración vertical: real o triple.
- Se mueve con la línea de tiempo y con la reproducción.

## Diseño

**Servicio** `GET /api/patch?lat&lon&size=40&n=256`: devuelve una malla cuadrada de alturas en el plano tangente del sitio, tomada de la malla más fina disponible ([S06](S06-terreno-multirresolucion.md)). La curvatura lunar ya va restada, para que el terreno lejano caiga bajo el horizonte.

**Dibujo** con `three.js`, que ya usa [Globe.tsx](../../src/components/Globe.tsx):

- Plano de 256 × 256 vértices desplazado por la malla de alturas (unos 130 000 triángulos).
- Sombras con el mismo método del mapa polar: un trazado de rayos sobre la malla de alturas en el sombreador. Los mapas de sombras convencionales fallan con luz casi horizontal.
- Cielo negro, sin atmósfera. El Sol y la Tierra se dibujan a escala, con una opción para ampliarlos.

## Criterios de aceptación

1. Desde la cámara del módulo, las cumbres del horizonte coinciden con la silueta del panorama en tres direcciones (diferencia menor de 1°).
2. El Sol queda tapado por el relieve exactamente cuando el estado del sitio dice "Oculto".
3. Mantiene 30 fotogramas por segundo en una gráfica integrada.
4. Sin WebGL, muestra un mensaje claro y el resto de la app sigue funcionando.

## Pruebas

- A mano: los cuatro criterios. No hay pruebas automáticas de dibujo.

## Fuera de alcance

- Texturas fotográficas del terreno.
- Recorridos de un rover.
- Realidad virtual.

## Riesgos

- **Es la primera spec que se recorta si vamos tarde.** El panorama y el mapa polar ya cubren lo que exige la consigna.
- **Con 240 m de celda el paisaje se ve tosco.** Por eso depende del terreno fino.

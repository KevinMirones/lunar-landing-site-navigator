---
id: S02
titulo: Enlaces compartibles
title: Shareable links
estado: hecha
dia: 1
prioridad: imprescindible
depende: S01
resumen: Copiar un enlace que abre exactamente la misma comparación en otro navegador.
summary: Copy a link that opens exactly the same comparison in another browser.
---

<a id="en"></a>
**English** | [Español](#es)

# S02: Shareable links

## Problem

The challenge brief talks about coordinating science and engineering teams. Today there is no way to send someone else what you are looking at: reloading the page loses everything.

## What the user will see

- The browser address always reflects the state: scenarios, active scenario, selected instant, language, map type and layer.
- A "Copy link" button copies that address and confirms with "Link copied".
- Opening the link on another machine shows the same comparison.
- If the link is damaged, the app keeps what it could read, uses the defaults for the rest and says so: "The link could not be read in full. What was missing was replaced with the defaults."
- With no clipboard available (for example, when the app is opened over http on the local network), the classic copy is tried; if that does not work either, the link is shown to be copied by hand.

## Design

- New `src/lib/urlState.ts` with two pure functions, `encode(state)` and `decode(query)`.
- Compact format in the query string. Example:

  ```
  ?s=ridge@2026-11-14T00:00~30~2;-85.95,-2.93@2026-12-05T00:00~30~10&a=0&t=36&l=es&v=polar&m=sun
  ```

  - `s`: scenarios separated by `;`, each one `site@landing~days~mast`. A catalogue site goes by its id; a custom one, as `latitude,longitude` with five decimals (0.3 m). With three decimals the point moved by up to 16 m, and that [changed the results](../historial/2026-11-14-06-dieciseis-metros.md).
  - `a`: index of the active scenario. `t`: hours since landing. `l`, `v`, `m`: language, map and layer.
- The address is updated with `history.replaceState`, with a 300 ms delay, and never during playback.
- `decode` validates each field; what it does not understand is dropped and noted for the warning. Unknown parameters are ignored without a warning, so that a link from a later version still opens.
- `toShared` and `fromShared` convert between the app's scenarios and those of the link. A custom point travels as coordinates and is called "Custom N" when the link is opened.

## Acceptance criteria

1. Encoding and decoding returns the same state.
2. A link opened in another browser shows the same table, with the same figures.
3. A tampered address (`?s=xxx`) does not break the app and shows the warning.
4. With six scenarios, the address does not exceed 2000 characters.
5. Playing the mission adds no entries to the browser history.

## Tests

- Automated: round trip, invalid inputs and maximum length.
- By hand: criteria 2 and 5.

## Out of scope

- Link shortener and user accounts.
- Saving in the browser (the address already does that job).

## Risks

- Later specs add state (power, simple mode). Each one must extend `urlState.ts` and its tests; an old link must keep opening.

---

<a id="es"></a>
**Español** | [English](#en)

# S02: Enlaces compartibles

## Problema

La consigna habla de coordinar equipos de ciencia e ingeniería. Hoy no hay forma de enviar a otra persona lo que se está viendo: al recargar la página se pierde todo.

## Qué verá el usuario

- La dirección del navegador refleja siempre el estado: escenarios, escenario activo, instante seleccionado, idioma, tipo de mapa y capa.
- Un botón "Copiar enlace" copia esa dirección y confirma con "Enlace copiado".
- Abrir el enlace en otro equipo muestra la misma comparación.
- Si el enlace está dañado, la app conserva lo que pudo leer, usa los valores por defecto para el resto y avisa: "El enlace no se pudo leer completo. Lo que faltaba se sustituyó por los valores por defecto."
- Sin portapapeles disponible (por ejemplo, al abrir la app por http en la red local), se intenta la copia clásica; si tampoco funciona, se muestra el enlace para copiarlo a mano.

## Diseño

- Nuevo `src/lib/urlState.ts` con dos funciones puras, `encode(state)` y `decode(query)`.
- Formato compacto en la cadena de consulta. Ejemplo:

  ```
  ?s=ridge@2026-11-14T00:00~30~2;-85.95,-2.93@2026-12-05T00:00~30~10&a=0&t=36&l=es&v=polar&m=sun
  ```

  - `s`: escenarios separados por `;`, cada uno `sitio@alunizaje~días~mástil`. Un sitio del catálogo va por su id; uno propio, como `latitud,longitud` con cinco decimales (0.3 m). Con tres decimales el punto se movía hasta 16 m, y eso [cambiaba los resultados](../historial/2026-11-14-06-dieciseis-metros.md).
  - `a`: índice del escenario activo. `t`: horas desde el alunizaje. `l`, `v`, `m`: idioma, mapa y capa.
- La dirección se actualiza con `history.replaceState`, con un retardo de 300 ms, y nunca durante la reproducción.
- `decode` valida cada campo; lo que no entiende se descarta y se anota para el aviso. Los parámetros desconocidos se ignoran sin aviso, para que un enlace de una versión posterior siga abriendo.
- `toShared` y `fromShared` convierten entre los escenarios de la app y los del enlace. Un punto propio viaja como coordenadas y al abrir el enlace se llama "Custom N".

## Criterios de aceptación

1. Codificar y decodificar devuelve el mismo estado.
2. Un enlace abierto en otro navegador muestra la misma tabla, con las mismas cifras.
3. Una dirección manipulada (`?s=xxx`) no rompe la app y muestra el aviso.
4. Con seis escenarios, la dirección no supera 2000 caracteres.
5. Reproducir la misión no añade entradas al historial del navegador.

## Pruebas

- Automáticas: ida y vuelta, entradas inválidas y longitud máxima.
- A mano: criterios 2 y 5.

## Fuera de alcance

- Acortador de enlaces y cuentas de usuario.
- Guardado en el navegador (la dirección ya cumple esa función).

## Riesgos

- Las specs posteriores añaden estado (energía, modo sencillo). Cada una debe ampliar `urlState.ts` y sus pruebas; un enlace antiguo debe seguir abriendo.

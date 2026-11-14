---
id: S02
titulo: Enlaces compartibles
estado: pendiente
dia: 1
prioridad: imprescindible
depende: S01
resumen: Copiar un enlace que abre exactamente la misma comparación en otro navegador.
---

# S02: Enlaces compartibles

## Problema

La consigna habla de coordinar equipos de ciencia e ingeniería. Hoy no hay forma de enviar a otra persona lo que se está viendo: al recargar la página se pierde todo.

## Qué verá el usuario

- La dirección del navegador refleja siempre el estado: escenarios, escenario activo, instante seleccionado, idioma, tipo de mapa y capa.
- Un botón "Copiar enlace" copia esa dirección y confirma con "Enlace copiado".
- Abrir el enlace en otro equipo muestra la misma comparación.
- Si el enlace está dañado, la app abre con los valores por defecto y avisa: "El enlace no se pudo leer completo. Se muestran los valores por defecto."

## Diseño

- Nuevo `src/lib/urlState.ts` con dos funciones puras, `encode(state)` y `decode(query)`.
- Formato compacto en la cadena de consulta. Ejemplo:

  ```
  ?s=ridge@2026-11-14T00:00~30~2;-85.95,-2.93@2026-12-05T00:00~30~10&a=0&t=36&l=es&v=polar&m=sun
  ```

  - `s`: escenarios separados por `;`, cada uno `sitio@alunizaje~días~mástil`. Un sitio del catálogo va por su id; uno propio, como `latitud,longitud` con tres decimales.
  - `a`: índice del escenario activo. `t`: horas desde el alunizaje. `l`, `v`, `m`: idioma, mapa y capa.
- La dirección se actualiza con `history.replaceState`, con un retardo de 300 ms, y nunca durante la reproducción.
- `decode` valida cada campo; lo que no entiende se descarta y se anota para el aviso.

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

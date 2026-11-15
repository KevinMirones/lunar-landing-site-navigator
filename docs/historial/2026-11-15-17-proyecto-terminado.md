---
fecha: 2026-11-15
titulo: Proyecto terminado (v1.0.0)
tipo: hito
resumen: Las 17 specs están hechas y LUMINA se cierra con la etiqueta v1.0.0. Se despliega en Hostinger con todos los datos. Queda anotado qué no se pudo comprobar a mano.
---

# Proyecto terminado (v1.0.0)

El equipo dio el proyecto por terminado el 15 de noviembre. `main` lleva todo lo hecho y la etiqueta `v1.0.0` marca ese punto.

## Qué hay en la 1.0

- **Las 17 specs, hechas:** escenarios y enlaces compartibles (S01, S02), integración continua (S03), buscador de puntos (S04), mejores fechas (S05), terreno multirresolución y validación (S06, S07), energía y batería (S08), ventanas de contacto (S09), exportación (S10), vista 3D (S11), modo educativo (S12), catálogo de 37 sitios (S13), robustez (S14), pruebas de navegador (S15), sombra permanente (S16) y relieve en toda la Luna (S17).
- **Verificación al cerrar:**
  - `npm run typecheck`, `npm test` y `npm run test:perf` pasan: 257 pruebas, y 5 más que necesitan las mallas finas del polo.
  - `npm run build`, `npm run check:bundle` (275 KB de JavaScript inicial) y `npm run docs:check` pasan.
  - `E2E_GLOBAL=1 npm run e2e` pasa sus 16 flujos de navegador en 159 s.

## Despliegue

- **En Hostinger, como aplicación Node.js de hPanel conectada a GitHub,** en lugar de Render. El equipo ya tenía allí un plan con aplicaciones Node.js.
- **Con todos los datos:** la malla del polo de 240 m, la malla global de 474 m, la sombra permanente y los precalculados de los 37 sitios.
- **El límite de 15 minutos de compilación de Hostinger** obligó a añadir `npm run build:deploy`. Descarga en paralelo y se detiene a los 11 minutos, y el siguiente despliegue continúa desde ahí. La app funciona aunque la malla global no haya terminado.
- **Los pasos** están en el [README](../../README.md#en-hostinger-aplicación-nodejs-de-hpanel). La aplicación la crea el equipo con su cuenta.

## Lo que quedó sin comprobar

Son pruebas a mano o que necesitan cuentas. Ninguna bloquea el uso de la herramienta.

| Spec | Pendiente |
| --- | --- |
| [S03](../specs/S03-ci-y-despliegue.md) | Poner la dirección pública en el README cuando exista la aplicación en Hostinger. Ver la integración continua en verde en GitHub. La copia estática, que era opcional |
| [S10](../specs/S10-exportacion.md) | Abrir los CSV en Excel y en Google Sheets |
| [S11](../specs/S11-vista-3d.md) | Medir los fotogramas por segundo en una gráfica integrada. La fase 2 (vista aérea), que era opcional |
| [S12](../specs/S12-modo-educativo.md) | Que una persona ajena al tema haga el recorrido sin ayuda |
| [S14](../specs/S14-robustez-y-calidad.md) | Las 20 acciones en dos equipos, Lighthouse, cuatro navegadores, un móvil y un proyector, y `npm run e2e` contra la dirección pública |
| [S15](../specs/S15-pruebas-de-navegador.md) | Ver en verde en GitHub el paso de las pruebas de navegador |
| [S17](../specs/S17-relieve-global.md) | Comparar los panoramas de Apollo 15 y Apollo 17 con las fotos de las misiones |

## Si se retoma

- Las ideas que quedaron fuera están en el apartado "Fuera de alcance" de cada spec.
- La más pedida al cerrar fue ver la superficie rocosa de los sitios Apollo. Necesitaría los modelos de relieve de LROC NAC, de pocos metros, que solo cubren una franja alrededor de cada sitio.

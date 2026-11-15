---
fecha: 2026-11-15
titulo: Proyecto terminado (v1.0.0)
title: Project finished (v1.0.0)
tipo: hito
resumen: Las 17 specs están hechas y LUMINA se cierra con la etiqueta v1.0.0. Se despliega en Hostinger con todos los datos. Queda anotado qué no se pudo comprobar a mano.
summary: All 17 specs are done and LUMINA closes with the v1.0.0 tag. It is deployed on Hostinger with all the data. What could not be checked by hand is on record.
---

<a id="en"></a>
**English** | [Español](#es)

# Project finished (v1.0.0)

The team called the project finished on 15 November. `main` carries everything done and the `v1.0.0` tag marks that point.

## What is in 1.0

- **All 17 specs, done:** scenarios and shareable links (S01, S02), continuous integration (S03), point search (S04), best dates (S05), multi-resolution terrain and validation (S06, S07), power and battery (S08), contact windows (S09), export (S10), 3D view (S11), educational mode (S12), catalogue of 37 sites (S13), robustness (S14), browser tests (S15), permanent shadow (S16) and relief across the whole Moon (S17).
- **Verification on closing:**
  - `npm run typecheck`, `npm test` and `npm run test:perf` pass: 257 tests, and 5 more that need the fine polar grids.
  - `npm run build`, `npm run check:bundle` (275 KB of initial JavaScript) and `npm run docs:check` pass.
  - `E2E_GLOBAL=1 npm run e2e` passes its 16 browser flows in 159 s.

## Deployment

- **On Hostinger, as an hPanel Node.js app connected to GitHub,** instead of Render. The team already had a plan there with Node.js apps.
- **With all the data:** the 240 m polar grid, the 474 m global grid, permanent shadow and the precomputed files of the 37 sites.
- **Hostinger's 15-minute build limit** made it necessary to add `npm run build:deploy`. It downloads in parallel and stops after 11 minutes, and the next deployment continues from there. The app works even if the global grid has not finished.
- **The steps** are in the [README](../../README.md#on-hostinger-hpanel-nodejs-app). The team creates the app with its account.

## What was left unchecked

They are manual tests or tests that need accounts. None blocks the use of the tool.

| Spec | Pending |
| --- | --- |
| [S03](../specs/S03-ci-y-despliegue.md) | Putting the public address in the README once the app exists on Hostinger. Seeing continuous integration green on GitHub. The static copy, which was optional |
| [S10](../specs/S10-exportacion.md) | Opening the CSVs in Excel and in Google Sheets |
| [S11](../specs/S11-vista-3d.md) | Measuring frames per second on an integrated graphics card. Phase 2 (aerial view), which was optional |
| [S12](../specs/S12-modo-educativo.md) | Someone new to the subject doing the tour without help |
| [S14](../specs/S14-robustez-y-calidad.md) | The 20 actions on two machines, Lighthouse, four browsers, a phone and a projector, and `npm run e2e` against the public address |
| [S15](../specs/S15-pruebas-de-navegador.md) | Seeing the browser tests step green on GitHub |
| [S17](../specs/S17-relieve-global.md) | Comparing the panoramas of Apollo 15 and Apollo 17 with the missions' photos |

## If it is picked up again

- The ideas left out are in the "Out of scope" section of each spec.
- The most requested on closing was seeing the rocky surface of the Apollo sites. It would need the LROC NAC relief models, a few metres per cell, which only cover a strip around each site.

---

<a id="es"></a>
**Español** | [English](#en)

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

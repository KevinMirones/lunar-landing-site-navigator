# Documentación de LUMINA

> Índice generado con `npm run docs:index` a partir de la cabecera de cada archivo. No lo edites a mano.

## Por dónde empezar

- [README del proyecto](../README.md): Qué es LUMINA, cómo funciona y cómo arrancarlo.
- [Plan de implementación](PLAN.md): Qué está hecho, qué falta y en qué orden; reparto, reglas de trabajo, recortes y riesgos.
- [Guion para el jurado](PITCH.md): Problema, resultados, demostración de tres minutos y preguntas probables.
- [Validación científica](VALIDACION.md): Comparación de los resultados de LUMINA con valores publicados.

## Specs

16 specs: 4 pendientes, 4 en curso, 8 hechas, 0 recortadas.

| ID | Spec | Día | Prioridad | Estado | Depende de |
| --- | --- | --- | --- | --- | --- |
| S01 | [Escenarios comparables](specs/S01-escenarios.md)<br>Comparar lado a lado el mismo sitio en fechas, duraciones o mástiles distintos. | 1 | imprescindible | hecha | — |
| S02 | [Enlaces compartibles](specs/S02-enlaces-compartibles.md)<br>Copiar un enlace que abre exactamente la misma comparación en otro navegador. | 1 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S03 | [Integración continua y despliegue público](specs/S03-ci-y-despliegue.md)<br>Cada cambio se prueba solo y hay una dirección pública que el jurado puede abrir. | 1 | imprescindible | en curso | — |
| S04 | [Buscador de puntos cercanos](specs/S04-buscador-de-puntos.md)<br>Mapa de calor alrededor de un punto y los cinco mejores lugares para aterrizar cerca. | 2 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S05 | [Buscador de mejores fechas](specs/S05-mejores-fechas.md)<br>Las cinco mejores fechas de alunizaje del año para un sitio y una duración dados. | 2 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S06 | [Terreno multirresolución](specs/S06-terreno-multirresolucion.md)<br>Horizonte calculado con celdas de 20 a 80 m cerca del sitio, en lugar de 240 m. | 3 | imprescindible | hecha | — |
| S07 | [Validación científica y coordenadas oficiales](specs/S07-validacion-y-coordenadas.md)<br>Tabla que compara nuestros resultados con los publicados, y cada sitio con su fuente. | 3 | imprescindible | hecha | [S06](specs/S06-terreno-multirresolucion.md) |
| S08 | [Modelo de energía y batería](specs/S08-energia-y-bateria.md)<br>Potencia, energía diaria y batería necesaria para sobrevivir la noche más larga. | 4 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S09 | [Ventanas de contacto reales](specs/S09-ventanas-de-contacto.md)<br>Enlace con margen de elevación y con las estaciones de tierra que ven la Luna en cada momento. | 4 | imprescindible | hecha | [S01](specs/S01-escenarios.md) |
| S10 | [Exportación de ventanas e informe](specs/S10-exportacion.md)<br>Descargar las ventanas en CSV e imprimir un informe de una página con la comparación. | 4 | recortable | en curso | [S01](specs/S01-escenarios.md), [S08](specs/S08-energia-y-bateria.md), [S09](specs/S09-ventanas-de-contacto.md) |
| S11 | [Vista 3D del terreno](specs/S11-vista-3d.md)<br>Ver el paisaje real alrededor del sitio, con sus sombras y el Sol y la Tierra en el cielo. | 5 | recortable | pendiente | [S06](specs/S06-terreno-multirresolucion.md) |
| S12 | [Modo educativo](specs/S12-modo-educativo.md)<br>Un recorrido guiado de cinco pasos, un glosario y una vista sencilla para quien no es especialista. | 5 | imprescindible | en curso | [S01](specs/S01-escenarios.md) |
| S13 | [Catálogo ampliado y polo norte](specs/S13-catalogo-y-polo-norte.md)<br>Más sitios históricos y futuros, con buscador, y terreno real también en el polo norte. | 5 | recortable | pendiente | [S07](specs/S07-validacion-y-coordenadas.md) |
| S14 | [Robustez y calidad](specs/S14-robustez-y-calidad.md)<br>Que funcione en cualquier equipo y navegador, con teclado, y sin sorpresas en la demostración. | 6 | imprescindible | pendiente | [S01](specs/S01-escenarios.md), [S02](specs/S02-enlaces-compartibles.md), [S03](specs/S03-ci-y-despliegue.md), [S15](specs/S15-pruebas-de-navegador.md) |
| S15 | [Pruebas de navegador en el repositorio](specs/S15-pruebas-de-navegador.md)<br>Una orden que abre la app en un navegador real y comprueba cada función, también en cada pull request. | 4 | imprescindible | en curso | [S03](specs/S03-ci-y-despliegue.md) |
| S16 | [Distancia a la sombra permanente](specs/S16-sombra-permanente.md)<br>Cada sitio dice a qué distancia tiene la zona en sombra permanente más cercana, donde puede conservarse hielo. | 5 | recortable | pendiente | [S04](specs/S04-buscador-de-puntos.md), [S07](specs/S07-validacion-y-coordenadas.md) |

## Historial del proyecto

De lo más reciente a lo más antiguo.

| Fecha | Entrada | Tipo |
| --- | --- | --- |
| 2026-11-14 | [Todas las specs pendientes, listas para implementar](historial/2026-11-14-12-specs-completas-y-plan.md)<br>S03 y S08 a S14 revisadas contra el código real, dos specs nuevas (S15 y S16) y un plan con orden, reparto y reglas. | decisión |
| 2026-11-14 | [Paneles plegables, mapa ampliado y logo nuevo](historial/2026-11-14-11-paneles-plegables.md)<br>Cada sección se pliega y recuerda su estado; un botón deja el mapa a todo el ancho. Mezclado con S01 a S07 y ya en main. | hito |
| 2026-11-14 | [Specs S06 y S07 implementadas](historial/2026-11-14-10-specs-s06-y-s07.md)<br>Terreno de 20 a 80 m, horizontes precalculados y validación contra los mapas de NASA y Gläser et al. | hito |
| 2026-11-14 | [Dos decimales de latitud bastaban a 240 m; a 20 m, no](historial/2026-11-14-09-trescientos-metros.md)<br>Con terreno fino, el punto de Shackleton del catálogo pasó de 100% a 12% de luz; sus coordenadas tenían 300 m de margen. | hallazgo |
| 2026-11-14 | [Specs S01 a S05 implementadas](historial/2026-11-14-08-specs-s01-a-s05.md)<br>Escenarios, enlaces compartibles, buscador de puntos y de fechas, y el servidor listo para publicarse. | hito |
| 2026-11-14 | [Un retraso de cinco meses lleva la cresta de 100% a 28% de luz](historial/2026-11-14-07-estaciones-lunares.md)<br>El buscador de fechas muestra las estaciones lunares; el invierno austral cae a finales de abril de 2027. | hallazgo |
| 2026-11-14 | [Redondear un punto 16 m cambiaba su enlace de 100% a 93%](historial/2026-11-14-06-dieciseis-metros.md)<br>Los puntos propios se guardaban con tres decimales; ahora se guardan con cinco. | hallazgo |
| 2026-11-14 | [Plan de la semana convertido en 14 specs](historial/2026-11-14-05-plan-y-specs.md)<br>El trabajo pendiente queda dividido en specs con estado, y el índice se genera solo. | decisión |
| 2026-11-14 | [Publicación en GitHub y descarga de datos reanudable](historial/2026-11-14-04-publicacion-y-descarga.md)<br>Al probar un clon limpio apareció un fallo en la descarga del DEM; se corrigió antes de publicar. | incidencia |
| 2026-11-14 | [En Malapert, 1.2 km separan 0% y 100% de enlace](historial/2026-11-14-03-hallazgo-malapert.md)<br>El punto del catálogo quedaba tapado por su propia ladera; movido 1.2 km tiene enlace continuo. | hallazgo |
| 2026-11-14 | [Decisiones de diseño del MVP](historial/2026-11-14-02-decisiones-de-diseno.md)<br>Por qué las efemérides van en el navegador, el terreno en el servidor, y cómo se define "visible". | decisión |
| 2026-11-14 | [MVP construido y verificado](historial/2026-11-14-01-mvp.md)<br>Primera versión completa de LUMINA, de la efeméride a la interfaz, etiquetada como mvp-v0.1.0. | hito |

## Cómo mantener esto

- **Cambiar el estado de una spec:** edita `estado` en su cabecera (`pendiente`, `en curso`, `hecha`, `recortada`) y ejecuta `npm run docs:index`.
- **Añadir una spec:** copia [specs/_plantilla.md](specs/_plantilla.md) con el siguiente número (`S15-nombre.md`).
- **Añadir una entrada al historial:** crea `historial/AAAA-MM-DD-NN-nombre.md` con `fecha`, `titulo`, `tipo` (`hito`, `decisión`, `hallazgo`, `incidencia`) y `resumen`.
- **Comprobar:** `npm run docs:check` falla si el índice está desactualizado, falta un campo o hay un enlace roto.

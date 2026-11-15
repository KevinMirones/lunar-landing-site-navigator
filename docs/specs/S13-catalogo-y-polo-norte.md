---
id: S13
titulo: Catálogo ampliado y polo norte
estado: pendiente
dia: 5
prioridad: recortable
depende: S07
resumen: Más sitios históricos y futuros, con buscador, y terreno real también en el polo norte.
---

# S13: Catálogo ampliado y polo norte

## Problema

El catálogo tiene 18 sitios: 12 del polo sur con terreno real y 6 del resto de la Luna. La consigna menciona misiones Apollo, objetivos CLPS, misiones comerciales y programas de otros países; hay huecos evidentes. Además, el terreno real solo cubre el polo sur.

## Qué verá el usuario

- Unos 35 sitios, agrupados por región y programa.
- Un campo de búsqueda en la lista, por nombre, programa o año.
- Opcional: un conmutador norte/sur en el mapa polar y horizonte real al norte de 80°N.

## Diseño

### Catálogo

**Sitios que se añaden**, cada uno con su fuente según la regla de [S07](S07-validacion-y-coordenadas.md):

- Apollo 12, 14, 15 y 16.
- Luna 9, 16, 17 y 24; Surveyor 1 y 3.
- Chang'e 3, 5 y 6.
- Las regiones candidatas de Artemis III que falten de las nueve de octubre de 2024, como puntos representativos.
- Próximas misiones CLPS y comerciales con sitio anunciado.

**Cambios en [sites.ts](../../src/lib/sites.ts):**

- Campo nuevo `program`: `apollo`, `luna`, `surveyor`, `change`, `chandrayaan`, `clps`, `artemis`, `commercial` u `other`.
- Campo nuevo `year`: año del alunizaje, o el previsto. Se omite en los puntos que no corresponden a una misión.
- La búsqueda compara el texto con el nombre, la etiqueta, el programa y el año.

**Lista de sitios** (`SiteList` en [Panels.tsx](../../src/components/Panels.tsx)): campo de búsqueda arriba y grupos plegables por región.

**Sitios polares nuevos.** Cada sitio al sur de 80°S necesita sus horizontes precalculados, y sus parches si [S11](S11-vista-3d.md) está hecha. Hay que ejecutar `npm run precompute` en un equipo con las mallas finas y subir los archivos nuevos.

**Regla:** un sitio sin fuente fiable de coordenadas no entra en el catálogo.

### Polo norte (opcional)

Los productos equivalentes existen. Comprobado el 14 de noviembre de 2026 en el mismo servidor del que se descargan los del sur:

| Producto | Celda | Tamaño |
| --- | --- | --- |
| `ldem_75n_240m` | 240 m | 29 MB, igual que el del sur |
| `ldem_80n_80m` | 80 m | 116 MB |
| `ldem_85n_40m` | 40 m | 115 MB |
| `ldem_875n_20m` | 20 m | 115 MB |

- Solo se usa la malla de 240 m: `npm run fetch-data -- --north`.
- [dem.js](../../server/dem.js), [horizon.js](../../server/horizon.js) y el sombreador de [PolarMap.tsx](../../src/components/PolarMap.tsx) suponen el polo sur. Hay que generalizar el signo de la proyección y la cobertura (hoy `COVERAGE_MAX_LAT = -80`).
- `/api/heightmap` admite `pole=n`, y el mapa polar gana el conmutador norte/sur.
- `Site.group` gana el valor `north`.
- El buscador de puntos y las mallas finas del norte quedan fuera.

## Criterios de aceptación

1. El catálogo tiene al menos 35 sitios, todos con fuente y programa, y con año los que corresponden a una misión.
2. Buscar "CLPS" o "1972" filtra la lista correctamente.
3. Los enlaces compartibles con sitios nuevos funcionan.
4. Todo sitio nuevo al sur de 80°S tiene sus tres horizontes precalculados.
5. Si se hace el polo norte: un punto en el borde del cráter Peary muestra horizonte con terreno real, y todas las pruebas del polo sur dan los mismos resultados que antes.

## Pruebas

- Automáticas: ningún id repetido, coordenadas dentro de rango, todos los sitios con fuente y programa, el filtro de búsqueda y el criterio 4. La prueba de [sites.test.ts](../../tests/sites.test.ts) ya cubre parte.
- En el navegador: la búsqueda y los grupos, en `npm run e2e` ([S15](S15-pruebas-de-navegador.md)).
- A mano: criterio 5.

## Fuera de alcance

- Sitios de impacto y de orbitadores.
- Fichas detalladas de cada misión.
- Terreno fino y buscador de puntos en el polo norte.

## Riesgos

- **Recorte posible:** todo el polo norte, y después los sitios extra. Ninguno es necesario para la demostración.
- **Coordenadas sin fuente fiable.** Ese sitio no entra.
- **Generalizar el polo rompe el sur.** El criterio 5 exige que las pruebas actuales no cambien.
- **Quien añada sitios polares necesita las mallas finas** (345 MB) para precalcular.

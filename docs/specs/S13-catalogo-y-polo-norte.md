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

El catálogo tiene 18 sitios. La consigna menciona misiones Apollo, objetivos CLPS, misiones comerciales y programas de otros países; hay huecos evidentes. Además, el terreno real solo cubre el polo sur.

## Qué verá el usuario

- Unos 35 sitios, agrupados por región y programa.
- Un campo de búsqueda en la lista, por nombre, agencia o año.
- Opcional: un conmutador norte/sur en el mapa polar y horizonte real al norte de 80°N.

## Diseño

**Sitios que se añaden**, cada uno con su fuente según [S07](S07-validacion-y-coordenadas.md):

- Apollo 12, 14, 15 y 16.
- Luna 9, 16, 17 y 24; Surveyor 1 y 3.
- Chang'e 3, 5 y 6.
- Las regiones candidatas de Artemis III que falten.
- Próximas misiones CLPS y comerciales con sitio anunciado.

La lista de [sites.ts](../../src/lib/sites.ts) gana un campo `programa` para agrupar y buscar.

**Polo norte (opcional):**

- Usar el producto LOLA equivalente del polo norte, si existe con la misma resolución; hay que comprobarlo en el catálogo.
- [dem.js](../../server/dem.js) y el sombreador del mapa polar suponen el polo sur. Hay que generalizar el signo de la proyección.

## Criterios de aceptación

1. El catálogo tiene al menos 35 sitios, todos con fuente.
2. Buscar "CLPS" o "1972" filtra la lista correctamente.
3. Los enlaces compartibles con sitios nuevos funcionan.
4. Si se hace el polo norte: un punto en el borde del cráter Peary muestra horizonte con terreno real.

## Pruebas

- Automáticas: ningún id repetido, coordenadas dentro de rango y todos los sitios con fuente.
- A mano: criterios 2 y 4.

## Fuera de alcance

- Sitios de impacto y de orbitadores.
- Fichas detalladas de cada misión.

## Riesgos

- **Recorte posible:** todo el polo norte, y después los sitios extra. Ninguno es necesario para la demostración.
- **Coordenadas sin fuente fiable.** Un sitio sin fuente no entra en el catálogo.

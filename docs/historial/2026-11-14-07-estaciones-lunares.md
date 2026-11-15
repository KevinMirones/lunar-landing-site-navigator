---
fecha: 2026-11-14
titulo: Un retraso de cinco meses lleva la cresta de 100% a 28% de luz
tipo: hallazgo
resumen: El buscador de fechas muestra las estaciones lunares; el invierno austral cae a finales de abril de 2027.
---

# Un retraso de cinco meses lleva la cresta de 100% a 28% de luz

## Qué se vio

Al probar el [buscador de mejores fechas](../specs/S05-mejores-fechas.md) en Connecting Ridge, las fechas propuestas caían entre julio y septiembre de 2027. La prueba automática esperaba que julio fuera invierno y falló.

## Qué era

El código estaba bien; la suposición era incorrecta. La Luna tiene estaciones suaves: el Sol se aleja hasta 1.5° al norte o al sur de su ecuador, en un ciclo de unos 347 días. En el polo, donde el Sol roza el horizonte, ese grado y medio lo decide todo.

Calculado con las efemérides del proyecto:

| Momento | Fecha | Latitud del Sol sobre la Luna |
| --- | --- | --- |
| Pleno verano austral | 14 de noviembre de 2026 | 1.56° sur |
| Solsticio de invierno austral | 27 de abril de 2027 | 1.55° norte |

Luz media de una misión de 30 días en Connecting Ridge, según el mes de alunizaje (mástil de 2 m, terreno de 240 m):

| nov 26 | dic | ene 27 | feb | mar | abr | may | jun | jul | ago | sept | oct |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 100% | 100% | 100% | 82% | 47% | 28% | 36% | 70% | 98% | 100% | 100% | 100% |

El peor día del año para aterrizar es el 16 de abril de 2027, once días antes del solsticio: 27% de luz e índice 27, frente a 85 en las mejores fechas.

## Qué se hizo

- La prueba ahora calcula el solsticio a partir de las efemérides, de forma independiente del código que comprueba, y exige que las mejores fechas queden a más de 60 días de él.
- Las fechas propuestas se separan al menos siete días. Con tres, como decía la spec, los datos reales daban cuatro fechas casi seguidas.

## Qué enseña

- Es el argumento más directo para el guion sobre retrasos: el mismo sitio, con cinco meses de retraso, pasa de luz continua a menos de un tercio.
- Las fechas de este proyecto empiezan, por casualidad, en pleno verano austral. Las cifras de "100% de luz" del guion son el mejor caso del año y conviene decirlo.

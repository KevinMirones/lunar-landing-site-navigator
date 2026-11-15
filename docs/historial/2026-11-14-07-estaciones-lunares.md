---
fecha: 2026-11-14
titulo: Un retraso de cinco meses lleva la cresta de 100% a 28% de luz
title: A five-month delay takes the ridge from 100% to 28% sunlight
tipo: hallazgo
resumen: El buscador de fechas muestra las estaciones lunares; el invierno austral cae a finales de abril de 2027.
summary: The date search shows the lunar seasons; southern winter falls at the end of April 2027.
---

<a id="en"></a>
**English** | [Español](#es)

# A five-month delay takes the ridge from 100% to 28% sunlight

## What was seen

On trying the [search for the best dates](../specs/S05-mejores-fechas.md) at Connecting Ridge, the proposed dates fell between July and September 2027. The automated test expected July to be winter and failed.

## What it was

The code was fine; the assumption was wrong. The Moon has mild seasons: the Sun moves up to 1.5° north or south of its equator, in a cycle of about 347 days. At the pole, where the Sun grazes the horizon, that degree and a half decides everything.

Computed with the project's ephemeris:

| Moment | Date | Latitude of the Sun over the Moon |
| --- | --- | --- |
| Height of southern summer | 14 November 2026 | 1.56° south |
| Southern winter solstice | 27 April 2027 | 1.55° north |

Average sunlight of a 30-day mission at Connecting Ridge, by landing month (2 m mast, 240 m terrain):

| Nov 26 | Dec | Jan 27 | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 100% | 100% | 100% | 82% | 47% | 28% | 36% | 70% | 98% | 100% | 100% | 100% |

The worst day of the year to land is 16 April 2027, eleven days before the solstice: 27% sunlight and an index of 27, against 85 on the best dates.

## What was done

- The test now computes the solstice from the ephemeris, independently of the code it checks, and requires the best dates to lie more than 60 days from it.
- The proposed dates are at least seven days apart. With three, as the spec said, the real data gave four dates almost in a row.

## What it teaches

- It is the most direct argument for the pitch about delays: the same site, five months late, goes from continuous sunlight to under a third.
- The dates of this project start, by chance, at the height of southern summer. The "100% sunlight" figures in the pitch are the best case of the year, and it is worth saying so.

---

<a id="es"></a>
**Español** | [English](#en)

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

# LUMINA: guion para el jurado

## La idea en una frase

LUMINA responde en segundos la pregunta que hoy exige tres herramientas y horas de trabajo: **si aterrizo aquí, en esta fecha, ¿tendré luz para mis paneles y línea de vista con la Tierra?**

## El problema

Cerca del polo sur lunar el Sol apenas se levanta unos pocos grados sobre el horizonte. Con una luz tan rasante, una colina a 50 km decide si un módulo tiene energía o se congela, y la libración hace que la Tierra aparezca y desaparezca tras el relieve cada mes.

Quickmap, Moon Trek y JPL Horizons tienen los datos, pero están hechos para análisis detallado: para evaluar un solo par sitio-fecha hay que recorrer varias interfaces e interpretar tablas. Cuando un lanzamiento se retrasa, los equipos de ciencia e ingeniería necesitan comparar alternativas ya, no la semana siguiente.

## Qué demostramos

Cuatro resultados que salen de la propia herramienta, con datos reales de NASA:

1. **1.6 km lo cambian todo, y a veces 40 m.** En el macizo Malapert, un punto en la ladera sur tiene 0% de enlace directo con la Tierra durante una misión de 30 días. En la cima, a 1.6 km, tiene 100% de enlace y 100% de luz. Y 40 m al sur de la cima el enlace ya baja a 51%. LUMINA encuentra ese punto con su buscador.
2. **Mismo polo, destinos opuestos.** Para un alunizaje el 14 de noviembre de 2026: la cresta entre Shackleton y de Gerlache recibe Sol el 100% de 30 días; el fondo de Shackleton, a 20 km, el 0%.
3. **El calendario decide.** La misma cresta, con el alunizaje en abril de 2027 en lugar de noviembre de 2026, baja de 100% a 56% de luz: es el invierno austral lunar. Noviembre es el mejor caso del año, y lo decimos.
4. **Precisión comprobable.** Las efemérides coinciden con JPL Horizons con un error máximo de 0.0037° en 300 comparaciones. Y la luz calculada coincide con la publicada: en un punto de la cresta, Gläser et al. (2018) dan 82.0% de visibilidad solar en 20 años y 165 horas de sombra máxima; LUMINA da 82.1% y 165 horas. La tabla completa, con las diferencias que no cuadran y su explicación, está en [VALIDACION.md](VALIDACION.md).

## Cómo funciona

- **Efemérides en el navegador.** Posición del Sol y la Tierra y orientación de la Luna con libración incluida. 14 microsegundos por instante, lo que permite animar una misión entera sin esperas.
- **Horizonte real.** El servidor traza 720 rayos sobre la topografía LOLA de Lunar Reconnaissance Orbiter (celdas de 20 m junto al polo, de 40 y 80 m más lejos), con la curvatura de la Luna, y obtiene la silueta del terreno vista desde el sitio en 55 milisegundos.
- **Sin atmósfera, sin excusas.** En la Luna no hay refracción ni crepúsculo. Comparamos el disco de cada astro con la línea del terreno y obtenemos qué fracción se ve.
- **Mapa de sombras en vivo.** La tarjeta gráfica repite ese cálculo para cada píxel del polo sur, así que se ve la sombra barrer los cráteres mientras avanza el tiempo.

## Demostración en 3 minutos

Antes de empezar, fijar el alunizaje en el 14 de noviembre de 2026 a las 00:00 UTC: las cifras de este guion corresponden a esa fecha.

1. **El cielo (30 s).** Abrir en Connecting Ridge. Señalar el panorama: el Sol a 1.5° rozando el terreno, la Tierra oculta. "Esto es lo que vería la cámara del módulo."
2. **El tiempo (30 s).** Pulsar Reproducir. El Sol da la vuelta al horizonte sin ponerse; la Tierra sube y baja por la libración. En el mapa, las sombras giran.
3. **Comparar sitios (45 s).** Bajar a la tabla. Cuatro sitios, mismas fechas: cresta 100% de luz, fondo de Shackleton 0%, cima de Malapert 100% de luz y de enlace. "Ciencia quiere el hielo del fondo; ingeniería quiere la luz de la cresta. Aquí negocian con los mismos números."
4. **El retraso (45 s).** "El lanzamiento se retrasa a abril." Hacer clic en abril en el calendario anual. Todo se recalcula al instante: en invierno la cresta baja a 56% de luz.
5. **Un punto cualquiera (30 s).** Clic en el mapa sobre un cráter: horizonte, ventanas e índice en menos de un segundo. Cambiar el mástil de 2 a 10 m y ver cómo se abre el horizonte.
6. **La prueba (15 s).** Pulsar "Comprobar con JPL Horizons": diferencia de milésimas de grado, en vivo.

## Para quién sirve

- **Planificadores de misión (CLPS, Artemis):** cribado rápido de sitios y fechas antes del análisis fino, y lenguaje común entre ciencia e ingeniería.
- **Docentes:** el contraste entre Apollo 11 (14 días de luz, 14 de noche, Tierra fija en el cielo) y el polo sur se entiende de un vistazo.
- **Público:** frases en lenguaje llano generadas a partir de los datos, en español e inglés.

## Lo que no hace (todavía)

Decirlo antes de que lo pregunten da credibilidad:

- El terreno real cubre de 80°S a 90°S; fuera de ahí se usa una Luna lisa.
- Con celdas de 20 a 80 m no se ven rocas ni relieve de pocos metros, y cerca de una cresta 40 m cambian el resultado.
- A ras de suelo nuestros números difieren de los publicados hasta 20 puntos; a 2 m, que es donde va un panel, coinciden.
- El enlace es geométrico: no modela antenas ni estaciones de tierra.
- El índice de viabilidad es orientativo, no un criterio de misión.

## Siguiente fase

- Topografía LOLA de 5 m alrededor de los sitios candidatos.
- Polo norte y relieve global.
- Informe exportable.
- Visibilidad de satélites repetidores para sitios sin línea de vista.

## Preguntas probables

**¿Por qué no usar directamente JPL Horizons?** Horizons da el ángulo del Sol sobre una esfera ideal y para un sitio y una consulta cada vez. No sabe nada del terreno ni compara escenarios. Lo usamos como referencia para validar.

**¿De dónde sale el terreno?** Del altímetro láser LOLA de Lunar Reconnaissance Orbiter: cuatro productos públicos del Planetary Data System de NASA, de 20, 40, 80 y 240 m por celda.

**¿De dónde salen las coordenadas de los sitios?** Cada sitio lo dice en pantalla. Las de misiones ya realizadas y las de los puntos más iluminados están publicadas. NASA da regiones para Artemis III, no puntos, así que esos sitios son representativos y así se etiquetan.

**¿Han comparado la luz con algo publicado?** Sí: con los mapas de 18.6 años del equipo LOLA y con Gläser et al. (2014 y 2018). A 2 m del suelo coincidimos en décimas de punto en dos de cuatro sitios y en menos de 3 puntos en un tercero; a ras de suelo no, y explicamos por qué.

**¿Qué precisión tiene una ventana de luz?** La efeméride aporta un error de milésimas de grado; el límite real es el terreno. Por eso cada sitio indica la resolución usada, y la validación muestra cuánto cambian los resultados entre 240 m y 20 m.

**¿Funciona sin conexión?** La web calcula las efemérides localmente. Sin servidor de terreno sigue funcionando con una Luna lisa y lo avisa.

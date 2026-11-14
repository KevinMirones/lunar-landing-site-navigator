---
id: S08
titulo: Modelo de energía y batería
estado: pendiente
dia: 4
prioridad: imprescindible
depende: S01
resumen: Potencia, energía diaria y batería necesaria para sobrevivir la noche más larga.
---

# S08: Modelo de energía y batería

## Problema

La herramienta dice qué porcentaje del tiempo hay luz, pero un ingeniero necesita vatios, vatios hora y saber si el módulo llega vivo al siguiente amanecer. La consigna pide evaluar el "potencial de generación de energía".

## Qué verá el usuario

- Un bloque "Energía" en el estado del sitio, con unos pocos datos de entrada:
  - Tipo de panel: seguidor vertical, fijo horizontal o fijo inclinado (con inclinación y orientación).
  - Área y eficiencia (por defecto 28%).
  - Consumo en operación y consumo en hibernación.
- Resultados: potencia ahora, energía media diaria, batería mínima necesaria y un veredicto: "sobrevive la noche más larga" o "no sobrevive", con el margen.
- Una fila de potencia en la línea de tiempo.
- Un aviso si hay un eclipse lunar durante la misión.

## Diseño

Nuevo `src/lib/power.ts`, sin dependencias del resto de la interfaz.

**Potencia** en cada instante:

```
P = S × fracción visible × eficiencia × área × cos θ
```

- `S` es la irradiancia solar, 1361 W/m² corregida por la distancia al Sol.
- `cos θ` según el panel: 1 para el seguidor; el seno de la elevación para el horizontal; el producto escalar entre la normal del panel y la dirección al Sol para el inclinado.

**Batería.** Se simula el balance `generación − consumo` a lo largo de la misión. El consumo es el de operación con Sol y el de hibernación sin él. La batería mínima es el mayor déficit acumulado. El veredicto compara ese valor con la capacidad que introduzca el usuario.

**Eclipses lunares.** Vista desde la Luna, la Tierra tapa el Sol durante horas. `astronomy-engine` ya ofrece `SearchLunarEclipse`; se marcan los eclipses que caen dentro de la misión y se anula la generación durante la fase total.

**Supuestos visibles junto al resultado:** sin polvo, sin degradación, sin efecto de la temperatura en el panel.

## Criterios de aceptación

1. Un seguidor a pleno Sol da `1361 × eficiencia × área`, con la corrección de distancia (dentro del 4%).
2. Un panel horizontal en el polo genera menos del 5% que un seguidor en el mismo instante.
3. En Apollo 11, la batería mínima es igual al consumo en hibernación multiplicado por las horas de noche, con un error menor del 2%.
4. Cambiar el tipo de panel actualiza el veredicto sin recargar.
5. Un eclipse lunar total dentro de la misión aparece marcado en la línea de tiempo.

## Pruebas

- Automáticas: criterios 1 a 3 y la detección de un eclipse conocido.
- A mano: criterios 4 y 5.

## Fuera de alcance

- Modelo térmico y calentadores.
- Degradación del panel y acumulación de polvo.
- Dimensionado de generadores de radioisótopos.

## Riesgos

- **Que el modelo crezca sin fin.** Se limita a los cinco datos de entrada de arriba.
- **Falsa precisión.** Los resultados se muestran con dos cifras significativas y los supuestos al lado.

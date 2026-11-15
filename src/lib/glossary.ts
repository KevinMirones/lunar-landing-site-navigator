// Short definitions for the underlined terms of the educational mode (S12).
import type { L10n } from './sites';

export interface GlossaryEntry {
  term: L10n;
  definition: L10n;
}

export const GLOSSARY = {
  libration: {
    term: { es: 'libración', en: 'libration' },
    definition: {
      es: 'El cabeceo aparente de la Luna vista desde la Tierra. Desde la Luna, hace que la Tierra suba y baje unos grados en el cielo a lo largo del mes.',
      en: 'The apparent nodding of the Moon seen from Earth. From the Moon, it makes Earth rise and sink a few degrees in the sky over the month.',
    },
  },
  azimuth: {
    term: { es: 'azimut', en: 'azimuth' },
    definition: { es: 'La dirección en el horizonte, medida en grados desde el norte: 90° es el este, 180° el sur.', en: 'The direction along the horizon, in degrees from north: 90° is east, 180° south.' },
  },
  elevation: {
    term: { es: 'elevación', en: 'elevation' },
    definition: { es: 'La altura de un astro sobre el horizonte ideal, en grados. 0° es el horizonte y 90°, justo encima.', en: 'How high a body sits above the ideal horizon, in degrees. 0° is the horizon and 90° straight overhead.' },
  },
  horizon: {
    term: { es: 'horizonte', en: 'horizon' },
    definition: {
      es: 'La línea donde el terreno corta el cielo vista desde el sitio. En la Luna no hay atmósfera: un astro se ve si está por encima del relieve, y nada más.',
      en: 'The line where the terrain meets the sky, seen from the site. The Moon has no atmosphere: a body is visible if it clears the relief, and that is all.',
    },
  },
  link: {
    term: { es: 'enlace directo', en: 'direct link' },
    definition: {
      es: 'Comunicación por radio con la Tierra sin satélites intermedios. Exige ver la Tierra: si el relieve la tapa, no hay enlace.',
      en: 'Radio contact with Earth with no relay satellites. It needs Earth in view: if the terrain hides it, there is no link.',
    },
  },
  mast: {
    term: { es: 'mástil', en: 'mast' },
    definition: {
      es: 'La altura de los paneles y la antena sobre el suelo. En el polo unos metros más dejan ver por encima de rocas y lomas cercanas.',
      en: 'The height of the panels and antenna above the ground. At the pole a few more metres see over nearby rocks and ridges.',
    },
  },
  shadow: {
    term: { es: 'sombra permanente', en: 'permanent shadow' },
    definition: {
      es: 'Zonas del fondo de algunos cráteres polares donde el Sol no llega nunca. Son tan frías que pueden conservar hielo de agua; que lo haya no está confirmado en cada una.',
      en: 'Areas on the floor of some polar craters that sunlight never reaches. They are cold enough to keep water ice; whether each one holds it is not confirmed.',
    },
  },
  index: {
    term: { es: 'índice de viabilidad', en: 'viability index' },
    definition: {
      es: 'Una nota orientativa de 0 a 100: 40% luz solar, 25% noches cortas y 35% enlace con la Tierra. Sirve para comparar, no es un criterio de misión.',
      en: 'An indicative score from 0 to 100: 40% sunlight, 25% short nights and 35% Earth link. It helps compare; it is not a mission criterion.',
    },
  },
  ephemeris: {
    term: { es: 'efemérides', en: 'ephemeris' },
    definition: {
      es: 'Las posiciones calculadas del Sol, la Tierra y la Luna en cada instante. LUMINA las calcula en el navegador y las compara con JPL Horizons de NASA.',
      en: 'The computed positions of the Sun, Earth and Moon at each instant. LUMINA computes them in the browser and checks them against NASA’s JPL Horizons.',
    },
  },
  dem: {
    term: { es: 'DEM', en: 'DEM' },
    definition: {
      es: 'Modelo digital de elevación: una malla con la altura del terreno en cada celda. LUMINA usa los del altímetro láser LOLA, con celdas de 20 a 240 m.',
      en: 'Digital elevation model: a grid with the height of the ground in each cell. LUMINA uses those of the LOLA laser altimeter, with cells of 20 to 240 m.',
    },
  },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryId = keyof typeof GLOSSARY;

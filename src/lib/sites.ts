export type Lang = 'es' | 'en';
export type L10n = Record<Lang, string>;

export interface Site {
  id: string;
  name: string;
  lat: number;
  /** East longitude, degrees (-180..180). */
  lon: number;
  group: 'south' | 'heritage' | 'custom';
  tag: L10n;
  note: L10n;
  /** Where the coordinates come from. */
  source: L10n;
  /**
   * published: the coordinates are the ones a mission or a paper reports.
   * representative: a point chosen inside a named area; not an official target.
   */
  precision: 'published' | 'representative' | 'custom';
}

// Every entry says where its coordinates come from (see docs/VALIDACION.md).
// NASA names nine candidate regions for Artemis III (28 October 2024) but gives
// no single point for them, so those entries are representative points.
export const CATALOG: Site[] = [
  {
    id: 'ridge',
    name: 'Connecting Ridge',
    lat: -89.4398,
    lon: -137.17,
    group: 'south',
    tag: { es: 'Pico de luz', en: 'Peak of light' },
    note: {
      es: 'Cresta entre Shackleton y de Gerlache; el punto con más luz del polo sur a 2 m del suelo.',
      en: 'Ridge between Shackleton and de Gerlache; the most illuminated spot at the south pole 2 m above ground.',
    },
    source: {
      es: "Gläser et al. (2018), Planetary and Space Science 162, tabla 2: Connecting Ridge C1, a 2 m del suelo.",
      en: "Gläser et al. (2018), Planetary and Space Science 162, table 2: Connecting Ridge C1, 2 m above ground.",
    },
    precision: 'published',
  },
  {
    id: 'shackleton-rim',
    name: 'Shackleton Rim',
    lat: -89.6866,
    lon: -162.81,
    group: 'south',
    tag: { es: 'Pico de luz', en: 'Peak of light' },
    note: {
      es: 'Borde del cráter Shackleton, a metros de sombra permanente con posible hielo.',
      en: 'Rim of Shackleton crater, metres away from permanent shadow that may hold ice.',
    },
    source: {
      es: "Gläser et al. (2018), Planetary and Space Science 162, tabla 2: Shackleton, a 2 m del suelo.",
      en: "Gläser et al. (2018), Planetary and Space Science 162, table 2: Shackleton, 2 m above ground.",
    },
    precision: 'published',
  },
  {
    id: 'shackleton-floor',
    name: 'Shackleton Floor',
    lat: -89.66,
    lon: 129.2,
    group: 'south',
    tag: { es: 'Sombra permanente', en: 'Permanent shadow' },
    note: {
      es: 'Fondo del cráter, 4 km más abajo que el borde: una trampa fría sin Sol ni Tierra.',
      en: 'Crater floor, 4 km below the rim: a cold trap with neither Sun nor Earth.',
    },
    source: {
      es: "Punto elegido para este proyecto en el fondo del cráter Shackleton.",
      en: "Point chosen for this project on the floor of Shackleton crater.",
    },
    precision: 'representative',
  },
  {
    id: 'de-gerlache-rim',
    name: 'de Gerlache Rim',
    lat: -88.67,
    lon: -68.0,
    group: 'south',
    tag: { es: 'Región Artemis III', en: 'Artemis III region' },
    note: { es: 'Borde elevado del cráter de Gerlache.', en: 'Elevated rim of de Gerlache crater.' },
    source: {
      es: "NASA, 28 de octubre de 2024: «de Gerlache Rim 2» es una de las nueve regiones candidatas de Artemis III. NASA no publica un punto único; este es representativo de la zona.",
      en: "NASA, 28 October 2024: \"de Gerlache Rim 2\" is one of the nine Artemis III candidate regions. NASA gives no single point; this one is representative of the area.",
    },
    precision: 'representative',
  },
  {
    id: 'cn-shackleton',
    name: 'Shackleton Rim East',
    lat: -88.8,
    lon: 123.4,
    group: 'south',
    tag: { es: "Objetivo Chang'e 7 (aprox.)", en: "Chang'e 7 target (approx.)" },
    note: {
      es: "Zona objetivo publicada para Chang'e 7 (CNSA); coordenadas aproximadas.",
      en: "Published target area for Chang'e 7 (CNSA); approximate coordinates.",
    },
    source: {
      es: "Fuentes secundarias sitúan el objetivo de Chang'e 7 cerca de 88.8°S, 123.4°E; la CNSA no ha publicado un punto definitivo.",
      en: "Secondary sources place the Chang'e 7 target near 88.8°S, 123.4°E; CNSA has not published a final point.",
    },
    precision: 'representative',
  },
  {
    id: 'malapert',
    name: 'Malapert Massif',
    lat: -85.96703,
    lon: -2.2392,
    group: 'south',
    tag: { es: 'Región Artemis III', en: 'Artemis III region' },
    note: {
      es: 'Cima de un macizo de casi 5 km que mira a la Tierra: excelente para comunicaciones.',
      en: 'Summit of a massif nearly 5 km high that faces Earth: excellent for communications.',
    },
    source: {
      es: "NASA, 28 de octubre de 2024: «Malapert Massif» es una de las nueve regiones candidatas de Artemis III. NASA no publica un punto único; este es la cima, elegida con el buscador de LUMINA sobre terreno de 40 m.",
      en: "NASA, 28 October 2024: \"Malapert Massif\" is one of the nine Artemis III candidate regions. NASA gives no single point; this one is the summit, chosen with LUMINA's search on 40 m terrain.",
    },
    precision: 'representative',
  },
  {
    id: 'haworth',
    name: 'Haworth',
    lat: -86.8,
    lon: -22.0,
    group: 'south',
    tag: { es: 'Región Artemis III', en: 'Artemis III region' },
    note: { es: 'Terreno elevado junto al cráter Haworth.', en: 'High ground next to Haworth crater.' },
    source: {
      es: "NASA, 28 de octubre de 2024: «Haworth» es una de las nueve regiones candidatas de Artemis III. NASA no publica un punto único; este es representativo de la zona.",
      en: "NASA, 28 October 2024: \"Haworth\" is one of the nine Artemis III candidate regions. NASA gives no single point; this one is representative of the area.",
    },
    precision: 'representative',
  },
  {
    id: 'mouton-viper',
    name: 'Mons Mouton (VIPER)',
    lat: -85.42,
    lon: 31.6,
    group: 'south',
    tag: { es: 'Sitio planeado VIPER', en: 'Planned VIPER site' },
    note: {
      es: 'Meseta de Mons Mouton, sitio seleccionado para el rover VIPER de NASA.',
      en: "Mons Mouton plateau, the site selected for NASA's VIPER rover.",
    },
    source: {
      es: "NASA eligió en 2021 Mons Mouton, al oeste del cráter Nobile, para el rover VIPER; el punto es aproximado.",
      en: "In 2021 NASA chose Mons Mouton, west of Nobile crater, for the VIPER rover; the point is approximate.",
    },
    precision: 'representative',
  },
  {
    id: 'nobile',
    name: 'Nobile Rim',
    lat: -85.43,
    lon: 37.0,
    group: 'south',
    tag: { es: 'Región Artemis III', en: 'Artemis III region' },
    note: { es: 'Borde occidental del cráter Nobile.', en: 'Western rim of Nobile crater.' },
    source: {
      es: "NASA, 28 de octubre de 2024: «Nobile Rim 1» es una de las nueve regiones candidatas de Artemis III. NASA no publica un punto único; este es representativo de la zona.",
      en: "NASA, 28 October 2024: \"Nobile Rim 1\" is one of the nine Artemis III candidate regions. NASA gives no single point; this one is representative of the area.",
    },
    precision: 'representative',
  },
  {
    id: 'im2',
    name: 'IM-2 Athena',
    lat: -84.7906,
    lon: 29.1957,
    group: 'south',
    tag: { es: 'CLPS, 2025', en: 'CLPS, 2025' },
    note: {
      es: 'Alunizaje de Intuitive Machines IM-2 en Mons Mouton, el más austral hasta la fecha.',
      en: 'Intuitive Machines IM-2 landing on Mons Mouton, the southernmost to date.',
    },
    source: {
      es: "NASA, Lunar Reconnaissance Orbiter: 84.7906°S, 29.1957°E.",
      en: "NASA, Lunar Reconnaissance Orbiter: 84.7906°S, 29.1957°E.",
    },
    precision: 'published',
  },
  {
    id: 'lcross',
    name: 'Cabeus (LCROSS)',
    lat: -84.675,
    lon: -48.725,
    group: 'south',
    tag: { es: 'NASA, 2009', en: 'NASA, 2009' },
    note: {
      es: 'Impacto de LCROSS que confirmó hielo de agua en un cráter en sombra.',
      en: 'LCROSS impact that confirmed water ice inside a shadowed crater.',
    },
    source: {
      es: "Colaprete et al. (2010), Science 330: 84.675°S, 311.275°E.",
      en: "Colaprete et al. (2010), Science 330: 84.675°S, 311.275°E.",
    },
    precision: 'published',
  },
  {
    id: 'im1',
    name: 'IM-1 Odysseus',
    lat: -80.13,
    lon: 1.44,
    group: 'south',
    tag: { es: 'CLPS, 2024', en: 'CLPS, 2024' },
    note: {
      es: 'Malapert A: primer alunizaje comercial y primero del programa CLPS.',
      en: 'Malapert A: first commercial landing and first of the CLPS programme.',
    },
    source: {
      es: "NASA, Lunar Reconnaissance Orbiter (LROC).",
      en: "NASA, Lunar Reconnaissance Orbiter (LROC).",
    },
    precision: 'published',
  },
  {
    id: 'chandrayaan3',
    name: 'Chandrayaan-3',
    lat: -69.373,
    lon: 32.319,
    group: 'heritage',
    tag: { es: 'ISRO, 2023', en: 'ISRO, 2023' },
    note: { es: 'Punto Shiv Shakti, alunizaje de la India.', en: "Shiv Shakti point, India's landing." },
    source: {
      es: "ISRO.",
      en: "ISRO.",
    },
    precision: 'published',
  },
  {
    id: 'apollo11',
    name: 'Apollo 11',
    lat: 0.67416,
    lon: 23.47314,
    group: 'heritage',
    tag: { es: 'NASA, 1969', en: 'NASA, 1969' },
    note: { es: 'Base Tranquilidad: el contraste ecuatorial clásico.', en: 'Tranquility Base: the classic equatorial contrast.' },
    source: {
      es: "NASA, Lunar Reconnaissance Orbiter (LROC).",
      en: "NASA, Lunar Reconnaissance Orbiter (LROC).",
    },
    precision: 'published',
  },
  {
    id: 'apollo17',
    name: 'Apollo 17',
    lat: 20.1911,
    lon: 30.7723,
    group: 'heritage',
    tag: { es: 'NASA, 1972', en: 'NASA, 1972' },
    note: { es: 'Valle Taurus-Littrow, última misión tripulada.', en: 'Taurus-Littrow valley, the last crewed mission.' },
    source: {
      es: "NASA, Lunar Reconnaissance Orbiter (LROC).",
      en: "NASA, Lunar Reconnaissance Orbiter (LROC).",
    },
    precision: 'published',
  },
  {
    id: 'blueghost',
    name: 'Blue Ghost M1',
    lat: 18.56,
    lon: 61.81,
    group: 'heritage',
    tag: { es: 'CLPS, 2025', en: 'CLPS, 2025' },
    note: { es: 'Mare Crisium, misión de Firefly Aerospace.', en: 'Mare Crisium, Firefly Aerospace mission.' },
    source: {
      es: "Firefly Aerospace y NASA.",
      en: "Firefly Aerospace and NASA.",
    },
    precision: 'published',
  },
  {
    id: 'slim',
    name: 'SLIM',
    lat: -13.316,
    lon: 25.251,
    group: 'heritage',
    tag: { es: 'JAXA, 2024', en: 'JAXA, 2024' },
    note: { es: 'Alunizaje de precisión de Japón junto al cráter Shioli.', en: "Japan's precision landing near Shioli crater." },
    source: {
      es: "JAXA.",
      en: "JAXA.",
    },
    precision: 'published',
  },
  {
    id: 'change4',
    name: "Chang'e 4",
    lat: -45.4446,
    lon: 177.5991,
    group: 'heritage',
    tag: { es: 'CNSA, 2019, cara oculta', en: 'CNSA, 2019, far side' },
    note: {
      es: 'Cráter Von Kármán, cara oculta: la Tierra nunca es visible y hace falta un satélite repetidor.',
      en: 'Von Kármán crater on the far side: Earth is never visible and a relay satellite is required.',
    },
    source: {
      es: "CNSA; confirmado con imágenes de LROC.",
      en: "CNSA; confirmed in LROC images.",
    },
    precision: 'published',
  },
];

export function normLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function customSite(lat: number, lon: number, n: number, name = `Custom ${n}`): Site {
  return {
    id: `custom-${n}`,
    name,
    // Five decimals (0.3 m). Near a ridge crest a 16 m shift can change the Earth link by several points.
    lat: Math.round(lat * 1e5) / 1e5,
    lon: Math.round(normLon(lon) * 1e5) / 1e5,
    group: 'custom',
    tag: { es: 'Personalizado', en: 'Custom' },
    note: { es: 'Coordenadas definidas por el usuario.', en: 'User-defined coordinates.' },
    source: { es: 'Punto definido por el usuario.', en: 'User-defined point.' },
    precision: 'custom',
  };
}

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
}

// Coordinates of mission sites are the published landing/target positions;
// "candidate" entries are representative points inside a region, not official targets.
export const CATALOG: Site[] = [
  {
    id: 'ridge',
    name: 'Connecting Ridge',
    lat: -89.45,
    lon: -137.31,
    group: 'south',
    tag: { es: 'Candidato Artemis', en: 'Artemis candidate' },
    note: {
      es: 'Cresta entre Shackleton y de Gerlache; uno de los puntos más iluminados del polo sur.',
      en: 'Ridge between Shackleton and de Gerlache; one of the most illuminated spots at the south pole.',
    },
  },
  {
    id: 'shackleton-rim',
    name: 'Shackleton Rim',
    lat: -89.78,
    lon: -155.73,
    group: 'south',
    tag: { es: 'Pico de luz', en: 'Peak of light' },
    note: {
      es: 'Borde del cráter Shackleton, a metros de sombra permanente con posible hielo.',
      en: 'Rim of Shackleton crater, metres away from permanent shadow that may hold ice.',
    },
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
  },
  {
    id: 'de-gerlache-rim',
    name: 'de Gerlache Rim',
    lat: -88.67,
    lon: -68.0,
    group: 'south',
    tag: { es: 'Candidato Artemis', en: 'Artemis candidate' },
    note: { es: 'Borde elevado del cráter de Gerlache.', en: 'Elevated rim of de Gerlache crater.' },
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
  },
  {
    id: 'malapert',
    name: 'Malapert Massif',
    lat: -85.95,
    lon: -2.93,
    group: 'south',
    tag: { es: 'Candidato Artemis', en: 'Artemis candidate' },
    note: {
      es: 'Hombro norte de un macizo de casi 5 km que mira a la Tierra: excelente para comunicaciones.',
      en: 'Earth-facing shoulder of a massif nearly 5 km high: excellent for communications.',
    },
  },
  {
    id: 'haworth',
    name: 'Haworth',
    lat: -86.8,
    lon: -22.0,
    group: 'south',
    tag: { es: 'Candidato Artemis', en: 'Artemis candidate' },
    note: { es: 'Terreno elevado junto al cráter Haworth.', en: 'High ground next to Haworth crater.' },
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
  },
  {
    id: 'nobile',
    name: 'Nobile Rim',
    lat: -85.43,
    lon: 37.0,
    group: 'south',
    tag: { es: 'Candidato Artemis', en: 'Artemis candidate' },
    note: { es: 'Borde occidental del cráter Nobile.', en: 'Western rim of Nobile crater.' },
  },
  {
    id: 'im2',
    name: 'IM-2 Athena',
    lat: -84.79,
    lon: 29.2,
    group: 'south',
    tag: { es: 'CLPS, 2025', en: 'CLPS, 2025' },
    note: {
      es: 'Alunizaje de Intuitive Machines IM-2 en Mons Mouton, el más austral hasta la fecha.',
      en: 'Intuitive Machines IM-2 landing on Mons Mouton, the southernmost to date.',
    },
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
  },
  {
    id: 'chandrayaan3',
    name: 'Chandrayaan-3',
    lat: -69.373,
    lon: 32.319,
    group: 'heritage',
    tag: { es: 'ISRO, 2023', en: 'ISRO, 2023' },
    note: { es: 'Punto Shiv Shakti, alunizaje de la India.', en: "Shiv Shakti point, India's landing." },
  },
  {
    id: 'apollo11',
    name: 'Apollo 11',
    lat: 0.67416,
    lon: 23.47314,
    group: 'heritage',
    tag: { es: 'NASA, 1969', en: 'NASA, 1969' },
    note: { es: 'Base Tranquilidad: el contraste ecuatorial clásico.', en: 'Tranquility Base: the classic equatorial contrast.' },
  },
  {
    id: 'apollo17',
    name: 'Apollo 17',
    lat: 20.1911,
    lon: 30.7723,
    group: 'heritage',
    tag: { es: 'NASA, 1972', en: 'NASA, 1972' },
    note: { es: 'Valle Taurus-Littrow, última misión tripulada.', en: 'Taurus-Littrow valley, the last crewed mission.' },
  },
  {
    id: 'blueghost',
    name: 'Blue Ghost M1',
    lat: 18.56,
    lon: 61.81,
    group: 'heritage',
    tag: { es: 'CLPS, 2025', en: 'CLPS, 2025' },
    note: { es: 'Mare Crisium, misión de Firefly Aerospace.', en: 'Mare Crisium, Firefly Aerospace mission.' },
  },
  {
    id: 'slim',
    name: 'SLIM',
    lat: -13.316,
    lon: 25.251,
    group: 'heritage',
    tag: { es: 'JAXA, 2024', en: 'JAXA, 2024' },
    note: { es: 'Alunizaje de precisión de Japón junto al cráter Shioli.', en: "Japan's precision landing near Shioli crater." },
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
  };
}

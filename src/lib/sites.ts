export type Lang = 'es' | 'en';
export type L10n = Record<Lang, string>;

export type Program = 'apollo' | 'luna' | 'surveyor' | 'change' | 'chandrayaan' | 'clps' | 'artemis' | 'commercial' | 'other';

/** Words a search matches for each programme, besides the site's own name and tag. */
const PROGRAM_WORDS: Record<Program, string> = {
  apollo: 'Apollo NASA',
  luna: 'Luna URSS USSR',
  surveyor: 'Surveyor NASA',
  change: "Chang'e CNSA China",
  chandrayaan: 'Chandrayaan ISRO India',
  clps: 'CLPS NASA',
  artemis: 'Artemis NASA',
  commercial: 'comercial commercial',
  other: '',
};

export interface Site {
  id: string;
  name: string;
  lat: number;
  /** East longitude, degrees (-180..180). */
  lon: number;
  group: 'south' | 'heritage' | 'custom';
  /** For grouping and searching (S13). */
  program: Program;
  /** Year of the landing, or the planned one; left out for points that are not a mission. */
  year?: number;
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
    program: 'other',
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
    program: 'other',
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
    program: 'other',
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
    program: 'artemis',
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
    program: 'change',
    year: 2026,
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
    program: 'artemis',
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
    program: 'artemis',
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
    program: 'clps',
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
    program: 'artemis',
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
    program: 'clps',
    year: 2025,
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
    program: 'other',
    year: 2009,
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
    program: 'clps',
    year: 2024,
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
    program: 'chandrayaan',
    year: 2023,
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
    program: 'apollo',
    year: 1969,
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
    program: 'apollo',
    year: 1972,
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
    program: 'clps',
    year: 2025,
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
    program: 'other',
    year: 2024,
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
    program: 'change',
    year: 2019,
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
  {
    id: 'apollo12',
    name: "Apollo 12",
    lat: -3.0124,
    lon: -23.4216,
    group: 'heritage',
    program: 'apollo',
    year: 1969,
    tag: { es: 'NASA, 1969', en: 'NASA, 1969' },
    note: {
      es: "Oceanus Procellarum, a 180 m de la sonda Surveyor 3.",
      en: "Oceanus Procellarum, 180 m from the Surveyor 3 probe.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'apollo14',
    name: "Apollo 14",
    lat: -3.6453,
    lon: -17.4714,
    group: 'heritage',
    program: 'apollo',
    year: 1971,
    tag: { es: 'NASA, 1971', en: 'NASA, 1971' },
    note: {
      es: "Formación Fra Mauro, tierras altas cubiertas de material del impacto de Imbrium.",
      en: "Fra Mauro formation, highlands covered by ejecta of the Imbrium impact.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'apollo15',
    name: "Apollo 15",
    lat: 26.1322,
    lon: 3.6339,
    group: 'heritage',
    program: 'apollo',
    year: 1971,
    tag: { es: 'NASA, 1971', en: 'NASA, 1971' },
    note: {
      es: "Hadley-Apennine, entre la grieta de Hadley y los Apeninos lunares.",
      en: "Hadley-Apennine, between Hadley Rille and the lunar Apennines.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'apollo16',
    name: "Apollo 16",
    lat: -8.973,
    lon: 15.5002,
    group: 'heritage',
    program: 'apollo',
    year: 1972,
    tag: { es: 'NASA, 1972', en: 'NASA, 1972' },
    note: {
      es: "Tierras altas de Descartes, la única misión Apollo en las tierras altas centrales.",
      en: "Descartes highlands, the only Apollo mission in the central highlands.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'luna9',
    name: "Luna 9",
    lat: 7.08,
    lon: -64.37,
    group: 'heritage',
    program: 'luna',
    year: 1966,
    tag: { es: 'URSS, 1966', en: 'USSR, 1966' },
    note: {
      es: "Primer alunizaje suave y primeras fotos desde la superficie, en Oceanus Procellarum.",
      en: "First soft landing and first photos from the surface, in Oceanus Procellarum.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'luna13',
    name: "Luna 13",
    lat: 18.87,
    lon: -62.05,
    group: 'heritage',
    program: 'luna',
    year: 1966,
    tag: { es: 'URSS, 1966', en: 'USSR, 1966' },
    note: {
      es: "Oceanus Procellarum; midió la densidad del suelo.",
      en: "Oceanus Procellarum; it measured the density of the soil.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'luna16',
    name: "Luna 16",
    lat: -0.68,
    lon: 56.3,
    group: 'heritage',
    program: 'luna',
    year: 1970,
    tag: { es: 'URSS, 1970', en: 'USSR, 1970' },
    note: {
      es: "Mare Fecunditatis; primera muestra traída a la Tierra por una sonda robótica.",
      en: "Mare Fecunditatis; first sample returned to Earth by a robotic probe.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'luna17',
    name: "Luna 17",
    lat: 38.28,
    lon: -35,
    group: 'heritage',
    program: 'luna',
    year: 1970,
    tag: { es: 'URSS, 1970', en: 'USSR, 1970' },
    note: {
      es: "Mare Imbrium; desembarcó el Lunojod 1, el primer vehículo robótico en otro mundo.",
      en: "Mare Imbrium; it landed Lunokhod 1, the first robotic rover on another world.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'luna20',
    name: "Luna 20",
    lat: 3.57,
    lon: 56.5,
    group: 'heritage',
    program: 'luna',
    year: 1972,
    tag: { es: 'URSS, 1972', en: 'USSR, 1972' },
    note: {
      es: "Tierras altas junto a Mare Fecunditatis; devolución de muestras.",
      en: "Highlands beside Mare Fecunditatis; sample return.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'luna21',
    name: "Luna 21",
    lat: 25.85,
    lon: 30.45,
    group: 'heritage',
    program: 'luna',
    year: 1973,
    tag: { es: 'URSS, 1973', en: 'USSR, 1973' },
    note: {
      es: "Cráter Le Monnier; desembarcó el Lunojod 2.",
      en: "Le Monnier crater; it landed Lunokhod 2.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'luna24',
    name: "Luna 24",
    lat: 12.75,
    lon: 62.2,
    group: 'heritage',
    program: 'luna',
    year: 1976,
    tag: { es: 'URSS, 1976', en: 'USSR, 1976' },
    note: {
      es: "Mare Crisium; última misión lunar de la URSS, con devolución de muestras.",
      en: "Mare Crisium; the last Soviet lunar mission, a sample return.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'surveyor1',
    name: "Surveyor 1",
    lat: -2.474,
    lon: -43.339,
    group: 'heritage',
    program: 'surveyor',
    year: 1966,
    tag: { es: 'NASA, 1966', en: 'NASA, 1966' },
    note: {
      es: "Oceanus Procellarum; primer alunizaje suave de Estados Unidos.",
      en: "Oceanus Procellarum; the first US soft landing.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'surveyor3',
    name: "Surveyor 3",
    lat: -3.015,
    lon: -23.418,
    group: 'heritage',
    program: 'surveyor',
    year: 1967,
    tag: { es: 'NASA, 1967', en: 'NASA, 1967' },
    note: {
      es: "Oceanus Procellarum; los astronautas del Apollo 12 se llevaron piezas suyas.",
      en: "Oceanus Procellarum; the Apollo 12 astronauts took parts of it home.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'surveyor5',
    name: "Surveyor 5",
    lat: 1.461,
    lon: 23.195,
    group: 'heritage',
    program: 'surveyor',
    year: 1967,
    tag: { es: 'NASA, 1967', en: 'NASA, 1967' },
    note: {
      es: "Mare Tranquillitatis, a 25 km de la futura Base Tranquilidad.",
      en: "Mare Tranquillitatis, 25 km from the future Tranquility Base.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'surveyor6',
    name: "Surveyor 6",
    lat: 0.4743,
    lon: -1.4275,
    group: 'heritage',
    program: 'surveyor',
    year: 1967,
    tag: { es: 'NASA, 1967', en: 'NASA, 1967' },
    note: {
      es: "Sinus Medii; el primer despegue desde la Luna, de unos metros.",
      en: "Sinus Medii; the first lift-off from the Moon, a few metres.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'surveyor7',
    name: "Surveyor 7",
    lat: -40.98,
    lon: -11.514,
    group: 'heritage',
    program: 'surveyor',
    year: 1968,
    tag: { es: 'NASA, 1968', en: 'NASA, 1968' },
    note: {
      es: "Junto al cráter Tycho: el único Surveyor en las tierras altas del sur.",
      en: "Next to Tycho crater: the only Surveyor in the southern highlands.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'change3',
    name: "Chang'e 3",
    lat: 44.12,
    lon: -19.51,
    group: 'heritage',
    program: 'change',
    year: 2013,
    tag: { es: 'CNSA, 2013', en: 'CNSA, 2013' },
    note: {
      es: "Mare Imbrium; primer alunizaje suave de China, con el vehículo Yutu.",
      en: "Mare Imbrium; China's first soft landing, with the Yutu rover.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'change5',
    name: "Chang'e 5",
    lat: 43.0576,
    lon: -51.9161,
    group: 'heritage',
    program: 'change',
    year: 2020,
    tag: { es: 'CNSA, 2020', en: 'CNSA, 2020' },
    note: {
      es: "Oceanus Procellarum, Mons Rümker; devolvió las muestras más jóvenes conocidas.",
      en: "Oceanus Procellarum, Mons Rümker; it returned the youngest samples known.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
  {
    id: 'change6',
    name: "Chang'e 6",
    lat: -41.6385,
    lon: -153.9852,
    group: 'heritage',
    program: 'change',
    year: 2024,
    tag: { es: 'CNSA, 2024', en: 'CNSA, 2024' },
    note: {
      es: "Cuenca Polo Sur-Aitken, cara oculta; primeras muestras de esa cara.",
      en: "South Pole-Aitken basin, far side; the first samples from that side.",
    },
    source: {
      es: "Wikipedia, «List of artificial objects on the Moon» (consultada el 15 de noviembre de 2026), que cita la fuente de cada misión.",
      en: "Wikipedia, \"List of artificial objects on the Moon\" (read on 15 November 2026), which cites the source of each mission.",
    },
    precision: 'published',
  },
];

// Accents and apostrophes go, so "change" finds Chang'e and "camara" finds c\u00e1mara.
const fold = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f'\u2019]/g, '').toLowerCase();

/** Search of the site list (S13): every word of the query must appear in the name, tag, programme or year. */
export function siteMatches(site: Site, query: string, lang: Lang): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = fold([site.name, site.tag[lang], site.tag.es, site.tag.en, PROGRAM_WORDS[site.program], site.year ?? ''].join(' '));
  return words.every((w) => hay.includes(w));
}

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
    program: 'other',
    tag: { es: 'Personalizado', en: 'Custom' },
    note: { es: 'Coordenadas definidas por el usuario.', en: 'User-defined coordinates.' },
    source: { es: 'Punto definido por el usuario.', en: 'User-defined point.' },
    precision: 'custom',
  };
}

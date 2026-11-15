// Guided tour (docs/specs/S12-modo-educativo.md). A step is the same thing as a
// shareable link (S02) plus the panels to open, so applying a step is opening a link.
import type { SharedState } from './urlState';
import type { L10n } from './sites';

/** The date the pitch figures use, so the tour tells the same story any day. */
const T0 = Date.UTC(2026, 10, 14);

export interface TourStep {
  id: string;
  title: L10n;
  /** At most 40 words in each language. */
  text: L10n;
  state: Omit<SharedState, 'lang'>;
  /** Panels the step talks about; they are opened while it is shown. */
  open: string[];
  /** Start playback when the step opens. */
  play?: boolean;
}

const one = (site: string, extra: Partial<Omit<SharedState, 'lang'>> = {}): Omit<SharedState, 'lang'> => ({
  scenarios: [{ site, landing: T0, durationDays: 30, mast: 2 }],
  active: 0,
  hours: 0,
  view: 'polar',
  mode: 'sun',
  ...extra,
});

export const TOUR: TourStep[] = [
  {
    id: 'equator',
    title: { es: 'Cerca del ecuador', en: 'Near the equator' },
    text: {
      es: 'En Apollo 11 el Sol sube alto y el ciclo es sencillo: unos 14 días de luz y 14 de noche. Un panel solar pasa dos semanas seguidas sin energía.',
      en: 'At Apollo 11 the Sun climbs high and the cycle is simple: about 14 days of light and 14 of night. A solar panel spends two weeks in a row without power.',
    },
    state: one('apollo11', { view: 'globe' }),
    open: ['hero', 'when'],
    play: true,
  },
  {
    id: 'pole',
    title: { es: 'En el polo sur', en: 'At the south pole' },
    text: {
      es: 'En Connecting Ridge el Sol no sube más de un par de grados: da la vuelta al horizonte rozándolo. Mira el panorama: cualquier colina lejana puede apagar los paneles.',
      en: 'At Connecting Ridge the Sun never climbs more than a couple of degrees: it circles the horizon, grazing it. Look at the panorama: any distant hill can switch the panels off.',
    },
    state: one('ridge'),
    open: ['hero'],
  },
  {
    id: 'shadow',
    title: { es: 'Sombra permanente', en: 'Permanent shadow' },
    text: {
      es: 'A unos 20 km, el fondo del cráter Shackleton no recibe ni un minuto de Sol directo. Es una trampa fría donde puede conservarse hielo: valiosa para la ciencia, imposible para un panel.',
      en: 'About 20 km away, the floor of Shackleton crater gets not one minute of direct Sun. It is a cold trap where ice may survive: valuable for science, impossible for a panel.',
    },
    state: one('shackleton-floor'),
    open: ['hero'],
  },
  {
    id: 'earth',
    title: { es: 'La Tierra en el cielo', en: 'Earth in the sky' },
    text: {
      es: 'La Luna cabecea (libración) y la Tierra sube y baja en su cielo. En Malapert el relieve decide si hay enlace directo: moverse 1.6 km por la ladera lo cambia del 0% al 100%.',
      en: 'The Moon nods (libration) and Earth rises and sinks in its sky. At Malapert the terrain decides whether there is a direct link: moving 1.6 km along the slope turns it from 0% to 100%.',
    },
    state: one('malapert', { mode: 'earth' }),
    open: ['hero'],
  },
  {
    id: 'plan',
    title: { es: 'Ahora tú', en: 'Your turn' },
    text: {
      es: 'Planifica tu misión: compara sitios y fechas en la tabla, duplica un escenario con otra fecha o busca el mejor punto cercano. Un retraso de unas semanas puede cambiarlo todo.',
      en: 'Plan your mission: compare sites and dates in the table, duplicate a scenario with another date or look for the best point nearby. A delay of a few weeks can change everything.',
    },
    state: {
      scenarios: ['ridge', 'shackleton-floor', 'malapert', 'im2'].map((site) => ({ site, landing: T0, durationDays: 30, mast: 2 })),
      active: 0,
      hours: 0,
      view: 'polar',
      mode: 'sun',
    },
    open: ['compare'],
  },
];

export const words = (t: string) => t.trim().split(/\s+/).length;

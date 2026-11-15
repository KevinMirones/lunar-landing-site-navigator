// The comparison a user is looking at, written into the address bar so it can
// be sent to someone else. Format (see docs/specs/S02-enlaces-compartibles.md):
//
//   ?s=ridge@2026-11-14T00:00~30~2;-85.95,-2.93@2026-12-05T00:00~30~10&a=0&t=36&l=es&v=polar&m=sun
//
//   s  scenarios separated by ";", each "site@landing~days~mast". A catalogue
//      site goes by id, a custom point as "lat,lon" with up to five decimals.
//   a  index of the active scenario      t  hours since its landing
//   l  language    v  map view    m  map layer
//   p  power configuration (S08), only when it differs from the example values
//   c  elevation margin and ground network (S09), only when not 0~none
//   x  simple view (S12): x=simple; without it, the expert view
//
// Unknown parameters are ignored, so links written by a newer version still open.
import { decodeComms, encodeComms, type CommsConfig } from './comms';
import { decodePower, encodePower, type PowerConfig } from './power';
import { DURATIONS, MASTS, MAX_SCENARIOS, type Scenario } from './scenario';
import { customSite, type Lang, type Site } from './sites';

export interface SharedScenario {
  site: string | { lat: number; lon: number };
  landing: number;
  durationDays: number;
  mast: number;
}

export interface SharedState {
  scenarios: SharedScenario[];
  active: number;
  hours: number;
  lang: Lang;
  view: 'polar' | 'globe';
  mode: 'sun' | 'earth';
  /** Left out of the link when it is the default. */
  power?: PowerConfig;
  /** Left out of the link when it is the default. */
  comms?: CommsConfig;
  /** The simple view for non-specialists (S12); left out for the expert view. */
  simple?: boolean;
}

const stamp = (ms: number) => new Date(ms).toISOString().slice(0, 16);
const coord = (x: number) => String(Number(x.toFixed(5))); // 0.3 m: see customSite

export function encode(state: SharedState): string {
  const scenarios = state.scenarios
    .map((sc) => `${typeof sc.site === 'string' ? sc.site : `${coord(sc.site.lat)},${coord(sc.site.lon)}`}@${stamp(sc.landing)}~${sc.durationDays}~${sc.mast}`)
    .join(';');
  // Built by hand: "@ : ; , ~" are legal in a query string and keep the link short and readable.
  return `s=${scenarios}&a=${state.active}&t=${Math.round(state.hours * 10) / 10}&l=${state.lang}&v=${state.view}&m=${state.mode}${state.power ? `&p=${encodePower(state.power)}` : ''}${state.comms ? `&c=${encodeComms(state.comms)}` : ''}${state.simple ? '&x=simple' : ''}`;
}

function parseScenario(text: string, isKnownSite: (id: string) => boolean): SharedScenario | null {
  const m = text.match(/^(.+)@(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})~(\d+)~(\d+)$/);
  if (!m) return null;
  const landing = Date.parse(`${m[2]}:00Z`);
  const durationDays = Number(m[3]);
  const mast = Number(m[4]);
  if (!Number.isFinite(landing) || !DURATIONS.includes(durationDays) || !MASTS.includes(mast)) return null;

  const point = m[1].match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (point) {
    const lat = Number(point[1]);
    const lon = Number(point[2]);
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { site: { lat, lon }, landing, durationDays, mast };
  }
  return isKnownSite(m[1]) ? { site: m[1], landing, durationDays, mast } : null;
}

/**
 * Reads a query string. Whatever is missing is left out of `state` (the app
 * keeps its default); whatever is present but unreadable is dropped and noted
 * in `problems`, so the app can tell the user the link was incomplete.
 */
export function decode(query: string, isKnownSite: (id: string) => boolean): { state: Partial<SharedState>; problems: string[] } {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  const state: Partial<SharedState> = {};
  const problems: string[] = [];

  const s = params.get('s');
  if (s !== null) {
    const parts = s.split(';');
    const parsed: SharedScenario[] = [];
    for (const part of parts.slice(0, MAX_SCENARIOS)) {
      const sc = parseScenario(part, isKnownSite);
      if (sc) parsed.push(sc);
      else problems.push(`scenario "${part.slice(0, 60)}"`);
    }
    if (parts.length > MAX_SCENARIOS) problems.push(`more than ${MAX_SCENARIOS} scenarios`);
    if (parsed.length) state.scenarios = parsed;
  }

  const a = params.get('a');
  if (a !== null) {
    const index = Number(a);
    if (Number.isInteger(index) && index >= 0 && index < (state.scenarios?.length ?? 0)) state.active = index;
    else problems.push(`active scenario "${a}"`);
  }

  const t = params.get('t');
  if (t !== null) {
    const hours = Number(t);
    if (t.trim() !== '' && Number.isFinite(hours) && hours >= 0) state.hours = hours;
    else problems.push(`time "${t}"`);
  }

  const choice = <K extends 'lang' | 'view' | 'mode'>(param: string, key: K, allowed: ReadonlyArray<SharedState[K]>) => {
    const v = params.get(param);
    if (v === null) return;
    if ((allowed as readonly string[]).includes(v)) state[key] = v as SharedState[K];
    else problems.push(`${param} "${v}"`);
  };
  choice('l', 'lang', ['es', 'en']);
  choice('v', 'view', ['polar', 'globe']);
  choice('m', 'mode', ['sun', 'earth']);

  const p = params.get('p');
  if (p !== null) {
    const power = decodePower(p);
    if (power) state.power = power;
    else problems.push(`power "${p.slice(0, 60)}"`);
  }

  const c = params.get('c');
  if (c !== null) {
    const comms = decodeComms(c);
    if (comms) state.comms = comms;
    else problems.push(`comms "${c.slice(0, 60)}"`);
  }

  const x = params.get('x');
  if (x !== null) {
    if (x === 'simple' || x === 'expert') state.simple = x === 'simple';
    else problems.push(`view level "${x.slice(0, 20)}"`);
  }

  return { state, problems };
}

/** App scenarios -> link scenarios: custom points travel as coordinates. */
export function toShared(scenarios: Scenario[], siteOf: (id: string) => Site): SharedScenario[] {
  return scenarios.map((sc) => {
    const site = siteOf(sc.siteId);
    return { site: site.group === 'custom' ? { lat: site.lat, lon: site.lon } : site.id, landing: sc.landing, durationDays: sc.durationDays, mast: sc.mast };
  });
}

/** Link scenarios -> app scenarios, creating one custom point per distinct coordinate. */
export function fromShared(shared: SharedScenario[]): { scenarios: Scenario[]; custom: Site[] } {
  const custom: Site[] = [];
  const byCoord = new Map<string, Site>();
  const scenarios = shared.map((sc, i) => {
    let siteId: string;
    if (typeof sc.site === 'string') {
      siteId = sc.site;
    } else {
      const key = `${sc.site.lat},${sc.site.lon}`;
      let site = byCoord.get(key);
      if (!site) {
        site = customSite(sc.site.lat, sc.site.lon, custom.length + 1);
        byCoord.set(key, site);
        custom.push(site);
      }
      siteId = site.id;
    }
    return { id: `e${i + 1}`, siteId, landing: sc.landing, durationDays: sc.durationDays, mast: sc.mast };
  });
  return { scenarios, custom };
}

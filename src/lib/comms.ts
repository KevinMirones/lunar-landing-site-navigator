// Contact windows (docs/specs/S09-ventanas-de-contacto.md): the Earth link of a
// scenario, already computed with its elevation margin, and the ground stations
// that see the Moon at the same time.
import { Body, Equator, GeoMoon, Horizon, MakeTime, Observer, RotateVector, Rotation_EQJ_EQD, SiderealTime } from 'astronomy-engine';
import { complement, intersect, intervalsAbove, type Interval, type Metrics, type SiteSeries, type TimeGrid } from './series.ts';

export interface Station {
  name: string;
  /** One letter for the timeline. */
  short: string;
  lat: number;
  /** East longitude, degrees. */
  lon: number;
  altKm: number;
}

/** NASA's Deep Space Network, about 120° apart in longitude. */
export const DSN: Station[] = [
  { name: 'Goldstone', short: 'G', lat: 35.43, lon: -116.89, altKm: 1.0 },
  { name: 'Madrid (Robledo)', short: 'M', lat: 40.43, lon: -4.25, altKm: 0.8 },
  { name: 'Canberra (Tidbinbilla)', short: 'C', lat: -35.4, lon: 148.98, altKm: 0.7 },
];

/** A station sees the Moon when it is at least this high above its horizon. */
export const STATION_MASK_DEG = 10;
export const MARGINS = [0, 2, 5] as const;
export type Margin = (typeof MARGINS)[number];
export type Network = 'none' | 'dsn' | 'single';

export interface CommsConfig {
  marginDeg: Margin;
  network: Network;
  /** Used with 'single'. */
  station: { lat: number; lon: number };
}

export const DEFAULT_COMMS: CommsConfig = { marginDeg: 0, network: 'none', station: { lat: 40.43, lon: -4.25 } };

export function stationsOf(c: CommsConfig): Station[] {
  if (c.network === 'dsn') return DSN;
  if (c.network === 'single') return [{ name: 'own', short: 'E', lat: c.station.lat, lon: c.station.lon, altKm: 0 }];
  return [];
}

/** Apparent elevation of the Moon above a station's horizon, degrees, without refraction. */
export function moonElevation(st: Station, t: number): number {
  const date = new Date(t);
  const observer = new Observer(st.lat, st.lon, st.altKm * 1000);
  const eq = Equator(Body.Moon, date, observer, true, true);
  return Horizon(date, observer, eq.ra, eq.dec).altitude;
}

// The same, fast, for a whole grid. The Moon is placed once per instant in an
// Earth-fixed frame and each station is then plain geometry, instead of three full
// lunar ephemerides per instant: under 0.01° from moonElevation, checked in the tests.
const DEG = Math.PI / 180;
const AU_KM = 149597870.7;
const WGS84_A_KM = 6378.137;
const WGS84_E2 = 0.00669437999014;

/** Station position in the Earth-fixed frame (km) and its local vertical. */
function stationFrame(st: Station) {
  const lat = st.lat * DEG;
  const lon = st.lon * DEG;
  const nKm = WGS84_A_KM / Math.sqrt(1 - WGS84_E2 * Math.sin(lat) ** 2);
  const up = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const pos = [(nKm + st.altKm) * up[0], (nKm + st.altKm) * up[1], (nKm * (1 - WGS84_E2) + st.altKm) * up[2]];
  return { pos, up };
}

// Both depend only on time, so they are shared by every site and scenario on the same grid.
const CACHE_SIZE = 24;
const moonCache = new Map<string, Float64Array>();
const elevationCache = new Map<string, Float32Array>();
const gridKey = (g: TimeGrid) => `${g.t0}|${g.stepMs}|${g.n}`;
function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
  return value;
}

/** Greenwich mean sidereal time, degrees, from days of UT since J2000 (IAU 1982). */
const gmstDeg = (ut: number) => 280.46061837 + 360.98564736629 * ut;

/** Geocentric Moon in the Earth-fixed frame, km, three numbers per instant. */
function moonEarthFixed(grid: TimeGrid): Float64Array {
  const hit = moonCache.get(gridKey(grid));
  if (hit) return hit;
  const out = new Float64Array(grid.n * 3);
  // Precession and nutation move the frame by under 0.01° over a 90-day mission, so one
  // rotation (and one equation of the equinoxes) at mid-grid serves every instant.
  const mid = MakeTime(new Date(grid.t0 + ((grid.n - 1) * grid.stepMs) / 2));
  const toDate = Rotation_EQJ_EQD(mid);
  const eqEquinoxes = SiderealTime(mid) * 15 - gmstDeg(mid.ut);
  for (let i = 0; i < grid.n; i++) {
    const time = MakeTime(new Date(grid.t0 + i * grid.stepMs));
    const v = RotateVector(toDate, GeoMoon(time)); // true equator and equinox of date
    const g = (gmstDeg(time.ut) + eqEquinoxes) * DEG;
    const c = Math.cos(g);
    const sn = Math.sin(g);
    out[i * 3] = (v.x * c + v.y * sn) * AU_KM;
    out[i * 3 + 1] = (-v.x * sn + v.y * c) * AU_KM;
    out[i * 3 + 2] = v.z * AU_KM;
  }
  return remember(moonCache, gridKey(grid), out);
}

export function elevations(st: Station, grid: TimeGrid): Float32Array {
  const key = `${st.lat}|${st.lon}|${st.altKm}|${gridKey(grid)}`;
  const hit = elevationCache.get(key);
  if (hit) return hit;
  const moon = moonEarthFixed(grid);
  const { pos, up } = stationFrame(st);
  const out = new Float32Array(grid.n);
  for (let i = 0; i < grid.n; i++) {
    const dx = moon[i * 3] - pos[0];
    const dy = moon[i * 3 + 1] - pos[1];
    const dz = moon[i * 3 + 2] - pos[2];
    out[i] = Math.asin((dx * up[0] + dy * up[1] + dz * up[2]) / Math.hypot(dx, dy, dz)) / DEG;
  }
  return remember(elevationCache, key, out);
}

export interface CommsResult {
  /** Link from the site and at least one station seeing the Moon. */
  contactIntervals: Interval[];
  /** Each stretch goes to the station that has the Moon highest. */
  byStation: Array<{ name: string; short: string; intervals: Interval[] }>;
  contactShare: number;
  contactHoursPerDay: number;
  longestGapMs: number;
}

const total = (ivs: Interval[]) => ivs.reduce((s, iv) => s + iv.end - iv.start, 0);

/** Null with no network: the app then shows the geometric link alone, as before S09. */
export function analyzeComms(series: SiteSeries, metrics: Metrics, config: CommsConfig): CommsResult | null {
  const stations = stationsOf(config);
  if (!stations.length) return null;
  const grid: TimeGrid = { t0: series.t0, stepMs: series.stepMs, n: series.n };
  const els = stations.map((st) => elevations(st, grid));

  const highest = new Float32Array(grid.n);
  const best = els.map(() => new Float32Array(grid.n));
  for (let i = 0; i < grid.n; i++) {
    let k = 0;
    for (let j = 1; j < els.length; j++) if (els[j][i] > els[k][i]) k = j;
    highest[i] = els[k][i];
    if (els[k][i] > STATION_MASK_DEG) best[k][i] = 1;
  }
  const seen = intervalsAbove(highest, grid, STATION_MASK_DEG);
  const contactIntervals = intersect(metrics.earthIntervals, seen);
  const byStation = stations.map((st, k) => ({ name: st.name, short: st.short, intervals: intersect(metrics.earthIntervals, intervalsAbove(best[k], grid, 0.5)) }));
  const t1 = grid.t0 + (grid.n - 1) * grid.stepMs;
  const span = t1 - grid.t0;
  const contact = total(contactIntervals);
  return {
    contactIntervals,
    byStation,
    contactShare: span > 0 ? contact / span : 0,
    contactHoursPerDay: span > 0 ? contact / 3600e3 / (span / 86400e3) : 0,
    longestGapMs: complement(contactIntervals, grid.t0, t1).reduce((m, iv) => Math.max(m, iv.end - iv.start), 0),
  };
}

// ---------- shareable link: c=5~dsn or c=2~35.43,-116.89 (left out when it is 0~none)

export function encodeComms(c: CommsConfig): string {
  const net = c.network === 'single' ? `${c.station.lat},${c.station.lon}` : c.network;
  return `${c.marginDeg}~${net}`;
}

export function decodeComms(text: string): CommsConfig | null {
  const m = text.match(/^(\d+)~(.+)$/);
  if (!m) return null;
  const marginDeg = Number(m[1]) as Margin;
  if (!MARGINS.includes(marginDeg)) return null;
  if (m[2] === 'none' || m[2] === 'dsn') return { ...DEFAULT_COMMS, marginDeg, network: m[2] };
  const p = m[2].match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (!p) return null;
  const lat = Number(p[1]);
  const lon = Number(p[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { ...DEFAULT_COMMS, marginDeg, network: 'single', station: { lat, lon } };
}

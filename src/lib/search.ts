// Search around a point: the server evaluates a grid of nearby cells
// (/api/search); this module picks the best ones and feeds the heat map.
import { DEG, MOON_RADIUS_KM } from './ephemeris';

export interface SearchCell {
  /** Column and row in the grid; the original point is the centre cell. */
  i: number;
  j: number;
  lat: number;
  lon: number;
  /** False north of 80S, where there is no real terrain to evaluate. */
  covered: boolean;
  elevM: number;
  slopeDeg: number;
  sunShare: number;
  earthShare: number;
  bothShare: number;
  longestDarkH: number;
  score: number;
}

export interface SearchResult {
  center: { lat: number; lon: number };
  radiusKm: number;
  /** Cells per side. The server may return a coarser grid than requested. */
  grid: number;
  cellKm: number;
  ms: number;
  cells: SearchCell[];
}

export type Criterion = 'sun' | 'earth' | 'score';
export const MAX_LANDING_SLOPE_DEG = 15;

export const valueOf = (c: SearchCell, criterion: Criterion) => (criterion === 'sun' ? c.sunShare : criterion === 'earth' ? c.earthShare : c.score / 100);

/**
 * The best cells for a criterion. Cells without terrain or too steep to land on
 * are left out, and no two picks are neighbours. Ties go to the higher index,
 * then to the shortest move from the original point.
 */
export function rankCells(cells: SearchCell[], criterion: Criterion, grid: number, { maxSlopeDeg = MAX_LANDING_SLOPE_DEG, count = 5 } = {}): SearchCell[] {
  const mid = (grid - 1) / 2;
  const move = (c: SearchCell) => Math.hypot(c.i - mid, c.j - mid);
  const sorted = cells
    .filter((c) => c.covered && c.slopeDeg <= maxSlopeDeg)
    .sort((a, b) => valueOf(b, criterion) - valueOf(a, criterion) || b.score - a.score || move(a) - move(b));
  const picked: SearchCell[] = [];
  for (const c of sorted) {
    if (picked.length >= count) break;
    if (picked.every((p) => Math.max(Math.abs(p.i - c.i), Math.abs(p.j - c.j)) >= 2)) picked.push(c);
  }
  return picked;
}

/** Lowest and highest value among cells with terrain: the ends of the colour scale. */
export function heatRange(cells: SearchCell[], criterion: Criterion): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const c of cells) {
    if (!c.covered) continue;
    const v = valueOf(c, criterion);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

/** Great-circle distance and initial bearing (degrees clockwise from north) between two points. */
export function distanceBearing(from: { lat: number; lon: number }, to: { lat: number; lon: number }): { km: number; bearingDeg: number } {
  const p1 = from.lat * DEG;
  const p2 = to.lat * DEG;
  const dl = (to.lon - from.lon) * DEG;
  const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const km = 2 * MOON_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
  const bearing = Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / DEG;
  return { km, bearingDeg: (bearing + 360) % 360 };
}

export interface SearchQuery {
  lat: number;
  lon: number;
  radius: number;
  mast: number;
  t0: number;
  days: number;
  grid: number;
  /** Elevation margin of the Earth link, degrees (S09). */
  margin: number;
}

export async function fetchSearch(q: SearchQuery, signal?: AbortSignal): Promise<SearchResult> {
  const params = new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)]));
  const r = await fetch(`/api/search?${params}`, { signal });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
  return body;
}

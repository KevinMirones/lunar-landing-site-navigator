// Search around a point: evaluates light and Earth link on a grid of nearby
// cells, so the tool can propose a better place to land a few kilometres away.
import os from 'node:os';
import { latLonToXY, sharedDem, xyToLatLon } from './dem.js';
import { COVERAGE_MAX_LAT } from './horizon.js';
import { createPool } from './pool.js';

export const SEARCH_GRIDS = [11, 21, 41];
const BATCH = 16; // cells per task: small enough to cancel quickly, large enough to amortise messaging
const CACHE_SIZE = 20;

/**
 * Cells of an n-by-n grid that fall inside a disc around the point. The grid is
 * laid out in the polar stereographic map plane (scale error under 1% south of
 * 80S), so cells are axis-aligned squares on the polar map. n is odd: the centre
 * cell is the point itself.
 */
export function gridCells(lat, lon, radiusKm, n) {
  const [x0, y0] = latLonToXY(lat, lon);
  const step = (2 * radiusKm) / (n - 1);
  const mid = (n - 1) / 2;
  const cells = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const dx = (i - mid) * step;
      const dy = (j - mid) * step;
      if (Math.hypot(dx, dy) > radiusKm + 1e-9) continue;
      const [cellLat, cellLon] = i === mid && j === mid ? [lat, lon] : xyToLatLon(x0 + dx, y0 + dy);
      cells.push({ i, j, lat: cellLat, lon: cellLon });
    }
  }
  return cells;
}

let pool = null;
function getPool() {
  if (!pool) {
    // The grids are shared memory, so a worker costs little. Eight of them bring the fine grid
    // over 20 m terrain from 8.8 s (four workers) to 5.2 s on a 12-thread laptop.
    const size = Number(process.env.SEARCH_WORKERS) || Math.max(1, Math.min(8, os.availableParallelism() - 2));
    pool = createPool(new URL('./searchWorker.js', import.meta.url), size, { dem: sharedDem() });
  }
  return pool;
}
export async function closeSearch() {
  if (pool) await pool.close();
  pool = null;
}

const cache = new Map();
let queue = Promise.resolve(); // one search at a time; the rest wait their turn
let jobs = 0;

/**
 * Runs a search, or returns null when `isCancelled` turns true before it ends.
 * All the work happens in worker threads, so the API keeps answering meanwhile.
 */
export function runSearch({ lat, lon, radius, mast, t0, days, grid }, isCancelled = () => false) {
  const key = [lat, lon, radius, mast, t0, days, grid].join('|');
  if (cache.has(key)) return Promise.resolve(cache.get(key));

  const job = queue.then(async () => {
    if (cache.has(key)) return cache.get(key);
    if (isCancelled()) return null;
    const started = performance.now();
    const cells = gridCells(lat, lon, radius, grid);
    const todo = cells.filter((c) => c.lat <= COVERAGE_MAX_LAT);
    const batches = [];
    for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));

    const workers = getPool();
    const jobId = ++jobs;
    const watch = setInterval(() => isCancelled() && workers.cancel(jobId), 100);
    let parts;
    try {
      parts = await Promise.all(batches.map((b) => workers.run({ cells: b, mast, t0, days }, jobId)));
    } finally {
      clearInterval(watch);
    }
    if (parts.includes(null)) return null;

    const done = new Map(parts.flat().map((c) => [`${c.i},${c.j}`, c]));
    const result = {
      center: { lat, lon },
      radiusKm: radius,
      grid,
      cellKm: (2 * radius) / (grid - 1),
      ms: Math.round(performance.now() - started),
      // Cells north of 80S have no real terrain: they are returned, flagged, with no metrics.
      cells: cells.map((c) => done.get(`${c.i},${c.j}`) ?? { ...c, covered: false, elevM: 0, slopeDeg: 0, sunShare: 0, earthShare: 0, bothShare: 0, longestDarkH: 0, score: 0 }),
    };
    if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value);
    cache.set(key, result);
    return result;
  });
  queue = job.catch(() => {});
  return job;
}

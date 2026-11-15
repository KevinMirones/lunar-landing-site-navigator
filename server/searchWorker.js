// Worker thread of the point search: evaluates a batch of cells.
// The analysis code is the same TypeScript the browser runs; Node strips the
// types when it loads it (Node 22.18 or newer).
import { parentPort, workerData } from 'node:worker_threads';
import { adoptDem, heightAtLatLon, slopeDegAt } from './dem.js';
import { computeHorizon } from './horizon.js';
import { frameSeries, metrics, siteSeries } from '../src/lib/series.ts';

adoptDem(workerData.dem); // the elevation grids are shared with the main thread, not copied

const HOUR = 3600e3;
const round = (x, digits) => Math.round(x * 10 ** digits) / 10 ** digits;

parentPort.on('message', ({ cells, mast, t0, days, margin = 0 }) => {
  const frame = frameSeries({ t0, stepMs: HOUR, n: days * 24 + 1 }); // cached per worker
  parentPort.postMessage(
    cells.map((c) => {
      // 360 azimuths instead of 720: half the cost, and enough to rank neighbours.
      const horizon = computeHorizon(c.lat, c.lon, mast, 360);
      const m = metrics(siteSeries(c.lat, c.lon, horizon, frame, margin));
      return {
        ...c,
        covered: true,
        elevM: Math.round(heightAtLatLon(c.lat, c.lon) * 1000),
        slopeDeg: round(slopeDegAt(c.lat, c.lon), 1),
        sunShare: round(m.sunShare, 4),
        earthShare: round(m.earthShare, 4),
        bothShare: round(m.bothShare, 4),
        longestDarkH: round(m.longestDarkMs / HOUR, 1),
        score: m.score,
      };
    }),
  );
});

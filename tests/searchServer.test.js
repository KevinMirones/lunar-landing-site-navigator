// S04: the server-side search around a point.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';
import { demAvailable } from '../server/dem.js';
import { computeHorizon } from '../server/horizon.js';
import { closeSearch, gridCells } from '../server/search.js';
import { rankCells } from '../src/lib/search';
import { metrics, frameSeries, siteSeries } from '../src/lib/series';

const hasDem = demAvailable();
const T0 = Date.UTC(2026, 10, 14);

describe('search grid', () => {
  it('keeps the original point as the centre cell', () => {
    const cells = gridCells(-85.99, -2.93, 5, 11);
    const centre = cells.find((c) => c.i === 5 && c.j === 5);
    expect(centre.lat).toBeCloseTo(-85.99, 6);
    expect(centre.lon).toBeCloseTo(-2.93, 6);
  });

  it('covers a disc: corner cells beyond the radius are left out', () => {
    const cells = gridCells(-86, 20, 5, 11);
    expect(cells.length).toBeLessThan(121);
    expect(cells.some((c) => c.i === 0 && c.j === 0)).toBe(false);
    expect(cells.some((c) => c.i === 0 && c.j === 5)).toBe(true);
  });

  it('spaces cells evenly: with 11 per side and a 5 km radius, neighbours are 1 km apart', () => {
    const cells = gridCells(-86, 20, 5, 11);
    const a = cells.find((c) => c.i === 5 && c.j === 5);
    const b = cells.find((c) => c.i === 5 && c.j === 6);
    const d = Math.acos(Math.sin((a.lat * Math.PI) / 180) * Math.sin((b.lat * Math.PI) / 180) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.cos(((a.lon - b.lon) * Math.PI) / 180)) * 1737.4;
    expect(d).toBeCloseTo(1, 1);
  });
});

describe('search API', () => {
  let server;
  let base;
  beforeAll(async () => {
    server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(async () => {
    server.close();
    await closeSearch();
  });
  const search = (q) => fetch(`${base}/api/search?${new URLSearchParams(q)}`);
  const malapertSouthSlope = { lat: -85.99, lon: -2.93, radius: 5, mast: 2, t0: T0, days: 30 };

  it('rejects a point outside the terrain coverage', async () => {
    const res = await search({ lat: 0.67, lon: 23.47, radius: 5, mast: 2, t0: T0, days: 30, grid: 11 });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/80/);
  });

  it('rejects a grid size it does not offer', async () => {
    const res = await search({ ...malapertSouthSlope, grid: 500 });
    expect(res.status).toBe(400);
  });

  describe.skipIf(!hasDem)('with LOLA terrain', () => {
    it('finds, 5 km around the south slope of Malapert, a point with continuous Earth link', async () => {
      const res = await search({ ...malapertSouthSlope, grid: 11 });
      expect(res.status).toBe(200);
      const body = await res.json();
      const centre = body.cells.find((c) => c.i === 5 && c.j === 5);
      expect(centre.earthShare).toBe(0); // the point the project history started from
      const best = rankCells(body.cells, 'earth', body.grid)[0];
      expect(best.earthShare).toBe(1);
      expect(best.slopeDeg).toBeLessThanOrEqual(15);
    }, 30_000);

    it('gives the centre cell the same result as analysing that site directly', async () => {
      const site = { lat: -89.45, lon: -137.31 }; // Connecting Ridge
      const body = await (await search({ ...site, radius: 2, mast: 2, t0: T0, days: 30, grid: 11 })).json();
      const centre = body.cells.find((c) => c.i === 5 && c.j === 5);
      const h = computeHorizon(site.lat, site.lon, 2); // full resolution, as the app does
      const direct = metrics(siteSeries(site.lat, site.lon, h, frameSeries({ t0: T0, stepMs: 1800e3, n: 30 * 48 + 1 })));
      expect(Math.abs(centre.score - direct.score)).toBeLessThanOrEqual(1);
      expect(centre.sunShare).toBeCloseTo(direct.sunShare, 1);
    }, 30_000);

    it('applies an elevation margin to the Earth link, and only to it (S09)', async () => {
      const plain = await (await search({ ...malapertSouthSlope, grid: 11 })).json();
      const strict = await (await search({ ...malapertSouthSlope, grid: 11, margin: 5 })).json();
      const byCell = new Map(plain.cells.map((c) => [`${c.i},${c.j}`, c]));
      let lower = 0;
      for (const c of strict.cells.filter((c) => c.covered)) {
        const p = byCell.get(`${c.i},${c.j}`);
        expect(c.earthShare).toBeLessThanOrEqual(p.earthShare);
        expect(c.sunShare).toBe(p.sunShare);
        if (c.earthShare < p.earthShare) lower++;
      }
      expect(lower).toBeGreaterThan(0);
    }, 60_000);

    it('rejects a margin out of range', async () => {
      expect((await search({ ...malapertSouthSlope, grid: 11, margin: 45 })).status).toBe(400);
    });

    it('reports elevation and slope of each cell, and flags cells without terrain', async () => {
      const body = await (await search({ lat: -80.02, lon: 1.44, radius: 2, mast: 2, t0: T0, days: 14, grid: 11 })).json();
      expect(body.cells.some((c) => !c.covered)).toBe(true); // part of the disc lies north of 80S
      const covered = body.cells.filter((c) => c.covered);
      expect(covered.every((c) => Number.isFinite(c.elevM) && c.slopeDeg >= 0 && c.slopeDeg < 90)).toBe(true);
    }, 30_000);

    it('keeps answering other requests while a search runs', async () => {
      const running = search({ lat: -88.67, lon: -68, radius: 10, mast: 2, t0: T0, days: 30, grid: 21 });
      await new Promise((resolve) => setTimeout(resolve, 100));
      const t = performance.now();
      const health = await fetch(`${base}/api/health`);
      const waited = performance.now() - t;
      expect(health.status).toBe(200);
      expect(waited).toBeLessThan(500);
      expect((await running).status).toBe(200);
    }, 60_000);

    it('answers the same search again from its cache', async () => {
      const first = await (await search({ ...malapertSouthSlope, grid: 11 })).json();
      const t = performance.now();
      const again = await (await search({ ...malapertSouthSlope, grid: 11 })).json();
      expect(performance.now() - t).toBeLessThan(200);
      expect(again.cells).toEqual(first.cells);
    }, 30_000);
  });
});

// S11: terrain patches around a site for the 3D view.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';
import { demAvailable, heightAtLatLon } from '../server/dem.js';
import { globalDemAvailable } from '../server/globalDem.js';
import { PATCH_VERTICES, buildPatch, patchKey } from '../server/patch.js';

const hasDem = demAvailable();
const RIDGE = { lat: -89.4398, lon: -137.17 };
const N = PATCH_VERTICES;
const mid = (N - 1) / 2;
/** Height in metres of vertex (column i, row j); row 0 is the north edge. */
const at = (p, i, j) => p.data[j * N + i] * 0.5;

describe('patch geometry', () => {
  // A smooth sphere: every height is zero, so all that remains is the curvature.
  const flat = buildPatch(RIDGE.lat, RIDGE.lon, 64, () => 0);

  it('has an odd number of vertices, so the site sits on the centre vertex', () => {
    expect(N % 2).toBe(1);
    expect(flat.data).toHaveLength(N * N);
  });

  it('puts the site at height 0', () => {
    expect(at(flat, mid, mid)).toBe(0);
  });

  it('drops a flat point 32 km away about 295 m below the plane, from curvature', () => {
    for (const [i, j] of [[N - 1, mid], [0, mid], [mid, 0], [mid, N - 1]]) {
      expect(at(flat, i, j)).toBeGreaterThan(-296);
      expect(at(flat, i, j)).toBeLessThan(-294);
    }
  });

  it('keeps the near patch almost flat: 4 km out the drop is under 5 m', () => {
    const near = buildPatch(RIDGE.lat, RIDGE.lon, 8, () => 0);
    expect(at(near, N - 1, mid)).toBeLessThan(0);
    expect(at(near, N - 1, mid)).toBeGreaterThan(-5);
  });

  it('puts east on the right (+x) and north at the top (row 0)', () => {
    // Test terrains given on the unit sphere. At lon 0, east is +y; north is always +z.
    const site = buildPatch(-85.99, 0, 8, (_x, y) => y * 100); // rises toward the site's east
    expect(at(site, N - 1, mid)).toBeGreaterThan(at(site, 0, mid));
    const north = buildPatch(-85.99, 0, 8, (_x, _y, z) => z * 1000); // rises toward the north
    expect(at(north, mid, 0)).toBeGreaterThan(at(north, mid, N - 1));
  });
});

describe.skipIf(!hasDem)('patch from the LOLA terrain', () => {
  it('is relative to the ground at the site', () => {
    const p = buildPatch(RIDGE.lat, RIDGE.lon, 8);
    expect(at(p, mid, mid)).toBe(0);
    expect(p.resolutionM).toBeGreaterThan(0);
    expect(heightAtLatLon(RIDGE.lat, RIDGE.lon)).not.toBe(0);
  });

  it('shows the walls of Shackleton rising around its floor', () => {
    const p = buildPatch(-89.66, 129.2, 64);
    const edge = [at(p, 0, mid), at(p, N - 1, mid), at(p, mid, 0), at(p, mid, N - 1)];
    expect(Math.max(...edge)).toBeGreaterThan(1000);
  });
});

describe('/api/patch', () => {
  let server;
  let base;
  const fake = (resolutionM, fill) => ({ lat: -82.5, lon: 10, sizeKm: 8, vertices: N, resolutionM, data: new Int16Array(N * N).fill(fill) });

  beforeAll(async () => {
    // 82.5S lies outside the 20 m and 40 m grids, so no installation computes it that fine.
    const patches = new Map([
      [patchKey(-82.5, 10, 8), fake(20, 7)],
      [patchKey(-82.5, 20, 8), fake(240, 9)],
    ]);
    server = createApp({ patches }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(() => server.close());

  it('no longer rejects a point by its latitude: north of 80S it depends on the terrain installed (S17)', async () => {
    const res = await fetch(`${base}/api/patch?lat=-70&lon=0&size=8`);
    expect(res.status).toBe(globalDemAvailable() ? 200 : 503);
  });

  it('rejects a size other than 8 or 64 km', async () => {
    const res = await fetch(`${base}/api/patch?lat=-89&lon=0&size=16`);
    expect(res.status).toBe(400);
  });

  it('answers with the precomputed patch when it is finer than the terrain installed', async () => {
    const res = await fetch(`${base}/api/patch?lat=-82.5&lon=10&size=8`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-patch-precomputed')).toBe('1');
    expect(res.headers.get('x-patch-resolution-m')).toBe('20');
    expect(res.headers.get('x-patch-vertices')).toBe(String(N));
    const dn = new Int16Array(await res.arrayBuffer());
    expect(dn).toHaveLength(N * N);
    expect(dn[0]).toBe(7);
  });

  it.skipIf(!hasDem)('computes from the grids when the precomputed patch is no finer than they are', async () => {
    const res = await fetch(`${base}/api/patch?lat=-82.5&lon=20&size=8`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-patch-precomputed')).toBeNull();
    expect(res.headers.get('x-patch-size-km')).toBe('8');
    const dn = new Int16Array(await res.arrayBuffer());
    expect(dn[mid * N + mid]).toBe(0);
  });

  it.skipIf(!hasDem)('serves a computed 64 km patch for a catalogue site', async () => {
    const res = await fetch(`${base}/api/patch?lat=${RIDGE.lat}&lon=${RIDGE.lon}&size=64`);
    expect(res.status).toBe(200);
    expect(Number(res.headers.get('x-patch-resolution-m'))).toBeGreaterThan(0);
    expect(new Int16Array(await res.arrayBuffer())).toHaveLength(N * N);
  });
});

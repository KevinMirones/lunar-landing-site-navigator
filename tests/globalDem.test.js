// S17: the whole-Moon grid, checked on small synthetic files with the layout of LDEM_64.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';
import { heightAtUnit, loadDem } from '../server/dem.js';
import { closeGlobalDem, disableGlobalDem, globalCacheStats, globalDemAvailable, globalHeightAt, globalHeightAtUnit, globalResolutionM, openGlobalDem } from '../server/globalDem.js';
import { computeHorizon, sphereDipDeg } from '../server/horizon.js';
import { PATCH_VERTICES, buildPatch, patchKey } from '../server/patch.js';
import { keyOf } from '../server/precomputed.js';

const PPD = 4; // 15 arc-minute cells, 7.6 km at the equator: 1440 x 720, 2 MB
const R = 1737.4;
const dir = mkdtempSync(join(tmpdir(), 'lumina-global-'));
afterAll(() => {
  closeGlobalDem();
  rmSync(dir, { recursive: true, force: true });
});
afterEach(() => closeGlobalDem());

/** Writes a grid whose height in metres at each cell centre is heightM(lat, lon). */
function grid(name, heightM) {
  const w = 360 * PPD;
  const h = 180 * PPD;
  const dn = new Int16Array(w * h);
  for (let r = 0; r < h; r++) {
    const lat = 90 - (r + 0.5) / PPD;
    for (let c = 0; c < w; c++) dn[r * w + c] = Math.round(heightM(lat, (c + 0.5) / PPD) / 0.5);
  }
  const file = join(dir, name);
  writeFileSync(file, new Uint8Array(dn.buffer));
  return file;
}

// Linear in latitude and longitude, and whole half-metres at every cell centre, so bilinear sampling is exact.
const slope = (lat, lon) => (lat * 8 + lon * 4) / 1000;
const SLOPE = grid('slope.img', (lat, lon) => slope(lat, lon) * 1000);
const FLAT = grid('flat.img', () => 0);
// A cone 6 km high and 40 km in radius, centred on the equator at 30E.
const CONE = grid('cone.img', (lat, lon) => {
  const d = Math.hypot(lat, lon - 30) * ((Math.PI * R) / 180);
  return Math.max(0, 6000 * (1 - d / 40));
});

describe('whole-Moon grid', () => {
  it('reads heights in km, with north at the top and longitude growing east', () => {
    openGlobalDem({ file: SLOPE, ppd: PPD, block: 64 });
    expect(globalHeightAt(10.125, 20.125)).toBeCloseTo(slope(10.125, 20.125), 9);
    expect(globalHeightAt(-33.3, 101.7)).toBeCloseTo(slope(-33.3, 101.7), 9);
    expect(globalHeightAt(30, 50)).toBeGreaterThan(globalHeightAt(20, 50));
    expect(globalHeightAt(20, 60)).toBeGreaterThan(globalHeightAt(20, 50));
  });

  it('takes west longitudes as east ones and wraps around 0/360', () => {
    openGlobalDem({ file: SLOPE, ppd: PPD, block: 64 });
    expect(globalHeightAt(5.3, -10.4)).toBeCloseTo(globalHeightAt(5.3, 349.6), 12);
    // Across the seam, between the last column (359.875E) and the first (0.125E).
    const seam = globalHeightAt(5.125, 0);
    expect(seam).toBeCloseTo((slope(5.125, 359.875) + slope(5.125, 0.125)) / 2, 9);
  });

  it('keeps the first and last rows up to the poles', () => {
    openGlobalDem({ file: SLOPE, ppd: PPD, block: 64 });
    expect(globalHeightAt(89.99, 40.125)).toBeCloseTo(slope(89.875, 40.125), 9);
    expect(globalHeightAt(-90, 40.125)).toBeCloseTo(slope(-89.875, 40.125), 9);
  });

  it('gives the same height for a unit vector as for its latitude and longitude', () => {
    openGlobalDem({ file: SLOPE, ppd: PPD, block: 64 });
    const lat = (12.34 * Math.PI) / 180;
    const lon = (-56.78 * Math.PI) / 180;
    const u = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
    expect(globalHeightAtUnit(...u)).toBeCloseTo(globalHeightAt(12.34, -56.78), 12);
  });

  it('states its cell size at the equator', () => {
    openGlobalDem({ file: SLOPE, ppd: PPD });
    expect(globalResolutionM()).toBe(Math.round(((2 * Math.PI * R) / (360 * PPD)) * 1000));
  });

  it('holds no more blocks in memory than allowed', () => {
    openGlobalDem({ file: SLOPE, ppd: PPD, block: 32, maxBlocks: 6 });
    for (let lat = -80; lat <= 80; lat += 7) for (let lon = 0; lon < 360; lon += 11) globalHeightAt(lat, lon);
    expect(globalCacheStats().blocks).toBeLessThanOrEqual(6);
    expect(globalCacheStats().bytes).toBeLessThanOrEqual(6 * 32 * 32 * 2);
    expect(globalHeightAt(10.125, 20.125)).toBeCloseTo(slope(10.125, 20.125), 9); // still right after evictions
  });

  it('is simply absent when the file is missing', () => {
    expect(openGlobalDem({ file: join(dir, 'missing.img') })).toBeNull();
    expect(globalDemAvailable()).toBe(false);
    expect(globalHeightAt(0, 0)).toBeNaN();
  });

  it('refuses a file of the wrong size', () => {
    const bad = join(dir, 'short.img');
    writeFileSync(bad, new Uint8Array(1000));
    expect(() => openGlobalDem({ file: bad, ppd: PPD })).toThrow(/Unexpected size/);
  });
});

describe('terrain outside the pole, with the whole-Moon grid', () => {
  it('a flat grid gives the horizon of a smooth sphere, with terrain as the model', () => {
    openGlobalDem({ file: FLAT, ppd: PPD });
    const h = computeHorizon(10, 20, 2, 72);
    expect(h.model).toBe('lola');
    expect(h.resolutionM).toBe(globalResolutionM());
    for (const e of h.elevationDeg) {
      expect(e).toBeLessThan(0);
      expect(Math.abs(e - sphereDipDeg(0.002))).toBeLessThan(0.02);
    }
  });

  it('a mountain 60 km east rises in the east, at its distance, and not in the west', () => {
    openGlobalDem({ file: CONE, ppd: PPD });
    const h = computeHorizon(0, 28, 2, 360); // 2 degrees west of the cone: 60.6 km
    // Some 5 km at 57 to 61 km once sampled on 7.6 km cells, less the 1 km the curvature hides: about 4 degrees.
    expect(h.elevationDeg[90]).toBeGreaterThan(3);
    expect(h.elevationDeg[90]).toBeLessThan(5.5);
    expect(h.distanceKm[90]).toBeGreaterThan(45);
    expect(h.distanceKm[90]).toBeLessThan(66);
    expect(h.elevationDeg[270]).toBeLessThan(0);
    expect(h.elevationDeg[0]).toBeLessThan(h.elevationDeg[90] / 2);
  });

  it('builds a 3D patch outside the pole, relative to the ground at the site', () => {
    openGlobalDem({ file: CONE, ppd: PPD });
    const p = buildPatch(0, 29.5, 64); // 15 km west of the summit: the slope rises to the east
    const N = PATCH_VERTICES;
    const mid = (N - 1) / 2;
    expect(p.resolutionM).toBe(globalResolutionM());
    expect(p.data[mid * N + mid]).toBe(0);
    expect(p.data[mid * N + (N - 1)]).toBeGreaterThan(p.data[mid * N]); // east edge above west edge
  });

  it('uses the polar grids first and the whole-Moon grid outside them', () => {
    openGlobalDem({ file: FLAT, ppd: PPD });
    if (loadDem()) {
      // Inside the polar grids the flat synthetic grid is never read: Shackleton's floor is deep.
      const lat = (-89.66 * Math.PI) / 180;
      const lon = (129.2 * Math.PI) / 180;
      expect(heightAtUnit(Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat))).toBeLessThan(-1);
    }
    expect(heightAtUnit(1, 0, 0)).toBe(0); // 0N 0E, outside them
  });
});

describe('terrain outside the pole, without the whole-Moon grid', () => {
  let server;
  let base;
  const N = PATCH_VERTICES;
  const APOLLO = { lat: 0.67416, lon: 23.47314 };

  // Off before every test: closing it after each one would let the real grid open again.
  beforeEach(() => disableGlobalDem());
  beforeAll(async () => {
    const horizons = new Map([[keyOf(APOLLO.lat, APOLLO.lon, 2), { lat: APOLLO.lat, lon: APOLLO.lon, model: 'lola', resolutionM: 474, mastM: 2, nAz: 4, elevationDeg: [1, 2, 3, 4], distanceKm: [5, 6, 7, 8], siteElevationM: -1900 }]]);
    const patches = new Map([[patchKey(APOLLO.lat, APOLLO.lon, 8), { lat: APOLLO.lat, lon: APOLLO.lon, sizeKm: 8, vertices: N, resolutionM: 474, data: new Int16Array(N * N).fill(3) }]]);
    server = createApp({ horizons, patches }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(() => server?.close());

  it('serves the precomputed horizon of a catalogue site (criterion 6)', async () => {
    const body = await (await fetch(`${base}/api/horizon?lat=${APOLLO.lat}&lon=${APOLLO.lon}&mast=2`)).json();
    expect(body).toMatchObject({ model: 'lola', resolutionM: 474, precomputed: true });
  });

  it('serves its precomputed 3D patch', async () => {
    const res = await fetch(`${base}/api/patch?lat=${APOLLO.lat}&lon=${APOLLO.lon}&size=8`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-patch-precomputed')).toBe('1');
    expect(res.headers.get('x-patch-resolution-m')).toBe('474');
  });

  it('keeps a smooth Moon for a point of your own, and no 3D patch (criterion 7)', async () => {
    const body = await (await fetch(`${base}/api/horizon?lat=10&lon=10&mast=2`)).json();
    expect(body.model).toBe('sphere');
    expect((await fetch(`${base}/api/patch?lat=10&lon=10&size=8`)).status).toBe(503);
  });

  it('says in the health check that the whole-Moon grid is missing', async () => {
    expect(await (await fetch(`${base}/api/health`)).json()).toMatchObject({ globalDem: false });
  });
});

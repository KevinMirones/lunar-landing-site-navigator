// S03: what protects the API once it is on a public address.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';
import { demAvailable } from '../server/dem.js';
import { keyOf, loadPrecomputed } from '../server/precomputed.js';
import { createRateLimiter } from '../server/rateLimit.js';

describe('rate limiter', () => {
  const setup = () => {
    let now = 1_000_000;
    const limiter = createRateLimiter({ limit: 30, windowMs: 60_000, now: () => now });
    return { limiter, advance: (ms) => (now += ms) };
  };

  it('lets 30 requests through in a minute and stops the 31st', () => {
    const { limiter } = setup();
    for (let i = 0; i < 30; i++) expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(false);
  });

  it('counts each client separately', () => {
    const { limiter } = setup();
    for (let i = 0; i < 30; i++) limiter.take('a');
    expect(limiter.take('b').allowed).toBe(true);
  });

  it('lets a client back in once its oldest request is a minute old', () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 30; i++) limiter.take('a');
    advance(59_000);
    expect(limiter.take('a').allowed).toBe(false);
    advance(1_001);
    expect(limiter.take('a').allowed).toBe(true);
  });

  it('says how many seconds to wait', () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 30; i++) limiter.take('a');
    advance(20_000);
    expect(limiter.take('a').retryAfterSec).toBe(40);
  });

  it('forgets clients that went quiet, so memory does not grow without bound', () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 100; i++) limiter.take(`client-${i}`);
    advance(61_000);
    limiter.take('someone-new');
    expect(limiter.size()).toBe(1);
  });
});

describe('public API', () => {
  let server;
  let base;
  let upstreamCalls = 0;

  beforeAll(async () => {
    const app = createApp({
      // Stand-in for NASA/JPL Horizons, so the tests need no network.
      jpl: async (command) => {
        upstreamCalls++;
        return command === '10' ? { az: 126.6, el: 1.2 } : { az: 141.9, el: -5.0 };
      },
    });
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(() => server.close());

  it('answers the JPL cross-check', async () => {
    const res = await fetch(`${base}/api/jpl?lat=-89.45&lon=-137.31&t=1794614400000`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sun: { az: 126.6, el: 1.2 }, earth: { az: 141.9, el: -5.0 } });
  });

  it('asks JPL only once for the same site and minute', async () => {
    const before = upstreamCalls;
    await fetch(`${base}/api/jpl?lat=-85.95&lon=-2.93&t=1794614400000`);
    await fetch(`${base}/api/jpl?lat=-85.95&lon=-2.93&t=1794614430000`); // same minute
    expect(upstreamCalls - before).toBe(2); // one call for the Sun, one for Earth
  });

  it('answers 429 with Retry-After to the 31st JPL request in a minute', async () => {
    let last;
    for (let i = 0; i < 31; i++) last = await fetch(`${base}/api/jpl?lat=-89&lon=${i}&t=1794614400000`);
    expect(last.status).toBe(429);
    expect(Number(last.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await last.json()).error).toMatch(/JPL/);
  });

  it('does not limit the rest of the API', async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.status).toBe(200);
  });

  it('sends security headers and hides the framework', async () => {
    const res = await fetch(`${base}/api/health`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(res.headers.get('x-powered-by')).toBeNull();
  });

  it('rejects a horizon request without valid coordinates', async () => {
    const res = await fetch(`${base}/api/horizon?lat=abc&lon=3`);
    expect(res.status).toBe(400);
  });
});

// S06: a small server without the fine grids still answers catalogue sites with fine-terrain horizons.
describe('precomputed horizons', () => {
  let server;
  let base;
  const entry = (lat, lon, resolutionM) => ({
    lat,
    lon,
    model: 'lola',
    resolutionM,
    siteElevationM: 1234,
    mastM: 2,
    nAz: 720,
    elevationDeg: new Array(720).fill(7),
    distanceKm: new Array(720).fill(1),
  });

  beforeAll(async () => {
    // 82.5S lies outside the 20 m and 40 m grids, so no installation computes it that fine.
    const horizons = new Map([
      [keyOf(-82.5, 10, 2), entry(-82.5, 10, 20)],
      [keyOf(-82.5, 20, 2), entry(-82.5, 20, 240)],
    ]);
    server = createApp({ horizons }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(() => server.close());

  it('answers with the precomputed horizon when it is finer than the terrain installed', async () => {
    const h = await (await fetch(`${base}/api/horizon?lat=-82.5&lon=10&mast=2`)).json();
    expect(h).toMatchObject({ model: 'lola', resolutionM: 20, precomputed: true, siteElevationM: 1234 });
    expect(h.elevationDeg[0]).toBe(7);
  });

  it('does not use it for another mast height', async () => {
    const h = await (await fetch(`${base}/api/horizon?lat=-82.5&lon=10&mast=10`)).json();
    expect(h.precomputed).toBeUndefined();
  });

  it.skipIf(!demAvailable())('computes from the grids when the precomputed horizon is no finer than they are', async () => {
    const h = await (await fetch(`${base}/api/horizon?lat=-82.5&lon=20&mast=2`)).json();
    expect(h.precomputed).toBeUndefined();
    expect(h.siteElevationM).not.toBe(1234);
  });

  it('reads the horizons shipped with the repository', () => {
    const shipped = loadPrecomputed();
    const ridge = shipped.get(keyOf(-89.4398, -137.17, 2));
    expect(ridge).toMatchObject({ model: 'lola', nAz: 720 });
    expect(ridge.resolutionM).toBeLessThan(240);
    expect(ridge.elevationDeg).toHaveLength(720);
  });
});

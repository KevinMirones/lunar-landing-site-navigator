// S03: what protects the API once it is on a public address.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';
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

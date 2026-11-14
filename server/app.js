// LUMINA API: terrain horizons from LOLA topography + a JPL Horizons cross-check.
// Also serves the built frontend (dist/) in production.
import express from 'express';
import compression from 'compression';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildHeightmap, demAvailable } from './dem.js';
import { computeHorizon, COVERAGE_MAX_LAT } from './horizon.js';
import { createRateLimiter, rateLimit } from './rateLimit.js';

const HEIGHTMAP_SIZE = 1280;
const HEIGHTMAP_HALF_EXTENT_KM = 307.2; // reaches ~80S; 0.48 km per pixel
export const DIST = fileURLToPath(new URL('../dist', import.meta.url));

// The app loads only its own scripts, styles, fonts and data. Inline styles are
// needed for React's style attributes; WebGL needs nothing extra.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ');

const num = (v, lo, hi) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};

/** One request to NASA/JPL Horizons: azimuth and elevation of a body from a lunar site at one minute. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export async function horizonsAzEl(command, lat, lon, t) {
  const fmt = (ms) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
  const params = {
    format: 'text',
    COMMAND: `'${command}'`,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: "'coord@301'",
    COORD_TYPE: 'GEODETIC',
    SITE_COORD: `'${((lon % 360) + 360) % 360},${lat},0'`,
    START_TIME: `'${fmt(t)}'`,
    STOP_TIME: `'${fmt(t + 60000)}'`,
    STEP_SIZE: "'1 m'",
    QUANTITIES: "'4'",
    CSV_FORMAT: 'YES',
  };
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const r = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${qs}`, { signal: AbortSignal.timeout(20000) });
  const text = await r.text();
  const line = text.split('$$SOE')[1]?.trim().split('\n')[0];
  if (!line) throw new Error('Unexpected response from JPL Horizons');
  const cols = line.split(',').map((s) => s.trim());
  if (!MONTHS.some((m) => cols[0].includes(m))) throw new Error('Unexpected response from JPL Horizons');
  return { az: parseFloat(cols[3]), el: parseFloat(cols[4]) };
}

/**
 * Builds the Express app. `jpl` can be replaced in tests so they need no network.
 * Behind a reverse proxy set TRUST_PROXY=1 so the rate limit sees the real client address.
 */
export function createApp({ jpl = horizonsAzEl, jplPerMinute = 30 } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
  app.use(compression());
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': CSP,
    });
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, dem: demAvailable(), coverageMaxLat: COVERAGE_MAX_LAT });
  });

  const horizonCache = new Map();
  app.get('/api/horizon', (req, res) => {
    const lat = num(req.query.lat, -90, 90);
    const lon = num(req.query.lon, -360, 360);
    const mast = num(req.query.mast ?? 2, 0, 500);
    if (lat === null || lon === null || mast === null) {
      return res.status(400).json({ error: 'lat (-90..90), lon (-360..360) and mast (0..500 m) are required' });
    }
    const key = `${lat.toFixed(4)}|${lon.toFixed(4)}|${mast}`;
    let body = horizonCache.get(key);
    if (!body) {
      const h = computeHorizon(lat, lon, mast);
      body = {
        ...h,
        elevationDeg: Array.from(h.elevationDeg, (v) => Math.round(v * 1000) / 1000),
        distanceKm: Array.from(h.distanceKm, (v) => Math.round(v * 10) / 10),
      };
      if (horizonCache.size > 500) horizonCache.delete(horizonCache.keys().next().value);
      horizonCache.set(key, body);
    }
    res.set('Cache-Control', 'public, max-age=86400').json(body);
  });

  let heightmap = null;
  app.get('/api/heightmap', (_req, res) => {
    if (!demAvailable()) return res.status(503).json({ error: 'DEM not installed. Run: npm run fetch-data' });
    heightmap ??= Buffer.from(buildHeightmap(HEIGHTMAP_SIZE, HEIGHTMAP_HALF_EXTENT_KM).buffer);
    res
      .set({
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
        'X-Heightmap-Size': String(HEIGHTMAP_SIZE),
        'X-Heightmap-Half-Extent-Km': String(HEIGHTMAP_HALF_EXTENT_KM),
      })
      .send(heightmap);
  });

  // Live cross-check against NASA/JPL Horizons for one site and instant.
  // Limited and cached: on a public address this endpoint relays requests to JPL.
  const jplLimiter = createRateLimiter({ limit: jplPerMinute, windowMs: 60_000 });
  const jplCache = new Map();
  app.get('/api/jpl', rateLimit(jplLimiter, 'Too many JPL Horizons checks from this address. Wait a moment and try again.'), async (req, res) => {
    const lat = num(req.query.lat, -90, 90);
    const lon = num(req.query.lon, -360, 360);
    const t = num(req.query.t, -3e13, 3e13);
    if (lat === null || lon === null || t === null) return res.status(400).json({ error: 'lat, lon and t (ms UTC) are required' });
    const minute = Math.floor(t / 60000) * 60000;
    const key = `${lat}|${lon}|${minute}`;
    try {
      let body = jplCache.get(key);
      if (!body) {
        const [sun, earth] = await Promise.all([jpl('10', lat, lon, minute), jpl('399', lat, lon, minute)]);
        body = { t: minute, sun, earth, source: 'NASA/JPL Horizons, DE441' };
        if (jplCache.size > 500) jplCache.delete(jplCache.keys().next().value);
        jplCache.set(key, body);
      }
      res.json(body);
    } catch (err) {
      res.status(502).json({ error: String(err.message || err) });
    }
  });

  if (existsSync(DIST)) {
    app.use(express.static(DIST));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile('index.html', { root: DIST }));
  }
  return app;
}

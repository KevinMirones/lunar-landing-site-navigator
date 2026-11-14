// LUMINA API: terrain horizons from LOLA topography + a JPL Horizons cross-check.
// Also serves the built frontend (dist/) in production.
import express from 'express';
import compression from 'compression';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildHeightmap, demAvailable, loadDem } from './dem.js';
import { computeHorizon, COVERAGE_MAX_LAT } from './horizon.js';

const PORT = process.env.PORT || 8787;
const HEIGHTMAP_SIZE = 1280;
const HEIGHTMAP_HALF_EXTENT_KM = 307.2; // reaches ~80S; 0.48 km per pixel

const app = express();
app.use(compression());

const num = (v, lo, hi) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
};

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
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
async function horizonsAzEl(command, lat, lon, t) {
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

app.get('/api/jpl', async (req, res) => {
  const lat = num(req.query.lat, -90, 90);
  const lon = num(req.query.lon, -360, 360);
  const t = num(req.query.t, -3e13, 3e13);
  if (lat === null || lon === null || t === null) return res.status(400).json({ error: 'lat, lon and t (ms UTC) are required' });
  const minute = Math.floor(t / 60000) * 60000;
  try {
    const [sun, earth] = await Promise.all([horizonsAzEl('10', lat, lon, minute), horizonsAzEl('399', lat, lon, minute)]);
    res.json({ t: minute, sun, earth, source: 'NASA/JPL Horizons, DE441' });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
});

const dist = fileURLToPath(new URL('../dist', import.meta.url));
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile('index.html', { root: dist }));
}

app.listen(PORT, () => {
  const ok = loadDem() !== null;
  console.log(`LUMINA API on http://localhost:${PORT}  (LOLA DEM: ${ok ? 'loaded' : 'MISSING - run npm run fetch-data'})`);
});

// Distance to the nearest permanently shadowed region (S16), on the mask built by
// scripts/build-psr.mjs from NASA's LOLA map (120 m cells, 80°S to the pole).
// "Permanent shadow" is where ice may survive, not where it is known to be.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MOON_RADIUS_KM, latLonToXY, xyToLatLon } from './dem.js';

export const PSR_FILE = fileURLToPath(new URL('./data/psr_80s_120m.bin', import.meta.url));
export const PSR_MAX_LAT = -80;
const BLOCK = 16; // cells per side of a block of the coarse index

let mask; // undefined: not read yet; null: not installed

function load() {
  if (mask !== undefined) return mask;
  if (!existsSync(PSR_FILE)) return (mask = null);
  const buf = readFileSync(PSR_FILE);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.length);
  if (buf.toString('latin1', 0, 4) !== 'PSR1') throw new Error('Not a PSR mask: ' + PSR_FILE);
  const n = view.getUint32(4, true);
  const scaleKm = Math.round(view.getFloat32(8, true) * 1e6) / 1e6;
  const bits = new Uint8Array(buf.buffer, buf.byteOffset + 16, buf.length - 16);
  // Coarse index: which blocks hold any shadow, so a search skips empty ground fast.
  const bn = Math.ceil(n / BLOCK);
  const blocks = new Uint8Array(bn * bn);
  for (let i = 0; i < n * n; i++) if (bits[i >> 3] & (1 << (i & 7))) blocks[((i / n / BLOCK) | 0) * bn + (((i % n) / BLOCK) | 0)] = 1;
  return (mask = { n, scaleKm, centre: (n - 1) / 2, bits, bn, blocks });
}

export const psrAvailable = () => load() !== null;

/** Is cell (row, col) of the mask in permanent shadow? */
export function psrShadowAt(row, col) {
  const m = load();
  if (!m || row < 0 || col < 0 || row >= m.n || col >= m.n) return false;
  const i = row * m.n + col;
  return (m.bits[i >> 3] & (1 << (i & 7))) !== 0;
}

/** Fractional row and column of a point on the mask, as dem.js does for its grids. */
export function psrCellOf(latDeg, lonDeg) {
  const m = load();
  const [x, y] = latLonToXY(latDeg, lonDeg);
  return { row: m.centre - y / m.scaleKm, col: x / m.scaleKm + m.centre };
}

const DEG = Math.PI / 180;
function distanceBearing(a, b) {
  const [p1, p2, dl] = [a.lat * DEG, b.lat * DEG, (b.lon - a.lon) * DEG];
  const d = 2 * Math.asin(Math.sqrt(Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2));
  const bearing = Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl));
  return { km: d * MOON_RADIUS_KM, bearingDeg: ((bearing / DEG) + 360) % 360 };
}

/**
 * Nearest shadowed cell within `maxKm`. `covered` is false outside 80°S-90°S or
 * without the mask; `distanceKm` is null when nothing lies within `maxKm`.
 */
export function nearestPsr(latDeg, lonDeg, maxKm = 50) {
  const m = latDeg <= PSR_MAX_LAT ? load() : null;
  if (!m) return { covered: false, inside: false, distanceKm: null, bearingDeg: null };
  const { row, col } = psrCellOf(latDeg, lonDeg);
  if (psrShadowAt(Math.round(row), Math.round(col))) return { covered: true, inside: true, distanceKm: 0, bearingDeg: null };

  const br = Math.floor(row / BLOCK);
  const bc = Math.floor(col / BLOCK);
  const maxCells = maxKm / m.scaleKm;
  let best = Infinity; // squared distance in cells
  let bestR = -1;
  let bestC = -1;
  for (let ring = 0; ring * BLOCK <= maxCells + BLOCK; ring++) {
    // Every cell of this ring of blocks is at least (ring - 1) blocks away.
    if ((ring - 1) * BLOCK > Math.sqrt(best)) break;
    for (let i = br - ring; i <= br + ring; i++) {
      for (let j = bc - ring; j <= bc + ring; j++) {
        if (Math.max(Math.abs(i - br), Math.abs(j - bc)) !== ring || i < 0 || j < 0 || i >= m.bn || j >= m.bn || !m.blocks[i * m.bn + j]) continue;
        for (let r = i * BLOCK; r < Math.min(m.n, (i + 1) * BLOCK); r++) {
          for (let c = j * BLOCK; c < Math.min(m.n, (j + 1) * BLOCK); c++) {
            if (!psrShadowAt(r, c)) continue;
            const d2 = (r - row) ** 2 + (c - col) ** 2;
            if (d2 < best) [best, bestR, bestC] = [d2, r, c];
          }
        }
      }
    }
  }
  if (bestR < 0 || Math.sqrt(best) > maxCells) return { covered: true, inside: false, distanceKm: null, bearingDeg: null };
  const [lat, lon] = xyToLatLon((bestC - m.centre) * m.scaleKm, (m.centre - bestR) * m.scaleKm);
  const { km, bearingDeg } = distanceBearing({ lat: latDeg, lon: lonDeg }, { lat, lon });
  return { covered: true, inside: false, distanceKm: Math.round(km * 100) / 100, bearingDeg: Math.round(bearingDeg) };
}

// S11: square terrain patches around a site, for the 3D view. Heights are given
// on the site's tangent plane (east = x, north = y) and relative to the ground
// at the site, with the Moon's curvature already subtracted, so distant terrain
// sinks below the horizon as it does in reality.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOON_RADIUS_KM as R, heightAtXY, latLonToXY, loadDem, resolutionAt } from './dem.js';

export const PATCH_SIZES_KM = [8, 64];
/** Odd, so the site falls on the centre vertex; 256 cells give 31.25 m and 250 m spacings. */
export const PATCH_VERTICES = 257;
export const PATCHES_DIR = fileURLToPath(new URL('./data/patches', import.meta.url));
const DEG = Math.PI / 180;
const DN_M = 0.5;

/**
 * Heights of a `sizeKm` square around the site, row 0 on the north edge, as
 * int16 half-metres. `heightFn(xKm, yKm)` gives terrain height in km on the
 * polar map; tests replace it to check the geometry on a smooth sphere.
 */
export function buildPatch(latDeg, lonDeg, sizeKm, heightFn = heightAtXY, n = PATCH_VERTICES) {
  const dem = loadDem();
  if (!dem && heightFn === heightAtXY) throw new Error('DEM not installed. Run: npm run fetch-data');
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  // Moon-fixed unit vectors: site position, local north, local east.
  const p0 = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const nv = [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)];
  const ev = [-Math.sin(lon), Math.cos(lon), 0];

  const [sx, sy] = latLonToXY(latDeg, lonDeg);
  const h0 = heightFn(sx, sy);
  const r0 = R + (Number.isNaN(h0) ? 0 : h0);
  const half = sizeKm / 2;
  const step = sizeKm / (n - 1);
  const data = new Int16Array(n * n);

  for (let j = 0; j < n; j++) {
    const y = half - j * step; // north
    for (let i = 0; i < n; i++) {
      const x = -half + i * step; // east
      // Plane distance is taken as distance along the surface (azimuthal equidistant):
      // at 32 km the two differ by under 2 m.
      const d = Math.hypot(x, y);
      const g = d / R;
      const cg = Math.cos(g);
      const sg = Math.sin(g);
      const ca = d > 0 ? y / d : 0;
      const sa = d > 0 ? x / d : 0;
      const px = p0[0] * cg + (nv[0] * ca + ev[0] * sa) * sg;
      const py = p0[1] * cg + (nv[1] * ca + ev[1] * sa) * sg;
      const pz = p0[2] * cg + (nv[2] * ca + ev[2] * sa) * sg;
      // South polar stereographic map coordinates, as in horizon.js.
      const k = (2 * R) / (1 - pz);
      let h = heightFn(k * py, k * px);
      if (Number.isNaN(h)) h = r0 - R; // outside every grid: carry on as a smooth sphere
      const up = (R + h) * cg - r0; // height above the site's tangent plane, km
      data[j * n + i] = Math.max(-32768, Math.min(32767, Math.round((up * 1000) / DN_M)));
    }
  }
  return { lat: latDeg, lon: lonDeg, sizeKm, vertices: n, resolutionM: dem ? resolutionAt(latDeg, lonDeg) : null, data };
}

/** Lookup key of a site and patch size. Longitude is taken in -180..180. */
export function patchKey(lat, lon, sizeKm) {
  const east = ((((lon + 180) % 360) + 360) % 360) - 180;
  return `${lat.toFixed(5)}|${east.toFixed(5)}|${sizeKm}`;
}

/**
 * Patches computed beforehand on the fine grids (npm run precompute): an index
 * file plus one little-endian int16 file per site and size.
 */
export function loadPrecomputedPatches(dir = PATCHES_DIR) {
  const map = new Map();
  const index = join(dir, 'index.json');
  if (!existsSync(index)) return map;
  for (const p of JSON.parse(readFileSync(index, 'utf8'))) {
    const buf = readFileSync(join(dir, p.file));
    const data = new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
    if (data.length !== p.vertices * p.vertices) continue;
    map.set(patchKey(p.lat, p.lon, p.sizeKm), { ...p, data });
  }
  return map;
}

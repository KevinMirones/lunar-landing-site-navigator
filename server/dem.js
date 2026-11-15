// LOLA south-pole digital elevation models (PDS3 LDEM products, LRO).
// Polar stereographic, true scale at the pole. Heights are DN * 0.5 m relative
// to a 1737.4 km sphere. The 240 m grid reaches 75S and is always needed; the
// 80 m, 40 m and 20 m grids are optional and nest inside it around the pole.
import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalDemAvailable, globalHeightAtUnit, globalResolutionM } from './globalDem.js';

export const MOON_RADIUS_KM = 1737.4;
export const DEM_SCALE_KM = 0.24;
export const DEM_MIN_LAT = -75;
/** Sites poleward of this get real terrain from the polar grids alone: their rays stay inside them. */
export const POLAR_COVERAGE_MAX_LAT = -80;
const POLAR_EDGE_Z = Math.sin((DEM_MIN_LAT * Math.PI) / 180);
const DN_TO_KM = 0.5 / 1000;

// Sizes are the LINES / LINE_SAMPLES of each product's .lbl. Finest first.
const PRODUCTS = [
  { file: 'ldem_875s_20m.img', size: 7584, scaleKm: 0.02 }, // 87.5S to the pole
  { file: 'ldem_85s_40m.img', size: 7584, scaleKm: 0.04 }, // 85S to the pole
  { file: 'ldem_80s_80m.img', size: 7600, scaleKm: 0.08 }, // 80S to the pole
  { file: 'ldem_75s_240m.img', size: 3812, scaleKm: DEM_SCALE_KM },
];
const pathOf = (file) => fileURLToPath(new URL(`./data/${file}`, import.meta.url));

/** Loaded grids, finest first: { size, scaleKm, centre, halfKm, data, buffer }. */
let grids = null;

function makeGrid({ size, scaleKm, buffer }) {
  const centre = (size - 1) / 2; // 0-based pixel coordinate of the pole
  return { size, scaleKm, centre, halfKm: centre * scaleKm, data: new Int16Array(buffer), buffer };
}

function readGrid({ file, size, scaleKm }) {
  const path = pathOf(file);
  const bytes = size * size * 2;
  if (statSync(path).size !== bytes) throw new Error(`Unexpected size of ${file}: ${statSync(path).size} bytes`);
  // Shared memory, so the search worker threads read the same grid instead of each loading a copy.
  // The files are little-endian int16, which matches every platform Node runs on.
  const buffer = new SharedArrayBuffer(bytes);
  const fd = openSync(path, 'r');
  try {
    const view = new Uint8Array(buffer);
    for (let at = 0; at < bytes; ) at += readSync(fd, view, at, Math.min(1 << 26, bytes - at), at);
  } finally {
    closeSync(fd);
  }
  return makeGrid({ size, scaleKm, buffer });
}

/**
 * Loads the grids found in server/data. Returns null when the 240 m grid is missing.
 * LUMINA_HIRES=0 skips the finer grids (345 MB of memory) even when they are installed.
 */
export function loadDem() {
  if (grids) return grids;
  const base = PRODUCTS.at(-1);
  if (!existsSync(pathOf(base.file))) return null;
  const fine = process.env.LUMINA_HIRES === '0' ? [] : PRODUCTS.slice(0, -1).filter((p) => existsSync(pathOf(p.file)));
  grids = [...fine, base].map(readGrid);
  return grids;
}

/** The grids as shared memory, to hand to worker threads. */
export function sharedDem() {
  return (loadDem() ?? []).map(({ size, scaleKm, buffer }) => ({ size, scaleKm, buffer }));
}

/** Worker threads call this with the list from `sharedDem()` instead of loading the files. */
export function adoptDem(list) {
  grids = list.map(makeGrid).sort((a, b) => a.scaleKm - b.scaleKm);
}

export function demAvailable() {
  return loadDem() !== null;
}

/** Cell sizes of the loaded grids in metres, finest first. */
export function demResolutions() {
  return (loadDem() ?? []).map((g) => Math.round(g.scaleKm * 1000));
}

function gridAt(xKm, yKm) {
  for (let k = 0; k < grids.length; k++) {
    const g = grids[k];
    if (xKm >= -g.halfKm && xKm <= g.halfKm && yKm >= -g.halfKm && yKm <= g.halfKm) return g;
  }
  return null;
}

function sample(g, xKm, yKm) {
  const { size, data } = g;
  const col = xKm / g.scaleKm + g.centre;
  const row = g.centre - yKm / g.scaleKm;
  if (!(col >= 0 && row >= 0 && col <= size - 1 && row <= size - 1)) return NaN;
  const c0 = Math.min(size - 2, Math.floor(col));
  const r0 = Math.min(size - 2, Math.floor(row));
  const fc = col - c0;
  const fr = row - r0;
  const i = r0 * size + c0;
  const top = data[i] * (1 - fc) + data[i + 1] * fc;
  const bot = data[i + size] * (1 - fc) + data[i + size + 1] * fc;
  return (top * (1 - fr) + bot * fr) * DN_TO_KM;
}

/**
 * Map km (x toward lon 90E, y toward lon 0) -> terrain height in km, from the
 * finest grid that contains the point, or NaN outside every grid.
 */
export function heightAtXY(xKm, yKm) {
  const g = gridAt(xKm, yKm);
  return g ? sample(g, xKm, yKm) : NaN;
}

/** Cell size in metres of the finest grid at a map point, or null outside every grid. */
export function resolutionAtXY(xKm, yKm) {
  const g = gridAt(xKm, yKm);
  return g ? Math.round(g.scaleKm * 1000) : null;
}

export function resolutionAt(latDeg, lonDeg) {
  const [x, y] = latLonToXY(latDeg, lonDeg);
  return resolutionAtXY(x, y);
}

/** Runs `fn` with only the 240 m grid in use, to measure what the finer grids change. */
export function withCoarseOnly(fn) {
  const all = grids;
  grids = [all.at(-1)];
  try {
    return fn();
  } finally {
    grids = all;
  }
}

/** Runs `fn` with the polar grids out of use, to compare them with the whole-Moon grid (S17). */
export function withoutPolarGrids(fn) {
  const all = loadDem();
  grids = [];
  try {
    return fn();
  } finally {
    grids = all;
  }
}

/** Height from one grid only (by cell size in metres), to compare grids with each other. */
export function heightInGrid(resolutionM, xKm, yKm) {
  const g = grids.find((it) => Math.round(it.scaleKm * 1000) === resolutionM);
  return g ? sample(g, xKm, yKm) : NaN;
}

/** South polar stereographic forward projection. */
export function latLonToXY(latDeg, lonDeg) {
  const rho = 2 * MOON_RADIUS_KM * Math.tan(((90 + latDeg) * Math.PI) / 360);
  const lon = (lonDeg * Math.PI) / 180;
  return [rho * Math.sin(lon), rho * Math.cos(lon)];
}

/** South polar stereographic inverse projection: map km -> [latitude, longitude] in degrees. */
export function xyToLatLon(xKm, yKm) {
  const lat = -90 + (2 * Math.atan(Math.hypot(xKm, yKm) / (2 * MOON_RADIUS_KM)) * 180) / Math.PI;
  return [lat, (Math.atan2(xKm, yKm) * 180) / Math.PI];
}

export function heightAtLatLon(latDeg, lonDeg) {
  const [x, y] = latLonToXY(latDeg, lonDeg);
  return heightAtXY(x, y);
}

/**
 * Terrain height in km of a point given as a unit vector (x toward 0E on the
 * equator, z toward the north pole): the finest polar grid that holds it, else
 * the whole-Moon grid (S17), else NaN. The polar grids must be loaded first (loadDem).
 */
export function heightAtUnit(x, y, z) {
  if (grids && z < POLAR_EDGE_Z) {
    const k = (2 * MOON_RADIUS_KM) / (1 - z);
    const g = gridAt(k * y, k * x);
    if (g) return sample(g, k * y, k * x);
  }
  return globalHeightAtUnit(x, y, z);
}

/**
 * Cell size in metres of the terrain a horizon or patch at this site would use,
 * or null when the site has none. Within 80S to 90S the polar grids are enough.
 * Elsewhere the whole-Moon grid is needed: on its own, or to carry on the rays of
 * a site between 75S and 80S that would otherwise leave the polar grids too soon.
 */
export function terrainResolutionAt(latDeg, lonDeg) {
  const polar = loadDem() && latDeg < DEM_MIN_LAT ? resolutionAt(latDeg, lonDeg) : null;
  if (polar !== null && latDeg <= POLAR_COVERAGE_MAX_LAT) return polar;
  if (!globalDemAvailable()) return null;
  return polar ?? globalResolutionM();
}

/** Terrain slope in degrees, from the height difference one grid cell either side of the point. */
export function slopeDegAt(latDeg, lonDeg) {
  const [x, y] = latLonToXY(latDeg, lonDeg);
  const d = DEM_SCALE_KM;
  const gx = (heightAtXY(x + d, y) - heightAtXY(x - d, y)) / (2 * d);
  const gy = (heightAtXY(x, y + d) - heightAtXY(x, y - d)) / (2 * d);
  return (Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI;
}

/**
 * Downsampled square heightmap of the polar cap for the browser shadow map.
 * Returns int16 half-metre DNs, row 0 at the top (lon 0 up, lon 90E right).
 * Always read from the 240 m grid: its cells are 480 m, so finer terrain would only alias.
 */
export function buildHeightmap(size, halfExtentKm) {
  const base = grids.at(-1);
  const at = (x, y) => sample(base, x, y);
  const out = new Int16Array(size * size);
  const px = (2 * halfExtentKm) / size;
  const q = px / 4;
  for (let r = 0; r < size; r++) {
    const y = halfExtentKm - (r + 0.5) * px;
    for (let c = 0; c < size; c++) {
      const x = -halfExtentKm + (c + 0.5) * px;
      // 2x2 supersample to limit aliasing.
      const h =
        (at(x - q, y - q) + at(x + q, y - q) + at(x - q, y + q) + at(x + q, y + q)) / 4;
      out[r * size + c] = Number.isNaN(h) ? 0 : Math.round(h / DN_TO_KM);
    }
  }
  return out;
}

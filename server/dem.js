// LOLA south-pole digital elevation model (LDEM_75S_240M, PDS3).
// Polar stereographic, true scale at the pole, 240 m/pixel, 75S-90S.
// Heights are metres * 0.5 DN relative to a 1737.4 km sphere.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const MOON_RADIUS_KM = 1737.4;
export const DEM_SIZE = 3812;
export const DEM_SCALE_KM = 0.24;
export const DEM_CENTER = 1905.5; // 0-based pixel coordinate of the pole
export const DEM_MIN_LAT = -75;
const DN_TO_KM = 0.5 / 1000;

const DEM_PATH = fileURLToPath(new URL('./data/ldem_75s_240m.img', import.meta.url));

let grid = null;

export function loadDem() {
  if (grid) return grid;
  if (!existsSync(DEM_PATH)) return null;
  const buf = readFileSync(DEM_PATH);
  if (buf.length !== DEM_SIZE * DEM_SIZE * 2) {
    throw new Error(`Unexpected DEM size: ${buf.length} bytes`);
  }
  // The file is little-endian int16, which matches every platform Node runs on.
  grid = new Int16Array(buf.buffer, buf.byteOffset, DEM_SIZE * DEM_SIZE);
  return grid;
}

export function demAvailable() {
  return loadDem() !== null;
}

/** Map km (x toward lon 90E, y toward lon 0) -> terrain height in km, or NaN outside the grid. */
export function heightAtXY(xKm, yKm) {
  const col = xKm / DEM_SCALE_KM + DEM_CENTER;
  const row = DEM_CENTER - yKm / DEM_SCALE_KM;
  if (!(col >= 0 && row >= 0 && col <= DEM_SIZE - 1 && row <= DEM_SIZE - 1)) return NaN;
  const c0 = Math.min(DEM_SIZE - 2, Math.floor(col));
  const r0 = Math.min(DEM_SIZE - 2, Math.floor(row));
  const fc = col - c0;
  const fr = row - r0;
  const i = r0 * DEM_SIZE + c0;
  const top = grid[i] * (1 - fc) + grid[i + 1] * fc;
  const bot = grid[i + DEM_SIZE] * (1 - fc) + grid[i + DEM_SIZE + 1] * fc;
  return (top * (1 - fr) + bot * fr) * DN_TO_KM;
}

/** South polar stereographic forward projection. */
export function latLonToXY(latDeg, lonDeg) {
  const rho = 2 * MOON_RADIUS_KM * Math.tan(((90 + latDeg) * Math.PI) / 360);
  const lon = (lonDeg * Math.PI) / 180;
  return [rho * Math.sin(lon), rho * Math.cos(lon)];
}

export function heightAtLatLon(latDeg, lonDeg) {
  const [x, y] = latLonToXY(latDeg, lonDeg);
  return heightAtXY(x, y);
}

/**
 * Downsampled square heightmap of the polar cap for the browser shadow map.
 * Returns int16 half-metre DNs, row 0 at the top (lon 0 up, lon 90E right).
 */
export function buildHeightmap(size, halfExtentKm) {
  const out = new Int16Array(size * size);
  const px = (2 * halfExtentKm) / size;
  const q = px / 4;
  for (let r = 0; r < size; r++) {
    const y = halfExtentKm - (r + 0.5) * px;
    for (let c = 0; c < size; c++) {
      const x = -halfExtentKm + (c + 0.5) * px;
      // 2x2 supersample to limit aliasing.
      const h =
        (heightAtXY(x - q, y - q) + heightAtXY(x + q, y - q) + heightAtXY(x - q, y + q) + heightAtXY(x + q, y + q)) / 4;
      out[r * size + c] = Number.isNaN(h) ? 0 : Math.round(h / DN_TO_KM);
    }
  }
  return out;
}

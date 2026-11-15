// S17: LOLA's whole-Moon elevation model (LDEM_64, PDS3, LRO), for terrain outside
// the south pole. Simple cylindrical, 64 pixels per degree (474 m at the equator),
// 23040 x 11520 little-endian int16. Row 0 is centred half a pixel below 90N and
// column 0 half a pixel east of 0E. Heights are DN * 0.5 m relative to the same
// 1737.4 km sphere as the polar grids, so the two mix without conversion.
//
// The file is 531 MB, so it is not loaded: blocks of it are read when a height
// is asked for, and the most recent ones are kept (32 MB at most).
import { closeSync, existsSync, openSync, readSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MOON_RADIUS_KM = 1737.4;
const DN_TO_KM = 0.5 / 1000;
const RAD = 180 / Math.PI;
export const GLOBAL_FILE = fileURLToPath(new URL('./data/ldem_64.img', import.meta.url));
export const GLOBAL_PPD = 64;

/** The open grid, null when absent or switched off, undefined until first asked for. */
let dem;

/**
 * Opens a whole-Moon grid. Defaults are the real product; tests pass a small synthetic file.
 * `block` is the side of the square blocks read from disk, `maxBlocks` how many stay in memory.
 * Returns null when the file is missing.
 */
export function openGlobalDem({ file = GLOBAL_FILE, ppd = GLOBAL_PPD, block = 256, maxBlocks = 256 } = {}) {
  closeGlobalDem();
  if (!existsSync(file)) return (dem = null);
  const width = 360 * ppd;
  const height = 180 * ppd;
  if (statSync(file).size !== width * height * 2) throw new Error(`Unexpected size of ${file}: ${statSync(file).size} bytes`);
  dem = {
    fd: openSync(file, 'r'),
    ppd,
    width,
    height,
    block,
    blocksAcross: Math.ceil(width / block),
    maxBlocks,
    blocks: new Map(),
    last: null,
    lastKey: -1,
    resolutionM: Math.round(((2 * Math.PI * MOON_RADIUS_KM) / width) * 1000),
  };
  return dem;
}

/** Closes the grid and forgets its blocks. The next height asked for opens it again. */
export function closeGlobalDem() {
  if (dem) closeSync(dem.fd);
  dem = undefined;
}

/** Leaves the grid off in this process (the point search, which stays within 80S to 90S). */
export function disableGlobalDem() {
  closeGlobalDem();
  dem = null;
}

// LUMINA_GLOBAL=0 leaves the grid off even when installed, as LUMINA_HIRES=0 does with the fine
// polar grids: the browser checks run that way, so they give the same results on every machine.
function grid() {
  if (dem === undefined) {
    if (process.env.LUMINA_GLOBAL === '0') dem = null;
    else openGlobalDem();
  }
  return dem;
}

export function globalDemAvailable() {
  return grid() !== null;
}

/** Cell size in metres at the equator, or null without the grid. */
export function globalResolutionM() {
  return grid()?.resolutionM ?? null;
}

/** Number of blocks held in memory, and their size in bytes (to check the memory budget). */
export function globalCacheStats() {
  if (!dem) return { blocks: 0, bytes: 0 };
  let bytes = 0;
  for (const b of dem.blocks.values()) bytes += b.data.byteLength;
  return { blocks: dem.blocks.size, bytes };
}

function readBlock(g, bi, bj) {
  const c0 = bi * g.block;
  const r0 = bj * g.block;
  const cols = Math.min(g.block, g.width - c0);
  const rows = Math.min(g.block, g.height - r0);
  const data = new Int16Array(rows * cols);
  const bytes = new Uint8Array(data.buffer);
  for (let r = 0; r < rows; r++) {
    const at = ((r0 + r) * g.width + c0) * 2;
    for (let got = 0; got < cols * 2; ) got += readSync(g.fd, bytes, r * cols * 2 + got, cols * 2 - got, at + got);
  }
  return { c0, r0, cols, data };
}

/** Raw DN of a cell. Columns wrap around the Moon; rows stop at the first and last. */
function dnAt(g, row, col) {
  const r = row < 0 ? 0 : row >= g.height ? g.height - 1 : row;
  const c = ((col % g.width) + g.width) % g.width;
  const bi = (c / g.block) | 0;
  const bj = (r / g.block) | 0;
  const key = bj * g.blocksAcross + bi;
  let b = key === g.lastKey ? g.last : g.blocks.get(key);
  if (!b) {
    b = readBlock(g, bi, bj);
    if (g.blocks.size >= g.maxBlocks) g.blocks.delete(g.blocks.keys().next().value); // oldest read first
    g.blocks.set(key, b);
  }
  g.last = b;
  g.lastKey = key;
  return b.data[(r - b.r0) * b.cols + (c - b.c0)];
}

/** Terrain height in km at a latitude and east longitude in degrees, bilinear; NaN without the grid. */
export function globalHeightAt(latDeg, lonDeg) {
  const g = grid();
  if (!g) return NaN;
  const row = (90 - latDeg) * g.ppd - 0.5;
  const col = ((((lonDeg % 360) + 360) % 360) * g.ppd) - 0.5;
  const r0 = Math.floor(row);
  const c0 = Math.floor(col);
  const fr = row - r0;
  const fc = col - c0;
  const top = dnAt(g, r0, c0) * (1 - fc) + dnAt(g, r0, c0 + 1) * fc;
  const bot = dnAt(g, r0 + 1, c0) * (1 - fc) + dnAt(g, r0 + 1, c0 + 1) * fc;
  return (top * (1 - fr) + bot * fr) * DN_TO_KM;
}

/** Height in km of a point given as a unit vector (x toward 0E on the equator, z toward the north pole). */
export function globalHeightAtUnit(x, y, z) {
  if (!grid()) return NaN;
  return globalHeightAt(Math.asin(Math.max(-1, Math.min(1, z))) * RAD, Math.atan2(y, x) * RAD);
}

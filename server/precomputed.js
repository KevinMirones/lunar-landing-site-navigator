// Horizons computed beforehand on the fine LOLA grids (npm run precompute), one
// small JSON file per catalogue site and mast height. A server that cannot hold
// the 345 MB of fine grids still answers those sites with fine-terrain horizons.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HORIZONS_DIR = fileURLToPath(new URL('./data/horizons', import.meta.url));

/** Lookup key of a site and mast height. Longitude is taken in -180..180. */
export function keyOf(lat, lon, mastM) {
  const east = ((((lon + 180) % 360) + 360) % 360) - 180;
  return `${lat.toFixed(5)}|${east.toFixed(5)}|${mastM}`;
}

/** Reads every horizon file in the directory into a Map keyed by `keyOf`. */
export function loadPrecomputed(dir = HORIZONS_DIR) {
  const map = new Map();
  if (!existsSync(dir)) return map;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const h = JSON.parse(readFileSync(join(dir, name), 'utf8'));
    map.set(keyOf(h.lat, h.lon, h.mastM), h);
  }
  return map;
}

// Computes, on the fine LOLA grids, the horizon of every catalogue site that has
// real terrain, for each mast height the app offers, and saves them under
// server/data/horizons/. It also saves the two terrain patches of each of those
// sites for the 3D view (S11) under server/data/patches/. Those files are
// committed: a server without the fine grids (345 MB) answers catalogue sites
// with them.
//
// Needs the fine grids: npm run fetch-data -- --hires
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { demResolutions } from '../server/dem.js';
import { computeHorizon, serializeHorizon, COVERAGE_MAX_LAT } from '../server/horizon.js';
import { PATCHES_DIR, PATCH_SIZES_KM, buildPatch } from '../server/patch.js';
import { HORIZONS_DIR } from '../server/precomputed.js';
import { MASTS } from '../src/lib/scenario.ts';
import { CATALOG } from '../src/lib/sites.ts';

const found = demResolutions();
if (![20, 40, 80].every((r) => found.includes(r))) {
  console.error(`Fine grids missing (found: ${found.join(', ') || 'none'} m). Run: npm run fetch-data -- --hires`);
  process.exit(1);
}

for (const dir of [HORIZONS_DIR, PATCHES_DIR]) {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) if (/\.(json|bin)$/.test(name)) rmSync(join(dir, name));
}

let files = 0;
const patches = [];
for (const site of CATALOG.filter((s) => s.lat <= COVERAGE_MAX_LAT)) {
  for (const mast of MASTS) {
    const h = serializeHorizon(computeHorizon(site.lat, site.lon, mast));
    writeFileSync(join(HORIZONS_DIR, `${site.id}-${mast}m.json`), JSON.stringify({ site: site.id, lat: site.lat, lon: site.lon, ...h }));
    files++;
  }
  for (const sizeKm of PATCH_SIZES_KM) {
    const { data, vertices, resolutionM } = buildPatch(site.lat, site.lon, sizeKm);
    const file = `${site.id}-${sizeKm}km.bin`;
    writeFileSync(join(PATCHES_DIR, file), new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    patches.push({ site: site.id, lat: site.lat, lon: site.lon, sizeKm, vertices, resolutionM, file });
  }
  console.log(`${site.name.padEnd(22)} ${computeHorizon(site.lat, site.lon, 2).resolutionM} m`);
}
writeFileSync(join(PATCHES_DIR, 'index.json'), `${JSON.stringify(patches, null, 1)}\n`);
console.log(`${files} horizons written to server/data/horizons/`);
console.log(`${patches.length} patches written to server/data/patches/`);

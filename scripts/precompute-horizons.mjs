// Computes, on the fine LOLA grids, the horizon of every catalogue site that has
// real terrain, for each mast height the app offers, and saves them under
// server/data/horizons/. Those files are committed: a server without the fine
// grids (345 MB) answers catalogue sites with them.
//
// Needs the fine grids: npm run fetch-data -- --hires
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { demResolutions } from '../server/dem.js';
import { computeHorizon, serializeHorizon, COVERAGE_MAX_LAT } from '../server/horizon.js';
import { HORIZONS_DIR } from '../server/precomputed.js';
import { MASTS } from '../src/lib/scenario.ts';
import { CATALOG } from '../src/lib/sites.ts';

const found = demResolutions();
if (![20, 40, 80].every((r) => found.includes(r))) {
  console.error(`Fine grids missing (found: ${found.join(', ') || 'none'} m). Run: npm run fetch-data -- --hires`);
  process.exit(1);
}

mkdirSync(HORIZONS_DIR, { recursive: true });
for (const name of readdirSync(HORIZONS_DIR)) if (name.endsWith('.json')) rmSync(join(HORIZONS_DIR, name));

let files = 0;
for (const site of CATALOG.filter((s) => s.lat <= COVERAGE_MAX_LAT)) {
  for (const mast of MASTS) {
    const h = serializeHorizon(computeHorizon(site.lat, site.lon, mast));
    writeFileSync(join(HORIZONS_DIR, `${site.id}-${mast}m.json`), JSON.stringify({ site: site.id, lat: site.lat, lon: site.lon, ...h }));
    files++;
  }
  console.log(`${site.name.padEnd(22)} ${computeHorizon(site.lat, site.lon, 2).resolutionM} m`);
}
console.log(`${files} horizons written to server/data/horizons/`);

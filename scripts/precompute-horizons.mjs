// Computes, on the finest terrain available, the horizon of every catalogue site
// for each mast height the app offers, and saves them under server/data/horizons/.
// It also saves the two terrain patches of each site for the 3D view (S11) under
// server/data/patches/. Those files are committed: a server without the big grids
// answers catalogue sites with them.
//
// Two independent parts, each run only when its terrain is installed:
//  - sites within 80S to 90S, on the fine polar grids: npm run fetch-data -- --hires
//  - every other site (S17), on the whole-Moon grid:   npm run fetch-data -- --global
// Each part rewrites the files of its own sites only, so one person can run one part
// and another person the other.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { POLAR_COVERAGE_MAX_LAT, demResolutions } from '../server/dem.js';
import { globalDemAvailable } from '../server/globalDem.js';
import { computeHorizon, serializeHorizon } from '../server/horizon.js';
import { PATCHES_DIR, PATCH_SIZES_KM, buildPatch } from '../server/patch.js';
import { HORIZONS_DIR } from '../server/precomputed.js';
import { MASTS } from '../src/lib/scenario.ts';
import { CATALOG } from '../src/lib/sites.ts';

const isPolar = (s) => s.lat <= POLAR_COVERAGE_MAX_LAT;
const found = demResolutions();
const parts = [
  {
    name: 'polar sites (fine polar grids)',
    polar: true,
    sites: CATALOG.filter(isPolar),
    ready: [20, 40, 80].every((r) => found.includes(r)),
    missing: `fine polar grids missing (found: ${found.join(', ') || 'none'} m). Run: npm run fetch-data -- --hires`,
  },
  {
    name: 'sites outside the pole (whole-Moon grid)',
    polar: false,
    sites: CATALOG.filter((s) => !isPolar(s)),
    ready: globalDemAvailable(),
    missing: 'whole-Moon grid missing. Run: npm run fetch-data -- --global',
  },
];

if (!parts.some((p) => p.ready)) {
  for (const p of parts) console.error(`Skipping ${p.name}: ${p.missing}`);
  process.exit(1);
}

for (const dir of [HORIZONS_DIR, PATCHES_DIR]) mkdirSync(dir, { recursive: true });
const indexFile = join(PATCHES_DIR, 'index.json');
let index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : [];

for (const part of parts) {
  if (!part.ready) {
    console.log(`Skipping ${part.name}: ${part.missing}. Their files are left as they are.`);
    continue;
  }
  console.log(`${part.name}:`);
  // Forget this part's earlier files, including those of sites no longer in the catalogue.
  for (const old of index.filter((p) => isPolar(p) === part.polar)) rmSync(join(PATCHES_DIR, old.file), { force: true });
  index = index.filter((p) => isPolar(p) !== part.polar);
  for (const name of readdirSync(HORIZONS_DIR).filter((n) => n.endsWith('.json'))) {
    if (isPolar(JSON.parse(readFileSync(join(HORIZONS_DIR, name), 'utf8'))) === part.polar) rmSync(join(HORIZONS_DIR, name));
  }
  let horizons = 0;
  for (const site of part.sites) {
    for (const mast of MASTS) {
      const h = serializeHorizon(computeHorizon(site.lat, site.lon, mast));
      writeFileSync(join(HORIZONS_DIR, `${site.id}-${mast}m.json`), JSON.stringify({ site: site.id, lat: site.lat, lon: site.lon, ...h }));
      horizons++;
    }
    for (const sizeKm of PATCH_SIZES_KM) {
      const { data, vertices, resolutionM } = buildPatch(site.lat, site.lon, sizeKm);
      const file = `${site.id}-${sizeKm}km.bin`;
      writeFileSync(join(PATCHES_DIR, file), new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
      index.push({ site: site.id, lat: site.lat, lon: site.lon, sizeKm, vertices, resolutionM, file });
    }
    console.log(`  ${site.name.padEnd(22)} ${computeHorizon(site.lat, site.lon, 2).resolutionM} m`);
  }
  console.log(`  ${horizons} horizons and ${part.sites.length * PATCH_SIZES_KM.length} patches written`);
}

// In catalogue order, so the index diffs cleanly.
const order = new Map(CATALOG.map((s, i) => [s.id, i]));
index.sort((a, b) => (order.get(a.site) ?? 1e9) - (order.get(b.site) ?? 1e9) || a.sizeKm - b.sizeKm);
writeFileSync(indexFile, `${JSON.stringify(index, null, 1)}\n`);

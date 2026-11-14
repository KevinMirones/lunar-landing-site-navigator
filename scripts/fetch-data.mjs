// Downloads the public NASA datasets LUMINA needs:
//  - LOLA south-pole elevation model (LRO, PDS Geosciences Node), 240 m/pixel
//  - with --hires, the nested 80 m, 40 m and 20 m grids (345 MB) for finer horizons
//  - with --validation, NASA's published 18.6-year maps of Sun and Earth visibility
//    (102 MB), which npm run validate compares against
//  - LROC colour mosaic of the Moon (NASA SVS CGI Moon Kit) for the 3D globe
//
// The PDS server can be slow, so downloads go to a ".part" file, resume where
// they stopped, and are only accepted once the size matches.
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const LOLA = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img';
const FILES = [
  { url: `${LOLA}/ldem_75s_240m.img`, rel: '../server/data/ldem_75s_240m.img', bytes: 3812 * 3812 * 2 },
  { url: `${LOLA}/ldem_75s_240m.lbl`, rel: '../server/data/ldem_75s_240m.lbl' },
  { url: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg', rel: '../public/textures/moon_1k.jpg' },
];
// Sizes come from each product's .lbl: 7600 px (80 m) and 7584 px (40 m, 20 m), int16.
const HIRES = [
  { url: `${LOLA}/ldem_80s_80m.img`, rel: '../server/data/ldem_80s_80m.img', bytes: 7600 * 7600 * 2 },
  { url: `${LOLA}/ldem_85s_40m.img`, rel: '../server/data/ldem_85s_40m.img', bytes: 7584 * 7584 * 2 },
  { url: `${LOLA}/ldem_875s_20m.img`, rel: '../server/data/ldem_875s_20m.img', bytes: 7584 * 7584 * 2 },
];
if (process.argv.includes('--hires')) FILES.push(...HIRES);
// LOLA team, method of Mazarico et al. (2011), 60 m per pixel, 5058 px, int16.
const ILLUMINATION = 'http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG';
const VALIDATION = ['AVGVISIB_85S_060M_201608', 'AVGVISIB_85S_060M_201608_EARTH'].map((name) => ({
  url: `${ILLUMINATION}/${name}.IMG`,
  rel: `../server/data/published/${name}.IMG`,
  bytes: 5058 * 5058 * 2,
}));
if (process.argv.includes('--validation')) FILES.push(...VALIDATION);
const ATTEMPTS = 6;
const MB = 1024 * 1024;
const sizeOf = (p) => (existsSync(p) ? statSync(p).size : 0);

function progress(start, total) {
  let done = start;
  let shown = Math.floor(start / (4 * MB));
  return new Transform({
    transform(chunk, _enc, cb) {
      done += chunk.length;
      const step = Math.floor(done / (4 * MB));
      if (step > shown) {
        shown = step;
        process.stdout.write(`  ${(done / MB).toFixed(0)}${total ? ` / ${(total / MB).toFixed(0)}` : ''} MB\n`);
      }
      cb(null, chunk);
    },
  });
}

async function download({ url, rel, bytes }) {
  const path = fileURLToPath(new URL(rel, import.meta.url));
  const part = `${path}.part`;
  mkdirSync(dirname(path), { recursive: true });

  if (existsSync(path)) {
    if (!bytes || sizeOf(path) === bytes) return console.log('ok       ', rel);
    console.log('incomplete', rel, '- resuming');
    renameSync(path, part); // a truncated file from an interrupted run
  }

  console.log('fetching ', rel);
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      let have = sizeOf(part);
      if (bytes && have > bytes) {
        rmSync(part);
        have = 0;
      }
      if (!bytes || have < bytes) {
        const res = await fetch(url, { headers: have ? { Range: `bytes=${have}-` } : {} });
        if (have && res.status !== 206) {
          rmSync(part); // server would not resume: start over
          have = 0;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        } else if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        await pipeline(Readable.fromWeb(res.body), progress(have, bytes), createWriteStream(part, { flags: have ? 'a' : 'w' }));
      }
      const got = sizeOf(part);
      if (bytes && got !== bytes) throw new Error(`got ${got} of ${bytes} bytes`);
      renameSync(part, path);
      return console.log('done     ', rel);
    } catch (err) {
      console.log(`  attempt ${attempt}/${ATTEMPTS} failed: ${err.message}`);
    }
  }
  throw new Error(`Could not download ${url}. Run "npm run fetch-data" again to resume.`);
}

for (const file of FILES) await download(file);

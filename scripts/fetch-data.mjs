// Downloads the public NASA datasets LUMINA needs:
//  - LOLA south-pole elevation model (LRO, PDS Geosciences Node), 240 m/pixel
//  - with --hires, the nested 80 m, 40 m and 20 m grids (345 MB) for finer horizons
//  - with --global, the whole-Moon model at 474 m/pixel (531 MB) for terrain outside the pole (S17)
//  - with --validation, NASA's published 18.6-year maps of Sun and Earth visibility
//    (102 MB), which npm run validate compares against
//  - LROC colour mosaic of the Moon (NASA SVS CGI Moon Kit) for the 3D globe
//
// The PDS server can be slow, so downloads go to a ".part" file, resume where
// they stopped, and are only accepted once the size matches. Files of 64 MB or
// more come down in pieces over several connections.
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, writeSync } from 'node:fs';
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
// Permanently shadowed regions (S16), 120 m per pixel, 7624 px, int16. Only scripts/build-psr.mjs reads it.
const PSR = [
  { url: `${ILLUMINATION}/LPSR_75S_120M_201608.IMG`, rel: '../server/data/published/LPSR_75S_120M_201608.IMG', bytes: 7624 * 7624 * 2 },
  { url: `${ILLUMINATION}/LPSR_75S_120M_201608.LBL`, rel: '../server/data/published/LPSR_75S_120M_201608.LBL' },
];
if (process.argv.includes('--psr')) FILES.push(...PSR);
// Whole-Moon elevation (S17): LDEM_64, 64 px per degree (474 m at the equator), 23040 x 11520 px, int16.
// Only needed to precompute the catalogue sites outside the pole, or for terrain at any point of your own.
const GLOBAL_LOLA = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img';
const GLOBAL = [
  { url: `${GLOBAL_LOLA}/ldem_64.img`, rel: '../server/data/ldem_64.img', bytes: 23040 * 11520 * 2 },
  { url: `${GLOBAL_LOLA}/ldem_64.lbl`, rel: '../server/data/ldem_64.lbl' },
];
if (process.argv.includes('--global')) FILES.push(...GLOBAL);
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

// Large files come down in 1 MB pieces over 16 connections. Measured on 15 November 2026,
// the PDS server gave each connection 30 to 40 KB/s, and 16 connections 512 KB/s in total:
// one connection would take four hours over the 531 MB of S17, sixteen take a quarter of one.
const PIECE = MB;
const CONNECTIONS = 16;

async function downloadPieces({ url, rel, bytes }, part) {
  // Pieces already written are listed in `<part>.pieces`. A part file left by a one-connection
  // run has no list: the pieces inside its length are complete.
  const list = `${part}.pieces`;
  const count = Math.ceil(bytes / PIECE);
  const done = new Set(existsSync(list) ? JSON.parse(readFileSync(list, 'utf8')) : []);
  if (!existsSync(list)) for (let i = 0; (i + 1) * PIECE <= sizeOf(part); i++) done.add(i);
  const todo = [...Array(count).keys()].filter((i) => !done.has(i));
  console.log(`  ${done.size} of ${count} pieces already here, ${todo.length} to fetch over ${CONNECTIONS} connections`);
  const fd = openSync(part, existsSync(part) ? 'r+' : 'w');
  const t0 = Date.now();
  let got = 0;
  try {
    const fetchPiece = async (i) => {
      const from = i * PIECE;
      const to = Math.min(bytes, from + PIECE) - 1;
      for (let attempt = 1; ; attempt++) {
        try {
          const res = await fetch(url, { headers: { Range: `bytes=${from}-${to}` }, signal: AbortSignal.timeout(300000) });
          if (res.status !== 206) throw new Error(`HTTP ${res.status}`);
          const buf = new Uint8Array(await res.arrayBuffer());
          if (buf.length !== to - from + 1) throw new Error(`short piece: ${buf.length} bytes`);
          writeSync(fd, buf, 0, buf.length, from);
          return;
        } catch (err) {
          if (attempt >= ATTEMPTS) throw err;
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    };
    let next = 0;
    const worker = async () => {
      while (next < todo.length) {
        const i = todo[next++];
        await fetchPiece(i);
        done.add(i);
        writeFileSync(list, JSON.stringify([...done]));
        got += PIECE;
        process.stdout.write(`  ${done.size} / ${count} pieces, ${((got / 1024 / (Date.now() - t0)) * 1000).toFixed(0)} KB/s\n`);
      }
    };
    await Promise.all(Array.from({ length: CONNECTIONS }, worker));
  } finally {
    closeSync(fd);
  }
  rmSync(list);
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
  if (bytes >= 64 * MB) {
    await downloadPieces({ url, rel, bytes }, part);
    if (sizeOf(part) !== bytes) throw new Error(`got ${sizeOf(part)} of ${bytes} bytes. Run "npm run fetch-data" again to resume.`);
    renameSync(part, path);
    return console.log('done     ', rel);
  }
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

// Downloads the public NASA datasets LUMINA needs:
//  - LOLA south-pole elevation model (LRO, PDS Geosciences Node), 240 m/pixel
//  - LROC colour mosaic of the Moon (NASA SVS CGI Moon Kit) for the 3D globe
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const LOLA = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img';
const FILES = [
  [`${LOLA}/ldem_75s_240m.img`, '../server/data/ldem_75s_240m.img'],
  [`${LOLA}/ldem_75s_240m.lbl`, '../server/data/ldem_75s_240m.lbl'],
  ['https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg', '../public/textures/moon_1k.jpg'],
];

for (const [url, rel] of FILES) {
  const path = fileURLToPath(new URL(rel, import.meta.url));
  if (existsSync(path)) {
    console.log('ok      ', rel);
    continue;
  }
  mkdirSync(fileURLToPath(new URL('.', new URL(rel, import.meta.url))), { recursive: true });
  process.stdout.write(`fetching ${rel} ... `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(path));
  console.log('done');
}

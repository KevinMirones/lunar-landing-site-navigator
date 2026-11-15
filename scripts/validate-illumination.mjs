// Scientific validation: compares LUMINA's sunlight and Earth visibility with
// published results, over the same long periods the publications use.
//
//   1. NASA's LOLA maps of average Sun and Earth visibility (18.6 years, 60 m
//      per pixel, method of Mazarico et al. 2011), read at each catalogue site.
//   2. Glaeser et al. (2018), Planetary and Space Science 162: most illuminated
//      spots of the south pole at the surface and 2 m above it, 2017 to 2037.
//   3. What the fine grids change against the 240 m grid (spec S06).
//
// Nothing here is tuned to match: the script only reports. It needs the fine
// grids and the published maps:
//   npm run fetch-data -- --hires --validation
//
// Writes docs/VALIDACION-salida.md.
import { closeSync, existsSync, openSync, readSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { demResolutions, latLonToXY, withCoarseOnly, xyToLatLon } from '../server/dem.js';
import { computeHorizon } from '../server/horizon.js';
import { computeFrameSeries, metrics, siteSeries } from '../src/lib/series.ts';
import { CATALOG } from '../src/lib/sites.ts';

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const OUT = fileURLToPath(new URL('../docs/VALIDACION-salida.md', import.meta.url));
const PUBLISHED = fileURLToPath(new URL('../server/data/published/', import.meta.url));

const found = demResolutions();
if (![20, 40, 80, 240].every((r) => found.includes(r)) || !existsSync(`${PUBLISHED}AVGVISIB_85S_060M_201608.IMG`)) {
  console.error('Fine grids or published maps missing. Run: npm run fetch-data -- --hires --validation');
  process.exit(1);
}

// ---------- published maps ----------
const MAP = { size: 5058, scaleKm: 0.06, dnToShare: 0.00004 }; // from the products' .LBL
function readMap(name) {
  const bytes = MAP.size * MAP.size * 2;
  const data = new Int16Array(MAP.size * MAP.size);
  const fd = openSync(`${PUBLISHED}${name}.IMG`, 'r');
  readSync(fd, new Uint8Array(data.buffer), 0, bytes, 0);
  closeSync(fd);
  return data;
}
/** Published value at the pixel under a point, and the range over the 3x3 pixels around it. Null outside the map. */
function published(map, lat, lon) {
  const [x, y] = latLonToXY(lat, lon);
  const centre = (MAP.size - 1) / 2;
  const col = Math.round(x / MAP.scaleKm + centre);
  const row = Math.round(centre - y / MAP.scaleKm);
  if (col < 1 || row < 1 || col > MAP.size - 2 || row > MAP.size - 2) return null;
  const at = (r, c) => map[r * MAP.size + c] * MAP.dnToShare;
  let lo = 1;
  let hi = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      lo = Math.min(lo, at(row + dr, col + dc));
      hi = Math.max(hi, at(row + dr, col + dc));
    }
  }
  return { value: at(row, col), lo, hi };
}

// ---------- LUMINA over long periods ----------
const T0 = Date.UTC(2017, 0, 1);
const N20 = Math.round((Date.UTC(2037, 0, 1) - T0) / HOUR); // Glaeser et al. 2018: 2017-01-01 to 2037-01-01, hourly
const N186 = Math.round((18.6 * 365.25 * DAY) / HOUR); // one lunar precession cycle, as in the NASA maps
console.error(`Ephemeris for ${N20} hourly instants...`);
const frames = computeFrameSeries({ t0: T0, stepMs: HOUR, n: N20 });

/** Long-period statistics of one point: shares are 0..1, the longest shadow in hours. */
function longStats(lat, lon, mastM, n, horizon = computeHorizon(lat, lon, mastM)) {
  const s = siteSeries(lat, lon, horizon, frames);
  let sunAny = 0;
  let sunMean = 0;
  let earthAny = 0;
  let earthLink = 0;
  let run = 0;
  let longest = 0;
  for (let i = 0; i < n; i++) {
    sunMean += s.sunFrac[i];
    if (s.sunFrac[i] > 0) {
      sunAny++;
      run = 0;
    } else if (++run > longest) longest = run;
    if (s.earthFrac[i] > 0) earthAny++;
    if (s.earthFrac[i] >= 0.5) earthLink++;
  }
  return { sunAny: sunAny / n, sunMean: sunMean / n, earthAny: earthAny / n, earthLink: earthLink / n, shadowH: longest };
}

/** The best solar visibility on a 5x5 grid of points 20 m apart around the point (the published maxima are 20 to 40 m wide). */
function bestNearby(lat, lon, mastM, n) {
  const [x0, y0] = latLonToXY(lat, lon);
  let best = null;
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      const [la, lo] = xyToLatLon(x0 + i * 0.02, y0 + j * 0.02);
      const st = longStats(la, lo, mastM, n);
      if (!best || st.sunAny > best.sunAny) best = st;
    }
  }
  return best;
}

const p1 = (x) => (x * 100).toFixed(1);
const signed = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(1)}`;
// Every line is written twice: `out(spanish, english)`. Lines that carry only numbers or table rules
// are the same in both. The file holds the English half first and the Spanish half below.
const lines = [];
const linesEn = [];
const out = (es = '', en = es) => {
  lines.push(es);
  linesEn.push(en);
};

out('# Salida de `npm run validate`', '# Output of `npm run validate`');
out();
out(
  'Archivo generado por [validate-illumination.mjs](../scripts/validate-illumination.mjs). No se edita a mano; la interpretación está en [VALIDACION.md](VALIDACION.md).',
  'File generated by [validate-illumination.mjs](../scripts/validate-illumination.mjs). It is not edited by hand; the interpretation is in [VALIDACION.md](VALIDACION.md).',
);
out();
out(`- Terreno: mallas LOLA de ${found.join(', ')} m.`, `- Terrain: LOLA grids of ${found.join(', ')} m.`);
out(`- Efemérides: ${N20} instantes, uno por hora, desde el 1 de enero de 2017.`, `- Ephemeris: ${N20} instants, one per hour, from 1 January 2017.`);
out(
  '- Los porcentajes son de tiempo. "Dif." es LUMINA menos el valor publicado, en puntos porcentuales.',
  '- Percentages are of time. "Diff." is LUMINA minus the published value, in percentage points.',
);
out();

// ---------- 1. NASA maps ----------
console.error('1. NASA maps...');
const sunMap = readMap('AVGVISIB_85S_060M_201608');
const earthMap = readMap('AVGVISIB_85S_060M_201608_EARTH');
out('## 1. Mapas de NASA (18.6 años, a ras de suelo)', '## 1. NASA maps (18.6 years, at ground level)');
out();
out(
  'Publicado: productos `AVGVISIB_85S_060M_201608` y `AVGVISIB_85S_060M_201608_EARTH` del equipo LOLA, con terreno de 60 m. Dan la parte del tiempo en que se ve cualquier fracción del disco. LUMINA: mismo criterio, altura 0 m, 18.6 años desde 2017, con las mallas finas y, aparte, solo con la de 240 m. Entre paréntesis, el rango publicado en los 3 × 3 píxeles alrededor del punto (±60 m).',
  'Published: products `AVGVISIB_85S_060M_201608` and `AVGVISIB_85S_060M_201608_EARTH` by the LOLA team, on 60 m terrain. They give the share of time in which any fraction of the disc is seen. LUMINA: same criterion, height 0 m, 18.6 years from 2017, with the fine grids and, separately, with the 240 m one alone. In brackets, the published range over the 3 × 3 pixels around the point (±60 m).',
);
out();
out(
  '| Sitio | Malla fina | Sol NASA | Sol LUMINA | Dif. | Sol LUMINA, 240 m | Tierra NASA | Tierra LUMINA | Dif. | Tierra LUMINA, 240 m |',
  '| Site | Fine grid | Sun NASA | Sun LUMINA | Diff. | Sun LUMINA, 240 m | Earth NASA | Earth LUMINA | Diff. | Earth LUMINA, 240 m |',
);
out('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
const nasaRows = [];
for (const site of CATALOG) {
  const sun = published(sunMap, site.lat, site.lon);
  const earth = published(earthMap, site.lat, site.lon);
  if (!sun) continue;
  const st = longStats(site.lat, site.lon, 0, N186);
  const coarse = longStats(site.lat, site.lon, 0, N186, withCoarseOnly(() => computeHorizon(site.lat, site.lon, 0)));
  const res = computeHorizon(site.lat, site.lon, 0).resolutionM;
  const within = (v, p) => v >= p.lo - 0.01 && v <= p.hi + 0.01; // one point of tolerance
  nasaRows.push({
    sun: (st.sunAny - sun.value) * 100,
    earth: (st.earthAny - earth.value) * 100,
    sunIn: within(st.sunAny, sun),
    earthIn: within(st.earthAny, earth),
    steady: sun.hi - sun.lo < 0.05 && earth.hi - earth.lo < 0.05,
  });
  const nasaRow = (to) =>
    `| ${site.name} | ${res} m | ${p1(sun.value)}% (${p1(sun.lo)} ${to} ${p1(sun.hi)}) | ${p1(st.sunAny)}% | ${signed((st.sunAny - sun.value) * 100)} | ${p1(coarse.sunAny)}% | ${p1(earth.value)}% (${p1(earth.lo)} ${to} ${p1(earth.hi)}) | ${p1(st.earthAny)}% | ${signed((st.earthAny - earth.value) * 100)} | ${p1(coarse.earthAny)}% |`;
  out(nasaRow('a'), nasaRow('to'));
}
const meanAbs = (a) => a.reduce((s, v) => s + Math.abs(v), 0) / a.length;
out();
out(
  `- Diferencia media en valor absoluto: Sol ${meanAbs(nasaRows.map((r) => r.sun)).toFixed(1)} puntos, Tierra ${meanAbs(nasaRows.map((r) => r.earth)).toFixed(1)} puntos, en ${nasaRows.length} sitios.`,
  `- Mean absolute difference: Sun ${meanAbs(nasaRows.map((r) => r.sun)).toFixed(1)} points, Earth ${meanAbs(nasaRows.map((r) => r.earth)).toFixed(1)} points, over ${nasaRows.length} sites.`,
);
const steady = nasaRows.filter((r) => r.steady);
out(
  `- En los ${steady.length} sitios donde el valor publicado cambia menos de 5 puntos a ±60 m: Sol ${meanAbs(steady.map((r) => r.sun)).toFixed(1)} puntos, Tierra ${meanAbs(steady.map((r) => r.earth)).toFixed(1)} puntos.`,
  `- At the ${steady.length} sites where the published value changes by under 5 points at ±60 m: Sun ${meanAbs(steady.map((r) => r.sun)).toFixed(1)} points, Earth ${meanAbs(steady.map((r) => r.earth)).toFixed(1)} points.`,
);
out(
  `- El valor de LUMINA cae dentro del rango publicado a ±60 m (con un punto de margen) en ${nasaRows.filter((r) => r.sunIn).length} de ${nasaRows.length} sitios para el Sol y en ${nasaRows.filter((r) => r.earthIn).length} de ${nasaRows.length} para la Tierra.`,
  `- LUMINA's value falls within the published range at ±60 m (with one point of tolerance) at ${nasaRows.filter((r) => r.sunIn).length} of ${nasaRows.length} sites for the Sun and at ${nasaRows.filter((r) => r.earthIn).length} of ${nasaRows.length} for Earth.`,
);
out();

// ---------- 2. Glaeser et al. 2018 ----------
console.error('2. Glaeser et al. 2018...');
// Tables 1 and 2 of Glaeser et al. (2018). Longitudes are east. `ill` is the average illumination
// (mean visible fraction of the solar disc), `vis` the solar visibility (any part of the Sun), both in %,
// `shadow` the longest time in shadow in hours. The Mazarico rows are the values that Table 1 quotes.
const SPOTS = [
  { name: 'Connecting Ridge C1', ref: 'Gläser 2018, tabla 1 (20 m)', lat: -89.4505, lon: 222.84, mast: 0, ill: 76.0, vis: 81.3, shadow: 268 },
  { name: 'Connecting Ridge C1', ref: 'Mazarico 2011 (240 m)', lat: -89.45, lon: 222.69, mast: 0, ill: 89.0, vis: 92.7, shadow: 141.12 },
  { name: 'Connecting Ridge C2', ref: 'Gläser 2018, tabla 1 (20 m)', lat: -89.3157, lon: 245.94, mast: 0, ill: 75.6, vis: 80.6, shadow: 166 },
  { name: 'Shackleton', ref: 'Gläser 2018, tabla 1 (20 m)', lat: -89.7849, lon: 203.97, mast: 0, ill: 81.0, vis: 85.5, shadow: 221 },
  { name: 'Shackleton', ref: 'Mazarico 2011 (240 m)', lat: -89.78, lon: 204.27, mast: 0, ill: 86.7, vis: 90.5, shadow: null },
  { name: 'Connecting Ridge C1', ref: 'Gläser 2018, tabla 2 (20 m)', lat: -89.4398, lon: 222.83, mast: 2, ill: 88.0, vis: 92.1, shadow: 112 },
  { name: 'Connecting Ridge C2', ref: 'Gläser 2018, tabla 2 (20 m)', lat: -89.313, lon: 245.98, mast: 2, ill: 78.1, vis: 82.0, shadow: 165 },
  { name: 'Shackleton (a)', ref: 'Gläser 2018, tabla 2 (20 m)', lat: -89.6866, lon: 197.19, mast: 2, ill: 85.5, vis: 89.4, shadow: 66 },
  { name: 'Shackleton (b)', ref: 'Gläser 2018, tabla 2 (20 m)', lat: -89.7815, lon: 204.7, mast: 2, ill: 82.1, vis: 89.8, shadow: 65 },
];
out('## 2. Puntos más iluminados del polo sur (20 años)', '## 2. Most illuminated points of the south pole (20 years)');
out();
out(
  'Publicado: Gläser et al. (2018), tablas 1 y 2, del 1 de enero de 2017 al 1 de enero de 2037, cada hora, con un modelo de terreno propio de 20 m. Las filas de Mazarico et al. (2011) son las que cita esa tabla 1. LUMINA: mismo periodo y paso, en las coordenadas publicadas, con las mallas LOLA del PDS. "Mejor a 40 m" es el punto con más visibilidad solar en una malla de 5 × 5 puntos separados 20 m.',
  'Published: Gläser et al. (2018), tables 1 and 2, from 1 January 2017 to 1 January 2037, every hour, with their own 20 m terrain model. The Mazarico et al. (2011) rows are the ones that table 1 quotes. LUMINA: same period and step, at the published coordinates, with the LOLA grids from the PDS. "Best within 40 m" is the point with the most solar visibility on a grid of 5 × 5 points 20 m apart.',
);
out();
out(
  '| Sitio | Fuente | Altura | Magnitud | Publicado | LUMINA en el punto | Dif. | LUMINA, mejor a 40 m | Dif. |',
  '| Site | Source | Height | Quantity | Published | LUMINA at the point | Diff. | LUMINA, best within 40 m | Diff. |',
);
out('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const s of SPOTS) {
  const here = longStats(s.lat, s.lon, s.mast, N20);
  const near = bestNearby(s.lat, s.lon, s.mast, N20);
  const head = `| ${s.name} | ${s.ref} | ${s.mast} m |`;
  const headEn = `| ${s.name} | ${s.ref.replace('tabla', 'table')} | ${s.mast} m |`;
  const vis = `| ${s.vis.toFixed(1)}% | ${p1(here.sunAny)}% | ${signed(here.sunAny * 100 - s.vis)} | ${p1(near.sunAny)}% | ${signed(near.sunAny * 100 - s.vis)} |`;
  const ill = `| ${s.ill.toFixed(1)}% | ${p1(here.sunMean)}% | ${signed(here.sunMean * 100 - s.ill)} | ${p1(near.sunMean)}% | ${signed(near.sunMean * 100 - s.ill)} |`;
  out(`${head} Visibilidad solar ${vis}`, `${headEn} Solar visibility ${vis}`);
  out(`${head} Iluminación media ${ill}`, `${headEn} Average illumination ${ill}`);
  if (s.shadow !== null) {
    const shadow = `| ${Math.round(s.shadow)} h | ${here.shadowH} h | ${signed(here.shadowH - s.shadow)} h | ${near.shadowH} h | ${signed(near.shadowH - s.shadow)} h |`;
    out(`${head} Sombra más larga ${shadow}`, `${headEn} Longest shadow ${shadow}`);
  }
}
out();
out(
  'Las coordenadas de Mazarico et al. (2011) tienen dos decimales (unos 300 m en latitud). Lo que da el mapa de NASA de 60 m en esos mismos puntos:',
  'The coordinates of Mazarico et al. (2011) have two decimals (about 300 m in latitude). What the NASA 60 m map gives at those same points:',
);
out();
out('| Punto | Sol, mapa de NASA en el píxel | Rango a ±60 m |', '| Point | Sun, NASA map at the pixel | Range at ±60 m |');
out('| --- | --- | --- |');
for (const s of SPOTS.filter((it) => it.ref.startsWith('Mazarico'))) {
  const p = published(sunMap, s.lat, s.lon);
  out(`| ${s.name}, ${-s.lat}°S ${s.lon}°E | ${p1(p.value)}% | ${p1(p.lo)}% a ${p1(p.hi)}% |`, `| ${s.name}, ${-s.lat}°S ${s.lon}°E | ${p1(p.value)}% | ${p1(p.lo)}% to ${p1(p.hi)}% |`);
}
out();
{
  // Glaeser et al. (2014), Icarus 243: 92.27% at 2 m and 95.65% at 10 m on Connecting Ridge, 19-year study.
  const at2 = bestNearby(-89.4398, 222.83, 2, N20);
  const at10 = bestNearby(-89.4398, 222.83, 10, N20);
  out(
    'Gläser et al. (2014) dan para Connecting Ridge 92.27% de visibilidad solar a 2 m y 95.65% a 10 m, con periodos de oscuridad de 3 a 5 días. LUMINA, en el mejor punto a 40 m de C1:',
    'Gläser et al. (2014) give for Connecting Ridge 92.27% solar visibility at 2 m and 95.65% at 10 m, with periods of darkness of 3 to 5 days. LUMINA, at the best point within 40 m of C1:',
  );
  out();
  out('| Altura | Publicado | LUMINA | Dif. | Sombra más larga LUMINA |', '| Height | Published | LUMINA | Diff. | Longest shadow LUMINA |');
  out('| --- | --- | --- | --- | --- |');
  const row2 = `| 2 m | 92.27% | ${p1(at2.sunAny)}% | ${signed(at2.sunAny * 100 - 92.27)} | ${(at2.shadowH / 24).toFixed(1)}`;
  const row10 = `| 10 m | 95.65% | ${p1(at10.sunAny)}% | ${signed(at10.sunAny * 100 - 95.65)} | ${(at10.shadowH / 24).toFixed(1)}`;
  out(`${row2} días |`, `${row2} days |`);
  out(`${row10} días |`, `${row10} days |`);
  out();
}

// ---------- 3. what the fine grids change ----------
console.error('3. Fine grids against 240 m...');
const LANDING = Date.UTC(2026, 10, 14);
const mission = computeFrameSeries({ t0: LANDING, stepMs: HOUR / 2, n: 30 * 48 + 1 });
const year = computeFrameSeries({ t0: LANDING, stepMs: 2 * HOUR, n: 365 * 12 + 1 });
out('## 3. Qué cambia el terreno fino', '## 3. What the fine terrain changes');
out();
out(
  'Mástil de 2 m, con los criterios de la app (luz: al menos 2% del disco solar; enlace: al menos 50% del disco de la Tierra). "Misión": 30 días desde el 14 de noviembre de 2026. "Año": los 365 días siguientes a esa fecha.',
  '2 m mast, with the app\'s criteria (sunlight: at least 2% of the solar disc; link: at least 50% of Earth\'s disc). "Mission": 30 days from 14 November 2026. "Year": the 365 days after that date.',
);
out();
out(
  '| Sitio | Malla fina | Luz misión, 240 m | Luz misión, fina | Enlace misión, 240 m | Enlace misión, fina | Luz año, 240 m | Luz año, fina | Enlace año, 240 m | Enlace año, fina |',
  '| Site | Fine grid | Sunlight mission, 240 m | Sunlight mission, fine | Link mission, 240 m | Link mission, fine | Sunlight year, 240 m | Sunlight year, fine | Link year, 240 m | Link year, fine |',
);
out('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
const pct0 = (x) => `${Math.round(x * 100)}%`;
for (const id of ['ridge', 'shackleton-rim', 'de-gerlache-rim', 'malapert', 'haworth', 'nobile', 'mouton-viper', 'shackleton-floor']) {
  const site = CATALOG.find((s) => s.id === id);
  const fine = computeHorizon(site.lat, site.lon, 2);
  const coarse = withCoarseOnly(() => computeHorizon(site.lat, site.lon, 2));
  const m = (h, f) => metrics(siteSeries(site.lat, site.lon, h, f));
  const [mc, mf, yc, yf] = [m(coarse, mission), m(fine, mission), m(coarse, year), m(fine, year)];
  out(
    `| ${site.name} | ${fine.resolutionM} m | ${pct0(mc.sunShare)} | ${pct0(mf.sunShare)} | ${pct0(mc.earthShare)} | ${pct0(mf.earthShare)} | ${pct0(yc.sunShare)} | ${pct0(yf.sunShare)} | ${pct0(yc.earthShare)} | ${pct0(yf.earthShare)} |`,
  );
}
out();

const document = [
  '<a id="en"></a>',
  '**English** | [Español](#es)',
  '',
  linesEn.join('\n').trim(),
  '',
  '---',
  '',
  '<a id="es"></a>',
  '**Español** | [English](#en)',
  '',
  lines.join('\n').trim(),
  '',
].join('\n');
writeFileSync(OUT, document);
console.log(document);

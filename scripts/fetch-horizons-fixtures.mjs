// Downloads reference Sun/Earth azimuth & elevation from NASA/JPL Horizons
// (DE441, MEAN_ME lunar frame, airless) for a set of lunar surface sites.
// The result is the ground truth used by tests/ephemeris.test.ts.
import { writeFileSync } from 'node:fs';

const SITES = [
  { name: 'Connecting Ridge', lat: -89.45, lon: 222.69 },
  { name: 'Malapert Massif', lat: -85.99, lon: -2.93 },
  { name: 'IM-2 Mons Mouton', lat: -84.79, lon: 29.2 },
  { name: 'Apollo 11', lat: 0.67416, lon: 23.47314 },
  { name: "Chang'e 4", lat: -45.4446, lon: 177.5991 },
];
const BODIES = { sun: '10', earth: '399' };
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

async function query(site, command) {
  const lonE = ((site.lon % 360) + 360) % 360;
  const params = {
    format: 'text',
    COMMAND: `'${command}'`,
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: "'coord@301'",
    COORD_TYPE: 'GEODETIC',
    SITE_COORD: `'${lonE},${site.lat},0'`,
    START_TIME: "'2026-11-01 00:00'",
    STOP_TIME: "'2027-12-01 00:00'",
    STEP_SIZE: "'317 h'",
    QUANTITIES: "'4'",
    CSV_FORMAT: 'YES',
  };
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${qs}`);
  const text = await res.text();
  const body = text.split('$$SOE')[1]?.split('$$EOE')[0];
  if (!body) throw new Error(`Horizons error for ${site.name}:\n${text.slice(0, 2000)}`);
  return body
    .trim()
    .split('\n')
    .map((line) => {
      const cols = line.split(',').map((s) => s.trim());
      const m = cols[0].match(/(\d{4})-(\w{3})-(\d{2}) (\d{2}):(\d{2})/);
      const t = Date.UTC(+m[1], MONTHS[m[2]], +m[3], +m[4], +m[5]);
      return { t, az: parseFloat(cols[3]), el: parseFloat(cols[4]) };
    });
}

const out = [];
for (const site of SITES) {
  const entry = { ...site, samples: {} };
  for (const [body, command] of Object.entries(BODIES)) {
    entry.samples[body] = await query(site, command);
    console.log(site.name, body, entry.samples[body].length, 'samples');
  }
  out.push(entry);
}
writeFileSync(new URL('../tests/fixtures/horizons.json', import.meta.url), JSON.stringify(out));

// Downloads reference elevations of the Moon seen from the three Deep Space
// Network sites, from NASA/JPL Horizons (airless, so without refraction). They
// are the ground truth for tests/comms.test.ts (S09). Run once; the output is committed.
import { writeFileSync } from 'node:fs';

// Longitude east, latitude, altitude in km.
const STATIONS = [
  { name: 'Goldstone', lat: 35.43, lon: -116.89, altKm: 1.0 },
  { name: 'Madrid', lat: 40.43, lon: -4.25, altKm: 0.8 },
  { name: 'Canberra', lat: -35.4, lon: 148.98, altKm: 0.7 },
];
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

async function query(station) {
  const params = {
    format: 'text',
    COMMAND: "'301'",
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: "'coord@399'",
    COORD_TYPE: 'GEODETIC',
    SITE_COORD: `'${station.lon},${station.lat},${station.altKm}'`,
    START_TIME: "'2026-11-14 00:00'",
    STOP_TIME: "'2026-11-17 00:00'",
    STEP_SIZE: "'7 h'",
    QUANTITIES: "'4'",
    APPARENT: 'AIRLESS',
    CSV_FORMAT: 'YES',
  };
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const text = await (await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${qs}`)).text();
  const body = text.split('$$SOE')[1]?.split('$$EOE')[0];
  if (!body) throw new Error(`Horizons error for ${station.name}:\n${text.slice(0, 2000)}`);
  return body
    .trim()
    .split('\n')
    .map((line) => {
      const cols = line.split(',').map((s) => s.trim());
      const m = cols[0].match(/(\d{4})-(\w{3})-(\d{2}) (\d{2}):(\d{2})/);
      return { t: Date.UTC(+m[1], MONTHS[m[2]], +m[3], +m[4], +m[5]), az: parseFloat(cols[3]), el: parseFloat(cols[4]) };
    });
}

const out = [];
for (const station of STATIONS) {
  const samples = await query(station);
  console.log(station.name, samples.length, 'samples');
  out.push({ ...station, samples });
}
writeFileSync(new URL('../tests/fixtures/stations.json', import.meta.url), JSON.stringify(out, null, 1));

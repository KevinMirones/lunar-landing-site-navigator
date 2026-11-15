// S10: CSV exports.
import { describe, expect, it } from 'vitest';
import { DEFAULT_COMMS, analyzeComms } from '../src/lib/comms';
import { comparisonCsv, exportName, windowsCsv, type ExportRow } from '../src/lib/export';
import { DEFAULT_POWER, analyzePower } from '../src/lib/power';
import { analyzeScenario, gridFor, type Scenario } from '../src/lib/scenario';
import { frameSeries, metrics, type Horizon } from '../src/lib/series';

const T0 = Date.UTC(2026, 10, 14);
const smoothMoon: Horizon = { model: 'sphere', siteElevationM: 0, mastM: 2, nAz: 360, elevationDeg: new Array(360).fill(-0.087), distanceKm: new Array(360).fill(0) };
const sites = [
  { name: 'Apollo 11', lat: 0.67416, lon: 23.47314 },
  { name: 'Malapert; "cima"', lat: -85.96703, lon: -2.2392 },
];

function rows(withExtras = false): ExportRow[] {
  return sites.map((site, i) => {
    const scenario: Scenario = { id: `e${i + 1}`, siteId: 'x', landing: i ? Date.UTC(2026, 2, 1) : T0, durationDays: i ? 14 : 30, mast: 2 };
    const { series } = analyzeScenario(scenario, site, smoothMoon);
    const m = metrics(series);
    return {
      scenario,
      site,
      metrics: m,
      power: withExtras ? analyzePower(series, frameSeries(gridFor(scenario)), DEFAULT_POWER) : null,
      contact: withExtras ? analyzeComms(series, m, { ...DEFAULT_COMMS, network: 'dsn' }) : null,
    };
  });
}

const parse = (csv: string, sep: string) =>
  csv
    .replace(/^﻿/, '')
    .trim()
    .split('\r\n')
    .map((line) => line.match(new RegExp(`("([^"]|"")*"|[^${sep}]*)(${sep}|$)`, 'g'))!.filter((c) => c !== '').map((c) => c.replace(new RegExp(`${sep}$`), '').replace(/^"|"$/g, '').replace(/""/g, '"')));

describe('windows CSV', () => {
  it('starts with a UTF-8 byte order mark and the columns of the spec', () => {
    const csv = windowsCsv(rows(), 'es');
    expect(csv.startsWith('﻿')).toBe(true);
    expect(parse(csv, ';')[0]).toEqual(['escenario', 'sitio', 'latitud', 'longitud', 'alunizaje_utc', 'duracion_d', 'mastil_m', 'evento', 'inicio_utc', 'fin_utc', 'duracion_h', 'estacion']);
  });

  it('uses ";" and a decimal comma in Spanish, "," and a point in English', () => {
    const es = parse(windowsCsv(rows(), 'es'), ';');
    const en = parse(windowsCsv(rows(), 'en'), ',');
    expect(es[1][2]).toBe('0,67416');
    expect(en[1][2]).toBe('0.67416');
    expect(en[0][7]).toBe('event');
  });

  it('quotes a name that holds the separator or quotes', () => {
    const csv = windowsCsv(rows(), 'es');
    expect(csv).toContain('"Malapert; ""cima"""');
    expect(parse(csv, ';').find((r) => r[0] === '2')![1]).toBe('Malapert; "cima"');
  });

  it('adds up sunlight hours to the share in the table (criterion 2)', () => {
    const data = rows();
    const lines = parse(windowsCsv(data, 'en'), ',');
    data.forEach((r, k) => {
      const hours = lines.filter((l) => l[0] === String(k + 1) && l[7] === 'sunlight').reduce((s, l) => s + Number(l[10]), 0);
      expect(Math.abs((hours * 3600e3) / r.metrics.spanMs - r.metrics.sunShare)).toBeLessThan(0.01);
    });
  });

  it('lists contact by station and eclipses when they exist', () => {
    const lines = parse(windowsCsv(rows(true), 'en'), ',');
    const contact = lines.filter((l) => l[7] === 'contact');
    expect(contact.length).toBeGreaterThan(0);
    expect(new Set(contact.map((l) => l[11]))).toEqual(new Set(['Goldstone', 'Madrid (Robledo)', 'Canberra (Tidbinbilla)']));
    expect(lines.filter((l) => l[7] === 'eclipse')).toHaveLength(1); // 3 March 2026, in the second scenario
  });

  it('writes times in ISO 8601, UTC', () => {
    const line = parse(windowsCsv(rows(), 'en'), ',')[1];
    expect(line[4]).toBe('2026-11-14T00:00Z');
    expect(line[8]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/);
  });
});

describe('comparison CSV', () => {
  it('has one row per scenario with the figures of the table (criterion 3)', () => {
    const data = rows(true);
    const lines = parse(comparisonCsv(data, 'en'), ',');
    expect(lines).toHaveLength(1 + data.length);
    data.forEach((r, k) => {
      const l = lines[k + 1];
      expect(Number(l[7])).toBe(Math.round(r.metrics.sunShare * 100));
      expect(Number(l[9])).toBe(Math.round(r.metrics.earthShare * 100));
      expect(Number(l[11])).toBe(r.metrics.score);
      expect(Number(l[12])).toBe(Math.round(r.power!.minBatteryWh));
      expect(l[13]).toBe(r.power!.survives ? 'yes' : 'no');
    });
  });

  it('leaves power and contact empty when they are not computed', () => {
    const apollo = comparisonCsv(rows(), 'es').split('\r\n')[1].split(';'); // Apollo 11: no quoted cells
    expect(apollo).toHaveLength(15);
    expect(apollo.slice(-3)).toEqual(['', '', '']);
  });
});

it('names the files after the export and the day', () => {
  expect(exportName('windows', 'es', Date.UTC(2026, 10, 15))).toBe('lumina-ventanas-2026-11-15.csv');
  expect(exportName('comparison', 'en', Date.UTC(2026, 10, 15))).toBe('lumina-comparison-2026-11-15.csv');
});

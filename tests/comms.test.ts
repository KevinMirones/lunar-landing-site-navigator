// S09: contact windows with an elevation margin and ground stations (docs/specs/S09-ventanas-de-contacto.md).
import { describe, expect, it } from 'vitest';
import { DEFAULT_COMMS, DSN, analyzeComms, decodeComms, elevations, encodeComms, moonElevation, type CommsConfig } from '../src/lib/comms';
import { analyzeScenario, gridFor, type Scenario } from '../src/lib/scenario';
import { frameSeries, horizonAt, metrics, siteSeries, type Horizon } from '../src/lib/series';
import stations from './fixtures/stations.json';

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 10, 14);
const smoothMoon: Horizon = { model: 'sphere', siteElevationM: 0, mastM: 2, nAz: 360, elevationDeg: new Array(360).fill(-0.087), distanceKm: new Array(360).fill(0) };
// A ridge to the north-east that the Earth has to clear at a polar site.
const jagged: Horizon = { ...smoothMoon, model: 'lola', elevationDeg: Array.from({ length: 360 }, (_, i) => 1.5 + 1.2 * Math.sin((i * Math.PI) / 45)) };
const apollo11 = { lat: 0.67416, lon: 23.47314 };
const malapert = { lat: -85.96703, lon: -2.2392 };
const scenario = (over: Partial<Scenario> = {}): Scenario => ({ id: 'e1', siteId: 'x', landing: T0, durationDays: 30, mast: 2, ...over });
const config = (over: Partial<CommsConfig>): CommsConfig => ({ ...DEFAULT_COMMS, ...over });

describe('elevation margin', () => {
  it('with no margin the series is exactly the one of before (criterion 1)', () => {
    const fs = frameSeries(gridFor(scenario()));
    const before = siteSeries(malapert.lat, malapert.lon, jagged, fs);
    const zero = siteSeries(malapert.lat, malapert.lon, jagged, fs, 0);
    expect(Array.from(zero.earthFrac)).toEqual(Array.from(before.earthFrac));
    expect(Array.from(zero.sunFrac)).toEqual(Array.from(before.sunFrac));
  });

  it('a higher margin never gives more link time (criterion 2)', () => {
    for (const [site, horizon] of [[malapert, jagged], [apollo11, smoothMoon]] as const) {
      const fs = frameSeries(gridFor(scenario()));
      const shares = [0, 2, 5].map((m) => metrics(siteSeries(site.lat, site.lon, horizon, fs, m)).earthShare);
      expect(shares[1]).toBeLessThanOrEqual(shares[0]);
      expect(shares[2]).toBeLessThanOrEqual(shares[1]);
    }
  });

  it('leaves the Sun alone', () => {
    const fs = frameSeries(gridFor(scenario()));
    expect(Array.from(siteSeries(malapert.lat, malapert.lon, jagged, fs, 5).sunFrac)).toEqual(Array.from(siteSeries(malapert.lat, malapert.lon, jagged, fs).sunFrac));
  });

  it('with 2° the link goes exactly when Earth is less than 2° above the terrain (criterion 3)', () => {
    const fs = frameSeries(gridFor(scenario()));
    const s = siteSeries(malapert.lat, malapert.lon, jagged, fs, 2);
    const clear = Array.from({ length: s.n }, (_, i) => s.earthEl[i] - horizonAt(jagged, s.earthAz[i]) > 2);
    let changes = 0;
    for (let i = 0; i < s.n; i++) {
      if (s.earthFrac[i] > 0.5 === clear[i]) continue;
      // Any disagreement must sit right at a crossing, within one step.
      const nearCrossing = clear[i - 1] !== clear[i] || clear[i + 1] !== clear[i];
      expect(nearCrossing).toBe(true);
    }
    for (let i = 1; i < s.n; i++) if (clear[i] !== clear[i - 1]) changes++;
    expect(changes).toBeGreaterThanOrEqual(2); // the test site really crosses the margin, up and down
  });

  it('is part of the analysis key, so a cached analysis is not reused with another margin', async () => {
    const { analysisKey } = await import('../src/lib/scenario');
    expect(analysisKey(scenario(), malapert, 2)).not.toBe(analysisKey(scenario(), malapert, 0));
  });
});

describe('ground stations', () => {
  it('the Moon seen from each DSN site matches JPL Horizons within 0.1° (criterion 5)', () => {
    let checked = 0;
    for (const ref of stations) {
      const station = DSN.find((s) => s.name.startsWith(ref.name))!;
      for (const sample of ref.samples) {
        expect(Math.abs(moonElevation(station, sample.t) - sample.el)).toBeLessThan(0.1);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(9);
  });

  it('the fast grid computation agrees with the full ephemeris within 0.01°', () => {
    const grid = { t0: T0, stepMs: 5 * HOUR, n: 60 };
    for (const st of DSN) {
      const fast = elevations(st, grid);
      for (let i = 0; i < grid.n; i++) expect(Math.abs(fast[i] - moonElevation(st, grid.t0 + i * grid.stepMs))).toBeLessThan(0.01);
    }
  });

  it('with no network there is no contact analysis: the app is as before', () => {
    const { series } = analyzeScenario(scenario(), apollo11, smoothMoon);
    expect(analyzeComms(series, metrics(series), config({ network: 'none' }))).toBeNull();
  });

  it('with the three DSN sites, contact is nearly all the link time', () => {
    const { series } = analyzeScenario(scenario(), apollo11, smoothMoon);
    const m = metrics(series);
    const c = analyzeComms(series, m, config({ network: 'dsn' }))!;
    expect(m.earthShare).toBe(1);
    expect(c.contactShare / m.earthShare).toBeGreaterThan(0.9);
    expect(c.byStation.map((b) => b.name)).toEqual(DSN.map((s) => s.name));
    // Hand-overs: every DSN site carries part of the month.
    for (const b of c.byStation) expect(b.intervals.length).toBeGreaterThan(0);
  });

  it('a single mid-latitude station gives 5 to 14 hours a day when the link lasts all day (criterion 4)', () => {
    const { series } = analyzeScenario(scenario(), apollo11, smoothMoon);
    const c = analyzeComms(series, metrics(series), config({ network: 'single', station: { lat: 40.43, lon: -4.25 } }))!;
    expect(c.contactHoursPerDay).toBeGreaterThan(5);
    expect(c.contactHoursPerDay).toBeLessThan(14);
    expect(c.longestGapMs).toBeGreaterThan(8 * HOUR);
    expect(c.longestGapMs).toBeLessThan(2 * DAY);
  });

  it('contact never exceeds the link', () => {
    const { series } = analyzeScenario(scenario(), malapert, jagged);
    const m = metrics(series);
    const c = analyzeComms(series, m, config({ network: 'dsn' }))!;
    expect(c.contactShare).toBeLessThanOrEqual(m.earthShare + 1e-9);
  });
});

describe('the link parameter', () => {
  it('reads the format of the spec and goes there and back', () => {
    expect(encodeComms(config({ marginDeg: 5, network: 'dsn' }))).toBe('5~dsn');
    expect(decodeComms('2~35.43,-116.89')).toEqual(config({ marginDeg: 2, network: 'single', station: { lat: 35.43, lon: -116.89 } }));
    for (const c of [DEFAULT_COMMS, config({ marginDeg: 2 }), config({ network: 'single', station: { lat: -35.4, lon: 148.98 } })]) expect(decodeComms(encodeComms(c))).toEqual(c);
  });
  it('rejects what it cannot read', () => {
    for (const bad of ['', '3~dsn', '2~nasa', '2~95,10', '2~10,200', 'x~none']) expect(decodeComms(bad)).toBeNull();
  });
});

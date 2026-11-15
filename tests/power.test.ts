// S08: power, battery and eclipses (docs/specs/S08-energia-y-bateria.md).
import { SearchLunarEclipse } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { DEFAULT_POWER, analyzePower, circleCover, decodePower, encodePower, type PowerConfig } from '../src/lib/power';
import { analyzeScenario, gridFor, type Scenario } from '../src/lib/scenario';
import { frameSeries, metrics, type Horizon } from '../src/lib/series';

const HOUR = 3600e3;
const T0 = Date.UTC(2026, 10, 14);
const smoothMoon: Horizon = { model: 'sphere', siteElevationM: 0, mastM: 2, nAz: 360, elevationDeg: new Array(360).fill(-0.087), distanceKm: new Array(360).fill(0) };
const apollo11 = { lat: 0.67416, lon: 23.47314 };
const ridge = { lat: -89.4398, lon: -137.17 };
const scenario = (over: Partial<Scenario> = {}): Scenario => ({ id: 'e1', siteId: 'x', landing: T0, durationDays: 30, mast: 2, ...over });

function run(site: { lat: number; lon: number }, sc: Scenario, config: Partial<PowerConfig> = {}) {
  const { series } = analyzeScenario(sc, site, smoothMoon);
  return { series, power: analyzePower(series, frameSeries(gridFor(sc)), { ...DEFAULT_POWER, ...config }) };
}

describe('the disc of the Sun covered by Earth', () => {
  it('is all or nothing when the discs are far apart or one holds the other', () => {
    expect(circleCover(0.25, 1, 2)).toBe(0);
    expect(circleCover(0.25, 1, 0.2)).toBe(1);
  });
  it('is half for two equal discs whose centres sit on each other’s edge, minus the lens', () => {
    // Two unit circles one radius apart overlap by 2π/3 − √3/2 of an area of π.
    expect(circleCover(1, 1, 1)).toBeCloseTo((2 * Math.PI) / 3 / Math.PI - Math.sqrt(3) / 2 / Math.PI, 6);
  });
});

describe('power', () => {
  it('a tracker in full Sun gives 1361 × efficiency × area, corrected for the distance to the Sun (criterion 1)', () => {
    const { series, power } = run(apollo11, scenario({ durationDays: 14 }));
    const frames = frameSeries(gridFor(scenario({ durationDays: 14 })));
    let checked = 0;
    for (let i = 0; i < series.n; i++) {
      if (series.sunFrac[i] < 1 || power.coverage[i] > 0) continue;
      const j = i * 3;
      const au = Math.hypot(frames.sun[j], frames.sun[j + 1], frames.sun[j + 2]) / 149597870.7;
      const expected = (1361 / au ** 2) * DEFAULT_POWER.efficiency * DEFAULT_POWER.areaM2;
      expect(power.powerW[i]).toBeCloseTo(expected, 1);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('the distance correction stays within 5% of the uncorrected figure over a year', () => {
    const flat = 1361 * DEFAULT_POWER.efficiency * DEFAULT_POWER.areaM2;
    for (let month = 0; month < 12; month++) {
      const sc = scenario({ landing: Date.UTC(2027, month, 1), durationDays: 14 });
      const { power } = run(apollo11, sc);
      expect(power.peakW / flat).toBeGreaterThan(0.95);
      expect(power.peakW / flat).toBeLessThan(1.05);
    }
  });

  it('a horizontal panel at Connecting Ridge gives under 5% of a tracker at the same instant (criterion 2)', () => {
    const sc = scenario();
    const tracker = run(ridge, sc).power;
    const horizontal = run(ridge, sc, { panel: 'horizontal' }).power;
    let compared = 0;
    for (let i = 0; i < tracker.powerW.length; i++) {
      if (tracker.powerW[i] < 100) continue;
      expect(horizontal.powerW[i] / tracker.powerW[i]).toBeLessThan(0.05);
      compared++;
    }
    expect(compared).toBeGreaterThan(100);
  });

  it('a tilted panel with no tilt is a horizontal panel (criterion 3)', () => {
    const sc = scenario({ durationDays: 14 });
    const horizontal = run(apollo11, sc, { panel: 'horizontal' }).power;
    const tilted = run(apollo11, sc, { panel: 'tilted', tiltDeg: 0, azimuthDeg: 123 }).power;
    for (let i = 0; i < horizontal.powerW.length; i++) expect(tilted.powerW[i]).toBeCloseTo(horizontal.powerW[i], 6);
  });

  it('no fixed panel beats a tracker', () => {
    const sc = scenario();
    const north = run(ridge, sc, { panel: 'tilted', tiltDeg: 90, azimuthDeg: 0 }).power.meanDailyWh;
    const tracker = run(ridge, sc).power.meanDailyWh;
    expect(north).toBeLessThanOrEqual(tracker + 1e-6);
    expect(north).toBeGreaterThan(0);
  });
});

describe('battery', () => {
  it('at Apollo 11 the minimum battery is the hibernation load times the hours of night (criterion 4)', () => {
    const sc = scenario({ durationDays: 30 });
    const { series, power } = run(apollo11, sc);
    const nightH = metrics(series).longestDarkMs / HOUR;
    expect(nightH).toBeGreaterThan(300);
    const expected = DEFAULT_POWER.hibernateW * nightH;
    expect(Math.abs(power.minBatteryWh - expected) / expected).toBeLessThan(0.02);
  });

  it('says whether the battery lasts, with its margin, and when it runs out if not', () => {
    // 60 days, so the Sun comes back within the mission after the night that drains the battery.
    const sc = scenario({ durationDays: 60 });
    const { power } = run(apollo11, sc);
    const big = run(apollo11, sc, { batteryWh: power.minBatteryWh * 1.4 }).power;
    expect(big.survives).toBe(true);
    expect(big.margin).toBeCloseTo(0.4, 6);
    expect(big.depletedAt).toBeNull();
    const small = run(apollo11, sc, { batteryWh: power.minBatteryWh * 0.5 }).power;
    expect(small.survives).toBe(false);
    expect(small.depletedAt).not.toBeNull();
    expect(small.depletedAt!).toBeGreaterThan(sc.landing);
    expect(small.nextSunAt).not.toBeNull();
    expect(small.nextSunAt!).toBeGreaterThan(small.depletedAt!);
  });

  it('needs no battery where the Sun never sets and the panel covers the load', () => {
    const { power } = run({ lat: -89.9, lon: 0 }, scenario({ durationDays: 14 }));
    expect(power.minBatteryWh).toBe(0);
    expect(power.survives).toBe(true);
  });
});

describe('eclipses seen from the Moon', () => {
  it('on 3 March 2026 Earth covers the whole Sun at Apollo 11, at the time astronomy-engine gives (criterion 5)', () => {
    const peak = SearchLunarEclipse(new Date(Date.UTC(2026, 2, 1))).peak.date.getTime();
    const sc = scenario({ landing: Date.UTC(2026, 2, 1), durationDays: 14 });
    const { power } = run(apollo11, sc);
    expect(power.eclipses).toHaveLength(1);
    const e = power.eclipses[0];
    expect(e.maxCover).toBeGreaterThan(0.999);
    expect(Math.abs(e.peakAt - peak)).toBeLessThan(30 * 60e3);
    expect(e.totalMs).toBeGreaterThan(30 * 60e3);
    // No power while the Sun is covered.
    const i = Math.round((e.peakAt - sc.landing) / gridFor(sc).stepMs);
    expect(power.powerW[i]).toBeLessThan(1);
  });

  it('finds none in a month without a lunar eclipse', () => {
    expect(run(apollo11, scenario({ landing: Date.UTC(2026, 5, 1), durationDays: 14 })).power.eclipses).toHaveLength(0);
  });
});

describe('leaves everything else as it was (criterion 8)', () => {
  it('does not touch the series the other figures come from', () => {
    const sc = scenario();
    const { series } = analyzeScenario(sc, ridge, smoothMoon);
    const before = Array.from(series.sunFrac);
    analyzePower(series, frameSeries(gridFor(sc)), { ...DEFAULT_POWER, panel: 'tilted', tiltDeg: 40 });
    expect(Array.from(series.sunFrac)).toEqual(before);
  });
});

describe('the link parameter', () => {
  it('goes there and back', () => {
    const configs: PowerConfig[] = [DEFAULT_POWER, { ...DEFAULT_POWER, panel: 'tilted', tiltDeg: 35, azimuthDeg: 180, areaM2: 4.5, efficiency: 0.3, batteryWh: 12000 }];
    for (const c of configs) expect(decodePower(encodePower(c))).toEqual(c);
  });
  it('reads the format of the spec', () => {
    expect(encodePower(DEFAULT_POWER)).toBe('tracker~2~28~200~25~3000');
    expect(decodePower('tilted:35:180~2~28~200~25~3000')).toEqual({ ...DEFAULT_POWER, panel: 'tilted', tiltDeg: 35, azimuthDeg: 180 });
  });
  it('rejects what it cannot read', () => {
    for (const bad of ['', 'sail~2~28~200~25~3000', 'tracker~2~28~200~25', 'tracker~-1~28~200~25~3000', 'tracker~2~0~200~25~3000', 'tilted:95:0~2~28~200~25~3000']) expect(decodePower(bad)).toBeNull();
  });
});

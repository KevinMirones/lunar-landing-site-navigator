// S05: which landing dates give the best mission at a site.
import { describe, expect, it } from 'vitest';
import { bestDates, frameSeries, metrics, siteSeries, windowScores, type Horizon, type WindowScores } from '../src/lib/series';

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 10, 1);
const YEAR = { t0: T0, stepMs: 2 * HOUR, n: (366 + 90) * 12 + 1 }; // the grid the app uses for the calendar

/** A polar-style horizon with relief, so sunlight and Earth come and go several times a month. */
const jagged: Horizon = {
  model: 'lola-240m',
  siteElevationM: 1500,
  mastM: 2,
  nAz: 360,
  elevationDeg: Array.from({ length: 360 }, (_, az) => 0.9 * Math.sin((az * Math.PI) / 30) + 1.2 * Math.sin((az * Math.PI) / 90)),
  distanceKm: new Array(360).fill(10),
};
const site = { lat: -88.6, lon: 40 };
const yearSeries = siteSeries(site.lat, site.lon, jagged, frameSeries(YEAR));

describe('scoring every possible landing day', () => {
  const scores = windowScores(yearSeries, 30);

  it('covers 366 landing days', () => {
    expect(scores.days).toBe(366);
    expect(scores.score).toHaveLength(366);
  });

  it('gives each day the same result as analysing that mission on its own', () => {
    for (const d of [0, 17, 45, 99, 150, 201, 256, 300, 333, 365]) {
      const own = metrics(siteSeries(site.lat, site.lon, jagged, frameSeries({ t0: T0 + d * DAY, stepMs: 2 * HOUR, n: 30 * 12 + 1 })));
      expect(scores.sunShare[d]).toBeCloseTo(own.sunShare, 4);
      expect(scores.earthShare[d]).toBeCloseTo(own.earthShare, 4);
      expect(scores.longestDarkH[d]).toBeCloseTo(own.longestDarkMs / HOUR, 2);
      expect(scores.score[d]).toBe(own.score);
    }
  });

  it('stays within one index point of the finer analysis the scenario table uses', () => {
    for (const d of [3, 60, 121, 190, 247, 310]) {
      const fine = metrics(siteSeries(site.lat, site.lon, jagged, frameSeries({ t0: T0 + d * DAY, stepMs: HOUR / 2, n: 30 * 48 + 1 })));
      expect(Math.abs(scores.score[d] - fine.score)).toBeLessThanOrEqual(1);
    }
  });

  it('records whether the Sun is up at the moment of landing', () => {
    let up = 0;
    for (let d = 0; d < scores.days; d++) {
      const expected = yearSeries.sunFrac[d * 12] > 0.02 ? 1 : 0;
      expect(scores.sunAtLanding[d]).toBe(expected);
      up += expected;
    }
    expect(up).toBeGreaterThan(0);
    expect(up).toBeLessThan(scores.days); // this horizon gives both day and night landings
  });

  it('follows the mission duration', () => {
    const long = windowScores(yearSeries, 90);
    expect(long.days).toBe(366);
    expect(Array.from(long.score)).not.toEqual(Array.from(scores.score));
  });

  it('only scores days whose whole mission fits in the data', () => {
    const short = siteSeries(site.lat, site.lon, jagged, frameSeries({ t0: T0, stepMs: 2 * HOUR, n: 40 * 12 + 1 }));
    expect(windowScores(short, 30).days).toBe(11); // days 0..10 can hold a 30-day mission in 40 days of data
  });

  it('scores a whole year in under 100 ms', () => {
    const run = () => {
      const t = performance.now();
      windowScores(yearSeries, 30);
      return performance.now() - t;
    };
    run();
    expect(Math.min(run(), run(), run())).toBeLessThan(100);
  });
});

describe('choosing the best landing dates', () => {
  const scores = windowScores(yearSeries, 30);

  it('returns five dates, best first', () => {
    const best = bestDates(scores);
    expect(best).toHaveLength(5);
    const values = best.map((d) => scores.score[d]);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  it('keeps them at least a week apart, so they are five options and not five days in a row', () => {
    const best = bestDates(scores).sort((a, b) => a - b);
    for (let i = 1; i < best.length; i++) expect(best[i] - best[i - 1]).toBeGreaterThanOrEqual(7);
  });

  it('by default proposes only dates with the Sun visible at landing', () => {
    for (const d of bestDates(scores)) expect(scores.sunAtLanding[d]).toBe(1);
  });

  it('can include night landings when asked to', () => {
    const fake: WindowScores = { ...scores, score: Float32Array.from(scores.score, (v, d) => (scores.sunAtLanding[d] ? v : 100)) };
    expect(bestDates(fake, { requireSun: false }).every((d) => fake.sunAtLanding[d] === 0)).toBe(true);
    expect(bestDates(fake).every((d) => fake.sunAtLanding[d] === 1)).toBe(true);
  });

  it('returns nothing when no date qualifies', () => {
    const night: WindowScores = { ...scores, sunAtLanding: new Uint8Array(scores.days) };
    expect(bestDates(night)).toEqual([]);
  });
});

// S05 on real terrain: the best landing dates at Connecting Ridge follow the lunar seasons.
import { describe, expect, it } from 'vitest';
import { demAvailable } from '../server/dem.js';
import { computeHorizon } from '../server/horizon.js';
import { moonFixedVectors, subPoint } from '../src/lib/ephemeris';
import { bestDates, frameSeries, siteSeries, windowScores } from '../src/lib/series';

const DAY = 86400e3;
const T0 = Date.UTC(2026, 10, 1);
const YEAR = { t0: T0, stepMs: 2 * 3600e3, n: (366 + 90) * 12 + 1 };

describe.skipIf(!demAvailable())('Connecting Ridge with real terrain', () => {
  const lat = -89.45;
  const lon = -137.31;
  const scores = windowScores(siteSeries(lat, lon, computeHorizon(lat, lon, 2), frameSeries(YEAR)), 30);

  // Southern winter solstice: the day the Sun stands furthest north of the lunar equator.
  // Found from the ephemeris alone, independently of the code under test (27 April 2027).
  let solstice = 0;
  let northmost = -Infinity;
  for (let d = 0; d < 366; d++) {
    const subSolarLat = subPoint(moonFixedVectors(new Date(T0 + d * DAY)).sun).lat;
    if (subSolarLat > northmost) {
      northmost = subSolarLat;
      solstice = d;
    }
  }

  it('places the winter solstice of this year in late April 2027', () => {
    expect(new Date(T0 + solstice * DAY).toISOString().slice(0, 7)).toBe('2027-04');
  });

  it('proposes landing dates with continuous sunlight, well away from the winter solstice', () => {
    const best = bestDates(scores);
    expect(best).toHaveLength(5);
    for (const d of best) {
      expect(scores.sunShare[d]).toBeGreaterThan(0.99);
      expect(Math.abs(d - solstice)).toBeGreaterThan(60);
    }
  });

  it('finds the worst landing day of the year around the winter solstice', () => {
    let worst = 0;
    for (let d = 1; d < scores.days; d++) if (scores.score[d] < scores.score[worst]) worst = d;
    expect(Math.abs(worst - solstice)).toBeLessThan(45);
    expect(scores.sunShare[worst]).toBeLessThan(0.5);
  });
});

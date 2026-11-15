// S17: checks on the real whole-Moon grid (LDEM_64). Skipped unless it is installed
// (npm run fetch-data -- --global).
import { describe, expect, it } from 'vitest';
import { demAvailable, withoutPolarGrids } from '../server/dem.js';
import { closeGlobalDem, disableGlobalDem, globalCacheStats, globalDemAvailable } from '../server/globalDem.js';
import { computeHorizon } from '../server/horizon.js';
import { buildPatch } from '../server/patch.js';
import { CATALOG } from '../src/lib/sites.ts';

const hasGlobal = globalDemAvailable();
const site = (id) => CATALOG.find((s) => s.id === id);
/** Highest horizon elevation between two azimuths (degrees, clockwise from north). */
const highest = (h, from, to) => {
  let best = -Infinity;
  for (let a = 0; a < h.nAz; a++) {
    const az = (a * 360) / h.nAz;
    const inside = from <= to ? az >= from && az <= to : az >= from || az <= to;
    if (inside) best = Math.max(best, h.elevationDeg[a]);
  }
  return best;
};

describe.skipIf(!hasGlobal)('whole-Moon terrain (LDEM_64)', () => {
  it('Apollo 15: Mons Hadley to the northeast and Hadley Delta to the south rise above 5 degrees (criterion 1)', () => {
    const a15 = site('apollo15');
    const h = computeHorizon(a15.lat, a15.lon, 2);
    expect(h.model).toBe('lola');
    expect(highest(h, 20, 70)).toBeGreaterThan(5);
    expect(highest(h, 150, 210)).toBeGreaterThan(5);
  });

  it('Apollo 17: the North and South Massifs rise above 5 degrees (criterion 2)', () => {
    const a17 = site('apollo17');
    const h = computeHorizon(a17.lat, a17.lon, 2);
    expect(highest(h, 330, 30)).toBeGreaterThan(5);
    expect(highest(h, 150, 210)).toBeGreaterThan(5);
  });

  it('Apollo 11: the Sea of Tranquillity stays below 3 degrees all round (criterion 3)', () => {
    const a11 = site('apollo11');
    expect(highest(computeHorizon(a11.lat, a11.lon, 2), 0, 360)).toBeLessThan(3);
  });

  it.skipIf(!demAvailable())('agrees with the polar grid where both exist, 77S to 79S (criterion 4)', () => {
    for (const [lat, lon] of [[-77.2, 10], [-77.8, 95], [-78.3, 170], [-78.6, -120], [-78.9, -40]]) {
      const both = computeHorizon(lat, lon, 2, 360); // polar grid near the site, whole-Moon grid beyond 75S
      const whole = withoutPolarGrids(() => computeHorizon(lat, lon, 2, 360));
      expect(both.resolutionM).toBe(240);
      expect(whole.resolutionM).toBe(474);
      const diffs = both.elevationDeg.map((e, i) => Math.abs(e - whole.elevationDeg[i])).sort((x, y) => x - y);
      expect(diffs[diffs.length >> 1]).toBeLessThan(0.5);
    }
  }, 60000);

  it('gives a point of your own terrain anywhere (criterion 5)', () => {
    const h = computeHorizon(10, 10, 2);
    expect(h.model).toBe('lola');
    expect(h.resolutionM).toBe(474);
    expect(buildPatch(10, 10, 64).resolutionM).toBe(474);
  });

  it.skipIf(!demAvailable())('leaves the polar catalogue sites as they were (criterion 9)', () => {
    const polar = CATALOG.filter((s) => s.lat <= -80);
    const withGlobal = polar.map((s) => ({ h: computeHorizon(s.lat, s.lon, 2), p: buildPatch(s.lat, s.lon, 64) }));
    disableGlobalDem();
    try {
      polar.forEach((s, i) => {
        const h = computeHorizon(s.lat, s.lon, 2);
        const worst = Math.max(...h.elevationDeg.map((e, a) => Math.abs(e - withGlobal[i].h.elevationDeg[a])));
        expect(worst, s.id).toBeLessThan(0.01);
        expect(buildPatch(s.lat, s.lon, 64).data, s.id).toEqual(withGlobal[i].p.data);
      });
    } finally {
      closeGlobalDem();
    }
  }, 60000);

  it('keeps under 64 MB of the grid in memory after every catalogue site outside the pole (criterion 10)', () => {
    for (const s of CATALOG.filter((x) => x.lat > -80)) computeHorizon(s.lat, s.lon, 2);
    expect(globalCacheStats().bytes).toBeLessThan(64 * 1024 * 1024);
  }, 60000); // these measure results and memory, not speed: a busy machine must not fail them
});

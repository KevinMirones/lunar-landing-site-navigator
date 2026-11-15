// S16: distance to the nearest permanently shadowed region.
import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PSR_FILE, nearestPsr, psrAvailable, psrCellOf, psrShadowAt } from '../server/psr.js';

describe.skipIf(!psrAvailable())('permanent shadow', () => {
  it('puts the floor of Shackleton in permanent shadow (criterion 1)', () => {
    expect(nearestPsr(-89.66, 129.2)).toMatchObject({ covered: true, inside: true, distanceKm: 0 });
  });

  it('gives Connecting Ridge, lit almost all the time, a distance to the nearest shadow (criterion 2)', () => {
    const r = nearestPsr(-89.4398, -137.17);
    expect(r.inside).toBe(false);
    expect(r.distanceKm).toBeGreaterThan(0);
    expect(r.distanceKm).toBeLessThan(20);
    expect(r.bearingDeg).toBeGreaterThanOrEqual(0);
    expect(r.bearingDeg).toBeLessThan(360);
  });

  it('finds the truly nearest shadowed cell: checked against an exhaustive scan at ten points (criterion 3)', () => {
    const points = [
      [-89.4398, -137.17], [-85.96703, -2.2392], [-84.79, 29.2], [-86.8, -22], [-88.67, -68],
      [-85.42, 31.6], [-87.3, 140.5], [-81.5, 60], [-83.2, -120.7], [-88.1, 10.4],
    ];
    for (const [lat, lon] of points) {
      const r = nearestPsr(lat, lon);
      if (r.inside) continue;
      expect(r.distanceKm, `${lat},${lon}`).not.toBeNull();
      const { row, col } = psrCellOf(lat, lon);
      const reach = Math.ceil(r.distanceKm / 0.12) + 3;
      let best = Infinity;
      for (let rr = Math.floor(row) - reach; rr <= Math.ceil(row) + reach; rr++)
        for (let cc = Math.floor(col) - reach; cc <= Math.ceil(col) + reach; cc++) if (psrShadowAt(rr, cc)) best = Math.min(best, Math.hypot(rr - row, cc - col));
      // The answer is great-circle distance; the scan is in map cells (0.12 km, within 1% near the pole).
      expect(Math.abs(best * 0.12 - r.distanceKm), `${lat},${lon}`).toBeLessThan(0.02 * r.distanceKm + 0.01);
    }
  });

  it('has no data outside 80°S to 90°S (criterion 4)', () => {
    expect(nearestPsr(0.67416, 23.47314)).toEqual({ covered: false, inside: false, distanceKm: null, bearingDeg: null });
  });

  it('keeps the mask small (criterion 6)', () => {
    expect(statSync(PSR_FILE).size).toBeLessThan(4 * 1024 * 1024);
  });

  it('answers quickly enough to give every cell of the point search a distance', () => {
    const t = performance.now();
    for (let i = 0; i < 200; i++) nearestPsr(-85.9 - i * 0.001, -2.2 + i * 0.002, 20);
    const ms = performance.now() - t;
    if (process.env.LUMINA_PERF === '1') expect(ms / 200).toBeLessThan(2); // npm run test:perf (S03)
  });
});

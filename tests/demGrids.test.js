// S06: nested elevation grids. Synthetic grids, so these tests need no download.
import { beforeAll, describe, expect, it } from 'vitest';
import { adoptDem, heightAtXY, resolutionAtXY, sharedDem } from '../server/dem.js';
import { computeHorizon } from '../server/horizon.js';

/** A square grid of half-metre DNs; `dnAt(xKm, yKm)` gives the value of each cell. */
function makeGrid(size, scaleKm, dnAt) {
  const buffer = new SharedArrayBuffer(size * size * 2);
  const data = new Int16Array(buffer);
  const centre = (size - 1) / 2;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) data[r * size + c] = dnAt((c - centre) * scaleKm, (centre - r) * scaleKm);
  }
  return { size, scaleKm, buffer };
}

describe('nested grids', () => {
  beforeAll(() => {
    adoptDem([
      makeGrid(401, 0.24, () => 100), // 50 m plain out to 48 km, given first on purpose
      makeGrid(201, 0.02, () => 200), // 100 m plateau out to 2 km
    ]);
  });

  it('reads the finest grid that contains the point', () => {
    expect(heightAtXY(0.5, -0.5)).toBeCloseTo(0.1, 6);
    expect(resolutionAtXY(0.5, -0.5)).toBe(20);
  });

  it('falls back to the coarser grid outside the fine one', () => {
    expect(heightAtXY(5, 5)).toBeCloseTo(0.05, 6);
    expect(resolutionAtXY(5, 5)).toBe(240);
  });

  it('has no height outside every grid', () => {
    expect(heightAtXY(60, 0)).toBeNaN();
    expect(resolutionAtXY(60, 0)).toBeNull();
  });

  it('hands every grid to the worker threads', () => {
    expect(sharedDem().map((g) => g.scaleKm)).toEqual([0.02, 0.24]);
  });
});

describe('horizon over fine terrain', () => {
  beforeAll(() => {
    // A wall 30 m high and 60 m thick, 300 m from the pole toward longitude 0.
    const wall = (x, y) => (Math.abs(y - 0.3) <= 0.03 && Math.abs(x) <= 0.5 ? 60 : 0);
    adoptDem([makeGrid(201, 0.02, wall), makeGrid(401, 0.24, () => 0)]);
  });

  it('sees a 30 m rise 300 m away, which lifts the horizon about 5 degrees', () => {
    const h = computeHorizon(-90, 0, 2);
    expect(h.elevationDeg[0]).toBeGreaterThan(4.5);
    expect(h.elevationDeg[0]).toBeLessThan(6.2);
    expect(h.distanceKm[0]).toBeGreaterThan(0.25);
    expect(h.distanceKm[0]).toBeLessThan(0.35);
    expect(h.elevationDeg[360]).toBeLessThan(0); // the opposite side stays open
  });

  it('reports the resolution of the terrain under the site', () => {
    const h = computeHorizon(-90, 0, 2);
    expect(h.model).toBe('lola');
    expect(h.resolutionM).toBe(20);
  });
});

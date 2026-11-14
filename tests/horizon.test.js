// Sanity checks of the terrain model against well-known south-pole geography.
import { describe, expect, it } from 'vitest';
import { demAvailable, heightAtLatLon } from '../server/dem.js';
import { computeHorizon, sphereDipDeg } from '../server/horizon.js';

const hasDem = demAvailable();

describe('smooth-sphere horizon', () => {
  it('dips below horizontal with observer height', () => {
    expect(sphereDipDeg(0)).toBeCloseTo(0, 6);
    expect(sphereDipDeg(0.002)).toBeCloseTo(-0.0869, 3); // 2 m mast
    expect(sphereDipDeg(0.1)).toBeLessThan(sphereDipDeg(0.002));
  });

  it('is used outside LOLA coverage', () => {
    const h = computeHorizon(0.67416, 23.47314, 2); // Apollo 11
    expect(h.model).toBe('sphere');
    expect(Math.max(...h.elevationDeg)).toBeCloseTo(-0.0869, 3);
  });
});

describe.skipIf(!hasDem)('LOLA south-pole terrain', () => {
  it('is oriented correctly (known craters are deep, known massifs are high)', () => {
    expect(heightAtLatLon(-89.66, 129.2)).toBeLessThan(-2); // Shackleton floor, km
    expect(heightAtLatLon(-88.1, 44.9)).toBeLessThan(-3); // Shoemaker floor
    expect(heightAtLatLon(-85.3, -42.1)).toBeLessThan(-3); // Cabeus floor
    expect(heightAtLatLon(-85.99, 0)).toBeGreaterThan(4); // Malapert massif
  });

  it('walls in the floor of Shackleton on every side', () => {
    const h = computeHorizon(-89.66, 129.2, 2);
    expect(h.model).toBe('lola-240m');
    expect(Math.min(...h.elevationDeg)).toBeGreaterThan(15);
  });

  it('gives a ridge crest a low, open horizon', () => {
    const h = computeHorizon(-89.45, -137.31, 2);
    expect(Math.max(...h.elevationDeg)).toBeLessThan(2);
    expect(Math.min(...h.elevationDeg)).toBeLessThan(-1); // looks down over lower ground
  });

  it('opens the horizon as the mast gets taller', () => {
    const low = computeHorizon(-89.45, -137.31, 2);
    const tall = computeHorizon(-89.45, -137.31, 50);
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
    expect(mean(tall.elevationDeg)).toBeLessThan(mean(low.elevationDeg));
  });
});

// S11: the geometry behind the 3D view, tested without a browser.
import { describe, expect, it } from 'vitest';
import type { Horizon, Sky } from '../src/lib/series';
import { clampPitch, exaggerateEl, farBlocker, heading, horizonRing, initialView, skyDir, wrapAz } from '../src/lib/terrain3d';

const horizon = (el: number[], dist: number[], mastM = 2): Horizon => ({
  model: 'lola',
  siteElevationM: 0,
  mastM,
  nAz: el.length,
  elevationDeg: el,
  distanceKm: dist,
});
const body = (az: number, el: number, horizonEl: number) => ({ az, el, radius: 0.27, frac: el > horizonEl ? 1 : 0, horizon: horizonEl, distKm: 1 });

describe('directions', () => {
  it('puts north ahead (-z), east to the right (+x) and up on +y', () => {
    const n = skyDir(0, 0);
    const e = skyDir(90, 0);
    const up = skyDir(0, 90);
    expect(n[2]).toBeCloseTo(-1, 9);
    expect(e[0]).toBeCloseTo(1, 9);
    expect(up[1]).toBeCloseTo(1, 9);
  });

  it('returns unit vectors', () => {
    const v = skyDir(123, 4.5, 3);
    expect(Math.hypot(...v)).toBeCloseTo(1, 9);
  });
});

describe('vertical exaggeration', () => {
  it('leaves angles alone at real scale', () => {
    for (const el of [-12, -1.3, 0, 0.7, 25]) expect(exaggerateEl(el, 1)).toBeCloseTo(el, 9);
  });

  it('roughly triples small angles at x3', () => {
    expect(exaggerateEl(1, 3)).toBeCloseTo(3, 1);
    expect(exaggerateEl(-2, 3)).toBeCloseTo(-6, 1);
  });

  it('keeps whatever was hidden hidden and whatever was visible visible', () => {
    // A ridge at 1.6 degrees, the Sun just above it and Earth just below.
    const ridge = 1.6;
    for (const k of [1, 3]) {
      expect(exaggerateEl(1.7, k)).toBeGreaterThan(exaggerateEl(ridge, k));
      expect(exaggerateEl(1.5, k)).toBeLessThan(exaggerateEl(ridge, k));
    }
  });

  it('matches the direction you get by stretching the scene vertically', () => {
    const k = 3;
    const real = skyDir(40, 2);
    const stretched = [real[0], real[1] * k, real[2]];
    const len = Math.hypot(...stretched);
    const shown = skyDir(40, 2, k);
    for (let i = 0; i < 3; i++) expect(shown[i]).toBeCloseTo(stretched[i] / len, 9);
  });
});

describe('camera', () => {
  it('wraps azimuths into 0..360', () => {
    expect(wrapAz(-10)).toBeCloseTo(350, 9);
    expect(wrapAz(370)).toBeCloseTo(10, 9);
  });

  it('keeps the pitch between -30 and +60 degrees', () => {
    expect(clampPitch(-80)).toBe(-30);
    expect(clampPitch(75)).toBe(60);
    expect(clampPitch(5)).toBe(5);
  });

  it('names the heading', () => {
    expect(heading(42, 'es')).toBe('NE 42°');
    expect(heading(270, 'es')).toBe('O 270°');
    expect(heading(270, 'en')).toBe('W 270°');
    expect(heading(359.6, 'en')).toBe('N 0°');
  });

  it('opens looking at the Sun', () => {
    const sky: Sky = { sun: body(126, 1.6, 0.4), earth: body(300, -4, 0) };
    expect(initialView(sky, 1)).toEqual({ yaw: 126, pitch: 1.6 });
  });

  it('looks at the ridge in front of a hidden Sun', () => {
    const sky: Sky = { sun: body(200, -3, 1.2), earth: body(300, -4, 0) };
    const v = initialView(sky, 3);
    expect(v.yaw).toBe(200);
    expect(v.pitch).toBeCloseTo(exaggerateEl(1.2, 3), 9);
  });
});

describe('far relief', () => {
  it('places each crest of the ring where the panorama sees it', () => {
    const h = horizon([1.5, -0.4, 3, 0.2], [80, 12, 40, 0], 10);
    const ring = horizonRing(h, 33);
    for (let i = 0; i < h.nAz; i++) {
      const [x, top, z] = [ring[i * 3], ring[i * 3 + 1], ring[i * 3 + 2]];
      const d = Math.hypot(x, z);
      const el = (Math.atan2(top - h.mastM, d) * 180) / Math.PI;
      expect(el).toBeCloseTo(h.elevationDeg[i] as number, 6);
      expect(d).toBeGreaterThanOrEqual(33000 - 1e-6);
    }
  });

  it('only stands in for terrain beyond the patch', () => {
    const h = horizon([1.5, 2, 0, 0], [80, 12, 0, 0], 2);
    const far = farBlocker(h, 0, 32);
    expect(far?.distM).toBe(80000);
    expect(far?.heightM).toBeCloseTo(2 + 80000 * Math.tan((1.5 * Math.PI) / 180), 6);
    expect(farBlocker(h, 90, 32)).toBeNull(); // the crest at 12 km is inside the patch
  });
});

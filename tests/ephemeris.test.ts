// Validates the in-browser ephemeris against NASA/JPL Horizons reference data.
import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/horizons.json';
import { moonFixedVectors, siteFrame, topocentric } from '../src/lib/ephemeris';

interface Sample {
  t: number;
  az: number;
  el: number;
}

function angularError(azA: number, elA: number, azB: number, elB: number): number {
  const d = Math.PI / 180;
  const c =
    Math.sin(elA * d) * Math.sin(elB * d) + Math.cos(elA * d) * Math.cos(elB * d) * Math.cos((azA - azB) * d);
  return Math.acos(Math.min(1, c)) / d;
}

describe('ephemeris vs JPL Horizons (DE441)', () => {
  const report: string[] = [];
  for (const site of fixtures as Array<{ name: string; lat: number; lon: number; samples: Record<string, Sample[]> }>) {
    for (const body of ['sun', 'earth'] as const) {
      it(`${site.name}: ${body} within 0.05 deg`, () => {
        const frame = siteFrame(site.lat, site.lon);
        let worst = 0;
        let worstEl = 0;
        for (const s of site.samples[body]) {
          const v = moonFixedVectors(new Date(s.t));
          const topo = topocentric(frame, v[body]);
          worst = Math.max(worst, angularError(topo.az, topo.el, s.az, s.el));
          worstEl = Math.max(worstEl, Math.abs(topo.el - s.el));
        }
        report.push(`${site.name} ${body}: max sky error ${worst.toFixed(4)} deg, max elevation error ${worstEl.toFixed(4)} deg`);
        console.log(report[report.length - 1]);
        expect(worst).toBeLessThan(0.05);
      });
    }
  }
});

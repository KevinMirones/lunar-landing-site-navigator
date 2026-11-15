// S07: every catalogue site says where its coordinates come from.
import { describe, expect, it } from 'vitest';
import { CATALOG, customSite, siteMatches } from '../src/lib/sites';

describe('site catalogue', () => {
  it('gives every site a source in both languages and a precision', () => {
    for (const site of CATALOG) {
      expect(site.source.es.length, site.id).toBeGreaterThan(3);
      expect(site.source.en.length, site.id).toBeGreaterThan(3);
      expect(['published', 'representative'], site.id).toContain(site.precision);
    }
  });

  it('does not present an Artemis region as a published landing point', () => {
    for (const site of CATALOG.filter((s) => s.tag.en.includes('Artemis'))) expect(site.precision, site.id).toBe('representative');
  });

  it('marks user-defined points as such', () => {
    expect(customSite(-88, 10, 1).precision).toBe('custom');
  });

  it('has unique ids', () => {
    expect(new Set(CATALOG.map((s) => s.id)).size).toBe(CATALOG.length);
  });
});

// S13: a larger catalogue, with programme, year and search.
describe('extended catalogue', () => {
  it('has at least 35 sites, all inside the coordinate ranges', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(35);
    for (const s of CATALOG) {
      expect(Math.abs(s.lat), s.id).toBeLessThanOrEqual(90);
      expect(Math.abs(s.lon), s.id).toBeLessThanOrEqual(180);
    }
  });

  it('gives every site a programme, and a year to every mission', () => {
    for (const s of CATALOG) {
      expect(s.program, s.id).toBeTruthy();
      if (s.program !== 'other' && s.program !== 'artemis' && s.id !== 'mouton-viper') expect(s.year, s.id).toBeGreaterThan(1958);
    }
  });

  it('finds sites by programme, year, agency or name, ignoring case and accents (criterion 2)', () => {
    const find = (q: string, lang: 'es' | 'en' = 'es') => CATALOG.filter((s) => siteMatches(s, q, lang)).map((s) => s.id);
    expect(find('CLPS')).toEqual(expect.arrayContaining(['im1', 'im2', 'blueghost', 'mouton-viper']));
    expect(find('CLPS').every((id) => CATALOG.find((s) => s.id === id)!.program === 'clps')).toBe(true);
    expect(find('1972').sort()).toEqual(['apollo16', 'apollo17', 'luna20']);
    expect(find('urss')).toContain('luna24');
    expect(find('ussr', 'en')).toContain('luna9');
    expect(find('change')).toEqual(expect.arrayContaining(['change3', 'change4', 'change5', 'change6']));
    expect(find('apollo 15')).toEqual(['apollo15']);
    expect(find('')).toHaveLength(CATALOG.length);
    expect(find('zzz')).toHaveLength(0);
  });

  it('every site south of 80°S has its precomputed horizons, one per mast (criterion 4)', () => {
    const files = new Set(Object.keys(import.meta.glob('../server/data/horizons/*.json')).map((p) => p.split('/').pop()));
    for (const s of CATALOG.filter((x) => x.lat <= -80)) for (const mast of [2, 10, 50]) expect(files.has(`${s.id}-${mast}m.json`), `${s.id} ${mast} m`).toBe(true);
  });
});

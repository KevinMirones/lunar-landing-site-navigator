// S07: every catalogue site says where its coordinates come from.
import { describe, expect, it } from 'vitest';
import { CATALOG, customSite } from '../src/lib/sites';

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

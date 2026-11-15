// S12: guided tour and glossary.
import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '../src/lib/glossary';
import { CATALOG } from '../src/lib/sites';
import { TOUR, words } from '../src/lib/tour';
import { decode, encode } from '../src/lib/urlState';

const known = (id: string) => CATALOG.some((s) => s.id === id);

describe('guided tour', () => {
  it('has the five steps of the spec, in order', () => {
    expect(TOUR.map((s) => s.id)).toEqual(['equator', 'pole', 'shadow', 'earth', 'plan']);
  });

  it('every step is a valid shareable state: encoding and reading it gives it back with no problem', () => {
    for (const step of TOUR) {
      const { state, problems } = decode(encode({ ...step.state, lang: 'es' }), known);
      expect(problems).toEqual([]);
      expect(state).toMatchObject(step.state);
    }
  });

  it('uses only catalogue sites, so the steps work on any server', () => {
    for (const step of TOUR) for (const sc of step.state.scenarios) expect(typeof sc.site === 'string' && known(sc.site)).toBe(true);
  });

  it('fixes its own date, so it tells the same story any day', () => {
    for (const step of TOUR) for (const sc of step.state.scenarios) expect(sc.landing).toBe(Date.UTC(2026, 10, 14));
  });

  it('shows the right site, view and layer at each step', () => {
    const by = Object.fromEntries(TOUR.map((s) => [s.id, s]));
    expect(by.equator.state.scenarios[0].site).toBe('apollo11');
    expect(by.equator.state.view).toBe('globe');
    expect(by.equator.play).toBe(true);
    expect(by.pole.state.scenarios[0].site).toBe('ridge');
    expect(by.shadow.state.scenarios[0].site).toBe('shackleton-floor');
    expect(by.earth.state.mode).toBe('earth');
    expect(by.plan.state.scenarios.length).toBeGreaterThan(1);
    expect(by.plan.open).toContain('compare');
  });

  it('has every text in Spanish and English, 40 words at most (criterion 4)', () => {
    for (const step of TOUR) {
      for (const lang of ['es', 'en'] as const) {
        expect(step.title[lang].length).toBeGreaterThan(0);
        expect(words(step.text[lang])).toBeLessThanOrEqual(40);
      }
    }
  });
});

describe('glossary', () => {
  it('defines every term in both languages, in one or two sentences', () => {
    for (const entry of Object.values(GLOSSARY)) {
      for (const lang of ['es', 'en'] as const) {
        expect(entry.term[lang].length).toBeGreaterThan(0);
        const sentences = entry.definition[lang].split(/(?<=[.!?])\s+/).filter(Boolean);
        expect(sentences.length).toBeGreaterThanOrEqual(1);
        expect(sentences.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it('covers the terms the spec lists', () => {
    expect(Object.keys(GLOSSARY).sort()).toEqual(['azimuth', 'dem', 'elevation', 'ephemeris', 'horizon', 'index', 'libration', 'link', 'mast', 'shadow'].sort());
  });
});

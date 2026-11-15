// S02: the whole comparison travels in the address bar.
import { describe, expect, it } from 'vitest';
import { DEFAULT_POWER } from '../src/lib/power';
import { decode, encode, fromShared, toShared, type SharedState } from '../src/lib/urlState';
import { CATALOG } from '../src/lib/sites';

const known = (id: string) => CATALOG.some((s) => s.id === id);
const at = (iso: string) => Date.parse(`${iso}:00Z`);

const full: SharedState = {
  scenarios: [
    { site: 'ridge', landing: at('2026-11-14T00:00'), durationDays: 30, mast: 2 },
    { site: { lat: -85.95, lon: -2.93 }, landing: at('2026-12-05T06:30'), durationDays: 60, mast: 10 },
  ],
  active: 1,
  hours: 36.5,
  lang: 'en',
  view: 'globe',
  mode: 'earth',
};

describe('encoding the state into a link', () => {
  it('survives a round trip unchanged', () => {
    const { state, problems } = decode(encode(full), known);
    expect(problems).toEqual([]);
    expect(state).toEqual(full);
  });

  it('writes the compact format of the spec', () => {
    expect(encode(full)).toBe('s=ridge@2026-11-14T00:00~30~2;-85.95,-2.93@2026-12-05T06:30~60~10&a=1&t=36.5&l=en&v=globe&m=earth');
  });

  it('keeps a custom point to five decimals (0.3 m): moving it 16 m can change its Earth link by 7 points', () => {
    const point = { lat: -85.96754, lon: -2.21038 };
    const { state } = decode(encode({ ...full, scenarios: [{ site: point, landing: at('2026-11-14T00:00'), durationDays: 30, mast: 2 }], active: 0 }), known);
    expect(state.scenarios![0].site).toEqual(point);
  });

  it('stays under 2000 characters with six scenarios on custom points', () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ site: { lat: -89.12345 - i / 1000, lon: -137.45678 + i }, landing: at('2027-03-21T18:45'), durationDays: 90, mast: 50 }));
    expect(encode({ ...full, scenarios: six, active: 5 }).length).toBeLessThan(2000);
  });
});

describe('reading a link', () => {
  it('reads the example from the spec', () => {
    const { state, problems } = decode('?s=ridge@2026-11-14T00:00~30~2;-85.95,-2.93@2026-12-05T00:00~30~10&a=0&t=36&l=es&v=polar&m=sun', known);
    expect(problems).toEqual([]);
    expect(state.scenarios).toHaveLength(2);
    expect(state.scenarios![1]).toEqual({ site: { lat: -85.95, lon: -2.93 }, landing: at('2026-12-05T00:00'), durationDays: 30, mast: 10 });
    expect(state).toMatchObject({ active: 0, hours: 36, lang: 'es', view: 'polar', mode: 'sun' });
  });

  it('reads the same state when the browser percent-encodes the separators', () => {
    const encoded = new URLSearchParams(encode(full)).toString();
    expect(encoded).toContain('%40');
    expect(decode(encoded, known).state).toEqual(full);
  });

  it('treats an address without parameters as "nothing to restore", not as an error', () => {
    expect(decode('', known)).toEqual({ state: {}, problems: [] });
  });

  it('ignores parameters it does not know, so newer links still open', () => {
    const { state, problems } = decode(`${encode(full)}&energia=tracker`, known);
    expect(problems).toEqual([]);
    expect(state).toEqual(full);
  });
});

describe('the power configuration in the link (S08)', () => {
  it('is left out by default, so links written before S08 look the same', () => {
    expect(encode(full)).not.toContain('p=');
    expect(decode(encode(full), known).state.power).toBeUndefined();
  });

  it('travels when it is set', () => {
    const power = { ...DEFAULT_POWER, panel: 'tilted' as const, tiltDeg: 60, azimuthDeg: 270, batteryWh: 9000 };
    const link = encode({ ...full, power });
    expect(link).toContain('&p=tilted:60:270~2~28~200~25~9000');
    const { state, problems } = decode(link, known);
    expect(problems).toEqual([]);
    expect(state.power).toEqual(power);
  });

  it('reports a configuration it cannot read and keeps the rest', () => {
    const { state, problems } = decode(encode(full) + '&p=sail~1~2~3', known);
    expect(state.power).toBeUndefined();
    expect(state.scenarios).toHaveLength(2);
    expect(problems).toHaveLength(1);
  });
});

describe('the contact settings in the link (S09)', () => {
  it('are left out by default', () => {
    expect(encode(full)).not.toContain('c=');
  });
  it('travel when they are set, together with the power configuration', () => {
    const comms = { marginDeg: 5 as const, network: 'single' as const, station: { lat: -35.4, lon: 148.98 } };
    const link = encode({ ...full, power: { ...DEFAULT_POWER, batteryWh: 9000 }, comms });
    expect(link).toContain('&c=5~-35.4,148.98');
    const { state, problems } = decode(link, known);
    expect(problems).toEqual([]);
    expect(state.comms).toEqual(comms);
    expect(state.power?.batteryWh).toBe(9000);
  });
});

describe('the simple view in the link (S12)', () => {
  it('is written only when chosen, and read back', () => {
    expect(encode(full)).not.toContain('x=');
    const link = encode({ ...full, simple: true });
    expect(link).toContain('&x=simple');
    expect(decode(link, known).state.simple).toBe(true);
  });
  it('reports a value it does not know', () => {
    expect(decode(encode(full) + '&x=kids', known).problems).toHaveLength(1);
  });
});

describe('reading a damaged link', () => {
  it('reports a problem instead of failing on garbage', () => {
    const { state, problems } = decode('?s=xxx', known);
    expect(state.scenarios).toBeUndefined();
    expect(problems.length).toBeGreaterThan(0);
  });

  it('keeps the readable scenarios and reports the unreadable one', () => {
    const { state, problems } = decode('s=ridge@2026-11-14T00:00~30~2;malapert@not-a-date~30~2', known);
    expect(state.scenarios).toEqual([{ site: 'ridge', landing: at('2026-11-14T00:00'), durationDays: 30, mast: 2 }]);
    expect(problems).toHaveLength(1);
  });

  it.each([
    ['a site that is not in the catalogue', 's=atlantis@2026-11-14T00:00~30~2'],
    ['a latitude beyond the pole', 's=-95,10@2026-11-14T00:00~30~2'],
    ['a duration the app does not offer', 's=ridge@2026-11-14T00:00~31~2'],
    ['a mast height the app does not offer', 's=ridge@2026-11-14T00:00~30~7'],
  ])('rejects %s', (_label, query) => {
    const { state, problems } = decode(query, known);
    expect(state.scenarios).toBeUndefined();
    expect(problems).toHaveLength(1);
  });

  it('drops scenarios beyond the limit of six and says so', () => {
    const seven = Array.from({ length: 7 }, () => 'ridge@2026-11-14T00:00~30~2').join(';');
    const { state, problems } = decode(`s=${seven}`, known);
    expect(state.scenarios).toHaveLength(6);
    expect(problems).toHaveLength(1);
  });

  it('rejects an active index that points at no scenario', () => {
    const { state, problems } = decode('s=ridge@2026-11-14T00:00~30~2&a=4', known);
    expect(state.active).toBeUndefined();
    expect(problems).toHaveLength(1);
  });

  it.each([['l=fr'], ['v=mars'], ['m=moon'], ['t=-5'], ['t=abc']])('rejects %s', (query) => {
    expect(decode(query, known).problems).toHaveLength(1);
  });
});

describe('turning a link into app state', () => {
  it('does not move a custom point when creating it from link coordinates', () => {
    const { custom } = fromShared([{ site: { lat: -85.96754, lon: -2.21038 }, landing: 1, durationDays: 30, mast: 2 }]);
    expect(custom[0]).toMatchObject({ lat: -85.96754, lon: -2.21038 });
  });

  it('creates one custom point per distinct coordinate and points scenarios at it', () => {
    const { scenarios, custom } = fromShared([
      { site: 'ridge', landing: 1, durationDays: 30, mast: 2 },
      { site: { lat: -85.95, lon: -2.93 }, landing: 2, durationDays: 30, mast: 2 },
      { site: { lat: -85.95, lon: -2.93 }, landing: 3, durationDays: 60, mast: 10 },
    ]);
    expect(custom).toHaveLength(1);
    expect(custom[0]).toMatchObject({ lat: -85.95, lon: -2.93, group: 'custom' });
    expect(scenarios.map((s) => s.siteId)).toEqual(['ridge', custom[0].id, custom[0].id]);
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(3);
  });

  it('writes custom points as coordinates and catalogue sites by id', () => {
    const { scenarios, custom } = fromShared(full.scenarios);
    const siteOf = (id: string) => [...CATALOG, ...custom].find((s) => s.id === id)!;
    expect(toShared(scenarios, siteOf)).toEqual(full.scenarios);
  });
});

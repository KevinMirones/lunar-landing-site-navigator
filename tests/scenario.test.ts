// S01: scenarios (site + landing date + duration + mast) that can be compared side by side.
import { describe, expect, it } from 'vitest';
import {
  MAX_SCENARIOS,
  addScenario,
  analyzeScenario,
  duplicateScenario,
  gridFor,
  maxSpanMs,
  removeScenario,
  stripLayout,
  updateScenario,
  type Scenario,
} from '../src/lib/scenario';
import type { Horizon } from '../src/lib/series';

const DAY = 86400e3;
const T0 = Date.UTC(2026, 10, 14);
const base = (over: Partial<Scenario> = {}): Scenario => ({ id: 'e1', siteId: 'ridge', landing: T0, durationDays: 30, mast: 2, ...over });
const smoothMoon: Horizon = { model: 'sphere', siteElevationM: 0, mastM: 2, nAz: 360, elevationDeg: new Array(360).fill(-0.087), distanceKm: new Array(360).fill(0) };

describe('adding scenarios', () => {
  it('gives each new scenario an id not used by any other', () => {
    let list = [base()];
    for (let i = 0; i < 3; i++) list = addScenario(list, { siteId: 'malapert', landing: T0, durationDays: 30, mast: 2 }).list;
    expect(new Set(list.map((s) => s.id)).size).toBe(4);
  });

  it('reuses no id after a scenario in the middle is removed', () => {
    let list = [base({ id: 'e1' }), base({ id: 'e2' }), base({ id: 'e3' })];
    list = removeScenario(list, 'e2', 'e1').list;
    const { added } = addScenario(list, { siteId: 'im2', landing: T0, durationDays: 14, mast: 10 });
    expect(list.map((s) => s.id)).not.toContain(added!.id);
  });

  it(`refuses a scenario beyond the limit of ${MAX_SCENARIOS}`, () => {
    let list = [base()];
    while (list.length < MAX_SCENARIOS) list = addScenario(list, { siteId: 'im2', landing: T0, durationDays: 30, mast: 2 }).list;
    const result = addScenario(list, { siteId: 'im2', landing: T0, durationDays: 30, mast: 2 });
    expect(result.added).toBeNull();
    expect(result.list).toHaveLength(MAX_SCENARIOS);
  });
});

describe('duplicating a scenario with another date', () => {
  it('copies site, duration and mast and lands seven days later', () => {
    const { added } = duplicateScenario([base({ durationDays: 60, mast: 10 })], 'e1');
    expect(added).toMatchObject({ siteId: 'ridge', durationDays: 60, mast: 10, landing: T0 + 7 * DAY });
    expect(added!.id).not.toBe('e1');
  });

  it('places the copy right after the original', () => {
    const list = [base({ id: 'e1' }), base({ id: 'e2', siteId: 'im2' })];
    const result = duplicateScenario(list, 'e1');
    expect(result.list.map((s) => s.siteId)).toEqual(['ridge', 'ridge', 'im2']);
  });
});

describe('removing a scenario', () => {
  const list = [base({ id: 'e1' }), base({ id: 'e2' }), base({ id: 'e3' })];

  it('activates the previous scenario when the active one is removed', () => {
    expect(removeScenario(list, 'e2', 'e2')).toMatchObject({ activeId: 'e1' });
    expect(removeScenario(list, 'e3', 'e3')).toMatchObject({ activeId: 'e2' });
  });

  it('activates the new first scenario when the first one was active', () => {
    expect(removeScenario(list, 'e1', 'e1')).toMatchObject({ activeId: 'e2' });
  });

  it('keeps the active scenario when another one is removed', () => {
    expect(removeScenario(list, 'e3', 'e1')).toMatchObject({ activeId: 'e1' });
  });

  it('never removes the last scenario', () => {
    const only = [base()];
    expect(removeScenario(only, 'e1', 'e1')).toEqual({ list: only, activeId: 'e1' });
  });
});

describe('editing a scenario', () => {
  it('changes only the scenario with the given id', () => {
    const list = updateScenario([base({ id: 'e1' }), base({ id: 'e2' })], 'e2', { landing: T0 + DAY });
    expect(list.map((s) => s.landing)).toEqual([T0, T0 + DAY]);
  });
});

describe('time grid of a scenario', () => {
  it('samples every 30 minutes up to 30 days and hourly beyond', () => {
    expect(gridFor(base({ durationDays: 30 })).stepMs).toBe(30 * 60e3);
    expect(gridFor(base({ durationDays: 60 })).stepMs).toBe(60 * 60e3);
  });

  it('starts at landing and ends exactly at the end of the mission', () => {
    for (const durationDays of [14, 30, 60, 90]) {
      const g = gridFor(base({ durationDays }));
      expect(g.t0).toBe(T0);
      expect(g.t0 + (g.n - 1) * g.stepMs).toBe(T0 + durationDays * DAY);
    }
  });
});

describe('window strips aligned by mission day', () => {
  it('places a window by its offset from landing, as a fraction of the longest mission', () => {
    const window = [{ start: T0 + 1 * DAY, end: T0 + 3 * DAY, open: false }];
    const layout = stripLayout(window, T0, 10 * DAY);
    expect(layout).toHaveLength(1);
    expect(layout[0].left).toBeCloseTo(0.1, 10);
    expect(layout[0].width).toBeCloseTo(0.2, 10);
  });

  it('gives the same layout to two scenarios that differ only in landing date', () => {
    const a = stripLayout([{ start: T0 + DAY, end: T0 + 2 * DAY, open: false }], T0, 30 * DAY);
    const later = T0 + 21 * DAY;
    const b = stripLayout([{ start: later + DAY, end: later + 2 * DAY, open: false }], later, 30 * DAY);
    expect(b).toEqual(a);
  });

  it('uses the longest mission as the shared axis', () => {
    expect(maxSpanMs([base({ durationDays: 14 }), base({ durationDays: 60 }), base({ durationDays: 30 })])).toBe(60 * DAY);
  });
});

describe('analysing scenarios', () => {
  const apollo11 = { lat: 0.67416, lon: 23.47314 };

  it('gives different results for the same site on different dates', () => {
    const first = analyzeScenario(base({ durationDays: 14 }), apollo11, smoothMoon);
    const weekLater = analyzeScenario(base({ durationDays: 14, landing: T0 + 7 * DAY }), apollo11, smoothMoon);
    expect(Math.abs(first.metrics.sunShare - weekLater.metrics.sunShare)).toBeGreaterThan(0.1);
  });

  it('recomputes six 90-day scenarios in under 300 ms', () => {
    const scenarios = Array.from({ length: 6 }, (_, i) => base({ id: `e${i}`, durationDays: 90, landing: T0 + i * 5 * DAY }));
    const run = () => {
      const t = performance.now();
      for (const s of scenarios) analyzeScenario(s, apollo11, smoothMoon, { fresh: true });
      return performance.now() - t;
    };
    run(); // warm up the JIT
    const best = Math.min(run(), run(), run());
    if (process.env.LUMINA_PERF === '1') expect(best).toBeLessThan(300); // npm run test:perf (S03)
  });
});

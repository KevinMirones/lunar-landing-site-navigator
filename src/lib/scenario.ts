// A scenario is one "what if": a site, a landing date, a mission duration and
// a mast height. The comparison table holds several of them, so the same site
// can be weighed against itself on another date.
import { computeFrameSeries, frameSeries, metrics, siteSeries, type Horizon, type Interval, type Metrics, type SiteSeries, type TimeGrid } from './series';

export interface Scenario {
  id: string;
  siteId: string;
  /** Landing instant, ms UTC. */
  landing: number;
  durationDays: number;
  /** Height of panels and antenna above the ground, metres. */
  mast: number;
}

export const MAX_SCENARIOS = 6;
export const DURATIONS = [14, 30, 60, 90];
export const MASTS = [2, 10, 50];

const HOUR = 3600e3;
const DAY = 24 * HOUR;

/** An id of the form "eN" that no scenario in the list uses. */
function freshId(list: Scenario[]): string {
  let n = list.length + 1;
  while (list.some((s) => s.id === `e${n}`)) n++;
  return `e${n}`;
}

export function addScenario(list: Scenario[], fields: Omit<Scenario, 'id'>): { list: Scenario[]; added: Scenario | null } {
  if (list.length >= MAX_SCENARIOS) return { list, added: null };
  const added = { ...fields, id: freshId(list) };
  return { list: [...list, added], added };
}

/** Copy of a scenario landing `shiftDays` later, inserted right after the original. */
export function duplicateScenario(list: Scenario[], id: string, shiftDays = 7): { list: Scenario[]; added: Scenario | null } {
  const index = list.findIndex((s) => s.id === id);
  if (index < 0 || list.length >= MAX_SCENARIOS) return { list, added: null };
  const added = { ...list[index], id: freshId(list), landing: list[index].landing + shiftDays * DAY };
  return { list: [...list.slice(0, index + 1), added, ...list.slice(index + 1)], added };
}

/** Removes a scenario. The last one always stays; removing the active one activates its neighbour. */
export function removeScenario(list: Scenario[], id: string, activeId: string): { list: Scenario[]; activeId: string } {
  const index = list.findIndex((s) => s.id === id);
  if (index < 0 || list.length <= 1) return { list, activeId };
  const next = list.filter((s) => s.id !== id);
  return { list: next, activeId: id === activeId ? next[Math.max(0, index - 1)].id : activeId };
}

export function updateScenario(list: Scenario[], id: string, patch: Partial<Omit<Scenario, 'id'>>): Scenario[] {
  return list.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

/** Sampling grid of a mission: every 30 minutes up to 30 days, hourly beyond. */
export function gridFor(s: Scenario): TimeGrid {
  const stepMs = s.durationDays <= 30 ? HOUR / 2 : HOUR;
  return { t0: s.landing, stepMs, n: Math.round((s.durationDays * DAY) / stepMs) + 1 };
}

export const maxSpanMs = (list: Scenario[]) => Math.max(...list.map((s) => s.durationDays)) * DAY;

/** Windows as fractions of a shared axis that starts at each scenario's own landing (mission day 0). */
export function stripLayout(intervals: Interval[], landing: number, spanMs: number): Array<{ left: number; width: number }> {
  const out: Array<{ left: number; width: number }> = [];
  for (const iv of intervals) {
    const a = Math.max(0, (iv.start - landing) / spanMs);
    const b = Math.min(1, (iv.end - landing) / spanMs);
    if (b > a) out.push({ left: a, width: b - a });
  }
  return out;
}

export interface ScenarioAnalysis {
  series: SiteSeries;
  metrics: Metrics;
}

/** `fresh` skips the shared ephemeris cache, to measure a full recomputation. */
export function analyzeScenario(s: Scenario, site: { lat: number; lon: number }, horizon: Horizon, opts: { fresh?: boolean } = {}): ScenarioAnalysis {
  const grid = gridFor(s);
  const series = siteSeries(site.lat, site.lon, horizon, opts.fresh ? computeFrameSeries(grid) : frameSeries(grid));
  return { series, metrics: metrics(series) };
}

/** Everything an analysis depends on; equal keys mean the cached result can be reused. */
export const analysisKey = (s: Scenario, site: { lat: number; lon: number }) => `${site.lat}|${site.lon}|${s.landing}|${s.durationDays}|${s.mast}`;

// Time series of Sun/Earth visibility for a site, and the mission metrics
// derived from them. The ephemeris part (Moon-fixed vectors) depends only on
// time, so it is computed once per time grid and shared by every site.
import {
  DEG,
  EARTH_RADIUS_KM,
  SUN_RADIUS_KM,
  moonFixedVectors,
  siteFrame,
  topocentric,
  type Vec3,
} from './ephemeris';

export interface TimeGrid {
  t0: number;
  stepMs: number;
  n: number;
}

export interface FrameSeries extends TimeGrid {
  sun: Float64Array;
  earth: Float64Array;
}

export interface Horizon {
  model: 'lola-240m' | 'sphere';
  siteElevationM: number;
  mastM: number;
  nAz: number;
  elevationDeg: Float32Array | number[];
  distanceKm: Float32Array | number[];
}

export interface SiteSeries extends TimeGrid {
  sunEl: Float32Array;
  sunAz: Float32Array;
  earthEl: Float32Array;
  earthAz: Float32Array;
  /** Fraction of the solar disc above the terrain horizon, 0..1. */
  sunFrac: Float32Array;
  /** Fraction of Earth's disc above the terrain horizon, 0..1. */
  earthFrac: Float32Array;
}

/** A sliver of Sun counts as sunlight; at least half of Earth's disc counts as a link. */
export const SUN_THRESHOLD = 0.02;
export const EARTH_THRESHOLD = 0.5;

const frameCache = new Map<string, FrameSeries>();

export function frameSeries(grid: TimeGrid): FrameSeries {
  const key = `${grid.t0}|${grid.stepMs}|${grid.n}`;
  const hit = frameCache.get(key);
  if (hit) return hit;
  const sun = new Float64Array(grid.n * 3);
  const earth = new Float64Array(grid.n * 3);
  for (let i = 0; i < grid.n; i++) {
    const v = moonFixedVectors(new Date(grid.t0 + i * grid.stepMs));
    sun.set(v.sun, i * 3);
    earth.set(v.earth, i * 3);
  }
  const fs = { ...grid, sun, earth };
  if (frameCache.size > 12) frameCache.delete(frameCache.keys().next().value!);
  frameCache.set(key, fs);
  return fs;
}

export function horizonAt(h: Horizon, azDeg: number): number {
  const x = ((((azDeg % 360) + 360) % 360) * h.nAz) / 360;
  const i = Math.floor(x);
  const f = x - i;
  const a = h.elevationDeg[i % h.nAz];
  const b = h.elevationDeg[(i + 1) % h.nAz];
  return a + (b - a) * f;
}

/**
 * Fraction of a disc (centre az/el, angular radius r, degrees) that clears the
 * horizon. The disc is cut into vertical strips so a jagged ridge line is
 * handled correctly rather than assuming a flat horizon.
 */
export function discFraction(h: Horizon, az: number, el: number, r: number): number {
  const STRIPS = 9;
  const cosEl = Math.max(0.05, Math.cos(el * DEG));
  let visible = 0;
  let total = 0;
  for (let k = 0; k < STRIPS; k++) {
    const dx = (((k + 0.5) / STRIPS) * 2 - 1) * r;
    const half = Math.sqrt(r * r - dx * dx);
    const hz = horizonAt(h, az + dx / cosEl);
    visible += Math.max(0, Math.min(2 * half, el + half - hz));
    total += 2 * half;
  }
  return visible / total;
}

export interface Sky {
  sun: { az: number; el: number; radius: number; frac: number; horizon: number; distKm: number };
  earth: { az: number; el: number; radius: number; frac: number; horizon: number; distKm: number };
}

export function skyAt(lat: number, lon: number, h: Horizon, sunV: Vec3, earthV: Vec3): Sky {
  const frame = siteFrame(lat, lon, (h.siteElevationM + h.mastM) / 1000);
  const s = topocentric(frame, sunV);
  const e = topocentric(frame, earthV);
  const rs = Math.asin(SUN_RADIUS_KM / s.distKm) / DEG;
  const re = Math.asin(EARTH_RADIUS_KM / e.distKm) / DEG;
  return {
    sun: { az: s.az, el: s.el, radius: rs, frac: discFraction(h, s.az, s.el, rs), horizon: horizonAt(h, s.az), distKm: s.distKm },
    earth: { az: e.az, el: e.el, radius: re, frac: discFraction(h, e.az, e.el, re), horizon: horizonAt(h, e.az), distKm: e.distKm },
  };
}

export function siteSeries(lat: number, lon: number, h: Horizon, fs: FrameSeries): SiteSeries {
  const n = fs.n;
  const out: SiteSeries = {
    t0: fs.t0,
    stepMs: fs.stepMs,
    n,
    sunEl: new Float32Array(n),
    sunAz: new Float32Array(n),
    earthEl: new Float32Array(n),
    earthAz: new Float32Array(n),
    sunFrac: new Float32Array(n),
    earthFrac: new Float32Array(n),
  };
  for (let i = 0; i < n; i++) {
    const j = i * 3;
    const sky = skyAt(lat, lon, h, [fs.sun[j], fs.sun[j + 1], fs.sun[j + 2]], [fs.earth[j], fs.earth[j + 1], fs.earth[j + 2]]);
    out.sunEl[i] = sky.sun.el;
    out.sunAz[i] = sky.sun.az;
    out.sunFrac[i] = sky.sun.frac;
    out.earthEl[i] = sky.earth.el;
    out.earthAz[i] = sky.earth.az;
    out.earthFrac[i] = sky.earth.frac;
  }
  return out;
}

export interface Interval {
  start: number;
  end: number;
  /** True when the interval touches the edge of the analysed window (so it may be longer). */
  open: boolean;
}

/** Intervals where `values > threshold`, with crossings linearly interpolated between samples. */
export function intervalsAbove(values: Float32Array, grid: TimeGrid, threshold: number): Interval[] {
  const out: Interval[] = [];
  const tEnd = grid.t0 + (grid.n - 1) * grid.stepMs;
  let start: number | null = values[0] > threshold ? grid.t0 : null;
  let open = start !== null;
  for (let i = 1; i < grid.n; i++) {
    const a = values[i - 1];
    const b = values[i];
    const up = b > threshold;
    if (a > threshold === up) continue;
    const t = grid.t0 + (i - 1 + (threshold - a) / (b - a)) * grid.stepMs;
    if (up) {
      start = t;
      open = false;
    } else if (start !== null) {
      out.push({ start, end: t, open });
      start = null;
    }
  }
  if (start !== null) out.push({ start, end: tEnd, open: true });
  return out;
}

export function intersect(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i].start, b[j].start);
    const end = Math.min(a[i].end, b[j].end);
    if (end > start) out.push({ start, end, open: (a[i].open && (start === a[i].start || end === a[i].end)) || (b[j].open && (start === b[j].start || end === b[j].end)) });
    if (a[i].end < b[j].end) i++;
    else j++;
  }
  return out;
}

export function complement(intervals: Interval[], t0: number, t1: number): Interval[] {
  const out: Interval[] = [];
  let cursor = t0;
  for (const iv of intervals) {
    if (iv.start > cursor) out.push({ start: cursor, end: iv.start, open: cursor === t0 });
    cursor = iv.end;
  }
  if (cursor < t1) out.push({ start: cursor, end: t1, open: true });
  return out;
}

const total = (ivs: Interval[]) => ivs.reduce((s, iv) => s + iv.end - iv.start, 0);
const longest = (ivs: Interval[]) => ivs.reduce((m, iv) => Math.max(m, iv.end - iv.start), 0);

export interface Metrics {
  spanMs: number;
  sunIntervals: Interval[];
  earthIntervals: Interval[];
  bothIntervals: Interval[];
  /** Share of the window with any direct sunlight, 0..1. */
  sunShare: number;
  /** Time-averaged visible fraction of the solar disc: proxy for energy on a Sun-tracking array. */
  meanSunFrac: number;
  earthShare: number;
  bothShare: number;
  longestSunMs: number;
  longestDarkMs: number;
  longestEarthMs: number;
  longestNoEarthMs: number;
  maxSunEl: number;
  maxEarthEl: number;
  /** 0..100 heuristic combining power, night survival and communications. */
  score: number;
}

export function metrics(s: SiteSeries): Metrics {
  const t0 = s.t0;
  const t1 = s.t0 + (s.n - 1) * s.stepMs;
  const spanMs = t1 - t0;
  const sunIntervals = intervalsAbove(s.sunFrac, s, SUN_THRESHOLD);
  const earthIntervals = intervalsAbove(s.earthFrac, s, EARTH_THRESHOLD);
  const bothIntervals = intersect(sunIntervals, earthIntervals);
  let sumFrac = 0;
  let maxSunEl = -90;
  let maxEarthEl = -90;
  for (let i = 0; i < s.n; i++) {
    sumFrac += s.sunFrac[i];
    if (s.sunEl[i] > maxSunEl) maxSunEl = s.sunEl[i];
    if (s.earthEl[i] > maxEarthEl) maxEarthEl = s.earthEl[i];
  }
  const sunShare = total(sunIntervals) / spanMs;
  const earthShare = total(earthIntervals) / spanMs;
  const bothShare = total(bothIntervals) / spanMs;
  const longestDarkMs = longest(complement(sunIntervals, t0, t1));
  // Score: energy (40), continuity of power i.e. short nights (25), comms (35).
  const darkPenalty = Math.min(1, longestDarkMs / (14 * 86400e3));
  const score = Math.round(100 * (0.4 * sunShare + 0.25 * (1 - darkPenalty) + 0.35 * earthShare));
  return {
    spanMs,
    sunIntervals,
    earthIntervals,
    bothIntervals,
    sunShare,
    meanSunFrac: sumFrac / s.n,
    earthShare,
    bothShare,
    longestSunMs: longest(sunIntervals),
    longestDarkMs,
    longestEarthMs: longest(earthIntervals),
    longestNoEarthMs: longest(complement(earthIntervals, t0, t1)),
    maxSunEl,
    maxEarthEl,
    score,
  };
}

export interface NextEvent {
  /** Is the body currently visible (above threshold)? */
  visible: boolean;
  /** Time of the next change of state, or null if none within the searched window. */
  at: number | null;
}

/** Next rise/set after `now`, from intervals computed over a window containing `now`. */
export function nextEvent(intervals: Interval[], now: number, windowEnd: number): NextEvent {
  for (const iv of intervals) {
    if (now < iv.start) return { visible: false, at: iv.start };
    if (now < iv.end) return { visible: true, at: iv.end >= windowEnd ? null : iv.end };
  }
  return { visible: false, at: null };
}

/** Per-day shares for the year calendar: [sunShare, earthShare] for each day in the grid. */
export function dailyShares(s: SiteSeries): { sun: Float32Array; earth: Float32Array; t0: number; days: number } {
  const perDay = Math.round(86400e3 / s.stepMs);
  const days = Math.floor(s.n / perDay);
  const sun = new Float32Array(days);
  const earth = new Float32Array(days);
  for (let d = 0; d < days; d++) {
    let a = 0;
    let b = 0;
    for (let k = 0; k < perDay; k++) {
      const i = d * perDay + k;
      a += s.sunFrac[i];
      if (s.earthFrac[i] > EARTH_THRESHOLD) b++;
    }
    sun[d] = a / perDay;
    earth[d] = b / perDay;
  }
  return { sun, earth, t0: s.t0, days };
}

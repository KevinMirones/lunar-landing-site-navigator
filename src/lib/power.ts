// Power, energy and battery for a solar-powered lander (docs/specs/S08-energia-y-bateria.md).
// Everything comes from the scenario's series, so it costs one pass over the
// mission and changes none of the light, link or index figures.
import { DEG, EARTH_RADIUS_KM, SUN_RADIUS_KM } from './ephemeris.ts';
import { SUN_THRESHOLD, intervalsAbove, type FrameSeries, type Interval, type SiteSeries } from './series.ts';

export type PanelKind = 'tracker' | 'horizontal' | 'tilted';

export interface PowerConfig {
  panel: PanelKind;
  /** Only for 'tilted': 0 = horizontal, 90 = vertical. */
  tiltDeg: number;
  /** Only for 'tilted': the compass direction the panel faces, degrees from north. */
  azimuthDeg: number;
  areaM2: number;
  /** 0..1 */
  efficiency: number;
  loadW: number;
  hibernateW: number;
  batteryWh: number;
}

/** A small generic lander, not any real mission: the interface says so. */
export const DEFAULT_POWER: PowerConfig = { panel: 'tracker', tiltDeg: 90, azimuthDeg: 0, areaM2: 2, efficiency: 0.28, loadW: 200, hibernateW: 25, batteryWh: 3000 };

const SOLAR_CONSTANT_W_M2 = 1361;
const AU_KM = 149597870.7;
const HOUR = 3600e3;
/** Below this share of the Sun covered by Earth, an eclipse is not reported. */
const ECLIPSE_MIN = 0.01;

export interface Eclipse extends Interval {
  peakAt: number;
  /** Largest fraction of the solar disc that Earth covers, 0..1. */
  maxCover: number;
  /** Time with the whole Sun covered. */
  totalMs: number;
}

export interface PowerResult {
  /** Time grid of the samples below (the scenario's series). */
  t0: number;
  stepMs: number;
  /** One sample per instant of the series, watts. */
  powerW: Float32Array;
  /** Fraction of the solar disc covered by Earth at each instant, 0..1. */
  coverage: Float32Array;
  eclipses: Eclipse[];
  peakW: number;
  meanDailyWh: number;
  /** Smallest battery that keeps the lander alive, assuming it lands fully charged. */
  minBatteryWh: number;
  survives: boolean;
  /** battery / minimum − 1; Infinity when no battery is needed. */
  margin: number;
  /** When the battery entered by the user runs out, if it does. */
  depletedAt: number | null;
  /** First sunlight after the battery runs out. */
  nextSunAt: number | null;
}

/**
 * Fraction of a disc of radius `r1` covered by a disc of radius `r2` whose
 * centre is `d` away (any angular unit, the same for all three).
 */
export function circleCover(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0;
  if (d <= r2 - r1) return 1;
  if (d <= r1 - r2) return (r2 * r2) / (r1 * r1);
  const a1 = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
  const a2 = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  const k = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  return (a1 + a2 - k) / (Math.PI * r1 * r1);
}

/** Cosine of the angle between the panel's normal and the Sun, never negative. */
function incidence(c: PowerConfig, elDeg: number, azDeg: number): number {
  if (c.panel === 'tracker') return 1;
  const el = elDeg * DEG;
  if (c.panel === 'horizontal') return Math.max(0, Math.sin(el));
  const t = c.tiltDeg * DEG;
  return Math.max(0, Math.sin(el) * Math.cos(t) + Math.cos(el) * Math.sin(t) * Math.cos((azDeg - c.azimuthDeg) * DEG));
}

export function analyzePower(series: SiteSeries, frames: FrameSeries, config: PowerConfig): PowerResult {
  const { n, t0, stepMs } = series;
  const powerW = new Float32Array(n);
  const coverage = new Float32Array(n);
  const visible = new Float32Array(n);
  const separation = new Float32Array(n); // between the centres of the Sun and Earth, radians
  const partial = new Float32Array(n); // > 0 while Earth overlaps the Sun at all
  const full = new Float32Array(n); // > 0 while Earth covers the whole Sun
  let peakW = 0;
  let energyWh = 0;
  for (let i = 0; i < n; i++) {
    const j = i * 3;
    const dSun = Math.hypot(frames.sun[j], frames.sun[j + 1], frames.sun[j + 2]);
    const dEarth = Math.hypot(frames.earth[j], frames.earth[j + 1], frames.earth[j + 2]);
    // Earth seen from the site in front of the Sun: a lunar eclipse, as seen from the Moon.
    const e1 = series.sunEl[i] * DEG;
    const e2 = series.earthEl[i] * DEG;
    const cosSep = Math.sin(e1) * Math.sin(e2) + Math.cos(e1) * Math.cos(e2) * Math.cos((series.sunAz[i] - series.earthAz[i]) * DEG);
    const sep = Math.acos(Math.min(1, Math.max(-1, cosSep)));
    const rSun = Math.asin(SUN_RADIUS_KM / dSun);
    const rEarth = Math.asin(EARTH_RADIUS_KM / dEarth);
    separation[i] = sep;
    // Contacts are found on these margins, which change smoothly; the coverage itself
    // jumps to 1 and would clip the total phase by up to a step at each end.
    partial[i] = rSun + rEarth - sep;
    full[i] = rEarth - rSun - sep;
    coverage[i] = circleCover(rSun, rEarth, sep);
    // Terrain and Earth are taken as independent; exact whenever either is 0 or 1, which is almost always.
    visible[i] = series.sunFrac[i] * (1 - coverage[i]);
    const irradiance = SOLAR_CONSTANT_W_M2 * (AU_KM / dSun) ** 2;
    powerW[i] = irradiance * visible[i] * config.efficiency * config.areaM2 * incidence(config, series.sunEl[i], series.sunAz[i]);
    if (powerW[i] > peakW) peakW = powerW[i];
    if (i < n - 1) energyWh += (powerW[i] * stepMs) / HOUR;
  }

  // Battery: each step holds the values of its first instant. `level` is the charge
  // relative to full (never above 0); the deepest it goes is the battery needed.
  const dtH = stepMs / HOUR;
  let level = 0;
  let deepest = 0;
  let charge = config.batteryWh;
  let depletedAt: number | null = null;
  for (let i = 0; i < n - 1; i++) {
    const load = visible[i] > SUN_THRESHOLD ? config.loadW : config.hibernateW;
    const net = (powerW[i] - load) * dtH;
    level = Math.min(0, level + net);
    if (level < deepest) deepest = level;
    if (depletedAt === null) {
      const next = Math.min(config.batteryWh, charge + net);
      if (next < 0) depletedAt = t0 + (i + charge / -net) * stepMs;
      charge = next;
    }
  }
  const minBatteryWh = Math.max(0, -deepest);
  let nextSunAt: number | null = null;
  if (depletedAt !== null) {
    for (let i = Math.ceil((depletedAt - t0) / stepMs); i < n; i++) {
      if (visible[i] > SUN_THRESHOLD) {
        nextSunAt = t0 + i * stepMs;
        break;
      }
    }
  }

  const grid = { t0, stepMs, n };
  const total = intervalsAbove(full, grid, 0);
  const eclipses: Eclipse[] = [];
  for (const iv of intervalsAbove(partial, grid, 0)) {
    // The middle of the eclipse is where the two centres come closest.
    let peak = Math.max(0, Math.floor((iv.start - t0) / stepMs));
    for (let i = peak; i < n && t0 + i * stepMs <= iv.end; i++) if (separation[i] < separation[peak]) peak = i;
    // Only eclipses that matter here: some Sun covered, and the Sun above the terrain.
    if (coverage[peak] < ECLIPSE_MIN || series.sunFrac[peak] <= 0) continue;
    const totalMs = total.filter((t) => t.start >= iv.start && t.end <= iv.end).reduce((s, t) => s + t.end - t.start, 0);
    eclipses.push({ ...iv, peakAt: t0 + peak * stepMs, maxCover: coverage[peak], totalMs });
  }

  const days = ((n - 1) * stepMs) / (24 * HOUR);
  const survives = depletedAt === null;
  return {
    t0,
    stepMs,
    powerW,
    coverage,
    eclipses,
    peakW,
    meanDailyWh: days > 0 ? energyWh / days : 0,
    minBatteryWh,
    survives,
    margin: minBatteryWh > 0 ? config.batteryWh / minBatteryWh - 1 : Infinity,
    depletedAt,
    nextSunAt,
  };
}

// ---------- shareable link: p=tracker~2~28~200~25~3000 or p=tilted:35:180~2~28~200~25~3000

const num = (x: number) => String(Math.round(x * 100) / 100);

export function encodePower(c: PowerConfig): string {
  const panel = c.panel === 'tilted' ? `tilted:${num(c.tiltDeg)}:${num(c.azimuthDeg)}` : c.panel;
  return [panel, num(c.areaM2), num(c.efficiency * 100), num(c.loadW), num(c.hibernateW), num(c.batteryWh)].join('~');
}

/** Null when the text is not a valid configuration. */
export function decodePower(text: string): PowerConfig | null {
  const parts = text.split('~');
  if (parts.length !== 6) return null;
  const [panelText, ...rest] = parts;
  const [areaM2, effPct, loadW, hibernateW, batteryWh] = rest.map((v) => (/^\d+(\.\d+)?$/.test(v) ? Number(v) : NaN));
  if (!(areaM2 > 0 && areaM2 <= 1000 && effPct > 0 && effPct <= 100 && loadW <= 1e5 && hibernateW <= 1e5 && batteryWh <= 1e8)) return null;
  const base = { ...DEFAULT_POWER, areaM2, efficiency: effPct / 100, loadW, hibernateW, batteryWh };
  if (panelText === 'tracker' || panelText === 'horizontal') return { ...base, panel: panelText };
  const m = panelText.match(/^tilted:(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const tiltDeg = Number(m[1]);
  const azimuthDeg = Number(m[2]);
  if (tiltDeg > 90 || azimuthDeg >= 360) return null;
  return { ...base, panel: 'tilted', tiltDeg, azimuthDeg };
}

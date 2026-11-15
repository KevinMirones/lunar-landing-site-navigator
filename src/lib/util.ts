import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Lang } from './sites';
import type { Horizon } from './series';

// ---------- i18n ----------
export const LangContext = createContext<Lang>('es');
/** Returns a picker: tr('texto en español', 'English text'). */
export function useTr() {
  const lang = useContext(LangContext);
  return (es: string, en: string) => (lang === 'es' ? es : en);
}
export function useLang(): Lang {
  return useContext(LangContext);
}

// ---------- formatting ----------
const HOUR = 3600e3;
const DAY = 24 * HOUR;

export function fmtDuration(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  ms = Math.max(0, ms);
  if (ms >= DAY) {
    const d = Math.floor(ms / DAY);
    const h = Math.round((ms - d * DAY) / HOUR);
    return h === 24 ? `${d + 1} d` : h ? `${d} d ${h} h` : `${d} d`;
  }
  if (ms >= HOUR) {
    const h = Math.floor(ms / HOUR);
    const m = Math.round((ms - h * HOUR) / 60e3);
    return m === 60 ? `${h + 1} h` : m ? `${h} h ${m} min` : `${h} h`;
  }
  return `${Math.max(1, Math.round(ms / 60e3))} min`;
}

export function fmtDate(ms: number, lang: Lang, withTime = true): string {
  const d = new Date(ms);
  const date = d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  if (!withTime) return date;
  return `${date} ${d.toISOString().slice(11, 16)} UTC`;
}

export function fmtLatLon(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'}  ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'}`;
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
/** Degrees with a typographic minus sign. */
export const deg = (x: number, digits = 1) => `${x < 0 ? '−' : ''}${Math.abs(x).toFixed(digits)}°`;
export const km = (d: number) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(d < 10 ? 1 : 0)} km`);

export function compass(az: number, lang: Lang): string {
  const names = lang === 'es' ? ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return names[Math.round((((az % 360) + 360) % 360) / 45) % 8];
}

/** datetime-local value <-> UTC milliseconds. */
export const toInput = (ms: number) => new Date(ms).toISOString().slice(0, 16);
export const fromInput = (v: string) => Date.parse(`${v}:00Z`);

// ---------- API ----------
const SPHERE_NAZ = 360;
function sphereHorizon(mastM: number): Horizon {
  const dip = -Math.acos(1737.4 / (1737.4 + mastM / 1000)) * (180 / Math.PI);
  return {
    model: 'sphere',
    siteElevationM: 0,
    mastM,
    nAz: SPHERE_NAZ,
    elevationDeg: new Array(SPHERE_NAZ).fill(dip),
    distanceKm: new Array(SPHERE_NAZ).fill(0),
  };
}

export async function fetchHorizon(lat: number, lon: number, mastM: number): Promise<Horizon & { offline?: boolean }> {
  try {
    const r = await fetch(`/api/horizon?lat=${lat}&lon=${lon}&mast=${mastM}`);
    if (!r.ok) throw new Error(String(r.status));
    return await r.json();
  } catch {
    // API unreachable: fall back to a smooth sphere so the tool still works.
    return { ...sphereHorizon(mastM), offline: true };
  }
}

/** Distance to the nearest permanently shadowed region (S16), from /api/psr. */
export interface Psr {
  /** False outside 80°S to 90°S, or when the server has no shadow map. */
  covered: boolean;
  inside: boolean;
  /** Null when nothing lies within 50 km. */
  distanceKm: number | null;
  bearingDeg: number | null;
}

export async function fetchPsr(lat: number, lon: number): Promise<Psr | null> {
  try {
    const r = await fetch(`/api/psr?lat=${lat}&lon=${lon}`);
    return r.ok ? await r.json() : null;
  } catch {
    return null; // no server: the line is left out
  }
}

export interface Heightmap {
  /** Heights in km, row 0 = top (lon 0 up, 90E right). */
  data: Float32Array;
  size: number;
  halfExtentKm: number;
}

export async function fetchHeightmap(): Promise<Heightmap | null> {
  try {
    const r = await fetch('/api/heightmap');
    if (!r.ok) return null;
    const size = Number(r.headers.get('X-Heightmap-Size'));
    const halfExtentKm = Number(r.headers.get('X-Heightmap-Half-Extent-Km'));
    const dn = new Int16Array(await r.arrayBuffer());
    if (!size || dn.length !== size * size) return null;
    const data = new Float32Array(dn.length);
    for (let i = 0; i < dn.length; i++) data[i] = dn[i] * 0.0005;
    return { data, size, halfExtentKm };
  } catch {
    return null;
  }
}

export interface JplCheck {
  t: number;
  sun: { az: number; el: number };
  earth: { az: number; el: number };
}
export async function fetchJpl(lat: number, lon: number, t: number): Promise<JplCheck> {
  const r = await fetch(`/api/jpl?lat=${lat}&lon=${lon}&t=${t}`);
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || 'JPL Horizons unavailable');
  return body;
}

// ---------- hooks ----------
/** Tracks a CSS media query, e.g. the breakpoints in styles.css where side panels stack. */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

/**
 * What a stored value may change of the defaults: only known keys, and only with a
 * value of the same type. A value saved by another version, or corrupted, is ignored (S14).
 */
export function mergeStored<T extends object>(initial: T, stored: unknown): T {
  const out = { ...initial };
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return out;
  for (const k of Object.keys(initial) as Array<keyof T>) {
    const v = (stored as Record<string, unknown>)[k as string];
    if (typeof v === typeof initial[k]) out[k] = v as T[keyof T];
  }
  return out;
}

/** useState remembered in this browser. If storage is blocked, it only forgets on reload. */
export function useStoredState<T extends object>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? mergeStored(initial, JSON.parse(raw)) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or full storage: keep working without persistence.
    }
  }, [key, value]);
  return [value, setValue];
}

export function useSize<T extends HTMLElement>(): [React.RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

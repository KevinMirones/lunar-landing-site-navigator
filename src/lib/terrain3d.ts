// S11: geometry for the 3D view that does not need a browser. The scene is in
// the site's local frame, in metres: east = +x, up = +y, north = -z, so the
// three.js camera looks north when it is not rotated.
import type { Horizon, Sky } from './series';
import type { Lang } from './sites';
import { compass } from './util';

const DEG = Math.PI / 180;
export const PITCH_MIN = -30;
export const PITCH_MAX = 60;
export type Vec3 = [number, number, number];

export const wrapAz = (az: number) => ((az % 360) + 360) % 360;
export const clampPitch = (p: number) => Math.max(PITCH_MIN, Math.min(PITCH_MAX, p));

/**
 * Elevation as seen when the scene is stretched vertically by `k`. Stretching
 * multiplies every height, so it multiplies the tangent of every angle: a body
 * hidden behind a ridge stays hidden.
 */
export function exaggerateEl(elDeg: number, k: number): number {
  if (k === 1) return elDeg;
  const e = Math.max(-89.999, Math.min(89.999, elDeg));
  return Math.atan(k * Math.tan(e * DEG)) / DEG;
}

/** Unit vector toward azimuth/elevation (degrees), after exaggeration `k`. */
export function skyDir(azDeg: number, elDeg: number, k = 1): Vec3 {
  const az = azDeg * DEG;
  const el = exaggerateEl(elDeg, k) * DEG;
  const c = Math.cos(el);
  return [c * Math.sin(az), Math.sin(el), -c * Math.cos(az)];
}

/** "NE 42°": where the camera is looking. */
export function heading(yawDeg: number, lang: Lang): string {
  const az = Math.round(wrapAz(yawDeg)) % 360;
  return `${compass(az, lang)} ${az}°`;
}

/** Opening view: toward the Sun, or the crest in front of it when it is hidden. */
export function initialView(sky: Sky, k: number): { yaw: number; pitch: number } {
  const el = Math.max(sky.sun.el, sky.sun.horizon);
  return { yaw: sky.sun.az, pitch: clampPitch(exaggerateEl(el, k)) };
}

/**
 * The horizon profile as a ring of crests around the site, for the relief past
 * the patches: x, crest height above the ground at the site and z per azimuth,
 * in metres. Each crest stands at its own distance (at least `minKm`, so it
 * falls behind the patch) at the height that gives the panorama's angle from
 * the camera on the mast.
 */
export function horizonRing(h: Horizon, minKm: number): Float32Array {
  const out = new Float32Array(h.nAz * 3);
  for (let i = 0; i < h.nAz; i++) {
    const az = ((i * 360) / h.nAz) * DEG;
    const d = Math.max(minKm, h.distanceKm[i]) * 1000;
    out[i * 3] = d * Math.sin(az);
    out[i * 3 + 1] = h.mastM + d * Math.tan(h.elevationDeg[i] * DEG);
    out[i * 3 + 2] = -d * Math.cos(az);
  }
  return out;
}

/**
 * The crest that hides the Sun in its azimuth, when it lies beyond the patch
 * (`beyondKm`): its distance and its height above the ground at the site, in
 * metres. Terrain closer than that is in the patch and the shader finds it.
 */
export function farBlocker(h: Horizon, azDeg: number, beyondKm: number): { distM: number; heightM: number } | null {
  const i = Math.round((wrapAz(azDeg) * h.nAz) / 360) % h.nAz;
  const d = h.distanceKm[i];
  if (!(d > beyondKm)) return null;
  return { distM: d * 1000, heightM: h.mastM + d * 1000 * Math.tan(h.elevationDeg[i] * DEG) };
}

export interface Patch {
  sizeKm: number;
  vertices: number;
  resolutionM: number;
  precomputed: boolean;
  /** Heights in metres above the site's tangent plane, row 0 on the north edge. */
  heights: Float32Array;
}

export async function fetchPatch(lat: number, lon: number, sizeKm: number, signal?: AbortSignal): Promise<Patch> {
  const r = await fetch(`/api/patch?lat=${lat}&lon=${lon}&size=${sizeKm}`, { signal });
  if (!r.ok) throw new Error(String(r.status));
  const vertices = Number(r.headers.get('X-Patch-Vertices'));
  const dn = new Int16Array(await r.arrayBuffer());
  if (!vertices || dn.length !== vertices * vertices) throw new Error('Unexpected patch');
  const heights = new Float32Array(dn.length);
  for (let i = 0; i < dn.length; i++) heights[i] = dn[i] * 0.5;
  return {
    sizeKm: Number(r.headers.get('X-Patch-Size-Km')),
    vertices,
    resolutionM: Number(r.headers.get('X-Patch-Resolution-M')),
    precomputed: r.headers.get('X-Patch-Precomputed') === '1',
    heights,
  };
}

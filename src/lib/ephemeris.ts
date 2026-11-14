// Sun and Earth as seen from the lunar surface.
//
// Positions come from astronomy-engine (VSOP87 + a truncated ELP lunar theory),
// and the Moon's orientation from the IAU rotation model, which includes the
// physical and optical librations that make Earth wobble in the lunar sky.
// Everything is expressed in the Moon-fixed frame (x through the mean
// sub-Earth point, z through the north pole) so a site is a constant vector.
import { Body, GeoMoon, GeoVector, RotationAxis, KM_PER_AU } from 'astronomy-engine';

export const MOON_RADIUS_KM = 1737.4;
export const SUN_RADIUS_KM = 695700;
export const EARTH_RADIUS_KM = 6371;
export const DEG = Math.PI / 180;

export type Vec3 = [number, number, number];

/** Moon-centred, Moon-fixed position vectors in km. */
export interface BodyVectors {
  sun: Vec3;
  earth: Vec3;
}

export function moonFixedVectors(date: Date): BodyVectors {
  const moon = GeoMoon(date); // geocentric, J2000 equator, AU
  const sun = GeoVector(Body.Sun, date, true);
  const axis = RotationAxis(Body.Moon, date);

  // Body axes in J2000: z = north pole, x = prime meridian.
  const z: Vec3 = [axis.north.x, axis.north.y, axis.north.z];
  const qn = Math.hypot(z[0], z[1]);
  const q: Vec3 = [-z[1] / qn, z[0] / qn, 0]; // ascending node of the lunar equator
  const m = cross(z, q);
  const w = axis.spin * DEG;
  const cw = Math.cos(w);
  const sw = Math.sin(w);
  const x: Vec3 = [q[0] * cw + m[0] * sw, q[1] * cw + m[1] * sw, q[2] * cw + m[2] * sw];
  const y = cross(z, x);

  const toFixed = (vx: number, vy: number, vz: number): Vec3 => [
    (vx * x[0] + vy * x[1] + vz * x[2]) * KM_PER_AU,
    (vx * y[0] + vy * y[1] + vz * y[2]) * KM_PER_AU,
    (vx * z[0] + vy * z[1] + vz * z[2]) * KM_PER_AU,
  ];

  return {
    sun: toFixed(sun.x - moon.x, sun.y - moon.y, sun.z - moon.z),
    earth: toFixed(-moon.x, -moon.y, -moon.z),
  };
}

export interface SiteFrame {
  /** Site position in km, Moon-fixed. */
  pos: Vec3;
  up: Vec3;
  north: Vec3;
  east: Vec3;
}

export function siteFrame(latDeg: number, lonDeg: number, heightKm = 0): SiteFrame {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const cl = Math.cos(lat);
  const sl = Math.sin(lat);
  const co = Math.cos(lon);
  const so = Math.sin(lon);
  const up: Vec3 = [cl * co, cl * so, sl];
  const r = MOON_RADIUS_KM + heightKm;
  return {
    pos: [up[0] * r, up[1] * r, up[2] * r],
    up,
    north: [-sl * co, -sl * so, cl],
    east: [-so, co, 0],
  };
}

export interface Topo {
  /** Degrees clockwise from local north. */
  az: number;
  /** Degrees above the ideal (smooth sphere) horizontal plane. */
  el: number;
  distKm: number;
}

export function topocentric(frame: SiteFrame, target: Vec3): Topo {
  const dx = target[0] - frame.pos[0];
  const dy = target[1] - frame.pos[1];
  const dz = target[2] - frame.pos[2];
  const dist = Math.hypot(dx, dy, dz);
  const u = (dx * frame.up[0] + dy * frame.up[1] + dz * frame.up[2]) / dist;
  const n = dx * frame.north[0] + dy * frame.north[1] + dz * frame.north[2];
  const e = dx * frame.east[0] + dy * frame.east[1] + dz * frame.east[2];
  let az = Math.atan2(e, n) / DEG;
  if (az < 0) az += 360;
  return { az, el: Math.asin(Math.max(-1, Math.min(1, u))) / DEG, distKm: dist };
}

/** Selenographic latitude/longitude of the point directly beneath a body. */
export function subPoint(v: Vec3): { lat: number; lon: number } {
  const r = Math.hypot(v[0], v[1], v[2]);
  return { lat: Math.asin(v[2] / r) / DEG, lon: Math.atan2(v[1], v[0]) / DEG };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

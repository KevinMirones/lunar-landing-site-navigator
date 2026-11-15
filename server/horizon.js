// Terrain horizon mask: for every azimuth, the highest elevation angle at which
// lunar terrain blocks the sky as seen from the site. No atmosphere, so no
// refraction: the horizon is pure geometry (terrain + curvature of the sphere).
import { MOON_RADIUS_KM as R, POLAR_COVERAGE_MAX_LAT, heightAtUnit, loadDem, terrainResolutionAt } from './dem.js';

const DEG = Math.PI / 180;
/** Limit of the polar map and the point search. Horizons reach further when the whole-Moon grid is installed (S17). */
export const COVERAGE_MAX_LAT = POLAR_COVERAGE_MAX_LAT;
const MAX_RANGE_KM = 400;

/** Dip of a smooth sphere's horizon for an eye `heightKm` above the surface (negative degrees). */
export function sphereDipDeg(heightKm) {
  return -Math.acos(R / (R + heightKm)) / DEG;
}

// Distances sampled along a ray, with the cosine and sine of the arc each one spans.
// They depend only on the starting step, so every azimuth of every horizon shares them.
const stepTables = new Map();
function raySteps(halfCell) {
  let t = stepTables.get(halfCell);
  if (!t) {
    const d = [];
    for (let x = halfCell; x < MAX_RANGE_KM; x += Math.max(halfCell, x * 0.01)) d.push(x);
    t = { d: Float64Array.from(d), cos: Float64Array.from(d, (x) => Math.cos(x / R)), sin: Float64Array.from(d, (x) => Math.sin(x / R)) };
    stepTables.set(halfCell, t);
  }
  return t;
}

/** A horizon as plain JSON: angles to a thousandth of a degree, distances to 10 m. */
export function serializeHorizon(h) {
  return {
    ...h,
    elevationDeg: Array.from(h.elevationDeg, (v) => Math.round(v * 1000) / 1000),
    distanceKm: Array.from(h.distanceKm, (v) => Math.round(v * 100) / 100),
  };
}

export function computeHorizon(latDeg, lonDeg, mastM = 2, nAz = 720) {
  const mastKm = Math.max(0, mastM) / 1000;
  const elev = new Float32Array(nAz);
  const dist = new Float32Array(nAz);

  loadDem();
  const resolutionM = terrainResolutionAt(latDeg, lonDeg);
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  // Moon-fixed unit vectors: site position, local north, local east.
  const p0 = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const h0 = resolutionM === null ? NaN : heightAtUnit(p0[0], p0[1], p0[2]);

  if (Number.isNaN(h0)) {
    elev.fill(sphereDipDeg(mastKm));
    return { model: 'sphere', siteElevationM: 0, mastM, nAz, elevationDeg: elev, distanceKm: dist };
  }

  const n = [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)];
  const e = [-Math.sin(lon), Math.cos(lon), 0];
  // The ray starts half a cell out and advances half a cell at a time, then 1% of the distance:
  // 10 m steps over 20 m terrain, 120 m steps over 240 m terrain, 237 m over the whole-Moon grid.
  const halfCell = resolutionM / 2000;
  const r0 = R + h0 + mastKm;
  const steps = raySteps(halfCell);
  const count = steps.d.length;

  for (let a = 0; a < nAz; a++) {
    const az = ((a * 360) / nAz) * DEG;
    const ca = Math.cos(az);
    const sa = Math.sin(az);
    const dx = n[0] * ca + e[0] * sa;
    const dy = n[1] * ca + e[1] * sa;
    const dz = n[2] * ca + e[2] * sa;

    // The elevation angle grows with its tangent, so the tangent is compared
    // and the angle is taken once, at the end.
    let best = -Infinity;
    let bestI = -1;
    for (let i = 0; i < count; i++) {
      const cg = steps.cos[i];
      const sg = steps.sin[i];
      // Polar grids first, then the whole-Moon grid if installed.
      const h = heightAtUnit(p0[0] * cg + dx * sg, p0[1] * cg + dy * sg, p0[2] * cg + dz * sg);
      if (h !== h) break; // NaN: outside every grid
      const r1 = R + h;
      const tan = (r1 * cg - r0) / (r1 * sg);
      if (tan > best) {
        best = tan;
        bestI = i;
      }
    }
    elev[a] = bestI < 0 ? sphereDipDeg(mastKm) : Math.atan(best) / DEG;
    dist[a] = bestI < 0 ? 0 : steps.d[bestI];
  }

  return { model: 'lola', resolutionM, siteElevationM: Math.round(h0 * 1000), mastM, nAz, elevationDeg: elev, distanceKm: dist };
}

// Terrain horizon mask: for every azimuth, the highest elevation angle at which
// lunar terrain blocks the sky as seen from the site. No atmosphere, so no
// refraction: the horizon is pure geometry (terrain + curvature of the sphere).
import { MOON_RADIUS_KM as R, DEM_MIN_LAT, loadDem, heightAtXY, heightAtLatLon } from './dem.js';

const DEG = Math.PI / 180;
export const COVERAGE_MAX_LAT = -80; // sites poleward of this get a real-terrain horizon
const MAX_RANGE_KM = 400;
const EDGE_Z = Math.sin(DEM_MIN_LAT * DEG);

/** Dip of a smooth sphere's horizon for an eye `heightKm` above the surface (negative degrees). */
export function sphereDipDeg(heightKm) {
  return -Math.acos(R / (R + heightKm)) / DEG;
}

export function computeHorizon(latDeg, lonDeg, mastM = 2, nAz = 720) {
  const mastKm = Math.max(0, mastM) / 1000;
  const elev = new Float32Array(nAz);
  const dist = new Float32Array(nAz);

  if (latDeg > COVERAGE_MAX_LAT || !loadDem()) {
    elev.fill(sphereDipDeg(mastKm));
    return { model: 'sphere', siteElevationM: 0, mastM, nAz, elevationDeg: elev, distanceKm: dist };
  }

  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  // Moon-fixed unit vectors: site position, local north, local east.
  const p0 = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const n = [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)];
  const e = [-Math.sin(lon), Math.cos(lon), 0];

  const h0 = heightAtLatLon(latDeg, lonDeg);
  const r0 = R + h0 + mastKm;

  for (let a = 0; a < nAz; a++) {
    const az = ((a * 360) / nAz) * DEG;
    const ca = Math.cos(az);
    const sa = Math.sin(az);
    const dx = n[0] * ca + e[0] * sa;
    const dy = n[1] * ca + e[1] * sa;
    const dz = n[2] * ca + e[2] * sa;

    let best = -Infinity;
    let bestD = 0;
    let d = 0.12;
    while (d < MAX_RANGE_KM) {
      const g = d / R;
      const cg = Math.cos(g);
      const sg = Math.sin(g);
      const z = p0[2] * cg + dz * sg;
      if (z > EDGE_Z) break; // left the DEM
      const x = p0[0] * cg + dx * sg;
      const y = p0[1] * cg + dy * sg;
      const k = (2 * R) / (1 - z);
      const h = heightAtXY(k * y, k * x);
      if (Number.isNaN(h)) break;
      const r1 = R + h;
      const ang = Math.atan2(r1 * cg - r0, r1 * sg);
      if (ang > best) {
        best = ang;
        bestD = d;
      }
      d += Math.max(0.12, d * 0.01);
    }
    elev[a] = best === -Infinity ? sphereDipDeg(mastKm) : best / DEG;
    dist[a] = bestD;
  }

  return { model: 'lola-240m', siteElevationM: Math.round(h0 * 1000), mastM, nAz, elevationDeg: elev, distanceKm: dist };
}

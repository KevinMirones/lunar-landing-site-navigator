// S11: standing on the site, at the height of the mast, looking around while
// the Sun and Earth move over the real relief. Two nested terrain patches
// (8 and 64 km) carry the ground; past them, the horizon profile stands as a
// ring of crests, so the skyline matches the panorama exactly. Shadows come
// from a ray marched toward the Sun over the patches, once per patch vertex,
// into a light map: conventional shadow maps fail with light this low.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EARTH_THRESHOLD, SUN_THRESHOLD, type Horizon, type SiteSeries, type Sky } from '../lib/series';
import { clampPitch, farBlocker, fetchPatch, heading, horizonRing, initialView, skyDir, wrapAz, type Patch } from '../lib/terrain3d';
import { fmtDate, pct, useLang, useTr } from '../lib/util';

export interface Terrain3DProps {
  siteName: string;
  lat: number;
  lon: number;
  /** Undefined while the horizon for a new mast height is on its way; the view keeps the last one. */
  horizon: Horizon | undefined;
  sky: Sky | null;
  series: SiteSeries | null;
  now: number;
  landing: number;
  durationMs: number;
  playing: boolean;
  speed: number;
  speeds: number[];
  mast: number;
  masts: number[];
  onTogglePlay: () => void;
  onSpeed: (s: number) => void;
  /** Time since landing, in ms. */
  onScrub: (elapsedMs: number) => void;
  onMast: (m: number) => void;
  onClose: () => void;
}

const DEG = Math.PI / 180;
const NEAR_KM = 8;
const FAR_KM = 64;
const RING_MIN_KM = 32.5; // the crest ring stands just past the round edge of the far patch
const SKY_R = 1e6; // metres: Sun, Earth, tracks and stars live on this sphere
const FOV = 60; // vertical, degrees
const ENLARGE = 4; // Sun and Earth unless "true scale" is on
const KEY_STEP = 5; // degrees per arrow key press
const MAST_ANIM_MS = 600;

// ---------- shaders ----------

// Light map: for one patch vertex per pixel, the fraction of the solar disc
// above the terrain along the ray toward the Sun. Real scale, site frame
// (x east, y north, z up), metres. The crest that hides the Sun past the
// patch, if any, is taken from the site's horizon profile.
const LIGHT_VERT = `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const LIGHT_FRAG = `
precision highp float;
uniform sampler2D uNear, uFar;
uniform float uNearHalf, uFarHalf, uHalf, uN;
uniform vec3 uSun;
uniform float uSunR, uBlockDist, uBlockH, uGrowth;
uniform int uSteps;
vec2 uvOf(vec2 p, float h){ return (vec2(p.x + h, h - p.y) / (2.0*h) * (uN - 1.0) + 0.5) / uN; }
float H(vec2 p){
  float near = texture2D(uNear, uvOf(p, uNearHalf)).r;
  float far = texture2D(uFar, uvOf(p, uFarHalf)).r;
  return max(abs(p.x), abs(p.y)) < uNearHalf ? near : far;
}
void main(){
  vec2 idx = floor(gl_FragCoord.xy);
  float cell = 2.0*uHalf/(uN - 1.0);
  vec2 p = vec2(-uHalf + idx.x*cell, uHalf - idx.y*cell);
  float z0 = H(p) + 1.5;
  float horiz = length(uSun.xy);
  vec2 dir = horiz > 1e-6 ? uSun.xy/horiz : vec2(0.0, 1.0);
  float el = asin(clamp(uSun.z, -1.0, 1.0));
  float m = -10.0;
  float st = 12.0;
  float t = st;
  for (int i = 0; i < 200; i++) {
    if (i >= uSteps) break;
    vec2 q = p + dir*t;
    if (length(q) > uFarHalf) break;
    m = max(m, (H(q) - z0)/t);
    st *= uGrowth;
    t += st;
  }
  float hz = atan(m);
  if (uBlockDist > 0.0) {
    float d = uBlockDist - dot(p, dir);
    if (d > 500.0) hz = max(hz, atan((uBlockH - z0)/d));
  }
  gl_FragColor = vec4(smoothstep(hz - uSunR, hz + uSunR, el), 0.0, 0.0, 1.0);
}`;

const TERRAIN_VERT = `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vViewPos;
varying vec2 vGround;
void main(){
  vUv = uv;
  vGround = vec2(position.x, -position.z);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}`;
// Distant crests: the face turned to the viewer, taken as a 30-degree slope and
// lit with the same photometry as the ground. A crest counts as sunlit when the
// Sun is above the ideal horizon: high ground sees past what hides the site.
// `dir` is the horizontal direction from the site (east, north); `sunH` holds
// the Sun's horizontal direction and the sine of its elevation. Linear colour.
const CREST_SHADE = `
vec3 crestShade(vec2 dir, vec3 sunH){
  float cosEl = sqrt(max(0.0, 1.0 - sunH.z*sunH.z));
  vec3 sun = vec3(sunH.xy*cosEl, sunH.z);
  vec3 v = vec3(-dir, 0.0);
  vec3 n = normalize(vec3(-dir*0.5, 0.866));
  float mu0 = max(dot(n, sun), 0.0);
  float ls = mu0/(mu0 + max(dot(n, v), 0.05));
  float f = exp(-0.0125*acos(clamp(dot(v, sun), -1.0, 1.0))*57.2958);
  float lit = smoothstep(-0.004, 0.01, sunH.z);
  return vec3(0.6, 0.585, 0.56) * (vec3(1.0, 0.95, 0.86)*2.6*ls*f*lit + vec3(0.03, 0.033, 0.04));
}`;

// Regolith photometry, simplified: Lommel-Seeliger keeps ground lit by a Sun at
// 1.5 degrees from turning black, and the phase function makes it bright with
// the Sun behind you and dark against the light, as on the real Moon.
// The LOLA cells are 240 m (20 m at best): finer relief is procedural detail,
// bumps and albedo only, faded out where a pixel covers more than they do.
// The last kilometres of the far patch fade into the crest shading, so the
// patch's round edge does not show against the ring behind it.
const TERRAIN_FRAG = `
#include <logdepthbuf_pars_fragment>
uniform sampler2D uLight;
uniform vec3 uSunV;
uniform vec3 uSunH;
uniform float uSiteFrac;
uniform float uK;
${CREST_SHADE}
varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vViewPos;
varying vec2 vGround;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0 - 2.0*f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// Height of the procedural relief (m) for wavelengths from 600 m down to 8 m, each faded by the pixel footprint.
float detail(vec2 p, float px){
  float h = 0.0;
  float w = 600.0;
  for (int o = 0; o < 6; o++) {
    h += (noise(p/w + float(o)*17.3) - 0.5) * w * 0.05 * (1.0 - smoothstep(0.15*w, 0.4*w, px));
    w *= 0.42;
  }
  return h;
}
void main(){
  #include <logdepthbuf_fragment>
  float dist = length(vGround);
  // Around the module the site's own state rules, so the ground goes dark exactly when it says "hidden".
  float direct = mix(uSiteFrac, texture2D(uLight, vUv).r, smoothstep(150.0, 1500.0, dist));
  float px = length(fwidth(vGround));
  float e = max(0.5, 0.25*px);
  float h0 = detail(vGround, px);
  vec2 g = vec2(detail(vGround + vec2(e, 0.0), px) - h0, detail(vGround + vec2(0.0, e), px) - h0) / e;
  vec3 east = normalize((viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  vec3 north = normalize((viewMatrix * vec4(0.0, 0.0, -1.0, 0.0)).xyz);
  vec3 n = normalize(normalize(vNormalV) - uK*(g.x*east + g.y*north));
  vec3 v = normalize(-vViewPos);
  float mu0 = max(dot(n, uSunV), 0.0);
  float mu = max(dot(n, v), 0.05);
  float ls = mu0/(mu0 + mu);
  float phase = acos(clamp(dot(v, uSunV), -1.0, 1.0)) * 57.2958;
  float f = exp(-0.0125*phase);
  float albedo = 0.86 + 0.28*noise(vGround/900.0) + 0.12*(noise(vGround/70.0) - 0.5)*(1.0 - smoothstep(10.0, 30.0, px));
  vec3 col = vec3(0.6, 0.585, 0.56) * albedo * (vec3(1.0, 0.95, 0.86)*2.6*ls*f*direct + vec3(0.02, 0.023, 0.03));
  if (dist > 25000.0) col = mix(col, crestShade(vGround/dist, uSunH), smoothstep(25000.0, 32000.0, dist));
  gl_FragColor = vec4(pow(col, vec3(1.0/2.2)), 1.0);
}`;

const RING_VERT = `
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec2 aDir;
varying vec2 vDir;
void main(){
  vDir = aDir;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}`;
const RING_FRAG = `
#include <logdepthbuf_pars_fragment>
uniform vec3 uSunH;
varying vec2 vDir;
${CREST_SHADE}
void main(){
  #include <logdepthbuf_fragment>
  vec3 col = crestShade(vDir, uSunH);
  gl_FragColor = vec4(pow(col, vec3(1.0/2.2)), 1.0);
}`;

// ---------- helpers ----------

function discTexture(stops: [number, string][], size = 128): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, color] of stops) grad.addColorStop(at, color);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function halfTexture(p: Patch): THREE.DataTexture {
  const half = new Uint16Array(p.heights.length);
  for (let i = 0; i < half.length; i++) half[i] = THREE.DataUtils.toHalfFloat(p.heights[i]);
  const t = new THREE.DataTexture(half, p.vertices, p.vertices, THREE.RedFormat, THREE.HalfFloatType);
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

/** Bilinear height (m) of a patch at plane point (x east, y north), metres. */
function sampleAt(p: Patch, x: number, y: number): number {
  const n = p.vertices;
  const half = p.sizeKm * 500;
  const cell = (2 * half) / (n - 1);
  const c = Math.max(0, Math.min(n - 1.0001, (x + half) / cell));
  const r = Math.max(0, Math.min(n - 1.0001, (half - y) / cell));
  const c0 = Math.floor(c);
  const r0 = Math.floor(r);
  const fc = c - c0;
  const fr = r - r0;
  const h = p.heights;
  const i = r0 * n + c0;
  return (h[i] * (1 - fc) + h[i + 1] * fc) * (1 - fr) + (h[i + n] * (1 - fc) + h[i + n + 1] * fc) * fr;
}

/**
 * The near patch, with its last 250 m eased into the far patch: its border
 * then lies exactly on the edges of the far mesh around the hole, with no crack.
 */
function stitched(near: Patch, far: Patch): Patch {
  const n = near.vertices;
  const half = near.sizeKm * 500;
  const cell = (2 * half) / (n - 1);
  const heights = new Float32Array(near.heights);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = -half + i * cell;
      const y = half - j * cell;
      const edge = half - Math.max(Math.abs(x), Math.abs(y));
      if (edge >= 250) continue;
      const w = edge / 250;
      heights[j * n + i] = sampleAt(far, x, y) * (1 - w) + near.heights[j * n + i] * w;
    }
  }
  return { ...near, heights };
}

function gridGeometry(p: Patch, keep: (x: number, y: number) => boolean): THREE.BufferGeometry {
  const n = p.vertices;
  const half = p.sizeKm * 500;
  const cell = (2 * half) / (n - 1);
  const pos = new Float32Array(n * n * 3);
  const uv = new Float32Array(n * n * 2);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const k = j * n + i;
      pos[k * 3] = -half + i * cell;
      pos[k * 3 + 1] = p.heights[k];
      pos[k * 3 + 2] = -(half - j * cell);
      uv[k * 2] = (i + 0.5) / n;
      uv[k * 2 + 1] = (j + 0.5) / n;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      if (!keep(-half + (i + 0.5) * cell, half - (j + 0.5) * cell)) continue;
      const a = j * n + i;
      const c = a + n;
      index.push(a, c, a + 1, a + 1, c, c + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(index), 1));
  g.computeVertexNormals();
  return g;
}

/** Growth of the ray step so that `steps` steps of a 12 m first step reach 46 km, the far patch's corner. */
function rayGrowth(steps: number): number {
  let lo = 1.0001;
  let hi = 1.5;
  for (let k = 0; k < 40; k++) {
    const g = (lo + hi) / 2;
    if ((12 * (g ** steps - 1)) / (g - 1) > 46000) hi = g;
    else lo = g;
  }
  return hi;
}

// ---------- the stage: everything three.js, built once per opening ----------

interface Stage {
  setPatches: (near: Patch, far: Patch) => void;
  setRing: (h: Horizon) => void;
  setSky: (sky: Sky, h: Horizon, k: number, trueScale: boolean) => void;
  setTracks: (series: SiteSeries | null, k: number) => void;
  setExaggeration: (k: number) => void;
  setMast: (m: number, animate: boolean) => void;
  look: (yaw: number, pitch: number) => void;
  view: () => { yaw: number; pitch: number };
  dispose: () => void;
}

function createStage(canvas: HTMLCanvasElement, wrap: HTMLElement, onView: (yaw: number) => void): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
  const small = () => wrap.clientWidth < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small() ? 1.5 : 2));
  renderer.setClearColor(0x040508, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.3, SKY_R * 1.2);
  camera.rotation.order = 'YXZ';
  const world = new THREE.Group(); // terrain and crest ring, stretched vertically by the exaggeration
  scene.add(world);

  let k = 1;
  let yaw = 0;
  let pitch = 0;
  let mastShown = 2;
  let mastAnim: { from: number; to: number; start: number } | null = null;
  let dirty = true;
  let lightDirty = true;
  let lastSun = new THREE.Vector3(0, 0, -1);
  const sunWorld = new THREE.Vector3(0, 0, -1); // exaggerated, scene frame
  const sunSite = new THREE.Vector3(0, 1, 0); // real, site frame (x east, y north, z up)

  // Stars: decoration for orientation, not a catalogue.
  {
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.sin(i * 127.1) * 43758.5453;
      const b = Math.sin(i * 311.7) * 24634.6345;
      const u = a - Math.floor(a);
      const v = b - Math.floor(b);
      const th = 2 * Math.PI * u;
      const z = 2 * v - 1;
      const r = Math.sqrt(1 - z * z);
      pos.set([r * Math.cos(th) * SKY_R * 1.05, z * SKY_R * 1.05, r * Math.sin(th) * SKY_R * 1.05], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xece7db, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.5, depthWrite: false })));
  }

  // Sun and Earth.
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: discTexture([[0, 'rgba(255,214,120,0.55)'], [0.35, 'rgba(255,194,71,0.18)'], [1, 'rgba(255,194,71,0)']]), depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTexture([[0, '#fffaf0'], [0.6, '#fff1c8'], [0.9, '#ffd77a'], [0.97, '#ffc247'], [1, 'rgba(255,194,71,0)']]), depthWrite: false }));
  const earthDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTexture([[0, '#9ad4ff'], [0.75, '#5db8ff'], [0.95, '#3f8fd6'], [1, 'rgba(63,143,214,0)']]), depthWrite: false }));
  scene.add(sunGlow, sunDisc, earthDisc);

  // Paths of the Sun and Earth over the scenario.
  const trackMat = (color: string) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false });
  const sunTrack = new THREE.Line(new THREE.BufferGeometry(), trackMat('#ffc247'));
  const earthTrack = new THREE.Line(new THREE.BufferGeometry(), trackMat('#5db8ff'));
  scene.add(sunTrack, earthTrack);
  // Paths first, then the bodies over them, as in the panorama.
  sunTrack.renderOrder = earthTrack.renderOrder = 1;
  sunGlow.renderOrder = 2;
  sunDisc.renderOrder = earthDisc.renderOrder = 3;

  // Crest ring: the relief past the patches.
  const ringMat = new THREE.ShaderMaterial({ vertexShader: RING_VERT, fragmentShader: RING_FRAG, uniforms: { uSunH: { value: new THREE.Vector3(0, 1, 0) } }, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.BufferGeometry(), ringMat);
  const rim = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb9b4a8, transparent: true, opacity: 0.5 }));
  ring.frustumCulled = rim.frustumCulled = false;
  world.add(ring, rim);

  // Terrain patches and their light maps.
  const LIGHT_N = 257;
  const lightTarget = () => new THREE.WebGLRenderTarget(LIGHT_N, LIGHT_N, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  const rtNear = lightTarget();
  const rtFar = lightTarget();
  const steps = small() ? 90 : 160;
  const lightMat = new THREE.ShaderMaterial({
    vertexShader: LIGHT_VERT,
    fragmentShader: LIGHT_FRAG,
    uniforms: {
      uNear: { value: null },
      uFar: { value: null },
      uNearHalf: { value: NEAR_KM * 500 },
      uFarHalf: { value: FAR_KM * 500 },
      uHalf: { value: 0 },
      uN: { value: LIGHT_N },
      uSun: { value: sunSite },
      uSunR: { value: 0.266 * DEG },
      uBlockDist: { value: 0 },
      uBlockH: { value: 0 },
      uGrowth: { value: rayGrowth(steps) },
      uSteps: { value: steps },
    },
    depthTest: false,
    depthWrite: false,
  });
  const lightScene = new THREE.Scene();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lightMat);
  quad.frustumCulled = false;
  lightScene.add(quad);
  const lightCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const terrainMat = (rt: THREE.WebGLRenderTarget) =>
    new THREE.ShaderMaterial({
      vertexShader: TERRAIN_VERT,
      fragmentShader: TERRAIN_FRAG,
      uniforms: { uLight: { value: rt.texture }, uSunV: { value: new THREE.Vector3(0, 1, 0) }, uSunH: ringMat.uniforms.uSunH, uSiteFrac: { value: 1 }, uK: { value: 1 } },
    });
  const nearMesh = new THREE.Mesh(new THREE.BufferGeometry(), terrainMat(rtNear));
  const farMesh = new THREE.Mesh(new THREE.BufferGeometry(), terrainMat(rtFar));
  nearMesh.visible = farMesh.visible = false;
  world.add(nearMesh, farMesh);
  let heightTex: THREE.DataTexture[] = [];

  const renderLight = () => {
    if (!nearMesh.visible) return;
    const u = lightMat.uniforms;
    for (const [rt, half] of [
      [rtNear, NEAR_KM * 500],
      [rtFar, FAR_KM * 500],
    ] as const) {
      u.uHalf.value = half;
      renderer.setRenderTarget(rt);
      renderer.render(lightScene, lightCam);
    }
    renderer.setRenderTarget(null);
  };

  const resize = () => {
    const w = Math.max(1, wrap.clientWidth);
    const h = Math.max(1, wrap.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();

  let raf = 0;
  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    if (mastAnim) {
      const f = Math.min(1, (t - mastAnim.start) / MAST_ANIM_MS);
      const e = f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
      mastShown = mastAnim.from + (mastAnim.to - mastAnim.from) * e;
      if (f >= 1) mastAnim = null;
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    if (lightDirty) {
      renderLight();
      lightDirty = false;
    }
    camera.position.set(0, k * mastShown, 0);
    camera.rotation.set(pitch * DEG, -yaw * DEG, 0);
    camera.updateMatrixWorld();
    const sunView = sunWorld.clone().transformDirection(camera.matrixWorldInverse);
    for (const m of [nearMesh, farMesh]) (m.material as THREE.ShaderMaterial).uniforms.uSunV.value.copy(sunView);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  const placeBody = (disc: THREE.Sprite, b: Sky['sun'], scale: number) => {
    const d = skyDir(b.az, b.el, k);
    disc.position.set(d[0] * SKY_R, d[1] * SKY_R, d[2] * SKY_R);
    const s = 2 * SKY_R * Math.tan(b.radius * scale * DEG);
    disc.scale.set(s, s, 1);
  };

  let lastSky: { sky: Sky; h: Horizon; trueScale: boolean } | null = null;
  let lastSeries: SiteSeries | null = null;

  const stage: Stage = {
    setPatches(near, far) {
      for (const t of heightTex) t.dispose();
      const joined = stitched(near, far);
      heightTex = [halfTexture(joined), halfTexture(far)];
      lightMat.uniforms.uNear.value = heightTex[0];
      lightMat.uniforms.uFar.value = heightTex[1];
      const inner = NEAR_KM * 500;
      const outer = FAR_KM * 500;
      nearMesh.geometry.dispose();
      farMesh.geometry.dispose();
      nearMesh.geometry = gridGeometry(joined, () => true);
      farMesh.geometry = gridGeometry(far, (x, y) => !(Math.abs(x) < inner && Math.abs(y) < inner) && Math.hypot(x, y) <= outer);
      nearMesh.visible = farMesh.visible = true;
      lightDirty = dirty = true;
    },
    setRing(h) {
      const pts = horizonRing(h, RING_MIN_KM);
      const n = h.nAz;
      const pos = new Float32Array((n + 1) * 2 * 3);
      const dir = new Float32Array((n + 1) * 2 * 2);
      const top = new Float32Array((n + 1) * 3);
      for (let c = 0; c <= n; c++) {
        const i = c % n;
        const x = pts[i * 3];
        const y = pts[i * 3 + 1];
        const z = pts[i * 3 + 2];
        const d = Math.hypot(x, z);
        pos.set([x, y, z, x, y - d, z], c * 6); // crest, and 45 degrees below it
        dir.set([x / d, -z / d, x / d, -z / d], c * 4); // horizontal unit vector, east/north
        top.set([x, y, z], c * 3);
      }
      const index: number[] = [];
      for (let c = 0; c < n; c++) {
        const a = c * 2;
        index.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('aDir', new THREE.BufferAttribute(dir, 2));
      g.setIndex(index);
      ring.geometry.dispose();
      ring.geometry = g;
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.BufferAttribute(top, 3));
      rim.geometry.dispose();
      rim.geometry = rg;
      lightDirty = dirty = true;
    },
    setSky(sky, h, kk, trueScale) {
      lastSky = { sky, h, trueScale };
      k = kk;
      world.scale.set(1, k, 1);
      const scale = trueScale ? 1 : ENLARGE;
      placeBody(sunDisc, sky.sun, scale);
      placeBody(earthDisc, sky.earth, scale);
      sunGlow.position.copy(sunDisc.position);
      const glow = 2 * SKY_R * Math.tan(Math.max(2.2, sky.sun.radius * scale * 5) * DEG);
      sunGlow.scale.set(glow, glow, 1);
      sunGlow.material.opacity = 0.35 + 0.65 * sky.sun.frac;

      const d = skyDir(sky.sun.az, sky.sun.el, k);
      sunWorld.set(d[0], d[1], d[2]);
      const real = skyDir(sky.sun.az, sky.sun.el);
      sunSite.set(real[0], -real[2], real[1]);
      ringMat.uniforms.uSunH.value.set(real[0] / Math.hypot(real[0], real[2]), -real[2] / Math.hypot(real[0], real[2]), real[1]);
      for (const m of [nearMesh, farMesh]) {
        const mu = (m.material as THREE.ShaderMaterial).uniforms;
        mu.uSiteFrac.value = sky.sun.frac;
        mu.uK.value = k;
      }
      const u = lightMat.uniforms;
      u.uSunR.value = sky.sun.radius * DEG;
      const block = farBlocker(h, sky.sun.az, FAR_KM / 2);
      const blockDist = block?.distM ?? 0;
      const blockH = block?.heightM ?? 0;
      if (sunSite.angleTo(lastSun) > 0.005 * DEG || blockDist !== u.uBlockDist.value || blockH !== u.uBlockH.value) {
        lastSun = sunSite.clone();
        lightDirty = true;
      }
      u.uBlockDist.value = blockDist;
      u.uBlockH.value = blockH;
      dirty = true;
    },
    setTracks(series, kk) {
      lastSeries = series;
      const build = (line: THREE.Line, az?: Float32Array, el?: Float32Array) => {
        line.geometry.dispose();
        const g = new THREE.BufferGeometry();
        if (series && az && el) {
          const stride = Math.max(1, Math.floor(series.n / 2000));
          const count = Math.ceil(series.n / stride);
          const pos = new Float32Array(count * 3);
          const r = SKY_R * 0.995;
          for (let c = 0, i = 0; i < series.n; i += stride, c++) {
            const v = skyDir(az[i], el[i], kk);
            pos.set([v[0] * r, v[1] * r, v[2] * r], c * 3);
          }
          g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        }
        line.geometry = g;
      };
      build(sunTrack, series?.sunAz, series?.sunEl);
      build(earthTrack, series?.earthAz, series?.earthEl);
      dirty = true;
    },
    setExaggeration(kk) {
      if (kk === k) return;
      // The pitch stays: the horizon is near 0 degrees, so it stays in view.
      k = kk;
      if (lastSky) stage.setSky(lastSky.sky, lastSky.h, kk, lastSky.trueScale);
      stage.setTracks(lastSeries, kk);
    },
    setMast(m, animate) {
      if (!animate) {
        mastShown = m;
        mastAnim = null;
      } else if (m !== (mastAnim?.to ?? mastShown)) {
        mastAnim = { from: mastShown, to: m, start: performance.now() };
      }
      dirty = true;
    },
    look(y, p) {
      yaw = wrapAz(y);
      pitch = clampPitch(p);
      onView(yaw);
      wrap.dataset.pitch = String(Math.round(pitch)); // read by the browser checks
      dirty = true;
    },
    view: () => ({ yaw, pitch }),
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | undefined;
        if (mat) {
          (mat as THREE.SpriteMaterial).map?.dispose();
          mat.dispose();
        }
      });
      for (const t of heightTex) t.dispose();
      rtNear.dispose();
      rtFar.dispose();
      lightMat.dispose();
      quad.geometry.dispose();
      // No forceContextLoss: in development React mounts twice on the same canvas.
      renderer.dispose();
    },
  };
  return stage;
}

// ---------- the component ----------

type PatchState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; resolutionM: number; precomputed: boolean };

export default function Terrain3D(props: Terrain3DProps) {
  const { siteName, lat, lon, series, now, landing, durationMs, playing, speed, speeds, mast, masts, onTogglePlay, onSpeed, onScrub, onMast, onClose } = props;
  const tr = useTr();
  const lang = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headingRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [noWebgl, setNoWebgl] = useState(false);
  const [patch, setPatch] = useState<PatchState>({ status: 'loading' });
  const [trueScale, setTrueScale] = useState(false);
  const [k, setK] = useState(1);
  const [dragging, setDragging] = useState(false);

  // While a new mast's horizon is on its way, keep showing the last one.
  const last = useRef<{ horizon: Horizon; sky: Sky } | null>(null);
  if (props.horizon && props.sky) last.current = { horizon: props.horizon, sky: props.sky };
  const horizon = last.current?.horizon;
  const sky = last.current?.sky;

  const langRef = useRef(lang);
  langRef.current = lang;
  const writeHeading = (yaw: number) => {
    if (headingRef.current) headingRef.current.textContent = heading(yaw, langRef.current);
  };

  // Build the scene once; open looking at the Sun.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    let stage: Stage;
    try {
      stage = createStage(canvasRef.current!, wrapRef.current!, writeHeading);
    } catch {
      setNoWebgl(true);
      return () => {
        document.body.style.overflow = overflow;
      };
    }
    stageRef.current = stage;
    stage.setMast(mast, false);
    if (last.current) {
      const v = initialView(last.current.sky, 1);
      stage.look(v.yaw, v.pitch);
    }
    wrapRef.current?.parentElement?.focus();
    return () => {
      stage.dispose();
      stageRef.current = null;
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Terrain around the site.
  useEffect(() => {
    const ctl = new AbortController();
    setPatch({ status: 'loading' });
    Promise.all([fetchPatch(lat, lon, NEAR_KM, ctl.signal), fetchPatch(lat, lon, FAR_KM, ctl.signal)])
      .then(([near, far]) => {
        stageRef.current?.setPatches(near, far);
        setPatch({ status: 'ready', resolutionM: near.resolutionM, precomputed: near.precomputed });
      })
      .catch(() => {
        if (!ctl.signal.aborted) setPatch({ status: 'error' });
      });
    return () => ctl.abort();
  }, [lat, lon]);

  useEffect(() => {
    if (horizon) stageRef.current?.setRing(horizon);
  }, [horizon]);
  useEffect(() => {
    stageRef.current?.setExaggeration(k);
  }, [k]);
  useEffect(() => {
    if (sky && horizon) stageRef.current?.setSky(sky, horizon, k, trueScale);
  }, [sky, horizon, k, trueScale]);
  useEffect(() => {
    stageRef.current?.setTracks(series, k);
  }, [series, k]);
  useEffect(() => {
    stageRef.current?.setMast(mast, true);
  }, [mast]);
  useEffect(() => {
    const s = stageRef.current;
    if (s) writeHeading(s.view().yaw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Keyboard: Esc closes, arrows turn (except while a slider has the focus).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      const s = stageRef.current;
      if (!s || (e.target instanceof HTMLInputElement && e.target.type === 'range')) return;
      const turn = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, KEY_STEP], ArrowDown: [0, -KEY_STEP] }[e.key];
      if (!turn) return;
      e.preventDefault();
      const v = s.view();
      s.look(v.yaw + turn[0], v.pitch + turn[1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Drag to look around, as in Street View: the scene follows the pointer.
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const s = stageRef.current;
    if (!d || d.id !== e.pointerId || !s) return;
    const perPx = FOV / Math.max(1, e.currentTarget.clientHeight);
    const v = s.view();
    s.look(v.yaw - (e.clientX - d.x) * perPx, v.pitch + (e.clientY - d.y) * perPx);
    d.x = e.clientX;
    d.y = e.clientY;
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const sunText = !sky
    ? ''
    : sky.sun.frac > SUN_THRESHOLD
      ? `${tr('Sol visible', 'Sun visible')} ${pct(sky.sun.frac)}`
      : tr('Sol oculto', 'Sun hidden');
  const earthText = !sky ? '' : sky.earth.frac >= EARTH_THRESHOLD ? tr('Tierra visible', 'Earth visible') : tr('Tierra oculta', 'Earth hidden');
  const terrainText =
    patch.status === 'loading'
      ? tr('Cargando el relieve…', 'Loading the relief…')
      : patch.status === 'error'
        ? tr('Relieve cercano no disponible: solo el horizonte', 'Nearby relief unavailable: horizon only')
        : `${tr('Terreno', 'Terrain')} ${patch.resolutionM} m${patch.precomputed ? tr(' (precalculado)', ' (precomputed)') : ''}`;
  const elapsed = Math.max(0, Math.min(durationMs, now - landing));

  return (
    <div className="t3d" role="dialog" aria-modal="true" aria-label={tr(`Vista 3D desde ${siteName}`, `3D view from ${siteName}`)} tabIndex={-1}>
      <div
        ref={wrapRef}
        className={`t3d-stage${dragging ? ' dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <canvas ref={canvasRef} aria-label={tr('Paisaje alrededor del sitio con el Sol y la Tierra. Arrastra o usa las flechas para mirar alrededor.', 'Landscape around the site with the Sun and Earth. Drag or use the arrow keys to look around.')} />
      </div>

      <header className="t3d-top">
        <div className="t3d-title">
          <h2>
            {tr('El cielo desde', 'The sky from')} {siteName}
          </h2>
          <p className="num">{fmtDate(now, lang)}</p>
        </div>
        <button type="button" className="t3d-close" onClick={onClose} aria-label={tr('Cerrar la vista 3D', 'Close the 3D view')} title={tr('Cerrar (Esc)', 'Close (Esc)')}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {!noWebgl && (
        <p className="t3d-hud num">
          <span>
            {tr('Mirando al', 'Facing')} <span ref={headingRef} />
          </span>
          <span className="sun">{sunText}</span>
          <span className="earth">{earthText}</span>
          <span className="t3d-terrain">{terrainText}</span>
        </p>
      )}

      {noWebgl && (
        <div className="t3d-msg" role="alert">
          <p>
            {tr(
              'Este navegador o esta tarjeta gráfica no admite WebGL 2, que la vista 3D necesita. El resto de la herramienta sigue funcionando: cierra esta vista para volver.',
              'This browser or graphics card does not support WebGL 2, which the 3D view needs. The rest of the tool still works: close this view to go back.',
            )}
          </p>
        </div>
      )}

      <div className="t3d-bar">
        <div className="transport">
          <button type="button" className="play" onClick={onTogglePlay}>
            {playing ? tr('Pausar', 'Pause') : tr('Reproducir', 'Play')}
          </button>
          <div className="segmented" role="group" aria-label={tr('Velocidad', 'Speed')}>
            {speeds.map((s) => (
              <button key={s} type="button" aria-pressed={s === speed} onClick={() => onSpeed(s)}>
                {s < 1 ? '12 h/s' : `${s} d/s`}
              </button>
            ))}
          </div>
        </div>
        <label className="t3d-scrub">
          <span className="sr-only">{tr('Instante de la misión', 'Mission time')}</span>
          <input type="range" min={0} max={durationMs} step={Math.max(1, Math.round(durationMs / 2000))} value={elapsed} onChange={(e) => onScrub(Number(e.target.value))} />
        </label>
        <div className="t3d-options">
          <div className="segmented" role="group" aria-label={tr('Altura del mástil', 'Mast height')} title={tr('Altura del mástil', 'Mast height')}>
            {masts.map((m) => (
              <button key={m} type="button" aria-pressed={m === mast} onClick={() => onMast(m)}>
                {m} m
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label={tr('Exageración vertical', 'Vertical exaggeration')} title={tr('Exageración vertical del relieve', 'Vertical exaggeration of the relief')}>
            <button type="button" aria-pressed={k === 1} onClick={() => setK(1)}>
              {tr('Real', 'True')}
            </button>
            <button type="button" aria-pressed={k === 3} onClick={() => setK(3)}>
              ×3
            </button>
          </div>
          <div className="segmented">
            <button
              type="button"
              aria-pressed={trueScale}
              onClick={() => setTrueScale((v) => !v)}
              title={tr('El Sol y la Tierra a su tamaño real en el cielo (0.53° y 1.9°)', 'The Sun and Earth at their true size in the sky (0.53° and 1.9°)')}
            >
              {tr('Escala real', 'True scale')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

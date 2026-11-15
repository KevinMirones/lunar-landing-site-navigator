// Live shadow map of the lunar south pole. A WebGL2 fragment shader ray-marches
// the LOLA heightmap toward the Sun (or Earth) from every pixel, including the
// curvature of the Moon, so the map shows which ground can see the body right now.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEG, MOON_RADIUS_KM, type Vec3 } from '../lib/ephemeris';
import { MAX_LANDING_SLOPE_DEG, heatRange, valueOf, type Criterion, type SearchCell, type SearchResult } from '../lib/search';
import type { Site } from '../lib/sites';
import { fmtLatLon, pct, useSize, useTr, type Heightmap } from '../lib/util';

const VERT = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uH;
uniform vec2 uCenter, uHalf;
uniform float uExtent, uTexel, uDiscR;
uniform vec3 uDir;
uniform int uMode;
in vec2 vUv; out vec4 o;
const float R = ${MOON_RADIUS_KM.toFixed(1)};
float H(vec2 p){ return texture(uH, vec2(p.x/uExtent*0.5+0.5, 0.5-p.y/uExtent*0.5)).r; }
void main(){
  vec2 p = uCenter + (vUv*2.0-1.0)*uHalf;
  if (max(abs(p.x),abs(p.y)) > uExtent) { o = vec4(0.016,0.02,0.031,1.0); return; }
  float c = 2.0*atan(length(p)/(2.0*R));
  float lon = atan(p.x,p.y);
  float sc=sin(c), cc=cos(c), sl=sin(lon), cl=cos(lon);
  vec3 n = vec3(sc*cl, sc*sl, -cc);
  vec3 east = vec3(-sl, cl, 0.0);
  vec3 north = vec3(cc*cl, cc*sl, sc);
  float sinEl = dot(n,uDir);
  vec2 dir = normalize(dot(east,uDir)*vec2(cl,-sl) + dot(north,uDir)*vec2(sl,cl));
  float cosEl = sqrt(max(1e-6,1.0-sinEl*sinEl));
  float el = asin(clamp(sinEl,-1.0,1.0));

  // Highest terrain angle along the ray toward the body = local horizon.
  float h0 = H(p)+0.002;
  float t = 0.4, st = 0.4, m = -1.0;
  for (int i=0;i<150;i++){
    vec2 q = p+dir*t;
    if (max(abs(q.x),abs(q.y)) > uExtent) break;
    m = max(m,(H(q)-h0-t*t/(2.0*R))/t);
    st *= 1.022; t += st;
  }
  float hz = atan(m);
  float frac = smoothstep(hz-uDiscR, hz+uDiscR, el);

  float gx = (H(p+vec2(uTexel,0.0))-H(p-vec2(uTexel,0.0)))/(2.0*uTexel);
  float gy = (H(p+vec2(0.0,uTexel))-H(p-vec2(0.0,uTexel)))/(2.0*uTexel);
  vec3 nrm = normalize(vec3(-gx,-gy,1.0));
  float relief = 0.5+0.5*dot(nrm, normalize(vec3(-0.5,0.5,0.7)));
  vec3 col;
  if (uMode == 0) {
    float lam = max(0.0, dot(nrm, vec3(dir*cosEl, sinEl)));
    vec3 dark = vec3(0.075,0.08,0.10)*clamp(0.5+(relief-0.85)*3.2, 0.0, 1.3);
    vec3 lit = vec3(1.0,0.93,0.80)*clamp(0.15+2.4*lam,0.0,1.0);
    col = mix(dark, lit, frac);
  } else {
    float shade = clamp(0.5+(relief-0.85)*3.2, 0.0, 1.3);
    vec3 ground = vec3(0.20,0.205,0.22)*shade;
    vec3 link = vec3(0.30,0.66,1.0)*(0.25+0.75*shade);
    col = mix(ground, link, frac*0.9);
  }
  o = vec4(col,1.0);
}`;

interface Props {
  hm: Heightmap;
  sunDir: Vec3;
  earthDir: Vec3;
  mode: 'sun' | 'earth';
  sites: Site[];
  selectedId: string;
  pinned: string[];
  onSelect: (id: string) => void;
  onPick: (lat: number, lon: number) => void;
  /** Result of a search around the active point, drawn as a heat map. */
  heat?: Heat | null;
}

export interface Heat {
  result: SearchResult;
  criterion: Criterion;
  picks: SearchCell[];
}

const HEAT_RGB: Record<Criterion, string> = { sun: '255,194,71', earth: '93,184,255', score: '236,231,219' };

interface View {
  cx: number;
  cy: number;
  half: number;
}

const toXY = (lat: number, lon: number): [number, number] => {
  const rho = 2 * MOON_RADIUS_KM * Math.tan(((90 + lat) * DEG) / 2);
  return [rho * Math.sin(lon * DEG), rho * Math.cos(lon * DEG)];
};
const toLatLon = (x: number, y: number): [number, number] => [
  -90 + (2 * Math.atan(Math.hypot(x, y) / (2 * MOON_RADIUS_KM))) / DEG,
  Math.atan2(x, y) / DEG,
];
const unit = (v: Vec3): Vec3 => {
  const r = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / r, v[1] / r, v[2] / r];
};

export function PolarMap({ hm, sunDir, earthDir, mode, sites, selectedId, pinned, onSelect, onPick, heat }: Props) {
  const tr = useTr();
  const [wrapRef, size] = useSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<{ gl: WebGL2RenderingContext; u: Record<string, WebGLUniformLocation | null> } | null>(null);
  const [view, setView] = useState<View>({ cx: 0, cy: 0, half: 250 });
  const [hover, setHover] = useState<{ lat: number; lon: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);

  // WebGL setup (once per heightmap).
  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl2', { antialias: false });
    if (!gl) {
      setFailed(true);
      return;
    }
    let prog: WebGLProgram | null = null;
    let tex: WebGLTexture | null = null;
    try {
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
      return s;
    };
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, hm.size, hm.size, 0, gl.RED, gl.FLOAT, hm.data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const u: Record<string, WebGLUniformLocation | null> = {};
    for (const name of ['uH', 'uCenter', 'uHalf', 'uExtent', 'uTexel', 'uDiscR', 'uDir', 'uMode']) {
      u[name] = gl.getUniformLocation(prog, name);
    }
    gl.uniform1i(u.uH, 0);
    gl.uniform1f(u.uExtent, hm.halfExtentKm);
    gl.uniform1f(u.uTexel, (2 * hm.halfExtentKm) / hm.size);
    glRef.current = { gl, u };
    } catch (err) {
      console.error(err);
      setFailed(true);
    }
    // The canvas element is reused across effect re-runs, so free resources but keep the context.
    return () => {
      glRef.current = null;
      gl.deleteProgram(prog);
      gl.deleteTexture(tex);
    };
  }, [hm]);

  const minSide = Math.max(1, Math.min(size.w, size.h));
  const halfX = (view.half * size.w) / minSide;
  const halfY = (view.half * size.h) / minSide;

  // Draw.
  useEffect(() => {
    const ctx = glRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !size.w || !size.h) return;
    const { gl, u } = ctx;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(size.w * dpr);
    const h = Math.round(size.h * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    const d = unit(mode === 'sun' ? sunDir : earthDir);
    gl.uniform2f(u.uCenter, view.cx, view.cy);
    gl.uniform2f(u.uHalf, halfX, halfY);
    gl.uniform3f(u.uDir, d[0], d[1], d[2]);
    gl.uniform1f(u.uDiscR, (mode === 'sun' ? 0.266 : 0.3) * DEG);
    gl.uniform1i(u.uMode, mode === 'sun' ? 0 : 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [hm, view, size, sunDir, earthDir, mode, halfX, halfY]);

  // Bring the selected site into view when it changes.
  const selected = sites.find((s) => s.id === selectedId);
  useEffect(() => {
    if (!selected || selected.lat > -79.5) return;
    const [x, y] = toXY(selected.lat, selected.lon);
    setView((v) => (Math.abs(x - v.cx) < v.half * 0.85 && Math.abs(y - v.cy) < v.half * 0.85 ? v : { ...v, cx: x, cy: y }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Zoom to the searched area when a search starts or its radius changes.
  const heatArea = heat ? `${heat.result.center.lat}|${heat.result.center.lon}|${heat.result.radiusKm}` : '';
  useEffect(() => {
    if (!heat) return;
    const [x, y] = toXY(heat.result.center.lat, heat.result.center.lon);
    setView({ cx: x, cy: y, half: Math.max(8, heat.result.radiusKm * 1.9) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatArea]);

  const sx = useCallback((x: number) => ((x - view.cx) / halfX) * (size.w / 2) + size.w / 2, [view.cx, halfX, size.w]);
  const sy = useCallback((y: number) => size.h / 2 - ((y - view.cy) / halfY) * (size.h / 2), [view.cy, halfY, size.h]);
  const kmAt = (px: number, py: number): [number, number] => [
    view.cx + ((px - size.w / 2) / (size.w / 2)) * halfX,
    view.cy - ((py - size.h / 2) / (size.h / 2)) * halfY,
  ];
  const clampView = (v: View): View => {
    const half = Math.min(320, Math.max(8, v.half));
    const lim = hm.halfExtentKm;
    return { half, cx: Math.min(lim, Math.max(-lim, v.cx)), cy: Math.min(lim, Math.max(-lim, v.cy)) };
  };
  const zoom = (factor: number, px = size.w / 2, py = size.h / 2) => {
    const [kx, ky] = kmAt(px, py);
    setView((v) => {
      const half = Math.min(320, Math.max(8, v.half * factor));
      const f = half / v.half;
      return clampView({ half, cx: kx + (v.cx - kx) * f, cy: ky + (v.cy - ky) * f });
    });
  };

  const heightAt = (x: number, y: number): number => {
    const c = Math.floor(((x / hm.halfExtentKm) * 0.5 + 0.5) * hm.size);
    const r = Math.floor((0.5 - (y / hm.halfExtentKm) * 0.5) * hm.size);
    if (c < 0 || r < 0 || c >= hm.size || r >= hm.size) return NaN;
    return hm.data[r * hm.size + c];
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const d = drag.current;
    if (d) {
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      if (d.moved) {
        setView((v) => clampView({ ...v, cx: d.cx - (dx / (size.w / 2)) * halfX, cy: d.cy + (dy / (size.h / 2)) * halfY }));
      }
      return;
    }
    const [x, y] = kmAt(e.clientX - rect.left, e.clientY - rect.top);
    const [lat, lon] = toLatLon(x, y);
    const h = heightAt(x, y);
    setHover(Number.isNaN(h) ? null : { lat, lon, h });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const [x, y] = kmAt(e.clientX - rect.left, e.clientY - rect.top);
    const [lat, lon] = toLatLon(x, y);
    if (lat <= -80) onPick(lat, lon);
  };
  const wheelRef = useRef(zoom);
  wheelRef.current = zoom;
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      wheelRef.current(e.deltaY > 0 ? 1.18 : 1 / 1.18, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [wrapRef]);

  const kmPerPx = (2 * halfX) / Math.max(1, size.w);
  const scaleKm = [5, 10, 20, 50, 100, 200].find((k) => k / kmPerPx >= 60) ?? 200;

  // Compass: direction on the map toward the Sun and toward Earth, seen from the pole.
  const arrows = useMemo(() => {
    const ang = (v: Vec3) => (Math.atan2(v[1], v[0]) / DEG + 360) % 360; // sub-point longitude = map bearing
    return { sun: ang(sunDir), earth: ang(earthDir) };
  }, [sunDir, earthDir]);

  const visibleSites = sites.filter((s) => s.lat <= -79.5);

  if (failed) {
    return <div className="map-empty">{tr('Este navegador no soporta WebGL2, necesario para el mapa de sombras.', 'This browser lacks WebGL2, which the shadow map needs.')}</div>;
  }

  return (
    <div
      ref={wrapRef}
      className="polar"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => setHover(null)}
    >
      <canvas ref={canvasRef} />
      {size.w > 0 && <svg width={size.w} height={size.h} aria-hidden="true">
        <g className="graticule">
          {[-88, -86, -84, -82, -80].map((lat) => {
            const r = (toXY(lat, 90)[0] / halfX) * (size.w / 2);
            const lx = sx(toXY(lat, 135)[0]);
            const ly = sy(toXY(lat, 135)[1]);
            return (
              <g key={lat}>
                <circle cx={sx(0)} cy={sy(0)} r={r} />
                <text x={lx + 3} y={ly - 3}>{`${-lat}°S`}</text>
              </g>
            );
          })}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((lon) => {
            const [x, y] = toXY(-80, lon);
            const [lx, ly] = toXY(-79.2, lon);
            const label = lon === 0 ? '0°' : lon === 180 ? '180°' : lon < 180 ? `${lon}°E` : `${360 - lon}°W`;
            return (
              <g key={lon}>
                <line x1={sx(0)} y1={sy(0)} x2={sx(x)} y2={sy(y)} />
                <text x={sx(lx)} y={sy(ly)} textAnchor="middle" dominantBaseline="middle">
                  {label}
                </text>
              </g>
            );
          })}
        </g>
        {heat && <HeatLayer heat={heat} cx={view.cx} cy={view.cy} halfX={halfX} halfY={halfY} w={size.w} h={size.h} />}
        {visibleSites.map((s) => {
          const [x, y] = toXY(s.lat, s.lon);
          const isSel = s.id === selectedId;
          const isPin = pinned.includes(s.id);
          return (
            <g
              key={s.id}
              className={`marker${isSel ? ' is-selected' : ''}${isPin ? ' is-pinned' : ''}`}
              transform={`translate(${sx(x)},${sy(y)})`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect(s.id)}
            >
              {isSel && <circle className="marker-ring" r={11} />}
              <circle className="marker-dot" r={isSel ? 4.5 : 3.5} />
              {(isSel || isPin || view.half < 140) && (
                <text x={isSel ? -14 : 9} y={4} textAnchor={isSel ? 'end' : 'start'}>
                  {s.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>}

      <div className="polar-compass" aria-hidden="true">
        <svg viewBox="-30 -30 60 60" width="60" height="60">
          <circle r="27" />
          <g transform={`rotate(${arrows.sun})`}>
            <line className="to-sun" y1="0" y2="-22" />
            <circle className="to-sun-dot" cy="-22" r="3.5" />
          </g>
          <g transform={`rotate(${arrows.earth})`}>
            <line className="to-earth" y1="0" y2="-22" />
            <circle className="to-earth-dot" cy="-22" r="3.5" />
          </g>
        </svg>
        <span>
          <i className="swatch sun" /> {tr('hacia el Sol', 'to the Sun')}
          <br />
          <i className="swatch earth" /> {tr('hacia la Tierra', 'to Earth')}
        </span>
      </div>

      {heat && <HeatLegend heat={heat} />}

      <div className="polar-zoom">
        <button type="button" onClick={() => zoom(1 / 1.5)} aria-label={tr('Acercar', 'Zoom in')}>
          +
        </button>
        <button type="button" onClick={() => zoom(1.5)} aria-label={tr('Alejar', 'Zoom out')}>
          −
        </button>
        <button type="button" onClick={() => setView({ cx: 0, cy: 0, half: 250 })} aria-label={tr('Ver todo el polo', 'Show the whole pole')}>
          ⌂
        </button>
      </div>

      <div className="polar-foot">
        <span className="scalebar" style={{ width: size.w ? scaleKm / kmPerPx : 0 }}>
          {scaleKm} km
        </span>
        <span className="num">
          {hover
            ? `${fmtLatLon(hover.lat, hover.lon)}   ${hover.h >= 0 ? '+' : '−'}${Math.abs(Math.round(hover.h * 1000))} m`
            : tr('Haz clic en el mapa para evaluar ese punto', 'Click the map to evaluate that point')}
        </span>
      </div>
    </div>
  );
}

/** Search cells as coloured squares. Memoised: it does not redraw while time plays. */
const HeatLayer = memo(function HeatLayer({ heat, cx, cy, halfX, halfY, w, h }: { heat: Heat; cx: number; cy: number; halfX: number; halfY: number; w: number; h: number }) {
  const { result, criterion, picks } = heat;
  // Map position of every cell: depends on the result only, not on pan or zoom.
  const placed = useMemo(() => result.cells.filter((c) => c.covered).map((c) => ({ c, xy: toXY(c.lat, c.lon) })), [result]);
  const { min, max } = useMemo(() => heatRange(result.cells, criterion), [result, criterion]);
  const px = (x: number) => ((x - cx) / halfX) * (w / 2) + w / 2;
  const py = (y: number) => h / 2 - ((y - cy) / halfY) * (h / 2);
  const side = (result.cellKm / (2 * halfX)) * w;
  const span = max - min || 1;
  const [ox, oy] = toXY(result.center.lat, result.center.lon);
  const steep = placed
    .filter(({ c }) => c.slopeDeg > MAX_LANDING_SLOPE_DEG)
    .map(({ xy }) => `M${(px(xy[0]) - side / 2).toFixed(1)},${(py(xy[1]) - side / 2).toFixed(1)}h${side.toFixed(1)}v${side.toFixed(1)}h${(-side).toFixed(1)}z`)
    .join('');
  return (
    <g className="heat">
      <defs>
        <pattern id="heat-steep" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke="#040508" strokeWidth="2.2" strokeOpacity="0.55" />
        </pattern>
      </defs>
      {placed.map(({ c, xy }) => (
        <rect
          key={`${c.i},${c.j}`}
          x={px(xy[0]) - side / 2}
          y={py(xy[1]) - side / 2}
          width={side + 0.6}
          height={side + 0.6}
          fill={`rgb(${HEAT_RGB[criterion]})`}
          fillOpacity={0.08 + 0.74 * ((valueOf(c, criterion) - min) / span)}
        />
      ))}
      <path d={steep} fill="url(#heat-steep)" />
      <circle className="heat-area" cx={px(ox)} cy={py(oy)} r={(result.radiusKm / (2 * halfX)) * w + side / 2} />
      {picks.map((c, k) => {
        const [x, y] = toXY(c.lat, c.lon);
        return (
          <g key={`${c.i},${c.j}`} className="heat-pick" transform={`translate(${px(x)},${py(y)})`}>
            <circle r="9" />
            <text y="4" textAnchor="middle">
              {k + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
});

function HeatLegend({ heat }: { heat: Heat }) {
  const tr = useTr();
  const { min, max } = heatRange(heat.result.cells, heat.criterion);
  const label = { sun: tr('Luz solar en la misión', 'Sunlight over the mission'), earth: tr('Enlace con la Tierra', 'Earth link'), score: tr('Índice de viabilidad', 'Viability index') }[heat.criterion];
  const show = (v: number) => (heat.criterion === 'score' ? String(Math.round(v * 100)) : pct(v));
  return (
    <div className="heat-legend num" aria-hidden="true">
      <span>{label}</span>
      <span className="heat-scale">
        {show(min)}
        <i style={{ background: `linear-gradient(to right, rgba(${HEAT_RGB[heat.criterion]},0.08), rgba(${HEAT_RGB[heat.criterion]},0.82))` }} />
        {show(max)}
      </span>
      <span className="heat-steep-key">
        <i /> {tr(`pendiente mayor de ${MAX_LANDING_SLOPE_DEG}°`, `slope above ${MAX_LANDING_SLOPE_DEG}°`)}
      </span>
    </div>
  );
}

// The view from the landing site: a 360-degree strip of sky centred on north,
// with the real terrain silhouette and the Sun and Earth where they are now.
// On the airless Moon there is no refraction and no twilight: a body is either
// above the terrain line or it is not.
import { useMemo, useState } from 'react';
import { horizonAt, type Horizon, type SiteSeries, type Sky } from '../lib/series';
import { compass, deg, km, useLang, useSize, useTr } from '../lib/util';

interface Props {
  horizon: Horizon;
  sky: Sky;
  series: SiteSeries | null;
}

const wrap180 = (az: number) => ((((az + 180) % 360) + 360) % 360) - 180;
const PAD = { l: 44, r: 12, t: 14, b: 26 };

// Deterministic star field (pure decoration for orientation; not a real catalogue).
const STARS = Array.from({ length: 90 }, (_, i) => {
  const a = Math.sin(i * 127.1) * 43758.5453;
  const b = Math.sin(i * 311.7) * 24634.6345;
  return { x: a - Math.floor(a), y: b - Math.floor(b), r: 0.4 + ((i * 7) % 5) * 0.14 };
});

export function Panorama({ horizon, sky, series }: Props) {
  const tr = useTr();
  const lang = useLang();
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const { w, h } = size;
  const iw = Math.max(10, w - PAD.l - PAD.r);
  const ih = Math.max(10, h - PAD.t - PAD.b);

  const range = useMemo(() => {
    let lo = 0;
    let hi = 0;
    for (let i = 0; i < horizon.nAz; i++) {
      lo = Math.min(lo, horizon.elevationDeg[i]);
      hi = Math.max(hi, horizon.elevationDeg[i]);
    }
    hi = Math.max(hi, sky.sun.el, sky.earth.el);
    if (series) {
      for (let i = 0; i < series.n; i++) hi = Math.max(hi, series.sunEl[i], series.earthEl[i]);
    }
    hi = Math.min(90, Math.max(6, hi * 1.12 + 1));
    lo = Math.max(-12, Math.min(-2, lo - 1.2));
    return { lo, hi };
    // The scale should not jump while time plays, so the current sky is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon, series]);

  const x = (az: number) => PAD.l + ((wrap180(az) + 180) / 360) * iw;
  const y = (el: number) => PAD.t + ((range.hi - el) / (range.hi - range.lo)) * ih;

  const terrain = useMemo(() => {
    const pts: string[] = [];
    const N = 720;
    for (let k = 0; k <= N; k++) {
      const az = -180 + (k * 360) / N;
      pts.push(`${(PAD.l + (k / N) * iw).toFixed(1)},${y(horizonAt(horizon, az)).toFixed(1)}`);
    }
    return { line: `M${pts.join('L')}`, fill: `M${PAD.l},${PAD.t + ih}L${pts.join('L')}L${PAD.l + iw},${PAD.t + ih}Z` };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon, iw, ih, range]);

  const paths = useMemo(() => {
    if (!series) return { sun: '', earth: '' };
    const build = (az: Float32Array, el: Float32Array) => {
      let d = '';
      let prev = NaN;
      const stride = Math.max(1, Math.floor(series.n / 700));
      for (let i = 0; i < series.n; i += stride) {
        const px = x(az[i]);
        const py = y(el[i]);
        d += `${Number.isNaN(prev) || Math.abs(px - prev) > iw / 2 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
        prev = px;
      }
      return d;
    };
    return { sun: build(series.sunAz, series.sunEl), earth: build(series.earthAz, series.earthEl) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, iw, ih, range]);

  const span = range.hi - range.lo;
  const tickStep = span > 60 ? 15 : span > 25 ? 10 : span > 12 ? 5 : 2;
  const ticks: number[] = [];
  for (let t = Math.ceil(range.lo / tickStep) * tickStep; t <= range.hi; t += tickStep) ticks.push(t);
  const exaggeration = ih / span / (iw / 360);

  const cardinals = [
    { az: -180, label: 'S' },
    { az: -90, label: lang === 'es' ? 'O' : 'W' },
    { az: 0, label: 'N' },
    { az: 90, label: 'E' },
    { az: 180, label: 'S' },
  ];

  const body = (b: Sky['sun'], kind: 'sun' | 'earth', label: string) => {
    const visible = b.frac > (kind === 'sun' ? 0.02 : 0.5);
    const cx = x(b.az);
    const cy = y(b.el);
    const r = kind === 'sun' ? 6 : 7;
    const below = cy > PAD.t + ih - 4;
    const labelY = below ? PAD.t + ih - 8 : Math.max(PAD.t + 12, cy - r - 8);
    const anchor = cx > PAD.l + iw - 90 ? 'end' : 'start';
    return { visible, cx, cy: Math.min(cy, PAD.t + ih + 20), r, labelY, anchor, label, below };
  };
  const sun = body(sky.sun, 'sun', tr('Sol', 'Sun'));
  const earth = body(sky.earth, 'earth', tr('Tierra', 'Earth'));

  const hoverInfo =
    hover === null
      ? null
      : (() => {
          const az = ((hover % 360) + 360) % 360;
          const i = Math.round((az * horizon.nAz) / 360) % horizon.nAz;
          return { az, el: horizonAt(horizon, az), dist: horizon.distanceKm[i] };
        })();

  return (
    <div
      ref={ref}
      className="panorama"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const f = (e.clientX - rect.left - PAD.l) / iw;
        setHover(f >= 0 && f <= 1 ? -180 + f * 360 : null);
      }}
      onPointerLeave={() => setHover(null)}
    >
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label={tr('Panorama del horizonte con el Sol y la Tierra', 'Horizon panorama with the Sun and Earth')}>
          <defs>
            <linearGradient id="pano-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a4a4d" />
              <stop offset="1" stopColor="#222327" />
            </linearGradient>
            <radialGradient id="pano-sun">
              <stop offset="0" stopColor="#fff6dc" />
              <stop offset="0.45" stopColor="#ffc247" />
              <stop offset="1" stopColor="#ffc247" stopOpacity="0" />
            </radialGradient>
            <clipPath id="pano-clip">
              <rect x={PAD.l} y={PAD.t} width={iw} height={ih} />
            </clipPath>
          </defs>
          <rect x={PAD.l} y={PAD.t} width={iw} height={ih} fill="#040508" />
          <g clipPath="url(#pano-clip)">
            {STARS.map((s, i) => (
              <circle key={i} cx={PAD.l + s.x * iw} cy={PAD.t + s.y * ih * 0.9} r={s.r} fill="#ece7db" opacity={0.35} />
            ))}
            {ticks.map((t) => (
              <line key={t} className={t === 0 ? 'pano-zero' : 'pano-grid'} x1={PAD.l} x2={PAD.l + iw} y1={y(t)} y2={y(t)} />
            ))}
            <path className="pano-path sun" d={paths.sun} />
            <path className="pano-path earth" d={paths.earth} />
            {sun.visible && <circle cx={sun.cx} cy={sun.cy} r={22} fill="url(#pano-sun)" />}
            {sun.visible && <circle cx={sun.cx} cy={sun.cy} r={sun.r} fill="#fff3cf" />}
            {earth.visible && <circle cx={earth.cx} cy={earth.cy} r={earth.r} fill="#5db8ff" />}
            {earth.visible && <path d={`M${earth.cx - 4},${earth.cy - 2}q3,-3 6,0t4,3`} stroke="#eaf6ff" strokeWidth="1.2" fill="none" opacity="0.8" />}
            <path d={terrain.fill} fill="url(#pano-ground)" />
            <path d={terrain.line} className="pano-rim" />
            {!sun.visible && <circle className="pano-ghost sun" cx={sun.cx} cy={sun.cy} r={sun.r} />}
            {!earth.visible && <circle className="pano-ghost earth" cx={earth.cx} cy={earth.cy} r={earth.r} />}
            {hoverInfo && <line className="pano-hover" x1={x(hoverInfo.az)} x2={x(hoverInfo.az)} y1={PAD.t} y2={PAD.t + ih} />}
          </g>

          {[sun, earth].map((b, i) => (
            <text key={i} className={`pano-label ${i === 0 ? 'sun' : 'earth'}`} x={b.cx + (b.anchor === 'end' ? -12 : 12)} y={b.labelY + 4 + (i === 1 && Math.abs(sun.cx - earth.cx) < 80 && Math.abs(sun.labelY - earth.labelY) < 14 ? 15 : 0)} textAnchor={b.anchor as 'start' | 'end'}>
              {b.label} {deg((i === 0 ? sky.sun : sky.earth).el)}
              {b.visible ? '' : ` (${tr('oculto', 'hidden')})`}
            </text>
          ))}

          {ticks.map((t) => (
            <text key={t} className="pano-tick" x={PAD.l - 8} y={y(t) + 4} textAnchor="end">
              {t}°
            </text>
          ))}
          {cardinals.map((c, i) => (
            <text key={i} className="pano-cardinal" x={PAD.l + ((c.az + 180) / 360) * iw} y={h - 8} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>
              {c.label}
            </text>
          ))}
        </svg>
      )}
      <div className="pano-note num">
        {hoverInfo
          ? `${tr('Azimut', 'Azimuth')} ${hoverInfo.az.toFixed(0)}° ${compass(hoverInfo.az, lang)}: ${tr('el terreno tapa hasta', 'terrain blocks up to')} ${deg(hoverInfo.el, 2)}${
              hoverInfo.dist > 0 ? `, ${tr('relieve a', 'feature')} ${km(hoverInfo.dist)}${tr('', ' away')}` : ''
            }`
          : `${tr('Escala vertical', 'Vertical scale')} ×${exaggeration.toFixed(exaggeration < 3 ? 1 : 0)}`}
      </div>
    </div>
  );
}

/** True-scale close-up of a body against the terrain line: what a camera would see. */
export function Closeup({ horizon, body, kind }: { horizon: Horizon; body: Sky['sun']; kind: 'sun' | 'earth' }) {
  const S = 92;
  const fov = body.radius * 2.6; // half field of view, degrees
  const k = S / 2 / fov;
  const cosEl = Math.max(0.05, Math.cos((body.el * Math.PI) / 180));
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const dx = (i / 24) * 2 * fov - fov;
    const hz = horizonAt(horizon, body.az + dx / cosEl);
    pts.push(`${(S / 2 + dx * k).toFixed(1)},${(S / 2 - (hz - body.el) * k).toFixed(1)}`);
  }
  const r = body.radius * k;
  const id = `cu-${kind}`;
  return (
    <svg className="closeup" width={S} height={S} viewBox={`0 0 ${S} ${S}`} aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect width={S} height={S} rx="3" />
        </clipPath>
        <radialGradient id={`${id}-g`}>
          <stop offset="0.7" stopColor={kind === 'sun' ? '#fff6dc' : '#7cc6ff'} />
          <stop offset="1" stopColor={kind === 'sun' ? '#ffc247' : '#3f8fd6'} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width={S} height={S} fill="#040508" />
        <circle cx={S / 2} cy={S / 2} r={r} fill={`url(#${id}-g)`} />
        <path d={`M0,${S}L${pts.join('L')}L${S},${S}Z`} fill="#2c2d31" stroke="#8d897f" strokeWidth="1" />
        {body.frac < 0.999 && <circle cx={S / 2} cy={S / 2} r={r} fill="none" stroke={kind === 'sun' ? '#ffc247' : '#5db8ff'} strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />}
      </g>
    </svg>
  );
}

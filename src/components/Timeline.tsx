// Mission timeline: how far the Sun and Earth sit above the local terrain
// horizon across the mission, with the resulting power and link windows.
import { useMemo } from 'react';
import { stripLayout } from '../lib/scenario';
import { horizonAt, type Horizon, type Interval, type Metrics, type SiteSeries } from '../lib/series';
import { deg, fmtDate, useLang, useSize, useTr } from '../lib/util';

interface Props {
  series: SiteSeries;
  horizon: Horizon;
  metrics: Metrics;
  now: number;
  onScrub: (t: number) => void;
}

const PAD = { l: 64, r: 14, t: 10 };
const PLOT_H = 112;
const BAND_H = 12;
const HOUR = 3600e3;
const DAY = 24 * HOUR;

export function Timeline({ series, horizon, metrics, now, onScrub }: Props) {
  const tr = useTr();
  const lang = useLang();
  const [ref, size] = useSize<HTMLDivElement>();
  const iw = Math.max(10, size.w - PAD.l - PAD.r);
  const t0 = series.t0;
  const t1 = series.t0 + (series.n - 1) * series.stepMs;
  const x = (t: number) => PAD.l + ((t - t0) / (t1 - t0)) * iw;

  const plot = useMemo(() => {
    const sun = new Float32Array(series.n);
    const earth = new Float32Array(series.n);
    let lo = 0;
    let hi = 0;
    for (let i = 0; i < series.n; i++) {
      sun[i] = series.sunEl[i] - horizonAt(horizon, series.sunAz[i]);
      earth[i] = series.earthEl[i] - horizonAt(horizon, series.earthAz[i]);
      lo = Math.min(lo, sun[i], earth[i]);
      hi = Math.max(hi, sun[i], earth[i]);
    }
    hi = Math.min(90, Math.max(1.5, hi * 1.1));
    lo = Math.max(-hi, Math.min(-1, lo * 1.1)); // keep the visible half at least as tall as the hidden half
    return { sun, earth, lo, hi };
  }, [series, horizon]);

  const y = (v: number) => PAD.t + ((plot.hi - Math.max(plot.lo, v)) / (plot.hi - plot.lo)) * PLOT_H;
  const line = (vals: Float32Array) => {
    let d = '';
    for (let i = 0; i < series.n; i++) d += `${i ? 'L' : 'M'}${x(t0 + i * series.stepMs).toFixed(1)},${y(vals[i]).toFixed(1)}`;
    return d;
  };
  const sunLine = useMemo(() => line(plot.sun), [plot, iw]); // eslint-disable-line react-hooks/exhaustive-deps
  const earthLine = useMemo(() => line(plot.earth), [plot, iw]); // eslint-disable-line react-hooks/exhaustive-deps
  const y0 = y(0);

  const days = (t1 - t0) / DAY;
  const tickEvery = [1, 2, 5, 7, 14, 30].find((d) => (iw / days) * d >= 58) ?? 30;
  const ticks: number[] = [];
  const firstDay = Math.ceil(t0 / DAY) * DAY;
  for (let t = firstDay; t <= t1; t += DAY * tickEvery) ticks.push(t);

  const bandTop = PAD.t + PLOT_H + 12;
  const band = (ivs: Interval[], row: number, cls: string) =>
    ivs.map((iv, i) => (
      <rect key={`${cls}${i}`} className={`band ${cls}`} x={x(iv.start)} width={Math.max(1, x(iv.end) - x(iv.start))} y={bandTop + row * (BAND_H + 6)} height={BAND_H} rx="2" />
    ));

  const height = bandTop + 2 * (BAND_H + 6) + 22;
  const scrub = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left - PAD.l) / iw));
    onScrub(t0 + f * (t1 - t0));
  };
  const cursorX = x(Math.min(t1, Math.max(t0, now)));

  return (
    <div
      ref={ref}
      className="timeline"
      role="slider"
      tabIndex={0}
      aria-label={tr('Momento de la misión', 'Mission time')}
      aria-valuemin={t0}
      aria-valuemax={t1}
      aria-valuenow={Math.round(now)}
      aria-valuetext={fmtDate(now, lang)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        scrub(e);
      }}
      onPointerMove={(e) => e.buttons === 1 && scrub(e)}
      onKeyDown={(e) => {
        const stepMs = e.shiftKey ? DAY : HOUR;
        if (e.key === 'ArrowRight') onScrub(Math.min(t1, now + stepMs));
        else if (e.key === 'ArrowLeft') onScrub(Math.max(t0, now - stepMs));
        else return;
        e.preventDefault();
      }}
    >
      {size.w > 0 && (
        <svg width={size.w} height={height}>
          <defs>
            <clipPath id="tl-above">
              <rect x={PAD.l} y={PAD.t} width={iw} height={Math.max(0, y0 - PAD.t)} />
            </clipPath>
          </defs>
          <rect className="tl-plot" x={PAD.l} y={PAD.t} width={iw} height={PLOT_H} />
          {ticks.map((t) => (
            <g key={t}>
              <line className="tl-grid" x1={x(t)} x2={x(t)} y1={PAD.t} y2={bandTop + 2 * (BAND_H + 6) - 6} />
              <text className="tl-tick" x={x(t)} y={height - 6} textAnchor="middle">
                {new Date(t).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
              </text>
            </g>
          ))}
          <g clipPath="url(#tl-above)">
            <path className="tl-area sun" d={`${sunLine}L${x(t1)},${y0}L${x(t0)},${y0}Z`} />
            <path className="tl-area earth" d={`${earthLine}L${x(t1)},${y0}L${x(t0)},${y0}Z`} />
          </g>
          <line className="tl-zero" x1={PAD.l} x2={PAD.l + iw} y1={y0} y2={y0} />
          <path className="tl-line sun" d={sunLine} />
          <path className="tl-line earth" d={earthLine} />
          <text className="tl-axis" x={PAD.l - 8} y={PAD.t + 9} textAnchor="end">
            +{deg(plot.hi, plot.hi < 10 ? 1 : 0)}
          </text>
          <text className="tl-axis" x={PAD.l - 8} y={y0 + 4} textAnchor="end">
            {tr('horizonte', 'horizon')}
          </text>
          <text className="tl-axis" x={PAD.l - 8} y={PAD.t + PLOT_H} textAnchor="end">
            {deg(plot.lo, plot.lo > -10 ? 1 : 0)}
          </text>

          <rect className="band-track" x={PAD.l} width={iw} y={bandTop} height={BAND_H} rx="2" />
          <rect className="band-track" x={PAD.l} width={iw} y={bandTop + BAND_H + 6} height={BAND_H} rx="2" />
          {band(metrics.sunIntervals, 0, 'sun')}
          {band(metrics.earthIntervals, 1, 'earth')}
          <text className="tl-axis" x={PAD.l - 8} y={bandTop + 10} textAnchor="end">
            {tr('Luz solar', 'Sunlight')}
          </text>
          <text className="tl-axis" x={PAD.l - 8} y={bandTop + BAND_H + 16} textAnchor="end">
            {tr('Enlace', 'Link')}
          </text>

          <line className="tl-cursor" x1={cursorX} x2={cursorX} y1={PAD.t - 4} y2={bandTop + 2 * (BAND_H + 6) - 4} />
          <path className="tl-cursor-head" d={`M${cursorX - 5},${PAD.t - 6}h10l-5,7z`} />
        </svg>
      )}
    </div>
  );
}

/**
 * Compact two-row window strip for the comparison table. The axis is mission
 * time (day 0 = landing) over the longest scenario, so rows with different
 * landing dates line up.
 */
export function WindowStrip({ metrics, landing, spanMs, durationMs, elapsed }: { metrics: Metrics; landing: number; spanMs: number; durationMs: number; elapsed: number }) {
  const pc = (x: number) => `${(x * 100).toFixed(2)}%`;
  const reach = Math.min(1, durationMs / spanMs);
  const row = (intervals: Interval[], cls: string) => (
    <div className="strip-row">
      <u style={{ width: pc(reach) }} />
      {stripLayout(intervals, landing, spanMs).map((w, i) => (
        <i key={i} className={cls} style={{ left: pc(w.left), width: pc(Math.max(0.003, w.width)) }} />
      ))}
    </div>
  );
  return (
    <div className="strip" aria-hidden="true">
      {row(metrics.sunIntervals, 'sun')}
      {row(metrics.earthIntervals, 'earth')}
      {elapsed <= durationMs && <b style={{ left: pc(elapsed / spanMs) }} />}
    </div>
  );
}

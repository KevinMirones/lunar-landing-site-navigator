// Text-and-number panels: site list, live status, comparison table, year calendar.
import { memo, useMemo, useState } from 'react';
import { SUN_RADIUS_KM, moonFixedVectors, siteFrame, topocentric } from '../lib/ephemeris';
import { nextEvent, type Horizon, type Metrics, type Sky } from '../lib/series';
import { normLon, type Site } from '../lib/sites';
import { compass, deg, fetchJpl, fmtDate, fmtDuration, fmtLatLon, km, pct, useLang, useSize, useTr } from '../lib/util';
import { Closeup } from './Panorama';
import { WindowStrip } from './Timeline';

// ---------------------------------------------------------------- Site list

interface SiteListProps {
  sites: Site[];
  selectedId: string;
  pinned: string[];
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onAdd: (lat: number, lon: number) => void;
  onRemove: (id: string) => void;
}

export const SiteList = memo(function SiteList({ sites, selectedId, pinned, onSelect, onTogglePin, onAdd, onRemove }: SiteListProps) {
  const tr = useTr();
  const lang = useLang();
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [error, setError] = useState('');

  const groups: Array<{ key: Site['group']; title: string }> = [
    { key: 'south', title: tr('Polo sur', 'South pole') },
    { key: 'heritage', title: tr('Otras latitudes', 'Other latitudes') },
    { key: 'custom', title: tr('Tus puntos', 'Your points') },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const la = Number(lat.replace(',', '.'));
    const lo = Number(lon.replace(',', '.'));
    if (lat.trim() === '' || lon.trim() === '' || !Number.isFinite(la) || !Number.isFinite(lo) || la < -90 || la > 90 || lo < -180 || lo > 360) {
      setError(tr('Latitud entre −90 y 90, longitud este entre −180 y 360.', 'Latitude from −90 to 90, east longitude from −180 to 360.'));
      return;
    }
    setError('');
    onAdd(la, normLon(lo));
    setLat('');
    setLon('');
  };

  return (
    <nav className="sites" aria-label={tr('Sitios de alunizaje', 'Landing sites')}>
      {groups.map((g) => {
        const list = sites.filter((s) => s.group === g.key);
        if (!list.length) return null;
        return (
          <section key={g.key}>
            <h3>{g.title}</h3>
            <ul>
              {list.map((s) => {
                const isPin = pinned.includes(s.id);
                return (
                  <li key={s.id} className={s.id === selectedId ? 'is-selected' : ''}>
                    <button type="button" className="site-main" onClick={() => onSelect(s.id)} aria-current={s.id === selectedId}>
                      <span className="site-name">{s.name}</span>
                      <span className="site-meta">{s.tag[lang]}</span>
                      <span className="site-meta num">{fmtLatLon(s.lat, s.lon)}</span>
                    </button>
                    <button
                      type="button"
                      className={`pin${isPin ? ' is-on' : ''}`}
                      aria-pressed={isPin}
                      title={isPin ? tr('Quitar de la comparación', 'Remove from comparison') : tr('Añadir a la comparación', 'Add to comparison')}
                      onClick={() => onTogglePin(s.id)}
                    >
                      {isPin ? tr('Comparando', 'Comparing') : tr('Comparar', 'Compare')}
                    </button>
                    {s.group === 'custom' && (
                      <button type="button" className="pin" title={tr('Eliminar punto', 'Delete point')} onClick={() => onRemove(s.id)}>
                        ×
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <form className="add-site" onSubmit={submit}>
        <h3>{tr('Añadir coordenadas', 'Add coordinates')}</h3>
        <div className="add-row">
          <label>
            {tr('Latitud', 'Latitude')}
            <input inputMode="decimal" placeholder="-89.45" value={lat} onChange={(e) => setLat(e.target.value)} />
          </label>
          <label>
            {tr('Longitud este', 'East longitude')}
            <input inputMode="decimal" placeholder="222.69" value={lon} onChange={(e) => setLon(e.target.value)} />
          </label>
          <button type="submit">{tr('Añadir', 'Add')}</button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </nav>
  );
});

// ---------------------------------------------------------------- Live status

interface StatusProps {
  site: Site;
  horizon: Horizon & { offline?: boolean };
  sky: Sky;
  metrics: Metrics;
  now: number;
  windowEnd: number;
}

export function Status({ site, horizon, sky, metrics, now, windowEnd }: StatusProps) {
  const tr = useTr();
  const lang = useLang();
  const sunEv = nextEvent(metrics.sunIntervals, now, windowEnd);
  const earthEv = nextEvent(metrics.earthIntervals, now, windowEnd);
  const irradiance = 1361 * (149597870.7 / sky.sun.distKm) ** 2 * sky.sun.frac;

  const sunLine = sunEv.visible
    ? sunEv.at
      ? `${tr('Se oculta en', 'Sets in')} ${fmtDuration(sunEv.at - now)}`
      : tr('No se oculta en esta misión', 'Does not set during this mission')
    : sunEv.at
      ? `${tr('Sale en', 'Rises in')} ${fmtDuration(sunEv.at - now)}`
      : tr('No sale en esta misión', 'Does not rise during this mission');
  const earthLine = earthEv.visible
    ? earthEv.at
      ? `${tr('Enlace se pierde en', 'Link is lost in')} ${fmtDuration(earthEv.at - now)}`
      : tr('Enlace continuo toda la misión', 'Continuous link all mission')
    : earthEv.at
      ? `${tr('Enlace vuelve en', 'Link returns in')} ${fmtDuration(earthEv.at - now)}`
      : tr('Sin enlace directo en esta misión', 'No direct link during this mission');

  return (
    <div className="status">
      <header className="status-site">
        <h2>{site.name}</h2>
        <p className="num">
          {fmtLatLon(site.lat, site.lon)}
          {horizon.model === 'lola-240m' && `   ${horizon.siteElevationM >= 0 ? '+' : '−'}${Math.abs(horizon.siteElevationM)} m`}
        </p>
        <p className="status-note">{site.note[lang]}</p>
        <p className={`model ${horizon.model}`}>
          {horizon.model === 'lola-240m'
            ? tr('Horizonte calculado con topografía real LOLA (240 m).', 'Horizon computed from real LOLA topography (240 m).')
            : horizon.offline
              ? tr('Sin conexión con el servidor de terreno: se usa una Luna lisa.', 'Terrain server unreachable: using a smooth Moon.')
              : tr('Fuera de la cobertura de terreno (80°S a 90°S): se usa una Luna lisa.', 'Outside terrain coverage (80°S to 90°S): using a smooth Moon.')}
        </p>
      </header>

      <section className="body-card sun">
        <Closeup horizon={horizon} body={sky.sun} kind="sun" />
        <div>
          <h3>{tr('Sol', 'Sun')}</h3>
          <p className="state">{sky.sun.frac > 0.02 ? `${pct(sky.sun.frac)} ${tr('del disco visible', 'of the disc visible')}` : tr('Oculto', 'Hidden')}</p>
          <p className="countdown">{sunLine}</p>
        </div>
        <dl>
          <dt>{tr('Elevación', 'Elevation')}</dt>
          <dd>{deg(sky.sun.el, 2)}</dd>
          <dt>{tr('Sobre el terreno', 'Above terrain')}</dt>
          <dd>{`${sky.sun.el - sky.sun.horizon >= 0 ? '+' : '−'}${deg(Math.abs(sky.sun.el - sky.sun.horizon), 2)}`}</dd>
          <dt>{tr('Azimut', 'Azimuth')}</dt>
          <dd>{`${sky.sun.az.toFixed(0)}° ${compass(sky.sun.az, lang)}`}</dd>
          <dt>{tr('Irradiancia', 'Irradiance')}</dt>
          <dd>{Math.round(irradiance)} W/m²</dd>
        </dl>
      </section>

      <section className="body-card earth">
        <Closeup horizon={horizon} body={sky.earth} kind="earth" />
        <div>
          <h3>{tr('Tierra', 'Earth')}</h3>
          <p className="state">{sky.earth.frac > 0.5 ? tr('Enlace directo disponible', 'Direct link available') : tr('Sin línea de vista', 'No line of sight')}</p>
          <p className="countdown">{earthLine}</p>
        </div>
        <dl>
          <dt>{tr('Elevación', 'Elevation')}</dt>
          <dd>{deg(sky.earth.el, 2)}</dd>
          <dt>{tr('Sobre el terreno', 'Above terrain')}</dt>
          <dd>{`${sky.earth.el - sky.earth.horizon >= 0 ? '+' : '−'}${deg(Math.abs(sky.earth.el - sky.earth.horizon), 2)}`}</dd>
          <dt>{tr('Azimut', 'Azimuth')}</dt>
          <dd>{`${sky.earth.az.toFixed(0)}° ${compass(sky.earth.az, lang)}`}</dd>
          <dt>{tr('Disco visible', 'Disc visible')}</dt>
          <dd>{pct(sky.earth.frac)}</dd>
        </dl>
      </section>

      <section className="mission">
        <h3>{tr('Balance de la misión', 'Mission balance')}</h3>
        <div className="score" title={tr('Índice orientativo: 40% luz solar, 25% noches cortas, 35% enlace con la Tierra.', 'Indicative index: 40% sunlight, 25% short nights, 35% Earth link.')}>
          <strong className="num">{metrics.score}</strong>
          <span>{tr('índice de viabilidad, de 0 a 100', 'viability index, 0 to 100')}</span>
        </div>
        <dl>
          <dt>{tr('Con luz solar', 'In sunlight')}</dt>
          <dd>{pct(metrics.sunShare)}</dd>
          <dt>{tr('Noche más larga', 'Longest night')}</dt>
          <dd>{metrics.longestDarkMs > 0 ? fmtDuration(metrics.longestDarkMs) : tr('ninguna', 'none')}</dd>
          <dt>{tr('Con enlace a la Tierra', 'With Earth link')}</dt>
          <dd>{pct(metrics.earthShare)}</dd>
          <dt>{tr('Corte de enlace más largo', 'Longest link outage')}</dt>
          <dd>{metrics.longestNoEarthMs > 0 ? fmtDuration(metrics.longestNoEarthMs) : tr('ninguno', 'none')}</dd>
          <dt>{tr('Luz y enlace a la vez', 'Sunlight and link together')}</dt>
          <dd>{pct(metrics.bothShare)}</dd>
        </dl>
        <Insights site={site} horizon={horizon} metrics={metrics} />
        <JplCheck site={site} now={now} />
      </section>
    </div>
  );
}

function Insights({ site, horizon, metrics }: { site: Site; horizon: Horizon; metrics: Metrics }) {
  const tr = useTr();
  const lang = useLang();
  const items: string[] = [];
  const polar = Math.abs(site.lat) > 80;

  if (metrics.sunShare === 0) {
    items.push(
      tr(
        'Ni un minuto de Sol directo en toda la misión. Así son las trampas frías donde se conserva el hielo: valiosas para la ciencia, imposibles para un panel solar.',
        'Not one minute of direct Sun in the whole mission. This is what cold traps that preserve ice look like: valuable for science, impossible for a solar panel.',
      ),
    );
  } else if (polar) {
    items.push(
      tr(
        `El Sol nunca sube más de ${deg(metrics.maxSunEl)} sobre el horizonte, así que cualquier relieve lejano puede apagar tus paneles.`,
        `The Sun never climbs more than ${deg(metrics.maxSunEl)} above the horizon, so any distant relief can switch off your panels.`,
      ),
    );
  } else {
    items.push(
      tr(
        `Aquí el Sol llega a ${deg(metrics.maxSunEl, 0)} de altura y el ciclo es simple: unos 14 días de luz y 14 de noche.`,
        `Here the Sun reaches ${deg(metrics.maxSunEl, 0)} and the cycle is simple: about 14 days of light and 14 of night.`,
      ),
    );
  }

  if (metrics.earthShare === 0) {
    items.push(
      Math.abs(site.lon) > 100 && !polar
        ? tr('La Tierra nunca aparece en este cielo: es la cara oculta y hace falta un satélite repetidor.', 'Earth never appears in this sky: this is the far side and a relay satellite is required.')
        : tr('La Tierra no supera el relieve en ningún momento: sin satélite repetidor no hay comunicación.', 'Earth never clears the terrain: without a relay satellite there is no communication.'),
    );
  } else if (metrics.earthShare < 0.98) {
    items.push(
      tr(
        `La Tierra se asoma y se esconde por la libración (el cabeceo de la Luna): hay enlace directo solo el ${pct(metrics.earthShare)} del tiempo.`,
        `Earth peeks out and hides because of libration (the Moon's nodding): direct link only ${pct(metrics.earthShare)} of the time.`,
      ),
    );
  } else {
    items.push(tr('La Tierra permanece a la vista toda la misión: enlace directo continuo.', 'Earth stays in view all mission: continuous direct link.'));
  }

  if (horizon.model === 'lola-240m') {
    let best = 0;
    for (let i = 1; i < horizon.nAz; i++) if (horizon.elevationDeg[i] > horizon.elevationDeg[best]) best = i;
    const az = (best * 360) / horizon.nAz;
    items.push(
      tr(
        `El mayor obstáculo está al ${compass(az, lang)}, a ${km(horizon.distanceKm[best])}: levanta el horizonte ${deg(horizon.elevationDeg[best])}.`,
        `The biggest obstacle lies to the ${compass(az, lang)}, ${km(horizon.distanceKm[best])} away: it raises the horizon by ${deg(horizon.elevationDeg[best])}.`,
      ),
    );
  }

  return (
    <ul className="insights">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function JplCheck({ site, now }: { site: Site; now: number }) {
  const tr = useTr();
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; text?: string }>({ status: 'idle' });

  const run = async () => {
    setState({ status: 'loading' });
    try {
      const ref = await fetchJpl(site.lat, site.lon, now);
      const v = moonFixedVectors(new Date(ref.t));
      const frame = siteFrame(site.lat, site.lon);
      const s = topocentric(frame, v.sun);
      const e = topocentric(frame, v.earth);
      setState({
        status: 'done',
        text: tr(
          `Diferencia de elevación con JPL Horizons: Sol ${Math.abs(s.el - ref.sun.el).toFixed(3)}°, Tierra ${Math.abs(e.el - ref.earth.el).toFixed(3)}°. El disco solar mide ${(2 * (Math.asin(SUN_RADIUS_KM / 149.6e6) * 180) / Math.PI).toFixed(2)}°.`,
          `Elevation difference vs JPL Horizons: Sun ${Math.abs(s.el - ref.sun.el).toFixed(3)}°, Earth ${Math.abs(e.el - ref.earth.el).toFixed(3)}°. The solar disc spans ${(2 * (Math.asin(SUN_RADIUS_KM / 149.6e6) * 180) / Math.PI).toFixed(2)}°.`,
        ),
      });
    } catch {
      setState({ status: 'error', text: tr('No se pudo consultar JPL Horizons. Revisa la conexión e inténtalo de nuevo.', 'Could not reach JPL Horizons. Check the connection and try again.') });
    }
  };

  return (
    <div className="jpl">
      <button type="button" onClick={run} disabled={state.status === 'loading'}>
        {state.status === 'loading' ? tr('Consultando a JPL…', 'Asking JPL…') : tr('Comprobar con JPL Horizons', 'Check against JPL Horizons')}
      </button>
      {state.text && <p className={state.status === 'error' ? 'form-error' : 'jpl-result num'}>{state.text}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- Comparison

export interface Analysis {
  site: Site;
  horizon: Horizon;
  metrics: Metrics;
}

interface CompareProps {
  rows: Analysis[];
  selectedId: string;
  t0: number;
  t1: number;
  now: number;
  onSelect: (id: string) => void;
}

export function Compare({ rows, selectedId, t0, t1, now, onSelect }: CompareProps) {
  const tr = useTr();
  const best = useMemo(() => {
    const max = (f: (m: Metrics) => number) => Math.max(...rows.map((r) => f(r.metrics)));
    const min = (f: (m: Metrics) => number) => Math.min(...rows.map((r) => f(r.metrics)));
    return { sun: max((m) => m.sunShare), dark: min((m) => m.longestDarkMs), earth: max((m) => m.earthShare), both: max((m) => m.bothShare), score: max((m) => m.score) };
  }, [rows]);
  const mark = (cond: boolean) => (cond && rows.length > 1 ? 'is-best' : '');

  if (!rows.length) {
    return <p className="empty">{tr('Pulsa «Comparar» en dos o más sitios de la lista para verlos lado a lado.', 'Press “Compare” on two or more sites in the list to see them side by side.')}</p>;
  }
  return (
    <div className="compare-scroll">
      <table className="compare">
        <thead>
          <tr>
            <th>{tr('Sitio', 'Site')}</th>
            <th className="col-strip">
              {tr('Ventanas en la misión', 'Windows across the mission')}
              <span className="legend">
                <i className="swatch sun" /> {tr('luz', 'light')} <i className="swatch earth" /> {tr('enlace', 'link')}
              </span>
            </th>
            <th>{tr('Luz solar', 'Sunlight')}</th>
            <th>{tr('Noche más larga', 'Longest night')}</th>
            <th>{tr('Enlace', 'Link')}</th>
            <th>{tr('Ambos', 'Both')}</th>
            <th>{tr('Índice', 'Index')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ site, metrics: m }) => (
            <tr key={site.id} className={site.id === selectedId ? 'is-selected' : ''} onClick={() => onSelect(site.id)}>
              <th scope="row">
                <button type="button" onClick={() => onSelect(site.id)}>
                  {site.name}
                </button>
                <span className="num">{fmtLatLon(site.lat, site.lon)}</span>
              </th>
              <td className="col-strip">
                <WindowStrip metrics={m} t0={t0} t1={t1} now={now} />
              </td>
              <td className={`num ${mark(m.sunShare === best.sun)}`}>{pct(m.sunShare)}</td>
              <td className={`num ${mark(m.longestDarkMs === best.dark)}`}>{m.longestDarkMs > 0 ? fmtDuration(m.longestDarkMs) : tr('ninguna', 'none')}</td>
              <td className={`num ${mark(m.earthShare === best.earth)}`}>{pct(m.earthShare)}</td>
              <td className={`num ${mark(m.bothShare === best.both)}`}>{pct(m.bothShare)}</td>
              <td className={`num score-cell ${mark(m.score === best.score)}`}>{m.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------- Year calendar

interface CalendarProps {
  daily: { sun: Float32Array; earth: Float32Array; t0: number; days: number };
  landing: number;
  durationDays: number;
  onPickDay: (t: number) => void;
}

const DAY = 86400e3;

export const YearCalendar = memo(function YearCalendar({ daily, landing, durationDays, onPickDay }: CalendarProps) {
  const tr = useTr();
  const lang = useLang();
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const PADL = 64;
  const iw = Math.max(10, size.w - PADL - 14);
  const cw = iw / daily.days;
  const ROW = 26;
  const top = 22;

  const monthEvery = cw * 30 >= 36 ? 1 : cw * 30 >= 18 ? 2 : 3;
  const months = useMemo(() => {
    const out: Array<{ day: number; label: string }> = [];
    for (let d = 0; d < daily.days; d++) {
      const date = new Date(daily.t0 + d * DAY);
      if (date.getUTCDate() === 1) {
        out.push({ day: d, label: date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { month: 'short', year: date.getUTCMonth() === 0 ? '2-digit' : undefined, timeZone: 'UTC' }) });
      }
    }
    return out;
  }, [daily, lang]);

  const dayOf = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const d = Math.floor((e.clientX - rect.left - PADL) / cw);
    return d >= 0 && d < daily.days ? d : null;
  };
  const m0 = (landing - daily.t0) / DAY;

  return (
    <div
      ref={ref}
      className="calendar"
      onPointerMove={(e) => setHover(dayOf(e))}
      onPointerLeave={() => setHover(null)}
      onClick={(e) => {
        const d = dayOf(e as unknown as React.PointerEvent);
        if (d !== null) onPickDay(daily.t0 + d * DAY);
      }}
    >
      {size.w > 0 && (
        <svg width={size.w} height={top + 2 * ROW + 6}>
          {months.map((m) => (
            <g key={m.day}>
              <line className="tl-grid" x1={PADL + m.day * cw} x2={PADL + m.day * cw} y1={top - 6} y2={top + 2 * ROW + 4} />
              {daily.days - m.day > 12 && months.indexOf(m) % monthEvery === 0 && (
                <text className="tl-tick" x={PADL + m.day * cw + 4} y={12}>
                  {m.label}
                </text>
              )}
            </g>
          ))}
          {Array.from({ length: daily.days }, (_, d) => (
            <g key={d}>
              <rect x={PADL + d * cw} y={top} width={cw + 0.4} height={ROW - 3} className="cal-sun" fillOpacity={Math.min(1, daily.sun[d])} />
              <rect x={PADL + d * cw} y={top + ROW} width={cw + 0.4} height={ROW - 3} className="cal-earth" fillOpacity={Math.min(1, daily.earth[d])} />
            </g>
          ))}
          <text className="tl-axis" x={PADL - 8} y={top + 15} textAnchor="end">
            {tr('Luz solar', 'Sunlight')}
          </text>
          <text className="tl-axis" x={PADL - 8} y={top + ROW + 15} textAnchor="end">
            {tr('Enlace', 'Link')}
          </text>
          {m0 > -durationDays && m0 < daily.days && (
            <rect className="cal-window" x={PADL + Math.max(0, m0) * cw} y={top - 4} width={Math.max(2, (Math.min(daily.days, m0 + durationDays) - Math.max(0, m0)) * cw)} height={2 * ROW + 5} rx="2" />
          )}
          {hover !== null && <rect className="cal-hover" x={PADL + hover * cw} y={top - 4} width={Math.max(1.5, cw)} height={2 * ROW + 5} />}
        </svg>
      )}
      <p className="cal-readout num">
        {hover !== null
          ? `${fmtDate(daily.t0 + hover * DAY, lang, false)}: ${tr('luz', 'light')} ${pct(daily.sun[hover])}, ${tr('enlace', 'link')} ${pct(daily.earth[hover])}. ${tr('Clic para aterrizar este día.', 'Click to land on this day.')}`
          : tr('El recuadro marca la misión actual. Haz clic en cualquier día para mover el alunizaje.', 'The box marks the current mission. Click any day to move the landing.')}
      </p>
    </div>
  );
});

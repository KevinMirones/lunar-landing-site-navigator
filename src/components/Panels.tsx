// Text-and-number panels: site list, live status, comparison table, year calendar.
import { memo, useMemo, useState } from 'react';
import { SUN_RADIUS_KM, moonFixedVectors, siteFrame, topocentric } from '../lib/ephemeris';
import type { Scenario } from '../lib/scenario';
import { discFraction, nextEvent, type Horizon, type Metrics, type Sky, type WindowScores } from '../lib/series';
import type { CommsResult } from '../lib/comms';
import type { PowerResult } from '../lib/power';
import { fmtWattHours } from './Power';
import { normLon, siteMatches, type Site } from '../lib/sites';
import { compass, deg, fetchJpl, type Psr, fmtDate, fmtDuration, fmtLatLon, km, pct, useLang, useSize, useTr } from '../lib/util';
import { Closeup } from './Panorama';
import { Term } from './Term';
import { WindowStrip } from './Timeline';

// ---------------------------------------------------------------- Site list

interface SiteListProps {
  sites: Site[];
  /** Site of the active scenario. */
  activeSiteId: string;
  /** Site id of every scenario in the comparison (repeats allowed). */
  inUse: string[];
  canAdd: boolean;
  onSelect: (id: string) => void;
  onCompare: (id: string) => void;
  onAdd: (lat: number, lon: number) => void;
  onRemove: (id: string) => void;
}

export const SiteList = memo(function SiteList({ sites, activeSiteId, inUse, canAdd, onSelect, onCompare, onAdd, onRemove }: SiteListProps) {
  const tr = useTr();
  const lang = useLang();
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const shown = sites.filter((s) => siteMatches(s, query, lang));

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
      <input
        type="search"
        className="site-search"
        value={query}
        aria-label={tr('Buscar sitios por nombre, programa o año', 'Search sites by name, programme or year')}
        placeholder={tr('Buscar: nombre, programa o año', 'Search: name, programme or year')}
        onChange={(e) => setQuery(e.target.value)}
      />
      {shown.length === 0 && <p className="empty">{tr('Ningún sitio coincide con la búsqueda.', 'No site matches the search.')}</p>}
      {groups.map((g) => {
        const list = shown.filter((s) => s.group === g.key);
        if (!list.length) return null;
        return (
          <section key={g.key}>
            <h3>{g.title}</h3>
            <ul>
              {list.map((s) => {
                const count = inUse.filter((id) => id === s.id).length;
                return (
                  <li key={s.id} className={s.id === activeSiteId ? 'is-selected' : ''}>
                    <button type="button" className="site-main" onClick={() => onSelect(s.id)} aria-current={s.id === activeSiteId}>
                      <span className="site-name">{s.name}</span>
                      <span className="site-meta">{s.tag[lang]}</span>
                      <span className="site-meta num">{fmtLatLon(s.lat, s.lon)}</span>
                    </button>
                    <button
                      type="button"
                      className={`pin${count ? ' is-on' : ''}`}
                      disabled={!canAdd}
                      title={
                        canAdd
                          ? tr('Añadir un escenario con este sitio', 'Add a scenario with this site')
                          : tr('Hay seis escenarios, el máximo. Elimina uno para añadir otro.', 'There are six scenarios, the maximum. Remove one to add another.')
                      }
                      onClick={() => onCompare(s.id)}
                    >
                      {tr('Comparar', 'Compare')}
                      {count > 0 && ` (${count})`}
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
  /** Elevation margin of the Earth link, degrees (S09). */
  marginDeg?: number;
  /** Contact with the ground network (S09), or null without one. */
  contact?: CommsResult | null;
  /** Nearest permanent shadow (S16); null while loading or without a server. */
  psr?: Psr | null;
}

export function Status({ site, horizon, sky, metrics, now, windowEnd, marginDeg = 0, contact = null, psr = null }: StatusProps) {
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

  // With a margin (S09) the link needs Earth that many degrees above the terrain.
  const linked = marginDeg > 0 ? discFraction(horizon, sky.earth.az, sky.earth.el - marginDeg, sky.earth.radius) > 0.5 : sky.earth.frac > 0.5;
  const above = sky.earth.el - sky.earth.horizon;
  const earthState = linked ? (
    <>
      <Term id="link">{tr('Enlace directo', 'Direct link')}</Term> {tr('disponible', 'available')}
    </>
  ) : (
    sky.earth.frac > 0.5
      ? tr(`A ${deg(above)} sobre el terreno: con margen de ${marginDeg}° no hay enlace`, `${deg(above)} above the terrain: with a ${marginDeg}° margin there is no link`)
      : tr('Sin línea de vista', 'No line of sight')
  );

  return (
    <div className="status">
      <header className="status-site">
        <h2>{site.name}</h2>
        <p className="num">
          {fmtLatLon(site.lat, site.lon)}
          {horizon.model === 'lola' && `   ${horizon.siteElevationM >= 0 ? '+' : '−'}${Math.abs(horizon.siteElevationM)} m`}
        </p>
        <p className="status-note">{site.note[lang]}</p>
        {site.precision !== 'custom' && (
          <p className="status-source" data-level="expert">
            <b>{site.precision === 'published' ? tr('Coordenadas publicadas.', 'Published coordinates.') : tr('Punto representativo.', 'Representative point.')}</b> {site.source[lang]}
          </p>
        )}
        <p className={`model ${horizon.model}`}>
          {horizon.model === 'lola' ? (
            <>
              <Term id="horizon">{tr('Horizonte', 'Horizon')}</Term>{' '}
              {tr(`calculado con topografía LOLA de ${horizon.resolutionM ?? 240} m`, `computed from ${horizon.resolutionM ?? 240} m LOLA topography`)}
              {horizon.precomputed ? tr(' (precalculado)', ' (precomputed)') : ''} (<Term id="dem" />).
            </>
          ) : horizon.offline
              ? tr('Sin conexión con el servidor de terreno: se usa una Luna lisa.', 'Terrain server unreachable: using a smooth Moon.')
              : tr('Fuera de la cobertura de terreno (80°S a 90°S): se usa una Luna lisa.', 'Outside terrain coverage (80°S to 90°S): using a smooth Moon.')}
        </p>
        {psr && (
          <p className="status-psr">
            {!psr.covered ? (
              <>
                <Term id="shadow">{tr('Sombra permanente', 'Permanent shadow')}</Term>: {tr('sin dato fuera de 80°S a 90°S.', 'no data outside 80°S to 90°S.')}
              </>
            ) : psr.inside ? (
              <>
                {tr('Este punto está en', 'This point lies in')} <Term id="shadow" />.
              </>
            ) : psr.distanceKm !== null ? (
              <>
                <Term id="shadow">{tr('Sombra permanente', 'Permanent shadow')}</Term> {tr('más cercana:', 'nearest:')} {km(psr.distanceKm)} {tr('al', 'to the')} {compass(psr.bearingDeg ?? 0, lang)}.
              </>
            ) : (
              <>
                {tr('Ninguna zona en', 'No area in')} <Term id="shadow" /> {tr('a menos de 50 km.', 'within 50 km.')}
              </>
            )}
          </p>
        )}
      </header>

      <section className="body-card sun">
        <Closeup horizon={horizon} body={sky.sun} kind="sun" />
        <div>
          <h3>{tr('Sol', 'Sun')}</h3>
          <p className="state">{sky.sun.frac > 0.02 ? `${pct(sky.sun.frac)} ${tr('del disco visible', 'of the disc visible')}` : tr('Oculto', 'Hidden')}</p>
          <p className="countdown">{sunLine}</p>
        </div>
        <dl data-level="expert">
          <dt>
            <Term id="elevation">{tr('Elevación', 'Elevation')}</Term>
          </dt>
          <dd>{deg(sky.sun.el, 2)}</dd>
          <dt>{tr('Sobre el terreno', 'Above terrain')}</dt>
          <dd>{`${sky.sun.el - sky.sun.horizon >= 0 ? '+' : '−'}${deg(Math.abs(sky.sun.el - sky.sun.horizon), 2)}`}</dd>
          <dt>
            <Term id="azimuth">{tr('Azimut', 'Azimuth')}</Term>
          </dt>
          <dd>{`${sky.sun.az.toFixed(0)}° ${compass(sky.sun.az, lang)}`}</dd>
          <dt>{tr('Irradiancia', 'Irradiance')}</dt>
          <dd>{Math.round(irradiance)} W/m²</dd>
        </dl>
      </section>

      <section className="body-card earth">
        <Closeup horizon={horizon} body={sky.earth} kind="earth" />
        <div>
          <h3>{tr('Tierra', 'Earth')}</h3>
          <p className="state">{earthState}</p>
          <p className="countdown">{earthLine}</p>
        </div>
        <dl data-level="expert">
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
          <span>
            <Term id="index">{tr('índice de viabilidad', 'viability index')}</Term>, {tr('de 0 a 100', '0 to 100')}
          </span>
        </div>
        <dl>
          <dt>{tr('Con luz solar', 'In sunlight')}</dt>
          <dd>{pct(metrics.sunShare)}</dd>
          <dt data-level="expert">{tr('Noche más larga', 'Longest night')}</dt>
          <dd data-level="expert">{metrics.longestDarkMs > 0 ? fmtDuration(metrics.longestDarkMs) : tr('ninguna', 'none')}</dd>
          <dt>{tr('Con enlace a la Tierra', 'With Earth link')}</dt>
          <dd>{pct(metrics.earthShare)}</dd>
          <dt data-level="expert">{tr('Corte de enlace más largo', 'Longest link outage')}</dt>
          <dd data-level="expert">{metrics.longestNoEarthMs > 0 ? fmtDuration(metrics.longestNoEarthMs) : tr('ninguno', 'none')}</dd>
          <dt data-level="expert">{tr('Luz y enlace a la vez', 'Sunlight and link together')}</dt>
          <dd data-level="expert">{pct(metrics.bothShare)}</dd>
          {contact && (
            <>
              <dt data-level="expert">{tr('Contacto con estaciones, al día', 'Contact with stations, a day')}</dt>
              <dd data-level="expert">{contact.contactHoursPerDay.toFixed(1)} h</dd>
              <dt data-level="expert">{tr('Corte de contacto más largo', 'Longest contact gap')}</dt>
              <dd data-level="expert">{contact.longestGapMs > 0 ? fmtDuration(contact.longestGapMs) : tr('ninguno', 'none')}</dd>
            </>
          )}
        </dl>
        <Insights site={site} horizon={horizon} metrics={metrics} psr={psr} />
        <div data-level="expert">
          <JplCheck site={site} now={now} />
        </div>
      </section>
    </div>
  );
}

function Insights({ site, horizon, metrics, psr }: { site: Site; horizon: Horizon; metrics: Metrics; psr: Psr | null }) {
  const tr = useTr();
  const lang = useLang();
  const items: React.ReactNode[] = [];
  const polar = Math.abs(site.lat) > 80;

  if (metrics.sunShare === 0) {
    items.push(
      <>
        {tr('Ni un minuto de Sol directo en toda la misión. Así son las zonas en', 'Not one minute of direct Sun in the whole mission. This is what areas in')} <Term id="shadow" />
        {tr(', donde puede conservarse hielo: valiosas para la ciencia, imposibles para un panel solar.', ', where ice may survive, look like: valuable for science, impossible for a solar panel.')}
      </>,
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
      <>
        {tr('La Tierra se asoma y se esconde por la', 'Earth peeks out and hides because of')} <Term id="libration" />
        {tr(` (el cabeceo de la Luna): hay enlace directo solo el ${pct(metrics.earthShare)} del tiempo.`, ` (the Moon's nodding): direct link only ${pct(metrics.earthShare)} of the time.`)}
      </>,
    );
  } else {
    items.push(tr('La Tierra permanece a la vista toda la misión: enlace directo continuo.', 'Earth stays in view all mission: continuous direct link.'));
  }

  if (horizon.model === 'lola') {
    let best = 0;
    for (let i = 1; i < horizon.nAz; i++) if (horizon.elevationDeg[i] > horizon.elevationDeg[best]) best = i;
    const az = (best * 360) / horizon.nAz;
    items.push(
      horizon.elevationDeg[best] > 0
        ? tr(
            `El mayor obstáculo está al ${compass(az, lang)}, a ${km(horizon.distanceKm[best])}: levanta el horizonte ${deg(horizon.elevationDeg[best])}.`,
            `The biggest obstacle lies to the ${compass(az, lang)}, ${km(horizon.distanceKm[best])} away: it raises the horizon by ${deg(horizon.elevationDeg[best])}.`,
          )
        : tr(
            `Ningún relieve supera la horizontal: el horizonte queda por debajo en todas las direcciones (como mucho a ${deg(horizon.elevationDeg[best])}).`,
            `No terrain rises above the horizontal: the horizon lies below it in every direction (${deg(horizon.elevationDeg[best])} at most).`,
          ),
    );
  }

  // Science and engineering in one sentence (S16): light for the panels, shadow for the ice.
  if (psr?.covered && !psr.inside && psr.distanceKm !== null && psr.distanceKm <= 5 && metrics.sunShare >= 0.8) {
    items.push(
      tr(
        `Luz el ${pct(metrics.sunShare)} de la misión y sombra permanente a ${km(psr.distanceKm)}: energía y ciencia al alcance de un rover.`,
        `Light ${pct(metrics.sunShare)} of the mission and permanent shadow ${km(psr.distanceKm)} away: power and science within a rover's reach.`,
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

export interface ScenarioRow {
  scenario: Scenario;
  site: Site;
  /** Null while the terrain horizon of the site is still loading. */
  metrics: Metrics | null;
  /** Energy and battery with the shared lander (S08); null while loading. */
  power: PowerResult | null;
  /** Contact with the ground network (S09); null without one. */
  contact: CommsResult | null;
  /** Nearest permanent shadow (S16); null while loading. */
  psr: Psr | null;
}

interface CompareProps {
  rows: ScenarioRow[];
  activeId: string;
  /** Length of the shared mission-day axis: the longest scenario. */
  spanMs: number;
  /** Time since landing shown by the cursor, the same mission day on every row. */
  elapsed: number;
  canAdd: boolean;
  onActivate: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}

export function Compare({ rows, activeId, spanMs, elapsed, canAdd, onActivate, onDuplicate, onRemove }: CompareProps) {
  const tr = useTr();
  const lang = useLang();
  const best = useMemo(() => {
    const ms = rows.map((r) => r.metrics).filter((m): m is Metrics => m !== null);
    const max = (f: (m: Metrics) => number) => Math.max(...ms.map(f));
    const min = (f: (m: Metrics) => number) => Math.min(...ms.map(f));
    const ps = rows.map((r) => r.power).filter((p): p is PowerResult => p !== null);
    return {
      n: ms.length,
      sun: max((m) => m.sunShare),
      dark: min((m) => m.longestDarkMs),
      earth: max((m) => m.earthShare),
      both: max((m) => m.bothShare),
      score: max((m) => m.score),
      battery: Math.min(...ps.map((p) => p.minBatteryWh)),
      contact: Math.max(...rows.map((r) => r.contact?.contactHoursPerDay ?? -1)),
    };
  }, [rows]);
  const mark = (cond: boolean) => (cond && best.n > 1 ? 'is-best' : '');
  const spanDays = Math.round(spanMs / 86400e3);
  const withContact = rows.some((r) => r.contact);
  const withPsr = rows.some((r) => r.psr?.covered);

  return (
    <div className="compare-scroll">
      <table className="compare scenarios">
        <thead>
          <tr>
            <th>{tr('Sitio', 'Site')}</th>
            <th>{tr('Alunizaje', 'Landing')}</th>
            <th className="col-strip">
              {tr('Ventanas por día de misión', 'Windows by mission day')}
              <span className="legend">
                <i className="swatch sun" /> {tr('luz', 'light')} <i className="swatch earth" /> {tr('enlace', 'link')}
              </span>
              <span className="strip-axis num">
                <span>{tr('día 0', 'day 0')}</span>
                <span>{tr(`día ${spanDays}`, `day ${spanDays}`)}</span>
              </span>
            </th>
            <th>{tr('Luz solar', 'Sunlight')}</th>
            <th data-level="expert">{tr('Noche más larga', 'Longest night')}</th>
            <th>{tr('Enlace', 'Link')}</th>
            <th data-level="expert">{tr('Ambos', 'Both')}</th>
            <th>{tr('Índice', 'Index')}</th>
            {withPsr && <th title={tr('Distancia a la zona en sombra permanente más cercana, donde puede conservarse hielo.', 'Distance to the nearest permanently shadowed area, where ice may survive.')}>{tr('Sombra permanente', 'Permanent shadow')}</th>}
            {withContact && (
              <th data-level="expert" title={tr('Horas al día con enlace y alguna estación viendo la Luna.', 'Hours a day with a link and some station seeing the Moon.')}>
                {tr('Contacto', 'Contact')}
              </th>
            )}
            <th data-level="expert" title={tr('Batería mínima para sobrevivir la misión, con el módulo del bloque Energía.', 'Smallest battery that survives the mission, with the lander of the Power block.')}>
              {tr('Batería', 'Battery')}
            </th>
            <th aria-label={tr('Acciones', 'Actions')} />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ scenario: sc, site, metrics: m, power: p, contact: c, psr: z }) => (
            <tr key={sc.id} className={sc.id === activeId ? 'is-selected' : ''} onClick={() => onActivate(sc.id)}>
              <th scope="row">
                <button type="button" onClick={() => onActivate(sc.id)} aria-current={sc.id === activeId}>
                  {site.name}
                </button>
                <span className="num">{fmtLatLon(site.lat, site.lon)}</span>
              </th>
              <td className="col-when">
                <span className="num">{fmtDate(sc.landing, lang)}</span>
                <span className="sub num">
                  {sc.durationDays} d, {tr('mástil', 'mast')} {sc.mast} m
                </span>
              </td>
              <td className="col-strip">
                {m ? (
                  <WindowStrip metrics={m} landing={sc.landing} spanMs={spanMs} durationMs={sc.durationDays * 86400e3} elapsed={elapsed} />
                ) : (
                  <span className="sub">{tr('Calculando el horizonte…', 'Computing the horizon…')}</span>
                )}
              </td>
              <td className={`num ${m ? mark(m.sunShare === best.sun) : ''}`}>{m ? pct(m.sunShare) : '—'}</td>
              <td data-level="expert" className={`num ${m ? mark(m.longestDarkMs === best.dark) : ''}`}>{m ? (m.longestDarkMs > 0 ? fmtDuration(m.longestDarkMs) : tr('ninguna', 'none')) : '—'}</td>
              <td className={`num ${m ? mark(m.earthShare === best.earth) : ''}`}>{m ? pct(m.earthShare) : '—'}</td>
              <td data-level="expert" className={`num ${m ? mark(m.bothShare === best.both) : ''}`}>{m ? pct(m.bothShare) : '—'}</td>
              <td className={`num score-cell ${m ? mark(m.score === best.score) : ''}`}>{m ? m.score : '—'}</td>
              {withPsr && <td className="num psr-cell">{!z?.covered ? '—' : z.inside ? tr('dentro', 'inside') : z.distanceKm !== null ? km(z.distanceKm) : '> 50 km'}</td>}
              {withContact && (
                <td data-level="expert" className={`num contact-cell ${c ? mark(c.contactHoursPerDay === best.contact) : ''}`}>
                  {c ? `${c.contactHoursPerDay.toFixed(1)} ${tr('h/día', 'h/day')}` : '—'}
                </td>
              )}
              <td data-level="expert" className={`num battery-cell ${p ? mark(p.minBatteryWh === best.battery) : ''}`}>
                {p ? (
                  <>
                    {fmtWattHours(p.minBatteryWh)}
                    <span className={`survives ${p.survives ? 'ok' : 'bad'}`} title={p.survives ? tr('La batería del bloque Energía basta', 'The battery of the Power block is enough') : tr('La batería del bloque Energía no basta', 'The battery of the Power block is not enough')}>
                      {p.survives ? tr('basta', 'enough') : tr('no basta', 'not enough')}
                    </span>
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={!canAdd}
                  title={canAdd ? tr('Crea una copia siete días después', 'Creates a copy seven days later') : tr('Hay seis escenarios, el máximo.', 'There are six scenarios, the maximum.')}
                  onClick={() => onDuplicate(sc.id)}
                >
                  {tr('Duplicar con otra fecha', 'Duplicate with another date')}
                </button>
                <button
                  type="button"
                  className="icon"
                  disabled={rows.length <= 1}
                  aria-label={tr(`Eliminar el escenario de ${site.name}`, `Remove the ${site.name} scenario`)}
                  title={rows.length <= 1 ? tr('Siempre queda un escenario.', 'One scenario always remains.') : tr('Eliminar escenario', 'Remove scenario')}
                  onClick={() => onRemove(sc.id)}
                >
                  ×
                </button>
              </td>
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
  /** What a mission would score if it landed on each day of the calendar. */
  scores: WindowScores;
  /** Day indices of the best landing dates, best first. */
  best: number[];
  landing: number;
  durationDays: number;
  /** `asNew` is true for a shift-click: add a scenario on that day instead of moving the active one. */
  onPickDay: (t: number, asNew: boolean) => void;
}

const DAY = 86400e3;

export const YearCalendar = memo(function YearCalendar({ daily, scores, best, landing, durationDays, onPickDay }: CalendarProps) {
  const tr = useTr();
  const lang = useLang();
  const [ref, size] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const PADL = 64;
  const iw = Math.max(10, size.w - PADL - 14);
  const cw = iw / daily.days;
  const ROW = 26;
  const ROWS = 3;
  const top = 22;
  const bottom = top + ROWS * ROW;

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
        if (d !== null) onPickDay(daily.t0 + d * DAY, e.shiftKey);
      }}
    >
      {size.w > 0 && (
        <svg width={size.w} height={bottom + 22}>
          {months.map((m) => (
            <g key={m.day}>
              <line className="tl-grid" x1={PADL + m.day * cw} x2={PADL + m.day * cw} y1={top - 6} y2={bottom + 1} />
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
              {d < scores.days && <rect x={PADL + d * cw} y={top + 2 * ROW} width={cw + 0.4} height={ROW - 3} className="cal-score" fillOpacity={(scores.score[d] / 100) ** 1.6} />}
            </g>
          ))}
          <text className="tl-axis" x={PADL - 8} y={top + 15} textAnchor="end">
            {tr('Luz solar', 'Sunlight')}
          </text>
          <text className="tl-axis" x={PADL - 8} y={top + ROW + 15} textAnchor="end">
            {tr('Enlace', 'Link')}
          </text>
          <text className="tl-axis" x={PADL - 8} y={top + 2 * ROW + 15} textAnchor="end">
            {tr('Índice', 'Index')}
          </text>
          {best.map((d, k) => (
            <g key={d} className="cal-best" transform={`translate(${PADL + (d + 0.5) * cw},${bottom})`}>
              <path d="M0,0l-4,6h8z" />
              <text y="18" textAnchor="middle">
                {k + 1}
              </text>
            </g>
          ))}
          {m0 > -durationDays && m0 < daily.days && (
            <rect className="cal-window" x={PADL + Math.max(0, m0) * cw} y={top - 4} width={Math.max(2, (Math.min(daily.days, m0 + durationDays) - Math.max(0, m0)) * cw)} height={ROWS * ROW + 5} rx="2" />
          )}
          {hover !== null && <rect className="cal-hover" x={PADL + hover * cw} y={top - 4} width={Math.max(1.5, cw)} height={ROWS * ROW + 5} />}
        </svg>
      )}
      <p className="cal-readout num">
        {hover !== null
          ? `${fmtDate(daily.t0 + hover * DAY, lang, false)}: ${tr('luz', 'light')} ${pct(daily.sun[hover])}, ${tr('enlace', 'link')} ${pct(daily.earth[hover])}${
              hover < scores.days ? tr(`; una misión de ${durationDays} d que aterrice este día tendría índice ${scores.score[hover]}`, `; a ${durationDays}-day mission landing this day would score ${scores.score[hover]}`) : ''
            }. ${tr('Clic para aterrizar este día; Mayús + clic lo añade como escenario.', 'Click to land on this day; Shift + click adds it as a scenario.')}`
          : tr('El recuadro marca el escenario activo. Clic en un día para mover el alunizaje; Mayús + clic para añadirlo como escenario.', 'The box marks the active scenario. Click a day to move the landing; Shift + click to add it as a scenario.')}
      </p>
    </div>
  );
});

// ---------------------------------------------------------------- Best landing dates

interface BestDatesProps {
  scores: WindowScores;
  best: number[];
  requireSun: boolean;
  canAdd: boolean;
  onRequireSun: (on: boolean) => void;
  onApply: (t: number) => void;
  onAdd: (t: number) => void;
}

export const BestDates = memo(function BestDates({ scores, best, requireSun, canAdd, onRequireSun, onApply, onAdd }: BestDatesProps) {
  const tr = useTr();
  const lang = useLang();
  return (
    <div className="best-dates">
      <label className="check">
        <input type="checkbox" checked={requireSun} onChange={(e) => onRequireSun(e.target.checked)} />
        {tr('Solo fechas con Sol visible en el alunizaje', 'Only dates with the Sun visible at landing')}
      </label>
      {best.length === 0 ? (
        <p className="empty">
          {requireSun
            ? tr('Ninguna fecha de estos doce meses tiene Sol en el alunizaje. Desmarca la casilla para ver las demás.', 'No date in these twelve months has the Sun up at landing. Untick the box to see the others.')
            : tr('No hay fechas que evaluar.', 'There are no dates to evaluate.')}
        </p>
      ) : (
        <div className="compare-scroll">
          <table className="compare best-dates-table">
            <thead>
              <tr>
                <th>{tr('Alunizaje', 'Landing')}</th>
                <th>{tr('Luz solar', 'Sunlight')}</th>
                <th>{tr('Noche más larga', 'Longest night')}</th>
                <th>{tr('Enlace', 'Link')}</th>
                <th>{tr('Índice', 'Index')}</th>
                <th aria-label={tr('Acciones', 'Actions')} />
              </tr>
            </thead>
            <tbody>
              {best.map((d, k) => {
                const t = scores.t0 + d * DAY;
                return (
                  <tr key={d}>
                    <th scope="row">
                      <span className="pick-n num">{k + 1}</span>
                      <span className="num">{fmtDate(t, lang, false)}</span>
                    </th>
                    <td className="num">{pct(scores.sunShare[d])}</td>
                    <td className="num">{scores.longestDarkH[d] > 0.01 ? fmtDuration(scores.longestDarkH[d] * 3600e3) : tr('ninguna', 'none')}</td>
                    <td className="num">{pct(scores.earthShare[d])}</td>
                    <td className="num score-cell">{scores.score[d]}</td>
                    <td className="row-actions">
                      <button type="button" onClick={() => onApply(t)}>
                        {tr('Aterrizar este día', 'Land on this day')}
                      </button>
                      <button type="button" disabled={!canAdd} title={canAdd ? undefined : tr('Hay seis escenarios, el máximo.', 'There are six scenarios, the maximum.')} onClick={() => onAdd(t)}>
                        {tr('Añadir como escenario', 'Add as scenario')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

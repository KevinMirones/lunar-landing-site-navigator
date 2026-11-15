import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { moonFixedVectors } from './lib/ephemeris';
import { dailyShares, frameSeries, metrics as computeMetrics, siteSeries, skyAt, type Horizon, type TimeGrid } from './lib/series';
import { CATALOG, customSite, type Lang, type Site } from './lib/sites';
import { LangContext, fetchHeightmap, fetchHorizon, fmtDate, fromInput, toInput, useMedia, useStoredState, type Heightmap } from './lib/util';
import { Chevron, Collapse, FocusIcon, SectionToggle } from './components/Collapse';
import { Globe } from './components/Globe';
import { Compare, SiteList, Status, YearCalendar, type Analysis } from './components/Panels';
import { Panorama } from './components/Panorama';
import { PolarMap } from './components/PolarMap';
import { Timeline } from './components/Timeline';
import { Wordmark } from './components/Wordmark';

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const DURATIONS = [14, 30, 60, 90];
const MASTS = [2, 10, 50];
const SPEEDS = [0.5, 2, 6]; // mission days per second
const MAX_PINNED = 5;
// Which panels are open. Purely visual: closing one never stops its computations.
const PANELS = { sites: true, status: true, hero: true, when: true, compare: true, calendar: true };
type Panel = keyof typeof PANELS;

const todayUtc = () => Math.floor(Date.now() / DAY) * DAY;
const monthStart = (t: number) => {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
};
const horizonKey = (s: Site, mast: number) => `${s.lat}|${s.lon}|${mast}`;

export default function App() {
  const [lang, setLang] = useState<Lang>('es');
  const tr = (es: string, en: string) => (lang === 'es' ? es : en);

  const [custom, setCustom] = useState<Site[]>([]);
  const customCount = useRef(0);
  const sites = useMemo(() => [...CATALOG, ...custom], [custom]);
  const [selectedId, setSelectedId] = useState('ridge');
  const [pinned, setPinned] = useState<string[]>(['ridge', 'shackleton-floor', 'malapert', 'im2']);

  const [landing, setLanding] = useState(todayUtc);
  const [durationDays, setDurationDays] = useState(30);
  const [now, setNow] = useState(landing);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [mast, setMast] = useState(2);
  const [yearStart, setYearStart] = useState(() => monthStart(landing));

  const [mapView, setMapView] = useState<'polar' | 'globe'>('polar');
  const [mapMode, setMapMode] = useState<'sun' | 'earth'>('sun');
  const [panels, setPanels] = useStoredState('lumina.panels', PANELS);
  const togglePanel = (p: Panel) => setPanels((s) => ({ ...s, [p]: !s[p] }));
  const sidesOpen = panels.sites || panels.status;
  // Where a side panel stacks above or below the map, it folds up instead of sideways.
  const sitesStacked = useMedia('(max-width: 760px)');
  const statusStacked = useMedia('(max-width: 1240px)');
  const [heightmap, setHeightmap] = useState<Heightmap | null | 'loading'>('loading');
  const [horizons, setHorizons] = useState<Record<string, Horizon & { offline?: boolean }>>({});
  const inflight = useRef(new Set<string>());

  const selected = sites.find((s) => s.id === selectedId) ?? sites[0];
  const windowEnd = landing + durationDays * DAY;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    fetchHeightmap().then(setHeightmap);
  }, []);

  // Terrain horizons for the selected site and every compared site.
  const needed = useMemo(() => {
    const ids = new Set([selectedId, ...pinned]);
    return sites.filter((s) => ids.has(s.id));
  }, [sites, selectedId, pinned]);
  useEffect(() => {
    for (const s of needed) {
      const key = horizonKey(s, mast);
      if (horizons[key] || inflight.current.has(key)) continue;
      inflight.current.add(key);
      fetchHorizon(s.lat, s.lon, mast).then((h) => {
        inflight.current.delete(key);
        setHorizons((prev) => ({ ...prev, [key]: h }));
      });
    }
  }, [needed, mast, horizons]);

  // Mission analysis: one shared ephemeris grid, one series per site.
  const grid: TimeGrid = useMemo(() => {
    const stepMs = durationDays <= 30 ? HOUR / 2 : HOUR;
    return { t0: landing, stepMs, n: Math.round((durationDays * DAY) / stepMs) + 1 };
  }, [landing, durationDays]);
  const analyses = useMemo(() => {
    const frame = frameSeries(grid);
    const out = new Map<string, Analysis & { series: ReturnType<typeof siteSeries> }>();
    for (const s of needed) {
      const horizon = horizons[horizonKey(s, mast)];
      if (!horizon) continue;
      const series = siteSeries(s.lat, s.lon, horizon, frame);
      out.set(s.id, { site: s, horizon, series, metrics: computeMetrics(series) });
    }
    return out;
  }, [grid, needed, horizons, mast]);
  const current = analyses.get(selected.id);
  const selectedHorizon = horizons[horizonKey(selected, mast)];

  // Twelve months of daily conditions for the selected site.
  useEffect(() => {
    if (landing < yearStart || landing > yearStart + 330 * DAY) setYearStart(monthStart(landing));
  }, [landing, yearStart]);
  const daily = useMemo(() => {
    if (!selectedHorizon) return null;
    const yearGrid: TimeGrid = { t0: yearStart, stepMs: 2 * HOUR, n: 366 * 12 };
    return dailyShares(siteSeries(selected.lat, selected.lon, selectedHorizon, frameSeries(yearGrid)));
  }, [selected, selectedHorizon, yearStart]);

  // The sky right now.
  const vectors = useMemo(() => moonFixedVectors(new Date(now)), [now]);
  const sky = useMemo(
    () => (selectedHorizon ? skyAt(selected.lat, selected.lon, selectedHorizon, vectors.sun, vectors.earth) : null),
    [selected, selectedHorizon, vectors],
  );

  // Playback.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(100, t - last);
      last = t;
      setNow((n) => {
        const next = n + (dt / 1000) * speed * DAY;
        return next > windowEnd ? landing : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, landing, windowEnd]);

  const changeLanding = useCallback((t: number) => {
    if (!Number.isFinite(t)) return;
    setLanding(t);
    setNow(t);
  }, []);
  useEffect(() => {
    setNow((n) => Math.min(Math.max(n, landing), windowEnd));
  }, [landing, windowEnd]);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      const s = sites.find((x) => x.id === id);
      if (s) setMapView(s.lat <= -80 ? 'polar' : 'globe');
    },
    [sites],
  );
  const addSite = useCallback((lat: number, lon: number) => {
    const s = customSite(lat, lon, ++customCount.current);
    setCustom((c) => [...c, s]);
    setSelectedId(s.id);
    setMapView(s.lat <= -80 ? 'polar' : 'globe');
  }, []);
  // A map click moves the current scratch point instead of piling up new ones.
  const pick = useCallback(
    (lat: number, lon: number) => {
      if (selected.group === 'custom' && !pinned.includes(selected.id)) {
        const moved = { ...customSite(lat, lon, 0), id: selected.id, name: selected.name };
        setCustom((c) => c.map((s) => (s.id === selected.id ? moved : s)));
      } else {
        const s = customSite(lat, lon, ++customCount.current);
        setCustom((c) => [...c, s]);
        setSelectedId(s.id);
      }
    },
    [selected, pinned],
  );
  const togglePin = useCallback(
    (id: string) => setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX_PINNED ? [...p.slice(1), id] : [...p, id])),
    [],
  );
  const removeSite = useCallback((id: string) => {
    setCustom((c) => c.filter((s) => s.id !== id));
    setPinned((p) => p.filter((x) => x !== id));
    setSelectedId((sel) => (sel === id ? 'ridge' : sel));
  }, []);

  const compareRows = pinned.map((id) => analyses.get(id)).filter((a): a is NonNullable<typeof a> => !!a);
  const polarAvailable = heightmap && heightmap !== 'loading';

  return (
    <LangContext.Provider value={lang}>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <Wordmark />
            <span className="tagline">{tr('Luz y enlace para alunizar en el polo sur', 'Light and link for landing at the lunar south pole')}</span>
          </div>
          <div className="controls">
            <label>
              {tr('Alunizaje (UTC)', 'Landing (UTC)')}
              <input type="datetime-local" value={toInput(landing)} onChange={(e) => changeLanding(fromInput(e.target.value))} />
            </label>
            <fieldset>
              <legend>{tr('Duración', 'Duration')}</legend>
              <div className="segmented">
                {DURATIONS.map((d) => (
                  <button key={d} type="button" aria-pressed={d === durationDays} onClick={() => setDurationDays(d)}>
                    {d} d
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset title={tr('Altura de paneles y antena sobre el suelo: unos metros cambian el horizonte en el polo.', 'Height of panels and antenna above ground: a few metres change the horizon at the pole.')}>
              <legend>{tr('Altura del mástil', 'Mast height')}</legend>
              <div className="segmented">
                {MASTS.map((m) => (
                  <button key={m} type="button" aria-pressed={m === mast} onClick={() => setMast(m)}>
                    {m} m
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="segmented lang" role="group" aria-label={tr('Idioma', 'Language')}>
              <button type="button" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>
                ES
              </button>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
                EN
              </button>
            </div>
          </div>
        </header>

        <section className="hero" aria-label={tr('Vista desde el sitio', 'View from the site')}>
          <div className="hero-head">
            <h1>
              {tr('El cielo desde', 'The sky from')} {selected.name}
            </h1>
            <p className="num">{fmtDate(now, lang)}</p>
            <SectionToggle open={panels.hero} controls="hero-body" label={tr('el panorama', 'the panorama')} onToggle={() => togglePanel('hero')} />
          </div>
          <Collapse id="hero-body" open={panels.hero}>
            {selectedHorizon && sky ? (
              <Panorama horizon={selectedHorizon} sky={sky} series={current?.series ?? null} />
            ) : (
              <div className="panorama loading">{tr('Calculando el horizonte del terreno…', 'Computing the terrain horizon…')}</div>
            )}
          </Collapse>
        </section>

        <div className={`workspace${panels.sites ? '' : ' sites-closed'}${panels.status ? '' : ' status-closed'}`}>
          <aside className="col-sites drawer">
            <div className="drawer-body" id="drawer-sites">
              <div className="drawer-head">
                <h2>{tr('Sitios', 'Sites')}</h2>
                <SectionToggle open={panels.sites} controls="drawer-sites" label={tr('los sitios', 'the sites')} dir={sitesStacked ? 'up' : 'left'} onToggle={() => togglePanel('sites')} />
              </div>
              <Collapse id="sites-fold" open={panels.sites || !sitesStacked}>
                <SiteList sites={sites} selectedId={selected.id} pinned={pinned} onSelect={select} onTogglePin={togglePin} onAdd={addSite} onRemove={removeSite} />
              </Collapse>
            </div>
            <button type="button" className="drawer-rail" aria-expanded={panels.sites} aria-controls="drawer-sites" aria-label={tr('Mostrar los sitios', 'Show the sites')} title={tr('Mostrar los sitios', 'Show the sites')} onClick={() => togglePanel('sites')}>
              <Chevron dir="right" />
              <span className="rail-label">{tr('Sitios', 'Sites')}</span>
            </button>
          </aside>

          <section className="col-map">
            <div className="map-head">
              <div className="segmented" role="group" aria-label={tr('Tipo de mapa', 'Map type')}>
                <button type="button" aria-pressed={mapView === 'polar'} onClick={() => setMapView('polar')}>
                  {tr('Polo sur', 'South pole')}
                </button>
                <button type="button" aria-pressed={mapView === 'globe'} onClick={() => setMapView('globe')}>
                  {tr('Globo', 'Globe')}
                </button>
              </div>
              <div className="map-tools">
                {mapView === 'polar' && (
                  <div className="segmented" role="group" aria-label={tr('Capa', 'Layer')}>
                    <button type="button" className="sun" aria-pressed={mapMode === 'sun'} onClick={() => setMapMode('sun')}>
                      {tr('Dónde da el Sol', 'Where the Sun reaches')}
                    </button>
                    <button type="button" className="earth" aria-pressed={mapMode === 'earth'} onClick={() => setMapMode('earth')}>
                      {tr('Dónde se ve la Tierra', 'Where Earth is visible')}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="toggle focus"
                  aria-pressed={!sidesOpen}
                  aria-label={sidesOpen ? tr('Ampliar el mapa', 'Expand the map') : tr('Mostrar los paneles', 'Show the panels')}
                  title={sidesOpen ? tr('Ampliar el mapa', 'Expand the map') : tr('Mostrar los paneles', 'Show the panels')}
                  onClick={() => setPanels((s) => ({ ...s, sites: !sidesOpen, status: !sidesOpen }))}
                >
                  <FocusIcon expanded={!sidesOpen} />
                </button>
              </div>
            </div>
            <div className="map-body">
              {mapView === 'globe' ? (
                <Globe sunDir={vectors.sun} earthDir={vectors.earth} sites={sites} selectedId={selected.id} pinned={pinned} onSelect={select} onPick={pick} />
              ) : polarAvailable ? (
                <PolarMap hm={heightmap} sunDir={vectors.sun} earthDir={vectors.earth} mode={mapMode} sites={sites} selectedId={selected.id} pinned={pinned} onSelect={select} onPick={pick} />
              ) : (
                <div className="map-empty">
                  {heightmap === 'loading'
                    ? tr('Cargando la topografía LOLA…', 'Loading LOLA topography…')
                    : tr('No se pudo cargar la topografía. Inicia el servidor con «npm run dev» y ejecuta «npm run fetch-data».', 'Topography could not be loaded. Start the server with “npm run dev” and run “npm run fetch-data”.')}
                </div>
              )}
            </div>
          </section>

          <aside className="col-status drawer">
            <div className="drawer-body" id="drawer-status">
              <div className="drawer-head">
                <h2>{tr('Estado del sitio', 'Site status')}</h2>
                <SectionToggle open={panels.status} controls="drawer-status" label={tr('el estado del sitio', 'the site status')} dir={statusStacked ? 'up' : 'right'} onToggle={() => togglePanel('status')} />
              </div>
              <Collapse id="status-fold" open={panels.status || !statusStacked}>
                {selectedHorizon && sky && current ? (
                  <Status site={selected} horizon={selectedHorizon} sky={sky} metrics={current.metrics} now={now} windowEnd={windowEnd} />
                ) : (
                  <p className="empty">{tr('Calculando…', 'Computing…')}</p>
                )}
              </Collapse>
            </div>
            <button type="button" className="drawer-rail" aria-expanded={panels.status} aria-controls="drawer-status" aria-label={tr('Mostrar el estado del sitio', 'Show the site status')} title={tr('Mostrar el estado del sitio', 'Show the site status')} onClick={() => togglePanel('status')}>
              <Chevron dir="left" />
              <span className="rail-label">{tr('Estado del sitio', 'Site status')}</span>
            </button>
          </aside>
        </div>

        <section className="when">
          <div className="when-head">
            <h2>{tr('La misión en el tiempo', 'The mission over time')}</h2>
            <div className="transport">
              <button type="button" className="play" onClick={() => setPlaying((p) => !p)}>
                {playing ? tr('Pausar', 'Pause') : tr('Reproducir', 'Play')}
              </button>
              <div className="segmented" role="group" aria-label={tr('Velocidad', 'Speed')}>
                {SPEEDS.map((s) => (
                  <button key={s} type="button" aria-pressed={s === speed} onClick={() => setSpeed(s)}>
                    {s < 1 ? `12 h/s` : `${s} d/s`}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setNow(landing)}>
                {tr('Volver al alunizaje', 'Back to landing')}
              </button>
            </div>
            <SectionToggle open={panels.when} controls="when-body" label={tr('la línea de tiempo', 'the timeline')} onToggle={() => togglePanel('when')} />
          </div>
          <Collapse id="when-body" open={panels.when}>
            {current && selectedHorizon ? (
              <Timeline series={current.series} horizon={selectedHorizon} metrics={current.metrics} now={now} onScrub={setNow} />
            ) : (
              <p className="empty">{tr('Calculando…', 'Computing…')}</p>
            )}
          </Collapse>
        </section>

        <section className="lower">
          <div className="lower-block">
            <div className="block-head">
              <h2>{tr('Comparar sitios', 'Compare sites')}</h2>
              <SectionToggle open={panels.compare} controls="compare-body" label={tr('la comparación', 'the comparison')} onToggle={() => togglePanel('compare')} />
            </div>
            <Collapse id="compare-body" open={panels.compare}>
              <p className="lede">
                {tr(
                  'Misma fecha y duración para todos. Unos kilómetros de diferencia cambian por completo la energía y las comunicaciones.',
                  'Same date and duration for all. A few kilometres of difference completely change power and communications.',
                )}
              </p>
              <Compare rows={compareRows} selectedId={selected.id} t0={landing} t1={windowEnd} now={now} onSelect={select} />
            </Collapse>
          </div>
          <div className="lower-block">
            <div className="block-head">
              <h2>
                {tr('Mejores fechas en', 'Best dates at')} {selected.name}
              </h2>
              <SectionToggle open={panels.calendar} controls="calendar-body" label={tr('el calendario', 'the calendar')} onToggle={() => togglePanel('calendar')} />
            </div>
            <Collapse id="calendar-body" open={panels.calendar}>
              <p className="lede">
                {tr(
                  'Doce meses, día a día. Cuanto más intenso el color, más horas de luz o de enlace. Útil cuando un retraso obliga a replanificar.',
                  'Twelve months, day by day. The stronger the colour, the more hours of light or link. Useful when a delay forces a replan.',
                )}
              </p>
              {daily ? <YearCalendar daily={daily} landing={landing} durationDays={durationDays} onPickDay={changeLanding} /> : <p className="empty">{tr('Calculando…', 'Computing…')}</p>}
            </Collapse>
          </div>
        </section>

        <footer className="foot">
          <p>
            {tr(
              'Datos: topografía LOLA de Lunar Reconnaissance Orbiter (NASA GSFC, PDS), mosaico LROC (NASA SVS), efemérides validadas contra NASA/JPL Horizons. Herramienta de apoyo a la planificación; no sustituye un análisis de misión.',
              'Data: LOLA topography from Lunar Reconnaissance Orbiter (NASA GSFC, PDS), LROC mosaic (NASA SVS), ephemeris validated against NASA/JPL Horizons. A planning aid; it does not replace a mission analysis.',
            )}
          </p>
        </footer>
      </div>
    </LangContext.Provider>
  );
}

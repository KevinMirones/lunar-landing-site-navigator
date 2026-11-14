import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { moonFixedVectors } from './lib/ephemeris';
import {
  DURATIONS,
  MASTS,
  MAX_SCENARIOS,
  addScenario,
  analysisKey,
  analyzeScenario,
  duplicateScenario,
  maxSpanMs,
  removeScenario,
  updateScenario,
  type Scenario,
  type ScenarioAnalysis,
} from './lib/scenario';
import { dailyShares, frameSeries, siteSeries, skyAt, type Horizon, type TimeGrid } from './lib/series';
import { CATALOG, customSite, type Lang, type Site } from './lib/sites';
import { LangContext, fetchHeightmap, fetchHorizon, fmtDate, fromInput, toInput, type Heightmap } from './lib/util';
import { Globe } from './components/Globe';
import { Compare, SiteList, Status, YearCalendar, type ScenarioRow } from './components/Panels';
import { Panorama } from './components/Panorama';
import { PolarMap } from './components/PolarMap';
import { Timeline } from './components/Timeline';

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const SPEEDS = [0.5, 2, 6]; // mission days per second
const FALLBACK_SITE = CATALOG[0];

type LoadedHorizon = Horizon & { offline?: boolean };

const todayUtc = () => Math.floor(Date.now() / DAY) * DAY;
const monthStart = (t: number) => {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
};
const horizonKey = (site: Site, mast: number) => `${site.lat}|${site.lon}|${mast}`;

function defaultScenarios(): Scenario[] {
  const landing = todayUtc();
  return ['ridge', 'shackleton-floor', 'malapert', 'im2'].map((siteId, i) => ({ id: `e${i + 1}`, siteId, landing, durationDays: 30, mast: 2 }));
}

export default function App() {
  const [lang, setLang] = useState<Lang>('es');
  const tr = (es: string, en: string) => (lang === 'es' ? es : en);

  const [custom, setCustom] = useState<Site[]>([]);
  const customCount = useRef(0);
  const sites = useMemo(() => [...CATALOG, ...custom], [custom]);
  const siteOf = useCallback((id: string) => sites.find((s) => s.id === id) ?? FALLBACK_SITE, [sites]);

  const [scenarios, setScenarios] = useState<Scenario[]>(defaultScenarios);
  const [activeId, setActiveId] = useState('e1');
  /** Time since the active scenario's landing; kept when switching scenario so rows compare the same mission day. */
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);

  const [mapView, setMapView] = useState<'polar' | 'globe'>('polar');
  const [mapMode, setMapMode] = useState<'sun' | 'earth'>('sun');
  const [heightmap, setHeightmap] = useState<Heightmap | null | 'loading'>('loading');
  const [horizons, setHorizons] = useState<Record<string, LoadedHorizon>>({});
  const inflight = useRef(new Set<string>());

  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  const site = siteOf(active.siteId);
  const { landing, durationDays, mast } = active;
  const durationMs = durationDays * DAY;
  const now = landing + Math.min(elapsed, durationMs);
  const windowEnd = landing + durationMs;
  const [yearStart, setYearStart] = useState(() => monthStart(landing));

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    fetchHeightmap().then(setHeightmap);
  }, []);
  useEffect(() => {
    if (active.id !== activeId) setActiveId(active.id);
  }, [active.id, activeId]);

  // Terrain horizon for every (site, mast) pair in use.
  useEffect(() => {
    for (const sc of scenarios) {
      const s = siteOf(sc.siteId);
      const key = horizonKey(s, sc.mast);
      if (horizons[key] || inflight.current.has(key)) continue;
      inflight.current.add(key);
      fetchHorizon(s.lat, s.lon, sc.mast).then((h) => {
        inflight.current.delete(key);
        setHorizons((prev) => ({ ...prev, [key]: h }));
      });
    }
  }, [scenarios, siteOf, horizons]);

  // One analysis per scenario, recomputed only when that scenario or its horizon changes.
  const cache = useRef(new Map<string, { horizon: Horizon; analysis: ScenarioAnalysis }>());
  const analyses = useMemo(() => {
    const out = new Map<string, ScenarioAnalysis & { horizon: LoadedHorizon }>();
    const live = new Set<string>();
    for (const sc of scenarios) {
      const s = siteOf(sc.siteId);
      const horizon = horizons[horizonKey(s, sc.mast)];
      if (!horizon) continue;
      const key = analysisKey(sc, s);
      live.add(key);
      let hit = cache.current.get(key);
      if (!hit || hit.horizon !== horizon) {
        hit = { horizon, analysis: analyzeScenario(sc, s, horizon) };
        cache.current.set(key, hit);
      }
      out.set(sc.id, { ...hit.analysis, horizon });
    }
    for (const key of cache.current.keys()) if (!live.has(key)) cache.current.delete(key);
    return out;
  }, [scenarios, siteOf, horizons]);
  const current = analyses.get(active.id);
  const horizon = horizons[horizonKey(site, mast)];

  // Twelve months of daily conditions for the active site.
  useEffect(() => {
    if (landing < yearStart || landing > yearStart + 330 * DAY) setYearStart(monthStart(landing));
  }, [landing, yearStart]);
  const daily = useMemo(() => {
    if (!horizon) return null;
    const yearGrid: TimeGrid = { t0: yearStart, stepMs: 2 * HOUR, n: 366 * 12 };
    return dailyShares(siteSeries(site.lat, site.lon, horizon, frameSeries(yearGrid)));
  }, [site, horizon, yearStart]);

  // The sky right now.
  const vectors = useMemo(() => moonFixedVectors(new Date(now)), [now]);
  const sky = useMemo(() => (horizon ? skyAt(site.lat, site.lon, horizon, vectors.sun, vectors.earth) : null), [site, horizon, vectors]);

  // Playback.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(100, t - last);
      last = t;
      setElapsed((e) => {
        const next = e + (dt / 1000) * speed * DAY;
        return next > durationMs ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, durationMs]);
  useEffect(() => {
    setElapsed((e) => Math.min(e, durationMs));
  }, [durationMs]);

  // ---- editing the active scenario
  const editActive = useCallback((patch: Partial<Omit<Scenario, 'id'>>) => setScenarios((list) => updateScenario(list, active.id, patch)), [active.id]);
  const changeLanding = useCallback(
    (t: number) => {
      if (!Number.isFinite(t)) return;
      editActive({ landing: t });
      setElapsed(0);
    },
    [editActive],
  );
  const showOnMap = useCallback((s: Site) => setMapView(s.lat <= -80 ? 'polar' : 'globe'), []);
  const selectSite = useCallback(
    (id: string) => {
      editActive({ siteId: id });
      showOnMap(siteOf(id));
    },
    [editActive, showOnMap, siteOf],
  );

  // ---- scenarios
  const canAdd = scenarios.length < MAX_SCENARIOS;
  const append = useCallback(
    (fields: Omit<Scenario, 'id'>) => {
      const { list, added } = addScenario(scenarios, fields);
      if (!added) return;
      setScenarios(list);
      setActiveId(added.id);
      showOnMap(siteOf(added.siteId));
    },
    [scenarios, showOnMap, siteOf],
  );
  const compareSite = useCallback((siteId: string) => append({ siteId, landing, durationDays, mast }), [append, landing, durationDays, mast]);
  const duplicate = useCallback(
    (id: string) => {
      const { list, added } = duplicateScenario(scenarios, id);
      if (!added) return;
      setScenarios(list);
      setActiveId(added.id);
    },
    [scenarios],
  );
  const remove = useCallback(
    (id: string) => {
      const next = removeScenario(scenarios, id, active.id);
      setScenarios(next.list);
      setActiveId(next.activeId);
    },
    [scenarios, active.id],
  );
  const activate = useCallback(
    (id: string) => {
      setActiveId(id);
      const sc = scenarios.find((s) => s.id === id);
      if (sc) showOnMap(siteOf(sc.siteId));
    },
    [scenarios, showOnMap, siteOf],
  );
  const pickDay = useCallback(
    (t: number, asNew: boolean) => (asNew ? append({ siteId: active.siteId, landing: t, durationDays, mast }) : changeLanding(t)),
    [append, changeLanding, active.siteId, durationDays, mast],
  );

  // ---- custom points
  const addSite = useCallback(
    (lat: number, lon: number) => {
      const s = customSite(lat, lon, ++customCount.current);
      setCustom((c) => [...c, s]);
      editActive({ siteId: s.id });
      showOnMap(s);
    },
    [editActive, showOnMap],
  );
  // A map click moves the active scratch point instead of piling up new ones.
  const pick = useCallback(
    (lat: number, lon: number) => {
      const usedElsewhere = scenarios.some((sc) => sc.siteId === site.id && sc.id !== active.id);
      if (site.group === 'custom' && !usedElsewhere) {
        const moved = { ...customSite(lat, lon, 0), id: site.id, name: site.name };
        setCustom((c) => c.map((s) => (s.id === site.id ? moved : s)));
      } else {
        const s = customSite(lat, lon, ++customCount.current);
        setCustom((c) => [...c, s]);
        editActive({ siteId: s.id });
      }
    },
    [scenarios, site, active.id, editActive],
  );
  const removeSite = useCallback((id: string) => {
    setCustom((c) => c.filter((s) => s.id !== id));
    // Scenarios on that point go with it; one scenario always survives, moved to the default site.
    setScenarios((list) => {
      const kept = list.filter((sc) => sc.siteId !== id);
      return kept.length ? kept : [{ ...list[0], siteId: FALLBACK_SITE.id }];
    });
  }, []);

  const rows: ScenarioRow[] = useMemo(
    () => scenarios.map((sc) => ({ scenario: sc, site: siteOf(sc.siteId), metrics: analyses.get(sc.id)?.metrics ?? null })),
    [scenarios, siteOf, analyses],
  );
  const inUse = useMemo(() => scenarios.map((s) => s.siteId), [scenarios]);
  const span = maxSpanMs(scenarios);
  const polarAvailable = heightmap && heightmap !== 'loading';

  return (
    <LangContext.Provider value={lang}>
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <span className="wordmark">LUMINA</span>
            <span className="tagline">{tr('Luz y enlace para alunizar en el polo sur', 'Light and link for landing at the lunar south pole')}</span>
          </div>
          <div className="controls" role="group" aria-label={tr('Escenario activo', 'Active scenario')}>
            <label>
              {tr('Alunizaje (UTC)', 'Landing (UTC)')}
              <input type="datetime-local" value={toInput(landing)} onChange={(e) => changeLanding(fromInput(e.target.value))} />
            </label>
            <fieldset>
              <legend>{tr('Duración', 'Duration')}</legend>
              <div className="segmented">
                {DURATIONS.map((d) => (
                  <button key={d} type="button" aria-pressed={d === durationDays} onClick={() => editActive({ durationDays: d })}>
                    {d} d
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset title={tr('Altura de paneles y antena sobre el suelo: unos metros cambian el horizonte en el polo.', 'Height of panels and antenna above ground: a few metres change the horizon at the pole.')}>
              <legend>{tr('Altura del mástil', 'Mast height')}</legend>
              <div className="segmented">
                {MASTS.map((m) => (
                  <button key={m} type="button" aria-pressed={m === mast} onClick={() => editActive({ mast: m })}>
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
              {tr('El cielo desde', 'The sky from')} {site.name}
            </h1>
            <p className="num">{fmtDate(now, lang)}</p>
          </div>
          {horizon && sky ? (
            <Panorama horizon={horizon} sky={sky} series={current?.series ?? null} />
          ) : (
            <div className="panorama loading">{tr('Calculando el horizonte del terreno…', 'Computing the terrain horizon…')}</div>
          )}
        </section>

        <div className="workspace">
          <aside className="col-sites">
            <SiteList sites={sites} activeSiteId={site.id} inUse={inUse} canAdd={canAdd} onSelect={selectSite} onCompare={compareSite} onAdd={addSite} onRemove={removeSite} />
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
            </div>
            <div className="map-body">
              {mapView === 'globe' ? (
                <Globe sunDir={vectors.sun} earthDir={vectors.earth} sites={sites} selectedId={site.id} pinned={inUse} onSelect={selectSite} onPick={pick} />
              ) : polarAvailable ? (
                <PolarMap hm={heightmap} sunDir={vectors.sun} earthDir={vectors.earth} mode={mapMode} sites={sites} selectedId={site.id} pinned={inUse} onSelect={selectSite} onPick={pick} />
              ) : (
                <div className="map-empty">
                  {heightmap === 'loading'
                    ? tr('Cargando la topografía LOLA…', 'Loading LOLA topography…')
                    : tr('No se pudo cargar la topografía. Inicia el servidor con «npm run dev» y ejecuta «npm run fetch-data».', 'Topography could not be loaded. Start the server with “npm run dev” and run “npm run fetch-data”.')}
                </div>
              )}
            </div>
          </section>

          <aside className="col-status">
            {horizon && sky && current ? (
              <Status site={site} horizon={horizon} sky={sky} metrics={current.metrics} now={now} windowEnd={windowEnd} />
            ) : (
              <p className="empty">{tr('Calculando…', 'Computing…')}</p>
            )}
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
              <button type="button" onClick={() => setElapsed(0)}>
                {tr('Volver al alunizaje', 'Back to landing')}
              </button>
            </div>
          </div>
          {current && horizon ? (
            <Timeline series={current.series} horizon={horizon} metrics={current.metrics} now={now} onScrub={(t) => setElapsed(t - landing)} />
          ) : (
            <p className="empty">{tr('Calculando…', 'Computing…')}</p>
          )}
        </section>

        <section className="lower">
          <div className="lower-block">
            <h2>{tr('Comparar escenarios', 'Compare scenarios')}</h2>
            <p className="lede">
              {tr(
                'Un escenario es un sitio con su fecha, duración y mástil. Compara sitios distintos o el mismo sitio en otra fecha: unos kilómetros o unos días lo cambian todo.',
                'A scenario is a site with its date, duration and mast. Compare different sites or the same site on another date: a few kilometres or a few days change everything.',
              )}
            </p>
            <Compare rows={rows} activeId={active.id} spanMs={span} elapsed={Math.min(elapsed, durationMs)} canAdd={canAdd} onActivate={activate} onDuplicate={duplicate} onRemove={remove} />
          </div>
          <div className="lower-block">
            <h2>
              {tr('Mejores fechas en', 'Best dates at')} {site.name}
            </h2>
            <p className="lede">
              {tr(
                'Doce meses, día a día. Cuanto más intenso el color, más horas de luz o de enlace. Útil cuando un retraso obliga a replanificar.',
                'Twelve months, day by day. The stronger the colour, the more hours of light or link. Useful when a delay forces a replan.',
              )}
            </p>
            {daily ? <YearCalendar daily={daily} landing={landing} durationDays={durationDays} onPickDay={pickDay} /> : <p className="empty">{tr('Calculando…', 'Computing…')}</p>}
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

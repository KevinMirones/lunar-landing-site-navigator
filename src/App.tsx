import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { moonFixedVectors } from './lib/ephemeris';
import {
  DURATIONS,
  MASTS,
  MAX_SCENARIOS,
  addScenario,
  analysisKey,
  analyzeScenario,
  duplicateScenario,
  gridFor,
  maxSpanMs,
  removeScenario,
  updateScenario,
  type Scenario,
  type ScenarioAnalysis,
} from './lib/scenario';
import { DEFAULT_COMMS, analyzeComms, encodeComms, type CommsConfig, type CommsResult } from './lib/comms';
import { DEFAULT_POWER, analyzePower, encodePower, type PowerConfig, type PowerResult } from './lib/power';
import { fetchSearch, rankCells, type Criterion, type SearchCell, type SearchResult } from './lib/search';
import { bestDates, dailyShares, frameSeries, siteSeries, skyAt, windowScores, type Horizon, type TimeGrid } from './lib/series';
import { CATALOG, customSite, type Lang, type Site } from './lib/sites';
import { TOUR } from './lib/tour';
import { decode, encode, fromShared, toShared, type SharedState } from './lib/urlState';
import { LangContext, fetchHeightmap, fetchHorizon, fetchPsr, type Psr, fmtDate, fromInput, toInput, useMedia, useStoredState, type Heightmap } from './lib/util';
import { Chevron, Collapse, FocusIcon, SectionToggle } from './components/Collapse';
import { Comms } from './components/Comms';
import { ExportButtons } from './components/Export';
import { Globe } from './components/Globe';
import { BestDates, Compare, SiteList, Status, YearCalendar, type ScenarioRow } from './components/Panels';
import { Panorama } from './components/Panorama';
import { PolarMap } from './components/PolarMap';
import { Power } from './components/Power';
import { SearchControls, SearchResults, whereFrom, type SearchStatus } from './components/Search';
import { Term } from './components/Term';
import { Timeline } from './components/Timeline';
import { Tour } from './components/Tour';
import { Wordmark } from './components/Wordmark';

// S11: the 3D view loads only when someone opens it.
const Terrain3D = lazy(() => import('./components/Terrain3D'));

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const SPEEDS = [0.5, 2, 6]; // mission days per second
const FALLBACK_SITE = CATALOG[0];
const CALENDAR_DAYS = 366;
// Which panels are open. Purely visual: closing one never stops its computations.
const PANELS = { sites: true, status: true, hero: true, when: true, compare: true, calendar: true, power: true, comms: true };
type Panel = keyof typeof PANELS;

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

/** Initial state: whatever the link in the address bar carries, defaults for the rest. */
function readLink() {
  const { state, problems } = decode(window.location.search, (id) => CATALOG.some((c) => c.id === id));
  const restored = state.scenarios ? fromShared(state.scenarios) : { scenarios: defaultScenarios(), custom: [] as Site[] };
  const active = restored.scenarios[state.active ?? 0];
  const activeSite = [...CATALOG, ...restored.custom].find((c) => c.id === active.siteId) ?? FALLBACK_SITE;
  return {
    ...restored,
    activeId: active.id,
    elapsed: Math.min((state.hours ?? 0) * HOUR, active.durationDays * DAY),
    lang: state.lang ?? ('es' as Lang),
    view: state.view ?? (activeSite.lat <= -80 ? ('polar' as const) : ('globe' as const)),
    mode: state.mode ?? ('sun' as const),
    power: state.power ?? DEFAULT_POWER,
    comms: state.comms ?? DEFAULT_COMMS,
    simple: state.simple ?? false,
    damaged: problems.length > 0,
  };
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // No clipboard API over plain http (for example when shared on the local network).
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export default function App() {
  const [boot] = useState(readLink);
  const [lang, setLang] = useState<Lang>(boot.lang);
  const tr = (es: string, en: string) => (lang === 'es' ? es : en);

  const [custom, setCustom] = useState<Site[]>(boot.custom);
  const customCount = useRef(boot.custom.length);
  const sites = useMemo(() => [...CATALOG, ...custom], [custom]);
  const siteOf = useCallback((id: string) => sites.find((s) => s.id === id) ?? FALLBACK_SITE, [sites]);

  const [scenarios, setScenarios] = useState<Scenario[]>(boot.scenarios);
  const [activeId, setActiveId] = useState(boot.activeId);
  /** Time since the active scenario's landing; kept when switching scenario so rows compare the same mission day. */
  const [elapsed, setElapsed] = useState(boot.elapsed);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);

  const [mapView, setMapView] = useState<'polar' | 'globe'>(boot.view);
  const [mapMode, setMapMode] = useState<'sun' | 'earth'>(boot.mode);
  /** One lander for the whole comparison (S08): what changes between rows is the site and the date. */
  const [power, setPower] = useState<PowerConfig>(boot.power);
  /** Elevation margin and ground network (S09); the margin changes every link figure. */
  const [comms, setComms] = useState<CommsConfig>(boot.comms);
  const margin = comms.marginDeg;
  const [linkDamaged, setLinkDamaged] = useState(boot.damaged);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const [storedPanels, setStoredPanels] = useStoredState('lumina.panels', PANELS);
  /** Simple view for non-specialists (S12): hides everything marked data-level="expert". */
  const [simple, setSimple] = useState(boot.simple);
  // Guided tour (S12). While it runs it has its own panels, so nothing it opens is
  // remembered, and it keeps what was on screen to put it back on exit.
  const [tour, setTour] = useState<{
    step: number;
    panels: typeof PANELS;
    saved: { scenarios: Scenario[]; custom: Site[]; activeId: string; elapsed: number; view: 'polar' | 'globe'; mode: 'sun' | 'earth'; playing: boolean };
  } | null>(null);
  const panels = tour ? tour.panels : storedPanels;
  const setPanels = (update: (p: typeof PANELS) => typeof PANELS) => (tour ? setTour((t) => t && { ...t, panels: update(t.panels) }) : setStoredPanels(update));
  const togglePanel = (p: Panel) => setPanels((s) => ({ ...s, [p]: !s[p] }));
  const sidesOpen = panels.sites || panels.status;
  // Where a side panel stacks above or below the map, it folds up instead of sideways.
  const sitesStacked = useMedia('(max-width: 760px)');
  const statusStacked = useMedia('(max-width: 1240px)');
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

  // Nearest permanent shadow of every site in use (S16), asked once per site.
  const [psrs, setPsrs] = useState<Record<string, Psr | null>>({});
  const psrInflight = useRef(new Set<string>());
  useEffect(() => {
    for (const sc of scenarios) {
      const s = siteOf(sc.siteId);
      const key = `${s.lat}|${s.lon}`;
      if (key in psrs || psrInflight.current.has(key)) continue;
      psrInflight.current.add(key);
      fetchPsr(s.lat, s.lon).then((p) => {
        psrInflight.current.delete(key);
        setPsrs((prev) => ({ ...prev, [key]: p }));
      });
    }
  }, [scenarios, siteOf, psrs]);
  const psrOf = useCallback((s: Site) => psrs[`${s.lat}|${s.lon}`] ?? null, [psrs]);

  // One analysis per scenario, recomputed only when that scenario or its horizon changes.
  const cache = useRef(new Map<string, { horizon: Horizon; analysis: ScenarioAnalysis }>());
  const analyses = useMemo(() => {
    const out = new Map<string, ScenarioAnalysis & { horizon: LoadedHorizon }>();
    const live = new Set<string>();
    for (const sc of scenarios) {
      const s = siteOf(sc.siteId);
      const horizon = horizons[horizonKey(s, sc.mast)];
      if (!horizon) continue;
      const key = analysisKey(sc, s, margin);
      live.add(key);
      let hit = cache.current.get(key);
      if (!hit || hit.horizon !== horizon) {
        hit = { horizon, analysis: analyzeScenario(sc, s, horizon, { earthMarginDeg: margin }) };
        cache.current.set(key, hit);
      }
      out.set(sc.id, { ...hit.analysis, horizon });
    }
    for (const key of cache.current.keys()) if (!live.has(key)) cache.current.delete(key);
    return out;
  }, [scenarios, siteOf, horizons, margin]);
  const current = analyses.get(active.id);
  // Energy and battery of every scenario with the same lander (S08). The ephemeris grid is cached.
  const powers = useMemo(() => {
    const out = new Map<string, PowerResult>();
    for (const sc of scenarios) {
      const a = analyses.get(sc.id);
      if (a) out.set(sc.id, analyzePower(a.series, frameSeries(gridFor(sc)), power));
    }
    return out;
  }, [scenarios, analyses, power]);
  const currentPower = powers.get(active.id) ?? null;
  // Contact with the ground network (S09): null for every scenario when there is none.
  const contacts = useMemo(() => {
    const out = new Map<string, CommsResult>();
    for (const sc of scenarios) {
      const a = analyses.get(sc.id);
      const c = a ? analyzeComms(a.series, a.metrics, comms) : null;
      if (c) out.set(sc.id, c);
    }
    return out;
  }, [scenarios, analyses, comms]);
  const currentContact = contacts.get(active.id) ?? null;
  const horizon = horizons[horizonKey(site, mast)];

  // Twelve months of daily conditions for the active site.
  useEffect(() => {
    if (landing < yearStart || landing > yearStart + 330 * DAY) setYearStart(monthStart(landing));
  }, [landing, yearStart]);
  // The series runs 90 days past the calendar so a mission landing on its last day still has data.
  const yearSeries = useMemo(() => {
    if (!horizon) return null;
    const yearGrid: TimeGrid = { t0: yearStart, stepMs: 2 * HOUR, n: (CALENDAR_DAYS + 90) * 12 + 1 };
    return siteSeries(site.lat, site.lon, horizon, frameSeries(yearGrid), margin);
  }, [site, horizon, yearStart, margin]);
  const daily = useMemo(() => (yearSeries ? dailyShares(yearSeries, CALENDAR_DAYS) : null), [yearSeries]);
  // Best landing dates (S05): what a mission of this duration would get on each day of the calendar.
  const [requireSun, setRequireSun] = useState(true);
  const scores = useMemo(() => (yearSeries ? windowScores(yearSeries, durationDays, CALENDAR_DAYS) : null), [yearSeries, durationDays]);
  const best = useMemo(() => (scores ? bestDates(scores, { requireSun }) : []), [scores, requireSun]);

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
  const addOnDate = useCallback((t: number) => append({ siteId: active.siteId, landing: t, durationDays, mast }), [append, active.siteId, durationDays, mast]);
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

  // ---- shareable link
  const link = useCallback(
    () =>
      `${window.location.origin}${window.location.pathname}?${encode({
        scenarios: toShared(scenarios, siteOf),
        active: Math.max(0, scenarios.findIndex((s) => s.id === active.id)),
        hours: Math.min(elapsed, durationMs) / HOUR,
        lang,
        view: mapView,
        mode: mapMode,
        power: encodePower(power) === encodePower(DEFAULT_POWER) ? undefined : power,
        comms: encodeComms(comms) === encodeComms(DEFAULT_COMMS) ? undefined : comms,
        simple: simple || undefined,
      })}`,
    [scenarios, siteOf, active.id, elapsed, durationMs, lang, mapView, mapMode, power, comms, simple],
  );
  useEffect(() => {
    if (playing || tour) return; // the address waits until playback stops, and ignores the tour
    const id = window.setTimeout(() => window.history.replaceState(null, '', link()), 300);
    return () => window.clearTimeout(id);
  }, [link, playing, tour]);
  const copyLink = async () => {
    const url = link();
    window.history.replaceState(null, '', url);
    setCopyState((await copyText(url)) ? 'copied' : 'manual');
  };
  useEffect(() => {
    if (copyState !== 'copied') return;
    const id = window.setTimeout(() => setCopyState('idle'), 2500);
    return () => window.clearTimeout(id);
  }, [copyState]);

  // ---- search around the active point (S04)
  const [search, setSearch] = useState<{ open: boolean; radius: number; criterion: Criterion }>({ open: false, radius: 5, criterion: 'score' });
  const [found, setFound] = useState<{ key: string; result: SearchResult; refined: boolean } | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);
  const [searchTry, setSearchTry] = useState(0);
  const searchable = site.lat <= -80;
  const searchKey = `${site.lat}|${site.lon}|${mast}|${landing}|${durationDays}|${search.radius}|${margin}`;
  useEffect(() => {
    if (!search.open || !searchable) return;
    const ctl = new AbortController();
    setSearchFailed(false);
    const q = { lat: site.lat, lon: site.lon, radius: search.radius, mast, t0: landing, days: durationDays, margin };
    // A coarse grid answers in under a second; the fine one replaces it a few seconds later.
    const timer = window.setTimeout(async () => {
      try {
        setFound({ key: searchKey, result: await fetchSearch({ ...q, grid: 11 }, ctl.signal), refined: false });
        setFound({ key: searchKey, result: await fetchSearch({ ...q, grid: 41 }, ctl.signal), refined: true });
      } catch {
        if (!ctl.signal.aborted) setSearchFailed(true);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      ctl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.open, searchable, searchKey, searchTry]);
  const searchResult = search.open && searchable && found?.key === searchKey ? found.result : null;
  const searchStatus: SearchStatus = searchFailed ? 'error' : !searchResult ? 'coarse' : found?.refined ? 'done' : 'refining';
  const picks = useMemo(() => (searchResult ? rankCells(searchResult.cells, search.criterion, searchResult.grid) : []), [searchResult, search.criterion]);
  const heat = useMemo(() => (searchResult ? { result: searchResult, criterion: search.criterion, picks } : null), [searchResult, search.criterion, picks]);
  /** A custom point at a searched cell, named after the point the search started from. */
  const siteAtCell = useCallback(
    (cell: SearchCell) => {
      const base = site.name.replace(/ \+[\d.]+ k?m .*$/, '');
      const s = customSite(cell.lat, cell.lon, ++customCount.current, `${base} +${whereFrom(site, cell, 'en')}`);
      setCustom((c) => [...c, s]);
      return s;
    },
    [site],
  );
  const useCell = useCallback((cell: SearchCell) => editActive({ siteId: siteAtCell(cell).id }), [editActive, siteAtCell]);
  const addCell = useCallback(
    (cell: SearchCell) => {
      const { list, added } = addScenario(scenarios, { siteId: siteAtCell(cell).id, landing, durationDays, mast });
      if (!added) return;
      setScenarios(list);
      setActiveId(added.id);
    },
    [scenarios, siteAtCell, landing, durationDays, mast],
  );

  // ---- guided tour (S12): a step is a shareable state, applied like an opened link
  const applyShared = useCallback((st: Omit<SharedState, 'lang'>) => {
    const restored = fromShared(st.scenarios);
    setCustom(restored.custom);
    setScenarios(restored.scenarios);
    setActiveId(restored.scenarios[st.active]?.id ?? restored.scenarios[0].id);
    setElapsed(st.hours * HOUR);
    setMapView(st.view);
    setMapMode(st.mode);
  }, []);
  const openFor = (step: number) => Object.fromEntries(TOUR[step].open.map((p) => [p, true]));
  const goTour = useCallback(
    (step: number) => {
      if (step < 0 || step >= TOUR.length) return;
      applyShared(TOUR[step].state);
      setPlaying(!!TOUR[step].play);
      setTour((t) => t && { ...t, step, panels: { ...t.panels, ...openFor(step) } });
    },
    [applyShared],
  );
  const startTour = () => {
    setTour({ step: 0, panels: { ...storedPanels, ...openFor(0) }, saved: { scenarios, custom, activeId: active.id, elapsed, view: mapView, mode: mapMode, playing } });
    applyShared(TOUR[0].state);
    setPlaying(!!TOUR[0].play);
  };
  const exitTour = useCallback(() => {
    if (!tour) return;
    const s = tour.saved;
    setCustom(s.custom);
    setScenarios(s.scenarios);
    setActiveId(s.activeId);
    setElapsed(s.elapsed);
    setMapView(s.view);
    setMapMode(s.mode);
    setPlaying(s.playing);
    setTour(null);
  }, [tour]);

  const rows: ScenarioRow[] = useMemo(
    () => scenarios.map((sc) => ({ scenario: sc, site: siteOf(sc.siteId), metrics: analyses.get(sc.id)?.metrics ?? null, power: powers.get(sc.id) ?? null, contact: contacts.get(sc.id) ?? null, psr: psrOf(siteOf(sc.siteId)) })),
    [scenarios, siteOf, analyses, powers, contacts, psrOf],
  );
  const inUse = useMemo(() => scenarios.map((s) => s.siteId), [scenarios]);
  // Terrain used by each scenario, for the printed report (S10).
  const reportHorizons = useMemo(() => new Map(scenarios.map((sc) => [sc.id, analyses.get(sc.id)?.horizon])), [scenarios, analyses]);
  const span = maxSpanMs(scenarios);
  const polarAvailable = heightmap && heightmap !== 'loading';
  const [terrainOpen, setTerrainOpen] = useState(false);
  const terrainBlocked =
    site.lat > -80
      ? tr('La vista 3D necesita terreno real: solo funciona entre 80°S y 90°S.', 'The 3D view needs real terrain: it only works between 80°S and 90°S.')
      : horizon?.model !== 'lola'
        ? tr('La vista 3D necesita la topografía LOLA en el servidor («npm run fetch-data»).', 'The 3D view needs the LOLA topography on the server (“npm run fetch-data”).')
        : null;

  return (
    <LangContext.Provider value={lang}>
      <div className="app" data-view={simple ? 'simple' : 'expert'}>
        <header className="topbar">
          <div className="brand">
            <Wordmark />
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
            <fieldset data-level="expert" title={tr('Altura de paneles y antena sobre el suelo: unos metros cambian el horizonte en el polo.', 'Height of panels and antenna above ground: a few metres change the horizon at the pole.')}>
              <legend>
                {tr('Altura del', 'Height of the')} <Term id="mast" />
              </legend>
              <div className="segmented">
                {MASTS.map((m) => (
                  <button key={m} type="button" aria-pressed={m === mast} onClick={() => editActive({ mast: m })}>
                    {m} m
                  </button>
                ))}
              </div>
            </fieldset>
            <button type="button" className="copy-link" onClick={copyLink}>
              <span aria-live="polite">{copyState === 'copied' ? tr('Enlace copiado', 'Link copied') : tr('Copiar enlace', 'Copy link')}</span>
            </button>
            <button type="button" className="tour-start" onClick={tour ? exitTour : startTour} aria-pressed={!!tour}>
              {tour ? tr('Salir del recorrido', 'Leave the tour') : tr('Recorrido', 'Tour')}
            </button>
            <div className="segmented" role="group" aria-label={tr('Vista', 'View')}>
              <button type="button" aria-pressed={simple} onClick={() => setSimple(true)}>
                {tr('Sencilla', 'Simple')}
              </button>
              <button type="button" aria-pressed={!simple} onClick={() => setSimple(false)}>
                {tr('Experta', 'Expert')}
              </button>
            </div>
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

        {linkDamaged && (
          <div className="notice" role="status">
            <p>
              {tr(
                'El enlace no se pudo leer completo. Lo que faltaba se sustituyó por los valores por defecto.',
                'The link could not be read completely. What was missing was replaced with default values.',
              )}
            </p>
            <button type="button" onClick={() => setLinkDamaged(false)}>
              {tr('Entendido', 'Got it')}
            </button>
          </div>
        )}
        {copyState === 'manual' && (
          <div className="notice" role="status">
            <label>
              {tr('Este navegador no permite copiar automáticamente. Copia el enlace a mano:', 'This browser does not allow automatic copying. Copy the link by hand:')}
              <input readOnly value={link()} onFocus={(e) => e.currentTarget.select()} />
            </label>
            <button type="button" onClick={() => setCopyState('idle')}>
              {tr('Cerrar', 'Close')}
            </button>
          </div>
        )}

        <section className="hero" aria-label={tr('Vista desde el sitio', 'View from the site')}>
          <div className="hero-head">
            <h1>
              {tr('El cielo desde', 'The sky from')} {site.name}
            </h1>
            <p className="num">{fmtDate(now, lang)}</p>
            <SectionToggle open={panels.hero} controls="hero-body" label={tr('el panorama', 'the panorama')} onToggle={() => togglePanel('hero')} />
          </div>
          <Collapse id="hero-body" open={panels.hero}>
            {horizon && sky ? (
              <Panorama horizon={horizon} sky={sky} series={current?.series ?? null} expand={{ onExpand: () => setTerrainOpen(true), disabledReason: terrainBlocked }} />
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
                <SiteList sites={sites} activeSiteId={site.id} inUse={inUse} canAdd={canAdd} onSelect={selectSite} onCompare={compareSite} onAdd={addSite} onRemove={removeSite} />
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
                  <button
                    type="button"
                    className="search-toggle"
                    data-level="expert"
                    aria-pressed={search.open}
                    disabled={!searchable}
                    title={searchable ? undefined : tr('El buscador necesita terreno real: solo funciona entre 80°S y 90°S.', 'The search needs real terrain: it only works between 80°S and 90°S.')}
                    onClick={() => setSearch((s) => ({ ...s, open: !s.open }))}
                  >
                    {tr('Buscar el mejor punto cerca', 'Find the best point nearby')}
                  </button>
                )}
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
            {mapView === 'polar' && search.open && searchable && (
              <SearchControls
                radius={search.radius}
                criterion={search.criterion}
                status={searchStatus}
                result={searchResult}
                onRadius={(radius) => setSearch((s) => ({ ...s, radius }))}
                onCriterion={(criterion) => setSearch((s) => ({ ...s, criterion }))}
                onRetry={() => setSearchTry((n) => n + 1)}
              />
            )}
            <div className="map-body">
              {mapView === 'globe' ? (
                <Globe sunDir={vectors.sun} earthDir={vectors.earth} sites={sites} selectedId={site.id} pinned={inUse} onSelect={selectSite} onPick={pick} />
              ) : polarAvailable ? (
                <PolarMap hm={heightmap} sunDir={vectors.sun} earthDir={vectors.earth} mode={mapMode} sites={sites} selectedId={site.id} pinned={inUse} onSelect={selectSite} onPick={pick} heat={heat} />
              ) : (
                <div className="map-empty">
                  {heightmap === 'loading'
                    ? tr('Cargando la topografía LOLA…', 'Loading LOLA topography…')
                    : tr('No se pudo cargar la topografía. Inicia el servidor con «npm run dev» y ejecuta «npm run fetch-data».', 'Topography could not be loaded. Start the server with “npm run dev” and run “npm run fetch-data”.')}
                </div>
              )}
            </div>
            {mapView === 'polar' && search.open && searchable && <SearchResults result={searchResult} picks={picks} canAdd={canAdd} onUse={useCell} onAdd={addCell} />}
          </section>

          <aside className="col-status drawer">
            <div className="drawer-body" id="drawer-status">
              <div className="drawer-head">
                <h2>{tr('Estado del sitio', 'Site status')}</h2>
                <SectionToggle open={panels.status} controls="drawer-status" label={tr('el estado del sitio', 'the site status')} dir={statusStacked ? 'up' : 'right'} onToggle={() => togglePanel('status')} />
              </div>
              <Collapse id="status-fold" open={panels.status || !statusStacked}>
                {horizon && sky && current ? (
                  <Status site={site} horizon={horizon} sky={sky} metrics={current.metrics} now={now} windowEnd={windowEnd} marginDeg={margin} contact={currentContact} psr={psrOf(site)} />
                ) : (
                  <p className="empty">{tr('Calculando…', 'Computing…')}</p>
                )}
                <section className="status-extra" data-level="expert" aria-labelledby="power-title">
                  <div className="block-head">
                    <h3 id="power-title">{tr('Energía', 'Power')}</h3>
                    <SectionToggle open={panels.power} controls="power-body" label={tr('la energía', 'the power block')} onToggle={() => togglePanel('power')} />
                  </div>
                  <Collapse id="power-body" open={panels.power}>
                    <Power config={power} onChange={setPower} result={currentPower} landing={landing} now={now} />
                  </Collapse>
                </section>
                <section className="status-extra" data-level="expert" aria-labelledby="comms-title">
                  <div className="block-head">
                    <h3 id="comms-title" className="earth">{tr('Comunicaciones', 'Communications')}</h3>
                    <SectionToggle open={panels.comms} controls="comms-body" label={tr('las comunicaciones', 'the communications block')} onToggle={() => togglePanel('comms')} />
                  </div>
                  <Collapse id="comms-body" open={panels.comms}>
                    <Comms config={comms} onChange={setComms} result={currentContact} earthShare={current?.metrics.earthShare ?? null} />
                  </Collapse>
                </section>
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
              <button type="button" onClick={() => setElapsed(0)}>
                {tr('Volver al alunizaje', 'Back to landing')}
              </button>
            </div>
            <SectionToggle open={panels.when} controls="when-body" label={tr('la línea de tiempo', 'the timeline')} onToggle={() => togglePanel('when')} />
          </div>
          <Collapse id="when-body" open={panels.when}>
            {current && horizon ? (
              <Timeline series={current.series} horizon={horizon} metrics={current.metrics} power={currentPower} contact={currentContact} now={now} onScrub={(t) => setElapsed(t - landing)} />
            ) : (
              <p className="empty">{tr('Calculando…', 'Computing…')}</p>
            )}
          </Collapse>
        </section>

        <section className="lower">
          <div className="lower-block">
            <div className="block-head">
              <h2>{tr('Comparar escenarios', 'Compare scenarios')}</h2>
              <ExportButtons rows={rows} horizons={reportHorizons} spanMs={span} link={link()} comms={comms} />
              <SectionToggle open={panels.compare} controls="compare-body" label={tr('la comparación', 'the comparison')} onToggle={() => togglePanel('compare')} />
            </div>
            <Collapse id="compare-body" open={panels.compare}>
              <p className="lede">
                {tr(
                  'Un escenario es un sitio con su fecha, duración y mástil. Compara sitios distintos o el mismo sitio en otra fecha: unos kilómetros o unos días lo cambian todo.',
                  'A scenario is a site with its date, duration and mast. Compare different sites or the same site on another date: a few kilometres or a few days change everything.',
                )}
              </p>
              <Compare rows={rows} activeId={active.id} spanMs={span} elapsed={Math.min(elapsed, durationMs)} canAdd={canAdd} onActivate={activate} onDuplicate={duplicate} onRemove={remove} />
            </Collapse>
          </div>
          <div className="lower-block">
            <div className="block-head">
              <h2>
                {tr('Mejores fechas en', 'Best dates at')} {site.name}
              </h2>
              <SectionToggle open={panels.calendar} controls="calendar-body" label={tr('el calendario', 'the calendar')} onToggle={() => togglePanel('calendar')} />
            </div>
            <Collapse id="calendar-body" open={panels.calendar}>
              <p className="lede">
                {tr(
                  `Doce meses, día a día. Cuanto más intenso el color, más horas de luz o de enlace. La tercera fila es el índice que tendría una misión de ${durationDays} días si aterrizara ese día; los triángulos marcan las mejores fechas.`,
                  `Twelve months, day by day. The stronger the colour, the more hours of light or link. The third row is the index a ${durationDays}-day mission would get if it landed that day; triangles mark the best dates.`,
                )}
              </p>
              {daily && scores ? (
                <>
                  <YearCalendar daily={daily} scores={scores} best={best} landing={landing} durationDays={durationDays} onPickDay={pickDay} />
                  <BestDates scores={scores} best={best} requireSun={requireSun} canAdd={canAdd} onRequireSun={setRequireSun} onApply={changeLanding} onAdd={addOnDate} />
                </>
              ) : (
                <p className="empty">{tr('Calculando…', 'Computing…')}</p>
              )}
            </Collapse>
          </div>
        </section>

        <footer className="foot">
          <p>
            {tr('Datos: topografía LOLA de Lunar Reconnaissance Orbiter (NASA GSFC, PDS), mosaico LROC (NASA SVS),', 'Data: LOLA topography from Lunar Reconnaissance Orbiter (NASA GSFC, PDS), LROC mosaic (NASA SVS),')} <Term id="ephemeris" />{' '}
            {tr(
              'validadas contra NASA/JPL Horizons. Herramienta de apoyo a la planificación; no sustituye un análisis de misión.',
              'validated against NASA/JPL Horizons. A planning aid; it does not replace a mission analysis.',
            )}
          </p>
        </footer>
        {tour && <Tour step={tour.step} onGo={goTour} onExit={exitTour} />}
        {terrainOpen && (
          <Suspense fallback={<div className="t3d t3d-msg">{tr('Cargando la vista 3D…', 'Loading the 3D view…')}</div>}>
            <Terrain3D
              siteName={site.name}
              lat={site.lat}
              lon={site.lon}
              horizon={horizon}
              sky={sky}
              series={current?.series ?? null}
              now={now}
              landing={landing}
              durationMs={durationMs}
              playing={playing}
              speed={speed}
              speeds={SPEEDS}
              mast={mast}
              masts={MASTS}
              onTogglePlay={() => setPlaying((p) => !p)}
              onSpeed={setSpeed}
              onScrub={setElapsed}
              onMast={(m) => editActive({ mast: m })}
              onClose={() => setTerrainOpen(false)}
            />
          </Suspense>
        )}
      </div>
    </LangContext.Provider>
  );
}

// Search around the active point: controls and the list of best nearby places.
// The heat map itself is drawn by PolarMap.
import { MAX_LANDING_SLOPE_DEG, distanceBearing, type Criterion, type SearchCell, type SearchResult } from '../lib/search';
import { compass, fmtDuration, km, pct, useLang, useTr } from '../lib/util';

export const SEARCH_RADII = [2, 5, 10];

export type SearchStatus = 'coarse' | 'refining' | 'done' | 'error';

interface Props {
  radius: number;
  criterion: Criterion;
  status: SearchStatus;
  result: SearchResult | null;
  picks: SearchCell[];
  canAdd: boolean;
  onRadius: (r: number) => void;
  onCriterion: (c: Criterion) => void;
  onUse: (cell: SearchCell) => void;
  onAdd: (cell: SearchCell) => void;
  onRetry: () => void;
}

/** "1.2 km al N": how far and which way a cell lies from the original point. */
export function whereFrom(origin: { lat: number; lon: number }, cell: { lat: number; lon: number }, lang: 'es' | 'en'): string {
  const { km: d, bearingDeg } = distanceBearing(origin, cell);
  return lang === 'es' ? `${km(d)} al ${compass(bearingDeg, lang)}` : `${km(d)} ${compass(bearingDeg, lang)}`;
}

export function SearchControls({ radius, criterion, status, result, onRadius, onCriterion, onRetry }: Pick<Props, 'radius' | 'criterion' | 'status' | 'result' | 'onRadius' | 'onCriterion' | 'onRetry'>) {
  const tr = useTr();
  const evaluated = result ? result.cells.filter((c) => c.covered).length : 0;
  return (
    <div className="search-bar">
      <fieldset>
        <legend>{tr('Radio', 'Radius')}</legend>
        <div className="segmented" role="group" aria-label={tr('Radio', 'Radius')}>
          {SEARCH_RADII.map((r) => (
            <button key={r} type="button" aria-pressed={r === radius} onClick={() => onRadius(r)}>
              {r} km
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>{tr('Criterio', 'Criterion')}</legend>
        <div className="segmented" role="group" aria-label={tr('Criterio', 'Criterion')}>
          <button type="button" className="sun" aria-pressed={criterion === 'sun'} onClick={() => onCriterion('sun')}>
            {tr('Luz solar', 'Sunlight')}
          </button>
          <button type="button" className="earth" aria-pressed={criterion === 'earth'} onClick={() => onCriterion('earth')}>
            {tr('Enlace', 'Link')}
          </button>
          <button type="button" aria-pressed={criterion === 'score'} onClick={() => onCriterion('score')}>
            {tr('Índice', 'Index')}
          </button>
        </div>
      </fieldset>
      <p className={`search-status num is-${status}`} role="status">
        {status === 'coarse' && tr('Buscando alrededor del punto…', 'Searching around the point…')}
        {status === 'refining' && tr('Primer resultado listo. Afinando la malla…', 'First result ready. Refining the grid…')}
        {status === 'done' && result && tr(`${evaluated} puntos evaluados en ${(result.ms / 1000).toFixed(1)} s.`, `${evaluated} points evaluated in ${(result.ms / 1000).toFixed(1)} s.`)}
        {status === 'error' && (
          <>
            {tr('No se pudo completar la búsqueda. Comprueba que el servidor está en marcha.', 'The search could not be completed. Check that the server is running.')}{' '}
            <button type="button" onClick={onRetry}>
              {tr('Reintentar', 'Try again')}
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export function SearchResults({ result, picks, canAdd, onUse, onAdd }: Pick<Props, 'result' | 'picks' | 'canAdd' | 'onUse' | 'onAdd'>) {
  const tr = useTr();
  const lang = useLang();
  if (!result) return null;
  const mid = (result.grid - 1) / 2;
  const origin = result.cells.find((c) => c.i === mid && c.j === mid);
  const row = (c: SearchCell) => (
    <>
      <td className="num">{pct(c.sunShare)}</td>
      <td className="num">{c.longestDarkH > 0 ? fmtDuration(c.longestDarkH * 3600e3) : tr('ninguna', 'none')}</td>
      <td className="num">{pct(c.earthShare)}</td>
      <td className={`num${c.slopeDeg > MAX_LANDING_SLOPE_DEG ? ' is-steep' : ''}`}>{c.slopeDeg.toFixed(0)}°</td>
      <td className="num score-cell">{c.score}</td>
    </>
  );
  return (
    <div className="compare-scroll">
      <table className="compare search-results">
        <thead>
          <tr>
            <th>{tr('Punto', 'Point')}</th>
            <th>{tr('Luz solar', 'Sunlight')}</th>
            <th>{tr('Noche más larga', 'Longest night')}</th>
            <th>{tr('Enlace', 'Link')}</th>
            <th>{tr('Pendiente', 'Slope')}</th>
            <th>{tr('Índice', 'Index')}</th>
            <th aria-label={tr('Acciones', 'Actions')} />
          </tr>
        </thead>
        <tbody>
          {origin && (
            <tr className="is-origin">
              <th scope="row">{tr('Punto actual', 'Current point')}</th>
              {row(origin)}
              <td />
            </tr>
          )}
          {picks.map((c, k) => (
            <tr key={`${c.i},${c.j}`} className="is-pick">
              <th scope="row">
                <span className="pick-n num">{k + 1}</span>
                {whereFrom(result.center, c, lang)}
              </th>
              {row(c)}
              <td className="row-actions">
                <button type="button" onClick={() => onUse(c)}>
                  {tr('Usar este punto', 'Use this point')}
                </button>
                <button
                  type="button"
                  disabled={!canAdd}
                  title={canAdd ? undefined : tr('Hay seis escenarios, el máximo.', 'There are six scenarios, the maximum.')}
                  onClick={() => onAdd(c)}
                >
                  {tr('Añadir como escenario', 'Add as scenario')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {picks.length === 0 && (
        <p className="empty">
          {tr(
            `Ningún punto de esta zona tiene una pendiente de ${MAX_LANDING_SLOPE_DEG}° o menos. Prueba con un radio mayor.`,
            `No point in this area has a slope of ${MAX_LANDING_SLOPE_DEG}° or less. Try a larger radius.`,
          )}
        </p>
      )}
    </div>
  );
}

// "Comunicaciones" block of the site status (S09): the elevation margin the
// antenna needs and the ground stations that must see the Moon at the same time.
import { MARGINS, stationsOf, type CommsConfig, type CommsResult, type Network } from '../lib/comms';
import { fmtDuration, pct, useTr } from '../lib/util';
import { NumberField } from './NumberField';

interface Props {
  config: CommsConfig;
  onChange: (c: CommsConfig) => void;
  /** Null with no network, or while the active scenario is computing. */
  result: CommsResult | null;
  earthShare: number | null;
}

export function Comms({ config, onChange, result, earthShare }: Props) {
  const tr = useTr();
  const set = (patch: Partial<CommsConfig>) => onChange({ ...config, ...patch });
  const networks: Array<[Network, string]> = [
    ['none', tr('Ninguna', 'None')],
    ['dsn', tr('Red del Espacio Profundo', 'Deep Space Network')],
    ['single', tr('Una estación', 'One station')],
  ];
  const stationName = (name: string) => (name === 'own' ? tr('Estación propia', 'Own station') : name);

  return (
    <div className="comms">
      <div className="comms-row">
        <span className="comms-label">{tr('Margen de elevación', 'Elevation margin')}</span>
        <div className="segmented" role="group" aria-label={tr('Margen de elevación', 'Elevation margin')}>
          {MARGINS.map((m) => (
            <button key={m} type="button" aria-pressed={config.marginDeg === m} onClick={() => set({ marginDeg: m })}>
              {m}°
            </button>
          ))}
        </div>
      </div>
      <p className="comms-note">
        {config.marginDeg === 0
          ? tr('Hay enlace cuando medio disco de la Tierra supera el terreno.', 'There is a link when half of Earth’s disc clears the terrain.')
          : tr(
              `Hay enlace cuando medio disco de la Tierra supera el terreno en ${config.marginDeg}°. Afecta a todas las cifras de enlace, al índice y a los buscadores.`,
              `There is a link when half of Earth’s disc clears the terrain by ${config.marginDeg}°. It affects every link figure, the index and the searches.`,
            )}
      </p>
      <div className="comms-row">
        <span className="comms-label">{tr('Red de tierra', 'Ground network')}</span>
        <div className="segmented" role="group" aria-label={tr('Red de tierra', 'Ground network')}>
          {networks.map(([n, label]) => (
            <button key={n} type="button" aria-pressed={config.network === n} onClick={() => set({ network: n })}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {config.network === 'dsn' && <p className="comms-note">Goldstone, Madrid (Robledo), Canberra (Tidbinbilla).</p>}
      {config.network === 'single' && (
        <div className="field-row">
          <NumberField label={tr('Latitud', 'Latitude')} unit="°" value={config.station.lat} min={-90} max={90} step={0.01} onCommit={(lat) => set({ station: { ...config.station, lat } })} />
          <NumberField label={tr('Longitud este', 'East longitude')} unit="°" value={config.station.lon} min={-180} max={180} step={0.01} onCommit={(lon) => set({ station: { ...config.station, lon } })} />
        </div>
      )}
      {config.network !== 'none' &&
        (result ? (
          <>
            <dl className="comms-figures">
              <dt>{tr('Contacto', 'Contact')}</dt>
              <dd className="num">
                {pct(result.contactShare)}
                {earthShare !== null && earthShare > 0 && <span className="sub"> {tr(`(${pct(result.contactShare / earthShare)} del tiempo con enlace)`, `(${pct(result.contactShare / earthShare)} of the time with a link)`)}</span>}
              </dd>
              <dt>{tr('Contacto al día', 'Contact a day')}</dt>
              <dd className="num">{result.contactHoursPerDay.toFixed(1)} h</dd>
              <dt>{tr('Corte de contacto más largo', 'Longest contact gap')}</dt>
              <dd className="num">{result.longestGapMs > 0 ? fmtDuration(result.longestGapMs) : tr('ninguno', 'none')}</dd>
            </dl>
            {result.byStation.length > 1 && (
              <ul className="comms-stations">
                {result.byStation.map((b) => (
                  <li key={b.name}>
                    <b>{b.short}</b> {stationName(b.name)}: {fmtDuration(b.intervals.reduce((s, iv) => s + iv.end - iv.start, 0))}
                  </li>
                ))}
              </ul>
            )}
            <p className="comms-note">
              {tr(
                `Una estación ve la Luna cuando la tiene a más de 10° sobre su horizonte. ${stationsOf(config).length > 1 ? 'Cada tramo se asigna a la que la tiene más alta.' : ''}`,
                `A station sees the Moon when it is over 10° above its horizon. ${stationsOf(config).length > 1 ? 'Each stretch goes to the one that has it highest.' : ''}`,
              )}
            </p>
          </>
        ) : (
          <p className="empty">{tr('Calculando…', 'Computing…')}</p>
        ))}
    </div>
  );
}

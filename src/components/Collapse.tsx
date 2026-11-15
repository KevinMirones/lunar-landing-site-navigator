// Collapsible sections and drawer toggles. The motion lives in CSS (grid track
// transitions), so a panel animates its real size and the maps resize with it.
import { useTr } from '../lib/util';

type Dir = 'up' | 'right' | 'down' | 'left';
const TURN: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 };

export function Chevron({ dir = 'up' }: { dir?: Dir }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={dir === 'up' ? undefined : { transform: `rotate(${TURN[dir]}deg)` }}>
      <path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Corner marks: outward to give the map the whole width, inward to bring the panels back. */
export function FocusIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={expanded ? 'M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4' : 'M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ToggleProps {
  open: boolean;
  /** id of the region this button shows and hides */
  controls: string;
  /** what is shown or hidden, e.g. "el panorama" */
  label: string;
  dir?: Dir;
  onToggle: () => void;
}

export function SectionToggle({ open, controls, label, dir, onToggle }: ToggleProps) {
  const tr = useTr();
  const text = `${open ? tr('Ocultar', 'Hide') : tr('Mostrar', 'Show')} ${label}`;
  return (
    <button type="button" className="toggle" aria-expanded={open} aria-controls={controls} aria-label={text} title={text} onClick={onToggle}>
      <Chevron dir={dir} />
    </button>
  );
}

export function Collapse({ id, open, children }: { id: string; open: boolean; children: React.ReactNode }) {
  return (
    <div id={id} className={`collapse${open ? '' : ' is-closed'}`}>
      <div className="collapse-inner">{children}</div>
    </div>
  );
}

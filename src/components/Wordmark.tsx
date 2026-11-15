// LUMINA wordmark: a thin lunar horizon over the name, with sunlight just
// breaking over its crest. The arc tapers to nothing at both ends, like a limb.
export function Wordmark() {
  return (
    <span className="wordmark">
      <svg viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="wordmark-limb" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ece7db" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ffffff" />
            <stop offset="1" stopColor="#ece7db" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="wordmark-halo">
            <stop offset="0" stopColor="#fff3d6" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="2.6" rx="24" ry="5.5" fill="url(#wordmark-halo)" />
        <path d="M0,13Q50,-7 100,13Q50,-4.2 0,13Z" fill="url(#wordmark-limb)" />
      </svg>
      LUMINA
    </span>
  );
}

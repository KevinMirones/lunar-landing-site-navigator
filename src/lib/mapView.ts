// Framing of the polar map: where it looks and how far it can zoom or pan.

/** Map centre in km on the polar stereographic plane, and half the shorter side of the frame in km. */
export interface MapView {
  cx: number;
  cy: number;
  half: number;
}

/** Closest zoom: 8 km from the centre to the shorter edge of the frame. */
export const MIN_HALF_KM = 8;

/** The whole map, centred on the pole. */
export const fullView = (extentKm: number): MapView => ({ cx: 0, cy: 0, half: extentKm });

/**
 * Keeps the view on the map data, which covers ±extentKm on both axes. Zooming out stops when
 * the whole map fits in the frame. Along an axis where the map does not fill the frame, the map
 * stays centred. Along an axis where it does, the frame cannot pass the edge of the data.
 * The frame is w × h pixels; before it has a size, the view is only kept in range.
 */
export function clampView(v: MapView, extentKm: number, w: number, h: number): MapView {
  const half = Math.min(extentKm, Math.max(MIN_HALF_KM, v.half));
  const minSide = Math.min(w, h);
  if (minSide <= 0) return { half, cx: 0, cy: 0 };
  const along = (c: number, side: number) => {
    const reach = (half * side) / minSide; // km from the centre to this edge of the frame
    return reach >= extentKm ? 0 : Math.min(extentKm - reach, Math.max(reach - extentKm, c));
  };
  return { half, cx: along(v.cx, w), cy: along(v.cy, h) };
}

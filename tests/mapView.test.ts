// Framing of the polar map: it opens centred, cannot zoom out past the data, and cannot be dragged off it.
import { describe, expect, it } from 'vitest';
import { MIN_HALF_KM, clampView, fullView } from '../src/lib/mapView';

const E = 307.2; // half the side of the map data, km

describe('polar map framing', () => {
  it('opens on the whole map centred on the pole', () => {
    expect(clampView(fullView(E), E, 1020, 640)).toEqual({ cx: 0, cy: 0, half: E });
  });

  it('does not zoom out past the whole map or in past the closest zoom', () => {
    expect(clampView({ cx: 0, cy: 0, half: 900 }, E, 800, 600).half).toBe(E);
    expect(clampView({ cx: 0, cy: 0, half: 1 }, E, 800, 600).half).toBe(MIN_HALF_KM);
  });

  it('cannot be dragged while the whole map is in view', () => {
    expect(clampView({ cx: 120, cy: -80, half: E }, E, 1020, 640)).toEqual({ cx: 0, cy: 0, half: E });
  });

  it('keeps the map centred across a frame wider than the map, and lets it move along the other side', () => {
    // 1000 × 500 px frame at half = 200 km: 400 km from centre to the side edges, 200 km to the top.
    const v = clampView({ cx: 150, cy: 150, half: 200 }, E, 1000, 500);
    expect(v.cx).toBe(0);
    expect(v.cy).toBeCloseTo(E - 200);
  });

  it('stops at the edge of the data when zoomed in', () => {
    const v = clampView({ cx: 400, cy: -400, half: 50 }, E, 800, 800);
    expect(v.cx).toBeCloseTo(E - 50);
    expect(v.cy).toBeCloseTo(-(E - 50));
  });

  it('leaves a view that is already inside the data as it is', () => {
    expect(clampView({ cx: 30, cy: -40, half: 60 }, E, 800, 600)).toEqual({ cx: 30, cy: -40, half: 60 });
  });

  it('centres the view while the frame has no size yet', () => {
    expect(clampView({ cx: 30, cy: -40, half: 60 }, E, 0, 0)).toEqual({ cx: 0, cy: 0, half: 60 });
  });
});

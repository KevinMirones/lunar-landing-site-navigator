// S04: choosing the best nearby points from a searched grid.
import { describe, expect, it } from 'vitest';
import { distanceBearing, heatRange, rankCells, type SearchCell } from '../src/lib/search';

const GRID = 11;
const cell = (i: number, j: number, over: Partial<SearchCell> = {}): SearchCell => ({
  i,
  j,
  lat: -86,
  lon: 0,
  covered: true,
  elevM: 1000,
  slopeDeg: 3,
  sunShare: 0.5,
  earthShare: 0.5,
  bothShare: 0.3,
  longestDarkH: 100,
  score: 50,
  ...over,
});

describe('ranking searched cells', () => {
  it('puts the cell with the most sunlight first when sunlight is the criterion', () => {
    const cells = [cell(0, 0, { sunShare: 0.2 }), cell(5, 5, { sunShare: 0.9 }), cell(9, 9, { sunShare: 0.6 })];
    expect(rankCells(cells, 'sun', GRID).map((c) => c.sunShare)).toEqual([0.9, 0.6, 0.2]);
  });

  it('ranks by Earth link or by the index when asked to', () => {
    const cells = [cell(0, 0, { earthShare: 1, score: 10 }), cell(5, 5, { earthShare: 0.1, score: 90 })];
    expect(rankCells(cells, 'earth', GRID)[0].earthShare).toBe(1);
    expect(rankCells(cells, 'score', GRID)[0].score).toBe(90);
  });

  it('leaves out cells steeper than the landing limit', () => {
    const cells = [cell(0, 0, { sunShare: 1, slopeDeg: 25 }), cell(5, 5, { sunShare: 0.4, slopeDeg: 4 })];
    expect(rankCells(cells, 'sun', GRID).map((c) => c.sunShare)).toEqual([0.4]);
    expect(rankCells(cells, 'sun', GRID, { maxSlopeDeg: 30 })[0].sunShare).toBe(1);
  });

  it('leaves out cells without real terrain', () => {
    const cells = [cell(0, 0, { sunShare: 1, covered: false }), cell(5, 5, { sunShare: 0.4 })];
    expect(rankCells(cells, 'sun', GRID)).toHaveLength(1);
  });

  it('never proposes two neighbouring cells', () => {
    const cells = [cell(5, 5, { sunShare: 0.9 }), cell(5, 6, { sunShare: 0.89 }), cell(6, 6, { sunShare: 0.88 }), cell(5, 7, { sunShare: 0.5 })];
    expect(rankCells(cells, 'sun', GRID).map((c) => [c.i, c.j])).toEqual([
      [5, 5],
      [5, 7],
    ]);
  });

  it('breaks ties with the index, then with the shortest move from the original point', () => {
    const cells = [cell(0, 0, { earthShare: 1, score: 60 }), cell(5, 3, { earthShare: 1, score: 80 }), cell(9, 9, { earthShare: 1, score: 80 })];
    expect(rankCells(cells, 'earth', GRID).map((c) => [c.i, c.j])).toEqual([
      [5, 3],
      [9, 9],
      [0, 0],
    ]);
  });

  it('proposes at most five points', () => {
    const cells = [];
    for (let i = 0; i < GRID; i += 2) for (let j = 0; j < GRID; j += 2) cells.push(cell(i, j, { sunShare: (i * GRID + j) / 200 }));
    expect(rankCells(cells, 'sun', GRID)).toHaveLength(5);
  });
});

describe('colour scale of the heat map', () => {
  it('spans the lowest and highest value among cells with terrain', () => {
    const cells = [cell(0, 0, { sunShare: 0.2 }), cell(1, 0, { sunShare: 0.7 }), cell(2, 0, { sunShare: 0.99, covered: false })];
    expect(heatRange(cells, 'sun')).toEqual({ min: 0.2, max: 0.7 });
  });
});

describe('distance and bearing between two points on the Moon', () => {
  it('measures one degree of latitude as about 30.3 km due north', () => {
    const { km, bearingDeg } = distanceBearing({ lat: -86, lon: 10 }, { lat: -85, lon: 10 });
    expect(km).toBeCloseTo(30.32, 1);
    expect(bearingDeg).toBeCloseTo(0, 5);
  });

  it('points east for a move along the equator toward larger longitude', () => {
    expect(distanceBearing({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }).bearingDeg).toBeCloseTo(90, 5);
  });

  it('gives the 1.2 km between the two Malapert points of the project history', () => {
    expect(distanceBearing({ lat: -85.99, lon: -2.93 }, { lat: -85.95, lon: -2.93 }).km).toBeCloseTo(1.21, 2);
  });
});

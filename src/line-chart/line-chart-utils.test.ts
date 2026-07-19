import { describe, expect, it } from 'vitest';
import {
  computeLineChartGeometry,
  isLineChartDataEmpty,
  nearestPointIndex,
  type LineChartSeries,
} from './line-chart-utils';

function expectNoNaN(path: string) {
  expect(path).not.toMatch(/NaN/);
}

describe('isLineChartDataEmpty', () => {
  it('is true for an empty series array', () => {
    expect(isLineChartDataEmpty([])).toBe(true);
  });

  it('is true when every series has zero points', () => {
    expect(isLineChartDataEmpty([{ name: 'a', points: [] }])).toBe(true);
  });

  it('is false when at least one series has a point', () => {
    expect(isLineChartDataEmpty([{ name: 'a', points: [{ x: 1, y: 1 }] }])).toBe(false);
  });
});

describe('computeLineChartGeometry', () => {
  it('marks empty series as isEmpty', () => {
    const g = computeLineChartGeometry([], 220);
    expect(g.isEmpty).toBe(true);
    expect(g.series).toEqual([]);
  });

  it('renders a single point without a line path', () => {
    const series: LineChartSeries[] = [{ name: 'a', points: [{ x: 'Jan', y: 5 }] }];
    const g = computeLineChartGeometry(series, 220);
    expect(g.isEmpty).toBe(false);
    expect(g.series[0].points.length).toBe(1);
    expect(g.series[0].linePath).toBe('');
  });

  it('centers a flat series (all equal y) without crashing', () => {
    const series: LineChartSeries[] = [
      { name: 'a', points: [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }] },
    ];
    const g = computeLineChartGeometry(series, 220);
    const ys = g.series[0].points.map((p) => p.y);
    expect(ys.every((y) => y === ys[0])).toBe(true);
    expectNoNaN(g.series[0].linePath);
  });

  it('handles series of differing lengths, stopping the shorter one early rather than fabricating points', () => {
    const series: LineChartSeries[] = [
      { name: 'long', points: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }, { x: 4, y: 4 }] },
      { name: 'short', points: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
    ];
    const g = computeLineChartGeometry(series, 220);
    expect(g.pointCount).toBe(4); // driven by the longest series
    const shortGeo = g.series.find((s) => s.name === 'short')!;
    expect(shortGeo.points.length).toBe(2);
    expectNoNaN(shortGeo.linePath);
  });

  it('breaks the line path across a NaN/missing point rather than interpolating', () => {
    const series: LineChartSeries[] = [
      { name: 'a', points: [{ x: 1, y: 1 }, { x: 2, y: NaN }, { x: 3, y: 3 }] },
    ];
    const g = computeLineChartGeometry(series, 220);
    const geo = g.series[0];
    expect(geo.points[1].valid).toBe(false);
    // path should contain two separate "M" moves: one for the first point, one after the gap
    const moveCount = (geo.linePath.match(/M/g) ?? []).length;
    expect(moveCount).toBe(2);
    expectNoNaN(geo.linePath);
  });

  it('excludes NaN values from the y-domain computation', () => {
    const series: LineChartSeries[] = [{ name: 'a', points: [{ x: 1, y: NaN }, { x: 2, y: 50 }] }];
    const g = computeLineChartGeometry(series, 220);
    expect(g.yDomain[1]).toBeGreaterThanOrEqual(50);
  });

  it('falls back to a [0,0]-based domain when every value is NaN', () => {
    const series: LineChartSeries[] = [{ name: 'a', points: [{ x: 1, y: NaN }, { x: 2, y: NaN }] }];
    const g = computeLineChartGeometry(series, 220);
    expect(g.isEmpty).toBe(false);
    expect(Number.isFinite(g.yDomain[0])).toBe(true);
    expect(Number.isFinite(g.yDomain[1])).toBe(true);
  });

  it('produces a closed area path spanning from the first to the last valid point', () => {
    const series: LineChartSeries[] = [{ name: 'a', points: [{ x: 1, y: 1 }, { x: 2, y: 5 }, { x: 3, y: 2 }] }];
    const g = computeLineChartGeometry(series, 220);
    const geo = g.series[0];
    expect(geo.areaPath.startsWith('M')).toBe(true);
    expect(geo.areaPath.endsWith('Z')).toBe(true);
    expectNoNaN(geo.areaPath);
  });

  it('produces no area path for a single-point series', () => {
    const series: LineChartSeries[] = [{ name: 'a', points: [{ x: 1, y: 5 }] }];
    const g = computeLineChartGeometry(series, 220);
    expect(g.series[0].areaPath).toBe('');
  });

  it('is NaN-safe across multi-series shapes', () => {
    const series: LineChartSeries[] = [
      { name: 'a', points: [{ x: 1, y: NaN }, { x: 2, y: 5 }, { x: 3, y: NaN }] },
      { name: 'b', points: [{ x: 1, y: 1 }] },
      { name: 'c', points: [] },
    ];
    const g = computeLineChartGeometry(series, 220);
    for (const s of g.series) {
      expectNoNaN(s.linePath);
      expectNoNaN(s.areaPath);
    }
  });
});

describe('nearestPointIndex', () => {
  const plotArea = { left: 40, right: 588, top: 12, bottom: 196 };

  it('returns 0 for a single point series', () => {
    expect(nearestPointIndex(300, plotArea, 1)).toBe(0);
  });

  it('returns the nearest index for a mid-range offset', () => {
    // 5 points spread evenly across [40, 588]; offset near the 3rd point (index 2)
    const idx = nearestPointIndex(40 + (588 - 40) * 0.5, plotArea, 5);
    expect(idx).toBe(2);
  });

  it('clamps to the first index for an offset before the plot area', () => {
    expect(nearestPointIndex(-100, plotArea, 5)).toBe(0);
  });

  it('clamps to the last index for an offset past the plot area', () => {
    expect(nearestPointIndex(10000, plotArea, 5)).toBe(4);
  });
});

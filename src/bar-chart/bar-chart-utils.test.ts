import { describe, expect, it } from 'vitest';
import { computeBarChartGeometry, isBarChartDataEmpty, type BarChartDatum } from './bar-chart-utils';

function expectFinite(n: number) {
  expect(Number.isFinite(n)).toBe(true);
}

describe('isBarChartDataEmpty', () => {
  it('is true for an empty array', () => {
    expect(isBarChartDataEmpty([])).toBe(true);
  });

  it('is true when every value in every datum is NaN or missing', () => {
    const data: BarChartDatum[] = [
      { label: 'a', values: [NaN, NaN] },
      { label: 'b', values: [] },
    ];
    expect(isBarChartDataEmpty(data)).toBe(true);
  });

  it('is false when at least one value is finite', () => {
    const data: BarChartDatum[] = [{ label: 'a', values: [NaN, 5] }];
    expect(isBarChartDataEmpty(data)).toBe(false);
  });
});

describe('computeBarChartGeometry', () => {
  it('marks empty data as isEmpty with no bars', () => {
    const g = computeBarChartGeometry([], 1, false, 220);
    expect(g.isEmpty).toBe(true);
    expect(g.bars).toEqual([]);
  });

  it('never crashes at a single datum', () => {
    const g = computeBarChartGeometry([{ label: 'Q1', values: [10] }], 1, false, 220);
    expect(g.isEmpty).toBe(false);
    expect(g.bars.length).toBe(1);
    for (const b of g.bars) {
      expectFinite(b.x);
      expectFinite(b.y);
      expectFinite(b.width);
      expectFinite(b.height);
    }
  });

  it('treats missing values (fewer than seriesCount) as zero rather than crashing', () => {
    const data: BarChartDatum[] = [
      { label: 'a', values: [10, 20] },
      { label: 'b', values: [5] }, // missing second series value
    ];
    const g = computeBarChartGeometry(data, 2, false, 220);
    expect(g.bars.length).toBe(4);
    const bBarSeries2 = g.bars.find((b) => b.datumIndex === 1 && b.seriesIndex === 1);
    expect(bBarSeries2?.value).toBe(0);
  });

  it('treats NaN values as zero and never lets NaN reach geometry output', () => {
    const data: BarChartDatum[] = [
      { label: 'a', values: [NaN, 10] },
      { label: 'b', values: [5, NaN] },
    ];
    const g = computeBarChartGeometry(data, 2, false, 220);
    for (const b of g.bars) {
      expectFinite(b.x);
      expectFinite(b.y);
      expectFinite(b.width);
      expectFinite(b.height);
      expectFinite(b.value);
    }
  });

  it('handles all-zero data without crashing', () => {
    const data: BarChartDatum[] = [
      { label: 'a', values: [0, 0] },
      { label: 'b', values: [0, 0] },
    ];
    const g = computeBarChartGeometry(data, 2, false, 220);
    expect(g.isEmpty).toBe(false);
    for (const b of g.bars) {
      expect(b.height).toBeGreaterThanOrEqual(0);
      expectFinite(b.height);
    }
  });

  it('extends stacked bars below zero for negative values, above for positive', () => {
    const data: BarChartDatum[] = [{ label: 'a', values: [10, -5] }];
    const g = computeBarChartGeometry(data, 2, true, 220);
    const pos = g.bars.find((b) => b.seriesIndex === 0)!;
    const neg = g.bars.find((b) => b.seriesIndex === 1)!;
    // positive bar's bottom edge should sit at/above the zero baseline
    expect(pos.y + pos.height).toBeLessThanOrEqual(g.zeroY + 0.01);
    // negative bar's top edge should sit at/below the zero baseline
    expect(neg.y).toBeGreaterThanOrEqual(g.zeroY - 0.01);
  });

  it('keeps grouped bars side by side within a shared group width', () => {
    const data: BarChartDatum[] = [{ label: 'a', values: [10, 20, 30] }];
    const g = computeBarChartGeometry(data, 3, false, 220);
    const xs = g.bars.map((b) => b.x).sort((a, b) => a - b);
    expect(xs[0]).toBeLessThan(xs[1]);
    expect(xs[1]).toBeLessThan(xs[2]);
  });

  it('produces one group center per datum', () => {
    const data: BarChartDatum[] = [
      { label: 'a', values: [1] },
      { label: 'b', values: [2] },
      { label: 'c', values: [3] },
    ];
    const g = computeBarChartGeometry(data, 1, false, 220);
    expect(g.groupCenters.length).toBe(3);
  });

  it('is NaN-safe across a variety of shapes', () => {
    const shapes: BarChartDatum[][] = [
      [{ label: 'a', values: [NaN] }],
      [{ label: 'a', values: [] }, { label: 'b', values: [1, 2] }],
      [{ label: 'a', values: [-Infinity, Infinity] }],
    ];
    for (const data of shapes) {
      const g = computeBarChartGeometry(data, 2, false, 220);
      for (const b of g.bars) {
        expectFinite(b.x);
        expectFinite(b.y);
        expectFinite(b.width);
        expectFinite(b.height);
      }
    }
  });
});

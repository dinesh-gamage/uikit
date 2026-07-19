import { describe, expect, it } from 'vitest';
import { computeDonutSegments, donutTotal, type DonutChartDatum } from './donut-chart-utils';

describe('computeDonutSegments', () => {
  it('returns an empty array for empty data', () => {
    expect(computeDonutSegments([])).toEqual([]);
  });

  it('filters out zero values', () => {
    const data: DonutChartDatum[] = [{ label: 'a', value: 10 }, { label: 'b', value: 0 }];
    const segments = computeDonutSegments(data);
    expect(segments.map((s) => s.label)).toEqual(['a']);
  });

  it('filters out negative values', () => {
    const data: DonutChartDatum[] = [{ label: 'a', value: 10 }, { label: 'b', value: -5 }];
    const segments = computeDonutSegments(data);
    expect(segments.map((s) => s.label)).toEqual(['a']);
  });

  it('filters out NaN values (value > 0 is always false for NaN)', () => {
    const data: DonutChartDatum[] = [{ label: 'a', value: 10 }, { label: 'b', value: NaN }];
    const segments = computeDonutSegments(data);
    expect(segments.map((s) => s.label)).toEqual(['a']);
    for (const s of segments) {
      expect(Number.isNaN(s.percent)).toBe(false);
      expect(Number.isNaN(s.offset)).toBe(false);
      expect(Number.isNaN(s.length)).toBe(false);
    }
  });

  it('returns an empty array when every value is filtered out', () => {
    const data: DonutChartDatum[] = [{ label: 'a', value: 0 }, { label: 'b', value: -1 }, { label: 'c', value: NaN }];
    expect(computeDonutSegments(data)).toEqual([]);
  });

  it('computes percent shares that sum to 1', () => {
    const data: DonutChartDatum[] = [{ label: 'a', value: 25 }, { label: 'b', value: 75 }];
    const segments = computeDonutSegments(data);
    const totalPercent = segments.reduce((sum, s) => sum + s.percent, 0);
    expect(totalPercent).toBeCloseTo(1, 10);
  });

  it('renders a single remaining datum as a full circle (percent 1, offset 0)', () => {
    const data: DonutChartDatum[] = [{ label: 'a', value: 42 }, { label: 'b', value: 0 }];
    const segments = computeDonutSegments(data);
    expect(segments.length).toBe(1);
    expect(segments[0].percent).toBe(1);
    expect(segments[0].offset).toBe(0);
    expect(segments[0].length).toBe(1);
  });

  it('accumulates offsets so segments continue where the last one ended', () => {
    const data: DonutChartDatum[] = [{ label: 'a', value: 50 }, { label: 'b', value: 30 }, { label: 'c', value: 20 }];
    const segments = computeDonutSegments(data);
    expect(segments[0].offset).toBe(0);
    expect(segments[1].offset).toBeCloseTo(0.5, 10);
    expect(segments[2].offset).toBeCloseTo(0.8, 10);
  });
});

describe('donutTotal', () => {
  it('sums only positive, finite values', () => {
    const data: DonutChartDatum[] = [{ label: 'a', value: 10 }, { label: 'b', value: -5 }, { label: 'c', value: NaN }, { label: 'd', value: 20 }];
    expect(donutTotal(data)).toBe(30);
  });

  it('is 0 for empty data', () => {
    expect(donutTotal([])).toBe(0);
  });
});

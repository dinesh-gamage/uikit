import { describe, expect, it } from 'vitest';
import { computeSparklineGeometry } from './sparkline-utils';

function expectNoNaN(path: string) {
  expect(path).not.toMatch(/NaN/);
}

describe('computeSparklineGeometry', () => {
  it('marks empty data as isEmpty with no points or paths', () => {
    const g = computeSparklineGeometry([], 120, 32);
    expect(g.isEmpty).toBe(true);
    expect(g.points).toEqual([]);
    expect(g.linePath).toBe('');
    expect(g.areaPath).toBe('');
  });

  it('centers a single point and emits no line path', () => {
    const g = computeSparklineGeometry([42], 120, 32);
    expect(g.isEmpty).toBe(false);
    expect(g.points).toEqual([{ x: 60, y: 16 }]);
    expect(g.linePath).toBe('');
  });

  it('renders a flat series as a centered horizontal line', () => {
    const g = computeSparklineGeometry([5, 5, 5, 5], 120, 32, 2);
    const ys = g.points.map((p) => p.y);
    expect(ys.every((y) => y === ys[0])).toBe(true);
    // centered within the padded inner height
    expect(ys[0]).toBe(2 + (32 - 4) / 2);
  });

  it('spans the full width for the first and last point of an up trend', () => {
    const g = computeSparklineGeometry([1, 2, 3, 4, 5], 120, 32);
    expect(g.points[0].x).toBe(0);
    expect(g.points[g.points.length - 1].x).toBe(120);
    // highest value should be nearest the top (smallest y)
    expect(g.points[g.points.length - 1].y).toBeLessThan(g.points[0].y);
    expectNoNaN(g.linePath);
    expectNoNaN(g.areaPath);
  });

  it('mirrors a down trend so the lowest value sits nearest the bottom', () => {
    const g = computeSparklineGeometry([5, 4, 3, 2, 1], 120, 32);
    expect(g.points[g.points.length - 1].y).toBeGreaterThan(g.points[0].y);
  });

  it('produces a closed area path down to the baseline', () => {
    const g = computeSparklineGeometry([1, 3, 2], 100, 40);
    expect(g.areaPath.startsWith('M')).toBe(true);
    expect(g.areaPath.endsWith('Z')).toBe(true);
    expect(g.areaPath).toContain('40.00');
  });

  it('never produces NaN in paths regardless of data shape', () => {
    for (const data of [[0], [0, 0], [-5, 10, -3], [100]]) {
      const g = computeSparklineGeometry(data, 120, 32);
      expectNoNaN(g.linePath);
      expectNoNaN(g.areaPath);
    }
  });
});

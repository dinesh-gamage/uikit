import { describe, expect, it } from 'vitest';
import { linearScale, niceTicks } from './chart-scale';

describe('niceTicks', () => {
  it('returns [0] for NaN input', () => {
    expect(niceTicks(NaN, 10)).toEqual([0]);
    expect(niceTicks(0, NaN)).toEqual([0]);
    expect(niceTicks(NaN, NaN)).toEqual([0]);
  });

  it('returns [0] for Infinity input', () => {
    expect(niceTicks(0, Infinity)).toEqual([0]);
    expect(niceTicks(-Infinity, 10)).toEqual([0]);
  });

  it('returns a single tick when min === max', () => {
    expect(niceTicks(5, 5)).toEqual([5]);
  });

  it('returns a single [0] tick when both bounds are zero', () => {
    expect(niceTicks(0, 0)).toEqual([0]);
  });

  it('spans the requested domain with round tick values', () => {
    const ticks = niceTicks(0, 93);
    expect(ticks[0]).toBeLessThanOrEqual(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(93);
    // every tick should be a "nice" multiple, not a jagged float
    for (const t of ticks) {
      expect(Number.isFinite(t)).toBe(true);
    }
  });

  it('handles negative-only domains', () => {
    const ticks = niceTicks(-100, -10);
    expect(ticks[0]).toBeLessThanOrEqual(-100);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(-10);
  });

  it('handles domains straddling zero', () => {
    const ticks = niceTicks(-50, 100);
    expect(ticks[0]).toBeLessThanOrEqual(-50);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(100);
    expect(ticks).toContain(0);
  });

  it('never returns more than targetCount + 2 ticks', () => {
    for (const [min, max] of [[0, 1], [0, 1000000], [-7, 13], [0, 7], [1, 2]] as [number, number][]) {
      const ticks = niceTicks(min, max, 5);
      expect(ticks.length).toBeLessThanOrEqual(7);
    }
  });

  it('respects a custom targetCount', () => {
    const ticks = niceTicks(0, 100, 3);
    expect(ticks.length).toBeLessThanOrEqual(5);
    expect(ticks.length).toBeGreaterThan(1);
  });

  it('produces monotonically increasing ticks', () => {
    const ticks = niceTicks(3, 987);
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
    }
  });
});

describe('linearScale', () => {
  it('maps the domain minimum to the range minimum', () => {
    expect(linearScale(0, [0, 10], [0, 100])).toBe(0);
  });

  it('maps the domain maximum to the range maximum', () => {
    expect(linearScale(10, [0, 10], [0, 100])).toBe(100);
  });

  it('maps the domain midpoint to the range midpoint', () => {
    expect(linearScale(5, [0, 10], [0, 100])).toBe(50);
  });

  it('extrapolates for values outside the domain', () => {
    expect(linearScale(20, [0, 10], [0, 100])).toBe(200);
    expect(linearScale(-10, [0, 10], [0, 100])).toBe(-100);
  });

  it('supports an inverted range (e.g. SVG y-axes)', () => {
    expect(linearScale(0, [0, 10], [100, 0])).toBe(100);
    expect(linearScale(10, [0, 10], [100, 0])).toBe(0);
  });

  it('returns the range midpoint for a NaN value', () => {
    expect(linearScale(NaN, [0, 10], [0, 100])).toBe(50);
  });

  it('returns the range midpoint for a degenerate domain', () => {
    expect(linearScale(5, [5, 5], [0, 100])).toBe(50);
  });

  it('returns the range midpoint for a non-finite domain bound', () => {
    expect(linearScale(5, [0, Infinity], [0, 100])).toBe(50);
    expect(linearScale(5, [NaN, 10], [0, 100])).toBe(50);
  });

  it('falls back to 0 when the range itself is non-finite (no midpoint is computable)', () => {
    expect(linearScale(5, [0, 10], [-Infinity, 100])).toBe(0);
  });

  it('never produces NaN regardless of input shape', () => {
    const cases: Array<[number, [number, number], [number, number]]> = [
      [NaN, [0, 10], [0, 100]],
      [5, [NaN, NaN], [0, 100]],
      [5, [0, 10], [NaN, NaN]],
      [Infinity, [0, 10], [0, 100]],
      [5, [5, 5], [50, 50]],
    ];
    for (const [value, domain, range] of cases) {
      expect(Number.isNaN(linearScale(value, domain, range))).toBe(false);
    }
  });
});

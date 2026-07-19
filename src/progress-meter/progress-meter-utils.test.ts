import { describe, expect, it } from 'vitest';
import { computeFillPercent, defaultFormat, resolveTone } from './progress-meter-utils';

describe('resolveTone', () => {
  it('passes explicit tones through unchanged', () => {
    expect(resolveTone(10, 100, 'success')).toBe('success');
    expect(resolveTone(999, 10, 'primary')).toBe('primary');
  });

  it('resolves auto to primary below 80%', () => {
    expect(resolveTone(50, 100, 'auto')).toBe('primary');
    expect(resolveTone(79, 100, 'auto')).toBe('primary');
  });

  it('resolves auto to warning between 80% and 100% inclusive', () => {
    expect(resolveTone(80, 100, 'auto')).toBe('warning');
    expect(resolveTone(95, 100, 'auto')).toBe('warning');
    expect(resolveTone(100, 100, 'auto')).toBe('warning');
  });

  it('resolves auto to danger when value exceeds max', () => {
    expect(resolveTone(101, 100, 'auto')).toBe('danger');
    expect(resolveTone(200, 100, 'auto')).toBe('danger');
  });

  it('treats a zero or negative max as an overflow condition', () => {
    expect(resolveTone(5, 0, 'auto')).toBe('danger');
    expect(resolveTone(0, 0, 'auto')).toBe('primary');
    expect(resolveTone(5, -10, 'auto')).toBe('danger');
  });
});

describe('computeFillPercent', () => {
  it('computes a proportional fill under 100%', () => {
    expect(computeFillPercent(25, 100)).toEqual({ percent: 25, overflow: false });
  });

  it('caps the fill at 100% and flags overflow when value exceeds max', () => {
    expect(computeFillPercent(150, 100)).toEqual({ percent: 100, overflow: true });
  });

  it('does not flag overflow exactly at max', () => {
    expect(computeFillPercent(100, 100)).toEqual({ percent: 100, overflow: false });
  });

  it('floors negative values at 0%', () => {
    expect(computeFillPercent(-10, 100)).toEqual({ percent: 0, overflow: false });
  });

  it('handles a zero or negative max without producing NaN', () => {
    expect(computeFillPercent(5, 0)).toEqual({ percent: 0, overflow: true });
    expect(computeFillPercent(0, 0)).toEqual({ percent: 0, overflow: false });
    expect(computeFillPercent(5, -10)).toEqual({ percent: 0, overflow: true });
  });
});

describe('defaultFormat', () => {
  it('formats value and max with locale-aware thousands separators', () => {
    const formatter = new Intl.NumberFormat();
    expect(defaultFormat(3200, 5000)).toBe(`${formatter.format(3200)} / ${formatter.format(5000)}`);
  });

  it('formats small numbers without separators', () => {
    const formatter = new Intl.NumberFormat();
    expect(defaultFormat(3, 10)).toBe(`${formatter.format(3)} / ${formatter.format(10)}`);
  });
});

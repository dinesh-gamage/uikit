export type ProgressMeterTone = 'auto' | 'primary' | 'success' | 'warning' | 'danger';
export type ResolvedProgressMeterTone = 'primary' | 'success' | 'warning' | 'danger';

/**
 * Resolves the 'auto' tone from the value/max ratio: below 80% is primary,
 * 80–100% is warning, over 100% (value exceeds max) is danger. Explicit
 * tones pass through unchanged.
 */
export function resolveTone(value: number, max: number, tone: ProgressMeterTone): ResolvedProgressMeterTone {
  if (tone !== 'auto') return tone;
  if (!Number.isFinite(max) || max <= 0) return value > 0 ? 'danger' : 'primary';
  const ratio = value / max;
  if (ratio > 1) return 'danger';
  if (ratio >= 0.8) return 'warning';
  return 'primary';
}

export interface ProgressMeterFill {
  /** Fill width as a percentage, clamped to [0, 100]. */
  percent: number;
  /** True when value exceeds max. */
  overflow: boolean;
}

/** Computes the clamped fill percentage and whether the value overflows max. */
export function computeFillPercent(value: number, max: number): ProgressMeterFill {
  if (!Number.isFinite(max) || max <= 0) return { percent: 0, overflow: value > 0 };
  const ratio = value / max;
  return { percent: Math.min(Math.max(ratio, 0), 1) * 100, overflow: ratio > 1 };
}

const numberFormatter = new Intl.NumberFormat();

/** Default value formatter: "3,200 / 5,000" with locale-aware thousands separators. */
export function defaultFormat(value: number, max: number): string {
  return `${numberFormatter.format(value)} / ${numberFormatter.format(max)}`;
}

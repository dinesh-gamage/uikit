export interface DonutChartDatum {
  label: string;
  value: number;
}

export interface DonutChartSegment {
  label: string;
  value: number;
  /** Fraction of the total, 0-1. */
  percent: number;
  /** Cumulative stroke-dashoffset (as a fraction of the ring's circumference) where this segment starts. */
  offset: number;
  /** stroke-dasharray "on" length (as a fraction of the ring's circumference) for this segment. */
  length: number;
}

/**
 * Filters out non-positive values (a donut segment can't meaningfully
 * represent zero or a negative share of a whole) and computes each
 * remaining segment's share expressed as fractions of the ring's
 * circumference, ready to drive `stroke-dasharray`/`stroke-dashoffset`.
 * NaN values are excluded automatically: `value > 0` is always false for
 * NaN, so no separate NaN check is needed.
 */
export function computeDonutSegments(data: DonutChartDatum[]): DonutChartSegment[] {
  const positive = (data ?? []).filter((d) => d.value > 0);
  const total = positive.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) return [];

  let cumulative = 0;
  return positive.map((d) => {
    const percent = d.value / total;
    const segment: DonutChartSegment = { label: d.label, value: d.value, percent, offset: cumulative, length: percent };
    cumulative += percent;
    return segment;
  });
}

export function donutTotal(data: DonutChartDatum[]): number {
  return (data ?? []).filter((d) => d.value > 0).reduce((sum, d) => sum + d.value, 0);
}

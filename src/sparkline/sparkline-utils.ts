export interface SparklinePoint {
  x: number;
  y: number;
}

export interface SparklineGeometry {
  points: SparklinePoint[];
  /** SVG path `d` for the line, empty when there are fewer than 2 points. */
  linePath: string;
  /** SVG path `d` for the area fill, empty when there are fewer than 2 points. */
  areaPath: string;
  isEmpty: boolean;
}

/**
 * Normalizes a series of numbers into SVG coordinates within a
 * `width` x `height` viewBox. Handles the edge cases a raw min/max
 * normalization would otherwise blow up on:
 *  - empty data -> isEmpty geometry, no points
 *  - a single value -> one centered point (rendered as a dot)
 *  - a flat series (min === max) -> a centered horizontal line
 */
export function computeSparklineGeometry(
  data: number[],
  width: number,
  height: number,
  padding = 2
): SparklineGeometry {
  if (!data || data.length === 0) {
    return { points: [], linePath: '', areaPath: '', isEmpty: true };
  }

  if (data.length === 1) {
    return { points: [{ x: width / 2, y: height / 2 }], linePath: '', areaPath: '', isEmpty: false };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const innerHeight = Math.max(height - padding * 2, 0);
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const normalized = range === 0 ? 0.5 : (v - min) / range;
    return { x: i * step, y: padding + (1 - normalized) * innerHeight };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const baseline = height.toFixed(2);
  const areaPath = `${linePath} L${last.x.toFixed(2)},${baseline} L${first.x.toFixed(2)},${baseline} Z`;

  return { points, linePath, areaPath, isEmpty: false };
}

import { linearScale, niceTicks } from '../charts/chart-scale';

export interface LineChartPoint {
  x: string | number;
  y: number;
}

export interface LineChartSeries {
  name: string;
  points: LineChartPoint[];
}

/** Internal fixed coordinate width for the SVG viewBox; the <svg> itself scales to 100% of its container. */
export const LINE_CHART_WIDTH = 600;

export interface LineChartPlotArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface LineChartPlottedPoint {
  x: number;
  y: number;
  index: number;
  value: number;
  /** false for a point whose original y was NaN/missing -- omitted from the line/area path but still tracked for hover-by-index. */
  valid: boolean;
}

export interface LineChartSeriesGeometry {
  name: string;
  seriesIndex: number;
  points: LineChartPlottedPoint[];
  /** SVG path `d` for the line. Breaks (moves without drawing) across any invalid/NaN point. */
  linePath: string;
  /** SVG path `d` for the area fill (only meaningful for a single series with `fill` enabled). Empty when fewer than 2 valid points. */
  areaPath: string;
}

export interface LineChartGeometry {
  series: LineChartSeriesGeometry[];
  ticks: number[];
  yDomain: [number, number];
  plotArea: LineChartPlotArea;
  /** Number of index-slots on the x-axis (the longest series' point count). */
  pointCount: number;
  /** The x label (raw, pre-format) for each index slot, taken from the longest series. */
  xValues: (string | number)[];
  isEmpty: boolean;
}

export function isLineChartDataEmpty(series: LineChartSeries[]): boolean {
  if (!series || series.length === 0) return true;
  return series.every((s) => !s.points || s.points.length === 0);
}

const DEFAULT_PADDING: LineChartPlotArea = { left: 40, right: 12, top: 12, bottom: 24 };

export function computeLineChartGeometry(
  series: LineChartSeries[],
  height: number,
  width: number = LINE_CHART_WIDTH,
  padding: LineChartPlotArea = DEFAULT_PADDING
): LineChartGeometry {
  const plotArea: LineChartPlotArea = {
    left: padding.left,
    right: width - padding.right,
    top: padding.top,
    bottom: height - padding.bottom,
  };

  if (isLineChartDataEmpty(series)) {
    return {
      series: [],
      ticks: [0],
      yDomain: [0, 0],
      plotArea,
      pointCount: 0,
      xValues: [],
      isEmpty: true,
    };
  }

  // The longest series determines x-axis spacing; shorter series simply stop early.
  let longest = series[0];
  for (const s of series) {
    if ((s.points?.length ?? 0) > (longest.points?.length ?? 0)) longest = s;
  }
  const pointCount = longest.points?.length ?? 0;
  const xValues = (longest.points ?? []).map((p) => p.x);

  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (const s of series) {
    for (const p of s.points ?? []) {
      if (Number.isFinite(p.y)) {
        dataMin = Math.min(dataMin, p.y);
        dataMax = Math.max(dataMax, p.y);
      }
    }
  }
  // No finite values found anywhere -- fall back to a [0, 0] domain so niceTicks still returns something sane.
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    dataMin = 0;
    dataMax = 0;
  }

  const ticks = niceTicks(dataMin, dataMax);
  const yDomain: [number, number] = [Math.min(dataMin, ticks[0]), Math.max(dataMax, ticks[ticks.length - 1])];

  const innerWidth = Math.max(plotArea.right - plotArea.left, 0);
  const step = pointCount > 1 ? innerWidth / (pointCount - 1) : 0;
  const xFor = (index: number) => (pointCount > 1 ? plotArea.left + index * step : (plotArea.left + plotArea.right) / 2);
  const yFor = (v: number) => linearScale(v, yDomain, [plotArea.bottom, plotArea.top]);

  const seriesGeometry: LineChartSeriesGeometry[] = series.map((s, seriesIndex) => {
    const points: LineChartPlottedPoint[] = (s.points ?? []).map((p, index) => ({
      x: xFor(index),
      y: Number.isFinite(p.y) ? yFor(p.y) : NaN,
      index,
      value: p.y,
      valid: Number.isFinite(p.y),
    }));

    // Build the line path, breaking (starting a new "M" segment) across invalid points
    // rather than fabricating a value or skipping straight over the gap. A series with
    // fewer than 2 valid points overall has nothing to connect -- mirroring Sparkline,
    // that's left as an empty path so the component can render a single point as a dot
    // instead of a degenerate lone "M" command.
    const validPoints = points.filter((p) => p.valid);
    let linePath = '';
    if (validPoints.length >= 2) {
      let drawing = false;
      for (const pt of points) {
        if (!pt.valid) {
          drawing = false;
          continue;
        }
        linePath += `${drawing ? 'L' : 'M'}${pt.x.toFixed(2)},${pt.y.toFixed(2)} `;
        drawing = true;
      }
      linePath = linePath.trim();
    }

    let areaPath = '';
    if (validPoints.length > 1 && linePath) {
      const first = validPoints[0];
      const last = validPoints[validPoints.length - 1];
      const baseline = plotArea.bottom.toFixed(2);
      areaPath = `${linePath} L${last.x.toFixed(2)},${baseline} L${first.x.toFixed(2)},${baseline} Z`;
    }

    return { name: s.name, seriesIndex, points, linePath, areaPath };
  });

  return { series: seriesGeometry, ticks, yDomain, plotArea, pointCount, xValues, isEmpty: false };
}

/**
 * Derives the nearest index-slot from a raw mouse x-offset (relative to
 * the SVG element's own bounding box, e.g. from `event.nativeEvent.offsetX`
 * scaled to viewBox units), without measuring any individual point.
 * Points are evenly spaced by index, so the index is just a division.
 */
export function nearestPointIndex(offsetXInViewBoxUnits: number, plotArea: LineChartPlotArea, pointCount: number): number {
  if (pointCount <= 1) return 0;
  const innerWidth = Math.max(plotArea.right - plotArea.left, 1);
  const step = innerWidth / (pointCount - 1);
  const raw = (offsetXInViewBoxUnits - plotArea.left) / step;
  return Math.min(Math.max(Math.round(raw), 0), pointCount - 1);
}

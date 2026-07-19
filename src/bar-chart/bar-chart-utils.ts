import { linearScale, niceTicks } from '../charts/chart-scale';

export interface BarChartDatum {
  label: string;
  values: number[];
}

/** Internal fixed coordinate width for the SVG viewBox; the <svg> itself scales to 100% of its container. */
export const BAR_CHART_WIDTH = 600;

export interface BarChartPlotArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface BarChartBarGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  seriesIndex: number;
  datumIndex: number;
  value: number;
}

export interface BarChartGeometry {
  bars: BarChartBarGeometry[];
  ticks: number[];
  yDomain: [number, number];
  zeroY: number;
  /** Horizontal center (in viewBox units) of each datum's bar group -- used to place x-axis labels. */
  groupCenters: number[];
  plotArea: BarChartPlotArea;
  isEmpty: boolean;
  seriesCount: number;
}

/**
 * `data.length === 0` is the obvious empty case, but a dataset made up
 * entirely of missing/NaN values renders as nothing visible either, so we
 * treat that the same way rather than showing an axis with zero-height
 * bars and no context.
 */
export function isBarChartDataEmpty(data: BarChartDatum[]): boolean {
  if (!data || data.length === 0) return true;
  return data.every((d) => !d.values || d.values.every((v) => !Number.isFinite(v)));
}

const DEFAULT_PADDING: BarChartPlotArea = { left: 40, right: 12, top: 12, bottom: 28 };

export function computeBarChartGeometry(
  data: BarChartDatum[],
  seriesCount: number,
  stacked: boolean,
  height: number,
  width: number = BAR_CHART_WIDTH,
  padding: BarChartPlotArea = DEFAULT_PADDING
): BarChartGeometry {
  const sc = Math.max(seriesCount, 1);
  const plotArea: BarChartPlotArea = {
    left: padding.left,
    right: width - padding.right,
    top: padding.top,
    bottom: height - padding.bottom,
  };

  if (isBarChartDataEmpty(data)) {
    return {
      bars: [],
      ticks: [0],
      yDomain: [0, 0],
      zeroY: plotArea.bottom,
      groupCenters: [],
      plotArea,
      isEmpty: true,
      seriesCount: sc,
    };
  }

  // Missing/NaN values become 0 -- never let them reach an SVG y/height attribute.
  const sanitized = data.map((d) => {
    const values: number[] = [];
    for (let i = 0; i < sc; i++) {
      const raw = d.values?.[i];
      values.push(Number.isFinite(raw) ? raw : 0);
    }
    return values;
  });

  let dataMin = 0;
  let dataMax = 0;
  for (const values of sanitized) {
    if (stacked) {
      let pos = 0;
      let neg = 0;
      for (const v of values) {
        if (v >= 0) pos += v;
        else neg += v;
      }
      dataMax = Math.max(dataMax, pos);
      dataMin = Math.min(dataMin, neg);
    } else {
      for (const v of values) {
        dataMax = Math.max(dataMax, v);
        dataMin = Math.min(dataMin, v);
      }
    }
  }

  const ticks = niceTicks(dataMin, dataMax);
  const yDomain: [number, number] = [Math.min(dataMin, ticks[0]), Math.max(dataMax, ticks[ticks.length - 1])];

  const yFor = (v: number) => linearScale(v, yDomain, [plotArea.bottom, plotArea.top]);
  const zeroY = yFor(0);

  const innerWidth = Math.max(width - padding.left - padding.right, 0);
  const groupCount = sanitized.length;
  const groupWidth = groupCount > 0 ? innerWidth / groupCount : 0;
  const groupGap = groupWidth * 0.18;
  const usableGroupWidth = Math.max(groupWidth - groupGap, 0);

  const bars: BarChartBarGeometry[] = [];
  const groupCenters: number[] = [];

  sanitized.forEach((values, datumIndex) => {
    const groupX = padding.left + datumIndex * groupWidth + groupGap / 2;
    groupCenters.push(groupX + usableGroupWidth / 2);

    if (stacked) {
      let posOffset = 0;
      let negOffset = 0;
      values.forEach((value, seriesIndex) => {
        let y0: number;
        let y1: number;
        if (value >= 0) {
          y0 = yFor(posOffset + value);
          y1 = yFor(posOffset);
          posOffset += value;
        } else {
          y0 = yFor(negOffset);
          y1 = yFor(negOffset + value);
          negOffset += value;
        }
        const barY = Math.min(y0, y1);
        const barHeight = Math.max(Math.abs(y1 - y0), 0);
        bars.push({ x: groupX, y: barY, width: usableGroupWidth, height: barHeight, seriesIndex, datumIndex, value });
      });
    } else {
      const barWidth = usableGroupWidth / sc;
      const barGap = Math.min(barWidth * 0.12, 2);
      values.forEach((value, seriesIndex) => {
        const barX = groupX + seriesIndex * barWidth;
        const y0 = yFor(value);
        const y1 = zeroY;
        const barY = Math.min(y0, y1);
        const barHeight = Math.max(Math.abs(y1 - y0), 0);
        bars.push({
          x: barX,
          y: barY,
          width: Math.max(barWidth - barGap, 1),
          height: barHeight,
          seriesIndex,
          datumIndex,
          value,
        });
      });
    }
  });

  return { bars, ticks, yDomain, zeroY, groupCenters, plotArea, isEmpty: false, seriesCount: sc };
}

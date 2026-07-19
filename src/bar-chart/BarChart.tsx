import { useState } from 'react';
import { cx } from '../utils/cx';
import { linearScale } from '../charts/chart-scale';
import { chartSeriesColor } from '../charts/chart-color';
import { defaultFormatValue } from '../charts/chart-format';
import { ChartEmptyState } from '../charts/ChartEmptyState';
import { ChartLegend, type ChartLegendItem } from '../charts/ChartLegend';
import { ChartHoverReadout } from '../charts/ChartHoverReadout';
import { BAR_CHART_WIDTH, computeBarChartGeometry, type BarChartDatum } from './bar-chart-utils';
import './bar-chart.scss';

export type { BarChartDatum };

export interface BarChartProps {
  data: BarChartDatum[];
  /** Legend names, parallel to each datum's `values[]`. Also used to determine series count when `data` is empty. */
  series?: string[];
  /** Stacked (values summed per group) vs grouped (values side by side). Default grouped. */
  stacked?: boolean;
  height?: number;
  formatValue?: (n: number) => string;
  emptyMessage?: string;
  className?: string;
}

// Past this many groups, x-axis labels are rotated instead of laid out horizontally --
// horizontal labels start overlapping their neighbors well before the chart is unreadable
// for other reasons, and rotation is simpler than measuring text width per label.
const ROTATE_LABELS_THRESHOLD = 8;

export function BarChart({
  data,
  series,
  stacked = false,
  height = 220,
  formatValue = defaultFormatValue,
  emptyMessage,
  className,
}: BarChartProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const seriesCount = series?.length ?? data[0]?.values.length ?? 1;
  const geometry = computeBarChartGeometry(data, seriesCount, stacked, height);
  const showLegend = seriesCount > 1;
  const rotateLabels = data.length > ROTATE_LABELS_THRESHOLD;

  if (geometry.isEmpty) {
    return (
      <div className={cx('uikit-bar-chart', className)}>
        <ChartEmptyState height={height} message={emptyMessage} />
      </div>
    );
  }

  const seriesName = (i: number) => series?.[i] ?? `Series ${i + 1}`;

  const legendItems: ChartLegendItem[] = showLegend
    ? Array.from({ length: geometry.seriesCount }, (_, i) => ({
        label: seriesName(i),
        color: chartSeriesColor(i),
      }))
    : [];

  const hoveredBar = hoveredBarIndex != null ? geometry.bars[hoveredBarIndex] : null;

  return (
    <div className={cx('uikit-bar-chart', className)}>
      {showLegend && <ChartLegend items={legendItems} className="uikit-bar-chart__legend" />}

      <div className="uikit-bar-chart__stage">
        <svg
          className="uikit-bar-chart__svg"
          viewBox={`0 0 ${BAR_CHART_WIDTH} ${height}`}
          height={height}
          preserveAspectRatio="none"
          role="img"
          aria-hidden="true"
        >
          {geometry.ticks.map((tick, i) => {
            const y = linearScale(tick, geometry.yDomain, [geometry.plotArea.bottom, geometry.plotArea.top]);
            return (
              <g key={i}>
                <line
                  className="uikit-bar-chart__gridline"
                  x1={geometry.plotArea.left}
                  x2={geometry.plotArea.right}
                  y1={y}
                  y2={y}
                />
                <text className="uikit-bar-chart__tick-label" x={geometry.plotArea.left - 6} y={y} textAnchor="end" dominantBaseline="middle">
                  {formatValue(tick)}
                </text>
              </g>
            );
          })}

          {geometry.bars.map((bar, i) => (
            <rect
              key={i}
              className={cx('uikit-bar-chart__bar', { 'uikit-bar-chart__bar--hover': hoveredBarIndex === i })}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={chartSeriesColor(bar.seriesIndex)}
              onMouseEnter={() => setHoveredBarIndex(i)}
              onMouseLeave={() => setHoveredBarIndex((cur) => (cur === i ? null : cur))}
            />
          ))}

          {data.map((datum, i) => (
            <text
              key={i}
              className={cx('uikit-bar-chart__x-label', { 'uikit-bar-chart__x-label--rotated': rotateLabels })}
              x={geometry.groupCenters[i]}
              y={height - 10}
              textAnchor={rotateLabels ? 'end' : 'middle'}
              transform={rotateLabels ? `rotate(-35 ${geometry.groupCenters[i]} ${height - 10})` : undefined}
            >
              <title>{datum.label}</title>
              {datum.label}
            </text>
          ))}
        </svg>

        {hoveredBar && (
          <ChartHoverReadout x={((hoveredBar.x + hoveredBar.width / 2) / BAR_CHART_WIDTH) * 100} y={hoveredBar.y}>
            <strong>{data[hoveredBar.datumIndex]?.label}</strong>
            {showLegend && <div>{seriesName(hoveredBar.seriesIndex)}</div>}
            <div>{formatValue(hoveredBar.value)}</div>
          </ChartHoverReadout>
        )}
      </div>
    </div>
  );
}

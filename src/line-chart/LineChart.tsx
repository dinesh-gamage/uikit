import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import { cx } from '../utils/cx';
import { linearScale } from '../charts/chart-scale';
import { chartSeriesColor } from '../charts/chart-color';
import { defaultFormatValue } from '../charts/chart-format';
import { ChartEmptyState } from '../charts/ChartEmptyState';
import { ChartLegend, type ChartLegendItem } from '../charts/ChartLegend';
import { ChartHoverReadout } from '../charts/ChartHoverReadout';
import { LINE_CHART_WIDTH, computeLineChartGeometry, nearestPointIndex, type LineChartSeries, type LineChartPoint } from './line-chart-utils';
import './line-chart.scss';

export type { LineChartSeries, LineChartPoint };

export interface LineChartProps {
  series: LineChartSeries[];
  height?: number;
  formatValue?: (n: number) => string;
  formatX?: (x: string | number) => string;
  /** Subtle area fill under the line. Only applied for a single series -- ignored (silently) when `series.length > 1`. */
  fill?: boolean;
  emptyMessage?: string;
  className?: string;
}

const defaultFormatX = (x: string | number) => String(x);

// Past a handful of points, every x-axis label would overlap its neighbors. Rather than
// measuring text width, we just thin labels out to roughly 8 evenly-spaced slots (always
// including the final point) and skip the rest -- points themselves are still all plotted
// and still hoverable, only the tick text is thinned.
const MAX_X_LABELS = 8;

export function LineChart({
  series,
  height = 220,
  formatValue = defaultFormatValue,
  formatX = defaultFormatX,
  fill = false,
  emptyMessage,
  className,
}: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const geometry = computeLineChartGeometry(series, height);
  const showLegend = series.length > 1;
  const showFill = fill && series.length === 1;

  if (geometry.isEmpty) {
    return (
      <div className={cx('uikit-line-chart', className)}>
        <ChartEmptyState height={height} message={emptyMessage} />
      </div>
    );
  }

  const legendItems: ChartLegendItem[] = showLegend
    ? geometry.series.map((s, i) => ({ label: s.name, color: chartSeriesColor(i) }))
    : [];

  const labelStep = Math.max(1, Math.ceil(geometry.pointCount / MAX_X_LABELS));

  const handleMouseMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const offsetX = e.clientX - rect.left;
    const viewBoxX = (offsetX / rect.width) * LINE_CHART_WIDTH;
    setHoveredIndex(nearestPointIndex(viewBoxX, geometry.plotArea, geometry.pointCount));
  };

  const hoveredPointsBySeries = hoveredIndex != null ? geometry.series.map((s) => s.points[hoveredIndex]) : [];
  const validHoveredYs = hoveredPointsBySeries.filter((p) => p?.valid).map((p) => p.y);
  const hoverX = hoveredIndex != null ? geometry.series[0]?.points[hoveredIndex]?.x : undefined;
  const hoverY = validHoveredYs.length > 0 ? Math.min(...validHoveredYs) : geometry.plotArea.top;

  return (
    <div className={cx('uikit-line-chart', className)}>
      {showLegend && <ChartLegend items={legendItems} className="uikit-line-chart__legend" />}

      <div className="uikit-line-chart__stage">
        <svg
          className="uikit-line-chart__svg"
          viewBox={`0 0 ${LINE_CHART_WIDTH} ${height}`}
          height={height}
          preserveAspectRatio="none"
          role="img"
          aria-hidden="true"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {geometry.ticks.map((tick, i) => {
            const y = linearScale(tick, geometry.yDomain, [geometry.plotArea.bottom, geometry.plotArea.top]);
            return (
              <g key={i}>
                <line
                  className="uikit-line-chart__gridline"
                  x1={geometry.plotArea.left}
                  x2={geometry.plotArea.right}
                  y1={y}
                  y2={y}
                />
                <text className="uikit-line-chart__tick-label" x={geometry.plotArea.left - 6} y={y} textAnchor="end" dominantBaseline="middle">
                  {formatValue(tick)}
                </text>
              </g>
            );
          })}

          {geometry.xValues.map((x, i) =>
            i % labelStep === 0 || i === geometry.xValues.length - 1 ? (
              <text
                key={i}
                className="uikit-line-chart__x-label"
                x={geometry.series[0]?.points[i]?.x ?? 0}
                y={height - 6}
                textAnchor="middle"
              >
                {formatX(x)}
              </text>
            ) : null
          )}

          {showFill && geometry.series[0].areaPath && (
            <path className="uikit-line-chart__area" d={geometry.series[0].areaPath} fill={chartSeriesColor(0)} stroke="none" />
          )}

          {geometry.series.map((s) => (
            <path
              key={s.seriesIndex}
              className="uikit-line-chart__line"
              d={s.linePath}
              fill="none"
              stroke={chartSeriesColor(s.seriesIndex)}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* A series with exactly one valid point has no line to draw (see line-chart-utils),
              so -- mirroring Sparkline -- it always renders as a standalone dot, not just on hover. */}
          {geometry.series.map((s) => {
            const validPoints = s.points.filter((p) => p.valid);
            if (validPoints.length !== 1) return null;
            const solo = validPoints[0];
            return (
              <circle
                key={`solo-${s.seriesIndex}`}
                className="uikit-line-chart__dot"
                cx={solo.x}
                cy={solo.y}
                r={3.5}
                fill={chartSeriesColor(s.seriesIndex)}
              />
            );
          })}

          {hoveredIndex != null &&
            geometry.series.map(
              (s) =>
                s.points[hoveredIndex]?.valid && (
                  <circle
                    key={s.seriesIndex}
                    className="uikit-line-chart__dot"
                    cx={s.points[hoveredIndex].x}
                    cy={s.points[hoveredIndex].y}
                    r={3.5}
                    fill={chartSeriesColor(s.seriesIndex)}
                  />
                )
            )}

          {hoveredIndex != null && (
            <line
              className="uikit-line-chart__hover-line"
              x1={geometry.series[0]?.points[hoveredIndex]?.x ?? 0}
              x2={geometry.series[0]?.points[hoveredIndex]?.x ?? 0}
              y1={geometry.plotArea.top}
              y2={geometry.plotArea.bottom}
            />
          )}
        </svg>

        {hoveredIndex != null && hoverX !== undefined && (
          <ChartHoverReadout x={(hoverX / LINE_CHART_WIDTH) * 100} y={hoverY}>
            <strong>{formatX(geometry.xValues[hoveredIndex])}</strong>
            {geometry.series.map((s) => {
              const pt = s.points[hoveredIndex];
              return (
                <div key={s.seriesIndex}>
                  {showLegend ? `${s.name}: ` : ''}
                  {pt?.valid ? formatValue(pt.value) : '—'}
                </div>
              );
            })}
          </ChartHoverReadout>
        )}
      </div>
    </div>
  );
}

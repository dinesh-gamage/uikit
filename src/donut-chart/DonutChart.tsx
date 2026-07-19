import { useState, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { chartSeriesColor } from '../charts/chart-color';
import { defaultFormatValue } from '../charts/chart-format';
import { ChartEmptyState } from '../charts/ChartEmptyState';
import { ChartLegend, type ChartLegendItem } from '../charts/ChartLegend';
import { computeDonutSegments, donutTotal, type DonutChartDatum } from './donut-chart-utils';
import './donut-chart.scss';

export type { DonutChartDatum };

export interface DonutChartProps {
  data: DonutChartDatum[];
  /** SVG width/height (square). Default 180. */
  size?: number;
  /** Ring stroke width. Default 22. */
  thickness?: number;
  /** Defaults to `formatValue(total)`. */
  centerLabel?: ReactNode;
  formatValue?: (n: number) => string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Zero and negative values are filtered out before anything is computed
 * or rendered -- a ring segment can't meaningfully represent a share
 * that's zero or negative. NaN values are filtered too, since `value > 0`
 * is always false for NaN. `centerLabel`'s default and the legend's
 * percentages are both based on the *filtered* total (the sum of the
 * positive values actually drawn), since that's what the ring visually
 * represents. If filtering removes every entry, the component renders
 * `ChartEmptyState` instead of an empty/broken ring.
 */
export function DonutChart({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  formatValue = defaultFormatValue,
  emptyMessage,
  className,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const segments = computeDonutSegments(data);
  const total = donutTotal(data);

  if (segments.length === 0) {
    return (
      <div className={cx('uikit-donut-chart', className)}>
        <ChartEmptyState height={size} message={emptyMessage} />
      </div>
    );
  }

  const radius = Math.max((size - thickness) / 2, 0);
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const legendItems: ChartLegendItem[] = segments.map((s, i) => ({
    label: s.label,
    color: chartSeriesColor(i),
    value: (
      <>
        {formatValue(s.value)} · {Math.round(s.percent * 100)}%
      </>
    ),
  }));

  const hovered = hoveredIndex != null ? segments[hoveredIndex] : null;
  const centerContent = hovered ? (
    <>
      <div className="uikit-donut-chart__center-label">{hovered.label}</div>
      <div className="uikit-donut-chart__center-value">
        {formatValue(hovered.value)} ({Math.round(hovered.percent * 100)}%)
      </div>
    </>
  ) : (
    <div className="uikit-donut-chart__center-value">{centerLabel ?? formatValue(total)}</div>
  );

  return (
    <div className={cx('uikit-donut-chart', className)}>
      <div className="uikit-donut-chart__ring-wrap" style={{ width: size, height: size }}>
        <svg
          className="uikit-donut-chart__svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-hidden="true"
        >
          {segments.map((s, i) => (
            <circle
              key={i}
              className="uikit-donut-chart__segment"
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={chartSeriesColor(i)}
              strokeWidth={hoveredIndex === i ? thickness + 4 : thickness}
              strokeDasharray={`${s.length * circumference} ${circumference - s.length * circumference}`}
              strokeDashoffset={-(s.offset * circumference)}
              transform={`rotate(-90 ${center} ${center})`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex((cur) => (cur === i ? null : cur))}
            />
          ))}
        </svg>
        <div className="uikit-donut-chart__center">{centerContent}</div>
      </div>

      <ChartLegend items={legendItems} className="uikit-donut-chart__legend" />
    </div>
  );
}

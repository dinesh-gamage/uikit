import { cx } from '../utils/cx';
import { computeSparklineGeometry } from './sparkline-utils';
import './sparkline.scss';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  /** Renders a subtle area fill under the line. */
  fill?: boolean;
  /** Renders a dot on the final datum. */
  showLastPoint?: boolean;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  stroke = 'var(--uikit-chart-1)',
  fill = false,
  showLastPoint = false,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const padding = Math.max(strokeWidth, 2);
  const geometry = computeSparklineGeometry(data, width, height, padding);
  const dotRadius = Math.max(strokeWidth * 1.6, 2);

  return (
    <svg
      className={cx('uikit-sparkline', className)}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
    >
      {geometry.isEmpty && (
        <line className="uikit-sparkline__placeholder" x1={0} y1={height / 2} x2={width} y2={height / 2} />
      )}

      {!geometry.isEmpty && geometry.points.length === 1 && (
        <circle className="uikit-sparkline__dot" cx={geometry.points[0].x} cy={geometry.points[0].y} r={dotRadius} fill={stroke} />
      )}

      {!geometry.isEmpty && geometry.points.length > 1 && (
        <>
          {fill && (
            <path className="uikit-sparkline__area" d={geometry.areaPath} fill={stroke} stroke="none" />
          )}
          <path
            className="uikit-sparkline__line"
            d={geometry.linePath}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {showLastPoint && (
            <circle
              className="uikit-sparkline__dot"
              cx={geometry.points[geometry.points.length - 1].x}
              cy={geometry.points[geometry.points.length - 1].y}
              r={dotRadius}
              fill={stroke}
            />
          )}
        </>
      )}
    </svg>
  );
}

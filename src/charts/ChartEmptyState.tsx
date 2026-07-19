import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import './chart-shared.scss';

export interface ChartEmptyStateProps {
  width?: number | string;
  height: number;
  message?: ReactNode;
  className?: string;
}

/** Shared placeholder every chart primitive renders when it has nothing to plot. */
export function ChartEmptyState({ width = '100%', height, message = 'No data', className }: ChartEmptyStateProps) {
  return (
    <div className={cx('uikit-chart-empty', className)} style={{ width, height }}>
      <span className="uikit-chart-empty__message">{message}</span>
    </div>
  );
}

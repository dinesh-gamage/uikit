import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import './chart-shared.scss';

export interface ChartLegendItem {
  label: ReactNode;
  color: string;
  value?: ReactNode;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
  className?: string;
}

/** Shared wrapping legend row (swatch + label + optional value) used by all chart primitives. */
export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <ul className={cx('uikit-chart-legend', className)}>
      {items.map((item, i) => (
        <li className="uikit-chart-legend__item" key={i}>
          {/* Dynamic per-item color from a CSS color value (e.g. var(--uikit-chart-2)) -- can't be a class. */}
          <span className="uikit-chart-legend__swatch" style={{ background: item.color }} />
          <span className="uikit-chart-legend__label">{item.label}</span>
          {item.value != null && <span className="uikit-chart-legend__value">{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}

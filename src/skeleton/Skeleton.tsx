import type { CSSProperties } from 'react';
import { cx } from '../utils/cx';
import './skeleton.scss';

export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: number | string;
  height?: number | string;
  /** Render n copies stacked vertically. */
  count?: number;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ variant = 'text', width, height, count = 1, className, style }: SkeletonProps) {
  const one = (key?: number) => (
    <span
      key={key}
      className={cx('uikit-skeleton', `uikit-skeleton--${variant}`, className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
  if (count === 1) return one();
  return <span className="uikit-skeleton__stack">{Array.from({ length: count }, (_, i) => one(i))}</span>;
}

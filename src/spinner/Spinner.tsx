import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import type { Size } from '../types';
import './spinner.scss';

export interface SpinnerProps {
  size?: Size | number;
  /** Text shown next to the spinner. */
  label?: ReactNode;
  /** Center in its container with some padding. */
  block?: boolean;
  className?: string;
}

export function Spinner({ size = 'md', label, block, className }: SpinnerProps) {
  const px = typeof size === 'number' ? size : size === 'sm' ? 14 : size === 'lg' ? 28 : 20;
  return (
    <span className={cx('uikit-spinner', { 'uikit-spinner--block': !!block }, className)} role="status">
      <span className="uikit-spinner__ring" style={{ width: px, height: px, borderWidth: Math.max(2, Math.round(px / 9)) }} />
      {label && <span className="uikit-spinner__label">{label}</span>}
    </span>
  );
}

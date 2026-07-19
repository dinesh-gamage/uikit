import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { computeFillPercent, defaultFormat, resolveTone, type ProgressMeterTone } from './progress-meter-utils';
import './progress-meter.scss';

export interface ProgressMeterProps {
  value: number;
  max: number;
  label?: ReactNode;
  showValue?: boolean;
  format?: (value: number, max: number) => string;
  tone?: ProgressMeterTone;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressMeter({
  value,
  max,
  label,
  showValue = true,
  format = defaultFormat,
  tone = 'auto',
  size = 'md',
  className,
}: ProgressMeterProps) {
  const resolvedTone = resolveTone(value, max, tone);
  const { percent, overflow } = computeFillPercent(value, max);

  return (
    <div className={cx('uikit-progress-meter', `uikit-progress-meter--${size}`, className)}>
      {(label != null || showValue) && (
        <div className="uikit-progress-meter__row">
          {label != null && <span className="uikit-progress-meter__label">{label}</span>}
          {showValue && <span className="uikit-progress-meter__value">{format(value, max)}</span>}
        </div>
      )}
      <div
        className="uikit-progress-meter__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cx(
            'uikit-progress-meter__fill',
            `uikit-progress-meter__fill--${resolvedTone}`,
            { 'uikit-progress-meter__fill--overflow': overflow }
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

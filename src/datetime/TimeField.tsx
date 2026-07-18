import { cx } from '../utils/cx';
import { formatTime, parseTime } from './date-utils';
import './time-field.scss';

export interface TimeFieldProps {
  /** 'HH:mm' (24h) or null when unset. */
  value: string | null;
  onChange: (value: string) => void;
  /** 12 shows an AM/PM toggle; hours input becomes 1-12. Default 24. */
  hourCycle?: 12 | 24;
  /** Minute stepper increment. Default 1. */
  minuteStep?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Compact hour/minute editor. Internal building block for the time pickers. */
export function TimeField({
  value,
  onChange,
  hourCycle = 24,
  minuteStep = 1,
  label,
  disabled,
  className,
}: TimeFieldProps) {
  const parsed = value ? parseTime(value) : null;
  const hours = parsed?.hours ?? 0;
  const minutes = parsed?.minutes ?? 0;
  const isPM = hours >= 12;
  const displayHour = hourCycle === 12 ? (hours % 12 === 0 ? 12 : hours % 12) : hours;

  const commitHour = (raw: string) => {
    if (raw === '') return;
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    let h: number;
    if (hourCycle === 12) {
      const h12 = clamp(Math.trunc(n), 1, 12);
      h = (h12 % 12) + (isPM ? 12 : 0);
    } else {
      h = clamp(Math.trunc(n), 0, 23);
    }
    onChange(formatTime(h, minutes));
  };

  const commitMinute = (raw: string) => {
    if (raw === '') return;
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange(formatTime(hours, clamp(Math.trunc(n), 0, 59)));
  };

  const setMeridiem = (pm: boolean) => {
    if (pm === isPM) return;
    onChange(formatTime((hours % 12) + (pm ? 12 : 0), minutes));
  };

  return (
    <div className={cx('uikit-timefield', { 'uikit-timefield--disabled': !!disabled }, className)}>
      {label != null && <span className="uikit-timefield__label">{label}</span>}
      <div className="uikit-timefield__inputs">
        <input
          type="number"
          className="uikit-timefield__input"
          aria-label={label ? `${label} hours` : 'Hours'}
          min={hourCycle === 12 ? 1 : 0}
          max={hourCycle === 12 ? 12 : 23}
          value={parsed ? displayHour : ''}
          placeholder="--"
          disabled={disabled}
          onChange={(e) => commitHour(e.target.value)}
        />
        <span className="uikit-timefield__sep" aria-hidden="true">:</span>
        <input
          type="number"
          className="uikit-timefield__input"
          aria-label={label ? `${label} minutes` : 'Minutes'}
          min={0}
          max={59}
          step={minuteStep}
          value={parsed ? minutes : ''}
          placeholder="--"
          disabled={disabled}
          onChange={(e) => commitMinute(e.target.value)}
        />
        {hourCycle === 12 && (
          <div className="uikit-timefield__meridiem" role="group" aria-label="AM or PM">
            <button
              type="button"
              className={cx('uikit-timefield__meridiem-btn', { 'uikit-timefield__meridiem-btn--active': !isPM })}
              aria-pressed={!isPM}
              disabled={disabled}
              onClick={() => setMeridiem(false)}
            >
              AM
            </button>
            <button
              type="button"
              className={cx('uikit-timefield__meridiem-btn', { 'uikit-timefield__meridiem-btn--active': isPM })}
              aria-pressed={isPM}
              disabled={disabled}
              onClick={() => setMeridiem(true)}
            >
              PM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

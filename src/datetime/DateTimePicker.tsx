import { useId, useRef, useState } from 'react';
import { cx } from '../utils/cx';
import type { FieldBaseProps } from '../types';
import { Field } from '../field/Field';
import { Dropdown } from '../dropdown';
import { Calendar } from './Calendar';
import { TimeField } from './TimeField';
import { formatDate, formatTime, parseTime, startOfDay } from './date-utils';
import { CalendarGlyph, CrossGlyph } from './glyphs';
import './datetime.scss';

export interface DateTimePickerProps extends FieldBaseProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  min?: Date;
  max?: Date;
  disabledDate?: (d: Date) => boolean;
  placeholder?: string;
  /** Trigger display format. Default 'yyyy-MM-dd HH:mm'. */
  format?: string;
  /** Show a clear button when a value is set. Default true. */
  clearable?: boolean;
  /** 12 shows an AM/PM toggle in the time editor. Default 24. */
  hourCycle?: 12 | 24;
}

export function DateTimePicker({
  value,
  onChange,
  min,
  max,
  disabledDate,
  placeholder = 'Select date & time',
  format = 'yyyy-MM-dd HH:mm',
  clearable = true,
  hourCycle = 24,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const inputId = id ?? autoId;

  const selectDay = (d: Date) => {
    onChange(new Date(d.getFullYear(), d.getMonth(), d.getDate(), value?.getHours() ?? 0, value?.getMinutes() ?? 0));
  };

  const changeTime = (t: string) => {
    const parsed = parseTime(t);
    if (!parsed) return;
    const base = value ?? startOfDay(new Date());
    onChange(new Date(base.getFullYear(), base.getMonth(), base.getDate(), parsed.hours, parsed.minutes));
  };

  return (
    <Field label={label} hint={hint} error={error} required={required} disabled={disabled} size={size} className={className} htmlFor={inputId}>
      <div
        ref={anchorRef}
        className={cx('uikit-datetime-trigger', `uikit-datetime-trigger--${size}`, {
          'uikit-datetime-trigger--open': open,
          'uikit-datetime-trigger--disabled': !!disabled,
          'uikit-datetime-trigger--error': !!error,
        })}
      >
        <span className="uikit-datetime-trigger__icon">
          <CalendarGlyph />
        </span>
        <input
          id={inputId}
          className="uikit-datetime-trigger__input"
          type="text"
          readOnly
          value={value ? formatDate(value, format) : ''}
          placeholder={placeholder}
          disabled={disabled}
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        {clearable && value != null && !disabled && (
          <button
            type="button"
            className="uikit-datetime-trigger__clear"
            aria-label="Clear date and time"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(null)}
          >
            <CrossGlyph />
          </button>
        )}
      </div>
      <Dropdown open={open && !disabled} anchorRef={anchorRef} onClose={() => setOpen(false)} maxHeight={420}>
        <div className="uikit-datetime-panel">
          <Calendar value={value} onSelect={selectDay} min={min} max={max} disabledDate={disabledDate} />
          <div className="uikit-datetime-panel__divider" />
          <div className="uikit-datetime-panel__time">
            <TimeField
              label="Time"
              value={value ? formatTime(value.getHours(), value.getMinutes()) : null}
              onChange={changeTime}
              hourCycle={hourCycle}
            />
          </div>
          <div className="uikit-datetime-panel__footer">
            <button type="button" className="uikit-datetime-panel__done" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      </Dropdown>
    </Field>
  );
}

import { useId, useRef, useState } from 'react';
import { cx } from '../utils/cx';
import type { FieldBaseProps } from '../types';
import { Field } from '../field/Field';
import { Popover } from '../popover/Popover';
import { Calendar } from './Calendar';
import { addDays, addMonths, endOfMonth, formatDate, isAfterDay, startOfDay, startOfMonth } from './date-utils';
import { CalendarGlyph, CrossGlyph } from './glyphs';
import './datetime.scss';

export interface DateRangePreset {
  label: string;
  range: () => [Date, Date];
}

export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: 'Today',
    range: () => {
      const t = startOfDay(new Date());
      return [t, t];
    },
  },
  {
    label: 'Last 7 days',
    range: () => {
      const t = startOfDay(new Date());
      return [addDays(t, -6), t];
    },
  },
  {
    label: 'Last 30 days',
    range: () => {
      const t = startOfDay(new Date());
      return [addDays(t, -29), t];
    },
  },
  {
    label: 'This month',
    range: () => {
      const t = startOfDay(new Date());
      return [startOfMonth(t), endOfMonth(t)];
    },
  },
  {
    label: 'Last month',
    range: () => {
      const prev = addMonths(startOfDay(new Date()), -1);
      return [startOfMonth(prev), endOfMonth(prev)];
    },
  },
];

export interface DateRangePickerProps extends FieldBaseProps {
  start: Date | null;
  end: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  min?: Date;
  max?: Date;
  disabledDate?: (d: Date) => boolean;
  /** Preset shortcuts shown in a left rail. Defaults to Today / Last 7 / Last 30 / This month / Last month. Pass [] to hide. */
  presets?: DateRangePreset[];
  /** Render the trigger as a rounded pill. */
  compactPill?: boolean;
  placeholder?: string;
  /** Display format. Default 'yyyy-MM-dd'. */
  format?: string;
  /** Show a clear button when a range is set. Default true. */
  clearable?: boolean;
}

export function DateRangePicker({
  start,
  end,
  onChange,
  min,
  max,
  disabledDate,
  presets = DEFAULT_DATE_RANGE_PRESETS,
  compactPill = false,
  placeholder = 'Select range',
  format = 'yyyy-MM-dd',
  clearable = true,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const inputId = id ?? autoId;

  const selectDay = (d: Date) => {
    if (!start || (start && end)) {
      // begin a new range
      onChange(d, null);
    } else {
      // complete the range, auto-swapping if picked backwards
      if (isAfterDay(start, d)) onChange(d, start);
      else onChange(start, d);
      setHoverDate(null);
      setOpen(false);
    }
  };

  const applyPreset = (preset: DateRangePreset) => {
    const [s, e] = preset.range();
    onChange(s, e);
    setHoverDate(null);
    setOpen(false);
  };

  const display =
    start || end
      ? `${start ? formatDate(start, format) : '…'} – ${end ? formatDate(end, format) : '…'}`
      : '';

  return (
    <Field label={label} hint={hint} error={error} required={required} disabled={disabled} size={size} className={className} htmlFor={inputId}>
      <div
        ref={anchorRef}
        className={cx('uikit-datetime-trigger', `uikit-datetime-trigger--${size}`, {
          'uikit-datetime-trigger--open': open,
          'uikit-datetime-trigger--disabled': !!disabled,
          'uikit-datetime-trigger--error': !!error,
          'uikit-datetime-trigger--pill': compactPill,
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
          value={display}
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
        {clearable && (start != null || end != null) && !disabled && (
          <button
            type="button"
            className="uikit-datetime-trigger__clear"
            aria-label="Clear range"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(null, null)}
          >
            <CrossGlyph />
          </button>
        )}
      </div>
      <Popover open={open && !disabled} anchorRef={anchorRef} onClose={() => setOpen(false)} maxHeight={400}>
        <div className="uikit-daterange-panel">
          {presets.length > 0 && (
            <div className="uikit-daterange-panel__presets" role="listbox" aria-label="Range presets">
              {presets.map((p) => (
                <button key={p.label} type="button" role="option" aria-selected={false} className="uikit-daterange-panel__preset" onClick={() => applyPreset(p)}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <Calendar
            rangeStart={start}
            rangeEnd={end}
            hoverDate={hoverDate}
            onHover={setHoverDate}
            onSelect={selectDay}
            min={min}
            max={max}
            disabledDate={disabledDate}
          />
        </div>
      </Popover>
    </Field>
  );
}

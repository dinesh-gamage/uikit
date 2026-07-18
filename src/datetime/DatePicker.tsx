import { useEffect, useId, useRef, useState } from 'react';
import { cx } from '../utils/cx';
import type { FieldBaseProps } from '../types';
import { Field } from '../field/Field';
import { Dropdown } from '../dropdown';
import { Calendar } from './Calendar';
import { formatDate, isAfterDay, isBeforeDay, parseDate } from './date-utils';
import { CalendarGlyph, CrossGlyph } from './glyphs';
import './datetime.scss';

export interface DatePickerProps extends FieldBaseProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  min?: Date;
  max?: Date;
  disabledDate?: (d: Date) => boolean;
  placeholder?: string;
  /** Display/parse format. Default 'yyyy-MM-dd'. */
  format?: string;
  /** Show a clear button when a value is set. Default true. */
  clearable?: boolean;
  /** Allow typing a date directly; validated on blur/Enter, invalid input reverts. Default true. */
  typedInput?: boolean;
  /** Close the dropdown after picking a day. Default true. */
  closeOnSelect?: boolean;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabledDate,
  placeholder = 'Select date',
  format = 'yyyy-MM-dd',
  clearable = true,
  typedInput = true,
  closeOnSelect = true,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => (value ? formatDate(value, format) : ''));
  const anchorRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const inputId = id ?? autoId;

  useEffect(() => {
    setText(value ? formatDate(value, format) : '');
  }, [value, format]);

  const isDayDisabled = (d: Date) =>
    (min != null && isBeforeDay(d, min)) || (max != null && isAfterDay(d, max)) || !!disabledDate?.(d);

  const commitText = () => {
    if (!typedInput) return;
    const t = text.trim();
    if (!t) {
      if (value) onChange(null);
      setText('');
      return;
    }
    const parsed = parseDate(t);
    if (parsed && !isDayDisabled(parsed)) {
      onChange(parsed);
      setText(formatDate(parsed, format));
    } else {
      setText(value ? formatDate(value, format) : '');
    }
  };

  const select = (d: Date) => {
    onChange(d);
    if (closeOnSelect) setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setText('');
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
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!typedInput}
          autoComplete="off"
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={open}
          onChange={(e) => typedInput && setText(e.target.value)}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitText();
              setOpen(false);
            } else if (e.key === 'ArrowDown' && !open) {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        {clearable && value != null && !disabled && (
          <button
            type="button"
            className="uikit-datetime-trigger__clear"
            aria-label="Clear date"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
          >
            <CrossGlyph />
          </button>
        )}
      </div>
      <Dropdown open={open && !disabled} anchorRef={anchorRef} onClose={() => setOpen(false)}>
        <Calendar value={value} onSelect={select} min={min} max={max} disabledDate={disabledDate} />
      </Dropdown>
    </Field>
  );
}

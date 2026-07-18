import { useId, useRef, useState } from 'react';
import { cx } from '../utils/cx';
import type { FieldBaseProps } from '../types';
import { Field } from '../field/Field';
import { Popover } from '../popover/Popover';
import { TimeField } from './TimeField';
import { CrossGlyph, ClockGlyph } from './glyphs';
import './datetime.scss';

export interface TimeRangePickerProps extends FieldBaseProps {
  /** 'HH:mm' or null. */
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
  /** Minute stepper increment. Default 15. */
  step?: number;
  /** 12 shows AM/PM toggles. Default 24. */
  hourCycle?: 12 | 24;
  placeholder?: string;
  /** Show a clear button when a range is set. Default true. */
  clearable?: boolean;
}

export function TimeRangePicker({
  start,
  end,
  onChange,
  step = 15,
  hourCycle = 24,
  placeholder = 'Select time range',
  clearable = true,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: TimeRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<string | null>(start);
  const [draftEnd, setDraftEnd] = useState<string | null>(end);
  const anchorRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const inputId = id ?? autoId;

  const openPanel = () => {
    if (open) return;
    setDraftStart(start);
    setDraftEnd(end);
    setOpen(true);
  };

  const done = () => {
    let s = draftStart;
    let e = draftEnd;
    // 'HH:mm' strings compare correctly lexicographically
    if (s && e && s > e) [s, e] = [e, s];
    onChange(s, e);
    setOpen(false);
  };

  const display = start || end ? `${start ?? '--:--'} – ${end ?? '--:--'}` : '';

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
          <ClockGlyph />
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
          onFocus={openPanel}
          onClick={openPanel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
              e.preventDefault();
              openPanel();
            }
          }}
        />
        {clearable && (start != null || end != null) && !disabled && (
          <button
            type="button"
            className="uikit-datetime-trigger__clear"
            aria-label="Clear time range"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(null, null)}
          >
            <CrossGlyph />
          </button>
        )}
      </div>
      <Popover open={open && !disabled} anchorRef={anchorRef} onClose={() => setOpen(false)}>
        <div className="uikit-datetime-panel">
          <div className="uikit-datetime-panel__time">
            <TimeField label="From" value={draftStart} onChange={setDraftStart} hourCycle={hourCycle} minuteStep={step} />
            <TimeField label="To" value={draftEnd} onChange={setDraftEnd} hourCycle={hourCycle} minuteStep={step} />
          </div>
          <div className="uikit-datetime-panel__footer">
            <button type="button" className="uikit-datetime-panel__done" onClick={done}>
              Done
            </button>
          </div>
        </div>
      </Popover>
    </Field>
  );
}

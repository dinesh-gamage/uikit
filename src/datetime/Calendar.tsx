import { useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '../utils/cx';
import {
  addDays,
  addMonths,
  clampDate,
  formatDate,
  getMonthGrid,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  startOfMonth,
} from './date-utils';
import { ChevronGlyph } from './glyphs';
import './calendar.scss';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface CalendarProps {
  /** Selected day (single-select mode). */
  value?: Date | null;
  onSelect?: (date: Date) => void;
  min?: Date;
  max?: Date;
  disabledDate?: (d: Date) => boolean;
  /** Range mode: endpoints + hovered day so the in-between days can be highlighted. */
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  hoverDate?: Date | null;
  onHover?: (d: Date | null) => void;
  /** Month shown first when there is no value/rangeStart. */
  initialMonth?: Date;
  className?: string;
}

/**
 * Month-grid calendar with keyboard navigation (arrows move day, PageUp/Down change
 * month, Enter/Space select). Internal building block for the date pickers.
 */
export function Calendar({
  value,
  onSelect,
  min,
  max,
  disabledDate,
  rangeStart,
  rangeEnd,
  hoverDate,
  onHover,
  initialMonth,
  className,
}: CalendarProps) {
  const anchor = value ?? rangeStart ?? initialMonth ?? clampDate(new Date(), min, max);
  const [cursor, setCursor] = useState(() => startOfMonth(anchor));
  const [focused, setFocused] = useState(() => anchor);
  const gridRef = useRef<HTMLDivElement>(null);
  const focusPending = useRef(false);

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const today = new Date();

  const isDisabled = (d: Date) =>
    (min != null && isBeforeDay(d, min)) || (max != null && isAfterDay(d, max)) || !!disabledDate?.(d);

  // Move DOM focus after arrow-key navigation (incl. across month boundaries).
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
  });

  const moveFocus = (d: Date) => {
    setFocused(d);
    if (d.getMonth() !== cursor.getMonth() || d.getFullYear() !== cursor.getFullYear()) {
      setCursor(startOfMonth(d));
    }
    focusPending.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let next: Date | null = null;
    switch (e.key) {
      case 'ArrowLeft': next = addDays(focused, -1); break;
      case 'ArrowRight': next = addDays(focused, 1); break;
      case 'ArrowUp': next = addDays(focused, -7); break;
      case 'ArrowDown': next = addDays(focused, 7); break;
      case 'PageUp': next = addMonths(focused, -1); break;
      case 'PageDown': next = addMonths(focused, 1); break;
      case 'Home': next = addDays(focused, -focused.getDay()); break;
      case 'End': next = addDays(focused, 6 - focused.getDay()); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isDisabled(focused)) onSelect?.(focused);
        return;
      default:
        return;
    }
    e.preventDefault();
    moveFocus(next);
  };

  // Normalized range (hover acts as a provisional end while only the start is picked).
  let rs = rangeStart ?? null;
  let re = rangeEnd ?? (rangeStart ? hoverDate ?? null : null);
  if (rs && re && isAfterDay(rs, re)) [rs, re] = [re, rs];

  const monthLabel = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;

  return (
    <div className={cx('uikit-calendar', className)}>
      <div className="uikit-calendar__header">
        <button
          type="button"
          className="uikit-calendar__nav"
          aria-label="Previous month"
          onClick={() => setCursor(addMonths(cursor, -1))}
        >
          <ChevronGlyph direction="left" />
        </button>
        <div className="uikit-calendar__label" aria-live="polite">{monthLabel}</div>
        <button
          type="button"
          className="uikit-calendar__nav"
          aria-label="Next month"
          onClick={() => setCursor(addMonths(cursor, 1))}
        >
          <ChevronGlyph direction="right" />
        </button>
      </div>
      <div className="uikit-calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div
        ref={gridRef}
        className="uikit-calendar__grid"
        role="grid"
        aria-label={monthLabel}
        onKeyDown={handleKeyDown}
        onMouseLeave={onHover ? () => onHover(null) : undefined}
      >
        {grid.map((week, wi) => (
          <div role="row" className="uikit-calendar__row" key={wi}>
            {week.map((d) => {
              const disabled = isDisabled(d);
              const outside = d.getMonth() !== cursor.getMonth();
              const isStart = !!rs && isSameDay(d, rs);
              const isEnd = !!re && isSameDay(d, re);
              const selected = (!!value && isSameDay(d, value)) || isStart || isEnd;
              const inRange = !!rs && !!re && !isBeforeDay(d, rs) && !isAfterDay(d, re);
              const isFocused = isSameDay(d, focused);
              return (
                <button
                  key={formatDate(d)}
                  type="button"
                  role="gridcell"
                  className={cx('uikit-calendar__day', {
                    'uikit-calendar__day--outside': outside,
                    'uikit-calendar__day--today': isSameDay(d, today),
                    'uikit-calendar__day--in-range': inRange && !selected,
                    'uikit-calendar__day--range-start': isStart,
                    'uikit-calendar__day--range-end': isEnd,
                    'uikit-calendar__day--selected': selected,
                  })}
                  aria-selected={selected}
                  aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`}
                  aria-disabled={disabled || undefined}
                  disabled={disabled}
                  tabIndex={isFocused ? 0 : -1}
                  data-focused={isFocused || undefined}
                  onClick={() => {
                    setFocused(d);
                    onSelect?.(d);
                  }}
                  onMouseEnter={onHover && !disabled ? () => onHover(d) : undefined}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

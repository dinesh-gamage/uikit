import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { cx } from '../utils/cx';
import {
  cssVars,
  formatEventTime,
  type CalendarView,
  type NormalizedEvent,
  type TimeFormat,
} from './event-calendar-utils';

export interface EventChipProps<T> {
  event: NormalizedEvent<T>;
  view: CalendarView;
  /** `bar` = month cell / all-day strip, `block` = positioned time-grid block. */
  variant?: 'bar' | 'block';
  /** Single-line presentation — set by the time grid for blocks too short to fit two lines. */
  compact?: boolean;
  timeFormat?: TimeFormat;
  locale?: string;
  /** Show the start time before the title. Off for all-day chips. */
  showTime?: boolean;
  /** Renders the top/bottom resize handles. */
  resizable?: boolean;
  /** The chip is the source of an in-flight drag (dimmed in place). */
  dragging?: boolean;
  /** The chip is the drag preview following the pointer. */
  ghost?: boolean;
  /** Clipped by the row/column it is drawn in — squares off the corresponding corners. */
  continuesBefore?: boolean;
  continuesAfter?: boolean;
  onSelect?: (event: T, anchor: HTMLElement) => void;
  onPointerDown?: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  renderEvent?: (event: T, ctx: { view: CalendarView; compact: boolean }) => ReactNode;
  /** Geometry custom properties supplied by the parent view. */
  vars?: Record<string, string | number | undefined>;
  className?: string;
}

export function EventChip<T>({
  event,
  view,
  variant = 'bar',
  compact = false,
  timeFormat = '24h',
  locale,
  showTime = !event.allDay,
  resizable = false,
  dragging = false,
  ghost = false,
  continuesBefore = false,
  continuesAfter = false,
  onSelect,
  onPointerDown,
  renderEvent,
  vars,
  className,
}: EventChipProps<T>) {
  const startLabel = formatEventTime(event.start, timeFormat, locale);
  const endLabel = formatEventTime(event.end, timeFormat, locale);
  const ariaLabel = event.allDay ? `${event.title}, all day` : `${event.title}, ${startLabel}–${endLabel}`;

  const body = renderEvent ? (
    renderEvent(event.source, { view, compact })
  ) : (
    <>
      <span className="uikit-event-calendar__chip-dot" aria-hidden="true" />
      {showTime && <span className="uikit-event-calendar__chip-time">{startLabel}</span>}
      <span className="uikit-event-calendar__chip-title">{event.title}</span>
    </>
  );

  return (
    <button
      type="button"
      data-ec-event-id={event.id}
      className={cx(
        'uikit-event-calendar__chip',
        `uikit-event-calendar__chip--${variant}`,
        {
          'uikit-event-calendar__chip--compact': compact,
          'uikit-event-calendar__chip--all-day': event.allDay,
          'uikit-event-calendar__chip--dragging': dragging,
          'uikit-event-calendar__chip--ghost': ghost,
          'uikit-event-calendar__chip--continues-before': continuesBefore,
          'uikit-event-calendar__chip--continues-after': continuesAfter,
          'uikit-event-calendar__chip--readonly': !event.editable,
        },
        className,
      )}
      style={cssVars({ '--uikit-ec-color': event.color, ...vars })}
      aria-label={ariaLabel}
      aria-hidden={ghost || undefined}
      tabIndex={ghost ? -1 : undefined}
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(event.source, e.currentTarget);
      }}
    >
      {resizable && (
        <span
          className="uikit-event-calendar__chip-handle uikit-event-calendar__chip-handle--start"
          data-ec-resize="start"
          aria-hidden="true"
        />
      )}
      <span className="uikit-event-calendar__chip-body">{body}</span>
      {resizable && (
        <span
          className="uikit-event-calendar__chip-handle uikit-event-calendar__chip-handle--end"
          data-ec-resize="end"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { isSameDay } from '../datetime/date-utils';
import {
  cssVars,
  formatEventTime,
  formatFullDay,
  groupByDay,
  type DateRange,
  type NormalizedEvent,
  type TimeFormat,
} from './event-calendar-utils';

export interface AgendaRowProps<T> {
  event: NormalizedEvent<T>;
  timeFormat: TimeFormat;
  locale?: string;
  onEventClick?: (event: T, anchor: HTMLElement) => void;
  renderAgendaItem?: (event: T) => ReactNode;
}

/** One event line. Shared by the agenda view and the month view's mobile day list. */
export function AgendaRow<T>({ event, timeFormat, locale, onEventClick, renderAgendaItem }: AgendaRowProps<T>) {
  const start = formatEventTime(event.start, timeFormat, locale);
  const end = formatEventTime(event.end, timeFormat, locale);
  const timeLabel = event.allDay ? 'All day' : `${start}–${end}`;

  return (
    <button
      type="button"
      data-ec-event-id={event.id}
      className="uikit-event-calendar__agenda-row"
      style={cssVars({ '--uikit-ec-color': event.color })}
      aria-label={`${event.title}, ${timeLabel}`}
      onClick={(e) => onEventClick?.(event.source, e.currentTarget)}
    >
      {renderAgendaItem ? (
        renderAgendaItem(event.source)
      ) : (
        <>
          <span className="uikit-event-calendar__agenda-time">{timeLabel}</span>
          <span className="uikit-event-calendar__agenda-dot" aria-hidden="true" />
          <span className="uikit-event-calendar__agenda-title">{event.title}</span>
        </>
      )}
    </button>
  );
}

export interface AgendaViewProps<T> {
  events: NormalizedEvent<T>[];
  range: DateRange;
  timeFormat: TimeFormat;
  locale?: string;
  onEventClick?: (event: T, anchor: HTMLElement) => void;
  renderAgendaItem?: (event: T) => ReactNode;
  emptyMessage?: ReactNode;
  className?: string;
}

export function AgendaView<T>({
  events,
  range,
  timeFormat,
  locale,
  onEventClick,
  renderAgendaItem,
  emptyMessage = 'No events',
  className,
}: AgendaViewProps<T>) {
  const groups = groupByDay(events, range);
  const today = new Date();

  if (!groups.length) {
    return <div className={cx('uikit-event-calendar__agenda', className)}><div className="uikit-event-calendar__empty">{emptyMessage}</div></div>;
  }

  return (
    <div className={cx('uikit-event-calendar__agenda', className)}>
      {groups.map((group) => (
        <section className="uikit-event-calendar__agenda-group" key={group.day.getTime()}>
          <h3
            className={cx('uikit-event-calendar__agenda-heading', {
              'uikit-event-calendar__agenda-heading--today': isSameDay(group.day, today),
            })}
          >
            {formatFullDay(group.day, locale)}
          </h3>
          <div className="uikit-event-calendar__agenda-rows">
            {group.events.map((event) => (
              <AgendaRow
                key={event.id}
                event={event}
                timeFormat={timeFormat}
                locale={locale}
                onEventClick={onEventClick}
                renderAgendaItem={renderAgendaItem}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

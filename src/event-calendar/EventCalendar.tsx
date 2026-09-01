import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Spinner } from '../spinner';
import { useBreakpoint } from '../utils/use-breakpoint';
import { addDays, addMonths, addWeeks, startOfDay } from '../datetime/date-utils';
import { AgendaView } from './AgendaView';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import {
  cssVars,
  formatRangeLabel,
  getVisibleRange,
  normalizeEvents,
  type CalendarView,
  type DateRange,
  type EventMoveArgs,
  type EventResizeArgs,
  type NormalizedEvent,
  type SlotArgs,
  type TimeFormat,
  type WeekStartsOn,
} from './event-calendar-utils';
import './event-calendar.scss';

export type {
  CalendarView,
  DateRange,
  EventMoveArgs,
  EventResizeArgs,
  SlotArgs,
  TimeFormat,
  WeekStartsOn,
};

/** How long a drop stays pinned to its dropped position while the parent persists the change. */
const OPTIMISTIC_MS = 2000;

export interface EventCalendarProps<T> {
  events: T[];
  eventId: (e: T) => string;
  eventStart: (e: T) => Date;
  /** Exclusive end. */
  eventEnd: (e: T) => Date;
  eventTitle: (e: T) => string;
  eventAllDay?: (e: T) => boolean;
  eventColor?: (e: T) => string | undefined;
  /** Return false to make an event read-only — no drag handles, no resize. Default true. */
  eventEditable?: (e: T) => boolean;

  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  /** Anchor date. Which part of it matters depends on the view (month / week / day / agenda start). */
  date: Date;
  onDateChange: (date: Date) => void;
  /** Fires on mount and whenever the visible window changes — use it to drive fetching. */
  onVisibleRangeChange?: (range: DateRange) => void;

  /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
  weekStartsOn?: WeekStartsOn;
  /** First hour shown in the week/day grid, 0–23. Default 0. */
  minTime?: number;
  /** Last hour shown in the week/day grid, 1–24. Default 24. */
  maxTime?: number;
  /** Grid slot size, and the default duration of an event created by a slot click. Default 30. */
  slotMinutes?: 15 | 30 | 60;
  /** Drag/resize granularity. Defaults to `slotMinutes`. */
  snapMinutes?: number;
  /** Pixels per hour in the week/day grid. Default 48. */
  hourHeight?: number;
  /** Days covered by the agenda view. Default 30. */
  agendaDays?: number;
  timeFormat?: TimeFormat;
  /** BCP 47 tag for the Intl formatters. Defaults to the browser locale. */
  locale?: string;
  /** Draw the current-time line in the week/day grid. Default true. */
  showNowIndicator?: boolean;

  onEventClick?: (event: T, anchor: HTMLElement) => void;
  onSlotClick?: (args: SlotArgs) => void;
  onRangeSelect?: (args: SlotArgs) => void;
  onEventMove?: (args: EventMoveArgs<T>) => void;
  onEventResize?: (args: EventResizeArgs<T>) => void;

  renderEvent?: (event: T, ctx: { view: CalendarView; compact: boolean }) => ReactNode;
  renderAgendaItem?: (event: T) => ReactNode;
  /** Shown by the agenda view and the mobile day list when there is nothing to show. */
  emptyMessage?: ReactNode;
  loading?: boolean;

  hideHeader?: boolean;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  /** Viewport width at or below which the compact layouts are used. Default 960. */
  mobileBreakpoint?: number;
  /** @internal showcase-only escape hatch for previewing the mobile layout on a desktop viewport. */
  forceMobile?: boolean;
  /** Default '100%' — the calendar fills its parent and scrolls internally. */
  height?: string;
  className?: string;
}

interface OptimisticDrop {
  id: string;
  start: Date;
  end: Date;
  allDay: boolean;
  at: number;
}

/**
 * Month / week / day / agenda calendar. Fully controlled: `view`, `date` and `events` come from
 * the parent, and every interaction is reported through a callback. Events are read through
 * accessor props, so any row shape works without mapping.
 */
export function EventCalendar<T>(props: EventCalendarProps<T>) {
  const {
    events,
    eventId,
    eventStart,
    eventEnd,
    eventTitle,
    eventAllDay,
    eventColor,
    eventEditable,
    view,
    onViewChange,
    date,
    onDateChange,
    onVisibleRangeChange,
    weekStartsOn = 1,
    agendaDays = 30,
    timeFormat = '24h',
    locale,
    onEventClick,
    onSlotClick,
    onRangeSelect,
    onEventMove,
    onEventResize,
    renderEvent,
    renderAgendaItem,
    emptyMessage,
    loading,
    hideHeader,
    headerLeft,
    headerRight,
    mobileBreakpoint = 960,
    forceMobile,
    height = '100%',
    className,
  } = props;

  const isMobile = useBreakpoint(mobileBreakpoint) || !!forceMobile;
  const [optimistic, setOptimistic] = useState<OptimisticDrop | null>(null);

  const range = useMemo(
    () => getVisibleRange(view, date, { weekStartsOn, agendaDays }),
    [view, date, weekStartsOn, agendaDays],
  );

  const onRangeChangeRef = useRef(onVisibleRangeChange);
  onRangeChangeRef.current = onVisibleRangeChange;
  useEffect(() => {
    onRangeChangeRef.current?.(range);
  }, [range]);

  const normalized = useMemo(
    () =>
      normalizeEvents(events, { eventId, eventStart, eventEnd, eventTitle, eventAllDay, eventColor, eventEditable }),
    // Accessors are typically inline arrows; re-deriving on every `events` identity change is
    // what matters, so they are deliberately not part of the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events],
  );

  // Keep a dropped event pinned to where it landed until the parent's data catches up (or the
  // grace period lapses), so a slow save never shows a snap-back flash.
  const visibleEvents = useMemo<NormalizedEvent<T>[]>(() => {
    if (!optimistic) return normalized;
    return normalized.map((e) =>
      e.id === optimistic.id ? { ...e, start: optimistic.start, end: optimistic.end, allDay: optimistic.allDay } : e,
    );
  }, [normalized, optimistic]);

  useEffect(() => {
    if (!optimistic) return;
    const settled = normalized.find((e) => e.id === optimistic.id);
    if (
      !settled ||
      (settled.start.getTime() === optimistic.start.getTime() && settled.end.getTime() === optimistic.end.getTime())
    ) {
      setOptimistic(null);
      return;
    }
    const timer = setTimeout(() => setOptimistic(null), Math.max(0, OPTIMISTIC_MS - (Date.now() - optimistic.at)));
    return () => clearTimeout(timer);
  }, [normalized, optimistic]);

  const commitMove = (args: EventMoveArgs<T>) => {
    setOptimistic({ id: eventId(args.event), start: args.start, end: args.end, allDay: args.allDay, at: Date.now() });
    onEventMove?.(args);
  };

  const commitResize = (args: EventResizeArgs<T>) => {
    const current = normalized.find((e) => e.id === eventId(args.event));
    setOptimistic({
      id: eventId(args.event),
      start: args.start,
      end: args.end,
      allDay: current?.allDay ?? false,
      at: Date.now(),
    });
    onEventResize?.(args);
  };

  const step = (direction: 1 | -1) => {
    switch (view) {
      case 'month': return onDateChange(addMonths(date, direction));
      case 'week': return onDateChange(addWeeks(date, direction));
      case 'day': return onDateChange(addDays(date, direction));
      default: return onDateChange(addDays(date, direction * agendaDays));
    }
  };

  const shared = {
    events: visibleEvents,
    range,
    date,
    weekStartsOn,
    locale,
    timeFormat,
    mobile: isMobile,
    onDateChange,
    onEventClick,
    onSlotClick,
    onRangeSelect,
    onEventMove: onEventMove ? commitMove : undefined,
    onEventResize: onEventResize ? commitResize : undefined,
    renderEvent,
    renderAgendaItem,
    emptyMessage,
  };

  return (
    <div
      className={cx('uikit-event-calendar', { 'uikit-event-calendar--mobile': isMobile }, className)}
      style={cssVars({ '--uikit-ec-height': height })}
    >
      {!hideHeader && (
        <CalendarHeader
          view={view}
          onViewChange={onViewChange}
          label={formatRangeLabel(view, range, date, locale)}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onToday={() => onDateChange(startOfDay(new Date()))}
          mobile={isMobile}
          headerLeft={headerLeft}
          headerRight={headerRight}
        />
      )}

      <div className={cx('uikit-event-calendar__body', { 'uikit-event-calendar__body--loading': !!loading })}>
        {view === 'month' ? (
          <MonthView {...shared} />
        ) : (
          <AgendaView
            events={visibleEvents}
            range={range}
            timeFormat={timeFormat}
            locale={locale}
            onEventClick={onEventClick}
            renderAgendaItem={renderAgendaItem}
            emptyMessage={emptyMessage}
          />
        )}
      </div>

      {loading && (
        <div className="uikit-event-calendar__loading" aria-hidden="true">
          <Spinner />
        </div>
      )}
    </div>
  );
}

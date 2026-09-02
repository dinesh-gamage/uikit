import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { cx } from '../utils/cx';
import { useToday } from './use-today';
import { Dropdown } from '../dropdown';
import {
  addDays,
  addMonths,
  getMonthGrid,
  isSameDay,
  isSameMonth,
  startOfDay,
} from '../datetime/date-utils';
import { AgendaRow } from './AgendaView';
import { EventChip } from './EventChip';
import { useDayDrag } from './use-day-drag';
import {
  buildMonthRows,
  cssVars,
  eventsForDay,
  formatFullDay,
  formatWeekdayName,
  type ViewSharedProps,
} from './event-calendar-utils';

/** Height reserved for the day-number strip, in px — mirrors `$month-date-strip` in the SCSS. */
const DATE_STRIP = 24;
/** Height of one bar lane including its gap, in px — mirrors `$month-bar-h`. */
const BAR_LANE = 20;
const DEFAULT_LANE_CAP = 3;
/** Colour dots shown per day in the compact mobile grid. */
const MOBILE_DOTS = 3;

export type MonthViewProps<T> = ViewSharedProps<T>;

export function MonthView<T>(props: MonthViewProps<T>) {
  const {
    events,
    date,
    weekStartsOn,
    locale,
    timeFormat,
    mobile,
    onDateChange,
    onEventClick,
    onSlotClick,
    onRangeSelect,
    onEventMove,
    renderEvent,
    renderAgendaItem,
    emptyMessage = 'No events',
  } = props;

  const gridRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const moreAnchorRef = useRef<HTMLButtonElement | null>(null);
  const focusPending = useRef(false);

  const [focused, setFocused] = useState(date);
  const [laneCap, setLaneCap] = useState(DEFAULT_LANE_CAP);
  const [moreDay, setMoreDay] = useState<Date | null>(null);

  const dayDrag = useDayDrag<T>({ onEventMove, onRangeSelect });

  useEffect(() => setFocused(date), [date]);

  const weeks = useMemo(
    () => getMonthGrid(date.getFullYear(), date.getMonth(), weekStartsOn),
    [date, weekStartsOn],
  );
  const laidOut = useMemo(
    () =>
      dayDrag.state.kind === 'moving'
        ? events.map((e) => {
            const preview = dayDrag.previewFor(e);
            return preview ? { ...e, start: preview.start, end: preview.end } : e;
          })
        : events,
    // `previewFor` closes over `dayDrag.state`, which is the real dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, dayDrag.state],
  );
  const rows = useMemo(() => buildMonthRows(weeks, laidOut), [weeks, laidOut]);
  const today = useToday();

  // How many bar lanes fit in a cell before the '+N more' affordance takes over.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || mobile) return;
    const measure = (height: number) => {
      const rowHeight = height / weeks.length;
      setLaneCap(Math.max(1, Math.floor((rowHeight - DATE_STRIP) / BAR_LANE)));
    };
    measure(el.getBoundingClientRect().height);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) measure(height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobile, weeks.length]);

  // Move DOM focus after arrow-key navigation, including across a month change.
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    gridRef.current?.querySelector<HTMLElement>('[data-focused="true"]')?.focus();
  });

  const moveFocus = (next: Date) => {
    setFocused(next);
    focusPending.current = true;
    if (!isSameMonth(next, date)) onDateChange(next);
  };

  const clickSlot = (day: Date) => {
    const start = startOfDay(day);
    onSlotClick?.({ start, end: addDays(start, 1), allDay: true });
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    let next: Date | null = null;
    switch (e.key) {
      case 'ArrowLeft': next = addDays(focused, -1); break;
      case 'ArrowRight': next = addDays(focused, 1); break;
      case 'ArrowUp': next = addDays(focused, -7); break;
      case 'ArrowDown': next = addDays(focused, 7); break;
      case 'PageUp': next = addMonths(focused, -1); break;
      case 'PageDown': next = addMonths(focused, 1); break;
      case 'Home': next = addDays(focused, -((focused.getDay() - weekStartsOn + 7) % 7)); break;
      case 'End': next = addDays(focused, 6 - ((focused.getDay() - weekStartsOn + 7) % 7)); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        clickSlot(focused);
        return;
      default:
        return;
    }
    e.preventDefault();
    moveFocus(next);
  };

  const weekdayNames = weeks[0].map((d) => formatWeekdayName(d, locale, mobile ? 'narrow' : 'short'));
  const gridLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
  const moreEvents = moreDay ? eventsForDay(laidOut, moreDay) : [];

  if (mobile) {
    const selectedEvents = eventsForDay(laidOut, date);
    return (
      <div className={cx('uikit-event-calendar__month', 'uikit-event-calendar__month--compact')}>
        <div className="uikit-event-calendar__month-weekdays" aria-hidden="true">
          {weekdayNames.map((name, i) => (
            <span key={i}>{name}</span>
          ))}
        </div>
        <div className="uikit-event-calendar__month-body" role="grid" aria-label={gridLabel}>
          {weeks.map((week, wi) => (
            <div className="uikit-event-calendar__month-row" role="row" key={wi}>
              {week.map((day) => {
                const dayEvents = eventsForDay(laidOut, day);
                return (
                  <button
                    key={day.getTime()}
                    type="button"
                    role="gridcell"
                    data-ec-day={day.getTime()}
                    aria-label={formatFullDay(day, locale)}
                    aria-selected={isSameDay(day, date)}
                    aria-current={today != null && isSameDay(day, today) ? 'date' : undefined}
                    className={cx('uikit-event-calendar__month-cell', {
                      'uikit-event-calendar__month-cell--outside': !isSameMonth(day, date),
                      'uikit-event-calendar__month-cell--today': today != null && isSameDay(day, today),
                      'uikit-event-calendar__month-cell--selected': isSameDay(day, date),
                    })}
                    onClick={() => onDateChange(day)}
                  >
                    <span className="uikit-event-calendar__month-date">{day.getDate()}</span>
                    <span className="uikit-event-calendar__month-dots" aria-hidden="true">
                      {dayEvents.slice(0, MOBILE_DOTS).map((event) => (
                        <span
                          key={event.id}
                          className="uikit-event-calendar__month-dot"
                          style={cssVars({ '--uikit-ec-color': event.color })}
                        />
                      ))}
                      {dayEvents.length > MOBILE_DOTS && (
                        <span className="uikit-event-calendar__month-dot-more">+{dayEvents.length - MOBILE_DOTS}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="uikit-event-calendar__month-list">
          <h3 className="uikit-event-calendar__month-list-heading">{formatFullDay(date, locale)}</h3>
          {selectedEvents.length ? (
            <div className="uikit-event-calendar__agenda-rows">
              {selectedEvents.map((event) => (
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
          ) : (
            <button type="button" className="uikit-event-calendar__month-list-empty" onClick={() => clickSlot(date)}>
              {emptyMessage}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="uikit-event-calendar__month">
      <div className="uikit-event-calendar__month-weekdays" aria-hidden="true">
        {weekdayNames.map((name, i) => (
          <span key={i}>{name}</span>
        ))}
      </div>
      <div
        className="uikit-event-calendar__month-body"
        ref={(el) => {
          bodyRef.current = el;
          gridRef.current = el;
        }}
        role="grid"
        aria-label={gridLabel}
        onKeyDown={handleKeyDown}
      >
        {rows.map((row, wi) => {
          // When the row needs more lanes than fit, the last visible lane is given up to the
          // '+N more' button so it never spills into the week below.
          const visibleLanes = row.laneCount > laneCap ? Math.max(0, laneCap - 1) : laneCap;
          const hiddenPerColumn = row.days.map(
            (_, col) =>
              row.bars.filter(
                (bar) => bar.lane >= visibleLanes && col >= bar.columnStart && col < bar.columnStart + bar.span,
              ).length,
          );
          return (
            <div className="uikit-event-calendar__month-row" role="row" key={wi}>
              {row.days.map((day, col) => {
                const isFocused = isSameDay(day, focused);
                const cellBars = row.bars.filter((bar) => bar.columnStart === col && bar.lane < visibleLanes);
                const hidden = hiddenPerColumn[col];
                return (
                  <div
                    key={day.getTime()}
                    role="gridcell"
                    data-ec-day={day.getTime()}
                    tabIndex={isFocused ? 0 : -1}
                    data-focused={isFocused || undefined}
                    aria-label={formatFullDay(day, locale)}
                    aria-current={today != null && isSameDay(day, today) ? 'date' : undefined}
                    className={cx('uikit-event-calendar__month-cell', {
                      'uikit-event-calendar__month-cell--outside': !isSameMonth(day, date),
                      'uikit-event-calendar__month-cell--today': today != null && isSameDay(day, today),
                      'uikit-event-calendar__month-cell--selecting': dayDrag.isSelected(day),
                    })}
                    onPointerDown={(e) => dayDrag.startSelect(e, day)}
                    onClick={() => {
                      if (!dayDrag.takeClick()) return;
                      clickSlot(day);
                    }}
                  >
                    <span className="uikit-event-calendar__month-date">{day.getDate()}</span>
                    {cellBars.map((bar) => (
                      <EventChip
                        key={bar.event.id}
                        event={bar.event}
                        view="month"
                        variant="bar"
                        compact
                        timeFormat={timeFormat}
                        locale={locale}
                        continuesBefore={bar.continuesBefore}
                        continuesAfter={bar.continuesAfter}
                        dragging={dayDrag.state.kind === 'moving' && dayDrag.state.eventId === bar.event.id}
                        onSelect={(source, anchor) => {
                          if (!dayDrag.takeClick()) return;
                          onEventClick?.(source, anchor);
                        }}
                        onPointerDown={(e) => dayDrag.startMove(e, bar.event)}
                        renderEvent={renderEvent}
                        vars={{
                          '--uikit-ec-col': bar.columnStart,
                          '--uikit-ec-span': bar.span,
                          '--uikit-ec-lane': bar.lane,
                        }}
                      />
                    ))}
                    {hidden > 0 && (
                      <button
                        type="button"
                        className="uikit-event-calendar__month-more"
                        style={cssVars({ '--uikit-ec-col': col, '--uikit-ec-lane': visibleLanes })}
                        aria-label={`${hidden} more events on ${formatFullDay(day, locale)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          moreAnchorRef.current = e.currentTarget;
                          setMoreDay(day);
                        }}
                      >
                        +{hidden} more
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {moreDay && (
        <Dropdown open onClose={() => setMoreDay(null)} anchorRef={moreAnchorRef} position="bottom-start" minWidth={220}>
          <div className="uikit-event-calendar__more-panel">
            <div className="uikit-event-calendar__more-heading">{formatFullDay(moreDay, locale)}</div>
            {moreEvents.map((event) => (
              <AgendaRow
                key={event.id}
                event={event}
                timeFormat={timeFormat}
                locale={locale}
                onEventClick={(source, anchor) => {
                  setMoreDay(null);
                  onEventClick?.(source, anchor);
                }}
                renderAgendaItem={renderAgendaItem}
              />
            ))}
          </div>
        </Dropdown>
      )}
    </div>
  );
}

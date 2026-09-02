import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { cx } from '../utils/cx';
import { useCoarsePointer } from '../utils/use-coarse-pointer';
import {
  addDays,
  isSameDay,
  minutesOfDay,
  setMinutesOfDay,
  startOfDay,
} from '../datetime/date-utils';
import { EventChip } from './EventChip';
import { useDayDrag } from './use-day-drag';
import {
  DRAG_THRESHOLD,
  IDLE,
  LONG_PRESS_MS,
  computeMove,
  computeResize,
  dragReducer,
  isActiveDrag,
  resolveGridHit,
  type ColumnRect,
  type DragState,
  type ResizeEdge,
} from './drag-utils';
import {
  buildMonthRows,
  clampToVisibleWindow,
  cssVars,
  formatDayHeader,
  formatFullDay,
  formatTimeLabel,
  packTimedLanes,
  timeToOffset,
  type NormalizedEvent,
  type ViewSharedProps,
} from './event-calendar-utils';

/** Shortest block that still shows its label, in px. */
const MIN_BLOCK_H = 15;
/** Blocks shorter than this collapse to the single-line layout. */
const COMPACT_BLOCK_H = 34;
/** Where the grid scrolls to on mount when the working day starts earlier than 07:00. */
const PREFERRED_SCROLL_HOUR = 7;
const NOW_TICK_MS = 60_000;

export interface TimeGridViewProps<T> extends ViewSharedProps<T> {
  view: 'week' | 'day';
  minTime: number;
  maxTime: number;
  slotMinutes: number;
  snapMinutes: number;
  hourHeight: number;
  showNowIndicator: boolean;
}

interface Block<T> {
  event: NormalizedEvent<T>;
  top: number;
  height: number;
  col: number;
  cols: number;
  compact: boolean;
}

export function TimeGridView<T>(props: TimeGridViewProps<T>) {
  const {
    events,
    range,
    view,
    locale,
    timeFormat,
    mobile,
    minTime,
    maxTime,
    slotMinutes,
    snapMinutes,
    hourHeight,
    showNowIndicator,
    onEventClick,
    onSlotClick,
    onRangeSelect,
    onEventMove,
    onEventResize,
    renderEvent,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef(new Map<number, HTMLDivElement>());
  const dragRef = useRef<DragState>(IDLE);
  const suppressClickRef = useRef(false);
  const coarse = useCoarsePointer();

  const [drag, setDrag] = useState<DragState>(IDLE);
  // Null until mounted — see use-today.ts for why SSR must not render the line.
  const [now, setNow] = useState<Date | null>(null);

  const dayDrag = useDayDrag<T>({ onEventMove, onRangeSelect });

  const days = useMemo(() => {
    const out: Date[] = [];
    for (let d = startOfDay(range.start); d.getTime() < range.end.getTime(); d = addDays(d, 1)) out.push(d);
    return out;
  }, [range]);

  const hours = useMemo(
    () => Array.from({ length: Math.max(1, maxTime - minTime) }, (_, i) => minTime + i),
    [minTime, maxTime],
  );
  const totalHeight = hours.length * hourHeight;

  useEffect(() => {
    if (!showNowIndicator) return;
    const refresh = () => setNow(new Date());
    refresh();
    const timer = setInterval(refresh, NOW_TICK_MS);
    // A suspended background tab misses interval ticks; snap to the real time
    // the moment the user comes back instead of waiting out the next tick.
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [showNowIndicator]);

  // Land on the working day rather than at midnight.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = timeToOffset(Math.max(minTime, PREFERRED_SCROLL_HOUR) * 60, minTime, hourHeight);
    // Only on mount / when the grid geometry itself changes.
  }, [minTime, hourHeight]);

  const setColRef = (day: Date) => (el: HTMLDivElement | null) => {
    if (el) colRefs.current.set(day.getTime(), el);
    else colRefs.current.delete(day.getTime());
  };

  const columnRects = (): ColumnRect[] =>
    days
      .map((day) => {
        const el = colRefs.current.get(day.getTime());
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { date: day, left: rect.left, right: rect.right, top: rect.top };
      })
      .filter((r): r is ColumnRect => r !== null);

  // --------------------------------------------------------------- drag preview

  const preview = useMemo(() => {
    if (!isActiveDrag(drag) || !drag.current || !drag.eventId) return null;
    const event = events.find((e) => e.id === drag.eventId);
    if (!event) return null;
    if (drag.kind === 'moving') {
      return { id: event.id, ...computeMove(event, drag.current, drag.grabOffsetMinutes, snapMinutes) };
    }
    if (drag.kind === 'resizing' && drag.edge) {
      const target = setMinutesOfDay(drag.current.date, drag.current.minutes);
      return { id: event.id, ...computeResize(event, drag.edge, target, snapMinutes, snapMinutes) };
    }
    return null;
  }, [drag, events, snapMinutes]);

  const laidOut = useMemo(() => {
    if (!preview && dayDrag.state.kind !== 'moving') return events;
    return events.map((e) => {
      if (preview && e.id === preview.id) return { ...e, start: preview.start, end: preview.end };
      const dayPreview = dayDrag.previewFor(e);
      return dayPreview ? { ...e, start: dayPreview.start, end: dayPreview.end } : e;
    });
    // `dayDrag.previewFor` is a fresh closure each render; the state it reads is the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, preview, dayDrag.state]);

  // --------------------------------------------------------------- layout

  const { allDayEvents, timedEvents } = useMemo(() => {
    const allDayList: NormalizedEvent<T>[] = [];
    const timedList: NormalizedEvent<T>[] = [];
    for (const event of laidOut) {
      const lastInstant = new Date(Math.max(event.end.getTime() - 1, event.start.getTime()));
      if (event.allDay || !isSameDay(event.start, lastInstant)) allDayList.push(event);
      else timedList.push(event);
    }
    return { allDayEvents: allDayList, timedEvents: timedList };
  }, [laidOut]);

  const allDayRow = useMemo(() => buildMonthRows([days], allDayEvents)[0], [days, allDayEvents]);

  const columns = useMemo(
    () =>
      days.map((day) => {
        const dayEnd = addDays(day, 1);
        const clipped: NormalizedEvent<T>[] = [];
        const geometry = new Map<string, { top: number; height: number }>();

        for (const event of timedEvents) {
          if (event.start.getTime() >= dayEnd.getTime() || event.end.getTime() <= day.getTime()) continue;
          const segStart = event.start.getTime() < day.getTime() ? day : event.start;
          const segEnd = event.end.getTime() > dayEnd.getTime() ? dayEnd : event.end;
          const startMinutes = minutesOfDay(segStart) + (isSameDay(segStart, day) ? 0 : 24 * 60);
          const endMinutes = startMinutes + (segEnd.getTime() - segStart.getTime()) / 60_000;
          const visible = clampToVisibleWindow(startMinutes, endMinutes, minTime, maxTime);
          if (!visible) continue;
          const top = timeToOffset(visible.start, minTime, hourHeight);
          const height = Math.max(MIN_BLOCK_H, timeToOffset(visible.end, minTime, hourHeight) - top);
          geometry.set(event.id, { top, height });
          clipped.push({ ...event, start: segStart, end: segEnd });
        }

        const lanes = new Map(packTimedLanes(clipped).map((l) => [l.id, l]));
        const blocks: Block<T>[] = clipped.map((event) => {
          const box = geometry.get(event.id)!;
          const lane = lanes.get(event.id);
          return {
            event,
            top: box.top,
            height: box.height,
            col: lane?.col ?? 0,
            cols: lane?.cols ?? 1,
            compact: box.height < COMPACT_BLOCK_H,
          };
        });
        return { day, blocks };
      }),
    [days, timedEvents, minTime, maxTime, hourHeight],
  );

  // --------------------------------------------------------------- pointer handling

  const dispatch = (action: Parameters<typeof dragReducer>[1]) => {
    const next = dragReducer(dragRef.current, action);
    if (next === dragRef.current) return;
    dragRef.current = next;
    setDrag(next);
  };

  const beginDrag = (
    e: ReactPointerEvent,
    init: { mode: 'move' | 'resize'; event: NormalizedEvent<T>; edge?: ResizeEdge } | { mode: 'select' },
  ) => {
    if (e.button !== 0) return;
    const rects = columnRects();
    if (!rects.length) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const exact = resolveGridHit(startX, startY, rects, minTime, hourHeight, 1);
    const origin = resolveGridHit(startX, startY, rects, minTime, hourHeight, snapMinutes);
    if (!exact || !origin) return;

    const grabOffsetMinutes =
      init.mode === 'move' ? Math.max(0, exact.minutes - minutesOfDay(init.event.start)) : 0;

    let promoted = false;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (longPressTimer) clearTimeout(longPressTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKeyDown, true);
    };

    const onMove = (ev: PointerEvent) => {
      // On touch, movement before the long press fires means the user is scrolling — bow out and
      // leave the gesture to the scroll container.
      if (coarse && !promoted && dragRef.current.kind === 'pending') {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) >= DRAG_THRESHOLD) {
          cleanup();
          dispatch({ type: 'cancel' });
        }
        return;
      }
      const hit = resolveGridHit(ev.clientX, ev.clientY, columnRects(), minTime, hourHeight, snapMinutes);
      dispatch({ type: 'pointer', x: ev.clientX, y: ev.clientY, hit });
      if (isActiveDrag(dragRef.current)) suppressClickRef.current = true;
    };

    const onUp = () => {
      cleanup();
      const state = dragRef.current;
      dispatch({ type: 'drop' });
      if (!isActiveDrag(state) || !state.current) return;

      if (state.kind === 'moving' && init.mode === 'move') {
        const { start, end } = computeMove(init.event, state.current, state.grabOffsetMinutes, snapMinutes);
        if (start.getTime() !== init.event.start.getTime()) {
          onEventMove?.({ event: init.event.source, start, end, allDay: false });
        }
      } else if (state.kind === 'resizing' && init.mode === 'resize' && state.edge) {
        const target = setMinutesOfDay(state.current.date, state.current.minutes);
        const { start, end } = computeResize(init.event, state.edge, target, snapMinutes, snapMinutes);
        if (start.getTime() !== init.event.start.getTime() || end.getTime() !== init.event.end.getTime()) {
          onEventResize?.({ event: init.event.source, start, end });
        }
      } else if (state.kind === 'selecting' && state.origin) {
        const from = Math.min(state.origin.minutes, state.current.minutes);
        const to = Math.max(state.origin.minutes, state.current.minutes);
        const end = to > from ? to : from + slotMinutes;
        onRangeSelect?.({
          start: setMinutesOfDay(state.origin.date, from),
          end: setMinutesOfDay(state.origin.date, end),
          allDay: false,
        });
      }
    };

    const onCancel = () => {
      cleanup();
      dispatch({ type: 'cancel' });
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape' || !isActiveDrag(dragRef.current)) return;
      ev.stopPropagation();
      onCancel();
    };

    dispatch({
      type: 'down',
      mode: init.mode,
      startX,
      startY,
      eventId: init.mode === 'select' ? null : init.event.id,
      edge: init.mode === 'resize' ? (init.edge ?? 'end') : null,
      grabOffsetMinutes,
      origin,
    });

    if (coarse) {
      longPressTimer = setTimeout(() => {
        promoted = true;
        suppressClickRef.current = true;
        dispatch({ type: 'promote', hit: origin });
      }, LONG_PRESS_MS);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKeyDown, true);
  };

  const chipPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, event: NormalizedEvent<T>) => {
    if (!event.editable) return;
    const edge = (e.target as HTMLElement).closest<HTMLElement>('[data-ec-resize]')?.getAttribute('data-ec-resize');
    if (edge === 'start' || edge === 'end') {
      if (!onEventResize) return;
      e.stopPropagation();
      beginDrag(e, { mode: 'resize', event, edge });
      return;
    }
    if (!onEventMove) return;
    e.stopPropagation();
    beginDrag(e, { mode: 'move', event });
  };

  const handleGridClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!onSlotClick) return;
    const hit = resolveGridHit(e.clientX, e.clientY, columnRects(), minTime, hourHeight, 1);
    if (!hit) return;
    const slotStart = Math.floor(hit.minutes / slotMinutes) * slotMinutes;
    onSlotClick({
      start: setMinutesOfDay(hit.date, slotStart),
      end: setMinutesOfDay(hit.date, slotStart + slotMinutes),
      allDay: false,
    });
  };

  // --------------------------------------------------------------- render

  const selection =
    drag.kind === 'selecting' && drag.origin && drag.current
      ? {
          day: drag.origin.date,
          top: timeToOffset(Math.min(drag.origin.minutes, drag.current.minutes), minTime, hourHeight),
          height: Math.max(
            MIN_BLOCK_H,
            timeToOffset(Math.max(drag.origin.minutes, drag.current.minutes), minTime, hourHeight) -
              timeToOffset(Math.min(drag.origin.minutes, drag.current.minutes), minTime, hourHeight),
          ),
        }
      : null;

  const nowMinutes = now == null ? null : minutesOfDay(now);
  const showNow = showNowIndicator && nowMinutes != null && nowMinutes >= minTime * 60 && nowMinutes <= maxTime * 60;

  return (
    <div
      className={cx('uikit-event-calendar__timegrid', {
        'uikit-event-calendar__timegrid--mobile-week': mobile && view === 'week',
      })}
      style={cssVars({ '--uikit-ec-hour-h': `${hourHeight}px`, '--uikit-ec-days': days.length })}
    >
      <div className="uikit-event-calendar__tg-scroll" ref={scrollRef}>
        <div className="uikit-event-calendar__tg-inner">
          <div className="uikit-event-calendar__tg-sticky">
            <div className="uikit-event-calendar__tg-head">
              <div className="uikit-event-calendar__tg-corner" />
              {days.map((day) => (
                <div
                  key={day.getTime()}
                  className={cx('uikit-event-calendar__tg-head-cell', {
                    'uikit-event-calendar__tg-head-cell--today': isSameDay(day, now),
                  })}
                >
                  {formatDayHeader(day, locale)}
                </div>
              ))}
            </div>

            <div className="uikit-event-calendar__tg-allday">
              <div className="uikit-event-calendar__tg-corner uikit-event-calendar__tg-corner--label">All day</div>
              <div
                className="uikit-event-calendar__tg-allday-lanes"
                style={cssVars({ '--uikit-ec-lanes': Math.max(1, allDayRow.laneCount) })}
              >
                {days.map((day) => (
                  <div
                    key={day.getTime()}
                    data-ec-day={day.getTime()}
                    className={cx('uikit-event-calendar__tg-allday-cell', {
                      'uikit-event-calendar__tg-allday-cell--selecting': dayDrag.isSelected(day),
                    })}
                    onPointerDown={(e) => dayDrag.startSelect(e, day)}
                    onClick={() => {
                      if (!dayDrag.takeClick()) return;
                      onSlotClick?.({ start: day, end: addDays(day, 1), allDay: true });
                    }}
                  />
                ))}
                {allDayRow.bars.map((bar) => (
                  <EventChip
                    key={bar.event.id}
                    event={bar.event}
                    view={view}
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
                      '--uikit-ec-bar-offset': '2px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="uikit-event-calendar__tg-body" style={cssVars({ '--uikit-ec-total-h': `${totalHeight}px` })}>
            <div className="uikit-event-calendar__tg-gutter" aria-hidden="true">
              {hours.map((hour) => (
                <div className="uikit-event-calendar__tg-hour" key={hour}>
                  <span>{formatTimeLabel(hour * 60, timeFormat, locale)}</span>
                </div>
              ))}
            </div>
            <div
              className="uikit-event-calendar__tg-cols"
              onPointerDown={(e) => {
                if (!onRangeSelect) return;
                beginDrag(e, { mode: 'select' });
              }}
              onClick={handleGridClick}
            >
              {columns.map(({ day, blocks }) => (
                <div
                  key={day.getTime()}
                  ref={setColRef(day)}
                  className="uikit-event-calendar__tg-col"
                  role="group"
                  aria-label={formatFullDay(day, locale)}
                >
                  {blocks.map((block) => (
                    <EventChip
                      key={block.event.id}
                      event={block.event}
                      view={view}
                      variant="block"
                      compact={block.compact}
                      timeFormat={timeFormat}
                      locale={locale}
                      resizable={!!onEventResize && block.event.editable}
                      dragging={isActiveDrag(drag) && drag.eventId === block.event.id}
                      onSelect={(source, anchor) => {
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
                        onEventClick?.(source, anchor);
                      }}
                      onPointerDown={(e) => chipPointerDown(e, block.event)}
                      renderEvent={renderEvent}
                      vars={{
                        '--uikit-ec-top': block.top,
                        '--uikit-ec-h': block.height,
                        '--uikit-ec-col': block.col,
                        '--uikit-ec-cols': block.cols,
                      }}
                    />
                  ))}

                  {selection && isSameDay(selection.day, day) && (
                    <div
                      className="uikit-event-calendar__tg-selection"
                      aria-hidden="true"
                      style={cssVars({ '--uikit-ec-top': selection.top, '--uikit-ec-h': selection.height })}
                    />
                  )}

                  {showNow && now != null && nowMinutes != null && isSameDay(day, now) && (
                    <div
                      className="uikit-event-calendar__tg-now"
                      aria-hidden="true"
                      style={cssVars({ '--uikit-ec-top': timeToOffset(nowMinutes, minTime, hourHeight) })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { addDays, startOfDay } from '../datetime/date-utils';
import { useCoarsePointer } from '../utils/use-coarse-pointer';
import { DRAG_THRESHOLD, LONG_PRESS_MS, daysBetween, shiftByDays } from './drag-utils';
import type { EventMoveArgs, NormalizedEvent, SlotArgs } from './event-calendar-utils';

export type DayDragState =
  | { kind: 'idle' }
  | { kind: 'moving'; eventId: string; fromDay: Date; toDay: Date }
  | { kind: 'selecting'; fromDay: Date; toDay: Date };

const IDLE: DayDragState = { kind: 'idle' };

/** Reads the day a viewport point falls on from the `data-ec-day` markers the views render. */
function dayAtPoint(x: number, y: number): Date | null {
  if (typeof document === 'undefined' || typeof document.elementFromPoint !== 'function') return null;
  const cell = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-ec-day]');
  const raw = cell?.getAttribute('data-ec-day');
  return raw ? new Date(Number(raw)) : null;
}

export interface UseDayDragOptions<T> {
  onEventMove?: (args: EventMoveArgs<T>) => void;
  onRangeSelect?: (args: SlotArgs) => void;
}

/**
 * Day-granularity dragging shared by the month grid and the time grid's all-day strip: move an
 * event across day cells (keeping its time of day and duration) or sweep a range of days.
 * Hit-testing goes through `document.elementFromPoint` + `data-ec-day`, so it works across the
 * absolutely positioned bars that overlay the cells.
 */
export function useDayDrag<T>({ onEventMove, onRangeSelect }: UseDayDragOptions<T>) {
  const [state, setState] = useState<DayDragState>(IDLE);
  const suppressClickRef = useRef(false);
  const coarse = useCoarsePointer();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const begin = (
    e: ReactPointerEvent,
    init: { type: 'move'; event: NormalizedEvent<T> } | { type: 'select'; day: Date },
  ) => {
    if (e.button !== 0) return;
    if (init.type === 'move' && (!onEventMove || !init.event.editable)) return;
    if (init.type === 'select' && !onRangeSelect) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const originDay = dayAtPoint(startX, startY) ?? (init.type === 'select' ? init.day : null);
    if (!originDay) return;

    let started = false;
    let current = originDay;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;

    const activate = () => {
      started = true;
      suppressClickRef.current = true;
      setState(
        init.type === 'move'
          ? { kind: 'moving', eventId: init.event.id, fromDay: originDay, toDay: current }
          : { kind: 'selecting', fromDay: originDay, toDay: current },
      );
    };

    const cleanup = () => {
      cleanupRef.current = null;
      if (longPressTimer) clearTimeout(longPressTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKeyDown, true);
    };

    const onMove = (ev: PointerEvent) => {
      if (!started) {
        const travelled = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (travelled < DRAG_THRESHOLD) return;
        // On touch, movement before the long press means the user is scrolling — let them.
        if (coarse) {
          cleanup();
          return;
        }
        activate();
      }
      const day = dayAtPoint(ev.clientX, ev.clientY);
      if (!day || day.getTime() === current.getTime()) return;
      current = day;
      setState((prev) => (prev.kind === 'idle' ? prev : { ...prev, toDay: day }));
    };

    const onUp = () => {
      cleanup();
      if (!started) return;
      setState(IDLE);
      if (init.type === 'move') {
        const delta = daysBetween(originDay, current);
        if (delta === 0) return;
        const { start, end } = shiftByDays(init.event, delta);
        onEventMove?.({ event: init.event.source, start, end, allDay: init.event.allDay });
      } else {
        const from = originDay.getTime() <= current.getTime() ? originDay : current;
        const to = originDay.getTime() <= current.getTime() ? current : originDay;
        onRangeSelect?.({ start: startOfDay(from), end: addDays(startOfDay(to), 1), allDay: true });
      }
    };

    const onCancel = () => {
      cleanup();
      setState(IDLE);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape' || !started) return;
      ev.stopPropagation();
      onCancel();
    };

    if (coarse) longPressTimer = setTimeout(activate, LONG_PRESS_MS);
    cleanupRef.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKeyDown, true);
  };

  /** Bounds an in-flight day move would land on, for rendering the bar at its dragged position. */
  const previewFor = (event: NormalizedEvent<T>): { start: Date; end: Date } | null => {
    if (state.kind !== 'moving' || state.eventId !== event.id) return null;
    return shiftByDays(event, daysBetween(state.fromDay, state.toDay));
  };

  const isSelected = (day: Date): boolean => {
    if (state.kind !== 'selecting') return false;
    const a = state.fromDay.getTime();
    const b = state.toDay.getTime();
    const time = startOfDay(day).getTime();
    return time >= Math.min(a, b) && time <= Math.max(a, b);
  };

  const takeClick = (): boolean => {
    if (!suppressClickRef.current) return true;
    suppressClickRef.current = false;
    return false;
  };

  return {
    state,
    startMove: (e: ReactPointerEvent, event: NormalizedEvent<T>) => begin(e, { type: 'move', event }),
    startSelect: (e: ReactPointerEvent, day: Date) => begin(e, { type: 'select', day }),
    previewFor,
    isSelected,
    /** Returns false when the click that follows a drag should be swallowed. */
    takeClick,
    dragging: state.kind !== 'idle',
  };
}

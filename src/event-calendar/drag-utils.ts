import { addDays, differenceInCalendarDays, minutesOfDay, setMinutesOfDay } from '../datetime/date-utils';
import { offsetToTime } from './event-calendar-utils';

/** Pointer travel (px) before a press becomes a drag. Matches the Kanban board. */
export const DRAG_THRESHOLD = 6;

/** Press-and-hold (ms) that promotes a touch to a drag, leaving shorter touches to scroll/tap. */
export const LONG_PRESS_MS = 350;

export type DragMode = 'move' | 'resize' | 'select';
export type ResizeEdge = 'start' | 'end';

/** A point in a time grid: which day column, and how many minutes past that day's midnight. */
export interface GridHit {
  date: Date;
  minutes: number;
}

/** Viewport-space geometry of one day column, as read from `getBoundingClientRect`. */
export interface ColumnRect {
  date: Date;
  left: number;
  right: number;
  /** Top of the scrollable hour area, i.e. the pixel that maps to `minTime`. */
  top: number;
}

export interface DragIdle {
  kind: 'idle';
}

export interface DragPending {
  kind: 'pending';
  mode: DragMode;
  startX: number;
  startY: number;
  eventId: string | null;
  edge: ResizeEdge | null;
  /** Minutes between the event's start and where the pointer grabbed it. */
  grabOffsetMinutes: number;
  origin: GridHit | null;
}

export interface DragActive {
  kind: 'moving' | 'resizing' | 'selecting';
  mode: DragMode;
  eventId: string | null;
  edge: ResizeEdge | null;
  grabOffsetMinutes: number;
  origin: GridHit | null;
  current: GridHit | null;
}

export type DragState = DragIdle | DragPending | DragActive;

export const IDLE: DragState = { kind: 'idle' };

export type DragAction =
  | {
      type: 'down';
      mode: DragMode;
      startX: number;
      startY: number;
      eventId?: string | null;
      edge?: ResizeEdge | null;
      grabOffsetMinutes?: number;
      origin?: GridHit | null;
    }
  | { type: 'pointer'; x: number; y: number; hit: GridHit | null }
  /** Long-press promotion: becomes active without waiting for the movement threshold. */
  | { type: 'promote'; hit?: GridHit | null }
  | { type: 'cancel' }
  | { type: 'drop' };

const ACTIVE_KIND: Record<DragMode, DragActive['kind']> = {
  move: 'moving',
  resize: 'resizing',
  select: 'selecting',
};

export function isActiveDrag(state: DragState): state is DragActive {
  return state.kind === 'moving' || state.kind === 'resizing' || state.kind === 'selecting';
}

function promote(state: DragPending, hit: GridHit | null): DragActive {
  return {
    kind: ACTIVE_KIND[state.mode],
    mode: state.mode,
    eventId: state.eventId,
    edge: state.edge,
    grabOffsetMinutes: state.grabOffsetMinutes,
    origin: state.origin,
    current: hit ?? state.origin,
  };
}

/**
 * Pure drag state machine: `idle -> pending -> moving | resizing | selecting -> idle`. A press
 * stays `pending` (and so keeps behaving like a click) until the pointer travels
 * `DRAG_THRESHOLD` px or a long press promotes it.
 */
export function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case 'down':
      return {
        kind: 'pending',
        mode: action.mode,
        startX: action.startX,
        startY: action.startY,
        eventId: action.eventId ?? null,
        edge: action.edge ?? null,
        grabOffsetMinutes: action.grabOffsetMinutes ?? 0,
        origin: action.origin ?? null,
      };
    case 'pointer': {
      if (state.kind === 'pending') {
        const travelled = Math.hypot(action.x - state.startX, action.y - state.startY);
        if (travelled < DRAG_THRESHOLD) return state;
        return promote(state, action.hit);
      }
      if (!isActiveDrag(state)) return state;
      if (action.hit == null) return state;
      if (
        state.current &&
        state.current.minutes === action.hit.minutes &&
        state.current.date.getTime() === action.hit.date.getTime()
      ) {
        return state;
      }
      return { ...state, current: action.hit };
    }
    case 'promote':
      return state.kind === 'pending' ? promote(state, action.hit ?? null) : state;
    case 'cancel':
    case 'drop':
      return IDLE;
    default:
      return state;
  }
}

function snapMinutes(minutes: number, snap: number): number {
  const step = Math.max(1, snap);
  return Math.round(minutes / step) * step;
}

/**
 * Which day column and minute a viewport point falls on. Horizontally the point is clamped to
 * the nearest column so a drag that strays past the edge of the grid keeps tracking.
 */
export function resolveGridHit(
  clientX: number,
  clientY: number,
  columnRects: ColumnRect[],
  minTime: number,
  hourHeight: number,
  snap: number,
): GridHit | null {
  if (!columnRects.length) return null;
  let rect = columnRects.find((r) => clientX >= r.left && clientX < r.right);
  if (!rect) rect = clientX < columnRects[0].left ? columnRects[0] : columnRects[columnRects.length - 1];
  return { date: rect.date, minutes: offsetToTime(clientY - rect.top, minTime, hourHeight, snap) };
}

/** New bounds for an event dragged so the grabbed point sits at `hit`. Duration is preserved. */
export function computeMove(
  event: { start: Date; end: Date },
  hit: GridHit,
  grabOffsetMinutes: number,
  snap: number,
): { start: Date; end: Date } {
  const duration = event.end.getTime() - event.start.getTime();
  const start = setMinutesOfDay(hit.date, snapMinutes(hit.minutes - grabOffsetMinutes, snap));
  return { start, end: new Date(start.getTime() + duration) };
}

/**
 * New bounds for an event whose `edge` was dragged to `target`. The opposite edge is fixed and
 * the event never shrinks below `minDurationMinutes`.
 */
export function computeResize(
  event: { start: Date; end: Date },
  edge: ResizeEdge,
  target: Date,
  snap: number,
  minDurationMinutes: number,
): { start: Date; end: Date } {
  const snapped = setMinutesOfDay(target, snapMinutes(minutesOfDay(target), snap));
  const minMs = Math.max(1, minDurationMinutes) * 60_000;
  if (edge === 'end') {
    const floor = event.start.getTime() + minMs;
    return { start: event.start, end: new Date(Math.max(snapped.getTime(), floor)) };
  }
  const ceiling = event.end.getTime() - minMs;
  return { start: new Date(Math.min(snapped.getTime(), ceiling)), end: event.end };
}

/** Whole calendar days from `from` to `to` — the shift a month/all-day drag applies. */
export function daysBetween(from: Date, to: Date): number {
  return differenceInCalendarDays(to, from);
}

/** New bounds for an event dragged `deltaDays` across day cells, keeping its time of day. */
export function shiftByDays(event: { start: Date; end: Date }, deltaDays: number): { start: Date; end: Date } {
  const duration = event.end.getTime() - event.start.getTime();
  const start = addDays(event.start, deltaDays);
  return { start, end: new Date(start.getTime() + duration) };
}

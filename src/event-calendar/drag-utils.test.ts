import { describe, it, expect } from 'vitest';
import { isSameDay, minutesOfDay } from '../datetime/date-utils';
import {
  DRAG_THRESHOLD,
  IDLE,
  computeMove,
  computeResize,
  daysBetween,
  dragReducer,
  isActiveDrag,
  resolveGridHit,
  shiftByDays,
  type ColumnRect,
  type DragState,
} from './drag-utils';

function at(y: number, m: number, d: number, h = 0, mi = 0): Date {
  return new Date(y, m, d, h, mi);
}

const down = { type: 'down', mode: 'move', startX: 100, startY: 100, eventId: 'a' } as const;

describe('dragReducer', () => {
  it('down goes to pending, not active', () => {
    const state = dragReducer(IDLE, down);
    expect(state.kind).toBe('pending');
    expect(isActiveDrag(state)).toBe(false);
  });

  it('stays pending below the movement threshold', () => {
    const pending = dragReducer(IDLE, down);
    const nudged = dragReducer(pending, { type: 'pointer', x: 100 + DRAG_THRESHOLD - 1, y: 100, hit: null });
    expect(nudged).toBe(pending);
  });

  it('promotes once the threshold is crossed', () => {
    const pending = dragReducer(IDLE, down);
    const hit = { date: at(2026, 8, 1), minutes: 540 };
    const active = dragReducer(pending, { type: 'pointer', x: 100 + DRAG_THRESHOLD, y: 100, hit });
    expect(active.kind).toBe('moving');
    expect(isActiveDrag(active) && active.current).toEqual(hit);
  });

  it('maps each mode to its active kind', () => {
    const kinds = (['move', 'resize', 'select'] as const).map((mode) => {
      const pending = dragReducer(IDLE, { type: 'down', mode, startX: 0, startY: 0 });
      return dragReducer(pending, { type: 'promote' }).kind;
    });
    expect(kinds).toEqual(['moving', 'resizing', 'selecting']);
  });

  it('long-press promotion skips the threshold', () => {
    const pending = dragReducer(IDLE, down);
    expect(dragReducer(pending, { type: 'promote' }).kind).toBe('moving');
  });

  it('promote is a no-op when not pending', () => {
    expect(dragReducer(IDLE, { type: 'promote' })).toBe(IDLE);
  });

  it('tracks the current hit while active', () => {
    let state: DragState = dragReducer(IDLE, down);
    state = dragReducer(state, { type: 'promote', hit: { date: at(2026, 8, 1), minutes: 540 } });
    const next = { date: at(2026, 8, 2), minutes: 600 };
    state = dragReducer(state, { type: 'pointer', x: 300, y: 200, hit: next });
    expect(isActiveDrag(state) && state.current).toEqual(next);
  });

  it('ignores an unchanged hit so React can skip the re-render', () => {
    const hit = { date: at(2026, 8, 1), minutes: 540 };
    let state: DragState = dragReducer(dragReducer(IDLE, down), { type: 'promote', hit });
    const same = dragReducer(state, { type: 'pointer', x: 999, y: 999, hit: { ...hit } });
    expect(same).toBe(state);
  });

  it('keeps the last hit when the pointer leaves the grid', () => {
    const hit = { date: at(2026, 8, 1), minutes: 540 };
    const state = dragReducer(dragReducer(IDLE, down), { type: 'promote', hit });
    const off = dragReducer(state, { type: 'pointer', x: -50, y: -50, hit: null });
    expect(isActiveDrag(off) && off.current).toEqual(hit);
  });

  it('cancel and drop return to idle', () => {
    const state = dragReducer(dragReducer(IDLE, down), { type: 'promote' });
    expect(dragReducer(state, { type: 'cancel' })).toEqual(IDLE);
    expect(dragReducer(state, { type: 'drop' })).toEqual(IDLE);
  });
});

describe('resolveGridHit', () => {
  const rects: ColumnRect[] = [
    { date: at(2026, 8, 1), left: 0, right: 100, top: 50 },
    { date: at(2026, 8, 2), left: 100, right: 200, top: 50 },
  ];

  it('picks the column the point is over and snaps the minute', () => {
    // 48px/hour, minTime 8 -> 50px below the grid top is 08:00 + 62.5min, snapped to 60
    const hit = resolveGridHit(150, 100, rects, 8, 48, 30)!;
    expect(isSameDay(hit.date, at(2026, 8, 2))).toBe(true);
    expect(hit.minutes).toBe(540);
  });

  it('clamps to the nearest column outside the grid', () => {
    expect(isSameDay(resolveGridHit(-30, 60, rects, 0, 48, 15)!.date, at(2026, 8, 1))).toBe(true);
    expect(isSameDay(resolveGridHit(900, 60, rects, 0, 48, 15)!.date, at(2026, 8, 2))).toBe(true);
  });

  it('returns null without columns', () => {
    expect(resolveGridHit(10, 10, [], 0, 48, 15)).toBeNull();
  });
});

describe('computeMove', () => {
  const event = { start: at(2026, 8, 1, 9, 0), end: at(2026, 8, 1, 10, 30) };

  it('preserves duration and honours the grab offset', () => {
    // Grabbed 30 minutes into the event, dropped with the pointer at 14:00 -> starts at 13:30
    const moved = computeMove(event, { date: at(2026, 8, 3), minutes: 14 * 60 }, 30, 15);
    expect(isSameDay(moved.start, at(2026, 8, 3))).toBe(true);
    expect(minutesOfDay(moved.start)).toBe(13 * 60 + 30);
    expect(moved.end.getTime() - moved.start.getTime()).toBe(90 * 60_000);
  });

  it('snaps the resulting start', () => {
    const moved = computeMove(event, { date: at(2026, 8, 1), minutes: 611 }, 0, 30);
    expect(minutesOfDay(moved.start)).toBe(600);
  });

  it('rolls into the previous day when the grab offset pushes past midnight', () => {
    const moved = computeMove(event, { date: at(2026, 8, 3), minutes: 15 }, 60, 15);
    expect(isSameDay(moved.start, at(2026, 8, 2))).toBe(true);
    expect(minutesOfDay(moved.start)).toBe(23 * 60 + 15);
  });
});

describe('computeResize', () => {
  const event = { start: at(2026, 8, 1, 9, 0), end: at(2026, 8, 1, 10, 0) };

  it('drags the end edge, keeping the start', () => {
    const resized = computeResize(event, 'end', at(2026, 8, 1, 11, 20), 30, 15);
    expect(resized.start.getTime()).toBe(event.start.getTime());
    expect(minutesOfDay(resized.end)).toBe(11 * 60 + 30);
  });

  it('drags the start edge, keeping the end', () => {
    const resized = computeResize(event, 'start', at(2026, 8, 1, 8, 10), 15, 15);
    expect(resized.end.getTime()).toBe(event.end.getTime());
    expect(minutesOfDay(resized.start)).toBe(8 * 60 + 15);
  });

  it('refuses to shrink past the minimum duration', () => {
    const fromEnd = computeResize(event, 'end', at(2026, 8, 1, 8, 0), 15, 30);
    expect(fromEnd.end.getTime() - fromEnd.start.getTime()).toBe(30 * 60_000);

    const fromStart = computeResize(event, 'start', at(2026, 8, 1, 12, 0), 15, 30);
    expect(fromStart.end.getTime() - fromStart.start.getTime()).toBe(30 * 60_000);
    expect(fromStart.end.getTime()).toBe(event.end.getTime());
  });
});

describe('day shifting', () => {
  it('daysBetween counts calendar days', () => {
    expect(daysBetween(at(2026, 8, 1, 23), at(2026, 8, 3, 1))).toBe(2);
    expect(daysBetween(at(2026, 8, 3), at(2026, 8, 1))).toBe(-2);
  });

  it('shiftByDays keeps time of day and duration', () => {
    const shifted = shiftByDays({ start: at(2026, 8, 1, 9, 30), end: at(2026, 8, 2, 11, 0) }, 3);
    expect(isSameDay(shifted.start, at(2026, 8, 4))).toBe(true);
    expect(minutesOfDay(shifted.start)).toBe(9 * 60 + 30);
    expect(shifted.end.getTime() - shifted.start.getTime()).toBe(
      at(2026, 8, 2, 11, 0).getTime() - at(2026, 8, 1, 9, 30).getTime(),
    );
  });

  it('shiftByDays with no delta is a no-op', () => {
    const event = { start: at(2026, 8, 1, 9, 30), end: at(2026, 8, 1, 10, 0) };
    const shifted = shiftByDays(event, 0);
    expect(shifted.start.getTime()).toBe(event.start.getTime());
    expect(shifted.end.getTime()).toBe(event.end.getTime());
  });
});

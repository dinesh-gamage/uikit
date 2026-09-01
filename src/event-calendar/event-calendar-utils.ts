import type { CSSProperties, ReactNode } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  minutesOfDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  type WeekStartsOn,
} from '../datetime/date-utils';

export type { WeekStartsOn };

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export type TimeFormat = '12h' | '24h';

/** Half-open interval: `start` inclusive, `end` exclusive. */
export interface DateRange {
  start: Date;
  end: Date;
}

/** Accessors that turn an app's own event shape into something the calendar can lay out. */
export interface EventAccessors<T> {
  eventId: (e: T) => string;
  eventStart: (e: T) => Date;
  /** Exclusive end. */
  eventEnd: (e: T) => Date;
  eventTitle: (e: T) => string;
  eventAllDay?: (e: T) => boolean;
  eventColor?: (e: T) => string | undefined;
  eventEditable?: (e: T) => boolean;
}

/** An event with its accessors resolved once, keeping a handle on the caller's original object. */
export interface NormalizedEvent<T> {
  id: string;
  start: Date;
  /** Exclusive. */
  end: Date;
  allDay: boolean;
  title: string;
  color?: string;
  editable: boolean;
  source: T;
}

/** What a click or drag on empty calendar space resolves to. */
export interface SlotArgs {
  start: Date;
  /** Exclusive. */
  end: Date;
  allDay: boolean;
}

export interface EventMoveArgs<T> {
  event: T;
  start: Date;
  /** Exclusive. */
  end: Date;
  allDay: boolean;
}

export interface EventResizeArgs<T> {
  event: T;
  start: Date;
  /** Exclusive. */
  end: Date;
}

/**
 * Everything the views need from the shell. Internal — the public surface is `EventCalendarProps`.
 */
export interface ViewSharedProps<T> {
  events: NormalizedEvent<T>[];
  range: DateRange;
  date: Date;
  weekStartsOn: WeekStartsOn;
  locale?: string;
  timeFormat: TimeFormat;
  mobile: boolean;
  onDateChange: (d: Date) => void;
  onEventClick?: (event: T, anchor: HTMLElement) => void;
  onSlotClick?: (args: SlotArgs) => void;
  onRangeSelect?: (args: SlotArgs) => void;
  onEventMove?: (args: EventMoveArgs<T>) => void;
  onEventResize?: (args: EventResizeArgs<T>) => void;
  renderEvent?: (event: T, ctx: { view: CalendarView; compact: boolean }) => ReactNode;
  renderAgendaItem?: (event: T) => ReactNode;
  emptyMessage?: ReactNode;
}

/**
 * Builds an inline style carrying only CSS custom properties. Every dynamic value in this
 * component (colour, lane geometry, grid height) is handed to the stylesheet this way, so the
 * SCSS keeps ownership of the actual declarations.
 */
export function cssVars(vars: Record<string, string | number | undefined>): CSSProperties {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(vars)) if (value !== undefined) out[key] = value;
  return out as CSSProperties;
}

export const DEFAULT_AGENDA_DAYS = 30;

/**
 * The window of time a view shows. `month` always covers the full 6x7 grid (so events from the
 * bleed-in/bleed-out days are fetched too), `agenda` covers `agendaDays` from `date`.
 */
export function getVisibleRange(
  view: CalendarView,
  date: Date,
  opts?: { weekStartsOn?: WeekStartsOn; agendaDays?: number },
): DateRange {
  const weekStartsOn = opts?.weekStartsOn ?? 1;
  const agendaDays = opts?.agendaDays ?? DEFAULT_AGENDA_DAYS;
  switch (view) {
    case 'month': {
      const start = startOfWeek(startOfMonth(date), weekStartsOn);
      return { start, end: addDays(start, 42) };
    }
    case 'week': {
      const start = startOfWeek(date, weekStartsOn);
      return { start, end: addDays(start, 7) };
    }
    case 'day': {
      const start = startOfDay(date);
      return { start, end: addDays(start, 1) };
    }
    default: {
      const start = startOfDay(date);
      return { start, end: addDays(start, Math.max(1, agendaDays)) };
    }
  }
}

export function normalizeEvent<T>(event: T, acc: EventAccessors<T>): NormalizedEvent<T> {
  const start = acc.eventStart(event);
  const end = acc.eventEnd(event);
  return {
    id: acc.eventId(event),
    start,
    // Guard against inverted/absent ends so downstream layout maths never produces negative sizes.
    end: end.getTime() < start.getTime() ? start : end,
    allDay: acc.eventAllDay?.(event) ?? false,
    title: acc.eventTitle(event),
    color: acc.eventColor?.(event),
    editable: acc.eventEditable?.(event) ?? true,
    source: event,
  };
}

export function normalizeEvents<T>(events: T[], acc: EventAccessors<T>): NormalizedEvent<T>[] {
  return events.map((e) => normalizeEvent(e, acc));
}

/**
 * Events touching `[range.start, range.end)`. Zero-length events (start === end) count as
 * present at their instant rather than being filtered out by the exclusive-end comparison.
 */
export function eventsOverlappingRange<T>(events: NormalizedEvent<T>[], range: DateRange): NormalizedEvent<T>[] {
  const from = range.start.getTime();
  const to = range.end.getTime();
  return events.filter((e) => {
    const s = e.start.getTime();
    const en = e.end.getTime();
    if (s >= to) return false;
    return en > from || (en === s && s >= from);
  });
}

/** Compares by start, then longest first — the order greedy lane packing wants. */
export function compareEventsForPacking<T>(a: NormalizedEvent<T>, b: NormalizedEvent<T>): number {
  const byStart = a.start.getTime() - b.start.getTime();
  if (byStart !== 0) return byStart;
  const byLength = b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime());
  if (byLength !== 0) return byLength;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export interface DaySegment<T> {
  event: NormalizedEvent<T>;
  /** Midnight of the day this segment falls on. */
  day: Date;
  /** Clipped to the day. */
  start: Date;
  end: Date;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

/**
 * Splits an event into one segment per calendar day it covers, optionally clipped to `range`.
 * The exclusive end means an event ending exactly at midnight does not produce a segment for
 * the following day.
 */
export function splitIntoDaySegments<T>(event: NormalizedEvent<T>, range?: DateRange): DaySegment<T>[] {
  let from = event.start;
  let to = event.end;
  if (range) {
    if (from.getTime() < range.start.getTime()) from = range.start;
    if (to.getTime() > range.end.getTime()) to = range.end;
  }
  if (to.getTime() < from.getTime()) return [];

  const segments: DaySegment<T>[] = [];
  // A zero-length event still occupies the day it starts on.
  const lastDay = startOfDay(to.getTime() > from.getTime() ? new Date(to.getTime() - 1) : from);
  let day = startOfDay(from);
  while (day.getTime() <= lastDay.getTime()) {
    const dayEnd = addDays(day, 1);
    const start = day.getTime() > from.getTime() ? day : from;
    const end = dayEnd.getTime() < to.getTime() ? dayEnd : to;
    segments.push({
      event,
      day,
      start,
      end,
      continuesBefore: event.start.getTime() < day.getTime(),
      continuesAfter: event.end.getTime() > dayEnd.getTime(),
    });
    day = dayEnd;
  }
  return segments;
}

export interface SpanBar<T> {
  event: NormalizedEvent<T>;
  /** 0-based column the bar starts at within the row. */
  columnStart: number;
  /** Number of columns the bar covers. */
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export interface SpanRow<T> {
  days: Date[];
  bars: SpanBar<T>[];
  /** Lanes actually used — how tall the row would need to be to show every bar. */
  laneCount: number;
}

/**
 * Lays every event out as a horizontal bar across the days of each row, packing bars into the
 * lowest free lane. Used for month cells and for the time grid's all-day strip.
 */
export function buildMonthRows<T>(rows: Date[][], events: NormalizedEvent<T>[]): SpanRow<T>[] {
  const sorted = [...events].sort(compareEventsForPacking);
  return rows.map((days) => {
    const rowStart = days[0];
    const rowEnd = addDays(days[days.length - 1], 1);
    const bars: SpanBar<T>[] = [];
    // lanes[i] = the first column in lane i that is still free.
    const lanes: number[] = [];

    for (const event of sorted) {
      if (event.start.getTime() >= rowEnd.getTime()) continue;
      const endsAt = Math.max(event.end.getTime(), event.start.getTime() + 1);
      if (endsAt <= rowStart.getTime()) continue;

      const columnStart = Math.max(0, differenceInCalendarDays(event.start, rowStart));
      const lastCovered = startOfDay(new Date(endsAt - 1));
      const columnEnd = Math.min(days.length - 1, differenceInCalendarDays(lastCovered, rowStart));
      if (columnEnd < columnStart) continue;

      let lane = 0;
      while (lane < lanes.length && lanes[lane] > columnStart) lane++;
      lanes[lane] = columnEnd + 1;

      bars.push({
        event,
        columnStart,
        span: columnEnd - columnStart + 1,
        lane,
        continuesBefore: event.start.getTime() < rowStart.getTime(),
        continuesAfter: endsAt > rowEnd.getTime(),
      });
    }

    return { days, bars, laneCount: lanes.length };
  });
}

export interface TimedLane {
  id: string;
  /** 0-based overlap column. */
  col: number;
  /** How many columns the cluster this event belongs to was split into. */
  cols: number;
}

/**
 * Assigns overlapping timed events to side-by-side columns. Events are grouped into clusters of
 * transitively overlapping events; within a cluster every event gets the first column whose last
 * event has already ended, and the whole cluster shares the resulting column count so the
 * rendered widths line up.
 */
export function packTimedLanes<T>(events: NormalizedEvent<T>[]): TimedLane[] {
  const sorted = [...events].sort(compareEventsForPacking);
  const out: TimedLane[] = [];

  let cluster: Array<{ id: string; col: number }> = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const cols = Math.max(1, columnEnds.length);
    for (const item of cluster) out.push({ id: item.id, col: item.col, cols });
    cluster = [];
    columnEnds = [];
    clusterEnd = -Infinity;
  };

  for (const event of sorted) {
    const start = event.start.getTime();
    // Treat a zero-length event as one minute long so it still claims a column.
    const end = Math.max(event.end.getTime(), start + 60_000);
    if (start >= clusterEnd && cluster.length) flush();

    let col = columnEnds.findIndex((e) => e <= start);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[col] = end;
    }
    cluster.push({ id: event.id, col });
    clusterEnd = Math.max(clusterEnd, end);
  }
  if (cluster.length) flush();

  return out;
}

/** Pixel offset of a minute-of-day within a time grid whose first visible hour is `minTime`. */
export function timeToOffset(minutes: number, minTime: number, hourHeight: number): number {
  return ((minutes - minTime * 60) / 60) * hourHeight;
}

/** Inverse of `timeToOffset`, snapped to the nearest `snap` minutes. */
export function offsetToTime(px: number, minTime: number, hourHeight: number, snap: number): number {
  const raw = minTime * 60 + (px / hourHeight) * 60;
  const step = Math.max(1, snap);
  return Math.round(raw / step) * step;
}

/**
 * Clips a timed event's minute-of-day span to the grid's visible window. Returns null when the
 * event falls entirely outside it.
 */
export function clampToVisibleWindow(
  startMinutes: number,
  endMinutes: number,
  minTime: number,
  maxTime: number,
): { start: number; end: number } | null {
  const lo = minTime * 60;
  const hi = maxTime * 60;
  if (endMinutes <= lo || startMinutes >= hi) return null;
  return { start: Math.max(lo, startMinutes), end: Math.min(hi, Math.max(endMinutes, startMinutes + 1)) };
}

// Intl inserts U+202F (narrow no-break space) before AM/PM in newer runtimes; normalising it to a
// plain space keeps labels comparable and copy-pasteable.
function normalizeSpaces(s: string): string {
  return s.replace(/[\u202f\u00a0]/g, ' ');
}

export function formatTimeLabel(minutes: number, timeFormat: TimeFormat = '24h', locale?: string): string {
  const d = new Date(2000, 0, 1, 0, minutes);
  const opts: Intl.DateTimeFormatOptions =
    timeFormat === '12h'
      ? { hour: 'numeric', minute: '2-digit', hour12: true }
      : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  return normalizeSpaces(new Intl.DateTimeFormat(locale, opts).format(d));
}

/** Time label for an event chip — drops ':00' in 12h mode the way calendars conventionally do. */
export function formatEventTime(date: Date, timeFormat: TimeFormat = '24h', locale?: string): string {
  const label = formatTimeLabel(minutesOfDay(date), timeFormat, locale);
  return timeFormat === '12h' ? label.replace(':00', '') : label;
}

export function formatDayHeader(date: Date, locale?: string): string {
  return normalizeSpaces(new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' }).format(date));
}

export function formatWeekdayName(date: Date, locale?: string, width: 'short' | 'narrow' = 'short'): string {
  return normalizeSpaces(new Intl.DateTimeFormat(locale, { weekday: width }).format(date));
}

export function formatFullDay(date: Date, locale?: string): string {
  return normalizeSpaces(
    new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date),
  );
}

// `formatRange` is only in the ES2021+ Intl lib; the repo targets an older lib, so it is probed
// at runtime rather than assumed.
type RangeCapableFormat = Intl.DateTimeFormat & { formatRange?: (from: Date, to: Date) => string };

function formatSpan(from: Date, to: Date, locale: string | undefined, opts: Intl.DateTimeFormatOptions): string {
  const fmt = new Intl.DateTimeFormat(locale, opts) as RangeCapableFormat;
  // formatRange collapses the shared parts ("1 – 7 Sep 2026"); fall back to a plain join.
  if (typeof fmt.formatRange === 'function') return normalizeSpaces(fmt.formatRange(from, to));
  return `${normalizeSpaces(fmt.format(from))} – ${normalizeSpaces(fmt.format(to))}`;
}

/** Human label for the header, e.g. 'September 2026', '1 – 7 Sep 2026', 'Tue, 1 Sep 2026'. */
export function formatRangeLabel(view: CalendarView, range: DateRange, date: Date, locale?: string): string {
  const lastDay = addDays(range.end, -1);
  switch (view) {
    case 'month':
      return normalizeSpaces(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date));
    case 'day':
      return normalizeSpaces(
        new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(
          range.start,
        ),
      );
    default:
      return formatSpan(range.start, lastDay, locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

export interface DayGroup<T> {
  day: Date;
  events: NormalizedEvent<T>[];
}

/** Compares for display order: all-day events first, then by start, then by title. */
export function compareEventsForDisplay<T>(a: NormalizedEvent<T>, b: NormalizedEvent<T>): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  const byStart = a.start.getTime() - b.start.getTime();
  if (byStart !== 0) return byStart;
  return a.title.localeCompare(b.title);
}

/** Events bucketed by the days of `range` they touch. Days with no events are omitted. */
export function groupByDay<T>(events: NormalizedEvent<T>[], range: DateRange): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  const sorted = [...events].sort(compareEventsForDisplay);
  let day = startOfDay(range.start);
  while (day.getTime() < range.end.getTime()) {
    const next = addDays(day, 1);
    const dayRange = { start: day, end: next };
    const inDay = eventsOverlappingRange(sorted, dayRange);
    if (inDay.length) groups.push({ day, events: inDay });
    day = next;
  }
  return groups;
}

/** Events for a single day, in display order. */
export function eventsForDay<T>(events: NormalizedEvent<T>[], day: Date): NormalizedEvent<T>[] {
  const start = startOfDay(day);
  return eventsOverlappingRange(events, { start, end: addDays(start, 1) }).sort(compareEventsForDisplay);
}

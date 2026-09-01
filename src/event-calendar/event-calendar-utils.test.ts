import { describe, it, expect } from 'vitest';
import { addDays, isSameDay, startOfDay } from '../datetime/date-utils';
import {
  buildMonthRows,
  clampToVisibleWindow,
  eventsForDay,
  eventsOverlappingRange,
  formatDayHeader,
  formatRangeLabel,
  formatTimeLabel,
  getVisibleRange,
  groupByDay,
  normalizeEvent,
  normalizeEvents,
  offsetToTime,
  packTimedLanes,
  splitIntoDaySegments,
  timeToOffset,
  type NormalizedEvent,
} from './event-calendar-utils';

interface Raw {
  id: string;
  start: Date;
  end: Date;
  title?: string;
  allDay?: boolean;
}

const accessors = {
  eventId: (e: Raw) => e.id,
  eventStart: (e: Raw) => e.start,
  eventEnd: (e: Raw) => e.end,
  eventTitle: (e: Raw) => e.title ?? e.id,
  eventAllDay: (e: Raw) => !!e.allDay,
};

function ev(id: string, start: Date, end: Date, allDay = false): NormalizedEvent<Raw> {
  return normalizeEvent({ id, start, end, allDay }, accessors);
}

/** `at(2026, 8, 1, 9, 30)` -> 1 Sep 2026 09:30 local. */
function at(y: number, m: number, d: number, h = 0, mi = 0): Date {
  return new Date(y, m, d, h, mi);
}

describe('getVisibleRange', () => {
  it('month covers the full 6x7 grid from the week start', () => {
    // 1 Sep 2026 is a Tuesday
    const mondayGrid = getVisibleRange('month', at(2026, 8, 15), { weekStartsOn: 1 });
    expect(isSameDay(mondayGrid.start, at(2026, 7, 31))).toBe(true);
    expect(isSameDay(mondayGrid.end, addDays(mondayGrid.start, 42))).toBe(true);

    const sundayGrid = getVisibleRange('month', at(2026, 8, 15), { weekStartsOn: 0 });
    expect(isSameDay(sundayGrid.start, at(2026, 7, 30))).toBe(true);
  });

  it('month handles a month starting exactly on the week start day', () => {
    // 1 Feb 2026 is a Sunday
    const sunday = getVisibleRange('month', at(2026, 1, 10), { weekStartsOn: 0 });
    expect(isSameDay(sunday.start, at(2026, 1, 1))).toBe(true);
    const monday = getVisibleRange('month', at(2026, 1, 10), { weekStartsOn: 1 });
    expect(isSameDay(monday.start, at(2026, 0, 26))).toBe(true);
  });

  it('month covers Feb of a leap year without losing the tail', () => {
    const range = getVisibleRange('month', at(2024, 1, 15), { weekStartsOn: 1 });
    expect(isSameDay(range.start, at(2024, 0, 29))).toBe(true);
    expect(range.end.getTime() - range.start.getTime()).toBe(42 * 86_400_000);
    expect(range.end.getTime()).toBeGreaterThan(at(2024, 1, 29).getTime());
  });

  it('week spans exactly 7 days from the week start', () => {
    const range = getVisibleRange('week', at(2026, 8, 3, 14, 0), { weekStartsOn: 1 });
    expect(isSameDay(range.start, at(2026, 7, 31))).toBe(true);
    expect(isSameDay(range.end, at(2026, 8, 7))).toBe(true);
    expect(range.start.getHours()).toBe(0);
  });

  it('week defaults to Monday', () => {
    expect(isSameDay(getVisibleRange('week', at(2026, 8, 3)).start, at(2026, 7, 31))).toBe(true);
  });

  it('day spans one day from midnight', () => {
    const range = getVisibleRange('day', at(2026, 8, 3, 23, 59));
    expect(isSameDay(range.start, at(2026, 8, 3))).toBe(true);
    expect(isSameDay(range.end, at(2026, 8, 4))).toBe(true);
  });

  it('agenda spans agendaDays from the date', () => {
    expect(isSameDay(getVisibleRange('agenda', at(2026, 8, 1)).end, at(2026, 9, 1))).toBe(true);
    expect(isSameDay(getVisibleRange('agenda', at(2026, 8, 1), { agendaDays: 7 }).end, at(2026, 8, 8))).toBe(true);
  });
});

describe('normalizeEvent', () => {
  it('resolves accessors and defaults', () => {
    const n = normalizeEvent({ id: 'a', start: at(2026, 8, 1, 9), end: at(2026, 8, 1, 10), title: 'Standup' }, accessors);
    expect(n.id).toBe('a');
    expect(n.title).toBe('Standup');
    expect(n.allDay).toBe(false);
    expect(n.editable).toBe(true);
    expect(n.source.id).toBe('a');
  });

  it('clamps an end before the start', () => {
    const n = ev('a', at(2026, 8, 1, 10), at(2026, 8, 1, 9));
    expect(n.end.getTime()).toBe(n.start.getTime());
  });

  it('normalizeEvents keeps order', () => {
    const list = normalizeEvents(
      [
        { id: 'b', start: at(2026, 8, 2), end: at(2026, 8, 3) },
        { id: 'a', start: at(2026, 8, 1), end: at(2026, 8, 2) },
      ],
      accessors,
    );
    expect(list.map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('eventsOverlappingRange', () => {
  const range = { start: at(2026, 8, 1), end: at(2026, 8, 8) };

  it('keeps overlapping events and drops the rest', () => {
    const inside = ev('in', at(2026, 8, 3, 9), at(2026, 8, 3, 10));
    const before = ev('before', at(2026, 7, 31, 9), at(2026, 7, 31, 10));
    const straddles = ev('straddle', at(2026, 7, 30), at(2026, 8, 2));
    const after = ev('after', at(2026, 8, 8, 9), at(2026, 8, 8, 10));
    const kept = eventsOverlappingRange([inside, before, straddles, after], range).map((e) => e.id);
    expect(kept).toContain('in');
    expect(kept).toContain('straddle');
    expect(kept).not.toContain('after');
  });

  it('treats an event ending exactly at the range start as outside', () => {
    const touching = ev('touch', at(2026, 7, 30), at(2026, 8, 1));
    expect(eventsOverlappingRange([touching], range)).toHaveLength(0);
  });

  it('keeps zero-length events inside the range', () => {
    const instant = ev('instant', at(2026, 8, 2, 9), at(2026, 8, 2, 9));
    expect(eventsOverlappingRange([instant], range)).toHaveLength(1);
  });
});

describe('splitIntoDaySegments', () => {
  it('splits a multi-day event across a week boundary', () => {
    // Sun 30 Aug 22:00 -> Tue 1 Sep 03:00 (crosses the Mon week boundary)
    const segments = splitIntoDaySegments(ev('x', at(2026, 7, 30, 22), at(2026, 8, 1, 3)));
    expect(segments).toHaveLength(3);
    expect(isSameDay(segments[0].day, at(2026, 7, 30))).toBe(true);
    expect(isSameDay(segments[2].day, at(2026, 8, 1))).toBe(true);
    expect(segments[0].continuesAfter).toBe(true);
    expect(segments[0].continuesBefore).toBe(false);
    expect(segments[2].continuesBefore).toBe(true);
    expect(segments[2].continuesAfter).toBe(false);
    expect(segments[1].start.getHours()).toBe(0);
    expect(segments[1].end.getHours()).toBe(0);
  });

  it('does not spill into the day an event ends at midnight on', () => {
    const segments = splitIntoDaySegments(ev('x', at(2026, 8, 1, 9), at(2026, 8, 2), true));
    expect(segments).toHaveLength(1);
    expect(isSameDay(segments[0].day, at(2026, 8, 1))).toBe(true);
  });

  it('clips to the given range', () => {
    const segments = splitIntoDaySegments(ev('x', at(2026, 7, 28), at(2026, 8, 5)), {
      start: at(2026, 8, 1),
      end: at(2026, 8, 3),
    });
    expect(segments).toHaveLength(2);
    expect(isSameDay(segments[0].day, at(2026, 8, 1))).toBe(true);
    expect(segments[0].continuesBefore).toBe(true);
  });

  it('yields one segment for a zero-length event', () => {
    expect(splitIntoDaySegments(ev('x', at(2026, 8, 1, 9), at(2026, 8, 1, 9)))).toHaveLength(1);
  });
});

describe('buildMonthRows', () => {
  const week = (start: Date) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

  it('spans a multi-day event across the days it covers', () => {
    const rows = buildMonthRows([week(at(2026, 7, 31))], [ev('span', at(2026, 8, 1, 9), at(2026, 8, 3, 17))]);
    expect(rows[0].bars).toHaveLength(1);
    expect(rows[0].bars[0].columnStart).toBe(1);
    expect(rows[0].bars[0].span).toBe(3);
    expect(rows[0].bars[0].lane).toBe(0);
  });

  it('splits a span across a week boundary into two clipped bars', () => {
    const rows = buildMonthRows(
      [week(at(2026, 7, 31)), week(at(2026, 8, 7))],
      [ev('span', at(2026, 8, 5), at(2026, 8, 9))],
    );
    expect(rows[0].bars[0].columnStart).toBe(5);
    expect(rows[0].bars[0].span).toBe(2);
    expect(rows[0].bars[0].continuesAfter).toBe(true);
    expect(rows[1].bars[0].columnStart).toBe(0);
    expect(rows[1].bars[0].span).toBe(2);
    expect(rows[1].bars[0].continuesBefore).toBe(true);
  });

  it('packs non-overlapping bars into the same lane', () => {
    const rows = buildMonthRows(
      [week(at(2026, 7, 31))],
      [ev('a', at(2026, 7, 31), at(2026, 8, 1)), ev('b', at(2026, 8, 3), at(2026, 8, 4))],
    );
    expect(rows[0].bars.map((b) => b.lane)).toEqual([0, 0]);
    expect(rows[0].laneCount).toBe(1);
  });

  it('stacks overlapping bars into separate lanes, longest first', () => {
    const rows = buildMonthRows(
      [week(at(2026, 7, 31))],
      [
        ev('short', at(2026, 8, 1), at(2026, 8, 2)),
        ev('long', at(2026, 8, 1), at(2026, 8, 4)),
        ev('other', at(2026, 8, 1), at(2026, 8, 2)),
      ],
    );
    const byId = Object.fromEntries(rows[0].bars.map((b) => [b.event.id, b.lane]));
    expect(byId.long).toBe(0);
    expect(rows[0].laneCount).toBe(3);
    expect(new Set(Object.values(byId)).size).toBe(3);
  });

  it('ignores events outside the row', () => {
    const rows = buildMonthRows([week(at(2026, 7, 31))], [ev('far', at(2026, 9, 1), at(2026, 9, 2))]);
    expect(rows[0].bars).toHaveLength(0);
    expect(rows[0].laneCount).toBe(0);
  });
});

describe('packTimedLanes', () => {
  it('gives three mutually overlapping events three columns', () => {
    const lanes = packTimedLanes([
      ev('a', at(2026, 8, 1, 9), at(2026, 8, 1, 11)),
      ev('b', at(2026, 8, 1, 9, 30), at(2026, 8, 1, 10, 30)),
      ev('c', at(2026, 8, 1, 10), at(2026, 8, 1, 12)),
    ]);
    expect(lanes).toHaveLength(3);
    for (const lane of lanes) expect(lane.cols).toBe(3);
    expect(new Set(lanes.map((l) => l.col)).size).toBe(3);
  });

  it('keeps disjoint events full width', () => {
    const lanes = packTimedLanes([
      ev('a', at(2026, 8, 1, 9), at(2026, 8, 1, 10)),
      ev('b', at(2026, 8, 1, 11), at(2026, 8, 1, 12)),
    ]);
    expect(lanes.every((l) => l.cols === 1 && l.col === 0)).toBe(true);
  });

  it('reuses a freed column within a cluster', () => {
    // a 9-12, b 9-10, c 10-11 -> b and c share column 1, cluster is 2 wide
    const lanes = packTimedLanes([
      ev('a', at(2026, 8, 1, 9), at(2026, 8, 1, 12)),
      ev('b', at(2026, 8, 1, 9), at(2026, 8, 1, 10)),
      ev('c', at(2026, 8, 1, 10), at(2026, 8, 1, 11)),
    ]);
    const byId = Object.fromEntries(lanes.map((l) => [l.id, l]));
    expect(byId.a.cols).toBe(2);
    expect(byId.b.col).toBe(byId.c.col);
    expect(byId.a.col).not.toBe(byId.b.col);
  });

  it('treats back-to-back events as non-overlapping', () => {
    const lanes = packTimedLanes([
      ev('a', at(2026, 8, 1, 9), at(2026, 8, 1, 10)),
      ev('b', at(2026, 8, 1, 10), at(2026, 8, 1, 11)),
    ]);
    expect(lanes.every((l) => l.cols === 1)).toBe(true);
  });

  it('handles an empty list', () => {
    expect(packTimedLanes([])).toEqual([]);
  });
});

describe('offset <-> time', () => {
  it('maps the top of the grid to minTime', () => {
    expect(timeToOffset(8 * 60, 8, 48)).toBe(0);
    expect(offsetToTime(0, 8, 48, 15)).toBe(480);
  });

  it('round trips on snap boundaries', () => {
    for (const minutes of [480, 495, 510, 570, 1080]) {
      expect(offsetToTime(timeToOffset(minutes, 8, 48), 8, 48, 15)).toBe(minutes);
    }
  });

  it('snaps to the nearest step', () => {
    // 48px/hour -> 12px = 15 minutes; 20px is closer to 30 than to 15 at snap 30
    expect(offsetToTime(20, 0, 48, 30)).toBe(30);
    expect(offsetToTime(10, 0, 48, 30)).toBe(0);
    expect(offsetToTime(10, 0, 48, 15)).toBe(15);
  });

  it('scales with hourHeight', () => {
    expect(timeToOffset(9 * 60, 8, 60)).toBe(60);
    expect(offsetToTime(60, 8, 60, 30)).toBe(540);
  });
});

describe('clampToVisibleWindow', () => {
  it('clips to the window', () => {
    expect(clampToVisibleWindow(6 * 60, 10 * 60, 8, 20)).toEqual({ start: 480, end: 600 });
    expect(clampToVisibleWindow(19 * 60, 23 * 60, 8, 20)).toEqual({ start: 1140, end: 1200 });
  });

  it('returns null when fully outside', () => {
    expect(clampToVisibleWindow(0, 7 * 60, 8, 20)).toBeNull();
    expect(clampToVisibleWindow(21 * 60, 22 * 60, 8, 20)).toBeNull();
  });

  it('keeps at least one minute of height', () => {
    const clipped = clampToVisibleWindow(9 * 60, 9 * 60, 8, 20);
    expect(clipped!.end).toBeGreaterThan(clipped!.start);
  });
});

describe('label formatting', () => {
  it('formats 24h and 12h times', () => {
    expect(formatTimeLabel(9 * 60 + 30, '24h', 'en-GB')).toBe('09:30');
    expect(formatTimeLabel(0, '24h', 'en-GB')).toBe('00:00');
    expect(formatTimeLabel(13 * 60, '12h', 'en-US')).toBe('1:00 PM');
    expect(formatTimeLabel(0, '12h', 'en-US')).toBe('12:00 AM');
  });

  it('formats a month label', () => {
    const range = getVisibleRange('month', at(2026, 8, 15), { weekStartsOn: 1 });
    expect(formatRangeLabel('month', range, at(2026, 8, 15), 'en-GB')).toBe('September 2026');
  });

  it('formats a week label as a span', () => {
    const range = getVisibleRange('week', at(2026, 8, 2), { weekStartsOn: 1 });
    const label = formatRangeLabel('week', range, at(2026, 8, 2), 'en-GB');
    expect(label).toMatch(/31/);
    expect(label).toMatch(/Aug/);
    expect(label).toMatch(/Sep/);
    expect(label).toMatch(/2026/);
  });

  it('formats a day label with the weekday', () => {
    const range = getVisibleRange('day', at(2026, 8, 1));
    const label = formatRangeLabel('day', range, at(2026, 8, 1), 'en-GB');
    expect(label).toMatch(/Tue/);
    expect(label).toMatch(/Sep/);
    expect(label).toMatch(/2026/);
  });

  it('formats an agenda label across the whole span', () => {
    const range = getVisibleRange('agenda', at(2026, 8, 1), { agendaDays: 30 });
    const label = formatRangeLabel('agenda', range, at(2026, 8, 1), 'en-GB');
    expect(label).toMatch(/Sep/);
    expect(label).toMatch(/30/);
  });

  it('formats a day header', () => {
    const header = formatDayHeader(at(2026, 8, 1), 'en-GB');
    expect(header).toMatch(/Tue/);
    expect(header).toMatch(/1/);
  });
});

describe('grouping', () => {
  const events = [
    ev('timed', at(2026, 8, 2, 9), at(2026, 8, 2, 10)),
    ev('allday', at(2026, 8, 2), at(2026, 8, 3), true),
    ev('span', at(2026, 8, 1, 22), at(2026, 8, 3, 2)),
  ];

  it('groups by day and skips empty days', () => {
    const groups = groupByDay(events, { start: at(2026, 8, 1), end: at(2026, 8, 6) });
    expect(groups.map((g) => startOfDay(g.day).getDate())).toEqual([1, 2, 3]);
    expect(groups[1].events).toHaveLength(3);
  });

  it('puts all-day events first within a day', () => {
    const groups = groupByDay(events, { start: at(2026, 8, 2), end: at(2026, 8, 3) });
    expect(groups[0].events[0].id).toBe('allday');
  });

  it('eventsForDay picks just that day', () => {
    expect(eventsForDay(events, at(2026, 8, 3)).map((e) => e.id)).toEqual(['span']);
    expect(eventsForDay(events, at(2026, 8, 5))).toEqual([]);
  });
});

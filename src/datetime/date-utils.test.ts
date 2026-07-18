import { describe, it, expect } from 'vitest';
import {
  addDays,
  addMonths,
  clampDate,
  daysInMonth,
  endOfMonth,
  formatDate,
  formatTime,
  getMonthGrid,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  parseDate,
  parseTime,
  startOfMonth,
} from './date-utils';

describe('getMonthGrid', () => {
  it('always returns 6 rows of 7 days', () => {
    const grid = getMonthGrid(2026, 1); // Feb 2026
    expect(grid).toHaveLength(6);
    for (const row of grid) expect(row).toHaveLength(7);
  });

  it('starts on the Sunday on/before the 1st', () => {
    // Feb 1 2026 is a Sunday, so the grid starts exactly on the 1st
    const feb = getMonthGrid(2026, 1);
    expect(isSameDay(feb[0][0], new Date(2026, 1, 1))).toBe(true);

    // Aug 1 2026 is a Saturday, so the grid starts on Jul 26
    const aug = getMonthGrid(2026, 7);
    expect(isSameDay(aug[0][0], new Date(2026, 6, 26))).toBe(true);
    expect(isSameDay(aug[0][6], new Date(2026, 7, 1))).toBe(true);
  });

  it('spans across a year boundary', () => {
    const dec = getMonthGrid(2026, 11);
    const last = dec[5][6];
    expect(last.getFullYear()).toBe(2027);
    expect(last.getMonth()).toBe(0);
  });

  it('every cell is exactly one day after the previous', () => {
    const grid = getMonthGrid(2024, 1); // leap Feb
    const flat = grid.flat();
    for (let i = 1; i < flat.length; i++) {
      expect(isSameDay(flat[i], addDays(flat[i - 1], 1))).toBe(true);
    }
  });
});

describe('format / parse round trips', () => {
  it('formats with default yyyy-MM-dd', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('formats date-time tokens', () => {
    expect(formatDate(new Date(2026, 6, 18, 9, 5), 'yyyy-MM-dd HH:mm')).toBe('2026-07-18 09:05');
    expect(formatDate(new Date(2026, 6, 18), 'dd/MM/yyyy')).toBe('18/07/2026');
  });

  it('round trips ISO dates', () => {
    const d = new Date(2026, 2, 31);
    const parsed = parseDate(formatDate(d));
    expect(parsed).not.toBeNull();
    expect(isSameDay(parsed!, d)).toBe(true);
  });

  it('round trips date-times', () => {
    const d = new Date(2026, 11, 1, 23, 45);
    const parsed = parseDate(formatDate(d, 'yyyy-MM-dd HH:mm'));
    expect(parsed!.getHours()).toBe(23);
    expect(parsed!.getMinutes()).toBe(45);
    expect(isSameDay(parsed!, d)).toBe(true);
  });

  it('parses yyyy/MM/dd and dd/MM/yyyy', () => {
    expect(isSameDay(parseDate('2026/07/18')!, new Date(2026, 6, 18))).toBe(true);
    expect(isSameDay(parseDate('18/07/2026')!, new Date(2026, 6, 18))).toBe(true);
    expect(isSameDay(parseDate('5/1/2026')!, new Date(2026, 0, 5))).toBe(true); // dd/MM
  });

  it('rejects impossible dates', () => {
    expect(parseDate('2026-13-01')).toBeNull();
    expect(parseDate('2026-02-30')).toBeNull();
    expect(parseDate('32/01/2026')).toBeNull();
    expect(parseDate('2026-01-05 25:00')).toBeNull();
    expect(parseDate('not a date')).toBeNull();
    expect(parseDate('')).toBeNull();
  });

  it('falls back to the Date constructor', () => {
    const parsed = parseDate('Mar 5 2026');
    expect(parsed).not.toBeNull();
    expect(isSameDay(parsed!, new Date(2026, 2, 5))).toBe(true);
  });
});

describe('month math', () => {
  it('addMonths clamps day overflow', () => {
    expect(isSameDay(addMonths(new Date(2026, 0, 31), 1), new Date(2026, 1, 28))).toBe(true);
    expect(isSameDay(addMonths(new Date(2024, 0, 31), 1), new Date(2024, 1, 29))).toBe(true);
    expect(isSameDay(addMonths(new Date(2026, 2, 15), -1), new Date(2026, 1, 15))).toBe(true);
  });

  it('startOfMonth / endOfMonth / daysInMonth', () => {
    expect(isSameDay(startOfMonth(new Date(2026, 6, 18)), new Date(2026, 6, 1))).toBe(true);
    expect(isSameDay(endOfMonth(new Date(2026, 6, 18)), new Date(2026, 6, 31))).toBe(true);
    expect(daysInMonth(2024, 1)).toBe(29);
    expect(daysInMonth(2026, 1)).toBe(28);
  });
});

describe('clamping and comparisons', () => {
  const min = new Date(2026, 0, 10);
  const max = new Date(2026, 0, 20);

  it('clampDate clamps below min and above max', () => {
    expect(clampDate(new Date(2026, 0, 1), min, max)).toBe(min);
    expect(clampDate(new Date(2026, 0, 25), min, max)).toBe(max);
    const inside = new Date(2026, 0, 15);
    expect(clampDate(inside, min, max)).toBe(inside);
  });

  it('day-level comparisons ignore time of day', () => {
    const morning = new Date(2026, 0, 10, 1, 0);
    const night = new Date(2026, 0, 10, 23, 59);
    expect(isBeforeDay(morning, night)).toBe(false);
    expect(isAfterDay(night, morning)).toBe(false);
    expect(isSameDay(morning, night)).toBe(true);
    expect(isBeforeDay(new Date(2026, 0, 9), min)).toBe(true);
    expect(isAfterDay(new Date(2026, 0, 21), max)).toBe(true);
  });
});

describe('time helpers', () => {
  it('parses and formats HH:mm', () => {
    expect(parseTime('09:30')).toEqual({ hours: 9, minutes: 30 });
    expect(parseTime('9:05')).toEqual({ hours: 9, minutes: 5 });
    expect(formatTime(9, 5)).toBe('09:05');
    expect(formatTime(0, 0)).toBe('00:00');
  });

  it('round trips', () => {
    const t = parseTime('23:59')!;
    expect(formatTime(t.hours, t.minutes)).toBe('23:59');
  });

  it('rejects invalid times', () => {
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('12')).toBeNull();
    expect(parseTime('ab:cd')).toBeNull();
  });
});

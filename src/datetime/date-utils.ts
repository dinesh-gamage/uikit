/** Minimal pure date helpers used by the datetime pickers. No external deps. */

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), daysInMonth(d.getFullYear(), d.getMonth()));
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
}

/** Adds months, clamping the day so e.g. Jan 31 + 1 month = Feb 28/29 (not Mar 3). */
export function addMonths(d: Date, n: number): Date {
  const res = new Date(d.getFullYear(), d.getMonth() + n, 1, d.getHours(), d.getMinutes());
  res.setDate(Math.min(d.getDate(), daysInMonth(res.getFullYear(), res.getMonth())));
  return res;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Day-level comparison: is `a` on an earlier calendar day than `b`? */
export function isBeforeDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

/** Day-level comparison: is `a` on a later calendar day than `b`? */
export function isAfterDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

/** Clamps a date into [min, max] at day granularity. */
export function clampDate(d: Date, min?: Date, max?: Date): Date {
  if (min && isBeforeDay(d, min)) return min;
  if (max && isAfterDay(d, max)) return max;
  return d;
}

/** Formats using minimal tokens: yyyy, MM, dd, HH, mm. Everything else is literal. */
export function formatDate(date: Date, format = 'yyyy-MM-dd'): string {
  return format.replace(/yyyy|MM|dd|HH|mm/g, (token) => {
    switch (token) {
      case 'yyyy':
        return String(date.getFullYear()).padStart(4, '0');
      case 'MM':
        return pad2(date.getMonth() + 1);
      case 'dd':
        return pad2(date.getDate());
      case 'HH':
        return pad2(date.getHours());
      default:
        return pad2(date.getMinutes());
    }
  });
}

function buildDate(y: number, mo: number, d: number, h = 0, mi = 0): Date | null {
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo - 1) || h > 23 || mi > 59) return null;
  return new Date(y, mo - 1, d, h, mi);
}

/**
 * Tolerant parser. Accepts ISO-ish `yyyy-MM-dd` / `yyyy/MM/dd` (optional ` HH:mm` or `THH:mm`),
 * `dd/MM/yyyy`, then falls back to the native Date constructor. Returns null when unparseable.
 */
export function parseDate(text: string): Date | null {
  const s = text.trim();
  if (!s) return null;
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?$/.exec(s);
  if (m) return buildDate(+m[1], +m[2], +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s);
  if (m) return buildDate(+m[3], +m[2], +m[1]);
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** 6x7 matrix of days covering the given month (0-based). Weeks start on Sunday. */
export function getMonthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  const grid: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) row.push(addDays(start, w * 7 + i));
    grid.push(row);
  }
  return grid;
}

export interface TimeParts {
  hours: number;
  minutes: number;
}

/** Parses 'HH:mm' (or 'H:mm'). Returns null when invalid. */
export function parseTime(text: string): TimeParts | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
  if (!m) return null;
  const hours = +m[1];
  const minutes = +m[2];
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

export function formatTime(hours: number, minutes: number): string {
  return `${pad2(hours)}:${pad2(minutes)}`;
}

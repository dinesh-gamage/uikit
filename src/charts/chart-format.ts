/**
 * Default number formatting for axis ticks, hover readouts, and legend
 * values -- used by every chart component whenever a caller doesn't pass
 * their own `formatValue`. NaN-safe: renders `'—'` instead of the literal
 * string "NaN". Uses `toLocaleString()` with no forced decimal places so
 * whole numbers stay whole (1234 -> "1,234") and fractional numbers keep
 * their natural precision, up to locale defaults (1234.5 -> "1,234.5").
 */
export function defaultFormatValue(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString();
}

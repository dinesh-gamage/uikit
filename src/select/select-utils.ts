import type { SelectOption } from '../types';

/** Plain-text representation of an option, used for filtering. Non-string labels fall back to the value. */
export function optionText(option: SelectOption): string {
  const { label } = option;
  if (typeof label === 'string') return label;
  if (typeof label === 'number') return String(label);
  return String(option.value);
}

/** Case-insensitive substring filter on option labels. An empty/blank query returns everything. */
export function filterOptions(options: SelectOption[], query: string): SelectOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => optionText(o).toLowerCase().includes(q));
}

/**
 * Next enabled option index moving `delta` from `start`, wrapping around.
 * `start` may be out of range: -1 with delta 1 finds the first enabled option,
 * `options.length` with delta -1 finds the last enabled option.
 * Returns -1 when there is no enabled option.
 */
export function findNextEnabledIndex(options: SelectOption[], start: number, delta: 1 | -1): number {
  const n = options.length;
  if (n === 0) return -1;
  // Out-of-range starts probe from the matching edge: first option for delta 1, last for delta -1.
  const i0 = start < 0 || start >= n ? (delta === 1 ? n - 1 : 0) : start;
  let i = i0;
  for (let step = 0; step < n; step++) {
    i = (i + delta + n) % n;
    if (!options[i].disabled) return i;
  }
  return -1;
}

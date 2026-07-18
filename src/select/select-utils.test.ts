import { describe, expect, it } from 'vitest';
import type { SelectOption } from '../types';
import { filterOptions, findNextEnabledIndex, optionText } from './select-utils';

const opt = (value: string | number, label?: SelectOption['label'], disabled?: boolean): SelectOption => ({
  value,
  label: label ?? String(value),
  disabled,
});

describe('optionText', () => {
  it('uses string labels', () => {
    expect(optionText(opt('fr', 'France'))).toBe('France');
  });

  it('uses numeric labels', () => {
    expect(optionText(opt('a', 42))).toBe('42');
  });

  it('falls back to the value for non-text labels', () => {
    expect(optionText({ value: 'fr', label: null })).toBe('fr');
  });
});

describe('filterOptions', () => {
  const options = [opt('fr', 'France'), opt('de', 'Germany'), opt('lk', 'Sri Lanka'), opt('nz', 'New Zealand')];

  it('returns everything for an empty or blank query', () => {
    expect(filterOptions(options, '')).toEqual(options);
    expect(filterOptions(options, '   ')).toEqual(options);
  });

  it('filters case-insensitively by label substring', () => {
    expect(filterOptions(options, 'GERM').map((o) => o.value)).toEqual(['de']);
    expect(filterOptions(options, 'an').map((o) => o.value)).toEqual(['fr', 'de', 'lk', 'nz']);
    expect(filterOptions(options, 'lanka').map((o) => o.value)).toEqual(['lk']);
  });

  it('trims the query', () => {
    expect(filterOptions(options, '  france ').map((o) => o.value)).toEqual(['fr']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterOptions(options, 'atlantis')).toEqual([]);
  });
});

describe('findNextEnabledIndex', () => {
  const options = [opt(0), opt(1, undefined, true), opt(2), opt(3, undefined, true), opt(4)];

  it('moves forward to the next enabled option, skipping disabled ones', () => {
    expect(findNextEnabledIndex(options, 0, 1)).toBe(2);
    expect(findNextEnabledIndex(options, 2, 1)).toBe(4);
  });

  it('moves backward to the previous enabled option, skipping disabled ones', () => {
    expect(findNextEnabledIndex(options, 4, -1)).toBe(2);
    expect(findNextEnabledIndex(options, 2, -1)).toBe(0);
  });

  it('wraps from the end back to the start', () => {
    expect(findNextEnabledIndex(options, 4, 1)).toBe(0);
  });

  it('wraps from the start back to the end', () => {
    expect(findNextEnabledIndex(options, 0, -1)).toBe(4);
  });

  it('wraps across disabled options at the edges', () => {
    const edgeDisabled = [opt(0, undefined, true), opt(1), opt(2, undefined, true)];
    expect(findNextEnabledIndex(edgeDisabled, 1, 1)).toBe(1); // only enabled option, full wrap
    expect(findNextEnabledIndex(edgeDisabled, 1, -1)).toBe(1);
  });

  it('finds the first enabled option from start = -1 (Home)', () => {
    expect(findNextEnabledIndex(options, -1, 1)).toBe(0);
    expect(findNextEnabledIndex([opt(0, undefined, true), opt(1)], -1, 1)).toBe(1);
  });

  it('finds the last enabled option from start = length (End)', () => {
    expect(findNextEnabledIndex(options, options.length, -1)).toBe(4);
    expect(findNextEnabledIndex([opt(0), opt(1, undefined, true)], 2, -1)).toBe(0);
  });

  it('returns -1 when every option is disabled', () => {
    expect(findNextEnabledIndex([opt(0, undefined, true), opt(1, undefined, true)], 0, 1)).toBe(-1);
  });

  it('returns -1 for an empty list', () => {
    expect(findNextEnabledIndex([], 0, 1)).toBe(-1);
    expect(findNextEnabledIndex([], -1, 1)).toBe(-1);
  });
});

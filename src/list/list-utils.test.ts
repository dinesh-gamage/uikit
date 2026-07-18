import { describe, expect, it } from 'vitest';
import { applyQuery, applySort, paginate } from './list-utils';

interface Row {
  id: number;
  name: string;
  city: string | null;
  age: number | null;
  [key: string]: any;
}

const rows: Row[] = [
  { id: 1, name: 'Ava Perera', city: 'Colombo', age: 34 },
  { id: 2, name: 'Liam Silva', city: 'Berlin', age: 28 },
  { id: 3, name: 'Maya Khan', city: null, age: null },
  { id: 4, name: 'Noah Patel', city: 'colombo south', age: 41 },
];

describe('applyQuery', () => {
  it('returns the same array for an empty or whitespace query', () => {
    expect(applyQuery(rows, '')).toBe(rows);
    expect(applyQuery(rows, '   ')).toBe(rows);
  });

  it('matches case-insensitively as a substring', () => {
    expect(applyQuery(rows, 'COLOMBO').map((r) => r.id)).toEqual([1, 4]);
    expect(applyQuery(rows, 'silva').map((r) => r.id)).toEqual([2]);
  });

  it('trims the query', () => {
    expect(applyQuery(rows, '  silva  ').map((r) => r.id)).toEqual([2]);
  });

  it('restricts matching to the given fields', () => {
    expect(applyQuery(rows, 'colombo', ['name']).map((r) => r.id)).toEqual([]);
    expect(applyQuery(rows, 'colombo', ['city']).map((r) => r.id)).toEqual([1, 4]);
  });

  it('searches every field when fields are omitted', () => {
    expect(applyQuery(rows, '41').map((r) => r.id)).toEqual([4]);
  });

  it('skips null values without throwing', () => {
    expect(applyQuery(rows, 'anything', ['city']).map((r) => r.id)).toEqual([]);
  });
});

describe('applySort', () => {
  it('returns the same array when sort is null', () => {
    expect(applySort(rows, null)).toBe(rows);
  });

  it('does not mutate the input', () => {
    const before = rows.map((r) => r.id);
    applySort(rows, { field: 'name', dir: 'desc' });
    expect(rows.map((r) => r.id)).toEqual(before);
  });

  it('sorts strings ascending and descending', () => {
    expect(applySort(rows, { field: 'name', dir: 'asc' }).map((r) => r.id)).toEqual([1, 2, 3, 4]);
    expect(applySort(rows, { field: 'name', dir: 'desc' }).map((r) => r.id)).toEqual([4, 3, 2, 1]);
  });

  it('sorts numbers numerically', () => {
    expect(applySort(rows, { field: 'age', dir: 'asc' }).map((r) => r.age)).toEqual([28, 34, 41, null]);
    expect(applySort(rows, { field: 'age', dir: 'desc' }).map((r) => r.age)).toEqual([41, 34, 28, null]);
  });

  it('always sorts null values last', () => {
    const asc = applySort(rows, { field: 'city', dir: 'asc' });
    const desc = applySort(rows, { field: 'city', dir: 'desc' });
    expect(asc[asc.length - 1].id).toBe(3);
    expect(desc[desc.length - 1].id).toBe(3);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 45 }, (_, i) => i + 1);

  it('returns the first page', () => {
    const page = paginate(items, 1, 20);
    expect(page.items[0]).toBe(1);
    expect(page.items).toHaveLength(20);
    expect(page.total).toBe(45);
  });

  it('returns a middle page', () => {
    const page = paginate(items, 2, 20);
    expect(page.items[0]).toBe(21);
    expect(page.items).toHaveLength(20);
  });

  it('returns a partial last page', () => {
    const page = paginate(items, 3, 20);
    expect(page.items).toEqual([41, 42, 43, 44, 45]);
  });

  it('returns empty items for an out-of-range page but keeps total', () => {
    const page = paginate(items, 4, 20);
    expect(page.items).toEqual([]);
    expect(page.total).toBe(45);
  });

  it('handles an empty list', () => {
    expect(paginate([], 1, 20)).toEqual({ items: [], total: 0 });
  });
});

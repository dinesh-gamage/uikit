import { describe, expect, it } from 'vitest';
import {
  allowedMoveColumns,
  applyCardSort,
  computeDropIndex,
  groupCardsByColumn,
  indexToBeforeCardId,
  isDropBlocked,
  type CardRect,
  type KanbanColumn,
} from './kanban-utils';

describe('computeDropIndex', () => {
  it('returns 0 for an empty column', () => {
    expect(computeDropIndex(100, [])).toBe(0);
  });

  it('returns 0 when the pointer is above the first card midpoint', () => {
    const rects: CardRect[] = [
      { id: 'a', top: 100, height: 40 },
      { id: 'b', top: 150, height: 40 },
    ];
    expect(computeDropIndex(90, rects)).toBe(0);
  });

  it('returns the index between two cards', () => {
    const rects: CardRect[] = [
      { id: 'a', top: 0, height: 40 }, // midpoint 20
      { id: 'b', top: 40, height: 40 }, // midpoint 60
      { id: 'c', top: 80, height: 40 }, // midpoint 100
    ];
    expect(computeDropIndex(50, rects)).toBe(1);
    expect(computeDropIndex(70, rects)).toBe(2);
  });

  it('returns rects.length when the pointer is below the last card midpoint', () => {
    const rects: CardRect[] = [
      { id: 'a', top: 0, height: 40 },
      { id: 'b', top: 40, height: 40 },
    ];
    expect(computeDropIndex(1000, rects)).toBe(2);
  });

  it('treats an exact midpoint match as landing after that card', () => {
    const rects: CardRect[] = [{ id: 'a', top: 0, height: 40 }]; // midpoint 20
    expect(computeDropIndex(20, rects)).toBe(1);
  });
});

describe('indexToBeforeCardId', () => {
  const ids = ['a', 'b', 'c'];

  it('returns the id at the index when within range', () => {
    expect(indexToBeforeCardId(ids, 0)).toBe('a');
    expect(indexToBeforeCardId(ids, 1)).toBe('b');
  });

  it('returns null at the end of the list', () => {
    expect(indexToBeforeCardId(ids, 3)).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(indexToBeforeCardId([], 0)).toBeNull();
  });
});

describe('applyCardSort', () => {
  interface Card {
    id: string;
    rank: number;
  }
  const cards: Card[] = [
    { id: 'b', rank: 2 },
    { id: 'a', rank: 1 },
    { id: 'c', rank: 3 },
  ];

  it('returns the same array reference when no comparator is given', () => {
    expect(applyCardSort(cards)).toBe(cards);
  });

  it('sorts by the comparator without mutating the input', () => {
    const before = cards.map((c) => c.id);
    const sorted = applyCardSort(cards, (a, b) => a.rank - b.rank);
    expect(sorted.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(cards.map((c) => c.id)).toEqual(before);
  });
});

describe('groupCardsByColumn', () => {
  interface Card {
    id: string;
    column: string;
    rank: number;
  }
  const columns: KanbanColumn[] = [
    { id: 'todo', title: 'To do' },
    { id: 'doing', title: 'Doing' },
    { id: 'done', title: 'Done' },
  ];
  const cards: Card[] = [
    { id: '1', column: 'todo', rank: 2 },
    { id: '2', column: 'doing', rank: 1 },
    { id: '3', column: 'todo', rank: 1 },
    { id: '4', column: 'unknown-column', rank: 1 },
  ];

  it('groups cards under their column id', () => {
    const groups = groupCardsByColumn(cards, columns, (c) => c.column);
    expect(groups.todo.map((c) => c.id)).toEqual(['1', '3']);
    expect(groups.doing.map((c) => c.id)).toEqual(['2']);
    expect(groups.done).toEqual([]);
  });

  it('drops cards whose column id is not a known column', () => {
    const groups = groupCardsByColumn(cards, columns, (c) => c.column);
    const allIds = Object.values(groups).flatMap((g) => g.map((c) => c.id));
    expect(allIds).not.toContain('4');
  });

  it('applies the sort comparator within each column', () => {
    const groups = groupCardsByColumn(cards, columns, (c) => c.column, (a, b) => a.rank - b.rank);
    expect(groups.todo.map((c) => c.id)).toEqual(['3', '1']);
  });

  it('every column key exists even when empty', () => {
    const groups = groupCardsByColumn([] as Card[], columns, (c) => c.column);
    expect(Object.keys(groups)).toEqual(['todo', 'doing', 'done']);
  });
});

describe('allowedMoveColumns', () => {
  const columns: KanbanColumn[] = [
    { id: 'todo', title: 'To do' },
    { id: 'doing', title: 'Doing' },
    { id: 'done', title: 'Done' },
  ];
  const card = { id: '1' };

  it('excludes the current column', () => {
    const result = allowedMoveColumns(columns, card, 'todo');
    expect(result.map((c) => c.id)).toEqual(['doing', 'done']);
  });

  it('filters by canDrop', () => {
    const result = allowedMoveColumns(columns, card, 'todo', (_c, to) => to !== 'done');
    expect(result.map((c) => c.id)).toEqual(['doing']);
  });

  it('returns all other columns when canDrop is omitted', () => {
    const result = allowedMoveColumns(columns, card, 'doing');
    expect(result.map((c) => c.id)).toEqual(['todo', 'done']);
  });
});

describe('isDropBlocked', () => {
  const card = { id: '1' };

  it('is never blocked for the same column, regardless of canDrop', () => {
    expect(isDropBlocked(card, 'todo', 'todo', () => false)).toBe(false);
  });

  it('is not blocked when canDrop is omitted', () => {
    expect(isDropBlocked(card, 'todo', 'done')).toBe(false);
  });

  it('is blocked when canDrop returns false for a different column', () => {
    expect(isDropBlocked(card, 'todo', 'done', (_c, to) => to !== 'done')).toBe(true);
  });

  it('is not blocked when canDrop returns true for a different column', () => {
    expect(isDropBlocked(card, 'todo', 'doing', (_c, to) => to !== 'done')).toBe(false);
  });
});

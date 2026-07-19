export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  hint?: string;
}

export interface CardRect {
  id: string;
  top: number;
  height: number;
}

/**
 * Given the pointer's Y position (viewport coordinates, matching `getBoundingClientRect`) and
 * the rects of the cards currently droppable in a column — in visual top-to-bottom order, with
 * the card being dragged already excluded by the caller — returns the index the dragged card
 * would land at: 0 above the first card, `rects.length` below the last, and otherwise the index
 * of the first card whose vertical midpoint is below the pointer.
 */
export function computeDropIndex(pointerY: number, rects: CardRect[]): number {
  for (let i = 0; i < rects.length; i++) {
    const mid = rects[i].top + rects[i].height / 2;
    if (pointerY < mid) return i;
  }
  return rects.length;
}

/**
 * Converts a drop index (as returned by `computeDropIndex`) plus the ordered ids of the cards
 * droppable in that column into the `onCardMove` `beforeCardId` contract: the id of the card the
 * dragged card was dropped above, or `null` for the end of the column.
 */
export function indexToBeforeCardId(orderedIds: string[], index: number): string | null {
  return index < orderedIds.length ? orderedIds[index] : null;
}

/**
 * Non-mutating stable sort. Returns the input array unchanged (same reference) when no
 * comparator is given.
 */
export function applyCardSort<T>(cards: T[], cardSort?: (a: T, b: T) => number): T[] {
  if (!cardSort) return cards;
  return [...cards].sort(cardSort);
}

/** Groups cards by column id (dropping cards whose column id isn't in `columns`), sorted within each column. */
export function groupCardsByColumn<T>(
  cards: T[],
  columns: KanbanColumn[],
  cardColumn: (card: T) => string,
  cardSort?: (a: T, b: T) => number,
): Record<string, T[]> {
  const knownIds = new Set(columns.map((c) => c.id));
  const groups: Record<string, T[]> = {};
  for (const column of columns) groups[column.id] = [];
  for (const card of cards) {
    const colId = cardColumn(card);
    if (knownIds.has(colId)) groups[colId].push(card);
  }
  for (const column of columns) groups[column.id] = applyCardSort(groups[column.id], cardSort);
  return groups;
}

/**
 * Columns a card may be moved to from its current column via the accessible move menu — every
 * other column, filtered by `canDrop` when given.
 */
export function allowedMoveColumns<T>(
  columns: KanbanColumn[],
  card: T,
  currentColumnId: string,
  canDrop?: (card: T, toColumn: string) => boolean,
): KanbanColumn[] {
  return columns.filter((c) => c.id !== currentColumnId && (!canDrop || canDrop(card, c.id)));
}

/**
 * Whether a drag currently hovering `toColumn` should show the blocked treatment. Same-column
 * hover (reordering within the source column) is never blocked — `canDrop` governs workflow
 * transitions between columns, not intra-column ordering.
 */
export function isDropBlocked<T>(
  card: T,
  fromColumn: string,
  toColumn: string,
  canDrop?: (card: T, toColumn: string) => boolean,
): boolean {
  if (toColumn === fromColumn) return false;
  return canDrop ? !canDrop(card, toColumn) : false;
}

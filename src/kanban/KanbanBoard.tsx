import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils/cx';
import { Dropdown } from '../dropdown';
import {
  allowedMoveColumns,
  computeDropIndex,
  groupCardsByColumn,
  indexToBeforeCardId,
  isDropBlocked,
  type CardRect,
  type KanbanColumn,
} from './kanban-utils';
import './kanban.scss';

export type { KanbanColumn };

export interface KanbanCardMoveArgs {
  cardId: string;
  fromColumn: string;
  toColumn: string;
  /** Card it was dropped ABOVE; null means the end of the column. */
  beforeCardId: string | null;
}

export interface KanbanBoardProps<T> {
  columns: KanbanColumn[];
  cards: T[];
  cardId: (card: T) => string;
  /** Which column a card is in. */
  cardColumn: (card: T) => string;
  /** Order within a column (e.g. rank strings). */
  cardSort?: (a: T, b: T) => number;
  /** Card body; the board wraps it in the draggable shell. */
  renderCard: (card: T) => ReactNode;
  /** Controlled: the parent updates state; the board renders from props only. */
  onCardMove: (args: KanbanCardMoveArgs) => void;
  /** Workflow transition enforcement — invalid targets get a 'blocked' treatment during drag and refuse the drop. */
  canDrop?: (card: T, toColumn: string) => boolean;
  onCardClick?: (card: T) => void;
  /** e.g. an 'Add task' button slot. */
  columnFooter?: (column: KanbanColumn) => ReactNode;
  emptyColumnMessage?: string;
  /** Default '100%' — the board fills its parent, columns scroll internally. */
  height?: string;
  className?: string;
}

const DRAG_THRESHOLD = 6;

interface DragState {
  cardId: string;
  fromColumn: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  overColumn: string | null;
  dropIndex: number | null;
  beforeCardId: string | null;
  blocked: boolean;
}

function MenuDotsIcon() {
  return (
    <svg viewBox="0 0 4 16" width="4" height="14" aria-hidden="true" focusable="false">
      <circle cx="2" cy="2" r="1.6" fill="currentColor" />
      <circle cx="2" cy="8" r="1.6" fill="currentColor" />
      <circle cx="2" cy="14" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function KanbanBoard<T>(props: KanbanBoardProps<T>) {
  const {
    columns,
    cards,
    cardId: cardIdFn,
    cardColumn: cardColumnFn,
    cardSort,
    renderCard,
    onCardMove,
    canDrop,
    onCardClick,
    columnFooter,
    emptyColumnMessage = 'No cards',
    height = '100%',
    className,
  } = props;

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [menuOpenCardId, setMenuOpenCardId] = useState<string | null>(null);

  const suppressClickRef = useRef(false);
  const menuAnchorRef = useRef<HTMLElement | null>(null);
  const columnBodyRefs = useRef(new Map<string, HTMLDivElement>());

  const grouped = groupCardsByColumn(cards, columns, cardColumnFn, cardSort);
  const draggedCard = dragState ? (cards.find((c) => cardIdFn(c) === dragState.cardId) ?? null) : null;
  const menuCard = menuOpenCardId != null ? (cards.find((c) => cardIdFn(c) === menuOpenCardId) ?? null) : null;

  const setColumnBodyRef = (columnId: string) => (el: HTMLDivElement | null) => {
    if (el) columnBodyRefs.current.set(columnId, el);
    else columnBodyRefs.current.delete(columnId);
  };

  /** Resolves the column + drop position under a viewport point, excluding the dragged card itself. */
  const resolveDropTarget = (draggedId: string, fromColumn: string, card: T, clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const columnEl = el ? (el as Element).closest<HTMLElement>('[data-kanban-column-id]') : null;
    const overColumn = columnEl?.getAttribute('data-kanban-column-id') ?? null;
    if (!overColumn) return { overColumn: null, dropIndex: null, beforeCardId: null, blocked: false };

    const bodyEl = columnBodyRefs.current.get(overColumn);
    const rects: CardRect[] = bodyEl
      ? Array.from(bodyEl.querySelectorAll<HTMLElement>('[data-kanban-card-id]'))
          .filter((cardEl) => cardEl.getAttribute('data-kanban-card-id') !== draggedId)
          .map((cardEl) => {
            const r = cardEl.getBoundingClientRect();
            return { id: cardEl.getAttribute('data-kanban-card-id')!, top: r.top, height: r.height };
          })
      : [];
    const dropIndex = computeDropIndex(clientY, rects);
    const beforeCardId = indexToBeforeCardId(rects.map((r) => r.id), dropIndex);
    const blocked = isDropBlocked(card, fromColumn, overColumn, canDrop);
    return { overColumn, dropIndex, beforeCardId, blocked };
  };

  const handleCardPointerDown = (e: ReactPointerEvent<HTMLDivElement>, card: T) => {
    if (e.button !== 0) return;
    const shellEl = e.currentTarget;
    const startX = e.clientX;
    const startY = e.clientY;
    const id = cardIdFn(card);
    const fromColumn = cardColumnFn(card);
    const startRect = shellEl.getBoundingClientRect();
    const offsetX = startX - startRect.left;
    const offsetY = startY - startRect.top;

    let started = false;
    let rafId: number | null = null;
    let pending: { x: number; y: number } | null = null;

    const flush = () => {
      rafId = null;
      if (!pending) return;
      const { x, y } = pending;
      const target = resolveDropTarget(id, fromColumn, card, x, y);
      setDragState({
        cardId: id,
        fromColumn,
        width: startRect.width,
        height: startRect.height,
        offsetX,
        offsetY,
        x,
        y,
        overColumn: target.overColumn,
        dropIndex: target.dropIndex,
        beforeCardId: target.beforeCardId,
        blocked: target.blocked,
      });
    };

    const schedule = (x: number, y: number) => {
      pending = { x, y };
      if (rafId == null) rafId = requestAnimationFrame(flush);
    };

    const cleanup = () => {
      shellEl.removeEventListener('pointermove', onMove);
      shellEl.removeEventListener('pointerup', onUp);
      shellEl.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKeyDown, true);
      if (rafId != null) cancelAnimationFrame(rafId);
    };

    const onMove = (ev: PointerEvent) => {
      if (!started) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        started = true;
        suppressClickRef.current = true;
      }
      schedule(ev.clientX, ev.clientY);
    };

    const onUp = (ev: PointerEvent) => {
      cleanup();
      if (!started) {
        setDragState(null);
        return;
      }
      const target = resolveDropTarget(id, fromColumn, card, ev.clientX, ev.clientY);
      if (target.overColumn && !target.blocked) {
        onCardMove({ cardId: id, fromColumn, toColumn: target.overColumn, beforeCardId: target.beforeCardId });
      }
      setDragState(null);
    };

    const onCancel = () => {
      cleanup();
      setDragState(null);
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && started) {
        ev.stopPropagation();
        cleanup();
        setDragState(null);
      }
    };

    try {
      shellEl.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture can fail in some test/embedded environments — dragging still works via
      // the listeners below since pointermove keeps bubbling to this element while hovered.
    }
    shellEl.addEventListener('pointermove', onMove);
    shellEl.addEventListener('pointerup', onUp);
    shellEl.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKeyDown, true);
  };

  const handleCardClick = (card: T) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onCardClick?.(card);
  };

  const openMoveMenu = (e: ReactMouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    menuAnchorRef.current = e.currentTarget;
    setMenuOpenCardId((cur) => (cur === id ? null : id));
  };

  const renderCardShell = (card: T) => {
    const id = cardIdFn(card);
    const isDragging = dragState?.cardId === id;
    return (
      <div
        key={id}
        className={cx('uikit-kanban__card', { 'uikit-kanban__card--dragging': isDragging })}
        data-kanban-card-id={id}
        onPointerDown={(e) => handleCardPointerDown(e, card)}
        onClick={() => handleCardClick(card)}
      >
        <div className="uikit-kanban__card-body">{renderCard(card)}</div>
        <button
          type="button"
          className="uikit-kanban__card-menu-trigger"
          aria-label="Move card"
          aria-haspopup="menu"
          aria-expanded={menuOpenCardId === id}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => openMoveMenu(e, id)}
        >
          <MenuDotsIcon />
        </button>
      </div>
    );
  };

  const renderColumnCards = (column: KanbanColumn, columnCards: T[]) => {
    const isOverThisColumn = dragState?.overColumn === column.id;
    const showIndicator = isOverThisColumn && !dragState!.blocked;
    const dropIndex = dragState?.dropIndex ?? null;

    const nodes: ReactNode[] = [];
    let targetIdx = 0;
    for (const card of columnCards) {
      const id = cardIdFn(card);
      if (showIndicator && dropIndex === targetIdx) {
        nodes.push(<div className="uikit-kanban__insertion" key={`insertion-${targetIdx}`} aria-hidden="true" />);
      }
      nodes.push(renderCardShell(card));
      if (id !== dragState?.cardId) targetIdx++;
    }
    if (showIndicator && dropIndex === targetIdx) {
      nodes.push(<div className="uikit-kanban__insertion" key="insertion-end" aria-hidden="true" />);
    }
    return nodes;
  };

  return (
    <div className={cx('uikit-kanban', className)} style={{ height }}>
      <div className="uikit-kanban__columns">
        {columns.map((column) => {
          const columnCards = grouped[column.id] ?? [];
          const isOver = dragState?.overColumn === column.id;
          const blocked = dragState && draggedCard ? isDropBlocked(draggedCard, dragState.fromColumn, column.id, canDrop) : false;

          return (
            <div
              key={column.id}
              data-kanban-column-id={column.id}
              className={cx('uikit-kanban__column', {
                'uikit-kanban__column--over': !!dragState && isOver && !blocked,
                'uikit-kanban__column--blocked': !!dragState && blocked,
              })}
            >
              <div className="uikit-kanban__column-header">
                <div className="uikit-kanban__column-title-group">
                  {column.color && (
                    <span className="uikit-kanban__column-dot" style={{ background: column.color }} aria-hidden="true" />
                  )}
                  <span className="uikit-kanban__column-title">{column.title}</span>
                  <span className="uikit-kanban__column-count">{columnCards.length}</span>
                </div>
                {column.hint && <span className="uikit-kanban__column-hint">{column.hint}</span>}
              </div>

              <div className="uikit-kanban__column-body" ref={setColumnBodyRef(column.id)}>
                {columnCards.length === 0 && !isOver ? (
                  <div className="uikit-kanban__empty">{emptyColumnMessage}</div>
                ) : (
                  renderColumnCards(column, columnCards)
                )}
              </div>

              {columnFooter && <div className="uikit-kanban__column-footer">{columnFooter(column)}</div>}
            </div>
          );
        })}
      </div>

      {dragState &&
        draggedCard &&
        createPortal(
          <div
            className="uikit-kanban__ghost"
            style={{
              left: dragState.x - dragState.offsetX,
              top: dragState.y - dragState.offsetY,
              width: dragState.width,
              height: dragState.height,
            }}
            aria-hidden="true"
          >
            <div className="uikit-kanban__card uikit-kanban__card--ghost">
              <div className="uikit-kanban__card-body">{renderCard(draggedCard)}</div>
            </div>
          </div>,
          document.body,
        )}

      {menuCard && (
        <Dropdown open onClose={() => setMenuOpenCardId(null)} anchorRef={menuAnchorRef} position="bottom-end" minWidth={180}>
          <div className="uikit-kanban__move-menu" role="menu">
            {allowedMoveColumns(columns, menuCard, cardColumnFn(menuCard), canDrop).map((col) => (
              <button
                key={col.id}
                type="button"
                role="menuitem"
                className="uikit-kanban__move-menu-item"
                onClick={() => {
                  onCardMove({
                    cardId: cardIdFn(menuCard),
                    fromColumn: cardColumnFn(menuCard),
                    toColumn: col.id,
                    beforeCardId: null,
                  });
                  setMenuOpenCardId(null);
                }}
              >
                Move to {col.title}
              </button>
            ))}
            {allowedMoveColumns(columns, menuCard, cardColumnFn(menuCard), canDrop).length === 0 && (
              <div className="uikit-kanban__move-menu-empty">No available columns</div>
            )}
          </div>
        </Dropdown>
      )}
    </div>
  );
}

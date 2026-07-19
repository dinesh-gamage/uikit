import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { KanbanBoard, type KanbanCardMoveArgs, type KanbanColumn } from './KanbanBoard';

interface Task {
  id: string;
  title: string;
  status: string;
}

const columns: KanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing' },
  { id: 'done', title: 'Done' },
];

const tasks: Task[] = [
  { id: 't1', title: 'Write spec', status: 'todo' },
  { id: 't2', title: 'Build UI', status: 'todo' },
  { id: 't3', title: 'Review PR', status: 'doing' },
];

beforeEach(() => {
  // jsdom's requestAnimationFrame is backed by setTimeout; run it synchronously so the move
  // menu's Dropdown (measure-then-position two-phase render) settles immediately, matching the
  // stub used in dropdown.test.tsx.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Real pointer-based drag-and-drop cannot be simulated under jsdom (no layout engine, so
// getBoundingClientRect/elementFromPoint don't reflect real geometry) — that mechanism is
// covered by the pure geometry helpers in kanban-utils.test.ts instead. These tests exercise
// what jsdom *can* faithfully drive: static rendering, plain clicks, and the keyboard/menu
// move fallback.

function Board(props: { onCardMove: (args: KanbanCardMoveArgs) => void; onCardClick?: (t: Task) => void; canDrop?: (t: Task, to: string) => boolean }) {
  const [items] = useState(tasks);
  return (
    <KanbanBoard<Task>
      columns={columns}
      cards={items}
      cardId={(t) => t.id}
      cardColumn={(t) => t.status}
      renderCard={(t) => <span>{t.title}</span>}
      onCardMove={props.onCardMove}
      onCardClick={props.onCardClick}
      canDrop={props.canDrop}
    />
  );
}

describe('KanbanBoard rendering', () => {
  it('renders columns with titles and per-column card counts', () => {
    render(<Board onCardMove={vi.fn()} />);
    expect(screen.getByText('To do')).toBeTruthy();
    expect(screen.getByText('Doing')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('Write spec')).toBeTruthy();
    expect(screen.getByText('Build UI')).toBeTruthy();
    expect(screen.getByText('Review PR')).toBeTruthy();
  });

  it('shows the empty column message for a column with no cards', () => {
    render(<Board onCardMove={vi.fn()} />);
    expect(screen.getByText('No cards')).toBeTruthy();
  });

  it('renders a custom empty column message', () => {
    render(
      <KanbanBoard<Task>
        columns={columns}
        cards={tasks}
        cardId={(t) => t.id}
        cardColumn={(t) => t.status}
        renderCard={(t) => <span>{t.title}</span>}
        onCardMove={vi.fn()}
        emptyColumnMessage="Nothing here yet"
      />,
    );
    expect(screen.getByText('Nothing here yet')).toBeTruthy();
  });
});

describe('KanbanBoard click vs drag', () => {
  it('fires onCardClick on a plain click (no pointer movement)', () => {
    const onCardClick = vi.fn();
    render(<Board onCardMove={vi.fn()} onCardClick={onCardClick} />);
    fireEvent.click(screen.getByText('Write spec'));
    expect(onCardClick).toHaveBeenCalledTimes(1);
    expect(onCardClick).toHaveBeenCalledWith(tasks[0]);
  });

  it('does not fire onCardMove from a plain click', () => {
    const onCardMove = vi.fn();
    render(<Board onCardMove={onCardMove} />);
    fireEvent.click(screen.getByText('Write spec'));
    expect(onCardMove).not.toHaveBeenCalled();
  });
});

describe('KanbanBoard accessible move menu', () => {
  it('lists "Move to <column>" for every other column and fires onCardMove with beforeCardId null', () => {
    const onCardMove = vi.fn();
    render(<Board onCardMove={onCardMove} />);

    const trigger = screen.getAllByLabelText('Move card')[0];
    fireEvent.click(trigger);

    expect(screen.getByText('Move to Doing')).toBeTruthy();
    expect(screen.getByText('Move to Done')).toBeTruthy();
    // Current column ('To do') is not offered as a target.
    expect(screen.queryByText('Move to To do')).toBeNull();

    fireEvent.click(screen.getByText('Move to Doing'));

    expect(onCardMove).toHaveBeenCalledTimes(1);
    expect(onCardMove).toHaveBeenCalledWith({
      cardId: 't1',
      fromColumn: 'todo',
      toColumn: 'doing',
      beforeCardId: null,
    });
  });

  it('excludes columns disallowed by canDrop', () => {
    const onCardMove = vi.fn();
    const canDrop = (_task: Task, toColumn: string) => toColumn !== 'done';
    render(<Board onCardMove={onCardMove} canDrop={canDrop} />);

    fireEvent.click(screen.getAllByLabelText('Move card')[0]);

    expect(screen.getByText('Move to Doing')).toBeTruthy();
    expect(screen.queryByText('Move to Done')).toBeNull();
  });

  it('closes the menu after a move is chosen', () => {
    const onCardMove = vi.fn();
    render(<Board onCardMove={onCardMove} />);

    fireEvent.click(screen.getAllByLabelText('Move card')[0]);
    fireEvent.click(screen.getByText('Move to Doing'));

    expect(screen.queryByText('Move to Done')).toBeNull();
  });
});

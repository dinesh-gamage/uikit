import { useState } from 'react';
import { KanbanBoard, type KanbanCardMoveArgs, type KanbanColumn } from '../../src/kanban';
import { Chip } from '../../src/chip';
import { toast } from '../../src/toast';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './demo-widgets.scss';

interface Task {
  id: string;
  title: string;
  status: string;
  rank: number;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
}

const COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', color: '#99a1ad' },
  { id: 'in-progress', title: 'In Progress', color: '#4f6df5', hint: 'WIP' },
  { id: 'review', title: 'Review', color: '#f5a623' },
  { id: 'done', title: 'Done', color: '#30a46c' },
];

const PRIORITY_TONE: Record<Task['priority'], 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

function initialTasks(): Task[] {
  const seed: Array<[string, string, Task['priority'], string]> = [
    ['Draft onboarding flow', 'backlog', 'medium', 'AP'],
    ['Audit color contrast', 'backlog', 'low', 'LS'],
    ['Spike: offline sync', 'backlog', 'high', 'MK'],
    ['Wire up billing webhook', 'in-progress', 'high', 'NP'],
    ['Refactor auth middleware', 'in-progress', 'medium', 'AP'],
    ['Update empty states', 'in-progress', 'low', 'ZR'],
    ['Review invoice PDF export', 'review', 'medium', 'LS'],
    ['Review search relevance', 'review', 'high', 'MK'],
    ['Ship dark mode toggle', 'done', 'medium', 'NP'],
    ['Fix pagination off-by-one', 'done', 'low', 'ZR'],
  ];
  return seed.map(([title, status, priority, assignee], i) => ({
    id: `task-${i + 1}`,
    title,
    status,
    priority,
    assignee,
    rank: i,
  }));
}

// Reassigns sequential ranks within the destination column after a move, so `cardSort` (which
// just orders by `rank`) reflects the new position. A real app would likely use fractional/rank
// strings to avoid rewriting every row, but integer ranks keep this demo's intent obvious.
function applyMove(tasks: Task[], { cardId, toColumn, beforeCardId }: KanbanCardMoveArgs): Task[] {
  const moving = tasks.find((t) => t.id === cardId);
  if (!moving) return tasks;

  const destination = tasks
    .filter((t) => t.status === toColumn && t.id !== cardId)
    .sort((a, b) => a.rank - b.rank);
  const insertAt = beforeCardId ? destination.findIndex((t) => t.id === beforeCardId) : -1;
  const at = insertAt === -1 ? destination.length : insertAt;
  destination.splice(at, 0, { ...moving, status: toColumn });

  const rankById = new Map(destination.map((t, i) => [t.id, i]));
  return tasks.map((t) => (rankById.has(t.id) ? { ...t, status: toColumn, rank: rankById.get(t.id)! } : t));
}

function addTask(tasks: Task[], column: string): Task[] {
  const count = tasks.filter((t) => t.status === column).length;
  const task: Task = {
    id: `task-${Date.now()}`,
    title: `New task ${count + 1}`,
    status: column,
    priority: 'medium',
    assignee: '—',
    rank: count,
  };
  return [...tasks, task];
}

function Preview() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Workflow rule: a card straight out of Backlog can't jump directly to Done — it has to pass
  // through In Progress or Review first. Dragging a Backlog card over Done shows the blocked
  // treatment (dimmed column, not-allowed cursor) and the drop is refused; the same rule hides
  // "Move to Done" from the accessible move menu for Backlog cards.
  const canDrop = (card: Task, toColumn: string) => !(card.status === 'backlog' && toColumn === 'done');

  return (
    <div className="sc-kanban-container">
      <KanbanBoard<Task>
        columns={COLUMNS}
        cards={tasks}
        cardId={(t) => t.id}
        cardColumn={(t) => t.status}
        cardSort={(a, b) => a.rank - b.rank}
        canDrop={canDrop}
        onCardMove={(args) => setTasks((prev) => applyMove(prev, args))}
        onCardClick={(t) => toast.info({ message: `Opened "${t.title}"`, duration: 2000 })}
        columnFooter={(column) => (
          <button type="button" className="sc-kanban-footer-button" onClick={() => setTasks((prev) => addTask(prev, column.id))}>
            + Add task
          </button>
        )}
        renderCard={(t) => (
          <div className="sc-kanban-card">
            <span className="sc-kanban-card__title">{t.title}</span>
            <div className="sc-kanban-card__meta">
              <Chip size="sm" variant="soft" tone={PRIORITY_TONE[t.priority]}>
                {t.priority}
              </Chip>
              <span className="sc-kanban-card__assignee">{t.assignee}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
}

const demo: DemoDef = {
  title: 'Kanban Board',
  description:
    'Generic controlled board: drag a card by pointer (mouse or touch) between columns and within a column — an insertion line shows where it will land. "Backlog" cards can\'t be dragged straight to "Done" (try it — the column dims and the drop is refused); they can still reach every other column. Each card also has a ⋮ menu with a keyboard-reachable "Move to <column>" fallback that respects the same rule. Fully controlled — onCardMove receives the new column and the card it should land above, and the demo reorders its own state.',
  controls: [],
  render: () => <Preview />,
  code: () => `import { KanbanBoard, type KanbanCardMoveArgs, type KanbanColumn } from '@dinesh-gamage/uikit/kanban';

const columns: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

const [tasks, setTasks] = useState<Task[]>(initialTasks);

function applyMove(tasks: Task[], { cardId, toColumn, beforeCardId }: KanbanCardMoveArgs) {
  // Move \`cardId\` into \`toColumn\`, positioned above \`beforeCardId\` (or at the end when null),
  // then re-derive \`rank\` for the affected column. See the demo source for a full example.
}

<KanbanBoard<Task>
  columns={columns}
  cards={tasks}
  cardId={(t) => t.id}
  cardColumn={(t) => t.status}
  cardSort={(a, b) => a.rank - b.rank}
  canDrop={(t, toColumn) => !(t.status === 'backlog' && toColumn === 'done')}
  onCardMove={(args) => setTasks((prev) => applyMove(prev, args))}
  onCardClick={(t) => openTask(t)}
  columnFooter={(column) => <button onClick={() => addTask(column.id)}>+ Add task</button>}
  renderCard={(t) => <TaskCard task={t} />}
/>`,
};

export default function KanbanBoardDemo() {
  return <DemoPage demo={demo} />;
}

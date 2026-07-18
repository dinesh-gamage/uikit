import { useCallback, useRef, useState } from 'react';
import {
  ListView,
  applyQuery,
  applySort,
  paginate,
  type ListFetcher,
  type ListViewHandle,
} from '../../src/list';
import type { InfoField } from '../../src/info-card';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';

interface Person {
  id: number;
  name: string;
  email: string;
  role: string;
  city: string;
  joined: string;
  active: boolean;
  [key: string]: unknown;
}

const FIRST = ['Ava', 'Liam', 'Maya', 'Noah', 'Zara', 'Ethan', 'Ishara', 'Kavya', 'Ruwan', 'Nadia', 'Omar', 'Elena', 'Marcus', 'Priya', 'Felix', 'Hana'];
const LAST = ['Perera', 'Fernando', 'Silva', 'Jayasuriya', 'Bandara', 'Khan', 'Patel', 'Novak', 'Reyes', 'Kim', 'Tanaka', 'Weber', 'Costa', 'Ali', 'Moreau', 'Berg'];
const ROLES = ['Engineer', 'Designer', 'Product Manager', 'QA Analyst', 'DevOps'];
const CITIES = ['Colombo', 'Kandy', 'Singapore', 'Berlin', 'Tokyo', 'Austin', 'London', 'Sydney'];

const PEOPLE: Person[] = Array.from({ length: 80 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7 + 3) % LAST.length];
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
    role: ROLES[(i * 3) % ROLES.length],
    city: CITIES[(i * 5) % CITIES.length],
    joined: new Date(2020 + (i % 5), (i * 7) % 12, ((i * 11) % 28) + 1).toISOString().slice(0, 10),
    active: i % 4 !== 0,
  };
});

const ACTIVE_COUNT = PEOPLE.filter((p) => p.active).length;

function personFields(p: Person): InfoField[] {
  return [
    { label: 'Email', value: p.email },
    { label: 'Role', value: p.role },
    { label: 'City', value: p.city },
    { label: 'Joined', value: p.joined, render: (d: string) => new Date(d).toLocaleDateString() },
    { label: 'Status', value: p.active ? 'Active' : 'Inactive' },
  ];
}

function Example({ v }: { v: ControlValues }) {
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<Person[]>([]);
  const listRef = useRef<ListViewHandle>(null);

  // Fake async API over the generated rows, with 500ms latency.
  const fetcher = useCallback<ListFetcher<Person>>(
    async ({ page, pageSize, query, sort }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      let rows = PEOPLE;
      if (v.tabs && tab !== 'all') rows = rows.filter((p) => p.active === (tab === 'active'));
      rows = applySort(applyQuery(rows, query, ['name', 'email', 'role', 'city']), sort);
      return paginate(rows, page, pageSize);
    },
    [tab, v.tabs]
  );

  return (
    <ListView<Person>
      key={String(v.searchable)}
      ref={listRef}
      data={fetcher}
      idField="id"
      pageSize={Number(v.pageSize)}
      paginationMode={v.paginationMode}
      columns={[
        { id: 'name', label: 'Name', sortable: true, width: '22%' },
        { id: 'email', label: 'Email', sortable: true },
        { id: 'role', label: 'Role', sortable: true, width: '18%' },
        { id: 'city', label: 'City', sortable: true, width: '14%' },
        { id: 'joined', label: 'Joined', sortable: true, width: '13%' },
      ]}
      title="Team"
      breadcrumb={[{ label: 'Home', onClick: () => {} }, { label: 'Team' }]}
      toolbar={
        <button type="button" onClick={() => listRef.current?.refresh()}>
          Refresh
        </button>
      }
      tabs={
        v.tabs
          ? [
              { id: 'all', label: 'All', count: PEOPLE.length },
              { id: 'active', label: 'Active', count: ACTIVE_COUNT },
              { id: 'inactive', label: 'Inactive', count: PEOPLE.length - ACTIVE_COUNT },
            ]
          : undefined
      }
      activeTab={v.tabs ? tab : undefined}
      onTabChange={setTab}
      search={
        v.searchable
          ? { enabled: true, placeholder: 'Search people…', fields: ['name', 'email', 'role', 'city'] }
          : undefined
      }
      selectable={v.selectable}
      selected={v.selectable ? selected : undefined}
      onSelect={setSelected}
      detailsPanel={
        v.detailsPanel
          ? { title: (p) => p.name, fields: personFields }
          : undefined
      }
    />
  );
}

const demo: DemoDef = {
  title: 'List',
  description:
    'Generic master list with async or static data: search, sorting, paged or infinite pagination, tabs, selection, and a slide-in details panel powered by InfoCard.',
  controls: [
    { type: 'select', name: 'paginationMode', options: ['paged', 'infinite'], defaultValue: 'paged' },
    { type: 'boolean', name: 'searchable', defaultValue: true },
    { type: 'boolean', name: 'selectable', defaultValue: false },
    { type: 'boolean', name: 'detailsPanel', defaultValue: true },
    { type: 'boolean', name: 'tabs', defaultValue: true },
    { type: 'select', name: 'pageSize', options: ['10', '20', '50'], defaultValue: '10' },
  ],
  render: (v) => <Example v={v} />,
  code: (v) => `import { ListView, type ListFetcher } from '@dinesh-gamage/uikit/list';
import type { InfoField } from '@dinesh-gamage/uikit/info-card';

interface Person { id: number; name: string; email: string; role: string; city: string; joined: string; active: boolean }

// Any function matching ListFetcher works — here backed by a REST endpoint.
const fetchPeople: ListFetcher<Person> = async ({ page, pageSize, query, sort }) => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), q: query });
  if (sort) params.set('sort', \`\${sort.field}:\${sort.dir}\`);
  const res = await fetch(\`/api/people?\${params}\`);
  if (!res.ok) throw new Error('Failed to load people');
  return res.json(); // -> { items: Person[], total: number }
};

<ListView<Person>
  data={fetchPeople}
  idField="id"
  pageSize={${Number(v.pageSize)}}${v.paginationMode === 'infinite' ? `\n  paginationMode="infinite"` : ''}
  columns={[
    { id: 'name', label: 'Name', sortable: true, width: '22%' },
    { id: 'email', label: 'Email', sortable: true },
    { id: 'role', label: 'Role', sortable: true },
    { id: 'city', label: 'City', sortable: true },
    { id: 'joined', label: 'Joined', sortable: true },
  ]}
  title="Team"
  breadcrumb={[{ label: 'Home', onClick: () => navigate('/') }, { label: 'Team' }]}
  toolbar={<button onClick={addPerson}>Add person</button>}${v.tabs ? `
  tabs={[
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
  ]}
  activeTab={tab}
  onTabChange={setTab}` : ''}${v.searchable ? `
  search={{ enabled: true, placeholder: 'Search people…', fields: ['name', 'email', 'role', 'city'] }}` : ''}${v.selectable ? `
  selectable
  selected={selected}
  onSelect={setSelected}` : ''}${v.detailsPanel ? `
  detailsPanel={{
    title: (p) => p.name,
    fields: (p): InfoField[] => [
      { label: 'Email', value: p.email },
      { label: 'Role', value: p.role },
      { label: 'City', value: p.city },
      { label: 'Joined', value: p.joined, render: (d) => new Date(d).toLocaleDateString() },
    ],
  }}` : ''}
/>`,
};

export default function ListDemo() {
  return <DemoPage demo={demo} />;
}

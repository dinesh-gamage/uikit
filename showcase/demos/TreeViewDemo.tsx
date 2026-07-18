import { useMemo, useState } from 'react';
import { collectDescendantIds, subtreeCheckState, TreeView, type TreeNode } from '../../src/tree-view';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';

const COMPONENTS_CHILDREN: TreeNode[] = [
  { id: 'button-tsx', label: 'Button.tsx' },
  { id: 'input-tsx', label: 'Input.tsx' },
  {
    id: 'modal-folder',
    label: 'Modal',
    children: [
      { id: 'modal-tsx', label: 'Modal.tsx' },
      { id: 'modal-scss', label: 'Modal.scss' },
    ],
  },
];

function buildTree(useAsync: boolean): TreeNode[] {
  return [
    {
      id: 'src',
      label: 'src',
      children: [
        {
          id: 'components',
          label: 'components',
          children: useAsync
            ? () => new Promise<TreeNode[]>((resolve) => setTimeout(() => resolve(COMPONENTS_CHILDREN), 800))
            : COMPONENTS_CHILDREN,
        },
        {
          id: 'utils',
          label: 'utils',
          children: [
            { id: 'helpers-ts', label: 'helpers.ts' },
            { id: 'format-ts', label: 'format.ts' },
          ],
        },
        { id: 'app-tsx', label: 'App.tsx' },
        { id: 'index-tsx', label: 'index.tsx' },
      ],
    },
    {
      id: 'public',
      label: 'public',
      children: [
        { id: 'index-html', label: 'index.html' },
        { id: 'favicon', label: 'favicon.ico' },
      ],
    },
    { id: 'package-json', label: 'package.json' },
    { id: 'tsconfig-json', label: 'tsconfig.json' },
    { id: 'readme', label: 'README.md', disabled: true },
  ];
}

function Preview({ v }: { v: ControlValues }) {
  const nodes = useMemo(() => buildTree(!!v.async), [v.async]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (id: string, node: TreeNode) => {
    if (!v.multiSelect) {
      setSelectedIds([id]);
      return;
    }
    setSelectedIds((prev) => {
      const set = new Set(prev);
      const wasChecked = subtreeCheckState(node, set) === 'checked';
      const ids = [id, ...collectDescendantIds(node)];
      if (wasChecked) ids.forEach((i) => set.delete(i));
      else ids.forEach((i) => set.add(i));
      return Array.from(set);
    });
  };

  return (
    <div>
      <TreeView
        nodes={nodes}
        selected={v.multiSelect ? selectedIds : (selectedIds[0] ?? null)}
        onSelect={handleSelect}
        multiSelect={!!v.multiSelect}
        showLines={!!v.showLines}
        loading={!!v.loading}
        defaultExpanded={['src']}
      />
      <p>Selected: <code>{selectedIds.length ? selectedIds.join(', ') : '(none)'}</code></p>
    </div>
  );
}

const demo: DemoDef = {
  title: 'Tree View',
  description:
    'Hierarchical tree with keyboard navigation, optional multi-select checkboxes with indeterminate parents, and lazily-loaded async branches.',
  controls: [
    { type: 'boolean', name: 'multiSelect', defaultValue: false },
    { type: 'boolean', name: 'showLines', defaultValue: true },
    { type: 'boolean', name: 'async', label: 'async children (components/ loads after 800ms)', defaultValue: false },
    { type: 'boolean', name: 'loading', defaultValue: false },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const props = [v.multiSelect ? 'multiSelect' : '', v.showLines ? 'showLines' : '', v.loading ? 'loading' : ''].filter(Boolean).join(' ');
    return `import { useState } from 'react';
import { TreeView, type TreeNode } from '@dinesh-gamage/uikit/tree-view';

const nodes: TreeNode[] = [
  { id: 'src', label: 'src', children: [
    { id: 'components', label: 'components', children: [...] },
  ] },
];
const [selected, setSelected] = useState<string | null>(null);

<TreeView${props ? ' ' + props : ''} nodes={nodes} selected={selected} onSelect={(id) => setSelected(id)} />`;
  },
};

export default function TreeViewDemo() {
  return <DemoPage demo={demo} />;
}

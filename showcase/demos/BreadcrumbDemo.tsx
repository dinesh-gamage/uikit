import { Breadcrumb, type BreadcrumbItem } from '../../src/breadcrumb';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './demo-widgets.scss';

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

const TRAIL = ['Home', 'Workspace', 'Projects', 'LifeGrid', 'Modules', 'Invoicing'];

function items(withIcons: boolean): BreadcrumbItem[] {
  return TRAIL.map((label, i) => ({
    label,
    icon: withIcons ? i === 0 ? <HomeIcon /> : <FolderIcon /> : undefined,
    onClick: () => {},
  }));
}

const demo: DemoDef = {
  title: 'Breadcrumb',
  description:
    'Navigation trail. Collapses the middle items into an ellipsis menu once the trail exceeds maxItems; the last item is always plain, non-interactive text.',
  controls: [
    { type: 'number', name: 'maxItems', defaultValue: 4, min: 2, max: 6 },
    { type: 'boolean', name: 'withIcons', label: 'with icons', defaultValue: false },
  ],
  render: (v) => <Breadcrumb items={items(!!v.withIcons)} maxItems={v.maxItems as number} />,
  code: (v) => {
    const props = v.maxItems !== 4 ? ` maxItems={${v.maxItems}}` : '';
    return `import { Breadcrumb } from '@dinesh-gamage/uikit/breadcrumb';

const items = [
${TRAIL.map((label) => `  { label: '${label}'${v.withIcons ? ', icon: <Icon />' : ''}, onClick: () => {} },`).join('\n')}
];

<Breadcrumb items={items}${props} />`;
  },
};

export default function BreadcrumbDemo() {
  return <DemoPage demo={demo} />;
}

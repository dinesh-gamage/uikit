import { useState } from 'react';
import { faGear, faHouse, faUser } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '../../src/icon';
import { Tabs, type TabDef, type TabsSize, type TabsVariant } from '../../src/tabs';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';

const FEW_TABS: Omit<TabDef, 'content'>[] = [
  { id: 'overview', label: 'Overview', icon: <Icon icon={faHouse} size={14} /> },
  { id: 'members', label: 'Members', count: 8 },
  { id: 'settings', label: 'Settings', icon: <Icon icon={faGear} size={14} /> },
  { id: 'billing', label: 'Billing', disabled: true },
];

const MANY_TABS: Omit<TabDef, 'content'>[] = Array.from({ length: 12 }, (_, i) => ({
  id: `tab-${i}`,
  label: `Section ${i + 1}`,
  count: i % 3 === 0 ? i + 1 : undefined,
}));

function Preview({ v }: { v: ControlValues }) {
  const base = v.manyTabs ? MANY_TABS : FEW_TABS;
  const tabs: TabDef[] = base.map((t) => ({
    ...t,
    icon: v.withIcons ? t.icon ?? <Icon icon={faUser} size={14} /> : undefined,
    count: v.withCounts ? t.count : undefined,
    content: <p>Content panel for “{typeof t.label === 'string' ? t.label : t.id}”.</p>,
  }));
  const [active, setActive] = useState(tabs[0].id);

  return <Tabs tabs={tabs} active={active} onChange={setActive} variant={v.variant as TabsVariant} size={v.size as TabsSize} keepMounted={v.keepMounted} />;
}

const demo: DemoDef = {
  title: 'Tabs',
  description:
    'Controlled tab list with underline or pill styling, icon/count badges, and automatic overflow into a "More" menu when the header runs out of room.',
  controls: [
    { type: 'select', name: 'variant', options: ['underline', 'pills'], defaultValue: 'underline' },
    { type: 'select', name: 'size', options: ['sm', 'md'], defaultValue: 'md' },
    { type: 'boolean', name: 'keepMounted', defaultValue: false },
    { type: 'boolean', name: 'withIcons', defaultValue: false },
    { type: 'boolean', name: 'withCounts', defaultValue: true },
    { type: 'boolean', name: 'manyTabs', label: 'many tabs (overflow demo)', defaultValue: false },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const props = [v.variant !== 'underline' ? `variant="${v.variant}"` : '', v.size !== 'md' ? `size="${v.size}"` : '', v.keepMounted ? 'keepMounted' : '']
      .filter(Boolean)
      .join(' ');
    return `import { useState } from 'react';
import { Tabs } from '@dinesh-gamage/uikit/tabs';

const tabs = [
  { id: 'overview', label: 'Overview', content: <Overview /> },
  { id: 'members', label: 'Members', count: 8, content: <Members /> },
  { id: 'settings', label: 'Settings', content: <Settings /> },
];
const [active, setActive] = useState('overview');

<Tabs${props ? ' ' + props : ''} tabs={tabs} active={active} onChange={setActive} />`;
  },
};

export default function TabsDemo() {
  return <DemoPage demo={demo} />;
}

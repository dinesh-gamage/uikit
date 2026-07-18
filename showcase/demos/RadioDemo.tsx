import { useState } from 'react';
import { RadioGroup } from '../../src/radio';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import type { SelectOption } from '../../src/types';

const OPTIONS: SelectOption[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

function Preview({ v }: { v: ControlValues }) {
  const [value, setValue] = useState<string | number | null>('starter');
  return (
    <RadioGroup
      label="Plan"
      options={OPTIONS}
      direction={v.direction as 'horizontal' | 'vertical'}
      disabled={v.disabled}
      value={value}
      onChange={(next) => setValue(next)}
    />
  );
}

const demo: DemoDef = {
  title: 'Radio Group',
  description:
    'Native radio inputs with a styled dot. Arrow-key navigation between options works out of the box; supports custom option rendering.',
  controls: [
    { type: 'select', name: 'direction', options: ['vertical', 'horizontal'], defaultValue: 'vertical' },
    { type: 'boolean', name: 'disabled', defaultValue: false },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const props = [
      v.direction !== 'vertical' ? `direction="${v.direction}"` : '',
      v.disabled ? 'disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `import { useState } from 'react';
import { RadioGroup } from '@dinesh-gamage/uikit/radio';

const options = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];
const [value, setValue] = useState('starter');

<RadioGroup label="Plan"${props ? ' ' + props : ''} options={options} value={value} onChange={(v) => setValue(v)} />`;
  },
};

export default function RadioDemo() {
  return <DemoPage demo={demo} />;
}

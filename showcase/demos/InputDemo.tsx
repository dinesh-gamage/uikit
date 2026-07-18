import { useState } from 'react';
import { Input, type InputType } from '../../src/input';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import type { Size } from '../../src/types';

function Preview({ v }: { v: ControlValues }) {
  const [value, setValue] = useState('');
  return (
    <Input
      type={v.type as InputType}
      size={v.size as Size}
      label={v.label || undefined}
      placeholder={v.placeholder || undefined}
      prefix={v.prefix || undefined}
      suffix={v.suffix || undefined}
      clearable={v.clearable}
      disabled={v.disabled}
      error={v.error || undefined}
      value={value}
      onChange={setValue}
    />
  );
}

const demo: DemoDef = {
  title: 'Input',
  description:
    'Controlled text input with prefix/suffix slots, clear button, password visibility toggle, and full Field integration (label, hint, error).',
  controls: [
    { type: 'select', name: 'type', options: ['text', 'password', 'email', 'number'], defaultValue: 'text' },
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
    { type: 'text', name: 'label', defaultValue: 'Full name' },
    { type: 'text', name: 'placeholder', defaultValue: 'Type something…' },
    { type: 'text', name: 'prefix', label: 'prefix text', defaultValue: '' },
    { type: 'text', name: 'suffix', label: 'suffix text', defaultValue: '' },
    { type: 'boolean', name: 'clearable', defaultValue: true },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'text', name: 'error', label: 'error text', defaultValue: '' },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const props = [
      v.type !== 'text' ? `type="${v.type}"` : '',
      v.size !== 'md' ? `size="${v.size}"` : '',
      v.label ? `label="${v.label}"` : '',
      v.placeholder ? `placeholder="${v.placeholder}"` : '',
      v.prefix ? `prefix="${v.prefix}"` : '',
      v.suffix ? `suffix="${v.suffix}"` : '',
      !v.clearable ? 'clearable={false}' : '',
      v.disabled ? 'disabled' : '',
      v.error ? `error="${v.error}"` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `import { useState } from 'react';
import { Input } from '@dinesh-gamage/uikit/input';

const [value, setValue] = useState('');

<Input${props ? ' ' + props : ''} value={value} onChange={setValue} />`;
  },
};

export default function InputDemo() {
  return <DemoPage demo={demo} />;
}

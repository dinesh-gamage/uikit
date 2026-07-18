import { useState } from 'react';
import { Checkbox, type CheckboxMode } from '../../src/checkbox';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import type { Size } from '../../src/types';

function Preview({ v }: { v: ControlValues }) {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>(false);
  return (
    <div>
      <Checkbox
        mode={v.mode as CheckboxMode}
        size={v.size as Size}
        label={v.label || undefined}
        disabled={v.disabled}
        checked={checked}
        onChange={setChecked}
      />
      {v.mode === 'checkbox' && (
        <p>
          <button type="button" onClick={() => setChecked('indeterminate')}>
            Set indeterminate
          </button>
        </p>
      )}
    </div>
  );
}

const demo: DemoDef = {
  title: 'Checkbox / Switch',
  description:
    'Controlled checkbox backed by a native input, with an indeterminate state and a switch mode. The label is clickable and Space toggles.',
  controls: [
    { type: 'select', name: 'mode', options: ['checkbox', 'switch'], defaultValue: 'checkbox' },
    { type: 'text', name: 'label', defaultValue: 'Enable notifications' },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const props = [
      v.mode !== 'checkbox' ? `mode="${v.mode}"` : '',
      v.label ? `label="${v.label}"` : '',
      v.disabled ? 'disabled' : '',
      v.size !== 'md' ? `size="${v.size}"` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `import { useState } from 'react';
import { Checkbox } from '@dinesh-gamage/uikit/checkbox';

const [checked, setChecked] = useState(false);

<Checkbox${props ? ' ' + props : ''} checked={checked} onChange={setChecked} />`;
  },
};

export default function CheckboxDemo() {
  return <DemoPage demo={demo} />;
}

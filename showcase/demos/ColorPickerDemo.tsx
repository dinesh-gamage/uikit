import { useState } from 'react';
import { ColorPicker } from '../../src/color-picker';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import type { Size } from '../../src/types';

function Preview({ v }: { v: ControlValues }) {
  const [value, setValue] = useState('#4f6df5');
  return (
    <div>
      <ColorPicker
        value={value}
        onChange={setValue}
        format={v.format}
        showAlpha={v.showAlpha}
        disabled={v.disabled}
        clearable={v.clearable}
        label={v.label || undefined}
        size={v.size as Size}
      />
      <p>
        Value: <code>{value || '(empty)'}</code>
      </p>
    </div>
  );
}

const demo: DemoDef = {
  title: 'Color Picker',
  description: 'Hex/rgba color input with a saturation-value square, hue and alpha sliders, presets, and a text field for direct entry.',
  controls: [
    { type: 'select', name: 'format', options: ['hex', 'rgba'], defaultValue: 'hex' },
    { type: 'boolean', name: 'showAlpha', defaultValue: false },
    { type: 'boolean', name: 'clearable', defaultValue: true },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'text', name: 'label', defaultValue: 'Accent color' },
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const props = [
      v.format !== 'hex' ? `format="${v.format}"` : '',
      v.showAlpha ? 'showAlpha' : '',
      !v.clearable ? 'clearable={false}' : '',
      v.disabled ? 'disabled' : '',
      v.label ? `label="${v.label}"` : '',
      v.size !== 'md' ? `size="${v.size}"` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `import { useState } from 'react';
import { ColorPicker } from '@dinesh-gamage/uikit/color-picker';

const [value, setValue] = useState('#4f6df5');

<ColorPicker${props ? ' ' + props : ''} value={value} onChange={setValue} />`;
  },
};

export default function ColorPickerDemo() {
  return <DemoPage demo={demo} />;
}

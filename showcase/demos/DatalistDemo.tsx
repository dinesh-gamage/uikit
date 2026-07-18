import { useState } from 'react';
import { DatalistInput } from '../../src/datalist';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';

const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Elixir', 'Kotlin', 'Swift'];

function Preview({ v }: { v: ControlValues }) {
  const [value, setValue] = useState('');
  return (
    <DatalistInput
      label={v.label || undefined}
      placeholder={v.placeholder || undefined}
      options={LANGUAGES}
      value={value}
      onChange={setValue}
    />
  );
}

const demo: DemoDef = {
  title: 'Datalist Input',
  description:
    'A text input paired with a native datalist for lightweight, browser-provided autocomplete suggestions.',
  controls: [
    { type: 'text', name: 'label', defaultValue: 'Favorite language' },
    { type: 'text', name: 'placeholder', defaultValue: 'Start typing…' },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const props = [
      v.label ? `label="${v.label}"` : '',
      v.placeholder ? `placeholder="${v.placeholder}"` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `import { useState } from 'react';
import { DatalistInput } from '@dinesh-gamage/uikit/datalist';

const options = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'];
const [value, setValue] = useState('');

<DatalistInput${props ? ' ' + props : ''} options={options} value={value} onChange={setValue} />`;
  },
};

export default function DatalistDemo() {
  return <DemoPage demo={demo} />;
}

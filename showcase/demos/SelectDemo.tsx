import { useState } from 'react';
import { Select } from '../../src/select';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import { COUNTRIES, searchCountries } from './select-demo-data';

function Preview({ v }: { v: ControlValues }) {
  const [value, setValue] = useState<string | number | null>(null);
  return (
    <Select
      options={v.async ? searchCountries : COUNTRIES}
      value={value}
      onChange={(next) => setValue(next)}
      label={v.label || undefined}
      placeholder={v.placeholder || undefined}
      searchable={v.searchable}
      clearable={v.clearable}
      pill={v.pill}
      disabled={v.disabled}
      size={v.size}
      error={v.error || undefined}
    />
  );
}

const demo: DemoDef = {
  title: 'Select',
  description:
    'Single-value combobox with static or async options, debounced search, keyboard navigation, and a clearable trigger. Async sources resolve the selected label automatically.',
  controls: [
    { type: 'boolean', name: 'async', defaultValue: false },
    { type: 'boolean', name: 'searchable', defaultValue: true },
    { type: 'boolean', name: 'clearable', defaultValue: true },
    { type: 'boolean', name: 'pill', defaultValue: false },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
    { type: 'text', name: 'label', defaultValue: 'Country' },
    { type: 'text', name: 'placeholder', defaultValue: 'Pick a country…' },
    { type: 'text', name: 'error', defaultValue: '' },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const attrs: string[] = [];
    if (v.label) attrs.push(`label="${v.label}"`);
    if (v.placeholder) attrs.push(`placeholder="${v.placeholder}"`);
    if (!v.searchable) attrs.push('searchable={false}');
    if (!v.clearable) attrs.push('clearable={false}');
    if (v.pill) attrs.push('pill');
    if (v.disabled) attrs.push('disabled');
    if (v.size !== 'md') attrs.push(`size="${v.size}"`);
    if (v.error) attrs.push(`error="${v.error}"`);
    const source = v.async
      ? `
// Async source: resolve options for the current search query (debounced 300ms)
const searchCountries = (query: string): Promise<SelectOption[]> =>
  fetch('/api/countries?q=' + encodeURIComponent(query)).then((r) => r.json());
`
      : `
const countries: SelectOption[] = [
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'lk', label: 'Sri Lanka' },
  // ...
];
`;
    return `import { useState } from 'react';
import { Select } from '@dinesh-gamage/uikit/select';
import type { SelectOption } from '@dinesh-gamage/uikit';
${source}
const [country, setCountry] = useState<string | number | null>(null);

<Select
  options={${v.async ? 'searchCountries' : 'countries'}}
  value={country}
  onChange={(value) => setCountry(value)}${attrs.map((a) => `\n  ${a}`).join('')}
/>`;
  },
};

export default function SelectDemo() {
  return <DemoPage demo={demo} />;
}

import { useState } from 'react';
import { MultiSelect } from '../../src/select';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import { COUNTRIES, searchCountries } from './select-demo-data';

function Preview({ v }: { v: ControlValues }) {
  const [values, setValues] = useState<(string | number)[]>(['fr', 'jp']);
  const maxPills = typeof v.maxPillsVisible === 'number' && v.maxPillsVisible > 0 ? v.maxPillsVisible : undefined;
  return (
    <MultiSelect
      options={v.async ? searchCountries : COUNTRIES}
      value={values}
      onChange={(next) => setValues(next)}
      label={v.label || undefined}
      selectAll={v.selectAll}
      maxPillsVisible={maxPills}
      searchable={v.searchable}
      disabled={v.disabled}
    />
  );
}

const demo: DemoDef = {
  title: 'MultiSelect',
  description:
    'Multi-value combobox with removable pills, checkbox option rows, an optional Select All row with indeterminate state, and Clear / Done footer actions. Supports static or async option sources.',
  controls: [
    { type: 'boolean', name: 'async', defaultValue: false },
    { type: 'boolean', name: 'selectAll', defaultValue: true },
    { type: 'number', name: 'maxPillsVisible', defaultValue: 3, min: 0, max: 10 },
    { type: 'boolean', name: 'searchable', defaultValue: true },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'text', name: 'label', defaultValue: 'Countries' },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const attrs: string[] = [];
    if (v.label) attrs.push(`label="${v.label}"`);
    if (v.selectAll) attrs.push('selectAll');
    if (typeof v.maxPillsVisible === 'number' && v.maxPillsVisible > 0) attrs.push(`maxPillsVisible={${v.maxPillsVisible}}`);
    if (!v.searchable) attrs.push('searchable={false}');
    if (v.disabled) attrs.push('disabled');
    const source = v.async
      ? `
// Async source: resolve options for the current search query (debounced 300ms)
const searchCountries = (query: string): Promise<SelectOption[]> =>
  fetch('/api/countries?q=' + encodeURIComponent(query)).then((r) => r.json());
`
      : `
const countryOptions: SelectOption[] = [
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'lk', label: 'Sri Lanka' },
  // ...
];
`;
    return `import { useState } from 'react';
import { MultiSelect } from '@dinesh-gamage/uikit/select';
import type { SelectOption } from '@dinesh-gamage/uikit';
${source}
const [countries, setCountries] = useState<(string | number)[]>([]);

<MultiSelect
  options={${v.async ? 'searchCountries' : 'countryOptions'}}
  value={countries}
  onChange={(values) => setCountries(values)}${attrs.map((a) => `\n  ${a}`).join('')}
/>`;
  },
};

export default function MultiSelectDemo() {
  return <DemoPage demo={demo} />;
}

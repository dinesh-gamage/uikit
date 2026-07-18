import { useState } from 'react';
import { DateRangePicker, type DateRangePickerProps } from '../../src/datetime';
import { DemoPage, type DemoDef } from '../framework/DemoPage';

function StatefulDateRangePicker(props: Omit<DateRangePickerProps, 'start' | 'end' | 'onChange'>) {
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);
  return (
    <DateRangePicker start={range[0]} end={range[1]} onChange={(s, e) => setRange([s, e])} {...props} />
  );
}

const demo: DemoDef = {
  title: 'Date Range',
  description:
    'Click a start day, then an end day — the in-between days highlight as you hover, and a backwards pick auto-swaps. The preset rail applies common ranges (Today, Last 7 days, …) in one click.',
  controls: [
    { type: 'boolean', name: 'presets', defaultValue: true },
    { type: 'boolean', name: 'compactPill', defaultValue: false },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'text', name: 'label', defaultValue: 'Reporting period' },
  ],
  render: (v) => (
    <StatefulDateRangePicker
      presets={v.presets ? undefined : []}
      compactPill={v.compactPill}
      disabled={v.disabled}
      label={v.label || undefined}
    />
  ),
  code: (v) => `import { DateRangePicker } from '@dinesh-gamage/uikit/datetime';

const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);

<DateRangePicker
  start={range[0]}
  end={range[1]}
  onChange={(start, end) => setRange([start, end])}${v.label ? `\n  label="${v.label}"` : ''}${!v.presets ? '\n  presets={[]}' : ''}${v.compactPill ? '\n  compactPill' : ''}${v.disabled ? '\n  disabled' : ''}
/>`,
};

export default function DateRangeDemo() {
  return <DemoPage demo={demo} />;
}

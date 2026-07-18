import { useState } from 'react';
import { TimeRangePicker, type TimeRangePickerProps } from '../../src/datetime';
import { DemoPage, type DemoDef } from '../framework/DemoPage';

function StatefulTimeRangePicker(props: Omit<TimeRangePickerProps, 'start' | 'end' | 'onChange'>) {
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  return (
    <TimeRangePicker start={range[0]} end={range[1]} onChange={(s, e) => setRange([s, e])} {...props} />
  );
}

const demo: DemoDef = {
  title: 'Time Range',
  description:
    'From/To time editors ("HH:mm" strings) in a dropdown with a Done button. A backwards range auto-swaps on Done. The step control sets the minute stepper increment.',
  controls: [
    { type: 'number', name: 'step', defaultValue: 15, min: 1, max: 60 },
    { type: 'text', name: 'label', defaultValue: 'Working hours' },
    { type: 'boolean', name: 'disabled', defaultValue: false },
  ],
  render: (v) => (
    <StatefulTimeRangePicker step={v.step} label={v.label || undefined} disabled={v.disabled} />
  ),
  code: (v) => `import { TimeRangePicker } from '@dinesh-gamage/uikit/datetime';

const [range, setRange] = useState<[string | null, string | null]>([null, null]);

<TimeRangePicker
  start={range[0]}
  end={range[1]}
  onChange={(start, end) => setRange([start, end])}${v.label ? `\n  label="${v.label}"` : ''}${v.step !== 15 ? `\n  step={${v.step}}` : ''}${v.disabled ? '\n  disabled' : ''}
/>`,
};

export default function TimeRangeDemo() {
  return <DemoPage demo={demo} />;
}

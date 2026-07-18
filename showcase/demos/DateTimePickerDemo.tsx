import { useState } from 'react';
import { DateTimePicker, type DateTimePickerProps } from '../../src/datetime';
import { DemoPage, type DemoDef } from '../framework/DemoPage';

function StatefulDateTimePicker(props: Omit<DateTimePickerProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState<Date | null>(null);
  return <DateTimePicker value={value} onChange={setValue} {...props} />;
}

const demo: DemoDef = {
  title: 'DateTime Picker',
  description:
    'Calendar plus a compact 24h time editor in one dropdown. Pick a day, adjust hours/minutes, then hit Done. The trigger shows the value as yyyy-MM-dd HH:mm.',
  controls: [
    { type: 'text', name: 'label', defaultValue: 'Due at' },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'boolean', name: 'clearable', defaultValue: true },
  ],
  render: (v) => (
    <StatefulDateTimePicker label={v.label || undefined} disabled={v.disabled} clearable={v.clearable} />
  ),
  code: (v) => `import { DateTimePicker } from '@dinesh-gamage/uikit/datetime';

const [value, setValue] = useState<Date | null>(null);

<DateTimePicker
  value={value}
  onChange={setValue}${v.label ? `\n  label="${v.label}"` : ''}${v.disabled ? '\n  disabled' : ''}${!v.clearable ? '\n  clearable={false}' : ''}
/>`,
};

export default function DateTimePickerDemo() {
  return <DemoPage demo={demo} />;
}

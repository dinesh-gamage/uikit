import { useState } from 'react';
import { DatePicker, type DatePickerProps } from '../../src/datetime';
import { DemoPage, type DemoDef } from '../framework/DemoPage';

function StatefulDatePicker(props: Omit<DatePickerProps, 'value' | 'onChange'>) {
  const [value, setValue] = useState<Date | null>(null);
  return <DatePicker value={value} onChange={setValue} {...props} />;
}

const demo: DemoDef = {
  title: 'Date Picker',
  description:
    'Controlled date input with a calendar dropdown. Type a date directly (validated on blur/Enter) or pick from the grid. Arrow keys move the focused day, PageUp/PageDown change month, Enter selects, Escape closes.',
  controls: [
    { type: 'text', name: 'label', defaultValue: 'Start date' },
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'boolean', name: 'clearable', defaultValue: true },
    { type: 'boolean', name: 'typedInput', defaultValue: true },
    { type: 'boolean', name: 'minToday', label: 'min = today', defaultValue: false },
    { type: 'text', name: 'error', defaultValue: '' },
  ],
  render: (v) => (
    <StatefulDatePicker
      label={v.label || undefined}
      size={v.size}
      disabled={v.disabled}
      clearable={v.clearable}
      typedInput={v.typedInput}
      min={v.minToday ? new Date() : undefined}
      error={v.error || undefined}
    />
  ),
  code: (v) => `import { DatePicker } from '@dinesh-gamage/uikit/datetime';

const [value, setValue] = useState<Date | null>(null);

<DatePicker
  value={value}
  onChange={setValue}${v.label ? `\n  label="${v.label}"` : ''}${v.size !== 'md' ? `\n  size="${v.size}"` : ''}${v.disabled ? '\n  disabled' : ''}${!v.clearable ? '\n  clearable={false}' : ''}${!v.typedInput ? '\n  typedInput={false}' : ''}${v.minToday ? '\n  min={new Date()}' : ''}${v.error ? `\n  error="${v.error}"` : ''}
/>`,
};

export default function DatePickerDemo() {
  return <DemoPage demo={demo} />;
}

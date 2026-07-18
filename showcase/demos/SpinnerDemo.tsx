import { Spinner } from '../../src/spinner';
import type { Size } from '../../src/types';
import { DemoPage, type DemoDef } from '../framework/DemoPage';

const demo: DemoDef = {
  title: 'Spinner',
  description: 'Loading indicator with an optional label. Use block to center it in its container.',
  controls: [
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
    { type: 'text', name: 'label', defaultValue: 'Loading…' },
    { type: 'boolean', name: 'block', defaultValue: false },
  ],
  render: (v) => (
    <Spinner size={v.size as Size} label={(v.label as string) || undefined} block={!!v.block} />
  ),
  code: (v) => {
    const props = [
      v.size !== 'md' ? ` size="${v.size}"` : '',
      v.label ? ` label="${v.label}"` : '',
      v.block ? ' block' : '',
    ].join('');
    return `import { Spinner } from '@dinesh-gamage/uikit/spinner';

<Spinner${props} />`;
  },
};

export default function SpinnerDemo() {
  return <DemoPage demo={demo} />;
}

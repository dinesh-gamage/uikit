import { Skeleton } from '../../src/skeleton';
import { DemoPage, type DemoDef } from '../framework/DemoPage';

/** '240' -> 240 (px), '80%' -> '80%', '' -> undefined */
function dimension(value: string): number | string | undefined {
  if (!value) return undefined;
  return /^\d+$/.test(value) ? Number(value) : value;
}

const demo: DemoDef = {
  title: 'Skeleton',
  description:
    'Loading placeholder. Text, rect and circle variants; count stacks multiple copies vertically.',
  controls: [
    { type: 'select', name: 'variant', options: ['text', 'rect', 'circle'], defaultValue: 'text' },
    { type: 'text', name: 'width', label: 'width (px or css)', defaultValue: '240' },
    { type: 'text', name: 'height', label: 'height (px or css)', defaultValue: '' },
    { type: 'number', name: 'count', defaultValue: 3, min: 1, max: 10 },
  ],
  render: (v) => (
    <Skeleton
      variant={v.variant as 'text' | 'rect' | 'circle'}
      width={dimension(v.width as string)}
      height={dimension(v.height as string)}
      count={v.count as number}
    />
  ),
  code: (v) => {
    const dim = (name: string, value: string) => {
      const d = dimension(value);
      if (d === undefined) return '';
      return typeof d === 'number' ? ` ${name}={${d}}` : ` ${name}="${d}"`;
    };
    const props = [
      v.variant !== 'text' ? ` variant="${v.variant}"` : '',
      dim('width', v.width as string),
      dim('height', v.height as string),
      v.count !== 1 ? ` count={${v.count}}` : '',
    ].join('');
    return `import { Skeleton } from '@dinesh-gamage/uikit/skeleton';

<Skeleton${props} />`;
  },
};

export default function SkeletonDemo() {
  return <DemoPage demo={demo} />;
}

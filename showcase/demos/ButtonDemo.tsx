import { Button, type ButtonVariant } from '../../src/button';
import type { Size } from '../../src/types';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './demo-widgets.scss';

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </svg>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const demo: DemoDef = {
  title: 'Button',
  description:
    'Standard action button. Five variants, three sizes, icon slots that accept any ReactNode, and an automatic loading state when onClick returns a promise.',
  controls: [
    { type: 'select', name: 'variant', options: ['primary', 'secondary', 'danger', 'ghost', 'link'], defaultValue: 'primary' },
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
    { type: 'text', name: 'label', defaultValue: 'Continue' },
    { type: 'boolean', name: 'loading', defaultValue: false },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'boolean', name: 'iconOnly', label: 'icon only', defaultValue: false },
    { type: 'boolean', name: 'fullWidth', label: 'full width', defaultValue: false },
  ],
  render: (v) => (
    <div className="sc-demo-widgets__stack">
      <div className="sc-demo-widgets__buttons">
        <Button
          variant={v.variant as ButtonVariant}
          size={v.size as Size}
          loading={!!v.loading}
          disabled={!!v.disabled}
          iconOnly={!!v.iconOnly}
          fullWidth={!!v.fullWidth}
          title={v.iconOnly ? (v.label as string) : undefined}
          leftIcon={<RocketIcon />}
        >
          {v.iconOnly ? undefined : (v.label as string)}
        </Button>
      </div>
      <div className="sc-demo-widgets__buttons">
        <Button variant="primary" leftIcon={<RocketIcon />}>
          Launch
        </Button>
        <Button variant="secondary" rightIcon="→">
          Next
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Learn more</Button>
        <Button variant="primary" loadingLabel="Saving…" onClick={() => delay(1000)}>
          Save (async)
        </Button>
      </div>
    </div>
  ),
  code: (v) => {
    const props = [
      v.variant !== 'primary' ? ` variant="${v.variant}"` : '',
      v.size !== 'md' ? ` size="${v.size}"` : '',
      v.loading ? ' loading' : '',
      v.disabled ? ' disabled' : '',
      v.iconOnly ? ` iconOnly title="${v.label}"` : '',
      v.fullWidth ? ' fullWidth' : '',
    ].join('');
    return `import { Button } from '@dinesh-gamage/uikit/button';

<Button${props} leftIcon={<RocketIcon />}>${v.iconOnly ? '' : (v.label as string)}</Button>`;
  },
};

export default function ButtonDemo() {
  return <DemoPage demo={demo} />;
}

import { useState } from 'react';
import { Chip } from '../../src/chip';
import type { Tone } from '../../src/types';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import './demo-widgets.scss';

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M12 2l2.9 6.26 6.9.8-5.13 4.7 1.45 6.8L12 17.9l-6.12 2.66 1.45-6.8-5.13-4.7 6.9-.8z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function Stage({ v }: { v: ControlValues }) {
  const [removed, setRemoved] = useState(false);
  const [clicks, setClicks] = useState(0);

  if (removed) {
    return (
      <button className="sc-demo-widgets__button" onClick={() => setRemoved(false)}>
        Show again
      </button>
    );
  }

  return (
    <div className="sc-demo-widgets__stack">
      <div className="sc-demo-widgets__buttons">
        <Chip
          tone={v.tone as Tone}
          variant={v.variant as 'soft' | 'outline'}
          size={v.size as 'sm' | 'md'}
          onClick={v.clickable ? () => setClicks((c) => c + 1) : undefined}
          onRemove={v.removable ? () => setRemoved(true) : undefined}
        >
          {v.label as string}
        </Chip>
      </div>
      {!!v.clickable && <span className="sc-demo-widgets__result">clicked {clicks}×</span>}
      <div className="sc-demo-widgets__buttons">
        <Chip tone="primary" leftIcon={<StarIcon />}>
          Featured
        </Chip>
        <Chip tone="success" variant="outline" leftIcon={<CheckIcon />}>
          Verified
        </Chip>
        <Chip tone="warning" rightIcon="!">
          Attention
        </Chip>
        <Chip tone="info" leftIcon={<StarIcon />} rightIcon={<CheckIcon />}>
          Both icons
        </Chip>
        <Chip tone="danger" leftIcon={<StarIcon />} />
      </div>
    </div>
  );
}

const demo: DemoDef = {
  title: 'Chip',
  description:
    'Compact tag/filter element. Soft tone-tinted or outline variants, optional leading/trailing icons, clickable and removable states. Omit the label alongside an icon for a circular icon-only chip.',
  controls: [
    { type: 'select', name: 'tone', options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'], defaultValue: 'primary' },
    { type: 'select', name: 'variant', options: ['soft', 'outline'], defaultValue: 'soft' },
    { type: 'select', name: 'size', options: ['sm', 'md'], defaultValue: 'md' },
    { type: 'text', name: 'label', defaultValue: 'Engineering' },
    { type: 'boolean', name: 'clickable', defaultValue: false },
    { type: 'boolean', name: 'removable', defaultValue: true },
  ],
  render: (v) => <Stage key={JSON.stringify(v)} v={v} />,
  code: (v) => {
    const props = [
      v.tone !== 'neutral' ? ` tone="${v.tone}"` : '',
      v.variant !== 'soft' ? ` variant="${v.variant}"` : '',
      v.size !== 'md' ? ` size="${v.size}"` : '',
      v.clickable ? ' onClick={() => {}}' : '',
      v.removable ? ' onRemove={() => {}}' : '',
    ].join('');
    return `import { Chip } from '@dinesh-gamage/uikit/chip';

<Chip${props}>${v.label as string}</Chip>`;
  },
};

export default function ChipDemo() {
  return <DemoPage demo={demo} />;
}

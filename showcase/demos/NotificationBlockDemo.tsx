import { useState } from 'react';
import { NotificationBlock } from '../../src/notification-block';
import type { Tone } from '../../src/types';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import './demo-widgets.scss';

const CONTENT = 'Your trial ends in 5 days. Upgrade to keep access to premium features.';

function Stage({ v }: { v: ControlValues }) {
  const [visible, setVisible] = useState(true);
  if (!visible) {
    return (
      <button className="sc-demo-widgets__button" onClick={() => setVisible(true)}>
        Show again
      </button>
    );
  }
  return (
    <div className="sc-demo-widgets__stack">
      <NotificationBlock
        tone={v.tone as Tone}
        variant={v.variant as 'filled' | 'bordered'}
        compact={!!v.compact}
        title={(v.title as string) || undefined}
        onClose={v.closable ? () => setVisible(false) : undefined}
      >
        {CONTENT}
      </NotificationBlock>
    </div>
  );
}

const demo: DemoDef = {
  title: 'Notification Block',
  description:
    'Inline banner/callout for contextual messages. Soft tone-tinted background, optional left border, title, custom icon and close button.',
  controls: [
    {
      type: 'select',
      name: 'tone',
      options: ['info', 'success', 'warning', 'danger', 'primary', 'neutral'],
      defaultValue: 'info',
    },
    { type: 'select', name: 'variant', options: ['filled', 'bordered'], defaultValue: 'filled' },
    { type: 'boolean', name: 'compact', defaultValue: false },
    { type: 'text', name: 'title', defaultValue: 'Heads up' },
    { type: 'boolean', name: 'closable', defaultValue: false },
  ],
  render: (v) => <Stage key={JSON.stringify(v)} v={v} />,
  code: (v) => {
    const props = [
      v.tone !== 'info' ? ` tone="${v.tone}"` : '',
      v.variant !== 'filled' ? ` variant="${v.variant}"` : '',
      v.compact ? ' compact' : '',
      v.title ? ` title="${v.title}"` : '',
      v.closable ? ' onClose={() => setVisible(false)}' : '',
    ].join('');
    return `import { NotificationBlock } from '@dinesh-gamage/uikit/notification-block';

<NotificationBlock${props}>
  ${CONTENT}
</NotificationBlock>`;
  },
};

export default function NotificationBlockDemo() {
  return <DemoPage demo={demo} />;
}
